# FredTalk 自动批次 batch-20 · 验收报告

自动选件：`kit-overlay` 且 kit 文件齐全、入口导出与 import 可解析；共选 20 条。

## 1. 结论（机器 QA 与人工视觉分开）

| 指标 | 数值 |
|---|---|
| 选中 | 20 |
| 适配成功 | 20 |
| 真实 MP4 机器 QA 通过 | 20 |
| 机器 QA 失败 | 0 |
| 人工视觉通过 | 15 |
| 人工视觉有条件通过 | 3 |
| 人工视觉待返修 | 2 |
| 人工视觉待审 | 0 |
| 自动选件跳过 | 0 |

> 本批次未做人工视觉审核的部分一律记为 `pending`，不得用机器指标替代。

## 2. 逐组件状态

| LW ID | 类别 | 策略 | 通道 | 文件 | SHA | 可编辑参数 | 渲染 | 机器QA | 人工视觉 | 帧/fps | 证据 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FT-T01b-431 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | term, alias, definition, highlight | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01b-431/` |
| FT-T01c-432 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | lines, highlights | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01c-432/` |
| FT-T01d-451 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | media, dimensions, verdict, highlight | pass | pass | conditional | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01d-451/` |
| FT-T01e-410 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | condition, extra | pass | pass | pass | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01e-410/` |
| FT-T01f-409 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | text, highlight | pass | pass | pass | 150/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01f-409/` |
| FT-T01g-411 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | title, lines, highlight, background | pass | pass | pass | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01g-411/` |
| FT-T01h-396 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | subject, clarify, highlight, stamp | pass | pass | pass | 180/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T01h-396/` |
| FT-T02a-449 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | items, current, mode | pass | pass | conditional | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02a-449/` |
| FT-T02e-412 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | items, result, highlight, sub | pass | pass | pass | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02e-412/` |
| FT-T02f-413 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | background, items | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02f-413/` |
| FT-T02g-360 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | lanes, mode, current | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02g-360/` |
| FT-T02h-371 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | files | pass | pass | pass | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T02h-371/` |
| FT-T03c-416 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | nodes, result, highlight | pass | pass | pass | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T03c-416/` |
| FT-T03d-435 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | steps, highlight | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T03d-435/` |
| FT-T04a-452 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | concept, metaphor, pairs, summary, fred | pass | pass | rework | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04a-452/` |
| FT-T04b-434 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | task, roles, highlight | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04b-434/` |
| FT-T04d-415 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | topic, categories, focus | pass | pass | pass | 270/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04d-415/` |
| FT-T04e-365 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | cardImage, cardCrop, parts, result, highlight | pass | pass | rework | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04e-365/` |
| FT-T04f-369 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | keyName, abilities | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04f-369/` |
| FT-T04g-393 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | question, branches, recommend | pass | pass | conditional | 360/60.0 | `external/fredtalk/batch/runs/batch-20/evidence/FT-T04g-393/` |

## 3. 失败与跳过

- 无适配或渲染失败。

## 4. 人工审核与返修

- **FT-T01d-451** `conditional`：测评数值必须有实际来源；示例数据必须标注为“演示数据”。
- **FT-T02a-449** `conditional`：提高未激活卡片的文字对比度，不能靠整体降低透明度表达弱化。
- **FT-T04g-393** `conditional`：提高未选择分支说明文字的对比度，说明文字需保持可读。
- **FT-T04a-452** `rework`：右下角 LW 占位卡与主体流程叠加并被裁切；默认关闭非透明占位图，保留可选透明 PNG。
- **FT-T04e-365** `rework`：三张彩色占位素材需替换为真实合法图片，并验证布局、裁切和动画。

## 5. 工作台端到端导出（参数编辑 → MP4）

> 测试入口是 LW 工作台实际使用的 `POST /api/render-reference` + `/api/jobs/{id}` + `/exports/{id}.mp4`，不是 Remotion CLI 直渲。

| LW ID | 修改参数 | 文件大小 | SHA-256（前12） |
|---|---|---|---|
| FT-T02g-360 | `lanes[0].role` | 172514 B | `1bd8f6706fa4` |
| FT-T02h-371 | `files[0].name` | 450562 B | `080e38aa66bd` |
| FT-T03c-416 | `nodes[0]` | 252734 B | `1b4daa99d4b2` |
| FT-T03d-435 | `steps[0]` | 649671 B | `01ebe8320885` |
| FT-T04b-434 | `task` | 350298 B | `a7b39bb98d74` |
| FT-T04d-415 | `topic` | 435324 B | `2a122fee1a35` |
| FT-T04f-369 | `keyName` | 333439 B | `af04909e4d10` |
| FT-T01b-431 | `term` | 385678 B | `20b0ec9c7c1b` |
| FT-T01c-432 | `lines[0]` | 330879 B | `d710be3a0d7d` |
| FT-T01e-410 | `condition` | 191299 B | `f86b81df6961` |
| FT-T01f-409 | `text` | 117146 B | `d3636faeb1e6` |
| FT-T01g-411 | `title` | 254904 B | `930ced398b91` |
| FT-T01h-396 | `subject` | 147772 B | `5f39a9766cef` |
| FT-T02e-412 | `items[0].label` | 488193 B | `61a13d2e4f07` |
| FT-T02f-413 | `items[0]` | 262940 B | `097273d79478` |

逐条结果：`batches/batch-20-workbench-export.json`

## 6. 返修实现方式

- 五个组件通过 `tools/fredtalk/profiles/source-patches.json` 的声明式补丁落地，`adapt.py` 在适配后确定性应用，`--readapt` 不会丢失。
- T01d 增加 `dataNote`，默认显式标注“演示数据 · 非真实测评”；T02a 未激活卡不再整体降透明度；T04g 未推荐分支文字下限 0.8；T04a 默认关闭非透明占位图且只接受透明 PNG；T04e 改用自有公开仓库页面截图（965×1607）并补 `object-fit: cover`。

## 7. 产物位置

- 视频与帧：`external/fredtalk/batch/runs/batch-20/evidence/<LW-ID>/`（本地运行产物，默认不入库）
- 工作台导出 MP4：`external/fredtalk/batch/runs/batch-20/workbench-export/`（本地验收产物，默认不入库）
- 逐组件状态：`external/fredtalk/batch/batches/batch-20-status.json`

## 8. 边界

- 机器 QA 只证明结构可解码；人工视觉审核单独记录，二者不互相替代。
- 上游媒体不随 MIT；本批次默认使用 LW 自占位素材，T04e 使用自有公开仓库页面截图。
- `batch/runs/` 不永久提交，避免 432 条视频撑大仓库。

