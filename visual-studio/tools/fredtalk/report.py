"""Build per-component status + acceptance report.

Machine QA and human visual review are separate fields and separate counts.
A structurally valid MP4 never implies that the visuals were approved.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

VS = Path(__file__).resolve().parents[2]
EXT = VS / "external" / "fredtalk"
BATCH = EXT / "batch"
INV = json.loads((BATCH / "inventory.json").read_text())
REG = json.loads((VS / "src/references/fredtalk-registry.data.json").read_text())
ROUND1 = json.loads((BATCH / "round1.json").read_text()) if (BATCH / "round1.json").exists() else {"items": []}
HUMAN_FILE = BATCH / "runs" / "batch-20" / "reviews.json"
WB_FILE = BATCH / "runs" / "batch-20" / "workbench-export" / "workbench-export.json"
REVIEWS1 = json.loads((BATCH / "reviews-round1.json").read_text()) if (BATCH / "reviews-round1.json").exists() else {"reviews": {}}

LIMITS = {
    "FT-RC02-471": "ROI（x/y/w/h）与录屏画面强相关，无法跨素材通用；每换一段录屏必须重设。",
    "FT-T12d-407": "宿主字体为 OFL 斜体，字距比上游 MiSans 紧；如需大字可加 0.02–0.05em 字距。",
    "FT-T09n-374": "数字滚轮按宿主字宽做了 0.62em→1.0em 的源内补丁，已记入 provenance。",
    "FT-OP03-467": "上游目录只登记 3 个文件，必须整项目展开才能编译；共享层已宿主化。",
    "FT-T05a-436": "上游 before/after 图不随 MIT 分发；只能使用用户自有素材或 LW 占位图。",
    "FT-T20a2-405": "上游 12 张作品图不随 MIT 分发；参数只接受用户自有图片数组。",
}

PARAM_PROOF = {
    "FT-T03e-414": "标题/步骤/强调色/高亮/速度",
    "FT-T09s-289": "截图/截图尺寸/点击坐标/缩放/结论/高亮词/遮罩",
    "FT-T12d-407": "阶段文字/强调字/焦点/底图",
    "FT-T12l-337": "章节号/小标签/标题/圆心",
    "FT-T20f-395": "视频/起点/标题/高亮词/角标",
    "FT-OP03-467": "视频 src",
    "FT-RC02-471": "视频/起点/ROI/冻结区间",
    "FT-T09n-374": "截图/截图尺寸/遮罩/标签/分钟/前后缀",
    "FT-T14e-378": "三项数字/主角卡",
    "FT-T15a-426": "条目/主角/小数位/前后缀/脚注",
    "FT-T05a-436": "前后图/标签/说明/滑杆停留",
    "FT-T20a2-405": "作品数组/主角序号/钩子/高亮词",
}


def load(p: Path, default=None):
    return json.loads(p.read_text()) if p.exists() else default


def channel_of(row) -> str:
    chans = {f["channel"] for f in row["source"]["files"] if f.get("channel")}
    if "tag-tree" in chans:
        return "tag-tree"
    if chans & {"api", "visual-library-app"}:
        return "sha-assets"
    return "none"


def review_for(cid: str, run_id: str | None) -> dict:
    if run_id:
        run_reviews = load(BATCH / "runs" / run_id / "reviews.json", {}) or load(BATCH / "batches" / f"{run_id}-reviews.json", {}) or {}
        rec = (run_reviews.get("reviews") or {}).get(cid) or load(BATCH / "reviews" / f"{cid}.json", {})
    else:
        rec = REVIEWS1.get("reviews", {}).get(cid, {})
    if not rec:
        return {"status": "pending", "note": "尚未人工审片", "reviewer": None}
    return rec


def component_rows(ids: list[str], evidence: Path, status: dict, run_id: str | None = None) -> list[dict]:
    inv = {r["lwId"]: r for r in INV}
    rows = []
    wb = (load(WB_FILE, {}).get("results") if WB_FILE.exists() else {}) or {}
    for cid in ids:
        inv_row = inv[cid]
        ev = evidence / cid
        qa = load(ev / "qa.json", {}) or {}
        prov = load(EXT / "adapted" / cid / "provenance.json", {}) or {}
        review = review_for(cid, run_id)
        st = status.get(cid, {})
        files = prov.get("files", [])
        sha_ok = all(f.get("sha256") for f in files) if files else all(f["status"] == "verified" for f in inv_row["source"]["files"])
        machine_status = qa.get("machineStatus") or ("pass" if qa.get("checks") and all(v for k, v in qa["checks"].items() if isinstance(v, bool)) else "missing")
        rows.append({
            "id": cid,
            "ftId": inv_row["ftId"],
            "name": inv_row["name"],
            "category": inv_row["category"],
            "strategy": prov.get("strategy", "existing-component"),
            "channel": channel_of(inv_row),
            "files": len(files) or inv_row["source"]["declaredFiles"],
            "sha": sha_ok,
            "params": PARAM_PROOF.get(cid) or ", ".join(inv_row["params"].get("keys", [])),
            "adapted": bool(prov) or cid == "FT-T03e-414",
            "render": st.get("render"),
            "machineQa": machine_status,
            "frames": qa.get("video", {}).get("frames"),
            "fps": qa.get("video", {}).get("fps"),
            "luma": qa.get("checks", {}).get("meanLuma"),
            "motion": qa.get("checks", {}).get("motionMean"),
            "visual": review.get("status", "pending"),
            "vnote": review.get("note", ""),
            "reviewer": review.get("reviewer"),
            "limit": LIMITS.get(cid, inv_row["adaptation"].get("blockedReason") or ""),
            "evidence": f"external/fredtalk/batch/runs/{run_id}/evidence/{cid}/" if run_id else f"external/fredtalk/batch/evidence/{cid}/",
            "error": st.get("error"),
            "inputFingerprint": st.get("inputFingerprint"),
            "license": prov.get("license", {}).get("firstPartyCode", "MIT (FredTalk)") if prov else "MIT (FredTalk)",
            "sourcePatches": len(prov.get("sourcePatches", [])),
            "workbenchExport": (wb.get(cid) or {}).get("status") if run_id == "batch-20" else None,
            "workbenchEditedKey": (wb.get(cid) or {}).get("editedKey") if run_id == "batch-20" else None,
        })
    return rows


def counts(rows: list[dict]) -> dict:
    return {
        "total": len(rows),
        "adapted": sum(1 for r in rows if r["adapted"]),
        "machineQaPass": sum(1 for r in rows if r["machineQa"] == "pass"),
        "machineQaFail": sum(1 for r in rows if r["machineQa"] == "fail"),
        "machineQaMissing": sum(1 for r in rows if r["machineQa"] == "missing"),
        "humanVisualPass": sum(1 for r in rows if r["visual"] in ("pass", "pass-with-note")),
        "humanVisualConditional": sum(1 for r in rows if r["visual"] == "conditional"),
        "humanVisualRework": sum(1 for r in rows if r["visual"] in ("rework", "fail")),
        "humanVisualPending": sum(1 for r in rows if r["visual"] == "pending"),
    }


def table(rows: list[dict]) -> list[str]:
    out = ["| LW ID | 类别 | 策略 | 通道 | 文件 | SHA | 可编辑参数 | 渲染 | 机器QA | 人工视觉 | 帧/fps | 证据 |",
           "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in rows:
        out.append(f"| {r['id']} | {r['category']} | {r['strategy']} | {r['channel']} | {r['files']} | {'✓' if r['sha'] else '—'} | {r['params']} | {r['render'] or '—'} | {r['machineQa']} | {r['visual']} | {r['frames']}/{r['fps']} | `{r['evidence']}` |")
    return out


def write_main() -> None:
    ids = [x["lwId"] for x in ROUND1.get("items", [])] or ["FT-T03e-414"] + [e["id"] for e in REG]
    status = load(BATCH / "status.json", {}) or {}
    rows = component_rows(ids, BATCH / "evidence", status, None)
    new_status = {}
    for r in rows:
        new_status[r["id"]] = {
            "strategy": r["strategy"], "adapted": r["adapted"], "files": r["files"], "shaVerified": r["sha"],
            "render": r["render"], "frames": r["frames"], "fps": r["fps"],
            "machineQa": {"status": r["machineQa"], "luma": r["luma"], "motion": r["motion"]},
            "humanVisualReview": {"status": r["visual"], "note": r["vnote"], "reviewer": r["reviewer"]},
            "limit": r["limit"], "evidence": r["evidence"], "license": r["license"],
        }
    (BATCH / "status.json").write_text(json.dumps(new_status, ensure_ascii=False, indent=2) + "\n")
    c = counts(rows)
    strategies = Counter(x["adaptation"]["strategy"] for x in INV)
    channels = Counter(channel_of(x) for x in INV)
    cats = Counter(x["category"] for x in INV)
    md = ["# FredTalk 全库接入 · 第一轮验收报告\n",
          "分支 `feature/fredtalk-batch-adapter`（基线 PR #6 `feature/resource-adapters-poc`，未改 `main`，未触碰 PR #7《造纸术》）。\n",
          "## 1. 结论（机器与人工分开计数）\n",
          "| 指标 | 数值 | 说明 |\n|---|---|---|",
          f"| 纳入验收组件 | {c['total']} | 六类代表组件 |",
          f"| 机器 QA 通过 | {c['machineQaPass']} | 仅代表解码/帧数/fps/分辨率/黑帧/运动等结构检查 |",
          f"| 人工视觉通过 | {c['humanVisualPass']} | 人工审片记录，见 `reviews-round1.json` |",
          f"| 人工视觉有条件通过 | {c['humanVisualConditional']} | 修复后需按修改参数重渲复审 |",
          f"| 人工视觉待返修 | {c['humanVisualRework']} | 暂不晋级正式生产库，保留开发预览 |",
          f"| 人工视觉待审 | {c['humanVisualPending']} | 机器通过不等于视觉通过 |",
          f"| 真实 Remotion MP4 | {c['machineQaPass']} | 1280×720，h264 |",
          "",
          "> 机器 QA 只证明视频可解码、帧数/fps/分辨率匹配、不是纯黑/纯白且有帧间运动；它**不证明排版、可读性、审美或内容正确**。人工视觉结论单独记录。\n",
          "## 2. 逐组件验收\n"] + table(rows) + [
          "",
          "### 视觉审核备注\n",
          ]
    for r in rows:
        md.append(f"- **{r['id']}**（{r['name']}）：{r['visual']} — {r['vnote']}")
    md += ["", "### 已记录的类别限制\n"]
    for r in rows:
        if r["limit"]:
            md.append(f"- **{r['id']}**：{r['limit']}")
    md += ["", "## 3. 全库 432 条源码与版权状态\n",
           "| 维度 | 数量 | 说明 |\n|---|---|---|",
           f"| 目录条目 | {len(INV)} | 上游 `library/catalog.json` v2.5.0 |",
           f"| 全 SHA 通道 | {channels.get('sha-assets', 0)} | `/api/visual-library/assets/<sha>.txt` 或 `/visual-library-app/objects/<sha>.txt` |",
           f"| 公开 tag 树补全 | {channels.get('tag-tree', 0)} | tag `v2.5.0` 的 `components/projects/**` |",
           f"| 无源码 | {channels.get('none', 0)} | — |",
           "", "适配策略分布：" + "；".join(f"`{k}` {v}" for k, v in strategies.items()) + "。",
           "类别分布：" + "；".join(f"{k} {v}" for k, v in cats.items()) + "。\n",
           "版权口径：FredTalk 第一方代码/工具/模板按 MIT；字体 SmileySans 为 OFL-1.1、按原样打包；音效、图片、截图、录屏、Logo 等媒体不随 MIT，本轮一律不入库，改用 LW 自有占位素材。所有适配组件保留 FredTalk 来源与许可。\n",
           "## 4. 批量适配器\n",
           "- `adapt.py`：`kit-overlay` / `project-expand` / 声明式 `sourcePatches`；`--all-kit --limit N` 从 inventory 自动选件并生成 profile，不依赖手工逐条配置。",
           "- `render_batch.mjs`：真实 Remotion 渲染；`status.json` 存 `inputFingerprint`（适配器版本、生成适配器 SHA、源码 SHA、props、主题、背景、速度、fps、时长）；输入变化自动重渲，`--force` 强制。",
           "- `qa_media.py`：只做机器结构 QA，输出 `machineStatus`，不写人工视觉结论。",
           "- `report.py`：机器 QA 与人工视觉分开计数；人工结论来自 `reviews-round1.json` / `reviews/<id>.json`。",
           "- 新批次视频写入 `batch/runs/<runId>/`，该目录不入库；仓库只保留报告、状态与第一轮 12 条证据。",
           "", "## 5. 下一批自动扩展范围\n",
           f"- `kit-overlay` 中符合“kit 文件齐全 + 入口导出可解析 + 入口 import 可解析”的组件：自动选件，首批 20 条通过 `tools/fredtalk/batch.py --next 20`。",
           "- 三个只登记 `S12/shared`、`Open6/ep` 的成片项目仍属 `blocked-dependency`：需要整项目展开，不进入自动 kit 批次。",
           "- `blocked-dependency` 284 条按 tag 项目分组后做 `project-expand`；`standalone` 13 条独立模板。",
           "", "## 6. 必须特殊处理的范围\n",
           "- 非 kit 共享模块（`shared.tsx`、`FullscreenVideoWindow.tsx`、项目私有 lib）：整项目展开并逐项目核对宿主替换点。",
           "- 数字/里程表类：按宿主字体度量做源内补丁（已示范 T09n）。",
           "- 上游品牌/音效/截图/录屏/作品图：媒体不随 MIT，必须替换。",
           "- ROI、点击坐标等画面强绑定参数：只提供入口，不承诺跨素材通用。",
           "- 16 条 tag 树部分命中：先整项目展开补齐。",
           "", "## 7. 复现\n",
           "```bash", "cd visual-studio", "npm ci", "python3 scripts/install-fred-font.py",
           "python3 tools/fredtalk/inventory.py", "python3 tools/fredtalk/adapt.py",
           "LW_BROWSER=/usr/local/bin/chromium node tools/fredtalk/render_batch.mjs --only FT-T14e-378",
           "python3 tools/fredtalk/qa_media.py --only FT-T14e-378", "python3 tools/fredtalk/report.py", "```",
           "", "新批次：`python3 tools/fredtalk/batch.py --next 20`（自动选件 → 适配 → 渲染 → 机器 QA → 报告）。\n"]
    (BATCH / "round-1-acceptance.md").write_text("\n".join(md) + "\n")
    (BATCH / "round-1-summary.json").write_text(json.dumps({"counts": c, "rows": rows}, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(c, ensure_ascii=False, indent=2))


def write_run(run_id: str) -> None:
    run = BATCH / "runs" / run_id
    plan = load(run / "plan.json", {}) or {}
    ids = [c["lwId"] for c in plan.get("components", [])]
    status = load(run / "status.json", {}) or {}
    rows = component_rows(ids, run / "evidence", status, run_id)
    c = counts(rows)
    skipped = plan.get("skipped", [])
    adapt = load(run / "adapt-status.json", {}) or {}
    failures = [r for r in rows if r["render"] == "fail" or r["machineQa"] == "fail" or not r["adapted"]]
    out_dir = BATCH / "batches"
    out_dir.mkdir(parents=True, exist_ok=True)
    payload = {"runId": run_id, "plan": plan, "counts": c, "rows": rows, "skipped": skipped, "adapt": adapt}
    (out_dir / f"{run_id}-status.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    md = [f"# FredTalk 自动批次 {run_id} · 验收报告\n",
          f"自动选件：`kit-overlay` 且 kit 文件齐全、入口导出与 import 可解析；共选 {plan.get('count', len(ids))} 条。\n",
          "## 1. 结论（机器 QA 与人工视觉分开）\n",
          "| 指标 | 数值 |\n|---|---|",
          f"| 选中 | {plan.get('count', len(ids))} |",
          f"| 适配成功 | {c['adapted']} |",
          f"| 真实 MP4 机器 QA 通过 | {c['machineQaPass']} |",
          f"| 机器 QA 失败 | {c['machineQaFail']} |",
          f"| 人工视觉通过 | {c['humanVisualPass']} |",
          f"| 人工视觉有条件通过 | {c['humanVisualConditional']} |",
          f"| 人工视觉待返修 | {c['humanVisualRework']} |",
          f"| 人工视觉待审 | {c['humanVisualPending']} |",
          f"| 自动选件跳过 | {len(skipped)} |",
          "",
          "> 本批次未做人工视觉审核的部分一律记为 `pending`，不得用机器指标替代。\n",
          "## 2. 逐组件状态\n"] + table(rows) + [
          "", "## 3. 失败与跳过\n"]
    if failures:
        for r in failures:
            md.append(f"- **{r['id']}**：render={r['render']}，machineQA={r['machineQa']}，reason={r.get('error') or '未记录'}")
    else:
        md.append("- 无适配或渲染失败。")
    for s in skipped:
        md.append(f"- 跳过 **{s['lwId']}**：{s['reason']}")
    human_file = BATCH / "runs" / run_id / "reviews.json"
    if not human_file.exists():
        human_file = BATCH / "batches" / f"{run_id}-reviews.json"
    wb_file = BATCH / "batches" / f"{run_id}-workbench-export.json"
    md += ["", "## 4. 人工审核与返修\n"]
    if human_file.exists():
        hv = load(human_file, {}).get("reviews", {})
        for cid, rec in hv.items():
            if rec.get("status") in ("conditional", "rework", "fail"):
                md.append(f"- **{cid}** `{rec['status']}`：{rec.get('note','')}")
        md.append("")
    md += ["## 5. 工作台端到端导出（参数编辑 → MP4）\n",
           "> 测试入口是 LW 工作台实际使用的 `POST /api/render-reference` + `/api/jobs/{id}` + `/exports/{id}.mp4`，不是 Remotion CLI 直渲。\n"]
    wb = load(wb_file, {}) if wb_file.exists() else {}
    if wb.get("results"):
        md += ["| LW ID | 修改参数 | 文件大小 | SHA-256（前12） |", "|---|---|---|---|"]
        for cid, r in wb["results"].items():
            if r.get("status") == "pass":
                md.append(f"| {cid} | `{r.get('editedKey')}` | {r.get('bytes')} B | `{r.get('sha256','')[:12]}` |")
        md += ["", f"逐条结果：`{wb_file.relative_to(BATCH)}`"]
    else:
        md.append("- 尚未执行工作台导出验收。")
    md += ["", "## 6. 返修实现方式\n",
           "- 五个组件通过 `tools/fredtalk/profiles/source-patches.json` 的声明式补丁落地，`adapt.py` 在适配后确定性应用，`--readapt` 不会丢失。",
           "- T01d 增加 `dataNote`，默认显式标注“演示数据 · 非真实测评”；T02a 未激活卡不再整体降透明度；T04g 未推荐分支文字下限 0.8；T04a 默认关闭非透明占位图且只接受透明 PNG；T04e 改用自有公开仓库页面截图（965×1607）并补 `object-fit: cover`。",
           "", "## 7. 产物位置\n",
           f"- 视频与帧：`external/fredtalk/batch/runs/{run_id}/evidence/<LW-ID>/`（本地运行产物，默认不入库）",
           f"- 工作台导出 MP4：`external/fredtalk/batch/runs/{run_id}/workbench-export/`（本地验收产物，默认不入库）",
           f"- 逐组件状态：`external/fredtalk/batch/batches/{run_id}-status.json`",
           "", "## 8. 边界\n",
           "- 机器 QA 只证明结构可解码；人工视觉审核单独记录，二者不互相替代。",
           "- 上游媒体不随 MIT；本批次默认使用 LW 自占位素材，T04e 使用自有公开仓库页面截图。",
           "- `batch/runs/` 不永久提交，避免 432 条视频撑大仓库。\n"]
    (out_dir / f"{run_id}-acceptance.md").write_text("\n".join(md) + "\n")
    print(json.dumps(c, ensure_ascii=False, indent=2))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-id", default=None)
    args = ap.parse_args()
    if args.run_id:
        write_run(args.run_id)
    else:
        write_main()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
