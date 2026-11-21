"""Write verified batch results back into the LW external catalog.

Only components that actually rendered a real MP4 and passed QA become
executable. Official preview MP4s are never used as component evidence.
"""
from __future__ import annotations

import json
from pathlib import Path

VS = Path(__file__).resolve().parents[2]
CAT = VS / "external" / "catalog.json"
STATUS = VS / "external" / "fredtalk" / "batch" / "status.json"
STAMP = "2026-11-22"


def main() -> int:
    catalog = json.loads(CAT.read_text())
    status = json.loads(STATUS.read_text())
    changed = 0
    for entry in catalog:
        if entry.get("provider") != "FredTalk":
            continue
        st = status.get(entry["id"])
        if entry["id"] == "FT-T03e-414":
            continue
        if not st or st.get("render") != "pass":
            continue
        entry["executable"] = True
        entry["adapter"] = "fred-batch"
        entry["installStatus"] = "source-adapted-verified"
        entry["renderStatus"] = "passed"
        entry["previewUrl"] = None
        entry["localSourcePath"] = f"external/fredtalk/adapted/{entry['id']}/src/adapter.tsx"
        entry["renderEvidence"] = f"external/fredtalk/batch/evidence/{entry['id']}/qa.json"
        entry["sourceAccess"] = "anonymous-download-sha256+public-tag-v2.5.0"
        entry["adaptationStrategy"] = st["strategy"]
        props_file = VS / "external" / "fredtalk" / "adapted" / entry["id"] / "props.json"
        entry["editableKeys"] = json.loads(props_file.read_text()).get("editableKeys", []) if props_file.exists() else []
        entry["adaptedAt"] = STAMP
        entry["adapterVersion"] = "fredtalk-batch-1"
        lic = entry.get("license", "")
        if "LW host adaptation" not in lic:
            entry["license"] = lic + "; LW host adaptation (fonts/SFX/brand removed; upstream media not redistributed)"
        changed += 1
    CAT.write_text(json.dumps(catalog, ensure_ascii=False, indent=1) + "\n")
    print(f"catalog updated: {changed} executable FredTalk batch components")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
