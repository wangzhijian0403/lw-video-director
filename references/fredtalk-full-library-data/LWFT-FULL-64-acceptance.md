# FredTalk 自动批次 LWFT-FULL-64 · 验收报告

自动选件：`kit-overlay` 且 kit 文件齐全、入口导出与 import 可解析；共选 64 条。

## 1. 结论（机器 QA 与人工视觉分开）

| 指标 | 数值 |
|---|---|
| 选中 | 64 |
| 适配成功 | 64 |
| 真实 MP4 机器 QA 通过 | 63 |
| 机器 QA 失败 | 1 |
| 人工视觉通过 | 0 |
| 人工视觉有条件通过 | 0 |
| 人工视觉待返修 | 0 |
| 人工视觉待审 | 64 |
| 自动选件跳过 | 3 |

> 本批次未做人工视觉审核的部分一律记为 `pending`，不得用机器指标替代。

## 2. 逐组件状态

| LW ID | 类别 | 策略 | 通道 | 文件 | SHA | 可编辑参数 | 渲染 | 机器QA | 人工视觉 | 帧/fps | 证据 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FT-T09w-292 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | source, sourceSize, tableCrop, cellX, rowTops, lineTop, lineH, lanes, doneLabel, highlight | pass | pass | pending | 180/30.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T09w-292/` |
| FT-T09z-293 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, crop, cropRadius, lift, textStart, textSize, placeholderBox, maskBoxes, prefix, query, items, pick, after | pass | pass | pending | 120/30.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T09z-293/` |
| FT-T10a-357 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | image, imageSize, maskBoxes, maskColor, items | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T10a-357/` |
| FT-T11c-417 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | clips | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T11c-417/` |
| FT-T11d-418 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | media, lines | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T11d-418/` |
| FT-T12h-361 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | from, to, note, accentTo | pass | pass | pending | 120/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12h-361/` |
| FT-T12i-362 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | question, label | pass | pass | pending | 120/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12i-362/` |
| FT-T12k-336 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | index, label, title | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12k-336/` |
| FT-T12m-338 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | index, prevTitle, title | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12m-338/` |
| FT-T12n-339 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | index, prevTitle, title, label, depth | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12n-339/` |
| FT-T12o-340 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | index, label, title | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12o-340/` |
| FT-T12p-341 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | index, label, title, bars | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12p-341/` |
| FT-T12q-342 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | index, label, title, pool | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12q-342/` |
| FT-T12r-343 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | titles, index | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12r-343/` |
| FT-T12s-344 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | index, label, title | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12s-344/` |
| FT-T12t-345 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | index, label, title, ratio | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T12t-345/` |
| FT-T13a-389 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | layers, focus, note, highlight | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T13a-389/` |
| FT-T13b-390 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | concept, object, link, line, highlight | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T13b-390/` |
| FT-T13c-391 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | item, unit, containers, overText, fitText | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T13c-391/` |
| FT-T13d-392 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | you, server, addressLabel, address, request, result, highlight, timeLabel, seconds | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T13d-392/` |
| FT-T14a-653 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | a, b | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T14a-653/` |
| FT-T14a2-403 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | a, b | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T14a2-403/` |
| FT-T14b-400 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | label, value, decimals, prefix, suffix, unit, meaning, highlight, background | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T14b-400/` |
| FT-T14c-450 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | label, value, decimals, prefix, unit, compareLabel, compareValue, deltaText, background | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T14c-450/` |
| FT-T14d-425 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | label, from, to, decimals, prefix, suffix | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T14d-425/` |
| FT-T14f-379 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | value, min, max, decimals, prefix, suffix, zones, caption | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T14f-379/` |
| FT-T15b-401 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | columns, rows, focusRow, focusCol, image | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T15b-401/` |
| FT-T15d-427 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | caption, items, prefix, decimals, totalLabel, totalUnit | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T15d-427/` |
| FT-T15e-376 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | series, labels, highlight, xDomain, yDomain, xTicks, yTicks, xPrefix, xSuffix, yPrefix, ySuffix, xTitle, yTitle | pass | fail | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T15e-376/` |
| FT-T15f-377 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | segments, highlight, decimals, centerNote | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T15f-377/` |
| FT-T15g-380 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | rows, decimals, prefix, suffix, caption | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T15g-380/` |
| FT-T15h-381 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | columns, rows, totalLabel | pass | pass | pending | 420/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T15h-381/` |
| FT-T15i-382 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | plans, recommend, tag | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T15i-382/` |
| FT-T16a-383 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | nodes | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T16a-383/` |
| FT-T16b-384 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | versions | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T16b-384/` |
| FT-T17a-454 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | fileName, lines, focusLines, maskKeys, calloutLine | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T17a-454/` |
| FT-T17b-453 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | title, command, outputLines, resultIndex, prompt | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T17b-453/` |
| FT-T17c-372 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | tree | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T17c-372/` |
| FT-T18a-455 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | logo, name, tagline, capabilities, background | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T18a-455/` |
| FT-T18b-402 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | tools, input | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T18b-402/` |
| FT-T18c-441 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | page, pageWidth, pageHeight, points | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T18c-441/` |
| FT-T18d-364 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | owner, repo, badges | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T18d-364/` |
| FT-T18e-388 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | left, right, vs | pass | pass | pending | 180/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T18e-388/` |
| FT-T18f-385 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | logos, groups, focus | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T18f-385/` |
| FT-T19a-456 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | character, pains, keyword, summary, summaryKey, holdAt | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T19a-456/` |
| FT-T19c-442 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | result, resultAspect, character, characterStart, holdAt, comment, highlight | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T19c-442/` |
| FT-T20a-655 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | media, heroIndex, hook, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20a-655/` |
| FT-T20b-439 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | painTitle, painSteps, resultImage, caption, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20b-439/` |
| FT-T20c-438 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | product, logo, backdrop, points, highlight | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20c-438/` |
| FT-T20d-420 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | works, title, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20d-420/` |
| FT-T20h-346 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | media, ratio, heroIndex, title, highlight | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20h-346/` |
| FT-T20j-348 | 讲解段落 | kit-overlay | sha-assets | 4 | ✓ | words, title, highlight | pass | pass | pending | 216/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20j-348/` |
| FT-T20k-349 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | src, ratio, start, title, highlight | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20k-349/` |
| FT-T20l-350 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | media, ratio, heroIndex, title, highlight | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20l-350/` |
| FT-T20m-351 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | hook, highlight, src, ratio, start | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20m-351/` |
| FT-T20n-352 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | avatar, face, zoom, question, answer, highlight | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20n-352/` |
| FT-T20o-353 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | value, decimals, unit, caption, title, highlight | pass | pass | pending | 216/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20o-353/` |
| FT-T20p-354 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | src, ratio, cols, title, highlight | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20p-354/` |
| FT-T20q-355 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | word, src, ratio, title, highlight | pass | pass | pending | 240/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T20q-355/` |
| FT-T21a-440 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | items, sentence, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T21a-440/` |
| FT-T21b-359 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | items | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T21b-359/` |
| FT-T21d-397 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | title, items, highlights, hint | pass | pass | pending | 360/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T21d-397/` |
| FT-T22a-386 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | image, imageWidth, imageHeight, line, translation, highlight | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T22a-386/` |
| FT-T22b-387 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | items | pass | pass | pending | 300/60.0 | `external/fredtalk/batch/runs/LWFT-FULL-64/evidence/FT-T22b-387/` |

## 3. 失败与跳过

- **FT-T15e-376**：render=pass，machineQA=fail，reason=未记录
- 跳过 **FT-T05q-250**：FT-T05q-250 kit/theme.ts or kit/ui.tsx missing from declared sources
- 跳过 **FT-T17i-272**：FT-T17i-272 kit/theme.ts or kit/ui.tsx missing from declared sources
- 跳过 **FT-T20u-279**：FT-T20u-279 kit/theme.ts or kit/ui.tsx missing from declared sources

## 4. 人工审核与返修

## 5. 工作台端到端导出（参数编辑 → MP4）

> 测试入口是 LW 工作台实际使用的 `POST /api/render-reference` + `/api/jobs/{id}` + `/exports/{id}.mp4`，不是 Remotion CLI 直渲。

- 尚未执行工作台导出验收。

## 6. 返修实现方式

- 五个组件通过 `tools/fredtalk/profiles/source-patches.json` 的声明式补丁落地，`adapt.py` 在适配后确定性应用，`--readapt` 不会丢失。
- T01d 增加 `dataNote`，默认显式标注“演示数据 · 非真实测评”；T02a 未激活卡不再整体降透明度；T04g 未推荐分支文字下限 0.8；T04a 默认关闭非透明占位图且只接受透明 PNG；T04e 改用自有公开仓库页面截图（965×1607）并补 `object-fit: cover`。

## 7. 产物位置

- 视频与帧：`external/fredtalk/batch/runs/LWFT-FULL-64/evidence/<LW-ID>/`（本地运行产物，默认不入库）
- 工作台导出 MP4：`external/fredtalk/batch/runs/LWFT-FULL-64/workbench-export/`（本地验收产物，默认不入库）
- 逐组件状态：`external/fredtalk/batch/batches/LWFT-FULL-64-status.json`

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

