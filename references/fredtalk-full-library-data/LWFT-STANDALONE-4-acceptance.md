# LWFT-STANDALONE-4 · props 驱动独立组件补录验收（2026-11-24）

## 结论

在 286 条活跃库「还差 174 条」里，本轮把其中 **4 条 props 驱动的 standalone 组件**补齐并真实渲染、机器 QA 通过、正式入库：
`FT-NMC01-457`（新闻快闪）、`FT-INT01-463`（要点高亮扫过）、`FT-INT02-464`（要点聚光聚焦）、`FT-INT04-466`（聊天消息流）。

- 活跃库可执行：**112 → 116**；还差：**174 → 170**。
- 全量 432 口径可执行：**113 → 117**（FredTalk）。
- 工作台「动效库」可见可渲外部动效：**353 → 357**（240 Motion Prompt + 117 FredTalk）。

## 为什么这 4 条能补，而其余不能

这 4 条的媒体**由 props 传入或可关闭**，不依赖缺失的上游素材：
- `FT-NMC01-457`：`pages[].src` / `audioSrc` 由调用方给（纯 `Img`/`Audio`）。
- `FT-INT01-463` / `FT-INT02-464`：`src` 由调用方给（纯 DOM + `Img` + SVG 遮罩）。
- `FT-INT04-466`：消息文字为默认数据，`withSound:false` 可关闭音效（纯 DOM 绘制）。

适配器用 LW 本地占位素材（`fredtalk/media/lw-work-*.jpg`、`lw-ui-screenshot.png`）作为示例 props，渲染的是**真实上游组件代码**，不是静态截图，也不是通用动画替代。

## 验证证据（真实渲染 + QA）

| ID | Composition 帧数 | 真渲结果 | 帧差（首/中/尾） | 机器 QA |
| --- | ---: | --- | --- | --- |
| FT-NMC01-457 | 180 / 30fps | 1280×720 pass | 27.94 / 32.42 | 真动画 pass |
| FT-INT01-463 | 210 / 30fps | 1280×720 pass | 17.59 / 2.34 | 真动画 pass |
| FT-INT02-464 | 210 / 30fps | 1280×720 pass | 158.69 / 1.9 | 真动画 pass |
| FT-INT04-466 | 330 / 30fps | 1280×720 pass | 1.46 / 3.86 | 真动画 pass |

- 独立 bundle + `renderMedia` 真渲 4/4 通过，OpenCV 抽帧确认均为真实动画（非静态截图）。
- 工作台端到端：独立服务 `/api/render-reference` 4/4 `done`，产出真实 MP4。
- 完整回归：Python 33/33、前端单元 34/34、接口 10/10 全过。
- 主仓库与本地 Skill 的 catalog / registry / adapter 源码 SHA-256 逐一一致。

## 入库改动

- 新增工具：`tools/fredtalk/scan_generic.py`（只读可覆盖性扫描）、`build_standalone_batch.py`（适配器生成）、`promote_standalone_batch.py`（正式注册）。
- 新增 4 条 `external/fredtalk/adapted/<ID>/`（上游源码 + LW adapter + provenance + props）。
- `external/catalog.json`：4 条置 `executable=true`、`installStatus=source-adapted-verified`、`renderStatus=passed`、`adapter=fred-batch`。
- `fredtalk-registry.data.json` / `.generated.tsx`：133 → 137 条注册。
- 测试断言同步：`schema.test.mjs` 113→117、`api.test.mjs` 358→362 / 113→117（陈旧基线更新，非放水）。

## 诚实边界

- 这 4 条用 **LW 占位素材**作示例，视觉效果与官方预览不同；用户替换为自己的图片/视频即可，属合规的「已验证组件 + 自有素材」，不是「官方原样复刻」。
- 其余 **170 条仍未入库**：148 条整段剧集 replay 深度依赖本地/上游都取不到的媒体（`brand.png`、`recordings/` 帧序列、`MiSans`/`RuiZi` 字体，`FontFace().load()` 失败即 `cancelRender`，`<Img>` 动态拼接路径加载失败三次即中止）；4 条未适配（T05q/T17i/T20u/V037 也依赖字体+视频）；18 条机器 QA 未过。已用 POC实证：剧集类即使补齐适配器也无法真渲，不是「再跑一次批量任务」能解决，不得伪造完成。
