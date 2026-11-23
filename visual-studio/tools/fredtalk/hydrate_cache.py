"""LW-FT-FULL-001 / Stage A2: hydrate the source cache without touching evidence.

Problem found in the real Windows run: ``batch.py --next 20 --dry-run`` selected
0 of 135 kit-overlay candidates because ``external/fredtalk/.cache/sources`` was
empty on this machine (the cache is gitignored, so it never ships with a clone).
Every row failed with "no exported component symbol" -- the adapter could not
read the real upstream entry files.

This script re-fetches ONLY the missing cache objects, using the repository's
own ``ftlib.fetch_asset`` (SHA-256 verified, public anonymous mirrors). It:
  * writes ONLY under ``.cache/sources/<LW-ID>/<cachePath>`` (gitignored);
  * NEVER overwrites a file whose SHA already matches;
  * NEVER rewrites inventory.json / status.json / any evidence or review record;
  * records a full per-object result so failures stay visible.

Usage:
    python3 tools/fredtalk/hydrate_cache.py --workers 8
    python3 tools/fredtalk/hydrate_cache.py --dry-run     # report only
"""
from __future__ import annotations

import argparse
import collections
import concurrent.futures as futures
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import ftlib as L


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=None, help="fetch at most N unique SHAs (smoke test)")
    args = ap.parse_args()

    inv = L.load_json(L.BATCH / "inventory.json")
    # One job per unique declared SHA. cachePath is relative to L.CACHE.
    jobs: dict[str, list[Path]] = collections.defaultdict(list)
    no_sha = 0
    for row in inv:
        for f in row["source"]["files"]:
            sha = f.get("declaredSha256")
            cp = f.get("cachePath")
            if not cp:
                continue
            target = L.CACHE / cp
            if not sha:
                no_sha += 1
                continue
            if target.exists() and sha256_bytes(target.read_bytes()) == sha:
                continue  # already valid, never overwrite
            jobs[sha].append(target)

    print(f"unique SHAs needing fetch : {len(jobs)}")
    print(f"cache objects to write    : {sum(len(v) for v in jobs.values())}")
    print(f"files without declared SHA: {no_sha} (tag-tree channel, handled separately)")
    if args.limit:
        jobs = dict(list(jobs.items())[: args.limit])
        print(f"--limit applied: {len(jobs)} SHAs")
    if args.dry_run:
        print("dry-run: no network, no writes")
        return 0

    results = []

    def fetch_one(sha: str):
        channel, body = L.fetch_asset(sha)
        ok = bool(body) and sha256_bytes(body) == sha
        return sha, channel, body, ok

    done = 0
    with futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        fut_map = {pool.submit(fetch_one, sha): (sha, targets)
                   for sha, targets in jobs.items()}
        for fut in futures.as_completed(fut_map):
            sha, targets = fut_map[fut]
            try:
                _sha, channel, body, ok = fut.result()
            except Exception as exc:  # noqa: BLE001
                results.append({"sha": sha, "status": "error", "error": f"{type(exc).__name__}: {exc}",
                                "targets": [str(t.relative_to(L.CACHE)) for t in targets]})
                continue
            if not ok:
                results.append({"sha": sha, "status": "fetch-failed", "channel": channel,
                                "targets": [str(t.relative_to(L.CACHE)) for t in targets]})
                continue
            written = []
            for t in targets:
                if t.exists() and sha256_bytes(t.read_bytes()) == sha:
                    written.append({"path": str(t.relative_to(L.CACHE)), "action": "already-valid"})
                    continue
                t.parent.mkdir(parents=True, exist_ok=True)
                # Guard: never clobber a differing existing file.
                if t.exists():
                    alt = t.with_name(t.stem + "-" + sha[:8] + t.suffix)
                    alt.write_bytes(body)
                    written.append({"path": str(alt.relative_to(L.CACHE)), "action": "wrote-alternate"})
                else:
                    t.write_bytes(body)
                    written.append({"path": str(t.relative_to(L.CACHE)), "action": "wrote"})
            results.append({"sha": sha, "status": "ok", "channel": channel,
                            "bytes": len(body), "files": written})
            done += 1
            if done % 25 == 0:
                print(f"  fetched {done}/{len(jobs)} unique SHAs ...")

    ok = sum(1 for r in results if r["status"] == "ok")
    failed = [r for r in results if r["status"] != "ok"]
    report = {
        "kind": "LW-FT-FULL-001 cache hydration",
        "uniqueShasRequested": len(jobs),
        "uniqueShasFetched": ok,
        "uniqueShasFailed": len(failed),
        "cacheObjectsWritten": sum(len([f for f in r.get("files", []) if f["action"].startswith("wrote")])
                                   for r in results if r["status"] == "ok"),
        "filesWithoutDeclaredSha": no_sha,
        "results": results,
    }
    out = L.BATCH / "full-library" / "cache-hydration.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nfetched OK : {ok}/{len(jobs)}")
    print(f"failed     : {len(failed)}")
    if failed:
        print("first failures:")
        for r in failed[:8]:
            print("  ", r["sha"][:16], r["status"], r.get("error", r.get("channel", "")))
    print("report     :", out)
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
