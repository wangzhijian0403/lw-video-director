"""Build the machine-readable 432-row inventory.

Usage:
    python3 tools/fredtalk/inventory.py            # full run (fetch + analyse)
    python3 tools/fredtalk/inventory.py --no-fetch # reuse the local cache
"""
from __future__ import annotations

import argparse
import collections
import csv
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import ftlib as L

STRATEGY_LABEL = {
    "kit-overlay": "Kit 覆盖层（主题/字体/音效宿主替换）",
    "shared-kit": "独立 shared 组件集（需重建共享模块与素材）",
    "standalone": "自包含单文件组件",
    "standalone-module": "自包含多文件组件",
    "manual": "需人工判定入口",
    "blocked-source": "源码不可匿名获取",
    "blocked-dependency": "依赖文件缺失",
}


def load_status() -> dict:
    p = L.BATCH / "status.json"
    return L.load_json(p) if p.exists() else {}


def analyse(item: dict, files: list[L.ResolvedSource], entries: list[L.ResolvedSource]) -> dict:
    available = {(f.declared_path or f.label): f for f in files if f.local}
    paths = list(available.keys())
    root = L.project_root_for(p for p in paths if p.endswith((".tsx", ".ts", ".jsx", ".js")))
    by_local = {(f.declared_path or f.label): f for f in files if f.local}

    entry = entries[0] if entries else None
    missing: list[str] = []
    imported_local: list[str] = []
    visited: set[str] = set()

    def walk(path: str) -> None:
        if path in visited:
            return
        visited.add(path)
        rec = available.get(path)
        if not rec or not rec.local or rec.local.suffix not in (".tsx", ".ts", ".jsx", ".js"):
            return
        for spec in L.import_specs(rec.local):
            if not spec.startswith("."):
                continue
            imported_local.append(spec)
            norm = os.path.normpath(os.path.join(os.path.dirname(path), spec)).replace("\\", "/")
            if norm in ("kit/theme", "kit/ui", "../kit/theme", "../kit/ui") or norm.endswith("/kit/theme") or norm.endswith("/kit/ui"):
                continue
            resolved = L.resolve_local_import(spec, path, set(available.keys()), root)
            if resolved:
                walk(resolved)
            else:
                missing.append(spec)

    if entry and (entry.declared_path or entry.label) in available:
        walk(entry.declared_path or entry.label)

    if not missing and entry:
        strategy, note = L.classify(item, files, [], entries)
    else:
        strategy, note = ("blocked-dependency", "local imports unresolved: " + ", ".join(sorted(set(missing))[:6]))

    media = L.media_refs([available[p] for p in visited if p in available])
    defaults_name, param_keys = (None, [])
    if entry and entry.local:
        defaults_name, param_keys = L.extract_defaults_keys(entry.local)
    if not param_keys:
        for rec in files:
            if rec.local and rec.local.suffix in (".tsx", ".ts"):
                name, keys = L.extract_defaults_keys(rec.local)
                if keys:
                    defaults_name, param_keys = name, keys
                    break

    if strategy == "kit-overlay" and not missing:
        auto = True
    elif strategy in ("standalone", "standalone-module") and not missing:
        auto = True
    else:
        auto = False

    return {
        "entryPath": (entry.declared_path or entry.label) if entry else None,
        "entrySymbol": None,
        "entryFile": str(entry.local.relative_to(L.CACHE)) if entry and entry.local else None,
        "projectRoot": root,
        "localImports": sorted(set(imported_local)),
        "missingImports": sorted(set(missing)),
        "mediaRefs": media,
        "defaultsName": defaults_name,
        "paramKeys": param_keys,
        "strategy": strategy,
        "strategyLabel": STRATEGY_LABEL.get(strategy, strategy),
        "autoEligible": auto,
        "blockedReason": note,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-fetch", action="store_true", help="reuse cached sources only")
    ap.add_argument("--only", nargs="*", help="restrict to these FredTalk labels")
    args = ap.parse_args()

    tag = None if args.no_fetch else L.ensure_tag_tree(L.default_tag_root())
    status = load_status()
    lw_rows = {r["id"]: r for r in L.lw_items()}
    rows = []
    file_rows = []

    for item in L.upstream_items():
        label = item["label"]
        if args.only and label not in args.only:
            continue
        lw_id = L.lw_id_for(label)
        lw = lw_rows.get(lw_id or "", {})
        if args.no_fetch:
            # reconstruct ResolvedSource from the previous manifest
            pass
        else:
            files = L.resolve_item_sources(item, tag)
        entries = L.entry_candidates(item, files) if not args.no_fetch else []
        a = analyse(item, files, entries) if not args.no_fetch else {}

        impl = item.get("implementation", {})
        existing = status.get(lw_id or "", {})
        row = {
            "lwId": lw_id,
            "ftId": label,
            "name": item["title"],
            "category": item["category"],
            "purpose": item["description"],
            "sceneTypes": item.get("sceneTypes", []),
            "upstream": {
                "revision": L.REVISION,
                "publicTag": L.PUBLIC_TAG,
                "officialUrl": "https://www.fred-fu.com/visual-library",
                "sourcePage": item.get("matching", {}).get("sourceId"),
                "compositionId": impl.get("compositionId"),
                "nativeFrames": impl.get("durationInFrames"),
                "fps": impl.get("fps"),
                "width": impl.get("width"),
                "height": impl.get("height"),
                "reuseBoundary": impl.get("reuseBoundary"),
            },
            "source": {
                "declaredFiles": len(item.get("sources", [])),
                "verifiedFiles": sum(1 for f in files if f.local) if not args.no_fetch else 0,
                "channels": sorted({f.channel for f in files if f.channel}) if not args.no_fetch else [],
                "complete": bool(files) and all(f.local for f in files) if not args.no_fetch else False,
                "files": [f.as_dict() for f in files] if not args.no_fetch else [],
            },
            "dependencies": {
                "localImports": a.get("localImports", []),
                "missing": a.get("missingImports", []),
                "media": a.get("mediaRefs", []),
            },
            "rights": {
                "firstPartyCode": "MIT (FredTalk owner grant 2026-10-13; upstream docs/license-scope.md)",
                "dependencyLicenses": "React/Remotion retain their own licenses",
                "thirdPartyMedia": "not covered by MIT; reference-derived media requires separate clearance",
                "font": "SmileySans-Oblique OFL-1.1 (bundled by LW host, not relicensed)",
                "audio": "upstream SFX omitted in LW host (silent component)",
                "attribution": "FredTalk component library; not marked as LW original",
            },
            "params": {
                "hasEditableParams": bool(a.get("paramKeys")),
                "defaultsName": a.get("defaultsName"),
                "keys": a.get("paramKeys", []),
                "source": "upstream defaults literal (lexical scan)",
            },
            "adaptation": {
                "strategy": a.get("strategy"),
                "strategyLabel": a.get("strategyLabel"),
                "autoEligible": a.get("autoEligible", False),
                "entryPath": a.get("entryPath"),
                "adapted": existing.get("adapted", lw.get("installStatus") == "source-adapted-verified"),
                "rendered": existing.get("rendered", lw.get("renderStatus") == "passed"),
                "visualReview": existing.get("visualReview", "not-reviewed"),
                "blockedReason": a.get("blockedReason"),
                "evidence": existing.get("evidence"),
            },
        }
        rows.append(row)
        for f in row["source"]["files"]:
            file_rows.append({
                "lwId": lw_id, "ftId": label, "category": item["category"],
                "label": f["label"], "path": f["path"], "declaredSha256": f["declaredSha256"],
                "actualSha256": f["actualSha256"], "bytes": f["bytes"], "status": f["status"],
                "channel": f["channel"], "url": f["url"],
            })
        print(f"{label:16} {lw_id or '-':16} {row['source']['verifiedFiles']}/{row['source']['declaredFiles']} "
              f"{a.get('strategy',''):24} {len(a.get('missingImports', []))} missing")

    L.dump_json(L.BATCH / "inventory.json", rows)
    L.dump_json(L.BATCH / "source-manifest.json", file_rows)
    write_reports(rows)
    print(f"\ninventory rows: {len(rows)}")
    print(collections.Counter(r["adaptation"]["strategy"] for r in rows))
    print(collections.Counter((r["category"], r["source"]["complete"]) for r in rows))
    return 0


def write_reports(rows: list[dict]) -> None:
    counts = collections.Counter(r["adaptation"]["strategy"] for r in rows)
    cats = collections.Counter(r["category"] for r in rows)
    md = ["# FredTalk 432 条源码与适配状态清单", "",
          f"上游版本：`{L.REVISION}`（公开 tag `{L.PUBLIC_TAG}`）", "",
          "## 汇总", "", "| 指标 | 数量 |", "| --- | --- |",
          f"| 目录条目 | {len(rows)} |",
          f"| 至少一个文件实取 | {sum(1 for r in rows if r['source']['verifiedFiles'])} |",
          f"| 全部声明文件实取 | {sum(1 for r in rows if r['source']['complete'])} |",
          f"| 具备可编辑参数 | {sum(1 for r in rows if r['params']['hasEditableParams'])} |",
          f"| 已渲染通过 | {sum(1 for r in rows if r['adaptation']['rendered'])} |", "",
          "## 类别分布", "", "| 类别 | 条目 | 全部文件实取 |", "| --- | --- | --- |"]
    for cat, n in cats.most_common():
        ok = sum(1 for r in rows if r["category"] == cat and r["source"]["complete"])
        md.append(f"| {cat} | {n} | {ok} |")
    md += ["", "## 适配策略", "", "| 策略 | 条目 |", "| --- | --- |"]
    for k, n in counts.most_common():
        md.append(f"| {STRATEGY_LABEL.get(k, k)} | {n} |")
    md += ["", "## 逐条状态", "",
           "| LW ID | FredTalk | 类别 | 源码 | 可编辑参数 | 策略 | 已接入 | 已渲染 | 阻塞原因 |",
           "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for r in rows:
        src = f"{r['source']['verifiedFiles']}/{r['source']['declaredFiles']}"
        md.append("| {lw} | {ft} | {cat} | {src} | {pk} | {st} | {ad} | {rd} | {why} |".format(
            lw=r["lwId"] or "-", ft=r["ftId"], cat=r["category"], src=src,
            pk="yes" if r["params"]["hasEditableParams"] else "-",
            st=r["adaptation"]["strategy"], ad="yes" if r["adaptation"]["adapted"] else "-",
            rd="yes" if r["adaptation"]["rendered"] else "-",
            why=(r["adaptation"]["blockedReason"] or "").replace("|", "/")[:120]))
    (L.BATCH / "inventory.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    with (L.BATCH / "inventory.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["lwId", "ftId", "category", "name", "declaredFiles", "verifiedFiles", "complete",
                    "strategy", "autoEligible", "paramKeys", "mediaRefs", "adapted", "rendered",
                    "visualReview", "blockedReason"])
        for r in rows:
            w.writerow([r["lwId"], r["ftId"], r["category"], r["name"],
                        r["source"]["declaredFiles"], r["source"]["verifiedFiles"], r["source"]["complete"],
                        r["adaptation"]["strategy"], r["adaptation"]["autoEligible"],
                        ";".join(r["params"]["keys"]), ";".join(r["dependencies"]["media"]),
                        r["adaptation"]["adapted"], r["adaptation"]["rendered"],
                        r["adaptation"]["visualReview"], r["adaptation"]["blockedReason"] or ""])


if __name__ == "__main__":
    raise SystemExit(main())
