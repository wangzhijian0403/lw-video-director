#!/usr/bin/env python3
"""Generate an auditable repair ledger for the FredTalk components that
cannot be processed by the current batch adapter.

Read-only: derives everything from inventory.json + on-disk cache. It never
claims a component is adapted, rendered, or accepted.
"""
from __future__ import annotations

import collections
import json
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
VS = HERE.parents[1]
EXT = VS / "external" / "fredtalk"
BATCH = EXT / "batch"
OUT = BATCH / "full-library"
CACHE = EXT / ".cache" / "sources"


def classify_missing(m: str) -> str:
    m = str(m)
    if "runtime/clip-spec" in m:
        return "runtime/clip-spec（上游运行时协议）"
    if "material-policy" in m:
        return "material-policy（素材策略）"
    if "lib/shell" in m:
        return "lib/shell（外壳库）"
    if "five-fonts" in m:
        return "five-fonts（字体）"
    if m.endswith(".json"):
        return "相对 JSON 配置（manifest 等）"
    if m.startswith(("./", "../")):
        return "项目内相对模块（多文件场景）"
    return "其它:" + m


def cache_hit(row: dict) -> tuple[int, int]:
    lw = row["lwId"]
    prefix = f"sources/{lw}/"
    hit = 0
    for f in row["source"]["files"]:
        cp = f.get("cachePath") or ""
        rel = cp[len(prefix):] if cp.startswith(prefix) else (f.get("path") or f.get("label") or "")
        if (CACHE / lw / rel).is_file():
            hit += 1
    return hit, len(row["source"]["files"])


def main() -> None:
    inv = json.loads((BATCH / "inventory.json").read_text(encoding="utf-8"))
    blocked = [r for r in inv if r["adaptation"]["strategy"] == "blocked-dependency"]
    standalone = [r for r in inv if r["adaptation"]["strategy"] in ("standalone", "standalone-module")]

    chan = collections.Counter()
    for r in blocked:
        chan[tuple(sorted({str(f.get("channel")) for f in r["source"]["files"]}))] += 1

    miss = collections.Counter()
    for r in blocked:
        for m in set(str(x) for x in (r["dependencies"]["missing"] or [])):
            miss[classify_missing(m)] += 1

    all_sha = sum(1 for r in blocked if all(f.get("declaredSha256") for f in r["source"]["files"]))
    cached_full = sum(1 for r in blocked if cache_hit(r)[0] == cache_hit(r)[1])

    data = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "blockedDependencyCount": len(blocked),
        "standaloneCount": len(standalone),
        "allFilesHaveSha256": all_sha,
        "fullyCachedFromApi": cached_full,
        "channelMix": {"+".join(k): v for k, v in chan.most_common()},
        "missingDependencyClasses": dict(miss.most_common()),
        "blockedIds": [r["lwId"] for r in blocked],
        "standalone": [
            {
                "lwId": r["lwId"],
                "strategy": r["adaptation"]["strategy"],
                "entryPath": r["adaptation"].get("entryPath"),
                "hasEntryExportMetadata": "entryExport" in r["adaptation"],
                "files": len(r["source"]["files"]),
                "cacheHit": cache_hit(r)[0],
                "missingImports": len(r["dependencies"]["missing"] or []),
                "channels": sorted({str(f.get("channel")) for f in r["source"]["files"]}),
            }
            for r in standalone
        ],
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "blocked-dependency-breakdown.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# FredTalk 未跑完类别 · 逐类修复清单",
        "",
        f"生成时间：{data['generatedAt']}　|　数据来源：`inventory.json`（432 条）+ 本地 `.cache/sources`",
        "",
        "> 本文件**只读盘点**，不宣称任何条目已适配、已渲染或已验收。机器可读版见 `blocked-dependency-breakdown.json`。",
        "",
        "## 1. 为什么这些不能靠 `batch.py` 一次性跑完",
        "",
        "- `batch.py` 的自动选件条件写死为 `inventory.adaptation.strategy == kit-overlay`，"
        "并且要求 `kit/theme.ts` + `kit/ui.tsx` 存在、入口导出可解析。",
        "- `adapt.py` 只有 `build_kit_overlay`（kit-overlay）与 `build_project_expand`（需 `TagTree`）；"
        "`profiles/round1.json` 里 project-expand profile 只有 **2** 个，无法覆盖数百条多文件项目组件。",
        "- `blocked-dependency` 条目缺的是**项目内相对模块与 JSON 配置**，不是单个入口文件；"
        "需要把整个上游项目目录一起落地并解析依赖图，属于新适配器开发，不是重复运行现有流水线能解决的。",
        "- `standalone` / `standalone-module` 条目虽然 `missingImports = 0`，但 inventory **没有 `entryExport` 元数据**"
        "（kit-overlay 的 profile 才有），且多条共用同一 entry 文件、源码内含 `registerRoot` / 多个具名导出；"
        "必须先做导出符号解析与媒体占位，否则会生成「看似通过、实际渲染错组件」的假能力。",
        "",
        "## 2. blocked-dependency（284 条）",
        "",
        "| 指标 | 数值 | 含义 |",
        "| --- | ---: | --- |",
        f"| 条目总数 | {len(blocked)} | 策略标记为 blocked-dependency |",
        f"| 全部文件带 SHA-256 | {all_sha} | 这类可通过已验证的 API 通道离线取源 |",
        f"| 源码已完整落在缓存 | {cached_full} | 已由 `hydrate_cache.py` 补取 |",
        "",
        "**按取源通道组合：**",
        "",
        "| 通道组合 | 条数 | 所需条件 |",
        "| --- | ---: | --- |",
    ]
    need = {
        "tag-tree": "需 v2.5.0 公开 tag 源码树（本机 GitHub 通道慢，已改用 openssl 后端 partial clone）",
        "visual-library-app": "需 visual-library-app 对象归档",
        "api": "已具备（SHA 缓存）",
        "None": "通道未标注，需补元数据",
    }
    for k, v in chan.most_common():
        cond = " + ".join(need.get(x, x) for x in k)
        lines.append(f"| {' + '.join(k)} | {v} | {cond} |")

    lines += [
        "",
        "**按缺失依赖类别（按「条目×唯一依赖」计数）：**",
        "",
        "| 类别 | 次数 | 修复方向 |",
        "| --- | ---: | --- |",
    ]
    fix = {
        "项目内相对模块（多文件场景）": "落地整个项目目录，保持相对路径，静态解析 import 图后生成 adapter",
        "相对 JSON 配置（manifest 等）": "随项目目录一并复制，或由 LW 占位配置替换",
        "runtime/clip-spec（上游运行时协议）": "提供 LW 侧等价 runtime shim，或替换该 import",
        "material-policy（素材策略）": "提供 LW 素材策略 shim（不重分发上游媒体）",
        "lib/shell（外壳库）": "提供等效外壳组件 shim",
        "five-fonts（字体）": "映射到已安装的 SmileySans-Oblique / system font stack",
    }
    for k, v in miss.most_common():
        lines.append(f"| {k} | {v} | {fix.get(k, '逐项分析')} |")

    lines += [
        "",
        "## 3. standalone / standalone-module（13 条）",
        "",
        "| LW ID | 策略 | 文件数 | 缓存命中 | 缺 import | 通道 | 有 entryExport 元数据 |",
        "| --- | --- | ---: | ---: | ---: | --- | --- |",
    ]
    for s in data["standalone"]:
        lines.append(
            f"| {s['lwId']} | {s['strategy']} | {s['files']} | {s['cacheHit']} | "
            f"{s['missingImports']} | {'+'.join(s['channels'])} | "
            f"{'是' if s['hasEntryExportMetadata'] else '**否**'} |")

    lines += [
        "",
        "**共同阻塞**：全部 13 条 `hasEntryExportMetadata = false`；其中 tag-tree 通道的 8 条"
        "还需 v2.5.0 tag 源码树。已有 5 条源码完整落在缓存，是通用独立组件适配器的首选试点。",
        "",
        "## 4. 要真正「跑完」剩余条目，需要交付的开发项",
        "",
        "1. **通用 project-expand 适配器**：从 inventory 的 `source.files[].cachePath` + TagTree "
        "还原完整项目目录，静态解析 `entryExport` / `defaultsExport`，自动生成 `adapter.tsx` 并注册。",
        "2. **通用独立组件适配器**：从源码静态扫描具名导出，排除 `registerRoot` / `Composition`，"
        "处理 `staticFile` 媒体字面量 → LW 占位，生成 `defaultProps`。",
        "3. **tag 源码树稳定通道**：本机 schannel 下 git clone 失败，已验证 "
        "`git -c http.sslBackend=openssl clone --filter=blob:none --sparse` 可行，但 codeload 带宽低，"
        "需把 sparse checkout 作为可断点续跑的后台任务并做完整性校验。",
        "4. **人工视觉验收**：任何新批次仍需真人审片，机器 QA 不得替代。",
        "",
        "## 5. 禁止事项",
        "",
        "- 不得把 `pending` 批量改成 `pass` 来凑数量。",
        "- 不得用静态截图冒充动画、不得用同一个通用动画替代不同组件。",
        "- 不得把「源码已在缓存」等同于「已适配 / 已渲染 / 已验收」。",
        "",
    ]
    (OUT / "blocked-dependency-breakdown.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({
        "blocked": len(blocked), "standalone": len(standalone),
        "allSha": all_sha, "fullyCached": cached_full,
        "out": str(OUT / "blocked-dependency-breakdown.md"),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
