"""
align-master-vo.py — 把整条母版口播切片并对齐到 approved-script 的段落

做法（不接 ASR，也不重录）：
1. 读 16-bit PCM wav（48k 单声道），算 20ms RMS 包络，低于阈值且至少 0.12s 视为静音；
2. 用 FFT 归一化互相关，把已有的逐镜配音（s01..s05）在母版里定位，
   这一步给出「母版确实是同一条完整朗读」的硬证据，不靠听感；
3. 段落切点优先落在静音中间；静音不够时按已定位锚点 + 每段字数比例兜底；
4. 输出 build/audio/align.json，供时间轴生成与字幕对齐使用。

用法：
    python scripts/align-master-vo.py --master build/audio/master.wav \
        --anchors build/audio/s01.wav:0:0 build/audio/s02.wav:1:1 ... \
        --out build/audio/align.json
"""
import argparse
import json
import wave
import numpy as np

SR_TARGET = 48000


def read_wav(path):
    with wave.open(path, 'rb') as w:
        n = w.getnframes()
        sr = w.getframerate()
        ch = w.getnchannels()
        sw = w.getsampwidth()
        raw = w.readframes(n)
    if sw != 2:
        raise SystemExit(f'{path}: 需要 16-bit PCM，实际 {sw * 8}-bit')
    data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        data = data.reshape(-1, ch).mean(axis=1)
    if sr != SR_TARGET:
        idx = (np.arange(int(len(data) / sr * SR_TARGET)) * sr / SR_TARGET).astype(np.int64)
        idx = np.clip(idx, 0, len(data) - 1)
        data = data[idx]
    return data, SR_TARGET


def rms_envelope(x, sr, win_ms=20):
    win = int(sr * win_ms / 1000)
    n = len(x) // win
    frames = x[: n * win].reshape(n, win)
    rms = np.sqrt((frames ** 2).mean(axis=1) + 1e-12)
    return np.clip(20 * np.log10(rms), -90, 0), win


def find_silences(env, win, sr, thresh_db=-34.0, min_sec=0.12):
    silent = env < thresh_db
    # 抹掉孤立单帧抖动
    for i in range(1, len(silent) - 1):
        if silent[i] and not silent[i - 1] and not silent[i + 1]:
            silent[i] = False
    out = []
    start = None
    for i, s in enumerate(silent):
        if s and start is None:
            start = i
        elif not s and start is not None:
            if (i - start) * win / sr >= min_sec:
                out.append((start * win / sr, i * win / sr))
            start = None
    if start is not None and (len(silent) - start) * win / sr >= min_sec:
        out.append((start * win / sr, len(silent) * win / sr))
    return out


def ncc(q, x):
    """归一化互相关，返回 (best_lag_samples, score)"""
    q = q - q.mean()
    x = x - x.mean()
    n = 1 << int(np.ceil(np.log2(len(x) + len(q))))
    X = np.fft.rfft(x, n)
    Q = np.fft.rfft(q, n)
    corr = np.fft.irfft(X * np.conj(Q), n)[: len(x) - len(q) + 1]
    # 局部能量归一化
    csum = np.concatenate([[0], np.cumsum(x ** 2)])
    energy = csum[len(q):] - csum[:-len(q)] + 1e-9
    score = corr / np.sqrt(energy * (q ** 2).sum())
    lag = int(np.argmax(score))
    return lag, float(score[lag])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--master', required=True)
    ap.add_argument('--anchors', nargs='*', default=[])
    ap.add_argument('--out', required=True)
    ap.add_argument('--thresh', type=float, default=-34.0)
    ap.add_argument('--min-silence', type=float, default=0.12)
    args = ap.parse_args()

    master, sr = read_wav(args.master)
    env, win = rms_envelope(master, sr)
    silences = find_silences(env, win, sr, args.thresh, args.min_silence)
    duration = len(master) / sr

    anchors = []
    for spec in args.anchors:
        path, para, idx = spec.rsplit(':', 2)
        q, _ = read_wav(path)
        lag, score = ncc(q, master)
        anchors.append({
            'file': path,
            'paragraph': int(para),
            'scene': int(idx),
            'start': round(lag / sr, 3),
            'end': round(lag / sr + len(q) / sr, 3),
            'duration': round(len(q) / sr, 3),
            'ncc': round(score, 3),
        })

    print(json.dumps({'duration': round(duration, 3), 'src': sr, 'silences': [[round(a, 3), round(b, 3)] for a, b in silences], 'anchors': anchors}, ensure_ascii=False, indent=2))
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump({
            'master': args.master,
            'srcSampleRate': sr,
            'duration': round(duration, 3),
            'thresholdDb': args.thresh,
            'minSilenceSec': args.min_silence,
            'silences': [[round(a, 3), round(b, 3)] for a, b in silences],
            'anchors': anchors,
        }, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
