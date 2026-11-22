"""Regression tests for FredTalk batch source/adapt/selection/fingerprint inputs.

Most tests use a small synthetic kit fixture so they pass in a fresh clone with
no downloaded source cache. One opt-in test checks the real 432-row inventory
once `inventory.py` has populated `.cache/sources`.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))

import adapt
import ftlib as L


def inventory():
    return L.load_json(L.BATCH / "inventory.json")


def row(lw_id: str):
    return next(r for r in inventory() if r["lwId"] == lw_id)


def make_row(lw_id="FT-TEST-901", ft_id="T09q", with_kit=True):
    files = [
        {
            "label": "T09q-JumpCutMarks.tsx",
            "path": "source/src/components/T09q-JumpCutMarks.tsx",
            "cachePath": "sources/FIXTURE/source/src/components/T09q-JumpCutMarks.tsx",
            "channel": "api",
            "status": "verified",
            "actualSha256": "entry-sha",
        }
    ]
    if with_kit:
        for label, rel in [("theme.ts", "source/src/kit/theme.ts"), ("ui.tsx", "source/src/kit/ui.tsx")]:
            files.append({
                "label": label,
                "path": rel,
                "cachePath": f"sources/FIXTURE/{rel}",
                "channel": "api",
                "status": "verified",
                "actualSha256": f"{label}-sha",
            })
    return {
        "lwId": lw_id,
        "ftId": ft_id,
        "name": "fixture component",
        "category": "讲解段落",
        "upstream": {"nativeFrames": 180, "fps": 30},
        "source": {"files": files, "declaredFiles": len(files), "verifiedFiles": len(files), "complete": True},
        "dependencies": {"localImports": [], "missing": [], "media": []},
        "params": {"defaultsName": "jumpCutMarksDefaults", "keys": ["label"]},
        "adaptation": {"strategy": "kit-overlay", "entryPath": files[0]["path"]},
    }


class Fixture:
    def __init__(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        cache = self.root / "cache"
        (cache / "sources/FIXTURE/source/src/components").mkdir(parents=True)
        (cache / "sources/FIXTURE/source/src/kit").mkdir(parents=True)
        (cache / "sources/FIXTURE/source/src/components/T09q-JumpCutMarks.tsx").write_text(
            "import {S} from '../kit/theme';\n"
            "import {Frame} from '../kit/ui';\n"
            "export const jumpCutMarksDefaults = {label: 'x'};\n"
            "export function JumpCutMarks(props: {label?: string}) { return null; }\n"
        )
        (cache / "sources/FIXTURE/source/src/kit/theme.ts").write_text("export const S = {};\n")
        (cache / "sources/FIXTURE/source/src/kit/ui.tsx").write_text("export const Frame = () => null;\n")
        self.cache = cache
        self.patches = [
            mock.patch.object(L, "CACHE", cache),
            mock.patch.object(adapt, "ADAPTED", self.root / "adapted"),
            mock.patch.object(adapt, "RUNS", self.root / "runs"),
            mock.patch.object(adapt, "AUTO_PROFILES", self.root / "auto.json"),
        ]
        for p in self.patches:
            p.start()

    def close(self):
        for p in reversed(self.patches):
            p.stop()
        self.tmp.cleanup()


class SourceFetchTests(unittest.TestCase):
    def test_fetch_asset_accepts_matching_sha(self):
        payload = b"export const X = 1;\n"
        sha = L.sha256_bytes(payload)
        calls = []

        def fake_get(url, timeout=45, retries=2):
            calls.append(url)
            return 200, payload

        with mock.patch.object(L, "http_get", side_effect=fake_get):
            L._ASSET_MEMO.clear()
            channel, body = L.fetch_asset(sha)
        self.assertEqual(L.sha256_bytes(body), sha)
        self.assertEqual(channel, "api")
        self.assertEqual(len(calls), 1)

    def test_fetch_asset_rejects_tampered_payload(self):
        payload = b"tampered"

        def fake_get(url, timeout=45, retries=2):
            return 200, payload

        with mock.patch.object(L, "http_get", side_effect=fake_get):
            L._ASSET_MEMO.clear()
            channel, body = L.fetch_asset("a" * 64)
        self.assertEqual((channel, body), ("", b""))


class AutoProfileTests(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()

    def tearDown(self):
        self.fx.close()

    def test_symbol_and_defaults_from_kit_entry(self):
        p = adapt.auto_kit_profile(make_row())
        self.assertEqual(p["entryFile"], "components/T09q-JumpCutMarks.tsx")
        self.assertEqual(p["entryExport"], "JumpCutMarks")
        self.assertEqual(p["defaultsExport"], "jumpCutMarksDefaults")
        self.assertEqual(p["strategy"], "kit-overlay")

    def test_component_without_kit_files_is_skipped(self):
        with self.assertRaisesRegex(ValueError, "kit/theme.ts or kit/ui.tsx"):
            adapt.auto_kit_profile(make_row("FT-TEST-902", with_kit=False))

    def test_entry_missing_imports_are_rejected(self):
        entry = self.fx.cache / "sources/FIXTURE/source/src/components/T09q-JumpCutMarks.tsx"
        entry.write_text("import {Missing} from '../components/missing';\nexport function JumpCutMarks() { return null; }\n")
        with self.assertRaisesRegex(ValueError, "imports unresolved"):
            adapt.auto_kit_profile(make_row())

    def test_selection_skips_incomplete_and_adapted(self):
        rows = [
            make_row("FT-TEST-901"),
            make_row("FT-TEST-902", with_kit=False),
            make_row("FT-TEST-903"),
        ]
        adapted = self.fx.root / "adapted/FT-TEST-903"
        adapted.mkdir(parents=True)
        (adapted / "provenance.json").write_text("{}")
        selected, skipped = adapt.select_auto_kit(rows, limit=10)
        self.assertEqual([p["lwId"] for p in selected], ["FT-TEST-901"])
        self.assertEqual([s["lwId"] for s in skipped], ["FT-TEST-902"])

    def test_selection_is_deterministic_and_limited(self):
        rows = [make_row(f"FT-TEST-{i:03d}") for i in range(1, 6)]
        first, _ = adapt.select_auto_kit(rows, limit=2)
        again, _ = adapt.select_auto_kit(rows, limit=2)
        self.assertEqual([p["lwId"] for p in first], [p["lwId"] for p in again])
        self.assertEqual(len(first), 2)

    def test_existing_baseline_is_never_selected(self):
        row = make_row("FT-T03e-414", "T03e")
        selected, _ = adapt.select_auto_kit([row], limit=10)
        self.assertEqual(selected, [])


class ActuallyRunIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()

    def tearDown(self):
        self.fx.close()

    def test_dry_run_writes_plan_without_adapting(self):
        batch = self.fx.root / "batch"
        batch.mkdir()
        (batch / "inventory.json").write_text(json.dumps([make_row()]))
        with mock.patch.object(L, "BATCH", batch):
            rc = adapt.run_auto_kit(3, "unittest-dry", dry_run=True, include_adapted=False)
            self.assertEqual(rc, 0)
            plan = json.loads((self.fx.root / "runs/unittest-dry/plan.json").read_text())
        self.assertEqual(plan["count"], 1)
        self.assertEqual(plan["components"][0]["entryExport"], "JumpCutMarks")


class RealInventoryTests(unittest.TestCase):
    @unittest.skipUnless((L.CACHE / "sources").is_dir(), "source cache absent; run inventory.py first")
    def test_real_kit_selection_against_432_inventory(self):
        selected, skipped = adapt.select_auto_kit(inventory(), limit=200)
        ids = {p["lwId"] for p in selected}
        self.assertNotIn("FT-T03e-414", ids)
        self.assertFalse(ids & {x["lwId"] for x in adapt.load_profiles()})
        self.assertGreaterEqual(len(selected), 120)
        self.assertEqual({s["lwId"] for s in skipped}, {"FT-T05q-250", "FT-T17i-272", "FT-T20u-279"})


if __name__ == "__main__":
    unittest.main()
