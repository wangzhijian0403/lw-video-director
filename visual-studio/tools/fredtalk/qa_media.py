"""Deterministic *machine* MP4 QA using OpenCV (no ffmpeg on this host).

This module only answers "did the decoder see a structurally valid, moving,
non-black clip with the expected frame count/fps/resolution?"  It never claims
that a human reviewed the visual quality. Human review is a separate record in
``batch/reviews/`` and is reported separately.

Checks: decodes, frame count/duration vs composition, fps, near-black frames,
frame-to-frame motion, full-frame white/flat frames, and still evidence presence.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np

VS = Path(__file__).resolve().parents[2]
BATCH = VS / "external" / "fredtalk" / "batch"
REG = json.loads((VS / "src" / "references" / "fredtalk-registry.data.json").read_text())


def load_json(path: Path, default=None):
    return json.loads(path.read_text()) if path.exists() else default


def qa_one(entry: dict, evidence_dir: Path) -> dict:
    mp4 = evidence_dir / "render.mp4"
    out = {"id": entry["id"], "kind": "machine-qa", "checks": {}, "notes": []}
    if not mp4.exists():
        out["checks"]["decodes"] = False
        out["notes"].append("render.mp4 missing")
        out["machineStatus"] = "fail"
        return out
    cap = cv2.VideoCapture(str(mp4))
    if not cap.isOpened():
        out["checks"]["decodes"] = False
        out["notes"].append("cv2 cannot open mp4")
        out["machineStatus"] = "fail"
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
    stills = sorted(evidence_dir.glob("frame-*.png"))
    out["checks"]["stills"] = len(stills)
    out["checks"]["hasHeadMidTail"] = len(stills) >= 3
    for c, ok in out["checks"].items():
        if isinstance(ok, bool) and not ok:
            out["notes"].append(f"failed: {c}")
    out["machineStatus"] = "pass" if all(v for k, v in out["checks"].items() if isinstance(v, bool)) else "fail"
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-id", default=None)
    ap.add_argument("--only", nargs="*", default=None)
    args = ap.parse_args()
    evidence = BATCH / "runs" / args.run_id / "evidence" if args.run_id else BATCH / "evidence"
    entries = [e for e in REG if not args.only or e["id"] in args.only]
    results = []
    for e in entries:
        r = qa_one(e, evidence / e["id"])
        qa_path = evidence / e["id"] / "qa.json"
        qa_path.parent.mkdir(parents=True, exist_ok=True)
        qa_path.write_text(json.dumps(r, ensure_ascii=False, indent=2) + "\n")
        print(f"{'MACHINE-PASS' if r['machineStatus'] == 'pass' else 'MACHINE-FAIL'} {e['id']} "
              f"frames={r.get('video',{}).get('frames')} luma={r['checks'].get('meanLuma')} "
              f"motion={r['checks'].get('motionMean')} {r['notes']}")
        results.append(r)
    summary_path = (BATCH / "runs" / args.run_id / "qa-summary.json") if args.run_id else (BATCH / "qa-summary.json")
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    return 0 if all(r["machineStatus"] == "pass" for r in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
