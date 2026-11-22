#!/usr/bin/env python3
"""FredTalk source-backed bulk pipeline.

Uses the existing source-verified kit adapter and Remotion renderer. Rebuilds
batches on rerun, uses renderer input fingerprints, and restarts Chromium between
chunks. No official preview URL is treated as executable source.
"""
from __future__ import annotations

import argparse
import collections
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
VS = HERE.parents[1]
sys.path.insert(0, str(HERE))

import adapt
import ftlib as L


def read(path: Path, fallback=None):
    if not path.is_file():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def call(cmd: list[str], env: dict | None = None) -> int:
    print("\n$ " + " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=VS, env=env or os.environ.copy(), check=False).returncode


def main() -> int:
    ap = argparse.ArgumentParser(description="Run all source-eligible FredTalk kit components in restartable batches")
    ap.add_argument("--run-id", default=datetime.now(timezone.utc).strftime("fred-all-%Y%m%d-%H%M%S"))
    ap.add_argument("--batch-size", type=int, default=10, help="renderer restarts after each chunk, no hardcoded total")
    ap.add_argument("--max-items", type=int, default=None, help="optional development smoke; omit to select all")
    ap.add_argument("--dry-run", action="store_true", help="inventory + plan only; no adapt or rendering")
    ap.add_argument("--refresh-inventory", action="store_true", help="refetch declared pinned public source, never login")
    ap.add_argument("--skip-render", action="store_true", help="adapt only; NOT a QA pass")
    ap.add_argument("--browser", default=None, help="path to Chromium/Chrome for Remotion")
    ap.add_argument("--retry-failures", type=int, default=1, choices=[0, 1, 2])
    args = ap.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,96}", args.run_id):
        ap.error("run-id must contain letters, numbers, dots, dashes or underscores only")
    if args.batch_size < 1 or args.batch_size > 30:
        ap.error("batch-size must be 1..30 to limit Chromium crash cascades")
    if args.max_items is not None and args.max_items < 1:
        ap.error("max-items must be positive")

    if args.refresh_inventory or not L.BATCH.joinpath("inventory.json").exists():
        rc = call([sys.executable, str(HERE / "inventory.py")])
        if rc:
            print("Inventory retrieval failed. Stop: do not guess source availability.", file=sys.stderr)
            return rc
    rows = read(L.BATCH / "inventory.json", [])
    # A Git clone ships the manifest but not the verified source cache. A real
    # render run must populate it; dry-run can still count theoretical candidates.
    if not args.dry_run and not args.refresh_inventory:
        cached = sum(
            1 for r in rows for f in r.get("source", {}).get("files", [])
            if f.get("cachePath") and (L.CACHE / f["cachePath"]).is_file()
        )
        if cached == 0:
            print("Fresh checkout: fetching the pinned public source inventory before adaptation")
            rc = call([sys.executable, str(HERE / "inventory.py")])
            if rc:
                return rc
            rows = read(L.BATCH / "inventory.json", [])
    if len(rows) != 432:
        print(f"Inventory has {len(rows)} rows, expected 432; stop rather than silently ignore items.", file=sys.stderr)
        return 2

    by_id = {r["lwId"]: r for r in rows}
    if len(by_id) != len(rows):
        print("Duplicate/missing FredTalk IDs in inventory", file=sys.stderr)
        return 2
    strategies = dict(collections.Counter(r.get("adaptation", {}).get("strategy", "unknown") for r in rows))
    theoretical = [r for r in rows if r.get("adaptation", {}).get("strategy") == "kit-overlay"]
    theoretical_count = len(theoretical)
    if args.dry_run:
        candidates = theoretical[:args.max_items] if args.max_items is not None else theoretical
    else:
        candidates, _ = adapt.select_auto_kit(rows, limit=args.max_items, include_adapted=True)
        if not candidates:
            print("No source-backed profiles resolved. Re-run with --refresh-inventory to rebuild the verified cache.", file=sys.stderr)
            return 2
    output = adapt.RUNS / args.run_id
    output.mkdir(parents=True, exist_ok=True)
    overview = {
        "runId": args.run_id,
        "catalogCount": len(rows),
        "sourceStrategies": strategies,
        "kitSelected": len(candidates),
        "kitStrategyCandidates": theoretical_count,
        "cacheVerifiedSelection": not args.dry_run,
        "skipCount": len(rows) - len(candidates),
        "stages": {"inventory": "pass", "adapt": "not-run", "render": "not-run", "machineQa": "not-run", "humanVisual": "pending"},
        "notSourceReady": [
            {"id": r["lwId"], "strategy": r["adaptation"]["strategy"], "reason": r["adaptation"].get("blockedReason")}
            for r in rows if r["lwId"] not in {c["lwId"] for c in candidates}
        ],
    }
    write(output / "inventory-summary.json", overview)
    print(f"catalog={len(rows)}, kit-candidates={len(candidates)}, not-kit={overview['skipCount']} strategies={strategies}")
    if args.dry_run:
        overview["stages"]["adapt"] = "eligibility-plan-only"
        overview["note"] = "Offline catalog classification; no source cache inspection, adaptation, MP4 rendering or QA."
        write(output / "all-summary.json", overview)
        return 0

    rc_adapt = adapt.run_auto_kit(args.max_items, args.run_id, False, True)
    adaptation = read(output / "adapt-status.json", {})
    failures = {x["lwId"]: x.get("error") for x in adaptation.get("results", []) if x.get("status") != "adapted"}
    ready_ids = {x["lwId"] for x in adaptation.get("results", []) if x.get("status") == "adapted"}
    plan = read(output / "plan.json", {})
    components = [c for c in plan.get("components", []) if c["lwId"] in ready_ids]
    overview["stages"]["adapt"] = "pass" if rc_adapt == 0 else "partial"
    overview["adapted"] = len(components)
    overview["adaptFailures"] = failures

    if args.skip_render:
        overview["stages"]["render"] = "skipped-by-request"
        write(output / "all-summary.json", overview)
        return 0 if rc_adapt == 0 else 1
    node = shutil.which("node")
    if not node:
        print("Node.js is missing. Adapted files retained but NOT render-verified.", file=sys.stderr)
        return 2
    env = os.environ.copy()
    if args.browser:
        env["LW_BROWSER"] = args.browser
    passes, render_fail, machine_fail = set(), {}, {}
    batch_results = []
    for offset in range(0, len(components), args.batch_size):
        chunk = components[offset:offset + args.batch_size]
        batch_id = f"{args.run_id}-part-{offset // args.batch_size + 1:03d}"
        batch_dir = adapt.RUNS / batch_id
        subplan = {**plan, "runId": batch_id, "count": len(chunk), "components": chunk, "skipped": []}
        write(batch_dir / "plan.json", subplan)
        rc = call([node, str(HERE / "render_batch.mjs"), "--plan", str(batch_dir / "plan.json")], env)
        render = read(batch_dir / "render-summary.json", {"failed": [], "rendered": [], "skipped": []})
        attempted = [x["lwId"] for x in chunk]
        for attempt in range(args.retry_failures):
            failed = [x["id"] for x in render.get("failed", [])]
            if not failed:
                break
            print(f"{batch_id}: retry #{attempt + 1} ({len(failed)} failed) in fresh renderer process")
            call([node, str(HERE / "render_batch.mjs"), "--plan", str(batch_dir / "plan.json"), "--only", *failed, "--force"], env)
            st = read(batch_dir / "status.json", {})
            still_failed = [id for id in attempted if st.get(id, {}).get("render") != "pass"]
            if not still_failed:
                break
        state = read(batch_dir / "status.json", {})
        render_fail.update({id: state.get(id, {}).get("error", "missing render result") for id in attempted if state.get(id, {}).get("render") != "pass"})
        # Machine QA separately, including failures, so result codes never get invented.
        qa_rc = call([sys.executable, str(HERE / "qa_media.py"), "--run-id", batch_id])
        quality = read(batch_dir / "qa-summary.json", [])
        for row in quality:
            cid = row.get("id")
            if cid not in attempted:
                continue
            if row.get("machineStatus") == "pass" and state.get(cid, {}).get("render") == "pass":
                passes.add(cid)
            else:
                machine_fail[cid] = row.get("notes", "machine QA failed")
        batch_results.append({
            "runId": batch_id, "selected": len(chunk), "rendered": sum(state.get(id, {}).get("render") == "pass" for id in attempted),
            "machinePassed": sum(id in passes for id in attempted), "qaExit": qa_rc, "initialRenderExit": rc,
        })
        write(output / "all-summary.json", {
            **overview, "batches": batch_results, "technicalPassed": len(passes),
            "renderFailureCount": len(render_fail), "machineFailureCount": len(machine_fail),
            "stages": {**overview["stages"], "render": "in-progress", "machineQa": "in-progress"},
        })

    ledger = []
    for r in rows:
        cid = r["lwId"]
        if cid in passes:
            status, reason = "machine-pass-needs-human-review", ""
        elif cid in failures:
            status, reason = "adapt-failed", failures[cid]
        elif cid in render_fail:
            status, reason = "render-failed", render_fail[cid]
        elif cid in machine_fail:
            status, reason = "machine-qa-failed", machine_fail[cid]
        elif cid in ready_ids:
            status, reason = "not-verified", "missing complete render+QA evidence"
        else:
            status, reason = "not-kit-ready", r.get("adaptation", {}).get("blockedReason")
        ledger.append({"id": cid, "strategy": r["adaptation"]["strategy"], "status": status, "reason": reason, "humanVisual": "pending"})
    overview.update({
        "batches": batch_results, "technicalPassed": len(passes),
        "adaptFailureCount": len(failures), "renderFailureCount": len(render_fail),
        "machineFailureCount": len(machine_fail),
        "stages": {**overview["stages"], "render": "partial" if render_fail else "pass", "machineQa": "partial" if machine_fail or render_fail else "pass"},
        "note": "Machine pass only. This command never auto-promotes or merges unreviewed FredTalk into production.",
    })
    write(output / "all-summary.json", overview)
    write(output / "all-components.json", ledger)
    print(f"\nDONE: {len(passes)} source-backed videos passed machine checks; "
          f"{len(failures)} adapt fails, {len(render_fail)} renderer fails, "
          f"{len(machine_fail)} QA fails. Human visual review remains pending.")
    return 0 if not failures and not render_fail and not machine_fail else 1


if __name__ == "__main__":
    raise SystemExit(main())
