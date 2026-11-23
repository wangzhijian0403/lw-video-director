#!/usr/bin/env python3
"""Driver for the LWFT-FULL-84 workbench export acceptance.

Runs the existing workbench_export.py once with the full id list so the
workbench server is started only once and all renders stay serial (two
concurrent Chrome renders previously caused OOM / FFmpeg aborts).
"""
import json
import os
import pathlib
import subprocess
import sys

VS = pathlib.Path(__file__).resolve().parents[2]
IDS_FILE = VS / "external" / "fredtalk" / "batch" / "runs" / "LWFT-FULL-84" / "export-ids.json"
OUT = VS / "external" / "fredtalk" / "batch" / "runs" / "LWFT-FULL-84" / "workbench-export"


def main() -> int:
    ids = json.loads(IDS_FILE.read_text(encoding="utf-8"))
    env = dict(os.environ)
    env["LW_PORT"] = "4199"
    env["LW_BROWSER"] = "C:/Program Files/Google/Chrome/Application/chrome.exe"
    cmd = [sys.executable, str(VS / "tools" / "fredtalk" / "workbench_export.py"),
           "--ids", *ids, "--run-id", "LWFT-FULL-84", "--out", str(OUT)]
    print(f"exporting {len(ids)} components, out={OUT}", flush=True)
    r = subprocess.run(cmd, cwd=VS, env=env)
    print("workbench_export exit:", r.returncode, flush=True)
    return r.returncode


if __name__ == "__main__":
    raise SystemExit(main())
