"""True automatic batch entry point.

    python3 tools/fredtalk/batch.py --next 20

Selection is read from inventory: kit-overlay components whose kit/theme.ts and
kit/ui.tsx were fetched, whose real entry export resolves, and whose entry
imports all resolve.  It never relies on hand-written per-component profiles.
The run writes its videos under batch/runs/<runId>/ so they stay out of git.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
VS = HERE.parents[1]
sys.path.insert(0, str(HERE))

import adapt


def run(cmd: list[str], label: str) -> int:
    print(f"\n== {label} ==\n$ {' '.join(cmd)}")
    proc = subprocess.run(cmd, cwd=str(VS), env=os.environ.copy())
    if proc.returncode:
        print(f"{label} exited {proc.returncode}")
    return proc.returncode


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--next", dest="next_count", type=int, default=20, help="number of components to select")
    ap.add_argument("--run-id", default=None)
    ap.add_argument("--skip-render", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    run_id = args.run_id or datetime.now(timezone.utc).strftime("auto-%Y%m%d-%H%M%S")
    plan = adapt.RUNS / run_id / "plan.json"

    adapt_rc = adapt.run_auto_kit(args.next_count, run_id, args.dry_run, False)
    if args.dry_run:
        return adapt_rc

    node = shutil.which("node")
    if not node:
        print("node not found")
        return 2
    if not args.skip_render:
        render_rc = run([node, str(HERE / "render_batch.mjs"), "--plan", str(plan), *(["--force"] if args.force else [])], "render")
    else:
        render_rc = 0
    qa_rc = run([sys.executable, str(HERE / "qa_media.py"), "--run-id", run_id], "machine QA")
    report_rc = run([sys.executable, str(HERE / "report.py"), "--run-id", run_id], "acceptance report")
    if args.skip_render:
        return adapt_rc
    return max(adapt_rc, render_rc, qa_rc, report_rc)


if __name__ == "__main__":
    raise SystemExit(main())
