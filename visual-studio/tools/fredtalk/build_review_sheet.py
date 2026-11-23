#!/usr/bin/env python3
"""Build a human visual-review sheet for one FredTalk batch run.

Produces a self-contained review board (stills inlined as JPEG data URIs),
plus the original frames and MP4s next to it, a sign-off CSV and a review guide.

This script NEVER writes a visual verdict. All 20 rows start as `pending`.
The human reviewer fills the board and exports the result JSON.
"""
from __future__ import annotations

import argparse
import base64
import csv
import io
import json
import re
import shutil
from datetime import datetime
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
VS = HERE.parent.parent
FREDTALK = VS / "external" / "fredtalk"
BATCH = FREDTALK / "batch"
INVENTORY = BATCH / "inventory.json"

# Signals that require extra attention during human review. Keyed by lwId.
WATCH = {
    "FT-T09d-654": "与 FT-T09d2-404 导出符号同为 TaskRunStatus、默认画面高度近似（首/中/尾帧差 93.49 vs 93.48）、运动量 0.821 vs 0.822。上游源码 SHA 不同，属上游两个变体。审片须确认二者视觉可区分；若不可区分，应驳回其一或标注「同效重复」，不得当作两个独立能力交付。",
    "FT-T09d2-404": "与 FT-T09d-654 导出符号同为 TaskRunStatus、默认画面高度近似。审片须确认二者视觉可区分；若不可区分，应驳回其一或标注「同效重复」，不得当作两个独立能力交付。",
    "FT-T09i-363": "motionMean=0.088，为全批最低。须确认是「入场后长时间静止的稀疏动画」还是「近似静态截图」。若整片仅有单帧内容，按静态冒充驳回。",
    "FT-T05h-366": "低速动画（motionMean=0.243）。须确认仍有真实帧间运动，非静态停留。",
    "FT-T05i-367": "低速动画（motionMean=0.273）。须确认仍有真实帧间运动，非静态停留。",
    "FT-T09t-290": "motionMean=7.471，为全批最高，且为 30fps。须确认运动不是闪烁/噪点造成的假运动，画面主体清晰可读。",
    "FT-T09v-291": "motionMean=4.055，30fps、仅 120 帧。须确认高运动量来自正常动画而非素材抖动。",
}

LOW_MOTION = 0.5  # below this, flag as "sparse animation - check carefully"

# Only these require a blocking decision; other WATCH entries are advisory.
HIGH_IDS = {"FT-T09d-654", "FT-T09d2-404", "FT-T09i-363"}

CRITERIA = [
    ("真动画", "首 / 中 / 尾帧有可见变化；不是静态截图、不是同一帧循环、不是用通用动画套不同组件。"),
    ("无黑帧白板", "不整片黑屏或纯白；无大面积空画面、无渲染失败占位。"),
    ("构图完整", "文字与图形不溢出画面、不被裁切、无异常重叠遮挡。"),
    ("文字可读", "中文文案清晰，无乱码、缺字、方块字或字体回退导致的错位。"),
    ("语义一致", "画面表现与组件名称 / purpose 描述相符（如「不等号拆开两个概念」确实出现分隔动作）。"),
    ("组件差异性", "不同组件不得呈现同一套画面；重点关注 T09d / T09d2。"),
    ("节奏完整", "入场 / 停留 / 收尾结构完整，无突兀跳帧或中途硬切。"),
    ("帧率与时长", "本批混有 30fps 与 60fps 组件，确认播放时长与上游声明一致、无异常快慢。"),
]


def load(p: Path, default=None):
    if not p.exists():
        return default
    return json.loads(p.read_text(encoding="utf-8"))


def jpeg_data_uri(p: Path, width=800, quality=84) -> str:
    img = Image.open(p).convert("RGB")
    h = round(img.height * width / img.width)
    img = img.resize((width, h), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def frame_no(p: Path) -> int:
    m = re.search(r"-f(\d+)\.png$", p.name)
    return int(m.group(1)) if m else -1


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--out", default=None, help="review output dir (default: <worktree>/review/<run-id>)")
    args = ap.parse_args()

    run = BATCH / "runs" / args.run_id
    plan = load(run / "plan.json")
    if not plan:
        raise SystemExit(f"plan.json not found for {args.run_id}")
    inv = {r["lwId"]: r for r in load(INVENTORY, [])}

    out = Path(args.out) if args.out else (VS.parent / "review" / args.run_id)
    (out / "media").mkdir(parents=True, exist_ok=True)
    (out / "frames").mkdir(parents=True, exist_ok=True)

    cards = []
    for c in plan["components"]:
        lw = c["lwId"]
        ev = run / "evidence" / lw
        qa = load(ev / "qa.json", {})
        v = qa.get("video", {})
        checks = qa.get("checks", {})
        r = inv.get(lw, {})

        # original frames + mp4 copied so the board can play / zoom on real files
        (out / "frames" / lw).mkdir(exist_ok=True)
        raw_frames = sorted(ev.glob("frame-*.png"), key=frame_no)
        for f in raw_frames:
            shutil.copy2(f, out / "frames" / lw / f.name)
        mp4_src = ev / "render.mp4"
        mp4_rel = ""
        if mp4_src.exists():
            shutil.copy2(mp4_src, out / "media" / f"{lw}.mp4")
            mp4_rel = f"media/{lw}.mp4"

        stills = []
        for f in raw_frames:
            sec = round(frame_no(f) / v.get("fps", 60), 2)
            stills.append({
                "t": sec,
                "f": frame_no(f),
                "thumb": jpeg_data_uri(f),
                "raw": f"frames/{lw}/{f.name}",
            })

        motion = float(checks.get("motionMean", 0) or 0)
        flags = []
        if lw in WATCH:
            lvl = "high" if lw in HIGH_IDS else "mid"
            flags.append({"level": lvl, "text": WATCH[lw]})
        elif motion < LOW_MOTION:
            flags.append({"level": "mid", "text": f"低速动画（motionMean={motion}）。请确认仍有真实帧间运动，非静态停留。"})
        if v.get("fps") == 30.0:
            flags.append({"level": "info", "text": "本组件为 30fps（本批其余多为 60fps），确认时长与节奏符合上游声明。"})

        cards.append({
            "id": lw,
            "ftId": c.get("ftId", ""),
            "name": r.get("name", ""),
            "category": c.get("category", r.get("category", "")),
            "purpose": r.get("purpose", ""),
            "strategy": c.get("strategy", ""),
            "export": c.get("entryExport", ""),
            "params": c.get("editableKeys", []),
            "frames": v.get("frames"),
            "fps": v.get("fps"),
            "duration": v.get("durationSec"),
            "motion": motion,
            "black": checks.get("blackFrameRatio"),
            "machine": qa.get("machineStatus", "unknown"),
            "mp4": mp4_rel,
            "stills": stills,
            "flags": flags,
        })

    payload = {
        "runId": args.run_id,
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "count": len(cards),
        "criteria": [{"title": a, "detail": b} for a, b in CRITERIA],
        "cards": cards,
    }

    html = HTML_TEMPLATE.replace("/*__PAYLOAD__*/", json.dumps(payload, ensure_ascii=False))
    (out / "review-board.html").write_text(html, encoding="utf-8")

    # sign-off CSV (utf-8-sig for Excel)
    with (out / "sign-off.csv").open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["lwId", "ftId", "组件名称", "类别", "用途", "适配策略", "导出符号", "可编辑参数",
                    "帧数", "fps", "时长(秒)", "motionMean", "黑帧比", "机器QA", "关注项",
                    "人工视觉结论(pending/pass/reject/hold)", "审片人", "审片日期", "备注"])
        for c in cards:
            w.writerow([c["id"], c["ftId"], c["name"], c["category"], c["purpose"], c["strategy"],
                        c["export"], "|".join(c["params"]), c["frames"], c["fps"], c["duration"],
                        c["motion"], c["black"], c["machine"],
                        "重点" if any(f["level"] == "high" for f in c["flags"])
                        else ("提示" if any(f["level"] == "mid" for f in c["flags"]) else ""),
                        "pending", "", "", ""])

    (out / "review-guide.md").write_text(build_guide(args.run_id, cards), encoding="utf-8")
    print(f"review dir : {out}")
    print(f"components : {len(cards)}")
    print(f"stills     : {sum(len(c['stills']) for c in cards)}")
    print(f"mp4        : {sum(1 for c in cards if c['mp4'])}")
    print(f"high-watch : {[c['id'] for c in cards if any(f['level']=='high' for f in c['flags'])]}")
    print(f"board size : {(out/'review-board.html').stat().st_size//1024} KB")


def build_guide(run_id: str, cards: list[dict]) -> str:
    high = [c for c in cards if any(f["level"] == "high" for f in c["flags"])]
    lines = [
        f"# {run_id} 人工视觉审片说明",
        "",
        f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}　|　组件数：{len(cards)}　|　审片帧：{sum(len(c['stills']) for c in cards)} 张　|　真实 MP4：{sum(1 for c in cards if c['mp4'])} 条",
        "",
        "## 这份材料是什么",
        "",
        "- `review-board.html`：审片看板。每条组件一行，含 5 张按时间排序的审片帧、真实 MP4 播放器、判定按钮与备注框。",
        "- `sign-off.csv`：逐条签字清单，可用 Excel 打开填写（已带 UTF-8 BOM）。",
        "- `media/*.mp4` / `frames/<id>/*.png`：从批次证据原样复制的真实渲染产物，供高清核对。",
        "",
        "**重要：本脚本不写任何视觉结论，全部 20 条初始状态均为 `pending`。** 机器 QA（20/20 pass）只是前置预检，不能替代人工视觉验收。",
        "",
        "## 判定标准（逐条过）",
        "",
    ]
    for i, (a, b) in enumerate(CRITERIA, 1):
        lines.append(f"{i}. **{a}** — {b}")
    lines += [
        "",
        "## 结论取值",
        "",
        "| 取值 | 含义 | 后续 |",
        "|---|---|---|",
        "| `pass` | 视觉验收通过 | 进入工作台端到端导出验收，通过后才有资格晋级 Originals |",
        "| `reject` | 驳回 | 记录原因，回到适配/渲染环节返修 |",
        "| `hold` | 待定 | 需补充信息或看整片后复议，不算通过 |",
        "| `pending` | 未审 | 默认状态，**不得当作通过** |",
        "",
        "## 本批重点关注项",
        "",
    ]
    for c in high:
        for f in c["flags"]:
            if f["level"] == "high":
                lines.append(f"- **{c['id']}（{c['name']}）**：{f['text']}")
    mids = [(c, f) for c in cards for f in c["flags"] if f["level"] == "mid"]
    if mids:
        lines += ["", "### 其他提示项（不阻塞，但需留意）", ""]
        for c, f in mids:
            lines.append(f"- **{c['id']}（{c['name']}）**：{f['text']}")
    lines += [
        "",
        "## 操作方式",
        "",
        "1. 打开 `review-board.html`，在顶部填入审片人。若预览面板里 MP4 无法播放，直接用本地浏览器打开该 HTML（`file://` 下同目录 `media/` 媒体可正常加载）。",
        "2. 逐条看 5 帧时间轴；有疑问点开 MP4 播放整段，或点帧看高清原图。",
        "3. 选「通过 / 驳回 / 待定」，必要时写备注。结果自动存浏览器本地，刷新不丢。",
        "4. 全部审完点「导出审片结果」，把下载的 JSON 放回本目录，命名为 `review-results.json`。",
        "",
        "## 导出结果格式（与历史 `batch-20-reviews.json` 对齐）",
        "",
        "```json",
        "{",
        f'  "runId": "{run_id}",',
        '  "reviewedAt": "...",',
        '  "scope": "visual-first-pass",',
        '  "reviewer": "...",',
        '  "method": "human visual review of real MP4 + head/mid/tail stills",',
        '  "reviews": { "FT-...": { "status": "pass|reject|hold", "note": "...", "reviewer": "...", "stage": "visual-first-pass" } }',
        "}",
        "```",
        "",
        "## 审完之后",
        "",
        "只有 `pass` 的条目才能进入下一步：**工作台导出验收 → 晋级 Originals → 合并 main**。",
        "`reject` / `hold` / `pending` 一律不得晋级，也不得用于交付成片。",
        "",
        "## 禁止事项（任务书原文精神）",
        "",
        "- 不得用机器 QA 结果代替人工视觉签字。",
        "- 不得用静态截图冒充动画、不得用同一个通用动画替代不同组件。",
        "- 不得为凑数量把 pending 批量改成 pass。",
        "",
    ]
    return "\n".join(lines)


HTML_TEMPLATE = r"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LWFT 人工视觉审片看板</title>
<style>
:root{--bg:#f6f7f9;--card:#fff;--line:#e4e7ec;--text:#1f2329;--muted:#6b7280;--blue:#2563eb;
--pass:#15803d;--passbg:#ecfdf3;--reject:#b91c1c;--rejectbg:#fef2f2;--hold:#b45309;--holdbg:#fffbeb;
--highbg:#fff7ed;--highline:#fdba74;--infobg:#eff6ff;--infoline:#bfdbfe}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);
font:14px/1.6 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:20px}
header{position:sticky;top:0;z-index:20;background:rgba(246,247,249,.96);backdrop-filter:blur(8px);
border-bottom:1px solid var(--line);padding:14px 0;margin-bottom:18px}
.hd{max-width:1180px;margin:0 auto;padding:0 20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
h1{font-size:19px;margin:0;font-weight:700}
.sub{color:var(--muted);font-size:12.5px}
.spacer{flex:1}
input.reviewer{border:1px solid var(--line);border-radius:7px;padding:7px 10px;font-size:13px;width:170px;background:#fff;color:var(--text)}
button{font:inherit;cursor:pointer;border-radius:7px;border:1px solid var(--line);padding:7px 13px;background:#fff;color:var(--text)}
button.primary{background:var(--blue);border-color:var(--blue);color:#fff}
button:hover{filter:brightness(.97)}
.progress{display:flex;gap:14px;align-items:center;font-size:13px;margin-top:10px;flex-wrap:wrap}
.bar{height:7px;background:#e8ebef;border-radius:9px;overflow:hidden;flex:1;min-width:180px}
.bar>i{display:block;height:100%;background:var(--blue);width:0;transition:width .25s}
.chip{padding:2px 9px;border-radius:20px;font-size:12px;font-weight:600}
.c-pass{background:var(--passbg);color:var(--pass)}.c-reject{background:var(--rejectbg);color:var(--reject)}
.c-hold{background:var(--holdbg);color:var(--hold)}.c-pending{background:#f1f3f6;color:var(--muted)}
details.criteria{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:16px}
details.criteria summary{cursor:pointer;font-weight:600}
details.criteria ol{margin:10px 0 2px;padding-left:22px;color:#374151}
details.criteria li{margin:5px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin-bottom:16px;
box-shadow:0 1px 2px rgba(16,24,40,.03)}
.card.done-pass{border-left:4px solid var(--pass)}.card.done-reject{border-left:4px solid var(--reject)}
.card.done-hold{border-left:4px solid var(--hold)}
.row1{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.id{font:600 14px ui-monospace,Consolas,monospace;color:var(--blue)}
.nm{font-weight:700;font-size:15px}
.cat{font-size:11.5px;background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:5px}
.purpose{color:var(--muted);font-size:12.5px;margin:5px 0 10px}
.meta{display:flex;gap:8px;flex-wrap:wrap;font-size:11.5px;color:var(--muted);margin-bottom:10px}
.meta span{background:#f8fafc;border:1px solid var(--line);padding:2px 8px;border-radius:5px}
.flag{padding:8px 11px;border-radius:8px;font-size:12.5px;margin:7px 0;line-height:1.55}
.flag.high{background:var(--highbg);border:1px solid var(--highline)}
.flag.mid{background:var(--holdbg);border:1px solid #fde68a}
.flag.info{background:var(--infobg);border:1px solid var(--infoline)}
.stills{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:10px 0}
.still{border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#000;cursor:zoom-in}
.still img{width:100%;display:block;aspect-ratio:16/9;object-fit:cover}
.still .t{background:#111827;color:#e5e7eb;font-size:11px;text-align:center;padding:3px 0}
video{width:100%;max-width:520px;border-radius:8px;background:#000;display:block;margin:6px 0}
.vtoggle{font-size:12px;padding:5px 10px}
.decide{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px;padding-top:12px;border-top:1px dashed var(--line)}
.decide .lab{font-size:12.5px;color:var(--muted);margin-right:2px}
.vbtn{padding:6px 15px;font-size:13px;font-weight:600}
.vbtn.on[data-v=pass]{background:var(--passbg);border-color:var(--pass);color:var(--pass)}
.vbtn.on[data-v=reject]{background:var(--rejectbg);border-color:var(--reject);color:var(--reject)}
.vbtn.on[data-v=hold]{background:var(--holdbg);border-color:var(--hold);color:var(--hold)}
textarea.note{border:1px solid var(--line);border-radius:7px;padding:7px 9px;font:inherit;font-size:12.5px;
width:100%;min-height:38px;resize:vertical;margin-top:8px;color:var(--text);background:#fff}
textarea.note::placeholder{color:#9ca3af}
#lightbox{position:fixed;inset:0;background:rgba(15,23,42,.9);z-index:99;display:none;align-items:center;justify-content:center;padding:20px}
#lightbox img{max-width:96vw;max-height:92vh;border-radius:6px}
#lightbox .close{position:absolute;top:18px;right:24px;color:#fff;font-size:30px;cursor:pointer}
footer{max-width:1180px;margin:10px auto 40px;padding:0 20px;color:var(--muted);font-size:12px}
@media(max-width:760px){.stills{grid-template-columns:repeat(2,1fr)}}
</style></head><body>
<header><div class="hd">
<div><h1>LWFT 人工视觉审片看板</h1><div class="sub" id="subtitle"></div></div>
<div class="spacer"></div>
<input class="reviewer" id="reviewer" placeholder="审片人姓名 / 标识">
<button id="export" class="primary">导出审片结果</button>
<button id="copy">复制摘要</button>
</div><div class="hd"><div class="progress">
<span>已审 <b id="done">0</b>/<b id="total">0</b></span>
<div class="bar"><i id="bar"></i></div>
<span class="chip c-pass" id="npass">通过 0</span>
<span class="chip c-reject" id="nreject">驳回 0</span>
<span class="chip c-hold" id="nhold">待定 0</span>
<span class="chip c-pending" id="npending">未审 0</span>
</div></div></header>
<div class="wrap">
<details class="criteria" open><summary>判定标准（逐条过，点开/收起）</summary><ol id="criteria"></ol></details>
<div id="cards"></div>
</div>
<footer>机器 QA 仅为前置预检，不能替代人工视觉验收。全部条目初始为 pending；只有逐条签字为 pass 的组件才有资格进入工作台导出验收与晋级。</footer>
<div id="lightbox"><span class="close">&times;</span><img id="lbimg" alt=""></div>
<script>
const PAYLOAD = /*__PAYLOAD__*/;
const KEY = 'LWFT-REVIEW-' + PAYLOAD.runId;
let S = {reviewer:'', decisions:{}};
try { const saved = JSON.parse(localStorage.getItem(KEY)||'null'); if(saved) S = Object.assign(S,saved); } catch(e){}
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

document.getElementById('subtitle').textContent =
  `${PAYLOAD.runId} · ${PAYLOAD.count} 条组件 · ${PAYLOAD.cards.reduce((a,c)=>a+c.stills.length,0)} 张审片帧 · 生成于 ${PAYLOAD.generatedAt}`;
document.getElementById('total').textContent = PAYLOAD.count;
document.getElementById('reviewer').value = S.reviewer || '';
document.getElementById('criteria').innerHTML = PAYLOAD.criteria.map(c=>`<li><b>${esc(c.title)}</b> — ${esc(c.detail)}</li>`).join('');

function render(){
  document.getElementById('cards').innerHTML = PAYLOAD.cards.map(c=>{
    const d = S.decisions[c.id] || {status:'pending', note:''};
    const flags = c.flags.map(f=>`<div class="flag ${f.level}">${f.level==='high'?'⚠ 重点':'•'} ${esc(f.text)}</div>`).join('');
    const stills = c.stills.map(s=>`<div class="still" data-raw="${esc(s.raw)}" data-thumb="${esc(s.thumb)}">
      <img loading="lazy" src="${s.thumb}" alt="f${s.f}"><div class="t">${s.t}s · f${s.f}</div></div>`).join('');
    const btns = [['pass','通过'],['reject','驳回'],['hold','待定']].map(([v,t])=>
      `<button class="vbtn ${d.status===v?'on':''}" data-v="${v}" data-id="${c.id}">${t}</button>`).join('');
    const video = c.mp4 ? `<button class="vtoggle" data-video="${esc(c.mp4)}">▶ 播放真实 MP4</button>
      <div class="vslot" id="v-${c.id}"></div>
      <div class="sub">本地视频：media/${esc(c.id)}.mp4</div>` : '';
    return `<div class="card ${d.status!=='pending'?'done-'+d.status:''}" id="card-${c.id}">
      <div class="row1"><span class="id">${c.id}</span><span class="nm">${esc(c.name)}</span>
        <span class="cat">${esc(c.category)}</span><span class="cat">${esc(c.ftId)}</span>
        <span class="chip ${d.status==='pass'?'c-pass':d.status==='reject'?'c-reject':d.status==='hold'?'c-hold':'c-pending'}">${esc(statusText(d.status))}</span></div>
      <div class="purpose">${esc(c.purpose)}</div>
      <div class="meta"><span>${c.frames} 帧</span><span>${c.fps} fps</span><span>${c.duration}s</span>
        <span>motion ${c.motion}</span><span>黑帧 ${c.black}</span><span>机器QA ${esc(c.machine)}</span>
        <span>导出 ${esc(c.export)}</span><span>可改参数 ${esc((c.params||[]).join(' / ')||'无')}</span></div>
      ${flags}
      <div class="stills">${stills}</div>
      ${video}
      <div class="decide"><span class="lab">人工视觉结论：</span>${btns}
        <span class="lab" style="margin-left:auto">未选 = 保持 pending</span></div>
      <textarea class="note" data-id="${c.id}" placeholder="备注（选填）：驳回原因、存疑点、需复议项…">${esc(d.note||'')}</textarea>
    </div>`;
  }).join('');
  bind();
  tally();
}
function statusText(v){return {pass:'已通过',reject:'已驳回',hold:'待定',pending:'未审'}[v]||v;}
function tally(){
  const vals = PAYLOAD.cards.map(c=>(S.decisions[c.id]||{}).status||'pending');
  const n = v => vals.filter(x=>x===v).length;
  document.getElementById('done').textContent = PAYLOAD.count - n('pending');
  document.getElementById('npass').textContent = '通过 '+n('pass');
  document.getElementById('nreject').textContent = '驳回 '+n('reject');
  document.getElementById('nhold').textContent = '待定 '+n('hold');
  document.getElementById('npending').textContent = '未审 '+n('pending');
  document.getElementById('bar').style.width = (100*(PAYLOAD.count-n('pending'))/PAYLOAD.count)+'%';
}
function bind(){
  document.querySelectorAll('.vbtn').forEach(b=>b.onclick=()=>{
    const id=b.dataset.id, v=b.dataset.v;
    const cur=S.decisions[id]||{status:'pending',note:''};
    S.decisions[id]={status: cur.status===v?'pending':v, note:cur.note||''};
    save(); render();
  });
  document.querySelectorAll('textarea.note').forEach(t=>t.oninput=()=>{
    const id=t.dataset.id; const cur=S.decisions[id]||{status:'pending',note:''};
    cur.note=t.value; S.decisions[id]=cur; save();
  });
  document.querySelectorAll('.vtoggle').forEach(b=>b.onclick=()=>{
    const id=b.closest('.card').id.replace('card-','');
    const real=document.getElementById('v-'+id);
    if(!real) return;
    if(real.innerHTML){real.innerHTML='';return;}
    real.innerHTML=`<video controls preload="metadata" src="${b.dataset.video}"></video>`;
  });
  document.querySelectorAll('.still').forEach(s=>s.onclick=()=>{
    document.getElementById('lbimg').src=s.dataset.thumb;
    document.getElementById('lightbox').style.display='flex';
  });
}
document.getElementById('reviewer').oninput=e=>{S.reviewer=e.target.value;save();};
document.getElementById('lightbox').onclick=()=>document.getElementById('lightbox').style.display='none';

function result(){
  const reviews={};
  PAYLOAD.cards.forEach(c=>{
    const d=S.decisions[c.id]||{status:'pending',note:''};
    if(d.status!=='pending') reviews[c.id]={status:d.status,note:d.note||'',reviewer:S.reviewer||'external-human-review',stage:'visual-first-pass'};
  });
  return {runId:PAYLOAD.runId, reviewedAt:new Date().toISOString(), scope:'visual-first-pass',
    reviewer:S.reviewer||'external-human-review',
    method:'human visual review of real MP4 + head/mid/tail stills', reviews};
}
document.getElementById('export').onclick=()=>{
  const r=result();
  const blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=PAYLOAD.runId+'-review-results.json'; a.click(); URL.revokeObjectURL(a.href);
  const left=PAYLOAD.cards.length-Object.keys(r.reviews).length;
  alert('已导出 '+Object.keys(r.reviews).length+' 条签字结论，仍有 '+left+' 条 pending。\n请把文件放回审片目录并命名为 review-results.json。');
};
document.getElementById('copy').onclick=()=>{
  const r=result(); const rs=r.reviews;
  const n=v=>Object.values(rs).filter(x=>x.status===v).length;
  const txt=`${PAYLOAD.runId} 人工视觉审片摘要\n审片人：${r.reviewer}\n时间：${r.reviewedAt}\n`+
    `通过 ${n('pass')} / 驳回 ${n('reject')} / 待定 ${n('hold')} / 未审 ${PAYLOAD.cards.length-Object.keys(rs).length} / 共 ${PAYLOAD.cards.length}\n`+
    Object.entries(rs).map(([k,v])=>`  ${k}  ${v.status}${v.note?'  — '+v.note:''}`).join('\n');
  navigator.clipboard?.writeText(txt).then(()=>alert('摘要已复制')).catch(()=>prompt('手动复制：',txt));
};
render();
</script></body></html>
"""

if __name__ == "__main__":
    main()
