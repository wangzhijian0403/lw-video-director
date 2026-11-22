#!/usr/bin/env python3
"""Private user-created character media: verify SHA and convert green MP4 to VP9 alpha WebM.

Input: --root directory containing library.json and originals/video-style/assets.
No private media is uploaded, copied into git, or changed in place.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

CHROMA = "chromakey=0x00ff00:0.18:0.06,despill=type=green,format=yuva420p"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def read_library(root: Path):
    path = root / "library.json"
    if not path.is_file():
        raise ValueError(f"Missing library.json in {root}")
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    if data.get("schemaVersion") != "lw-character-library/1":
        raise ValueError("Unexpected library schema")
    return data


def asset_path(root: Path, row: dict) -> Path:
    rel = row["originalRelativePath"].replace("\\", "/")
    path = (root / rel).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"Unsafe path: {rel}")
    return path


def verify(root: Path, data: dict) -> int:
    errors = []
    for row in data["assets"]:
        path = asset_path(root, row)
        if not path.exists():
            errors.append(f"{row['assetKey']}: missing")
        elif sha256(path) != row["sha256"]:
            errors.append(f"{row['assetKey']}: SHA mismatch")
    print(f"Verified {len(data['assets']) - len(errors)}/{len(data['assets'])} assets")
    for error in errors:
        print("FAIL", error)
    return 0 if not errors else 2


def prepare(root: Path, data: dict, character: str, action: str, out: Path, force: bool) -> None:
    rows = [x for x in data["assets"] if x["characterId"] == character and x["action"] == action and x["kind"] == "video"]
    if len(rows) != 1:
        raise ValueError(f"Unknown video action: {character}/{action}")
    row = rows[0]
    src = asset_path(root, row)
    if not src.is_file() or sha256(src) != row["sha256"]:
        raise ValueError(f"Missing or modified source: {src}")
    ffmpeg, ffprobe = shutil.which("ffmpeg"), shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe must be installed and on PATH")
    out.mkdir(parents=True, exist_ok=True)
    target = out / f"{character}-{action}.webm"
    if target.exists() and not force:
        raise FileExistsError(f"{target} exists; specify --force to regenerate")
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(src), "-vf", CHROMA, "-an", "-c:v", "libvpx-vp9", "-b:v", "0",
        "-crf", "30", "-deadline", "good", "-cpu-used", "4", "-auto-alt-ref", "0",
        "-pix_fmt", "yuva420p", str(target)], check=True)
    result = subprocess.run([ffprobe, "-v", "error", "-show_entries",
        "stream=codec_name:stream_tags=alpha_mode", "-of", "json", str(target)],
        capture_output=True, text=True, check=True)
    stream = json.loads(result.stdout)["streams"][0]
    if stream.get("codec_name") != "vp9" or stream.get("tags", {}).get("alpha_mode") != "1":
        raise RuntimeError(f"WebM alpha metadata missing: {stream}")
    (out / f"{character}-{action}.json").write_text(json.dumps({
        "characterId": character, "action": action, "sourceSha256": row["sha256"],
        "outputSha256": sha256(target), "videoAlpha": "VP9 alpha_mode=1",
        "sourceAudioUsed": False, "loopVerified": False, "fullDurationVisualReview": False,
        "keyFilter": CHROMA}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Prepared alpha WebM:", target)
    print("WARNING: Chromium/Remotion playback, full-length edges, shadow and loop are NOT YET verified")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--root", type=Path, required=True)
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("verify")
    sub.add_parser("list")
    prep = sub.add_parser("prepare-alpha")
    prep.add_argument("--character", required=True, choices=["fish", "codex", "deepseek", "doubao", "claude"])
    prep.add_argument("--action", required=True)
    prep.add_argument("--out", type=Path, required=True)
    prep.add_argument("--force", action="store_true")
    args = p.parse_args()
    root = args.root.expanduser().resolve()
    data = read_library(root)
    if args.command == "verify":
        return verify(root, data)
    if args.command == "list":
        for character in data["characters"]:
            print(character, [x["action"] for x in data["assets"] if x["characterId"] == character])
        return 0
    prepare(root, data, args.character, args.action, args.out, args.force)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
