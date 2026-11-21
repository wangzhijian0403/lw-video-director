# AI 视频导演与专业剪辑师

这是一个面向 Codex 的视频分析与制作辅助 Skill。它用于拆解经授权的参考视频、整理可核查的镜头与音频证据、规划分镜和动效，并对原创组件及视频导出进行基础技术检查。

- **GitHub 仓库名：** `lw-video-director`
- **Skill 标识：** `ai-video-director`
- **主要语言：** 中文
- **默认模式：** 学习分析；只有用户明确要求制作时才进入制作流程。

## 能做什么

- 清点本地视频文件，记录媒体流信息与 SHA256 去重结果。
- 按时间抽取预览帧，生成时间索引。
- 发现硬切、渐变和屏幕运动的候选时间点，供人工复核。
- 测量混合音轨的 RMS、低能量窗口、采样峰值，以及可用时的 EBU R128 响度信息。
- 根据受众、叙事和视觉层级规划分镜、镜头运动、转场、字幕与音画关系。
- 用原创图形渲染卡片阵列、条形图和屏幕过渡的最小技术样例。
- 可选检索 Motion Prompt 动效术语/逐帧示例和 FredTalk 公开场景组件，并按来源与许可规范登记。
- 检查视频流、帧解码、首尾帧亮度、帧间隔和音视频时长差异。

**边界：** 镜头检测结果只是候选，不是精确剪辑点；混合音轨低能量不等于人声停顿；元数据检查不能代替人工观看成片。该 Skill 不会仅凭参考视频推断作者使用了什么软件，也不会把可运行代码自动视为视觉验收通过。

## 整片制作 Skill（研发中的制作协议）

**用户的最终目标是直接出高质量成片，而不是只生成五个静音动效。**

已为 `ai-video-director` 增加完整制作指挥流程：

- [整片制作协议](references/production-contract.md)：主题 → 口播 → 真实时间对齐 → 分镜 → 视觉组件 → 多场景合成 → 音乐字幕 → QA → 局部返修。
- [视觉质量门禁](references/visual-quality-gate.md)：美观性、表达准确、流畅运镜、字幕与视听同步的独立评价。
- [45秒分镜数据模板](templates/episode-manifest.example.json) 和 [镜头预检脚本](scripts/episode_preflight.py)，用于记录统一时间轴并拒绝尚不可用的外部组件。

```sh
python scripts/episode_preflight.py templates/episode-manifest.example.json --phase plan
python scripts/episode_preflight.py templates/episode-manifest.example.json --phase render
```

**重要：** 现有 `visual-studio/` v0.2 仅实现**单组件、无音轨、16:9 视频渲染**。制作流程已经有明确约定，但尚缺经过验证的多场景整片引擎、TTS/录音接入、真实时间码字幕与混音。示例必须能通过计划预检、却因这些真实缺口无法通过成片预检。不要把接口/计划写成已经能一键出片；待独立工程开发、真实完整视频测试后再宣布生产可用。

## 外部视觉库

本项目提供可选的外部视觉资源接入规范：

- [Motion Prompt](https://github.com/showheyohtaki/motion-prompt)：动效、运镜、转场、UI、光影与图表的术语和逐帧示例。
- [FredTalk](https://github.com/njrhts2kvv-star/FredTalk)：口播视频场景与 Remotion 组件参考。
- [接入、检索与许可边界](references/external-libraries.md)
- [第三方资源声明](THIRD_PARTY_NOTICES.md)

Skill 的外部接入规范保持独立。`visual-studio/` 包含已核验许可的 Motion Prompt MIT 源码适配器，以及 FredTalk 目录元数据和许可声明；没有打包 FredTalk 视频、会员源码或商业字体。详见 [工作台第三方声明](visual-studio/external/THIRD_PARTY_NOTICES.md)。

## LW Visual Studio v0.2.0-preview

独立的原创视觉组件预览工作台，源码位于 [`visual-studio/`](visual-studio/)。当前为待审核预览版，不替代现有 Skill 和 Python 分析工具。提供五个原创组件、Swiss/Future/Archive 三主题，以及来源独立的 References 检索。

### 安装与启动

推荐 Node.js 24 LTS；支持符合 Vite 要求的 Node.js 22.14+。使用 npm 锁文件安装：

```sh
cd visual-studio
npm ci
npm run dev
```

打开 <http://127.0.0.1:4173>，服务仅监听本机。视频导出另需 Chrome 和可用 WebGL；Windows 默认使用标准安装路径，可通过 `LW_BROWSER` 指定浏览器可执行文件。未在其他操作系统上完成视频渲染验收。

### 动态预览与导出

- Originals 中选择组件、切换主题并调整参数；支持播放/暂停、逐帧、拖动时间轴、适应窗口和全屏预览。参数控制支持窄屏访问。
- TRANS-001 默认使用各主题原创场景，也可输入两张本地 PNG/JPEG/WebP；INFO-001 支持 JSON 数据输入。
- 点击「导出 MP4」，等待本机任务完成后下载 H.264、1280×720、30fps 视频（当前无音轨）。导出位于 `visual-studio/exports/`，不提交仓库。
- References 保留来源、许可和安装状态；仅 MP-001 已验证本地可执行。FredTalk 为官方在线引用，不视为已安装可执行组件。

```sh
npm test                      # 自动构建、单元测试和独立服务器 API 测试
npm audit
npm run render -- CAM-001      # 需要浏览器，输出真实 MP4
```

详细操作见 [工作台说明](visual-studio/README.md)，来源见 [第三方声明](visual-studio/external/THIRD_PARTY_NOTICES.md)，本轮记录见 [发布前检查](visual-studio/RELEASE-CHECKS.md)。不包含私人视频、密钥、node_modules、构建缓存和测试导出。

## 安装 Skill

### Windows（PowerShell）

先确保已安装 Git，然后执行：

```powershell
New-Item -ItemType Directory -Force "$HOME\.codex\skills" | Out-Null
git clone https://github.com/wangzhijian0403/lw-video-director.git "$HOME\.codex\skills\ai-video-director"
```

如果目标目录 `$HOME\.codex\skills\ai-video-director` 已经存在，请先备份或移走旧目录，再执行克隆，避免覆盖本机已有版本。

### macOS / Linux

```bash
mkdir -p ~/.codex/skills
git clone https://github.com/wangzhijian0403/lw-video-director.git ~/.codex/skills/ai-video-director
```

安装后重新打开 Codex 或新建会话，然后通过 Skill 标识调用：

```text
$ai-video-director
```

## 安装 Python 依赖

建议使用独立虚拟环境。进入克隆后的 Skill 目录后执行：

```bash
python -m venv .venv
```

Windows PowerShell 激活：

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

macOS / Linux 激活：

```bash
source .venv/bin/activate
python -m pip install -r requirements.txt
```

脚本使用 FFmpeg 进行音频解码、视频编码或响度测量。它会先查找系统 PATH 中的 `ffmpeg`，再尝试使用 `imageio-ffmpeg` 提供的可执行文件；若两者均不可用，请安装 FFmpeg 并配置 PATH。

## 脚本用法

在 Skill 根目录运行。所有输出路径应指向独立的项目工作目录，不要覆盖原始素材。

### 1. 清点媒体文件

```bash
python scripts/inspect_media.py "D:/video-project/source" --output "D:/video-project/work/media-inventory.json"
```

### 2. 抽取预览帧

```bash
python scripts/extract_frames.py "D:/video-project/source/reference.mp4" --out-dir "D:/video-project/work/frames" --interval 2
```

### 3. 生成镜头变化候选

```bash
python scripts/detect_shot_candidates.py "D:/video-project/source/reference.mp4" --output "D:/video-project/work/shot-candidates.json" --interval 0.25
```

该脚本还会在 JSON 报告旁写入 CSV 采样数据。候选必须人工确认。

### 4. 分析混合音轨

```bash
python scripts/analyze_audio.py "D:/video-project/source/reference.mp4" --output "D:/video-project/work/audio-report.json"
```

### 5. 验证导出文件

```bash
python scripts/validate_export.py "D:/video-project/output/final.mp4" --output "D:/video-project/work/export-report.json" --require-audio
```

可按需增加 `--expect-width`、`--expect-height` 和 `--expect-fps`。

### 6. 渲染原创 2D 技术样例

```bash
python scripts/render_components.py --output "D:/video-project/work/component-proof.mp4" --width 640 --height 360 --fps 30
```

每个脚本都支持 `--help`，查看参数说明。

## 项目结构

```text
lw-video-director/
├── SKILL.md
├── README.md
├── THIRD_PARTY_NOTICES.md
├── requirements.txt
├── agents/
│   └── openai.yaml
├── references/
│   ├── audio-and-subtitles.md
│   ├── case-index.md
│   ├── cinematography-and-story.md
│   ├── motion-and-transitions.md
│   ├── study-method.md
│   └── workflow-and-qa.md
└── scripts/
    ├── analyze_audio.py
    ├── common.py
    ├── detect_shot_candidates.py
    ├── extract_frames.py
    ├── inspect_media.py
    ├── render_components.py
    └── validate_export.py
```

## 使用原则与素材权利

- 只分析用户有权使用的本地素材；原始视频只读，分析结果写入独立目录。
- 不要把原始视频、音频、关键帧、客户素材、私人报告或导出成片提交到公共仓库。
- 参考作品只提炼结构与通用技法，不复制独特角色、品牌素材、音乐或整段脚本。
- 案例结论应标明证据等级、来源、时间点、方法和误差；未知信息保持待确认。
- 用户明确要求制作后再进入成片制作；发布或公开素材需另行确认授权。

## 许可证

本项目采用 [MIT License](LICENSE)。

Copyright (c) 2026 wangzhijian0403

MIT 允许使用、复制、修改、合并、发布、分发、再许可及销售本项目软件，但再分发时须保留版权声明和许可证文本。软件按“现状”提供，不附带任何明示或默示担保。

该许可证仅适用于仓库中由项目作者提供且有权授权的项目内容；第三方依赖、商标、参考视频、音乐、图片及其他外部素材仍受各自权利和许可约束。

## 案例资料说明

`references/case-index.md` 收录的是交接记录中的观察与待核实事项，不代表本仓库重新完成了全部原片复核。原始视频和逐帧证据不包含在仓库中。
