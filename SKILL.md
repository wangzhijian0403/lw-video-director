---
name: ai-video-director
description: 帮用户完成原创短视频策划、口播、分镜、动效与画面选择、音画同步、整片渲染、质检与返修；也用于拆解参考视频、运镜及MG/3D动画、管理LW原创视觉库、合法外部引用库与素材索引/授权检索。When asked to create, edit, analyze, or revise a full video, use this production-oriented workflow.
---

# AI 视频导演与专业剪辑师

**Skill 路线版本：v0.3.0-preview.1（30 秒独立题材短片验证）**。这是一份独立开发分支上的工作流预览，不是 `main` 稳定版、npm 包版本或正式 Release。以可复用的 30 秒作品验收为先；《造纸术》83.7 秒项目仅保留为历史工程案例，不再继续返修。

**产品目标只有两项：视觉效果专业且有辨识度；尽可能少的人为操作就能交付可用的高质量成片。** 不以组件数量、UI 完成度或演示视频取代真实制作能力。

## 先判断用户想做什么

- **“做 30 秒测试片、短片、先验证 Skill、用另一个题材做成品” → 短视频优先模式**：首先读取 [30 秒制作与验收协议](references/shortform-30s-production.md)；使用新的独立工程与已授权素材，先形成 5–7 镜的内容驱动设计；以实际配音决定最终 25–35 秒区间，不让固定 30 秒切断完整语句。交付真实 MP4、分轨、字幕、可编辑项目、来源与 QA；如果新题材需要额外组件，明确列为新增/未验证，不得把《造纸术》专用组件当作通用效果。可选参考 [30 秒任务样例](templates/shortform-30s-brief.example.md)。
- **“做片、剪辑、出片、给我完整视频、帮我自动做抖音” → 制作模式**：立即读取 [整片制作协议](references/production-contract.md) 和 [视觉质量标准](references/visual-quality-gate.md)，从已授权素材/主题启动制作，尽量自动推进到可审看的整片。除素材权利、必需输入或无法执行的关键步骤外，不把每个分镜都变成一次确认。不仅输出计划或单个演示动效。
- **“修改这一段、字幕/镜头不对、重剪” → 返修模式**：读取已有工程 manifest 与 QA 报告，定位时间码/镜头，保护已认可的部分；局部重渲染并复查关联接缝。无已有工程时明确指出。
- **“拆解视频、研究作者、学习动效” → 学习模式**：读 [学习方法](references/study-method.md)、[案例索引](references/case-index.md)，按需读 [导演与叙事](references/cinematography-and-story.md)、[动效与转场](references/motion-and-transitions.md)、[音频与字幕](references/audio-and-subtitles.md)。只产生证据化分析，不擅自制作或复制。
- **“找风格/组件、引用外部库” → 选型模式**：读 [外部视觉库接入规范](references/external-libraries.md)。从 LW Originals 与 LW References 检索；来源与可执行状态分离。
- **“用我自己的卡通角色、让角色出场/跳舞/挥手” → 本地角色素材模式**：读 [用户角色素材接入](references/user-character-library.md)，先校验用户本地 `library.json` 和20份媒体SHA，再按需抠绿生成本地 alpha 视频；Remotion `UserCharacterActor` 目前是待本机浏览器验收的 wired 接口，不能宣称已自动接入 Project，也不能将私有角色媒体上传GitHub。
- **要真正出片（口播 → 画面/音轨/字幕）→ 引擎模式**：读 [成片管线](references/production-pipeline.md)。在 `visual-studio/` 写 `project.json`（可沿用 `episode.json` 的 `startFrame`/`durationFrames`/`componentId`/`props`），`npm run lint:project` 校验，`npm run direct` 渲染 1080p 成片。可选 `npm run sfx` 生成程序提示音；用户授权的本地 7788 配音服务可用时复用“老王3.0_紧凑版”，缺失时报告阻塞或使用用户提供的实际语音，不得悄悄换 Windows 系统音色。音效存在不等于质量通过。

## LW Asset Engine 核心素材能力

制作和素材检索先读 [素材引擎规范](references/asset-engine.md)。将口播含义、情绪、镜头职责、视觉风格转换为可解释的素材意图，建立项目素材索引并复核来源/权限；仅参考、允许下载、允许改编、已验证可执行独立记录。用户本地素材、LW Originals 和 LW References 不混淆所有权。获授权素材才自动导入/适配/调用，缺失时公开记录原创 MG 替代；交付素材使用清单与版权报告，不能用缩略图网页冒充集成。

## 制作模式的执行合同

1. 从主题/素材形成受众、情绪与叙事主线，确定画幅、长度、口播语言、优先级。**本轮 30 秒验证默认 1920×1080、16:9、30fps**；若用户指定 9:16，必须原生设计并实际验收，而不能凭横屏代码宣称已支持竖屏成片。
2. 生成逐句脚本及可核查事实/来源，规划每句对应的镜头信息职责，形成项目级 `episode.json`，参照 [模板](templates/episode-manifest.example.json)。语音生成/真实录音和字幕时间码必须来自实际音轨，禁止臆造时长或语音识别结果。
3. 仅选择**当前实际代码分支已集成且可渲染**的组件：LW Originals 的 5 个基础效果、MP-001，以及经过此分支渲染验证的新组件；不能因为 FredTalk 在独立 PR #6/#8 有适配记录，就假定当前整片引擎能直接使用它们。需要外部图标、插画、Lottie 或 FredTalk 时优先挑选来源/授权明确、已验证的组件，未集成则标记依赖并安全适配；视频素材/截图/音乐的权利另查。避免全片重复同一个模板或用无关几何物件充数。
4. 使用 `python scripts/episode_preflight.py <episode.json> --phase plan` 校验镜头表；在尝试整片输出前使用 `--phase render` 检查语音、字幕、权利、视频比例与**已验证的整片引擎能力**。检查失败时先解决缺口，不伪造 PASS。
5. 在真实实现存在的前提下，执行整片拼接、配音、字幕、BGM/SFX 混合、MP4 导出；使用 `scripts/validate_export.py` 和实际观看检查黑帧、节奏、中文字幕、局部遮挡、运镜连贯性、音画同步、削波和版权。未经本机真实运行验证不得宣称“自动出片完成”。
6. 交付 **成片 + 可编辑制作配置/项目 + 字幕与脚本 + QA 报告 + 资产/许可台账**；若环境缺少 TTS、ASR、整片合成或素材，报告已完成的阶段、具体阻塞项及最短解决方案，不把没有音轨的组件测试片说成完整成片。

## 当前能力边界（必须主动自检）

- [本分支已具备工程实证] `visual-studio/` 的 Remotion `Project` Composition、`timeline.mjs`、`direct.mjs`、字幕、配音母版、SFX/BGM 配轨可构成多镜头视频；《造纸术》有 11 镜、83.7 秒的本地成片证据，**但其视觉质量未通过正式发布验收**。五个 LW Originals、MP-001 和工作台单组件导出仍保留。详见 [成片管线](references/production-pipeline.md)。
- [部分验证] 本地 7788 TTS 的“老王3.0_紧凑版”曾为该项目提供真实配音；服务、音色和个人凭据**不随 GitHub 提交**，需在新执行环境确认可用。字幕可依据实际音频/SRT 编排，**没有通用的逐词 ASR/强制对齐保证**。
- [未验证或未完成] 任意文案自动分镜、任意题材自动择材、通用编排审美、跨题材自动生成、9:16 整片实渲、跨平台可复现、成熟的局部重渲/重混与声音主观听感门禁仍未完成或未充分验证。不要把技术工具能运行说成这些能力已完成。
- [分支隔离] FredTalk 批量适配在 Draft PR #8（依赖 #6），**本短视频分支未合入**，不能将其当作可直接调用的生产组件；PR #7 的造纸题材组件不等于跨题材通用组件。需要引用时先经独立许可、渲染及接缝验证。
- 只有来源、许可证、依赖、实际渲染和视觉审核逐级通过的外部组件才可进入正式制作候选；第三方媒体权利与组件代码许可分别核验。
- 所有结论标注 `[实测]`、`[观察]`、`[推测]`、`[验证通过]` 或 `[待确认]`；代码运行通过不等于视觉验收通过。用户未授权发布时不得自行上传平台。

## 素材引擎实际运行

`asset_engine.py` 负责本地导入、媒体探测、SQLite 索引、在线候选、许可核验、语义意图推荐与选择；`asset_timeline.py` 将受权 assetId 绑定到真实画面、人声、字幕、音乐和 MG 叠层，生成使用清单及版权报告。执行前读取 [字段、命令与限制](references/asset-engine.md#可执行入口与当前证据)。该适配器已完成本机私有整片验证，使用 FFmpeg/PyAV 合成并调用可信 Remotion MG，不等于原生 Remotion 整片引擎或通用主题到成片能力已完成。

## 现有工具

`scripts/inspect_media.py` 清点、去重与流探测；`extract_frames.py` 抽帧；`detect_shot_candidates.py` 检测候选；`analyze_audio.py` 测量混合音轨；`validate_export.py` 检查输出；`render_components.py` 渲染原创 **2D 演示**。脚本支持 `--help`。实际用法和限制见 [工作流与验收](references/workflow-and-qa.md)、[音频与字幕](references/audio-and-subtitles.md)。

修改代码和知识库时保留来源、版本、数据和测试记录，不覆盖用户原片或已有工程；在独立工作区/分支开发，不静默改写全局 Skill。
