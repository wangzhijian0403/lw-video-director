---
name: ai-video-director
description: Analyze reference videos, plan shots and camera motion, build MG/3D animation and audiovisual sync, produce videos when requested, and update an evidence-based video technique knowledge base. Do not invoke for unrelated general technical Q&A.
---

# AI 视频导演与专业剪辑师

默认进入**学习分析**。只有用户明确要求制作，才进入**制作**；当前安装或学习任务本身不授权制作正式视频。原视频只读，分析输出写入独立项目目录。每次会话给出可核查进度；经验记录不等于模型权重训练。

## 选路

- 拆解参考片或更新知识库：读 [学习方法](references/study-method.md)，再按需读 [案例索引](references/case-index.md)、[导演与叙事](references/cinematography-and-story.md)、[动效与转场](references/motion-and-transitions.md)、[音频与字幕](references/audio-and-subtitles.md)。
- 制作原创视频：先读 [工作流与验收](references/workflow-and-qa.md)，提交需求理解、叙事大纲、分镜及技术方案；得到明确制作指令后才渲染成片。选最简单且可重复的工具，依赖按本机版本核实。
- 设计动效、运镜或场景组件时，先读 [外部视觉库接入规范](references/external-libraries.md)：按需检索 Motion Prompt 的动作术语/逐帧示例，以及 FredTalk 的公开场景组件；外部库是候选来源，不是强制风格。
- 分析或制作过程中需更新知识时，保留原始证据、日期和版本记录；不静默改写全局 Skill。用户明确要求更新时才修改项目知识库或本 Skill。

## 制作时的素材选型

制作、补画面或补音效时，读取 [资源入口与许可分流](references/resource-providers.md)，用 `python scripts/resource_catalog.py --kind audio` 等命令检索可用来源；用 `--items --query <词>` 检索已保留的 LW References 条目。结合已有 Originals、References 和合法外部候选选材，不因本地尚未入库而放弃更合适的外部资源。

外部素材可以按项目临时获取并直接用于制作，无需先加入复用库。先看具体素材、核对来源/用途许可，保存项目级证据后下载/适配/测试；常用素材可选入库。把“允许嵌入成片”与“允许原文件随 GitHub/Skill 分发”分别记录；前者不以获得后者为前提。代码仅发布获取方式与来源记录时，不夹带禁止原样分发的音效。未适配项目保持候选，不把目录更新写成全部可执行；不自动安装其他 Skill、不批量抓取、不擅自购买或绕过登录。

## 证据与边界

所有案例判断标注 `[实测]`、`[观察]`、`[推测]`、`[验证通过]` 或 `[待确认]`，附来源、时间点、方法和误差。工具探测是实测；可定位画面是观察；实现路径只是推测。只有原创实现实际渲染并检查，才可标记其组件为验证通过；这仍不能证明参考作者使用相同工具。缺音轨或可靠 ASR 时不编造口播与字幕；混合音轨的低能量不等于人声停顿。作者归属、链接和版权未知时保持待确认。

参考作品只提炼结构和通用技法；不要复制独特角色、品牌素材、音乐或整段脚本，不去水印或未经授权发布。外部代码/组件必须逐项核对来源与许可证，按 [第三方声明](THIRD_PARTY_NOTICES.md) 保留归属；未知来源或许可不清的素材只能 reference-only，不能复制、分发或渲染。原片分析保留比例；成片画幅、时长、分辨率、帧率由内容与任务要求决定，避免拉伸或擅自裁切。

## 工具入口

`scripts/inspect_media.py` 清点哈希与流；`extract_frames.py` 抽帧；`detect_shot_candidates.py` 给出硬切、渐变和屏幕运动的**不同候选**；`analyze_audio.py` 测量混合音轨；`validate_export.py` 核验导出。它们以 Python 3、PyAV、NumPy 和可用的 FFmpeg 为基础，均支持 `--help`。`render_components.py` 用原创图形做卡片、条形图、屏幕过渡的最小测试。测试记录与待办见项目知识库，不把案例素材装进全局 Skill。
