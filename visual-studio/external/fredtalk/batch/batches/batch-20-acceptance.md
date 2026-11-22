# FredTalk 自动批次 batch-20 · 验收报告

自动选件：`kit-overlay` 且 kit 文件齐全、入口导出与 import 可解析；共选 20 条。

## 1. 结论（机器 QA 与人工视觉分开）

| 指标 | 数值 |
|---|---|
| 选中 | 20 |
| 适配成功 | 20 |
| 真实 MP4 机器 QA 通过 | 20 |
| 机器 QA 失败 | 0 |
| 人工视觉通过 | 0 |
| 人工视觉待审 | 20 |
| 自动选件跳过 | 0 |

> 本批次未做人工视觉审核的部分一律记为 `pending`，不得用机器指标替代。

## 2. 逐组件状态

| LW ID | 类别 | 策略 | 通道 | 文件 | SHA | 可编辑参数 | 渲染 | 机器QA | 人工视觉 | 帧/fps | 证据 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FT-T01b-431 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | term, alias, definition, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01b-431/` |
| FT-T01c-432 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | lines, highlights | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01c-432/` |
| FT-T01d-451 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | media, dimensions, verdict, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01d-451/` |
| FT-T01e-410 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | condition, extra | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01e-410/` |
| FT-T01f-409 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | text, highlight | pass | pass | pending | 150/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01f-409/` |
| FT-T01g-411 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | title, lines, highlight, background | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01g-411/` |
| FT-T01h-396 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | subject, clarify, highlight, stamp | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01h-396/` |
| FT-T02a-449 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | items, current, mode | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02a-449/` |
| FT-T02e-412 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | items, result, highlight, sub | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02e-412/` |
| FT-T02f-413 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | background, items | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02f-413/` |
| FT-T02g-360 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | lanes, mode, current | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02g-360/` |
| FT-T02h-371 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | files | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02h-371/` |
| FT-T03c-416 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | nodes, result, highlight | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T03c-416/` |
| FT-T03d-435 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | steps, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T03d-435/` |
| FT-T04a-452 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | concept, metaphor, pairs, summary, fred | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04a-452/` |
| FT-T04b-434 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | task, roles, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04b-434/` |
| FT-T04d-415 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | topic, categories, focus | pass | pass | pending | 270/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04d-415/` |
| FT-T04e-365 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | cardImage, cardCrop, parts, result, highlight | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04e-365/` |
| FT-T04f-369 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | keyName, abilities | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04f-369/` |
| FT-T04g-393 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | question, branches, recommend | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04g-393/` |

## 3. 失败与跳过

- 无适配或渲染失败。

## 4. 产物位置

- 视频与帧：`external/fredtalk/batch/runs/batch-20/evidence/<LW-ID>/`（本地运行产物，默认不入库）
- 逐组件状态：`external/fredtalk/batch/batches/batch-20-status.json`

## 5. 边界

- 本批次只证明自动选件、适配、渲染和机器结构 QA 可跑通；视觉质量仍需人工审片。
- 上游媒体不随 MIT，自动适配只使用 LW 占位素材。
- `batch/runs/` 不永久提交，避免 432 条视频撑大仓库。

