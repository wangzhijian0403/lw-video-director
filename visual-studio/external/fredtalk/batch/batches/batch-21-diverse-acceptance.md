# FredTalk 自动批次 batch-21-diverse · 验收报告

自动选件：`kit-overlay` 且 kit 文件齐全、入口导出与 import 可解析；共选 20 条。

## 1. 结论（机器 QA 与人工视觉分开）

| 指标 | 数值 |
|---|---|
| 选中 | 20 |
| 适配成功 | 20 |
| 真实 MP4 机器 QA 通过 | 20 |
| 机器 QA 失败 | 0 |
| 人工视觉通过 | 0 |
| 人工视觉有条件通过 | 0 |
| 人工视觉待返修 | 0 |
| 人工视觉待审 | 20 |
| 自动选件跳过 | 0 |

> 本批次未做人工视觉审核的部分一律记为 `pending`，不得用机器指标替代。

## 2. 逐组件状态

| LW ID | 类别 | 策略 | 通道 | 文件 | SHA | 可编辑参数 | 渲染 | 机器QA | 人工视觉 | 帧/fps | 证据 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FT-OP03-467 | 录屏与视频入场 | project-expand | sha-assets | 10 | ✓ | 视频 src | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-OP03-467/` |
| FT-RC02-471 | 录屏聚焦 | project-expand | sha-assets | 10 | ✓ | 视频/起点/ROI/冻结区间 | pass | pass | pending | 480/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-RC02-471/` |
| FT-T08b-443 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | page, pageWidth, pageHeight, startY, focus, bodyTop | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T08b-443/` |
| FT-T08d-444 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | image, imageWidth, imageHeight, regions | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T08d-444/` |
| FT-T08i-356 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | media, start, fact, highlight, note, brand | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T08i-356/` |
| FT-T09a-445 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, clicks, timing, maxZoom | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T09a-445/` |
| FT-T09b-423 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, entry, dialog, confirm, offLabel, onLabel | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T09b-423/` |
| FT-T12a-448 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | index, label, title, dark | pass | pass | pending | 120/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T12a-448/` |
| FT-T12b-428 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | index, name, highlight | pass | pass | pending | 150/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T12b-428/` |
| FT-T12c-429 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | point, highlight, media, caseTitle | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T12c-429/` |
| FT-T12e-408 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | label, title | pass | pass | pending | 120/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T12e-408/` |
| FT-T12g-430 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | chapters, current, highlight | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T12g-430/` |
| FT-T20i-347 | 录屏与视频入场 | kit-overlay | sha-assets | 4 | ✓ | src, srcW, srcH, focus, zoomFrom, title, highlight | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T20i-347/` |
| FT-T05f-419 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | screens, focus | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T05f-419/` |
| FT-T09e-399 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | items, open | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T09e-399/` |
| FT-T05b-671 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | beforeLabel, beforeSteps, nowLabel, nowText, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T05b-671/` |
| FT-T05b2-398 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | beforeLabel, beforeSteps, nowLabel, nowText, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T05b2-398/` |
| FT-T05c-446 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | fileName, lines, target, oldText, newText, badge | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T05c-446/` |
| FT-T05d-447 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | left, right, rows | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T05d-447/` |
| FT-T05e-437 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | fitLabel, unfitLabel, items, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/batch-21-diverse/evidence/FT-T05e-437/` |

## 3. 失败与跳过

- 无适配或渲染失败。

## 4. 人工审核与返修

## 5. 工作台端到端导出（参数编辑 → MP4）

> 测试入口是 LW 工作台实际使用的 `POST /api/render-reference` + `/api/jobs/{id}` + `/exports/{id}.mp4`，不是 Remotion CLI 直渲。

- 尚未执行工作台导出验收。

## 6. 返修实现方式

- 五个组件通过 `tools/fredtalk/profiles/source-patches.json` 的声明式补丁落地，`adapt.py` 在适配后确定性应用，`--readapt` 不会丢失。
- T01d 增加 `dataNote`，默认显式标注“演示数据 · 非真实测评”；T02a 未激活卡不再整体降透明度；T04g 未推荐分支文字下限 0.8；T04a 默认关闭非透明占位图且只接受透明 PNG；T04e 改用自有公开仓库页面截图（965×1607）并补 `object-fit: cover`。

## 7. 产物位置

- 视频与帧：`external/fredtalk/batch/runs/batch-21-diverse/evidence/<LW-ID>/`（本地运行产物，默认不入库）
- 工作台导出 MP4：`external/fredtalk/batch/runs/batch-21-diverse/workbench-export/`（本地验收产物，默认不入库）
- 逐组件状态：`external/fredtalk/batch/batches/batch-21-diverse-status.json`

## 9. 全新克隆复核

- 克隆：`/home/user/ft_verify_9dbce24` @ `9dbce24`
- npm ci / build：True / True
- 字体：`npm run setup:fred`（缺字体会导致渲染网络错误）
- 测试：{'unit': 18, 'api': 9, 'python': 15, 'fredtalkNode': 5, 'fail': 0}
- 上游源码：inventory {'rows': 432, 'kitOverlay': 135, 'fetched': True}

| 抽样重渲 | 帧数 | 结果 |
|---|---|---|
| FT-T01b-431 | 300 | pass |
| FT-T09s-289 | 180 | pass |
| FT-T20f-395 | 300 | pass |

### 输入指纹实测
- `FT-T01b-431` 参数 `term`；未改参数：rendered=0 skipped=1
- 改参数后：rendered=1 skipped=0；SHA `742f4183f55c` → `57617d1c9dcc`
- 改回参数后 SHA 复原为 `742f4183f55c`

### 自动选件
- 用真正 `--all-kit --dry-run` 入口选中 20 条：`{"录屏与视频入场": 1, "录屏聚焦": 6, "内容交接": 5, "图片与作品": 2, "讲解段落": 6}`
- IDs：`FT-OP03-467, FT-RC02-471, FT-T09c-421, FT-T09d-654, FT-T09d2-404, FT-T09f-424, FT-T09g-422, FT-T12h-361, FT-T12i-362, FT-T12k-336, FT-T12m-338, FT-T12n-339, FT-T11c-417, FT-T11d-418, FT-T05g-406, FT-T05h-366, FT-T05i-367, FT-T06b-433, FT-T08e-358, FT-T08l-294`
- 注意：必须先运行 inventory.py 拉取 pinned 上游源码；只 npm ci 会导致 auto selection 只剩 2 条 project-expand。
- 注意：workbench-export 与 render 的 props.json 现在是渲染输入事实来源；registry 过期不再造成错误跳过。

## 9. 渲染重试

- 首轮：16 条通过；4 条失败。
- 失败原因：Chromium 渲染进程先崩溃（Runtime.callFunctionOn Target closed），后续条目报 Target.createTarget Failed to open a new tab，属级联错误；组件适配和素材未变。
- 新进程重跑：4 条通过，未改组件内容。
- 重跑命令：`LW_BROWSER=/usr/local/bin/chromium node tools/fredtalk/render_batch.mjs --plan external/fredtalk/batch/runs/batch-21-diverse/plan.json --only FT-T12c-429 FT-T12e-408 FT-T12g-430 FT-T20i-347 --force`

## 10. 边界

- 机器 QA 只证明结构可解码；人工视觉审核单独记录，二者不互相替代。
- 上游媒体不随 MIT；本批次默认使用 LW 自占位素材，T04e 使用自有公开仓库页面截图。
- `batch/runs/` 不永久提交，避免 432 条视频撑大仓库。

