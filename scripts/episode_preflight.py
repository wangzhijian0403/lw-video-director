#!/usr/bin/env python3
"""Validate an LW whole-episode storyboard without pretending that a renderer exists.

Plan mode checks the episode structure and component availability.
Render mode ALSO checks real voice/subtitle inputs and the production runtime's
independently verified capability manifest. It does not render media.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
STUDIO = REPO_ROOT / "visual-studio"
SUPPORTED_ASPECT = {"9:16": 9 / 16, "16:9": 16 / 9, "3:4": 3 / 4, "1:1": 1.0}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def resolve_media(raw, project_dir: Path):
    if not isinstance(raw, str) or not raw.strip():
        return None
    p = Path(raw).expanduser()
    return (p if p.is_absolute() else project_dir / p).resolve()


def inspect_episode(episode_path: Path, phase: str) -> dict:
    errors, warnings = [], []
    data = load_json(episode_path)
    if not isinstance(data, dict):
        raise ValueError("episode.json must be an object")
    brief, output = data.get("brief", {}), data.get("output", {})
    if not isinstance(brief, dict) or not isinstance(output, dict):
        errors.append("brief/output must be objects")
        brief, output = {}, {}
    fps = output.get("fps")
    frames = output.get("totalFrames")
    width, height = output.get("width"), output.get("height")
    if type(fps) is not int or fps < 1 or fps > 120:
        errors.append("output.fps must be an integer 1..120")
    if type(frames) is not int or frames < 1:
        errors.append("output.totalFrames must be a positive integer")
    if any(type(v) is not int or v < 1 for v in (width, height)):
        errors.append("output.width/height must be positive integers")
    aspect = brief.get("aspect")
    if aspect not in SUPPORTED_ASPECT:
        errors.append("brief.aspect must be one of 9:16, 16:9, 3:4, 1:1")
    elif type(width) is int and type(height) is int and height > 0:
        if abs(width / height - SUPPORTED_ASPECT[aspect]) > .005:
            errors.append("output resolution does not match brief.aspect")
    if output.get("container") != "mp4" or output.get("videoCodec") != "h264":
        errors.append("currently documented episode target is mp4 / h264")
    if not data.get("title") or not data.get("projectId"):
        errors.append("title and projectId are required")

    originals = load_json(STUDIO / "src/catalog/manifest.json")
    quality = load_json(STUDIO / "src/catalog/quality.json")
    references = load_json(STUDIO / "external/catalog.json")
    own_by_id = {x["id"]: x for x in originals["components"]}
    ext_by_id = {x["id"]: x for x in references}

    scenes = data.get("scenes")
    if not isinstance(scenes, list) or not 1 <= len(scenes) <= 60:
        errors.append("scenes must contain 1..60 shots")
        scenes = []
    seen = set()
    cursor = 0
    for i, scene in enumerate(scenes, 1):
        if not isinstance(scene, dict):
            errors.append(f"scene {i} must be an object")
            continue
        name = scene.get("id")
        if not isinstance(name, str) or not name.strip() or name in seen:
            errors.append(f"scene {i}: missing/duplicate id")
        seen.add(name)
        start, duration = scene.get("startFrame"), scene.get("durationFrames")
        if type(start) is not int or start != cursor:
            errors.append(f"scene {name}: startFrame must equal {cursor}")
        if type(duration) is not int or duration <= 0:
            errors.append(f"scene {name}: durationFrames must be positive integer")
        else:
            cursor += duration
        if not isinstance(scene.get("narrationText"), str) or not scene["narrationText"].strip():
            errors.append(f"scene {name}: narrationText is required")
        if not isinstance(scene.get("props"), dict):
            errors.append(f"scene {name}: props must be an object")
        lib, cid = scene.get("library"), scene.get("componentId")
        if lib == "originals":
            if cid not in own_by_id:
                errors.append(f"scene {name}: unknown LW component {cid}")
            elif quality.get(cid, {}).get("renderStatus") != "passed":
                errors.append(f"scene {name}: LW component {cid} not render-tested")
            elif quality.get(cid, {}).get("visualReviewStatus") != "passed":
                warnings.append(f"scene {name}: {cid} technical render passed but visual approval is pending")
        elif lib == "references":
            ref = ext_by_id.get(cid)
            if not ref:
                errors.append(f"scene {name}: unknown external component {cid}")
            elif not (ref.get("executable") is True and ref.get("renderStatus") == "passed"
                      and bool(ref.get("adapter")) and bool(ref.get("license"))):
                errors.append(f"scene {name}: external component {cid} is reference-only/not verified")
        else:
            errors.append(f"scene {name}: library must be originals or references")

        assets = scene.get("assets", [])
        if not isinstance(assets, list):
            errors.append(f"scene {name}: assets must be a list")
        else:
            for j, asset in enumerate(assets, 1):
                if not isinstance(asset, dict) or not asset.get("usageRights") or not asset.get("source"):
                    errors.append(f"scene {name}: asset {j} requires source and usageRights")
                elif phase == "render" and not (p := resolve_media(asset.get("path"), episode_path.parent)):
                    errors.append(f"scene {name}: asset {j} has no file path")
                elif phase == "render" and not p.is_file():
                    errors.append(f"scene {name}: asset {j} file missing")

    if type(frames) is int and frames != cursor:
        errors.append(f"totalFrames {frames} does not equal scene timeline {cursor}")
    if type(fps) is int and fps > 0 and type(frames) is int:
        duration = frames / fps
        target = brief.get("durationTargetSeconds")
        if type(target) in (int, float) and abs(target - duration) > 3:
            warnings.append(f"timeline duration {duration:.2f}s differs from target {target}s")

    if phase == "render":
        voice = data.get("narration") or {}
        captions = data.get("subtitles") or {}
        if voice.get("status") != "ready":
            errors.append("narration.status must be ready (actual recorded/TTS audio)")
        if captions.get("status") != "ready":
            errors.append("subtitles.status must be ready (actual timed subtitles)")
        for obj, key in [(voice, "audioPath"), (voice, "alignmentPath"), (captions, "filePath")]:
            file = resolve_media(obj.get(key), episode_path.parent)
            if not file or not file.is_file():
                errors.append(f"missing real media/timing file: {key}")
        if not voice.get("usageRights"):
            errors.append("narration.usageRights is required")
        music = data.get("backgroundMusic") or {}
        if music.get("status") == "ready":
            p = resolve_media(music.get("filePath"), episode_path.parent)
            if not p or not p.is_file() or not music.get("license"):
                errors.append("background music needs licensed existing file")
        caps_path = STUDIO / "production/capabilities.json"
        if not caps_path.is_file():
            errors.append("no verified multi-scene/audio/caption production runtime; v0.2 exports silent single components")
        else:
            caps = load_json(caps_path)
            for flag in ("multiScene", "narrationAudio", "captions", "renderVerified"):
                if caps.get(flag) is not True:
                    errors.append(f"production runtime capability not verified: {flag}")
            if aspect not in caps.get("verifiedAspects", []):
                errors.append(f"production runtime has not verified aspect {aspect}")
    else:
        warnings.append("plan check only: not a rendered-video or audio acceptance test")

    return {
        "phase": phase, "file": str(episode_path), "projectId": data.get("projectId"),
        "shots": len(scenes), "totalFrames": cursor, "errors": errors,
        "warnings": warnings, "status": "blocked" if errors else ("plan-ready" if phase == "plan" else "render-inputs-ready")
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="LW episode storyboard preflight (no video rendering)")
    parser.add_argument("episode", type=Path, help="Path to an episode.json manifest")
    parser.add_argument("--phase", choices=("plan", "render"), default="plan")
    parser.add_argument("--report", type=Path, help="Optional JSON report path")
    args = parser.parse_args()
    try:
        episode = args.episode.expanduser().resolve(strict=True)
        report = inspect_episode(episode, args.phase)
    except (OSError, ValueError, json.JSONDecodeError, KeyError, TypeError) as exc:
        report = {"phase": args.phase, "status": "blocked", "errors": [str(exc)], "warnings": []}
    text = json.dumps(report, ensure_ascii=False, indent=2)
    print(text)
    if args.report:
        dest = args.report.expanduser().resolve()
        if dest == args.episode.expanduser().resolve():
            raise ValueError("report must not overwrite episode input")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(text + "\n", encoding="utf-8")
    return 2 if report["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
