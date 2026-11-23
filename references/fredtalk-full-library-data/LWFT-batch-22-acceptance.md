# FredTalk 自动批次 LWFT-batch-22 · 验收报告

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
| 自动选件跳过 | 1 |

> 本批次未做人工视觉审核的部分一律记为 `pending`，不得用机器指标替代。

## 2. 逐组件状态

| LW ID | 类别 | 策略 | 通道 | 文件 | SHA | 可编辑参数 | 渲染 | 机器QA | 人工视觉 | 帧/fps | 证据 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FT-T05g-406 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | left, right, symbol | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T05g-406/` |
| FT-T05h-366 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | author, authorNote, versions, zip, clone | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T05h-366/` |
| FT-T05i-367 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | appPack, codePack, appName, appIcon, appLabel, files, codeLabel, conclusion, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T05i-367/` |
| FT-T06b-433 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | myth, truth, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T06b-433/` |
| FT-T08e-358 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, comments, questions | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T08e-358/` |
| FT-T08l-294 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | tiles, tileSize, contentX, textPx, stops | pass | pass | pending | 180/30.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T08l-294/` |
| FT-T09c-421 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, form, fields, keyIndex | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09c-421/` |
| FT-T09d-654 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, inputBox, placeholder, prompt, steps, runningLabel, doneLabel | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09d-654/` |
| FT-T09d2-404 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, inputBox, placeholder, prompt, steps, runningLabel, doneLabel | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09d2-404/` |
| FT-T09f-424 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, crop, rows, pick, label, unit | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09f-424/` |
| FT-T09g-422 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | video, videoSize, start, notes | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09g-422/` |
| FT-T09i-363 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | image, imageWidth, imageHeight, crop | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09i-363/` |
| FT-T09j-368 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | command, hint, code, footer, doneLine, url, pageTitle, pageSub, button, status | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09j-368/` |
| FT-T09l-373 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | source, sourceSize, sourceCrop, field, copyButton, url, target, targetSize, targetCrop, placeholder, textStart, sendButton, sendRadius, prefix, maskColor | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09l-373/` |
| FT-T09m-375 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | keys, action, highlight | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09m-375/` |
| FT-T09o-394 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, stops, zoom, radius, brand | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09o-394/` |
| FT-T09q-287 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | video, videoSize, clipDuration, sourceDuration, marks, sourceLabel, brand | pass | pass | pending | 210/30.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09q-287/` |
| FT-T09r-288 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | video, videoSize, start, end, rampIn, rampOut, maxRate, processFocus, processZoom, resultFocus, resultZoom, speedLabel, brand | pass | pass | pending | 180/30.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09r-288/` |
| FT-T09t-290 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | files, drag, sourceWindowTitle, folderIcon, target, targetSize, targetCrop, targetRadius, splitY, placeholderBox, placeholder, boxInnerX, dropLabel | pass | pass | pending | 150/30.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09t-290/` |
| FT-T09v-291 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, crop, cropRadius, lift, anchor, anchorMaxW, anchorIconsX, current, options, pick, note, maskBoxes, dark | pass | pass | pending | 120/30.0 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/FT-T09v-291/` |

## 3. 失败与跳过

- 无适配或渲染失败。
- 跳过 **FT-T05q-250**：FT-T05q-250 kit/theme.ts or kit/ui.tsx missing from declared sources

## 4. 人工审核与返修

## 5. 工作台端到端导出（参数编辑 → MP4）

> 测试入口是 LW 工作台实际使用的 `POST /api/render-reference` + `/api/jobs/{id}` + `/exports/{id}.mp4`，不是 Remotion CLI 直渲。

- 尚未执行工作台导出验收。

## 6. 返修实现方式

- 五个组件通过 `tools/fredtalk/profiles/source-patches.json` 的声明式补丁落地，`adapt.py` 在适配后确定性应用，`--readapt` 不会丢失。
- T01d 增加 `dataNote`，默认显式标注“演示数据 · 非真实测评”；T02a 未激活卡不再整体降透明度；T04g 未推荐分支文字下限 0.8；T04a 默认关闭非透明占位图且只接受透明 PNG；T04e 改用自有公开仓库页面截图（965×1607）并补 `object-fit: cover`。

## 7. 产物位置

- 视频与帧：`external/fredtalk/batch/runs/LWFT-batch-22/evidence/<LW-ID>/`（本地运行产物，默认不入库）
- 工作台导出 MP4：`external/fredtalk/batch/runs/LWFT-batch-22/workbench-export/`（本地验收产物，默认不入库）
- 逐组件状态：`external/fredtalk/batch/batches/LWFT-batch-22-status.json`

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


## 10. 边界

- 机器 QA 只证明结构可解码；人工视觉审核单独记录，二者不互相替代。
- 上游媒体不随 MIT；本批次默认使用 LW 自占位素材，T04e 使用自有公开仓库页面截图。
- `batch/runs/` 不永久提交，避免 432 条视频撑大仓库。

