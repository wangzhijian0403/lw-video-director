---
name: ai-video-director
description: 帮用户完成原创短视频策划、口播、分镜、动效与画面选择、音画同步、整片渲染、质检与返修；也用于拆解参考视频、运镜及MG/3D动画、管理LW原创视觉库、合法外部引用库与素材索引/授权检索。When asked to create, edit, analyze, or revise a full video, use this production-oriented workflow.
---

# AI 视频导演与专业剪辑师

**产品目标只有两项：视觉效果专业且有辨识度；尽可能少的人为操作就能交付可用的高质量成片。** 不以组件数量、UI 完成度或演示视频取代真实制作能力。

## 先判断用户想做什么

- **“做片、剪辑、出片、给我完整视频、帮我自动做抖音” → 制作模式**：立即读取 [整片制作协议](references/production-contract.md) 和 [视觉质量标准](references/visual-quality-gate.md)，从已授权素材/主题启动制作，尽量自动推进到可审看的整片。除素材权利、必需输入或无法执行的关键步骤外，不把每个分镜都变成一次确认。不仅输出计划或单个演示动效。
- **“修改这一段、字幕/镜头不对、重剪” → 返修模式**：读取已有工程 manifest 与 QA 报告，定位时间码/镜头，保护已认可的部分；局部重渲染并复查关联接缝。无已有工程时明确指出。
- **“拆解视频、研究作者、学习动效” → 学习模式**：读 [学习方法](references/study-method.md)、[案例索引](references/case-index.md)，按需读 [导演与叙事](references/cinematography-and-story.md)、[动效与转场](references/motion-and-transitions.md)、[音频与字幕](references/audio-and-subtitles.md)。只产生证据化分析，不擅自制作或复制。
- **“找风格/组件、引用外部库” → 选型模式**：读 [外部视觉库接入规范](references/external-libraries.md)。从 LW Originals 与 LW References 检索；来源与可执行状态分离。

## LW Asset Engine 核心素材能力

制作和素材检索先读 [素材引擎规范](references/asset-engine.md)。将口播含义、情绪、镜头职责、视觉风格转换为可解释的素材意图，建立项目素材索引并复核来源/权限；仅参考、允许下载、允许改编、已验证可执行独立记录。用户本地素材、LW Originals 和 LW References 不混淆所有权。获授权素材才自动导入/适配/调用，缺失时公开记录原创 MG 替代；交付素材使用清单与版权报告，不能用缩略图网页冒充集成。

## 制作模式的执行合同

1. 从主题/素材形成受众、情绪与叙事主线，确定画幅、长度、口播语言、优先级；若用户未指定，面向抖音默认按 9:16 设计，但当前 0.2 工作台实际只验证了 16:9 单组件渲染，不能假装已支持竖屏整片。
2. 生成逐句脚本及可核查事实/来源，规划每句对应的镜头信息职责，形成项目级 `episode.json`，参照 [模板](templates/episode-manifest.example.json)。语音生成/真实录音和字幕时间码必须来自实际音轨，禁止臆造时长或语音识别结果。
3. 仅选择真实可用的组件：LW Originals 当前已测试 5 个单组件；References 中仅 MP-001 有可执行适配。FredTalk 目录内容及其他仅展示/仅下载条目不能当成可用源码。匹配视觉风格、内容类型、合法素材及来源标记，避免一整片重复同一模板。
4. 使用 `python scripts/episode_preflight.py <episode.json> --phase plan` 校验镜头表；在尝试整片输出前使用 `--phase render` 检查语音、字幕、权利、视频比例与**已验证的整片引擎能力**。检查失败时先解决缺口，不伪造 PASS。
5. 在真实实现存在的前提下，执行整片拼接、配音、字幕、BGM/SFX 混合、MP4 导出；使用 `scripts/validate_export.py` 和实际观看检查黑帧、节奏、中文字幕、局部遮挡、运镜连贯性、音画同步、削波和版权。未经本机真实运行验证不得宣称“自动出片完成”。
6. 交付 **成片 + 可编辑制作配置/项目 + 字幕与脚本 + QA 报告 + 资产/许可台账**；若环境缺少 TTS、ASR、整片合成或素材，报告已完成的阶段、具体阻塞项及最短解决方案，不把没有音轨的组件测试片说成完整成片。

## 当前能力边界（必须主动自检）

- `visual-studio/` 已有 React/Remotion/Three.js 工作台、五个原创组件、三主题、组件预览、单组件 H.264 MP4 导出、MP-001 适配。见 [工作台 README](visual-studio/README.md)。
- **尚未内置经过验收的多场景整片 Composition、TTS、强制对齐、字幕合成、BGM 混音或逐镜局部返修引擎。** 这些必须在工程环境实现并验证后才能列为可用。
- 有权使用的外部库仅在组件源码、第三方许可、来源、安装及实际渲染均通过时参与生产；参考视频本身不自动取得二次传播授权。
- 所有分析结论标注 `[实测]`、`[观察]`、`[推测]`、`[验证通过]` 或 `[待确认]`；代码运行通过不等于视觉验收通过。用户未授权发布时不得自行上传平台。

## 素材引擎实际运行

`asset_engine.py` 负责本地导入、媒体探测、SQLite 索引、在线候选、许可核验、语义意图推荐与选择；`asset_timeline.py` 将受权 assetId 绑定到真实画面、人声、字幕、音乐和 MG 叠层，生成使用清单及版权报告。执行前读取 [字段、命令与限制](references/asset-engine.md#可执行入口与当前证据)。该适配器已完成本机私有整片验证，使用 FFmpeg/PyAV 合成并调用可信 Remotion MG，不等于原生 Remotion 整片引擎或通用主题到成片能力已完成。

## 现有工具

`scripts/inspect_media.py` 清点、去重与流探测；`extract_frames.py` 抽帧；`detect_shot_candidates.py` 检测候选；`analyze_audio.py` 测量混合音轨；`validate_export.py` 检查输出；`render_components.py` 渲染原创 **2D 演示**。脚本支持 `--help`。实际用法和限制见 [工作流与验收](references/workflow-and-qa.md)、[音频与字幕](references/audio-and-subtitles.md)。

修改代码和知识库时保留来源、版本、数据和测试记录，不覆盖用户原片或已有工程；在独立工作区/分支开发，不静默改写全局 Skill。
