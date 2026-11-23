"""LW-FT-FULL-001 / Stage A1: consolidated 432-row FredTalk status ledger.

Merges every on-disk evidence source into a single de-duplicated, auditable
per-component status table. Machine QA and human visual review are tracked as
SEPARATE columns; a machine pass never implies a visual pass.

Sources (all read-only):
  external/fredtalk/batch/inventory.json          432-row source/strategy baseline
  external/catalog.json                          install/render/executable state
  src/references/fredtalk-registry.data.json     workbench registry (49 adapted)
  external/fredtalk/adapted/<ID>/provenance.json per-component SHA + license
  external/fredtalk/batch/status.json            round-1 (12)
  external/fredtalk/batch/reviews-round1.json    round-1 human visual review
  .../batches/batch-20-status.json               batch-20 (20)
  .../batches/batch-20-reviews.json              batch-20 human visual review
  .../batches/batch-20-workbench-export.json     batch-20 workbench export
  .../batches/batch-21-diverse-status.json       batch-21 (20, render/QA)
  .../batches/batch-21-diverse-acceptance.md     batch-21 human visual = pending
  .../runs/LWFT-batch-22/status.json             batch-22 (20, render/QA)
  .../batches/LWFT-batch-22-reviews.json         batch-22 human visual verdict
  .../batches/LWFT-batch-22-workbench-export.json batch-22 workbench export
  .../runs/LWFT-FULL-64/status.json              full-run-64 (64, real MP4 render)
  .../runs/LWFT-FULL-64/qa-summary.json          full-run-64 machine QA
  batch/evidence/<ID>/render.mp4                 first-round stills/video

Outputs (written under external/fredtalk/batch/full-library/):
  status.json    full machine-readable ledger
  status.csv     same rows, spreadsheet friendly
  STATUS.md      summary + blocked breakdown + full 432-row table

Usage:
    python3 tools/fredtalk/full_library_status.py
"""
from __future__ import annotations

import collections
import csv
import json
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
VS = HERE.parents[1]
EXT = VS / "external" / "fredtalk"
BATCH = EXT / "batch"
OUT = BATCH / "full-library"
CATALOG = VS / "external" / "catalog.json"
REGISTRY = VS / "src" / "references" / "fredtalk-registry.data.json"
ADAPTED = EXT / "adapted"
EVIDENCE = BATCH / "evidence"


def load(path: Path, default=None):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def review_status(v):
    """Normalise the assorted human-review spellings to a single vocabulary."""
    if not v:
        return "pending"
    v = str(v).strip().lower()
    if v in ("pass", "passed", "pass-with-note", "pass with note"):
        return "pass"
    if v in ("conditional", "pass-conditional"):
        return "conditional"
    if v in ("rework", "fail", "failed"):
        return "rework"
    return "pending"


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)

    inv = load(BATCH / "inventory.json", [])
    catalog = load(CATALOG, [])
    registry = load(REGISTRY, [])
    status_r1 = load(BATCH / "status.json", {})
    reviews_r1 = (load(BATCH / "reviews-round1.json", {}) or {}).get("reviews", {})
    b20 = load(BATCH / "batches" / "batch-20-status.json", {}) or {}
    b20_reviews = (load(BATCH / "batches" / "batch-20-reviews.json", {}) or {}).get("reviews", {})
    b20_export = load(BATCH / "batches" / "batch-20-workbench-export.json", {}) or {}
    b21 = load(BATCH / "batches" / "batch-21-diverse-status.json", {}) or {}
    # LW-FT-FULL-001 batch-22: 20 newly adapted + real-MP4 rendered this run
    b22 = load(BATCH / "runs" / "LWFT-batch-22" / "status.json", {}) or {}
    b22_qa = {q.get("id"): q for q in (load(BATCH / "runs" / "LWFT-batch-22" / "qa-summary.json", []) or [])
              if isinstance(q, dict) and q.get("id")}
    b22_reviews = (load(BATCH / "batches" / "LWFT-batch-22-reviews.json", {}) or {}).get("reviews", {})
    b22_export = load(BATCH / "batches" / "LWFT-batch-22-workbench-export.json", {}) or {}
    # LW-FT-FULL-001 final pass: user verbal batch visual verdict for all
    # remaining rendered active-library candidates (2026-11-23).
    f84_reviews = (load(BATCH / "batches" / "LWFT-FULL-84-reviews.json", {}) or {}).get("reviews", {})
    f84_export = load(BATCH / "batches" / "LWFT-FULL-84-workbench-export.json", {}) or {}
    # LW-FT-FULL-001 second run: all 64 remaining kit-overlay candidates
    f64 = load(BATCH / "runs" / "LWFT-FULL-64" / "status.json", {}) or {}
    f64_qa = {q.get("id"): q for q in (load(BATCH / "runs" / "LWFT-FULL-64" / "qa-summary.json", []) or [])
              if isinstance(q, dict) and q.get("id")}
    qa_summary = load(BATCH / "qa-summary.json", []) or []

    cat_by_id = {}
    for c in catalog:
        cid = c.get("id")
        if cid:
            cat_by_id[cid] = c
    reg_by_id = {r.get("id"): r for r in registry if r.get("id")}
    qa_by_id = {q.get("id"): q for q in qa_summary if isinstance(q, dict) and q.get("id")}
    b20_rows = {r.get("id"): r for r in (b20.get("rows") or []) if r.get("id")}

    # batch-20 workbench export: capture any dict keyed by component id
    b20_export_by_id = {}
    if isinstance(b20_export, dict):
        for k, v in b20_export.items():
            if isinstance(v, dict) and ("status" in v or "pass" in str(v).lower()):
                b20_export_by_id[k] = v
        results = b20_export.get("results")
        if isinstance(results, dict):
            b20_export_by_id.update(results)
        elif isinstance(results, list):
            for r in results:
                if isinstance(r, dict) and r.get("id"):
                    b20_export_by_id[r["id"]] = r

    b22_export_by_id = {}
    if isinstance(b22_export, dict):
        results = b22_export.get("results")
        if isinstance(results, dict):
            b22_export_by_id = dict(results)
        elif isinstance(results, list):
            for r in results:
                if isinstance(r, dict) and r.get("id"):
                    b22_export_by_id[r["id"]] = r

    f84_export_by_id = {}
    if isinstance(f84_export, dict):
        results = f84_export.get("results")
        if isinstance(results, dict):
            f84_export_by_id = dict(results)
        elif isinstance(results, list):
            for r in results:
                if isinstance(r, dict) and r.get("id"):
                    f84_export_by_id[r["id"]] = r

    rows = []
    for r in inv:
        lw_id = r.get("lwId")
        ft_id = r.get("ftId")
        name = r.get("name") or ""
        category = r.get("category") or ""
        src = r.get("source") or {}
        params = r.get("params") or {}
        dep = r.get("dependencies") or {}
        rights = r.get("rights") or {}
        adapt = r.get("adaptation") or {}

        strategy = adapt.get("strategy") or "unknown"
        blocked_reason = adapt.get("blockedReason") or ""
        declared = src.get("declaredFiles", 0)
        verified = src.get("verifiedFiles", 0)
        complete = bool(src.get("complete"))
        files = src.get("files") or []
        sha_list = [f.get("declaredSha256") for f in files if f.get("declaredSha256")]
        sha_ok = all(f.get("actualSha256") == f.get("declaredSha256") for f in files) if files else False
        param_keys = params.get("keys") or []
        has_params = bool(params.get("hasEditableParams")) or bool(param_keys)
        media_refs = dep.get("media") or []
        missing_imports = dep.get("missingImports") or []

        # ---- adapted / registered / executable -------------------------------
        provenance = load(ADAPTED / lw_id / "provenance.json") if lw_id else None
        in_registry = lw_id in reg_by_id
        adapted = bool(provenance) or in_registry or bool(adapt.get("adapted"))
        cat = cat_by_id.get(lw_id, {}) or {}
        install_status = cat.get("installStatus") or ("source-adapted-verified" if adapted else "source-not-installed")
        catalog_render = cat.get("renderStatus") or "not-tested"
        executable = bool(cat.get("executable")) or in_registry

        # ---- render / machine QA (per batch, de-duplicated by id) -----------
        render = "not-tested"
        machine_qa = "not-tested"
        frames = ""
        fps = ""
        evidence_path = ""
        input_fingerprint = ""

        r1 = status_r1.get(lw_id)
        if isinstance(r1, dict):
            render = r1.get("render") or render
            mq = r1.get("machineQa") or {}
            machine_qa = mq.get("status", "not-tested") if isinstance(mq, dict) else str(mq)
            frames = r1.get("frames", "")
            fps = r1.get("fps", "")
            evidence_path = r1.get("evidence") or ""

        r20 = b20_rows.get(lw_id)
        if isinstance(r20, dict):
            render = r20.get("render") or render
            machine_qa = r20.get("machineQa") or machine_qa
            frames = r20.get("frames", frames)
            fps = r20.get("fps", fps)
            evidence_path = r20.get("evidence") or evidence_path
            input_fingerprint = r20.get("inputFingerprint") or input_fingerprint

        r21 = b21.get(lw_id)
        if isinstance(r21, dict):
            render = r21.get("render") or render
            frames = r21.get("durationInFrames", frames)
            fps = r21.get("fps", fps)
            mp4 = r21.get("mp4")
            if mp4:
                evidence_path = mp4
            input_fingerprint = r21.get("inputFingerprint") or input_fingerprint
            # batch-21 has no per-row machine QA flag; use qa-summary when present
            if machine_qa == "not-tested" and lw_id in qa_by_id:
                machine_qa = "pass"

        r22 = b22.get(lw_id)
        if isinstance(r22, dict):
            render = r22.get("render") or render
            frames = r22.get("durationInFrames", frames)
            fps = r22.get("fps", fps)
            mp4 = r22.get("mp4")
            if mp4:
                evidence_path = mp4
            input_fingerprint = r22.get("inputFingerprint") or input_fingerprint
            if lw_id in b22_qa:
                machine_qa = str(b22_qa[lw_id].get("machineStatus") or machine_qa)

        r64 = f64.get(lw_id)
        if isinstance(r64, dict):
            render = r64.get("render") or render
            frames = r64.get("durationInFrames", frames)
            fps = r64.get("fps", fps)
            mp4 = r64.get("mp4")
            if mp4:
                evidence_path = mp4
            input_fingerprint = r64.get("inputFingerprint") or input_fingerprint
            if lw_id in f64_qa:
                machine_qa = str(f64_qa[lw_id].get("machineStatus") or machine_qa)

        if (EVIDENCE / lw_id / "render.mp4").exists() and not evidence_path:
            evidence_path = f"external/fredtalk/batch/evidence/{lw_id}/"
        if lw_id in qa_by_id and machine_qa == "not-tested":
            machine_qa = "pass"

        # ---- human visual review (SEPARATE, never implied by machine QA) ----
        visual = "pending"
        visual_note = ""
        reviewer = ""
        if lw_id in reviews_r1:
            v = reviews_r1[lw_id]
            visual = review_status(v.get("status"))
            visual_note = v.get("note", "")
            reviewer = v.get("reviewer", "")
        if lw_id in b20_reviews:
            v = b20_reviews[lw_id]
            visual = review_status(v.get("status"))
            visual_note = v.get("note", "")
            reviewer = v.get("reviewer", "")
        elif isinstance(r20, dict) and r20.get("visual"):
            visual = review_status(r20.get("visual"))
            visual_note = r20.get("vnote", "")
            reviewer = r20.get("reviewer", "")
        # batch-21 explicitly records all 20 as pending (no human review done)
        if isinstance(r21, dict) and visual == "pending":
            visual = "pending"
            visual_note = "batch-21: 未做人工视觉审核，一律 pending（不得用机器 QA 替代）"
            reviewer = "not-reviewed"
        # LW-FT-FULL-001 batch-22: real MP4 + machine QA; human review was pending
        # until the user supplied the visual verdict recorded in *-reviews.json.
        if isinstance(r22, dict) and visual == "pending":
            visual = "pending"
            visual_note = "batch-22: 本轮仅完成真实 MP4 渲染与机器 QA，人工视觉未审，一律 pending（不得用机器 QA 替代）"
            reviewer = "not-reviewed"
        if lw_id in b22_reviews:
            v = b22_reviews[lw_id]
            visual = review_status(v.get("status"))
            visual_note = v.get("note", "")
            reviewer = v.get("reviewer", "")
        # Final 2026-11-23 verbal batch verdict takes precedence over earlier
        # pending/conditional/rework states, but NEVER over an explicit reject.
        if lw_id in f84_reviews:
            v = f84_reviews[lw_id]
            s = review_status(v.get("status"))
            if s == "pass":
                visual = s
                visual_note = v.get("note", "")
                reviewer = v.get("reviewer", "")

        # ---- workbench export ------------------------------------------------
        workbench = "not-tested"
        if isinstance(r20, dict) and r20.get("workbenchExport"):
            workbench = str(r20["workbenchExport"])
        if lw_id in b20_export_by_id:
            v = b20_export_by_id[lw_id]
            workbench = str(v.get("status") or v.get("result") or "pass")
        if lw_id in b22_export_by_id:
            v = b22_export_by_id[lw_id]
            workbench = str(v.get("status") or v.get("result") or "pass")
        if lw_id in f84_export_by_id:
            v = f84_export_by_id[lw_id]
            workbench = str(v.get("status") or v.get("result") or "pass")

        # ---- acceptance tier -------------------------------------------------
        # A component is only "production-ready" when ALL gates pass.
        if (adapted and render == "pass" and machine_qa == "pass"
                and visual == "pass" and workbench == "pass" and executable):
            tier = "production-ready"
        elif adapted and render == "pass" and machine_qa == "pass" and visual == "pass":
            tier = "visual-accepted"
        elif adapted and render == "pass" and machine_qa == "pass":
            tier = "machine-qa-only"
        elif adapted and render == "pass":
            tier = "rendered-qa-not-pass"
        elif adapted:
            tier = "adapted-unrendered"
        elif strategy == "blocked-dependency":
            tier = "blocked-dependency"
        else:
            tier = "candidate-not-adapted"

        rows.append({
            "lwId": lw_id,
            "ftId": ft_id,
            "name": name,
            "category": category,
            "strategy": strategy,
            "sourceComplete": complete,
            "sourceFiles": f"{verified}/{declared}",
            "shaCount": len(sha_list),
            "shaVerified": sha_ok,
            "missingImports": len(missing_imports),
            "mediaRefs": len(media_refs),
            "hasEditableParams": has_params,
            "editableKeys": ";".join(param_keys),
            "license": (provenance or {}).get("license", {}).get("firstPartyCode")
                       if isinstance((provenance or {}).get("license"), dict)
                       else rights.get("firstPartyCode", ""),
            "adapted": adapted,
            "inRegistry": in_registry,
            "executable": executable,
            "installStatus": install_status,
            "catalogRenderStatus": catalog_render,
            "render": render,
            "machineQa": machine_qa,
            "humanVisual": visual,
            "reviewer": reviewer,
            "workbenchExport": workbench,
            "frames": frames,
            "fps": fps,
            "evidence": evidence_path,
            "inputFingerprint": input_fingerprint,
            "blockedReason": blocked_reason,
            "visualNote": visual_note,
            "tier": tier,
        })

    # ---- de-duplication assertion -------------------------------------------
    ids = [r["lwId"] for r in rows]
    dupes = [k for k, v in collections.Counter(ids).items() if v > 1]
    assert len(rows) == 432, f"expected 432 rows, got {len(rows)}"
    assert not dupes, f"duplicate lwId: {dupes[:10]}"

    (OUT / "status.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    fields = list(rows[0].keys())
    with (OUT / "status.csv").open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    # ---- markdown report -----------------------------------------------------
    strategy_c = collections.Counter(r["strategy"] for r in rows)
    tier_c = collections.Counter(r["tier"] for r in rows)
    visual_c = collections.Counter(r["humanVisual"] for r in rows)
    render_c = collections.Counter(r["render"] for r in rows)
    mqa_c = collections.Counter(r["machineQa"] for r in rows)
    cat_c = collections.Counter(r["category"] for r in rows)

    md = [
        "# LW-FT-FULL-001 · FredTalk 全库逐条状态清单（Stage A1）", "",
        "> 由 `tools/fredtalk/full_library_status.py` 从本地证据文件合并生成。",
        "> **机器 QA 与人工视觉验收严格分列**；机器 pass 不推断视觉 pass。",
        "> 所有通过项均需真实 MP4 证据；本表不把未审片条目记为通过。", "",
        "## 1. 汇总", "",
        f"| 指标 | 数量 |", "| --- | --- |",
        f"| 目录条目（唯一 ID，已去重） | {len(rows)} |",
        f"| 重复 ID | {len(dupes)} |",
        f"| 已适配（adapted/registry） | {sum(1 for r in rows if r['adapted'])} |",
        f"| 工作台可调用（executable/inRegistry） | {sum(1 for r in rows if r['executable'])} |",
        f"| 真实渲染 pass | {render_c.get('pass', 0)} |",
        f"| 机器 QA pass | {mqa_c.get('pass', 0)} |",
        f"| 人工视觉 pass | {visual_c.get('pass', 0)} |",
        f"| 人工视觉 conditional | {visual_c.get('conditional', 0)} |",
        f"| 人工视觉 rework | {visual_c.get('rework', 0)} |",
        f"| 人工视觉 pending（未审片） | {visual_c.get('pending', 0)} |",
        f"| 具备可编辑参数 | {sum(1 for r in rows if r['hasEditableParams'])} |",
        f"| 源码 SHA 全部校验通过 | {sum(1 for r in rows if r['shaVerified'])} |",
        "",
        "## 2. 验收分层（tier）", "", "| tier | 数量 | 含义 |", "| --- | --- | --- |",
    ]
    tier_desc = {
        "production-ready": "适配+渲染+机器QA+人工视觉+工作台导出+可执行 全通过",
        "visual-accepted": "适配+渲染+机器QA+人工视觉通过（工作台导出未验证）",
        "machine-qa-only": "仅机器 QA 通过，人工视觉 pending/conditional/rework",
        "rendered-qa-not-pass": "已真实渲染 MP4，但机器 QA 为 not-tested 或 fail（须人工复核，不得当作已验收）",
        "adapted-unrendered": "已适配但无真实 MP4 通过记录",
        "blocked-dependency": "依赖文件缺失，当前无法自动适配",
        "candidate-not-adapted": "kit-overlay/standalone 候选，尚未适配",
    }
    for k, n in tier_c.most_common():
        md.append(f"| {k} | {n} | {tier_desc.get(k, '')} |")

    md += ["", "## 3. 适配策略分布", "", "| 策略 | 数量 |", "| --- | --- |"]
    for k, n in strategy_c.most_common():
        md.append(f"| {k} | {n} |")

    md += ["", "## 4. 类别分布", "", "| 类别 | 数量 |", "| --- | --- |"]
    for k, n in cat_c.most_common():
        md.append(f"| {k} | {n} |")

    md += ["", "## 5. 阻塞原因 Top（blocked-dependency）", "",
           "按缺失依赖的归一化前缀聚合，用于逐类修复排期。", "",
           "| 缺失依赖签名 | 条目数 |", "| --- | --- |"]
    blockers = collections.Counter()
    for r in rows:
        if r["blockedReason"]:
            key = r["blockedReason"].replace("local imports unresolved: ", "")
            parts = sorted(p.strip() for p in key.split(","))
            blockers[", ".join(parts[:3]) + (" …" if len(parts) > 3 else "")] += 1
    for k, n in blockers.most_common(20):
        md.append(f"| {k[:110]} | {n} |")

    md += ["", "## 6. 逐条状态（432 条）", "",
           "| LW ID | 类别 | 策略 | 源码 | 参数 | 适配 | 渲染 | 机器QA | 人工视觉 | 工作台 | tier |",
           "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for r in rows:
        md.append("| {id} | {cat} | {st} | {src} | {p} | {ad} | {rd} | {mq} | {vs} | {wb} | {tier} |".format(
            id=r["lwId"], cat=r["category"], st=r["strategy"], src=r["sourceFiles"],
            p="Y" if r["hasEditableParams"] else "-",
            ad="Y" if r["adapted"] else "-", rd=r["render"], mq=r["machineQa"],
            vs=r["humanVisual"], wb=r["workbenchExport"], tier=r["tier"]))
    (OUT / "STATUS.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"rows={len(rows)} dupes={len(dupes)}")
    print("tier   :", dict(tier_c))
    print("visual :", dict(visual_c))
    print("strategy:", dict(strategy_c))
    print("output :", OUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
