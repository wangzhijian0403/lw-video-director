#!/usr/bin/env python3
"""Prepare the five mascot characters' greenscreen MP4s as VP9-alpha WebM clips.

Input:  visual-studio/public/characters/{character}-{action}.mp4 (greenscreen, 10s/24fps)
Output: visual-studio/public/characters/{character}-{action}.webm + .json sidecar

The filter chain mirrors scripts/user_character_library.py (the flow that produced
the two already-accepted clips, fish/wave and codex/typing). Clips are trimmed to
the verified safe range 0.2s-5.0s; the tail of the source drifts out of frame.

ffmpeg is not on PATH on this machine, so the imageio-ffmpeg bundled binary is
used. VP9 alpha cannot be inspected by this ffmpeg build's decoder; acceptance is
done with a real Remotion render (see references/character-library-acceptance.md).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "characters"

CHROMA = "chromakey=0x00ff00:0.18:0.06,despill=type=green,format=yuva420p"
SAFE_RANGE = {"start": 0.2, "end": 5.0}

# 10 source clips; the two already-accepted ones are intentionally left untouched.
CLIPS = {
    "fish": ["idle", "wave"],
    "codex": ["idle", "typing"],
    "deepseek": ["idle", "curtsy"],
    "doubao": ["idle", "share"],
    "claude": ["idle", "dance"],
}
KEEP_EXISTING = {"fish/wave", "codex/typing"}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def ffmpeg_bin() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError as exc:
        raise RuntimeError("imageio-ffmpeg is required (bundled ffmpeg)") from exc


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="regenerate clips that already exist")
    args = ap.parse_args()
    ff = ffmpeg_bin()
    made, skipped, failed = [], [], []

    for character, actions in CLIPS.items():
        for action in actions:
            key = f"{character}/{action}"
            src = OUT / f"{character}-{action}.mp4"
            dst = OUT / f"{character}-{action}.webm"
            if key in KEEP_EXISTING:
                skipped.append(f"{key} (previously accepted clip kept)")
                continue
            if not src.is_file():
                failed.append(f"{key}: source missing {src.name}")
                continue
            if dst.exists() and not args.force:
                skipped.append(f"{key} (exists)")
                continue
            vf = f"trim=start={SAFE_RANGE['start']}:end={SAFE_RANGE['end']},setpts=PTS-STARTPTS,{CHROMA}"
            cmd = [ff, "-hide_banner", "-loglevel", "error", "-y", "-i", str(src),
                   "-vf", vf, "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30",
                   "-deadline", "good", "-cpu-used", "4", "-auto-alt-ref", "0",
                   "-pix_fmt", "yuva420p", str(dst)]
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode != 0 or not dst.is_file() or dst.stat().st_size < 10000:
                failed.append(f"{key}: ffmpeg failed: {r.stderr[-300:]}")
                continue
            meta = {
                "characterId": character,
                "action": action,
                "sourceSha256": sha256(src),
                "outputSha256": sha256(dst),
                "videoAlpha": "VP9 yuva420p",
                "sourceAudioUsed": False,
                "loopVerified": False,
                "fullDurationVisualReview": False,
                "safeRange": SAFE_RANGE,
                "trimmedToSafeRange": True,
                "keyFilter": vf,
                "note": "trimmed to verified safe range; acceptance by real Remotion render",
            }
            (OUT / f"{character}-{action}.json").write_text(
                json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            made.append(f"{key} -> {dst.name} ({dst.stat().st_size // 1024} KB)")

    print("prepared", len(made))
    for x in made:
        print("  +", x)
    print("skipped", len(skipped))
    for x in skipped:
        print("  -", x)
    if failed:
        print("FAILED", len(failed))
        for x in failed:
            print("  !", x)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
