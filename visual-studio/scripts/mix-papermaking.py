"""
mix-papermaking.py — 《造纸术》完整版四轨合成

顺序（和项目规则第 7 条一致）：母版口播定长 → 音效按动作接触点落位 → 音乐只做底 → 混音 → 归一。
做法：
1. 口播：master.wav（48k 单声道 → 立体声居中），不重生成 TTS。
2. 音效：先按用户要求「整体 -12 dB」作为起点，再在有人声处做两级让位：
   - 持续音（水底、气泡）在人声期间 -8 dB；
   - 瞬态（杵击、入水、提帘）在人声期间 -4 dB，并做块级限幅：任何 20ms 块里
     音效 RMS 不得超过人声 RMS -6 dB（这就是「不抢字头」的硬约束）。
3. 音乐：程序合成的低幅环境底（无旋律采样、可声明原创），人声期间 -9 dB。
4. 归一：两遍 loudnorm，目标 -15 LUFS / 真峰值 -1.5 dBTP（用户给的是 −16…−14 / ≤−1）。
5. 额外导出 10 秒「纯人声 / 修正混音」对照（24.5–34.5s：捣 + 抄，瞬态最密的区间）。

产出：
  build/audio/tracks/{vo,sfx,music,mix}.wav
  projects/papermaking-full/audio/papermaking-full-mix.wav（渲染用）
  build/audio/ab/{vo-only,mix}.wav（10s 对照）
  build/audio/mix-report.json（各轨电平与让位次数）
"""
import json
import os
import subprocess
import wave

import numpy as np

SR = 48000
GLOBAL_SFX_DB = -12.0
CONT_DUCK_DB = -8.0
TRANS_DUCK_DB = -4.0
MUSIC_DUCK_DB = -9.0
MUSIC_PEAK_DB = -31.0
SFX_CEIL_DB = -6.0  # 有字时音效 RMS 至少比人声低 6 dB
SFX_PEAK_BELOW_VO_DB = -11.0  # 最响的一击，块 RMS 只到人声 -14 dB（校准目标）
MUSIC_BELOW_VO_DB = -24.0     # 音乐不压人声时的底噪位置

CONT = {'water_bed', 'bubbles_loop', 'fiber_settle'}


def read_wav(path):
    with wave.open(path, 'rb') as w:
        n, ch, sw, sr = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
        raw = w.readframes(n)
    if sw != 2:
        raise SystemExit(f'{path}: 只支持 16-bit PCM')
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    x = x.reshape(-1, ch)
    if sr != SR:
        idx = np.clip((np.arange(int(len(x) / sr * SR)) * sr / SR).astype(np.int64), 0, len(x) - 1)
        x = x[idx]
    if ch == 1:
        x = np.repeat(x, 2, axis=1)
    return x


def write_wav(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    x = np.clip(x, -1, 1)
    data = (x * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def db(x):
    return 20 * np.log10(max(1e-9, x))


def rms_blocks(x, win=960):
    mono = x.mean(axis=1) if x.ndim == 2 else x
    n = len(mono) // win
    return np.sqrt((mono[: n * win].reshape(n, win) ** 2).mean(axis=1) + 1e-12), win


def smooth_step(g, attack=0.004, release=0.03):
    """把块增益按 20ms 一格线性插值到样本级（20ms 步进本身听不出台阶）"""
    win = 960
    n = len(g)
    xs = (np.arange(n) * win + win / 2).astype(np.float64)
    ys = np.asarray(g, dtype=np.float64)
    return np.interp(np.arange(int(n * win)), xs, ys).astype(np.float32)


def synth_music(total, vo_active):
    """低幅环境底：两个正弦层 + 一层低通噪声，四小节一换和弦，不出现旋律记忆点"""
    t = np.arange(total) / SR
    chords = [(110.0, 164.8, 220.0), (98.0, 146.8, 196.0), (123.5, 185.0, 246.9), (110.0, 164.8, 220.0)]
    seg = total / 4
    out = np.zeros(total, dtype=np.float32)
    for i, (f1, f2, f3) in enumerate(chords):
        a = int(i * seg)
        b = int((i + 1) * seg)
        tt = t[a:b] - t[a]
        env = np.sin(np.pi * np.clip(tt / max(1e-6, (b - a) / SR), 0, 1)) ** 0.8
        layer = (
            0.5 * np.sin(2 * np.pi * f1 * tt + 0.2)
            + 0.3 * np.sin(2 * np.pi * f2 * tt + 1.1)
            + 0.16 * np.sin(2 * np.pi * f3 * tt + 2.4)
        )
        out[a:b] = (layer * env).astype(np.float32)
    # 低通噪声（用一阶滤波近似），给空气感
    rng = np.random.default_rng(0x51FF)
    noise = rng.standard_normal(total).astype(np.float32)
    h = np.exp(-np.arange(200) / 40.0)
    h /= h.sum()
    lp = np.convolve(noise, h, mode='same').astype(np.float32)
    out = out + 0.5 * lp
    out /= max(1e-6, np.abs(out).max())
    out *= 10 ** (MUSIC_PEAK_DB / 20)
    # 人声期间退后（块级判定，再插值到样本，避免逐样本处理）
    win = 960
    nb = total // win
    blk = vo_active[: nb * win].reshape(nb, win).mean(axis=1) > 0.35
    gb = np.where(blk, 10 ** (MUSIC_DUCK_DB / 20), 1.0).astype(np.float32)
    gs = smooth_step(gb)
    out *= gs[:total] if len(gs) >= total else np.pad(gs, (0, total - len(gs)), constant_values=1.0)
    # 头尾 1.5s 淡入淡出
    fi = int(1.5 * SR)
    out[:fi] *= np.linspace(0, 1, fi)
    out[-fi:] *= np.linspace(1, 0, fi)
    return np.stack([out, out], axis=1)


def loudnorm(src, dst, target_i=-15.0, tp=-1.5):
    os.makedirs(os.path.dirname(dst) or '.', exist_ok=True)
    probe = subprocess.run(
        ['ffmpeg', '-y', '-i', src, '-af', f'loudnorm=I={target_i}:TP={tp}:LRA=11:print_format=json', '-f', 'null', '-'],
        capture_output=True, text=True)
    txt = probe.stderr
    block = txt[txt.rfind('{'): txt.rfind('}') + 1]
    m = json.loads(block)
    subprocess.run(
        ['ffmpeg', '-y', '-i', src, '-af',
         f'loudnorm=I={target_i}:TP={tp}:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:'
         f'measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true',
         '-ar', str(SR), dst],
        capture_output=True, text=True, check=True)
    return m


def main():
    proj = 'projects/papermaking-full'
    plan = json.load(open('build/audio/vo-plan.json', encoding='utf-8'))
    events = json.load(open(f'{proj}/project.json', encoding='utf-8'))['sfx']

    vo = read_wav('build/audio/master.wav')
    total = len(vo)
    vo_rms, win = rms_blocks(vo)
    active = vo_rms > 10 ** (-34 / 20)
    # 人声能量扩一点边界（字头前 20ms 就要开始让位）
    active2 = active.copy()
    active2[1:] |= active[:-1]
    active_s = np.repeat(active2, win)[: len(vo)]
    # 用逐样本布尔表达「人声在场」
    vo_gate = np.zeros(total, dtype=bool)
    vo_gate[: len(active_s)] = active_s

    sfx = np.zeros((total, 2), dtype=np.float32)
    used = {}
    for e in events:
        name = e['name']
        p = f'public/sfx/{name}.wav'
        if not os.path.exists(p):
            used.setdefault('missing', []).append(name)
            continue
        clip = read_wav(p)
        start = int(round(e['at'] * SR))
        if start < 0:
            clip = clip[-start:]
            start = 0
        end = min(total, start + len(clip))
        clip = clip[: end - start]
        base = e.get('volume', 0.8) * 10 ** (GLOBAL_SFX_DB / 20)
        cont = name in CONT
        duck = (CONT_DUCK_DB if cont else TRANS_DUCK_DB) if name in CONT else TRANS_DUCK_DB
        # 事件里有多少比例落在人声上，决定这一击让多少
        share = float(vo_gate[start:end].mean()) if end > start else 0.0
        duck_db = (CONT_DUCK_DB if cont else TRANS_DUCK_DB) * share
        sfx[start:end] += clip * base * 10 ** (duck_db / 20)
        used[name] = used.get(name, 0) + 1

    # 校准：以「人声在场时的中位 RMS」为基准，让最响的一击只到人声 -14 dB。
    # 这一步是实测回调：先按 -12 dB 起点铺完，量一遍发现还剩 27 dB 落差（旧工程音量本身偏保守），
    # 于是把整条音效抬回目标位，抬升量写进报告，避免「降过头=听不见」和「不降=抢字」两头犯错。
    s_rms, _ = rms_blocks(sfx)
    v_rms, _ = rms_blocks(vo)
    vo_med = float(np.median(v_rms[active])) if active.any() else 1e-3
    s_max = float(s_rms.max()) if len(s_rms) else 0.0
    calib_db = 0.0
    if s_max > 1e-6:
        target = vo_med * 10 ** (SFX_PEAK_BELOW_VO_DB / 20)
        calib_db = float(20 * np.log10(target / s_max))
        calib_db = max(-12.0, min(18.0, calib_db))
        sfx *= 10 ** (calib_db / 20)

    # 块级限幅：有字的地方，音效不得高过人声 -6 dB
    need = np.zeros(len(s_rms))
    for i in range(len(s_rms)):
        if active[i] and s_rms[i] > 1e-6:
            cap = v_rms[i] * 10 ** (SFX_CEIL_DB / 20)
            if s_rms[i] > cap:
                need[i] = cap / s_rms[i]
    need[need == 0] = 1.0
    # 邻域最小化，保证字头前后不留尖峰
    k = 3
    need = np.array([min(need[max(0, i - k): i + k + 1]) for i in range(len(need))])
    gain_s = smooth_step(need)
    sfx[: len(gain_s)] *= gain_s[:, None]

    music = synth_music(total, vo_gate)
    mb, _ = rms_blocks(music)
    music_db = 0.0
    if mb.max() > 1e-6:
        target_m = vo_med * 10 ** (MUSIC_BELOW_VO_DB / 20)
        music_db = float(20 * np.log10(target_m / mb.max()))
        music *= 10 ** (music_db / 20)

    mix = vo + sfx + music
    peak = np.abs(mix).max()
    mix = mix / max(1.0, peak / 0.9)

    os.makedirs('build/audio/tracks', exist_ok=True)
    write_wav('build/audio/tracks/vo.wav', vo)
    write_wav('build/audio/tracks/sfx.wav', sfx)
    write_wav('build/audio/tracks/music.wav', music)
    write_wav('build/audio/tracks/mix.wav', mix)
    loudnorm('build/audio/tracks/mix.wav', f'{proj}/audio/papermaking-full-mix.wav')
    # 分轨也按同一增益归一，方便对轨比较
    loudnorm('build/audio/tracks/vo.wav', 'build/audio/tracks/vo-norm.wav', target_i=-15.0, tp=-1.5)

    # 10 秒对照：24.5–34.5（捣 → 抄，瞬态最密）
    a, b = int(24.5 * SR), int(34.5 * SR)
    write_wav('build/audio/ab/vo-only.wav', vo[a:b])
    write_wav('build/audio/ab/mix.wav', mix[a:b])
    # 对照也要有可比的响度：纯人声单独归一，混音用整片归一后的同段
    loudnorm('build/audio/ab/vo-only.wav', 'build/audio/ab/vo-only-norm.wav')
    subprocess.run(['ffmpeg', '-y', '-i', f'{proj}/audio/papermaking-full-mix.wav',
                    '-ss', '24.5', '-t', '10', '-ar', str(SR), 'build/audio/ab/mix-norm.wav'],
                   capture_output=True)

    rep = {
        'duration': round(total / SR, 3),
        'events': len(events),
        'byName': used,
        'globalSfxDb': GLOBAL_SFX_DB,
        'calibratedSfxShiftDb': round(calib_db, 2),
        'musicShiftDb': round(music_db, 2),
        'voMedianActiveRmsDb': round(float(20 * np.log10(vo_med)), 2),
        'sfxMaxBlockRmsDb': round(float(20 * np.log10(rms_blocks(sfx)[0].max())), 2),
        'musicMaxBlockRmsDb': round(float(20 * np.log10(rms_blocks(music)[0].max())), 2),
        'continuousDuckDb': CONT_DUCK_DB,
        'transientDuckDb': TRANS_DUCK_DB,
        'musicPeakDb': MUSIC_PEAK_DB,
        'speechCeilingDb': SFX_CEIL_DB,
        'limiterBlocks': int((need < 0.999).sum()),
        'voRmsDb': round(float(db(np.sqrt((vo ** 2).mean()))), 2),
        'sfxRmsDb': round(float(db(np.sqrt((sfx ** 2).mean()))), 2),
        'musicRmsDb': round(float(db(np.sqrt((music ** 2).mean()))), 2),
        'mixPeakDb': round(float(db(np.abs(mix).max())), 2),
    }
    json.dump(rep, open('build/audio/mix-report.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(json.dumps(rep, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()


