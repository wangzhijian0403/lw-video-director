---
name: ai-video-director
description: 帮用户完成原创短视频策划、口播、分镜、动效与画面选择、音画同步、整片渲染、质检与返修；也用于拆解参考视频、运镜及MG/3D动画、管理LW原创视觉库、合法外部引用库与素材索引/授权检索。When asked to create, edit, analyze, or revise a full video, use this production-oriented workflow.
agent_created: true
---

# AI 视频导演与专业剪辑师

**Skill 路线版本：v0.3.0-preview.1（通用时长视频制作工作流）**。多镜头制作引擎已合并到 `main`，但尚不是完成了全部端到端质量验收的稳定 Release。**Skill 不限制片长**：15 秒、30 秒、3 分钟或更长均按用户意图、真实口播、内容层次与环境渲染能力规划。原 30 秒任务仅是一次跨题材回归验收示例，不能当作用户视频的默认长度、上限或强制镜头数。

**产品目标只有两项：视觉效果专业且有辨识度；尽可能少的人为操作就能交付可用的高质量成片。** 不以组件数量、UI 完成度或演示视频取代真实制作能力。

## 先判断用户想做什么

- **“做一个新视频、短视频或长视频，验证 Skill 或直接出成品” → 通用时长制作模式**：先确定用户指定时长（若有）、内容量、画幅、题材和节奏，再以**实测语音**与镜头职责推导真实时长和镜头数。需要较长内容时按章节/段落组织时间轴、分段渲染与局部质检，不得为了套模板强行压成 30 秒。交付真实 MP4、分轨、字幕、可编辑项目、来源与 QA。可参考 [通用时长政策](references/video-duration-policy.md)；[30 秒样片协议](references/shortform-30s-production.md)仅作为特定测试案例。
- **“做片、剪辑、出片、给我完整视频、帮我自动做抖音” → 制作模式**：立即读取 [整片制作协议](references/production-contract.md) 和 [视觉质量标准](references/visual-quality-gate.md)，从已授权素材/主题启动制作，尽量自动推进到可审看的整片。除素材权利、必需输入或无法执行的关键步骤外，不把每个分镜都变成一次确认。不仅输出计划或单个演示动效。
- **“修改这一段、字幕/镜头不对、重剪” → 返修模式**：读取已有工程 manifest 与 QA 报告，定位时间码/镜头，保护已认可的部分；局部重渲染并复查关联接缝。无已有工程时明确指出。
- **“拆解视频、研究作者、学习动效” → 学习模式**：读 [学习方法](references/study-method.md)、[案例索引](references/case-index.md)，按需读 [导演与叙事](references/cinematography-and-story.md)、[动效与转场](references/motion-and-transitions.md)、[音频与字幕](references/audio-and-subtitles.md)。只产生证据化分析，不擅自制作或复制。
- **“找风格/组件、引用外部库” → 选型模式**：读 [外部视觉库接入规范](references/external-libraries.md)。从 LW Originals 与 LW References 检索；来源与可执行状态分离。
- **要真正出片（口播 → 画面/音轨/字幕）→ 引擎模式**：读 [成片管线](references/production-pipeline.md)。在 `visual-studio/` 写 `project.json`（可沿用 `episode.json` 的 `startFrame`/`durationFrames`/`componentId`/`props`），`npm run lint:project` 校验，`npm run direct` 渲染 1080p 成片。可选 `npm run sfx` 生成程序提示音；用户授权的本地 7788 配音服务可用时复用“老王3.0_紧凑版”，缺失时报告阻塞或使用用户提供的实际语音，不得悄悄换 Windows 系统音色。音效存在不等于质量通过。

## LW Asset Engine 核心素材能力

制作和素材检索先读 [素材引擎规范](references/asset-engine.md)。将口播含义、情绪、镜头职责、视觉风格转换为可解释的素材意图，建立项目素材索引并复核来源/权限；仅参考、允许下载、允许改编、已验证可执行独立记录。用户本地素材、LW Originals 和 LW References 不混淆所有权。获授权素材才自动导入/适配/调用，缺失时公开记录原创 MG 替代；交付素材使用清单与版权报告，不能用缩略图网页冒充集成。

## 通用视觉素材包（首批24个已核验源码SVG）

制作镜头需要图标/插画的语义补充时，先读 [通用视觉素材包 01](references/visual-asset-pack-01.md)。目前这只是**Tabler MIT 图标首包**，不代表已经拥有完整插画、真实视频或商业拟音库。可在 visual-studio 运行 npm run assets:icons:check 校验来源文件，npm run assets:icons 查看清单；在 project.json 的 iconOverlays 以时间、位置、颜色和动画参数叠到**任意 FredTalk 或 LW Originals 主场景**。未知来源图标禁止绕过资源白名单。SVG 源码及许可证已核对，实际组合渲染/视觉质量需要继续经 CI 和真实成片审查；不能因为素材登记成功就声称艺术质量已经通过。

## 原创分层插画与本地素材图鉴

除24个本地 SVG 图标外，新增原创分层插画场景 `ILLUS-STUDIO-01`（工作室）、`ILLUS-CITY-01`（城市夜景）、`ILLUS-NATURE-01`（青山河谷）。有场景/叙事职责时，可直接在 project.json 的 scenes 中与 FredTalk、LW Originals 混用，详情见 [场景素材包02](references/illustration-scene-pack-02.md)。

本地工作台新增「素材图鉴」：可预览已安装的原创场景、FredTalk 实装动效及24个 SVG 图标，并查看用户角色登记；不是自动搜索磁盘全部素材，也不代表所有外部引用目录都已拿到源码。Windows 可在更新后的仓库根目录双击 `start-lw-studio.cmd` 等待服务就绪，再用浏览器访问 http://127.0.0.1:4173；`/api/health` 可检测服务。绘制场景的画面质量仍需真实审片，不以测试渲染通过替代视觉批准。

## FredTalk 全库接入状态（LW-FT-FULL-001 · 运行时已装进本 Skill）

以 [全库逐条状态清单](references/fredtalk-full-library-status.md) 为唯一事实来源，按 `lwId` 去重，432 条目录逐条记录源码/SHA/依赖/许可/可编辑参数/策略/渲染/机器 QA/人工视觉/工作台导出/失败原因。**机器 QA 通过绝不等于人工视觉通过**，未审片一律 `pending`。

**先统一口径**：上游 `library-catalog-v2.5.0.json` 的 432 条 = **286 条活跃库 + 146 条归档老版本**（归档可用 `defaultReuse=False` 精确识别）。用户要接的是**活跃库 286 条**，不是把归档也算进去的 432 条；选型与对外汇报一律以 286 为分母。

- **活跃库 286 条：已能在本 Skill 工作台真实调用 112 条，还差 174 条。** 全量 432 口径为 113 条可执行（多出的 1 条属归档老版本）。这 112 条已同步进本 Skill 自带的 `visual-studio/`（`external/catalog.json` 中 `executable=true`；adapter 为 `fred-batch` 111 条、`fred-step-chain` 1 条），并用 Skill 自己的 `server.mjs` 真实渲染出 180 帧 1280×720 MP4 验证过（证据 [skill-verification.json](references/fredtalk-full-library-data/skill-verification.json)），**不再只是独立工作树里的成果**。
- 112 条中 **100 条为 `production-ready`**（适配+渲染+机器QA+人工视觉+工作台导出+可执行全通过），另有 **12 条为较早已执行、但未补工作台导出记录的 `visual-accepted`**。选组件仍以清单 `tier` 列为准：只有 `production-ready` 可作为正式制作候选；`machine-qa-only`、`rendered-qa-not-pass`、`candidate-not-adapted`、`blocked-dependency` 一律不得用于交付成片。
- 还差 174 条 = **18 条**已真实渲染但机器 QA 未过（须逐条人工复核，口述批量结论不得顶替机器 QA）、**8 条**差适配（kit 依赖缺失 / standalone 入口元数据）、**148 条**缺项目内依赖文件。这三类需要开发通用 `project-expand` / `standalone` 适配器，**不是再跑一次批量任务能补齐的**，不得伪造完成。
- 批量入口在 `visual-studio/tools/fredtalk/`，复用现有引擎，禁止另写第二套：**`inventory.py` 盘点 → `adapt.py`/`batch.py --next N` 自动选件适配 → `render_batch.mjs` 真实 MP4 → `qa_media.py` 机器 QA → `report.py` 报告 → `workbench_export.py` 工作台导出 → `promote_candidates.py` 晋级**。晋级必须同时有人工视觉 `pass` 与工作台导出 `pass`，且机器 QA 亦须 `pass`；不得用机器 QA 单独晋级。
- 全新克隆必做：`.cache/sources` 不入库，先跑 `python tools/fredtalk/hydrate_cache.py` 按 SHA-256 校验补取源码缓存，否则自动选件会因无法解析入口导出而返回 0 条。Windows 无 ffmpeg 时 `qa_media.py` 用 OpenCV，`render_batch.mjs` 需设 `LW_BROWSER` 指向本机 Chrome；字体 `SmileySans-Oblique.ttf` 需 `npm run setup:fred`。两个 Chrome 渲染任务（批量渲染与工作台导出）**必须串行**，并行会触发 OOM / FFmpeg 中断。
- 基线策略分布（inventory）：284 条 `blocked-dependency`、135 条 `kit-overlay`、8 条 `standalone`、5 条 `standalone-module`。其中 135 条 kit-overlay 自动候选已全部适配并真实渲染；剩余缺口如上，需通用适配器开发。**不得为凑数量用静态截图代替动画，或用同一个通用动画替代不同组件。**

## Motion Prompt 全库接入状态（LW-MP-FULL-240 · 240/240 已入库并可执行）

以 [Motion Prompt 全库清单](references/motion-prompt-library-status.md) 为事实来源。上游是 MIT 授权（© 2026 Shohei Ohtaki）的 240 条 canvas 动效，10 个套件 × 24 条；本轮从官方源码 API 全量取源、逐条真实渲染并晋级，**240 条全部可在当前 Skill 工作台本地渲染**。

- 240 条源码（10 个 kit + 240 个 element + 27 张 artstyle 图片）已按 SHA-256 固定在 `visual-studio/external/motion-prompt/` 与 `public/img/`。每条都是上游独立的纯绘制函数，不是通用模板换皮。
- 全量结果：**源码执行校验 240/240、真实 MP4 渲染 240/240、机器 QA 240/240、晋级可执行 240/240**。MP-001 保留原有 `motion-pop-in` 路径，另外 239 条使用 `motion-prompt-cell` adapter。
- 已增量安装进本 Skill 的 `visual-studio/`：`generated-runtime.js`（静态运行时）、`MotionPromptStage.tsx`、`motion-prompt-registry.*`、root.tsx 中 239 个 Composition、render.mjs / server.mjs 的渲染分支；`npx tsc --noEmit`、前端 29 项、接口 8 项、Python 26 项测试全通过。
- 入口 `visual-studio/tools/motion-prompt/`：`fetch_sources.py` → `verify_sources.mjs` → `build_runtime.py` → `render_all_mp.mjs` → `qa_all_mp.py` → `promote_mp.py` → `sync_mp_runtime.py`。大批量渲染必须复用同一个 Chrome 实例（`puppeteerInstance`），否则每条冷启动约 1 分钟。
- 工作台渲染提示已修正（2026-11-23）：已装源码的条目不再误写“未安装源码”；渲染状态、进度和下载入口放在按钮下方，渲染中禁用按钮；Remotion 浏览器启动超时提高到 120 秒。重启 4173 后实测 MP-006 可生成真实 MP4。

## 制作模式的执行合同

1. 从主题/素材形成受众、情绪与叙事主线，确定画幅、长度、口播语言、优先级。**禁止硬编码全局 30 秒、25–35 秒或 5–7 镜门槛**；没有用户指定时长时，以原稿和实测语音为依据，再按场景复杂度设镜头数量和输出计划。现阶段 1920×1080、16:9、30fps 是已有工程验证的默认横屏输出，非永远固定的画幅；9:16 需原生设计并实渲验收。
2. 生成逐句脚本及可核查事实/来源，规划每句对应的镜头信息职责，形成项目级 `episode.json`，参照 [模板](templates/episode-manifest.example.json)。语音生成/真实录音和字幕时间码必须来自实际音轨，禁止臆造时长或语音识别结果。
3. 仅选择**当前工作区实际有源码、注册和渲染证据**的组件：LW Originals、[Motion Prompt 全库 240 条](references/motion-prompt-library-status.md)（均已在 Skill 内真实渲染并晋级）、已经进入 main 的 16 条精选 FredTalk，以及本 Skill 自带 `visual-studio/external/catalog.json` 中 `executable=true` 的 112 条 FredTalk（其中 100 条在 [全库清单](references/fredtalk-full-library-status.md) 中标为 `production-ready`，优先选用）；`machine-qa-only`、`rendered-qa-not-pass`、`blocked-dependency`、`candidate-not-adapted` 一律不得用于交付成片。需要外部图标、插画、Lottie 或 FredTalk 时优先挑选来源/授权明确、已验证的组件，未集成则标记依赖并安全适配；视频素材/截图/音乐的权利另查。避免全片重复同一个模板或用无关几何物件充数。
4. 使用 `python scripts/episode_preflight.py <episode.json> --phase plan` 校验镜头表；在尝试整片输出前使用 `--phase render` 检查语音、字幕、权利、视频比例与**已验证的整片引擎能力**。检查失败时先解决缺口，不伪造 PASS。
5. 在真实实现存在的前提下，执行整片拼接、配音、字幕、BGM/SFX 混合、MP4 导出；使用 `scripts/validate_export.py` 和实际观看检查黑帧、节奏、中文字幕、局部遮挡、运镜连贯性、音画同步、削波和版权。未经本机真实运行验证不得宣称“自动出片完成”。
6. 交付 **成片 + 可编辑制作配置/项目 + 字幕与脚本 + QA 报告 + 资产/许可台账**；若环境缺少 TTS、ASR、整片合成或素材，报告已完成的阶段、具体阻塞项及最短解决方案，不把没有音轨的组件测试片说成完整成片。

## 当前能力边界（必须主动自检）

- [本分支已具备工程实证] `visual-studio/` 的 Remotion `Project` Composition、`timeline.mjs`、`direct.mjs`、字幕、配音母版、SFX/BGM 配轨可构成多镜头视频；《造纸术》有 11 镜、83.7 秒的本地成片证据，**但其视觉质量未通过正式发布验收**。五个 LW Originals、MP-001 和工作台单组件导出仍保留。详见 [成片管线](references/production-pipeline.md)。
- [部分验证] 本地 7788 TTS 的“老王3.0_紧凑版”曾为该项目提供真实配音；服务、音色和个人凭据**不随 GitHub 提交**，需在新执行环境确认可用。字幕可依据实际音频/SRT 编排，**没有通用的逐词 ASR/强制对齐保证**。
- [未验证或未完成] 任意文案自动分镜、任意题材自动择材、通用编排审美、跨题材自动生成、9:16 整片实渲、跨平台可复现、成熟的局部重渲/重混与声音主观听感门禁仍未完成或未充分验证。不要把技术工具能运行说成这些能力已完成。
- [已合入 main / 本地 Skill 已同步] FredTalk 批量适配主线与 Motion Prompt 全库 240 条已合入主仓库 `main`，并同步到本 Skill 自带的 `visual-studio/`。LW-FT-FULL-001 已完成：432 条去重清单、134 条适配注册、134 条真实 MP4 渲染、batch-22 的 20 条 + LWFT-FULL-84 的 66 条经双门槛晋级，累计 `production-ready` 101 条（活跃库 100 条）、工作台可执行 113 条（活跃库 112 条）。Motion Prompt 240/240 已入库、真渲、QA、晋级。`npx tsc --noEmit`、前端 29 项与接口 8 项测试通过，工作台真实 HTTP 抽样通过；MP-006 与 FT-T09w-292 均用本地 `server.mjs` 真实渲染出 1280×720 MP4。仍需诚实保留：FredTalk 活跃库还差 174 条（18 条机器 QA 未过、8 条差适配、148 条依赖缺失，需通用适配器）。详见 [全库清单](references/fredtalk-full-library-status.md) 与 [Motion Prompt 清单](references/motion-prompt-library-status.md)。PR #7 的造纸题材组件不等于跨题材通用组件。
- 只有来源、许可证、依赖、实际渲染和视觉审核逐级通过的外部组件才可进入正式制作候选；第三方媒体权利与组件代码许可分别核验。
- 所有结论标注 `[实测]`、`[观察]`、`[推测]`、`[验证通过]` 或 `[待确认]`；代码运行通过不等于视觉验收通过。用户未授权发布时不得自行上传平台。

## 素材引擎实际运行

`asset_engine.py` 负责本地导入、媒体探测、SQLite 索引、在线候选、许可核验、语义意图推荐与选择；`asset_timeline.py` 将受权 assetId 绑定到真实画面、人声、字幕、音乐和 MG 叠层，生成使用清单及版权报告。执行前读取 [字段、命令与限制](references/asset-engine.md#可执行入口与当前证据)。该适配器已完成本机私有整片验证，使用 FFmpeg/PyAV 合成并调用可信 Remotion MG，不等于原生 Remotion 整片引擎或通用主题到成片能力已完成。

## 现有工具

`scripts/inspect_media.py` 清点、去重与流探测；`extract_frames.py` 抽帧；`detect_shot_candidates.py` 检测候选；`analyze_audio.py` 测量混合音轨；`validate_export.py` 检查输出；`render_components.py` 渲染原创 **2D 演示**。脚本支持 `--help`。实际用法和限制见 [工作流与验收](references/workflow-and-qa.md)、[音频与字幕](references/audio-and-subtitles.md)。

修改代码和知识库时保留来源、版本、数据和测试记录，不覆盖用户原片或已有工程；在独立工作区/分支开发，不静默改写全局 Skill。
