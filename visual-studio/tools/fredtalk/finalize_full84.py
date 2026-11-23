#!/usr/bin/env python3
"""Finalize LWFT-FULL-84 after the workbench export acceptance run.

Steps (all evidence-driven, no fabricated verdicts):
  1. Copy the workbench export result into batches/ so promote_candidates.py
     and full_library_status.py can read it.
  2. Run the existing dual-gate promotion (human visual pass + workbench
     export pass) for the 66 machine-QA-pass candidates.
  3. Restore the temporary preview authorization on the 18 candidates whose
     machine QA is not-tested/fail. They must NOT stay executable=true just
     because the server needed that flag to render them.
  4. Print a before/after catalog summary.
"""
import json
import pathlib
import shutil
import subprocess
import sys

VS = pathlib.Path(__file__).resolve().parents[2]
BATCH = VS / "external" / "fredtalk" / "batch"
RUN = BATCH / "runs" / "LWFT-FULL-84"
CATALOG = VS / "external" / "catalog.json"


def load(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))


def main() -> int:
    src = RUN / "workbench-export" / "workbench-export.json"
    dst = BATCH / "batches" / "LWFT-FULL-84-workbench-export.json"
    if not src.exists():
        print("ERROR: export result missing:", src)
        return 1
    shutil.copyfile(src, dst)
    exp = load(src)
    results = exp.get("results", {})
    ok = sum(1 for v in results.values() if v.get("status") == "pass")
    print(f"export results: {len(results)} records, {ok} pass, {len(results)-ok} fail")

    cat = load(CATALOG)
    by = {c["id"]: c for c in cat}
    plan = load(RUN / "plan.json")
    promote_ids = [c["lwId"] for c in plan["components"]]
    reviews = load(BATCH / "batches" / "LWFT-FULL-84-reviews.json")["reviews"]

    # dual gate: both must be pass
    eligible = [i for i in promote_ids
                if (reviews.get(i) or {}).get("status") == "pass"
                and (results.get(i) or {}).get("status") == "pass"]
    print(f"dual-gate eligible: {len(eligible)} / {len(promote_ids)}")

    # preview-authorized ids = every id that was temporarily flipped
    auth = load(pathlib.Path(__file__).resolve().parents[3] / "review" / "LWFT-FULL-84" / "preview-authorization.json")
    auth_ids = set(auth["ids"])
    hold = [i for i in auth_ids if i not in set(eligible)]

    # promote (existing engine, single source of truth for catalog fields)
    r = subprocess.run([sys.executable, str(VS / "tools" / "fredtalk" / "promote_candidates.py"),
                        "--run-id", "LWFT-FULL-84"], cwd=VS)
    print("promote_candidates exit:", r.returncode)

    # restore the non-promoted preview flags to their recorded originals
    cat = load(CATALOG)
    by = {c["id"]: c for c in cat}
    restored = 0
    for i in hold:
        c = by.get(i)
        if not c:
            continue
        before = auth["before"].get(i, {})
        c["executable"] = before.get("executable", False)
        c["adapter"] = before.get("adapter")
        c["installStatus"] = before.get("installStatus", "source-not-installed")
        c["renderStatus"] = before.get("renderStatus", "not-tested")
        c["reviewStatus"] = before.get("reviewStatus")
        c["candidateState"] = before.get("candidateState")
        for k in ["workbenchExport", "workbenchExportEvidence", "humanReview", "localSourcePath"]:
            c.pop(k, None)
        restored += 1
    CATALOG.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("restored preview-only flags:", restored)

    total = sum(1 for c in cat if c.get("executable"))
    ft = sum(1 for c in cat if str(c.get("id", "")).startswith("FT-") and c.get("executable"))
    print(json.dumps({"catalogExecutable": total, "fredtalkExecutable": ft,
                      "promoted": len(eligible), "held": len(hold)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
