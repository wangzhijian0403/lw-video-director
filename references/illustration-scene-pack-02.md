# LW 专业插画与场景素材包 02 / 可视化素材工作台

## 本次三个原创新场景（分层 SVG + Remotion 帧驱动）

| ID | 名称 | 用途 |
|---|---|---|
| ILLUS-STUDIO-01 | 创意工作室 | 设计、剪辑、软件工作流，桌面/屏幕/窗景多层 |
| ILLUS-CITY-01 | 暮色城市 | 科技、产业、趋势，灯光建筑与河面映射 |
| ILLUS-NATURE-01 | 青山河谷 | 自然、旅行、知识，山峦、树、河谷、木屋 |

- 全部直接在 `visual-studio/src/scene-packs/IllustratedScene.tsx` 绘制，未复制外部图形或使用远程媒体。
- `visual-studio/src/scene-packs/manifest.json` 有各条素材 ID、内容职责、配色、许可证说明、渲染状态。
- 动效是 Remotion 帧驱动的慢视差和少量环境细节，**不是实拍、不是AI生成照片，也不是角色表演**。不能把技术测试通过说成已经达到专业电影级插画审美。
- 可在整片工程 `project.json` 的 `scenes` 使用以上组件 ID，`params` 有可选 `title` 和 `subtitle`。可混用 FredTalk、LW Originals 和已纳入的 24 个 Tabler SVG 图标。
- 本批未接入有版权限制的插画下载站，也不包含音乐或商业授权未核实的素材。

最短工程示例：

```json
{
  "meta":{"title":"插画场景演示","width":1920,"height":1080,"fps":30,"theme":"mist-blue-paper"},
  "timing":"fixed",
  "scenes":[
    {"id":"work","component":"ILLUS-STUDIO-01","duration":5,"params":{"title":"从内容开始","subtitle":"设计和剪辑"}},
    {"id":"landscape","component":"ILLUS-NATURE-01","duration":6,"params":{"title":"让场景讲故事"},"transition":{"type":"wipe","duration":0.5}}
  ],
  "subtitles":{"enabled":false}
}
```

## Windows 本地查看资源（重要）

早期工作台 UI 写死“组件库05”，且只给 LW Originals / References 入口，所以看不到后来整合的 FredTalk、图标和角色状态。新版新增 **「素材图鉴」**，分为：

- **原创分层场景：3** — 真正的 Remotion Player 动画预览
- **FredTalk 实装动效：16** — 真正安装源码的组件动画预览
- **正版 SVG 图标：24** — 查看实际矢量文件和改色效果
- **本地角色登记：5** — 只显示登记与验收状态，不上传、不复制私有人物媒体；验证过的基础动作为 fish/wave 与 codex/typing

其他几百条外部 *reference-only* 仍在 References 中，仅有目录记录不代表可执行。早期原创 MG 仍在 Originals。

从最新 main 更新本地源码后，双击仓库根目录 `start-lw-studio.cmd`。启动器先检查 Node.js 和 npm，必要时运行一次 `npm ci`，然后启动本地端口并等待 `/api/health` 返回 ready **再打开浏览器**，避免直接访问未启动的 127.0.0.1:4173 出现 ERR_CONNECTION_REFUSED。启动时的 LW Studio Server 窗口保持运行。

手动启动：

```powershell
cd "D:\Codex工作目录\lw-video-director\visual-studio"
npm ci
npm run dev
```

在另一个终端检测：

```powershell
Invoke-RestMethod http://127.0.0.1:4173/api/health
```

成功时显示 `service: LW Visual Studio` 和 `ready: true`。浏览器访问 `http://127.0.0.1:4173`，点击顶部「素材图鉴」。**远程 ChatGPT 不能打开用户电脑 127.0.0.1，也不能读未上传的私人媒体**。若你未更新本地源码，就仍会看到旧界面；若旧窗口还运行旧项目或旧分支，也不会显示新标签。

要查看*你个人在另一本地分支做的、尚未提交的改版效果*，需在本机对照 `git status`、`git branch -avv` 及本机项目目录，当前工作台不会扫描所有硬盘或擅自把私有素材加入主库。

## 技术验收命令

```powershell
cd "D:\Codex工作目录\lw-video-director\visual-studio"
npm ci
npm run build
npm run test:unit
npm run lint:project -- projects/illustration-scene-smoke/project.json
npm run direct -- projects/illustration-scene-smoke/project.json --out exports/illustration-scene-smoke.mp4
```

后续仍需独立视觉审核三种场景的构图、颜色、真实性与动态节奏；并以真实中文脚本和音效测试能否替代原先大段文字胶囊卡。**新场景只能作为丰富镜头的一种手段，不能让整个视频变成同一类插画模板。**
