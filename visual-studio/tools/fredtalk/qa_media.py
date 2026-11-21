"""Deterministic MP4 QA using OpenCV (no ffmpeg on this host).

Checks: decodes, frame count/duration vs composition, fps, near-black frames,
frame-to-frame motion, full-frame white/flat frames, and still evidence presence.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np

VS = Path(__file__).resolve().parents[2]
BATCH = VS / "external" / "fredtalk" / "batch"
REG = json.loads((VS / "src" / "references" / "fredtalk-registry.data.json").read_text())


def qa_one(entry: dict) -> dict:
    d = BATCH / "evidence" / entry["id"]
    mp4 = d / "render.mp4"
    out = {"id": entry["id"], "checks": {}, "notes": []}
    if not mp4.exists():
        out["checks"]["decodes"] = False
        out["notes"].append("render.mp4 missing")
        return out
    cap = cv2.VideoCapture(str(mp4))
    if not cap.isOpened():
        out["checks"]["decodes"] = False
        out["notes"].append("cv2 cannot open mp4")
        return out
    fps = cap.get(cv2.CAP_PROP_FPS)
    declared = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    means, diffs = [], []
    prev = None
    count = 0
    black = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        count += 1
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        m = float(gray.mean())
        means.append(m)
        if m < 8:
            black += 1
        small = cv2.resize(gray, (160, 90))
        if prev is not None:
            diffs.append(float(np.abs(small.astype(np.int16) - prev).mean()))
        prev = small.astype(np.int16)
    cap.release()
    dur = count / fps if fps else 0
    expected = entry.get("sourceFrames") or entry["nativeFrames"]
    out["video"] = {"width": w, "height": h, "fps": round(fps, 3), "frames": count,
                    "declaredFrames": int(declared), "durationSec": round(dur, 3),
                    "expectedFrames": expected, "bytes": mp4.stat().st_size}
    out["checks"]["decodes"] = count > 0
    out["checks"]["frameCountMatches"] = abs(count - expected) <= 2
    out["checks"]["fpsMatches"] = abs(fps - entry["fps"]) <= 0.05
    out["checks"]["resolution1280x720"] = (w, h) == (1280, 720)
    out["checks"]["blackFrameRatio"] = round(black / max(1, count), 4)
    out["checks"]["notMostlyBlack"] = black / max(1, count) < 0.35
    out["checks"]["meanLuma"] = round(float(np.mean(means)), 2)
    out["checks"]["motionMean"] = round(float(np.mean(diffs)) if diffs else 0.0, 3)
    out["checks"]["hasMotion"] = (float(np.mean(diffs)) if diffs else 0) > 0.05
    out["checks"]["notFlatWhite"] = float(np.mean(means)) < 250
    stills = sorted(d.glob("frame-*.png"))
    out["checks"]["stills"] = len(stills)
    out["checks"]["hasHeadMidTail"] = len(stills) >= 3
    for c, ok in out["checks"].items():
        if isinstance(ok, bool) and not ok:
            out["notes"].append(f"failed: {c}")
    return out


def main() -> int:
    ids = sys.argv[1:]
    entries = [e for e in REG if not ids or e["id"] in ids]
    results = []
    for e in entries:
        r = qa_one(e)
        p = BATCH / "evidence" / e["id"] / "qa.json"
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(r, ensure_ascii=False, indent=2) + "\n")
        ok = all(v for k, v in r["checks"].items() if isinstance(v, bool))
        print(f"{'PASS' if ok else 'CHECK'} {e['id']} frames={r.get('video',{}).get('frames')} luma={r['checks'].get('meanLuma')} motion={r['checks'].get('motionMean')} {r['notes']}")
        results.append(r)
    (BATCH / "qa-summary.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
