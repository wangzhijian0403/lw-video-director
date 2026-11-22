"""
build-vo-plan.py — 用母版口播的真实停顿，把 approved-script 拆成「句级字幕 + 段落时间轴」

原则：
- 文案只从 approved-script.json 取，逐字不改；
- 时间不靠估算：先算 20ms RMS 包络的静音段（speech runs），再把字权重铺到 speech runs 上，
  每句的起止一定落在 speech run 内或跨过真实停顿，不会出现「字幕跑到没人声的地方」；
- 字幕按「两条一行、一行最多 12 字」切，英文单词不拦腰断；太短的字幕与相邻句合并，保证停留。

这不是逐词强对齐，是「静音切段 + 字数比例」的句级对齐，误差上限约一个停顿。
"""
import argparse
import json
import re
import wave

import numpy as np

SR = 48000
LINE_MAX = 12
CUE_MIN_CHARS = 8    # 少于这个字数就尝试与前/后合并
CUE_MAX_DUR = 4.6    # 单条字幕最长停留
CUE_MIN_DUR = 1.15   # 单条字幕最短停留

PUNCT = '。！？；：，、'


def read_wav(path):
    with wave.open(path, 'rb') as w:
        raw = w.readframes(w.getnframes())
        ch, sr = w.getnchannels(), w.getframerate()
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    if sr != SR:
        idx = np.clip((np.arange(int(len(x) / sr * SR)) * sr / SR).astype(np.int64), 0, len(x) - 1)
        x = x[idx]
    return x


def speech_runs(x, thresh_db=-34.0, min_sil=0.12, min_run=0.08):
    win = int(SR * 0.02)
    n = len(x) // win
    rms = np.sqrt((x[: n * win].reshape(n, win) ** 2).mean(axis=1) + 1e-12)
    env = np.clip(20 * np.log10(rms), -90, 0)
    sil = env < thresh_db
    for i in range(1, len(sil) - 1):
        if sil[i] and not sil[i - 1] and not sil[i + 1]:
            sil[i] = False
    runs, start = [], None
    for i, s in enumerate(sil):
        if s and start is None:
            start = i
        elif not s and start is not None:
            if (i - start) * 0.02 >= min_sil:
                runs.append(('sil', start * 0.02, i * 0.02))
            start = None
    if start is not None and (len(sil) - start) * 0.02 >= min_sil:
        runs.append(('sil', start * 0.02, len(sil) * 0.02))
    total = len(x) / SR
    speech, cur = [], 0.0
    for kind, a, b in runs:
        if kind == 'sil' and a > cur:
            speech.append([cur, a])
        if kind == 'sil':
            cur = max(cur, b)
    if cur < total:
        speech.append([cur, total])
    return [[a, b] for a, b in speech if b - a >= min_run], runs


def weight(s):
    w = 0
    for ch in s:
        if ch in PUNCT or ch == ' ':
            continue
        w += 1.7 if ch.isascii() else 1.0
    return w


def tokens(text):
    """按「英文/数字串」或「单字+后随标点」切 token，保证英文词不被拆开"""
    out = []
    for m in re.finditer(r'[A-Za-z0-9][A-Za-z0-9\.\+]*|.', text):
        out.append(m.group(0))
    # 标点并到前一个 token
    merged = []
    for t in out:
        if t in PUNCT and merged:
            merged[-1] += t
        else:
            merged.append(t)
    return merged


def clauses(text):
    parts = [p for p in re.split(r'([。！？；：，、])', text.replace(' ', '')) if p]
    out, buf = [], ''
    for p in parts:
        if p in PUNCT:
            buf += p
            if len(buf) >= 7:
                out.append(buf)
                buf = ''
        else:
            buf += p
            if len(buf) >= 18:
                out.append(buf)
                buf = ''
    if buf:
        out.append(buf)
    fixed = []
    for c in out:
        ts = tokens(c)
        while len(ts) > 24:
            cut = ts[:24]
            k = max((i for i, t in enumerate(cut) if t[-1] in '，、：'), default=-1)
            cut = cut[: k + 1] if k >= 12 else cut
            fixed.append(''.join(cut))
            ts = ts[len(cut):]
        if ts:
            fixed.append(''.join(ts))
    return fixed


# 不能从中间劈开的双字词（本片高频）
WORDS2 = ('欧洲 亚洲 造纸 蔡伦 千年 用品 一百 之后 竹简 麻纸 麻头 树皮 破布 渔网 原料 工序 水槽 竹帘 '
          '纸膜 工匠 知识 日用 便宜 稳定 贵族 平民 西汉 东汉 公元 世纪 视频 动画 '
          '剪辑 评论 留言 就是 不如 两千 四道 第一 第二 第三 第四 泡到 捣成 捣得 '
          '抄纸 晒干 揭下 往西 一战 回到 手感 疙瘩 写动 传送').split()
PAIRS = set(WORDS2)
# 断在这些字之后通常不破词
CONNECT = '的了是在就都把与和又才也还很得着过这那个后前里'
STOP = '。！？；：'


def clean_line(s):
    return s.strip().lstrip('，、：；。').rstrip('，、')


def layout_lines(text, max_chars=LINE_MAX):
    t = clean_line(text)
    ts = tokens(t)
    if len(ts) <= max_chars:
        return [t]
    best = None
    for i in range(1, len(ts)):
        left, right = ''.join(ts[:i]), ''.join(ts[i:])
        if len(left) > max_chars + 1 or len(right) > max_chars:
            continue
        score = -1.6 * abs(len(left) - len(right))
        if left[-1] in STOP:
            score += 8
        elif left[-1] in '，、':
            score += 4
        elif left[-1] in CONNECT:
            score += 3
        both = (left[-1] + right[0])
        if both in PAIRS:
            score -= 7
        if len(right) <= max_chars:
            score += 2
        if best is None or score > best[0]:
            best = (score, i)
    i = best[1] if best else len(ts) // 2
    return [clean_line(''.join(ts[:i])), clean_line(''.join(ts[i:]))]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--master', required=True)
    ap.add_argument('--script', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--srt', required=True)
    args = ap.parse_args()

    x = read_wav(args.master)
    total = len(x) / SR
    speech, runs = speech_runs(x)
    script = json.load(open(args.script, encoding='utf-8'))
    segs = [(s['id'], s['order'], s['role'], s['text'], weight(s['text'])) for s in script['segments']]
    W = sum(s[4] for s in segs)
    speech_total = sum(b - a for a, b in speech)

    # speech run -> 分配字数
    run_chars, acc = [], 0.0
    for a, b in speech:
        acc += (b - a) / speech_total * W
        run_chars.append(acc - sum(run_chars))

    def t_at(w):
        cum = 0.0
        for (a, b), c in zip(speech, run_chars):
            if w <= cum + c + 1e-9:
                return a + (w - cum) / max(c, 1e-9) * (b - a)
            cum += c
        return speech[-1][1]

    scenes, cum = [], 0.0
    for pid, order, role, text, w in segs:
        start, end = t_at(cum), t_at(cum + w)
        scenes.append({'id': pid, 'order': order, 'role': role, 'text': text,
                       'start': round(start, 3), 'end': round(end, 3), 'weight': w})
        cum += w

    # 段落内：clause -> cue（按字数/时长装箱，再修太短）
    cues = []
    for sc in scenes:
        cs = clauses(sc['text'])
        cs_w = [weight(c) for c in cs]
        span = sc['end'] - sc['start']
        tot = sum(cs_w) or 1
        groups, cur = [], None
        for c, w in zip(cs, cs_w):
            clen = len(c.replace('\u3000', ''))
            if cur is None:
                cur = [c, w]
                continue
            if (len(cur[0]) + clen <= 24 and
                    (cur[1] + w) / tot * span <= CUE_MAX_DUR):
                cur[0] += c
                cur[1] += w
            else:
                groups.append(cur)
                cur = [c, w]
        if cur:
            groups.append(cur)
        # 合并过短的
        i = 0
        while i < len(groups):
            dur = groups[i][1] / tot * span
            if dur < CUE_MIN_DUR and len(groups) > 1:
                if i + 1 < len(groups) and len(groups[i][0]) + len(groups[i + 1][0]) <= 26:
                    groups[i][0] += groups[i + 1][0]
                    groups[i][1] += groups[i + 1][1]
                    groups.pop(i + 1)
                    continue
                if i > 0 and len(groups[i][0]) + len(groups[i - 1][0]) <= 26:
                    groups[i - 1][0] += groups[i][0]
                    groups[i - 1][1] += groups[i][1]
                    groups.pop(i)
                    i = max(i - 1, 0)
                    continue
            i += 1
        base = 0.0
        for g in groups:
            a = sc['start'] + span * base / tot
            b = sc['start'] + span * (base + g[1]) / tot
            base += g[1]
            cues.append({'para': sc['id'], 'from': round(a, 3), 'to': round(b, 3),
                         'text': g[0], 'lines': layout_lines(g[0]), 'dur': round(b - a, 3)})

    plan = {'master': args.master, 'duration': round(total, 3),
            'speechRuns': [[round(a, 3), round(b, 3)] for a, b in speech],
            'silences': [[round(a, 3), round(b, 3)] for k, a, b in runs if k == 'sil'],
            'scenes': scenes, 'cues': cues}
    json.dump(plan, open(args.out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    def ts(t):
        h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
        return f'{h:02d}:{m:02d}:{s:06.3f}'.replace('.', ',')

    with open(args.srt, 'w', encoding='utf-8') as f:
        for i, c in enumerate(cues, 1):
            f.write(f'{i}\n{ts(c["from"])} --> {ts(c["to"])}\n' + '\n'.join(c['lines']) + '\n\n')

    short = [c for c in cues if c['dur'] < CUE_MIN_DUR]
    print(json.dumps({'duration': round(total, 3),
                      'scenes': [(s['id'], s['start'], s['end']) for s in scenes],
                      'cues': len(cues), 'shortCues': len(short),
                      'cueDurRange': [min(c['dur'] for c in cues), max(c['dur'] for c in cues)]},
                     ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

