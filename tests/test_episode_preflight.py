"""Regression tests for the Skill production manifest gate (stdlib only).

Run from repository root:
  python -m unittest discover -s tests -p "test_episode_preflight.py"
"""
from __future__ import annotations
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAMPLE = ROOT / "templates/episode-manifest.example.json"
TOOL = ROOT / "scripts/episode_preflight.py"


def check(path: Path, phase: str):
    result = subprocess.run(
        [sys.executable, str(TOOL), str(path), "--phase", phase],
        cwd=ROOT, capture_output=True, text=True, encoding="utf-8"
    )
    return result.returncode, json.loads(result.stdout)


class EpisodePreflightTests(unittest.TestCase):
    def test_template_is_valid_plan_but_not_render_ready(self):
        code, report = check(SAMPLE, "plan")
        self.assertEqual(code, 0, report)
        self.assertEqual(report["shots"], 8)
        self.assertEqual(report["totalFrames"], 1350)
        self.assertEqual(report["status"], "plan-ready")
        code, report = check(SAMPLE, "render")
        self.assertEqual(code, 2, report)
        self.assertEqual(report["status"], "blocked")
        self.assertTrue(any("narration" in error for error in report["errors"]))
        self.assertTrue(any("production runtime" in error for error in report["errors"]))

    def test_preflight_rejects_timeline_gap(self):
        content = json.loads(SAMPLE.read_text(encoding="utf-8"))
        content["scenes"][1]["startFrame"] += 1
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "episode.json"
            path.write_text(json.dumps(content, ensure_ascii=False), encoding="utf-8")
            code, report = check(path, "plan")
        self.assertEqual(code, 2, report)
        self.assertTrue(any("startFrame" in error for error in report["errors"]))

    def test_preflight_rejects_unverified_external(self):
        content = json.loads(SAMPLE.read_text(encoding="utf-8"))
        content["scenes"][0]["library"] = "references"
        content["scenes"][0]["componentId"] = "FT-T05q-250"
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "episode.json"
            path.write_text(json.dumps(content, ensure_ascii=False), encoding="utf-8")
            code, report = check(path, "plan")
        self.assertEqual(code, 2, report)
        self.assertTrue(any("reference-only/not verified" in error for error in report["errors"]))


if __name__ == "__main__":
    unittest.main()
