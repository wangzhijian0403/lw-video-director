# FredTalk Batch Adapter

可重复运行的 FredTalk → LW References 适配流水线。基线是 PR #6 的 `feature/resource-adapters-poc`（T03e 已验证）；本目录新增全库盘点、策略化适配、批量渲染、QA 与报告。

## 取源通道

1. 目录条目带 `sha256`：`https://www.fred-fu.com/api/visual-library/assets/<sha>.txt`，失败时回退 `https://www.fred-fu.com/visual-library-app/objects/<sha>.txt`。逐字节校验 SHA-256，缓存到 `external/fredtalk/.cache/sources/<LW-ID>/`（不入库）。
2. 目录条目没有 `sha256`：上游公开 tag `v2.5.0`（`a60c45e8…`）的 `components/projects/**` 源码树，按 `implementation.projects[0]` + 文件 label 匹配。
3. 不绕过登录/付费/访问控制；不使用网站预览 MP4 作为可编辑组件证据。

## 全新克隆前置

```bash
npm ci
python3 scripts/install-fred-font.py     # 校验 SHA 后安装 OFL SmileySans；字体不入库
python3 tools/fredtalk/inventory.py      # 首次会下载 432 条源码缓存（约 48MB，不入库）
```

字体缺失时渲染会以 `.../SmileySans-Oblique.ttf 404` 失败；安装后同一命令自动重试成功。上游演示图片不随 MIT 授权，适配时会把所有 `media/*` 字符串确定性重写到 `fredtalk/media/lw-work-0N.jpg` 或 `lw-recording.mp4`，并在 `provenance.json` 的 `ops` 中记录改写数量。

## 命令

```bash
python3 tools/fredtalk/inventory.py       # 432 条盘点 -> external/fredtalk/batch/inventory.{json,md,csv}
python3 tools/fredtalk/adapt.py           # 第一轮 12 条 profile 适配
python3 tools/fredtalk/adapt.py --all-kit --limit 20 --dry-run   # 只生成自动选件计划
python3 tools/fredtalk/batch.py --next 20 # 自动选件 -> 适配 -> 渲染 -> 机器 QA -> 报告
python3 tools/fredtalk/batch.py --next 20 --readapt  # 强制重适配已适配组件（版本升级时用）
python3 tools/fredtalk/batch.py --next 20 --dry-run              # 只验证选件，不写文件
python3 tools/fredtalk/batch.py --next 20 --mix '{"project-expand":2,"录屏聚焦":6,"内容交接":5,"录屏与视频入场":5,"图片与作品":2}'  # 类别配比自动选件
python3 tools/fredtalk/workbench_export.py --ids <LW-ID...>      # 逐组件参数编辑 + 工作台 API 导出 MP4
LW_BROWSER=/usr/local/bin/chromium \
  node tools/fredtalk/render_batch.mjs --plan external/fredtalk/batch/runs/<run>/plan.json
python3 tools/fredtalk/qa_media.py --run-id <run>                # 机器结构 QA
python3 tools/fredtalk/report.py --run-id <run>                  # 独立批次验收报告
python3 tools/fredtalk/report.py          # 第一轮 status.json + round-1-acceptance.md
python3 tools/fredtalk/promote_candidates.py --run-id <run>  # 人工通过 + 工作台导出通过后才晋级可执行候选
python3 tools/fredtalk/update_catalog.py  # 旧入口：仅按渲染+QA 写回，不再用于人工晋级
npm run test:fredtalk                     # 取源/自动适配/断点/指纹回归测试
```

`adapt.py --all-kit` 的选件条件由 inventory 决定：`strategy=kit-overlay`、声明文件中含 `kit/theme.ts` + `kit/ui.tsx`、实际入口导出可解析、入口的所有相对 import 可解析。任何一条不满足都记为 `skipped` 并写原因，不会退回手工 profile。

## 渲染断点与输入指纹

`render_batch.mjs` 在 `status.json` 中保存 `inputFingerprint`，覆盖：适配器版本、生成的 `adapter.tsx` SHA-256、实际适配后源码 SHA-256（含宿主补丁与媒体重写，`upstreamSha256` 仍保留在 provenance）、props、主题色、背景色、speed、fps、时长。只有状态为 pass 且指纹完全一致才跳过；源码、参数、主题或适配器任一变化都会自动重新渲染。`--force` 可强制重跑，失败条目下次会重试。

## 证据与产物分层

- 第一轮 12 条：`external/fredtalk/batch/evidence/<LW-ID>/`（MP4 + 5 帧 + qa.json，随仓库交付）。
- 后续自动批次：`external/fredtalk/batch/runs/<runId>/`（默认被 `.gitignore` 忽略，作为独立验收产物打包交付，避免把 432 条视频永久提交）。
- 机器 QA：`qa.json` 的 `machineStatus`，只代表结构检查。
- 人工视觉：`reviews-round1.json` / 批次 `reviews.json`，单独计数 `pass` / `conditional` / `rework` / `pending`；未审片一律 `pending`。
- 工作台导出：`workbench_export.py` 走工作台实际使用的 `POST /api/render-reference`，逐组件改一个可编辑参数并下载 MP4；结果写 `batch/batches/<run>-workbench-export.json`。

## 适配策略

- `kit-overlay`：组件文件复制后仅做确定性媒体字面量重写与 kit 宿主化；仅替换 `kit/theme.ts`、`kit/ui.tsx` 的宿主层——字体换 OFL SmileySans、去 Fred 角标、静音 SFX、Frame 使用 host 背景、`useT` 乘 host speed、追加 `configureTheme`。
- `project-expand`：公开目录只登记部分文件、但组件依赖同项目共享模块时，整项目 `src/` 从公开 tag 展开，再宿主化 `shared.tsx` 并把 `assets.json` 重写到 `fredtalk/media/*`（LW 自有占位素材）。
- `sourcePatches`：声明式源内补丁，用于字体度量差异、对比度、演示数据标识、媒体替换等确定性修复；补丁清单在 `profiles/source-patches.json`，`adapt.py` 在适配后应用并逐条写入 `provenance.json`，`--readapt` 不会丢失。

每个适配目录包含：上游副本 `src/`、`adapter.tsx`（统一入参 `{props, accent, background, speed}`）、`provenance.json`（逐文件 URL/SHA、宿主改动、许可）、`props.json`（默认/示例参数）。

## 证据

`external/fredtalk/batch/evidence/<LW-ID>/`：`render.mp4`、5 张审片帧、`qa.json`。`status.json` 记录 adapted/render/qa/visual 状态，用于断点恢复；失败写具体错误而非“运行失败”。

## 边界

- 上游媒体（截图、录屏、图片、Logo、音效）不随 MIT 授权，仓库不收录；样片使用 LW 自有占位素材。
- T04e 使用自有公开仓库页面截图，含 GitHub UI；商用前建议去品牌化。详见 `external/fredtalk/COPYRIGHT_AND_MEDIA.md`。
- 音效仅保留事件语义，当前静音；对接方案见 `external/fredtalk/SFX_INTEGRATION.md`。
- ROI、点击坐标等参数与画面强绑定，只提供参数入口，不承诺跨素材通用。
- 所有适配组件保留 FredTalk 来源与许可，不标为 LW 原创。
