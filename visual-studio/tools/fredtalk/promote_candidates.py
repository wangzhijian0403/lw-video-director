#!/usr/bin/env python3
"""Promote batch candidates only after human visual review + workbench export.

Rules:
- status=pass AND workbench export=pass -> executable production candidate.
- status=conditional -> keep in dev preview, not executable, until re-review.
- status=rework/fail -> keep in dev preview, not executable.
Never use machine QA alone to promote.
"""
import argparse, json, pathlib

VS = pathlib.Path(__file__).resolve().parents[2]
BATCH = VS / "external" / "fredtalk" / "batch"
CATALOG = VS / "external" / "catalog.json"


def load(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-id", default="batch-20")
    args = ap.parse_args()
    plan = load(BATCH / "runs" / args.run_id / "plan.json")
    review_path = BATCH / "runs" / args.run_id / "reviews.json"
    if not review_path.exists():
        review_path = BATCH / "batches" / f"{args.run_id}-reviews.json"
    reviews = load(review_path).get("reviews", {})
    wb_path = BATCH / "batches" / f"{args.run_id}-workbench-export.json"
    wb = (load(wb_path).get("results") if wb_path.exists() else {}) or {}
    cat = load(CATALOG)
    changed = 0
    for c in plan["components"]:
        cid = c["lwId"]
        e = next((x for x in cat if x["id"] == cid), None)
        if not e:
            print("missing catalog entry", cid)
            continue
        rec = reviews.get(cid, {"status": "pending"})
        status = rec.get("status", "pending")
        e["reviewStatus"] = status
        e["humanReview"] = f"external/fredtalk/batch/batches/{args.run_id}-reviews.json"
        e["localSourcePath"] = f"external/fredtalk/adapted/{cid}/src/adapter.tsx"
        e["adapter"] = "fred-batch"
        e["renderStatus"] = "passed"
        if status == "pass" and (wb.get(cid) or {}).get("status") == "pass":
            e["executable"] = True
            e["installStatus"] = "source-adapted-verified"
            e["workbenchExport"] = "pass"
            e["workbenchExportEvidence"] = f"external/fredtalk/batch/batches/{args.run_id}-workbench-export.json"
            e["candidateState"] = "workbench-export-verified"
            e["renderEvidence"] = f"external/fredtalk/batch/runs/{args.run_id}/evidence/{cid}/render.mp4"
        else:
            e["executable"] = False
            e["installStatus"] = "source-adapted-preview"
            e["candidateState"] = "dev-preview-conditional" if status == "conditional" else "dev-preview"
            e["renderEvidence"] = f"external/fredtalk/batch/runs/{args.run_id}/evidence/{cid}/render.mp4"
        changed += 1
    CATALOG.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"runId": args.run_id, "updated": changed,
                      "executable": sum(1 for e in cat if e.get("executable"))}, ensure_ascii=False))


if __name__ == "__main__":
    raise SystemExit(main())
