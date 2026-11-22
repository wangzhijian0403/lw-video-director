"""No-network unit checks for the full-library adapter orchestration."""
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
import run_all

VS = HERE.parents[1]
SRC = VS / "src/references/fredtalk-registry.generated.tsx"
DATA = VS / "src/references/fredtalk-registry.data.json"


class BulkRunTests(unittest.TestCase):
    def test_isolated_registry_has_only_requested_components(self):
        source = SRC.read_text(encoding="utf-8")
        records = json.loads(DATA.read_text(encoding="utf-8"))
        ids = {entry["id"] for entry in records[:2]}
        content, filtered = run_all.isolate_registry(source, records, ids)
        self.assertEqual(len(filtered), 2)
        self.assertEqual(len([l for l in content.splitlines() if l.startswith("import {Adapter as A")]), 2)
        self.assertEqual(len([l for l in content.splitlines() if l.strip().startswith("{adapter:A")]), 2)
        self.assertEqual({e["id"] for e in filtered}, ids)

    def test_unknown_id_fails_closed(self):
        source = SRC.read_text(encoding="utf-8")
        records = json.loads(DATA.read_text(encoding="utf-8"))
        with self.assertRaises(ValueError):
            run_all.isolate_registry(source, records, {"FT-DOES-NOT-EXIST"})

    def test_catalog_not_equated_with_renderable(self):
        inv = json.loads((VS / "external/fredtalk/batch/inventory.json").read_text(encoding="utf-8"))
        by_strategy = {}
        for entry in inv:
            s = entry["adaptation"]["strategy"]
            by_strategy[s] = by_strategy.get(s, 0) + 1
        self.assertEqual(len(inv), 432)
        self.assertEqual(by_strategy["kit-overlay"], 135)
        self.assertEqual(by_strategy["blocked-dependency"], 284)
        self.assertEqual(by_strategy["standalone"] + by_strategy["standalone-module"], 13)


if __name__ == "__main__":
    unittest.main()
