"""Regression tests for FredTalk batch source/adapt/selection/fingerprint inputs."""
from __future__ import annotations

import json
import sys
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
        self.assertTrue(body)
        self.assertEqual(L.sha256_bytes(body), sha)
        self.assertEqual(channel, "api")
        self.assertEqual(len(calls), 1)

    def test_fetch_asset_rejects_tampered_payload(self):
        payload = b"tampered"
        sha = "a" * 64

        def fake_get(url, timeout=45, retries=2):
            return 200, payload

        with mock.patch.object(L, "http_get", side_effect=fake_get):
            L._ASSET_MEMO.clear()
            channel, body = L.fetch_asset(sha)
        self.assertEqual((channel, body), ("", b""))


class AutoProfileTests(unittest.TestCase):
    def test_symbol_and_defaults_from_kit_entry(self):
        p = adapt.auto_kit_profile(row("FT-T09q-287"))
        self.assertEqual(p["entryFile"], "components/T09q-JumpCutMarks.tsx")
        self.assertEqual(p["entryExport"], "JumpCutMarks")
        self.assertEqual(p["defaultsExport"], "jumpCutMarksDefaults")
        self.assertEqual(p["strategy"], "kit-overlay")

    def test_episode_component_without_kit_files_is_skipped(self):
        with self.assertRaisesRegex(ValueError, "kit/theme.ts or kit/ui.tsx"):
            adapt.auto_kit_profile(row("FT-T05q-250"))

    def test_selection_skips_existing_round1_and_incomplete(self):
        selected, skipped = adapt.select_auto_kit(inventory(), limit=200)
        ids = {p["lwId"] for p in selected}
        self.assertNotIn("FT-T03e-414", ids)          # existing baseline component
        self.assertFalse(ids & {x["lwId"] for x in adapt.load_profiles()})
        self.assertEqual(len(selected), 122)
        self.assertEqual({s["lwId"] for s in skipped}, {"FT-T05q-250", "FT-T17i-272", "FT-T20u-279"})
        self.assertTrue(all("kit" in s["reason"] or "imports unresolved" in s["reason"] for s in skipped))

    def test_selection_is_deterministic_and_limited(self):
        first, _ = adapt.select_auto_kit(inventory(), limit=20)
        again, _ = adapt.select_auto_kit(inventory(), limit=20)
        self.assertEqual([p["lwId"] for p in first], [p["lwId"] for p in again])
        self.assertEqual(len(first), 20)


class ActuallyRunIntegrationTests(unittest.TestCase):
    """Cheap orchestration checks; real rendering is exercised by batch.py in CI."""

    def test_dry_run_writes_plan_without_adapting(self):
        run_id = "unittest-dry"
        rc = adapt.run_auto_kit(3, run_id, dry_run=True, include_adapted=False)
        self.assertEqual(rc, 0)
        plan = json.loads((adapt.RUNS / run_id / "plan.json").read_text())
        self.assertEqual(plan["count"], 3)
        self.assertTrue(all(c["lwId"].startswith("FT-") for c in plan["components"]))
        self.assertEqual(plan["selection"].count("kit-overlay"), 1)


if __name__ == "__main__":
    unittest.main()
