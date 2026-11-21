# 外部视觉库接入规范

本文把外部资源作为 **LW Video Director 的可选参考与组件来源**，不是把外部作者的全部风格并入 LW，也不是对外部素材作统一授权。

最后核查：2026-11-20。每次实际使用前仍要检查上游最新目录、文件、许可和下载权限。

## 1. Motion Prompt — 动效术语与可执行示例库

- 项目：<https://github.com/showheyohtaki/motion-prompt>
- 动态图鉴：<https://showheyohtaki.github.io/motion-prompt/>
- Skill：<https://github.com/showheyohtaki/motion-prompt/tree/main/skills/motion-prompt>
- 许可：上游仓库声明 MIT。使用具体 element 的代码时，保留该 element 文件首行的作者、编号和 MIT 归属注释；随分发保留上游 LICENSE 和必要的第三方声明。
- 当前上游 README 在核查时列出 10 组、共 240 个条目：motion、camera、ui、lp、photo、motion2、lp2、camera2、artstyle、diagram。数量可能随上游更新。

### 适合 LW 的用途

1. 当用户描述“像什么动效”但不知道术语时，用它查找运动、运镜、转场、UI、光影或图表名称。
2. 先看动态图鉴，让用户选，不要只凭名称自动套用。
3. 用 `search`、`list`、`get`、`kit`、`prompt` 读取实际规格与代码；不要假定每个元素可独立运行，需读取对应 pack kit、尺寸、周期和参数。
4. Canvas 2D 元素是以时间参数为输入的逐帧绘制函数。迁移到 Remotion、SVG、CSS、Canvas 或其他渲染器时，需做适配并实际渲染验证。

### 可选安装

上游为 Codex 等 Agent 提供独立 Skill 安装方式：

```bash
npx skills add showheyohtaki/motion-prompt
```

Node.js 18+。安装后重新打开 Codex。也可以直接打开在线图鉴，不安装代码。若当前环境未安装此 Skill，LW 不得假装已能调用其本地 CLI；应提供官方链接或请用户安装。

常用交互：
- 打开图鉴让用户挑选：`pick`
- 按描述搜索：`search title reveal`
- 查看类别：`list --pack camera`
- 读取一个元素的规格与代码：`get #012`
- 读取共享工具包：`kit camera`

实际命令以当前上游 Skill 的帮助和 README 为准。

## 2. FredTalk — 视频场景与 Remotion 组件参考库

- 项目：<https://github.com/njrhts2kvv-star/FredTalk>
- 在线视觉库：<https://www.fred-fu.com/visual-library>
- 中文说明：<https://github.com/njrhts2kvv-star/FredTalk/blob/main/README.zh-CN.md>
- 许可范围：<https://github.com/njrhts2kvv-star/FredTalk/blob/main/docs/license-scope.md>
- 第三方声明：<https://github.com/njrhts2kvv-star/FredTalk/blob/main/THIRD_PARTY_NOTICES.md>
- 素材安装说明：<https://github.com/njrhts2kvv-star/FredTalk/blob/main/docs/assets.md>

### 适合 LW 的用途

1. 按“表达目的 + 画面对象 + 动作”检索，而不是只按旁白关键词检索。
2. 查看真实预览和组件说明，检查是否适合当前段落。
3. 对照组件的来源、可复用性、实现入口和素材可用性；缺源码或来源不清楚时，只能作为视觉参考，不得标记为可执行组件。
4. 需要使用公开源码时，从上游当前明确公开的 GitHub Release/目录取得，并记录版本、commit/tag、组件 ID、文件哈希和来源声明。
5. 会员或登录渠道素材只在权利人明确授权且用户本人依法取得的情况下使用；不绕过登录、付费、令牌或访问控制。绝不把私人 BGM、个人录音、机器绑定或用户私有素材带入 LW。
6. 把选中的组件复制到独立工作目录后检查依赖、源码、媒体路径和第三方声明，再做本期适配和渲染验收；不要把整个上游仓库直接合并进 LW。

### 重要许可边界

FredTalk 上游根目录 MIT 仅覆盖作者声明的第一方代码、Skill、模板和文档。上游明确指出：第三方代码、参考复刻工程、字体、音效、音乐、图片、截图、录屏、视频、Logo 和品牌素材仍遵循各自许可或授权；上游仓库中出现某个文件不代表它自动受根目录 MIT 覆盖。每个拟集成组件都要核对其实际来源和单独声明。许可未知或权利不清的文件不得复制、分发或用于成片。

## 3. LW 的整合策略：参考外部“动作”，保留自己的“视觉身份”

外部库回答“有哪些动作/组件可以参考”；LW 自己的 Style Library 决定“这些动作以什么视觉语言呈现”。

每个 LW 原创风格独立维护：
- 色彩 tokens：背景、主色、强调色、文字、状态色。
- 字体与字阶：字体许可、字号层级、字重、行距。
- 材质与光影：纸张、玻璃、金属、黏土、体积光、阴影参数。
- 动效语言：持续时间、缓动曲线、弹性、运动幅度、错峰节奏。
- 构图与镜头：网格、景别、透视、相机轨迹、景深。
- 组件规范：标题、卡片、图表、流程、屏幕、字幕、转场。
- 禁用项：廉价泛光、随机抖动、无意义旋转、信息遮挡等。

同一个动作可换不同 LW 风格 tokens；不把 Motion Prompt 的 pack 外观或 FredTalk 的整期视觉系统误称为 LW 原创。

## 4. 每个外部组件的登记字段

在 LW 的组件目录中登记：

```json
{
  "id": "EXT-MP-012",
  "name": "来源中的动作名称",
  "source_project": "Motion Prompt",
  "source_url": "具体元素页面或文件链接",
  "upstream_author": "按上游署名填写",
  "upstream_license": "MIT",
  "upstream_version": "tag 或 commit SHA",
  "attribution_required": true,
  "source_files": [],
  "third_party_assets": [],
  "adaptations": [],
  "lw_style": "待选的 LW 风格 ID",
  "render_test": "not-run",
  "visual_review": "not-reviewed"
}
```

FredTalk 项目使用其实际组件 ID 和 provenance 信息；不要把 FredTalk 项目名写成每个参考设计的原创作者。若 creator 为 null 或来源未知，照实记录。

状态只能是：
- `reference-only`：只看预览/学术式分析，不含可再分发源码。
- `license-reviewed`：已检查源码和许可，但未渲染。
- `render-tested`：本地原创/适配实现已成功渲染。
- `visually-reviewed`：已人工检查运动、构图、可读性、接缝。
- `blocked`：许可、来源或素材权利不清楚，禁止集成。

## 5. 每次选型的工作流程

1. 根据分镜说明需要的表达动作和情绪，不先指定某个作者的风格。
2. 在 Motion Prompt 找动作术语和逐帧样例；在 FredTalk 找对应的场景/组件参考。
3. 最多列出 3 个候选，展示实际预览、适用理由、限制和来源。
4. 选定后检查上游许可、源码可用性、媒体/字体/音效授权和依赖。
5. 将可合法复用的动作逻辑适配为 LW 的组件；原创 LW 风格 tokens 与上游动作分离。
6. 渲染测试并检查关键帧、运动连续性、字体、字幕遮挡、音画同步和结尾接缝。
7. 更新目录和第三方声明；保留上游 attribution，不把外部组件标成 LW 原创。

## 6. 当前仓库的集成范围

主工作台已有 MP-001 源码适配和真实渲染记录，MP-002 下载不等于生产适配；FredTalk 保留目录/来源及原有声明，不能因此视为全部可执行。逐条状态以 `visual-studio/external/catalog.json`、provenance 与实际适配代码为准。

新增资源来源、检索入口、音效获取与许可分流见 [资源入口与许可分流](resource-providers.md) 和 `resources/providers.json`。现有两个外部目录继续保留，不把新发现的上游 Skill 整体复制进来。POC 的 Lucide、Lottie、真实音效测试结果与生产状态分开，不自动更新主片能力。

FredTalk T03e（步骤折行串起）已从官方公开接口匿名取得源码并核对三个文件SHA，完成LW参数化预览与真实MP4导出；编号 `FT-T03e-414`。详见 `visual-studio/external/fredtalk/t03e/README.md`。其余条目仅按各自状态选用，旧会员元数据不能当成当前仍未公开的证明；官网当前286条常用/146条归档不等于本机已将所有条目渲染验收。
