#!/usr/bin/env python3
"""只读扫描：把 blocked-dependency / candidate-not-adapted 条目在 tag tree 里
定位到完整项目目录，评估通用 project-expand 适配器的可覆盖面。不修改任何文件。"""
from __future__ import annotations
import json, re, sys
from pathlib import Path

VS = Path(__file__).resolve().parents[2]
EXT = VS / "external" / "fredtalk"
CACHE = EXT / ".cache"
TAGROOT = CACHE / "upstream-v2.5.0" / "components" / "projects"
INV = EXT / "batch" / "inventory.json"
SCOPE = Path("D:/Codex工作目录/lw-video-director/references/fredtalk-full-library-data/active-library-scope.json")

def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))

def main():
    inv = load(INV)
    scope = load(SCOPE)
    byid = {r["lwId"]: r for r in inv}
    targets = scope["blockedDependencyIds"] + scope["candidateNotAdaptedIds"]

    # 建立 tag tree 内每个项目 pid -> 目录 的索引，以及 basename 全局索引
    project_dirs: dict[str, list[Path]] = {}
    by_name: dict[str, list[Path]] = {}
    for d in TAGROOT.iterdir() if TAGROOT.exists() else []:
        if not d.is_dir():
            continue
        pid = d.name
        bases = [d]
        nested = d / pid
        if nested.is_dir():
            bases.append(nested)
        project_dirs.setdefault(pid, []).extend(bases)
    for f in TAGROOT.rglob("*"):
        if f.is_file() and ".git" not in f.parts:
            by_name.setdefault(f.name, []).append(f)

    report = []
    for lid in targets:
        r = byid.get(lid)
        if not r:
            report.append({"lwId": lid, "status": "no-inventory"})
            continue
        ep = (r.get("adaptation") or {}).get("entryPath") or ""
        srcfiles = r.get("source", {}).get("files", [])
        declared = [f.get("path", "") for f in srcfiles]
        # 找入口 basename
        ep_name = Path(ep).name
        # 1) 缓存源码目录
        cachedir = CACHE / "sources" / lid
        cached_files = [str(f.relative_to(cachedir)).replace("\\", "/") for f in cachedir.rglob("*") if f.is_file()] if cachedir.exists() else []
        # 2) tag tree 里按 basename 找候选，优先跟 declared path 后缀匹配
        cands = by_name.get(ep_name, []) if ep_name else []
        exact = []
        for f in cands:
            rel = f.as_posix()
            for d in declared:
                if d and rel.endswith(d.replace("\\", "/")):
                    exact.append(f)
                    break
        best = (exact or cands)
        proj = None
        src_dir = None
        project_file_count = 0
        if best:
            fc = best[0]
            fpath = fc.as_posix()
            m = re.search(r"/components/projects/([^/]+)/", fpath)
            if m:
                proj = m.group(1)
            # 从入口文件往上找名为 src 的祖先目录（剧集按 sources/<ep>/src/ 组织）
            cur = fc.parent
            while cur != cur.parent and cur.name != "src":
                cur = cur.parent
            if cur.name == "src" and cur.is_dir():
                src_dir = cur
                project_file_count = len([f for f in src_dir.rglob("*") if f.is_file() and f.suffix in (".tsx", ".ts", ".json", ".css")])
        report.append({
            "lwId": lid,
            "name": r.get("name", "")[:40],
            "strategy": (r.get("adaptation") or {}).get("strategy"),
            "entryPath": ep,
            "entryName": ep_name,
            "cachedFileCount": len(cached_files),
            "tagCandidates": len(cands),
            "tagExact": len(exact),
            "project": proj,
            "srcDir": str(src_dir.relative_to(VS)) if src_dir else None,
            "projectSrcFiles": project_file_count,
            "status": "reachable" if project_file_count > 0 else ("entry-only" if cands else "unreachable"),
        })

    from collections import Counter
    print("targets", len(targets))
    print("status", Counter(x["status"] for x in report))
    print("reachable by strategy", Counter(x.get("strategy") for x in report if x["status"] == "reachable"))
    out = VS / "external" / "fredtalk" / "batch" / "generic-scan.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("report ->", out)
    # 打印不可达样本
    for x in report:
        if x["status"] != "reachable":
            print("  ", x["status"], x["lwId"], x.get("entryName"), x.get("strategy"))

if __name__ == "__main__":
    main()
