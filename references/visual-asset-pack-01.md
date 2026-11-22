# LW Video Director · 通用视觉素材包 01

## 首批资源：24 个本地 Tabler SVG 图标

这是已真正纳入源码、准备交由 Remotion 实际渲染的视觉资源包，不是只有外部网页链接的目录。

- 来源：Tabler Icons，https://github.com/tabler/tabler-icons
- 上游固定提交：85e870dbe8680c2d6deefd062122d30ef1544a41
- 图标源码位置：icons/outline/（24 个完整原始文件，未改动绘制路径）
- 许可证：MIT（Paweł Kuna），保存在 visual-studio/public/resource-packs/tabler-outline/LICENSE
- src/resource-packs/tabler-outline.json：每一条对应上游链接、固定提交、Git blob hash、用途标签和本地渲染路径
- 不包含商标素材、第三方音乐、付费演示视频、字体或任何用户私有角色视频
- 阶段：SOURCE VERIFIED，真正的 Remotion 合成画面和人工视觉质量仍需单独通过烟测和审片

## 本地检索及校验

在 visual-studio 目录中：

    npm run assets:icons:check
    npm run assets:icons
    node scripts/icon-assets.mjs --search "配音"
    node scripts/icon-assets.mjs --search "层级"

这里只做有依据的名称/用途标签匹配，不宣称模型已自动理解全部文案语义。

## 将图标叠进任意镜头

project.json 的 scenes 可继续使用 FT-T01b-431 等 FredTalk 组件或 TYPE-001 等 LW Originals。另加顶层 iconOverlays 数组（独立资源叠加，不替换主场景）：

    "iconOverlays": [
      {
        "id": "tabler:hierarchy-3",
        "at": 0.6, "duration": 3.6,
        "x": 120, "y": 140, "size": 190,
        "color": "#26819B",
        "motion": "float", "plate": "soft", "label": "层次"
      },
      {
        "id": "tabler:sparkles",
        "at": 4.8, "duration": 3.5,
        "x": 1550, "y": 130, "size": 210,
        "color": "#D3A766",
        "motion": "reveal", "plate": "none"
      }
    ]

- id 必须存在于离线授权资源目录，不允许自动加载未知网站的图标。
- at/duration 是整片秒数，不是把片长限定为30秒；x/y/size 为当前画幅像素。
- motion 有 reveal、float、pulse、wipe；plate 有 none、soft；label 是可选短文本。
- 图标颜色可配置，使用 SVG alpha mask 保留上游 SVG 源码，渲染不需要外部 CDN。
- lint:project 校验图标ID、文件、时长、越界和字幕安全区。
- 图标不是自动字幕和视频素材；不能用少量小图标代替电影级空间层次、实拍、绘画或其他真实内容。
- 在真实成片里需要人工检查是否遮挡 FredTalk 文字或主体，技术校验无法保证艺术效果。

## 验证流程

    cd visual-studio
    npm ci
    npm run build
    npm run test:visual-assets
    npm run assets:icons:check
    npm run lint:project -- projects/visual-assets-smoke/project.json
    npm run setup:fred
    npm run direct -- projects/visual-assets-smoke/project.json --out exports/visual-assets-smoke.mp4

真实渲染通过且画面检查后，才能从 source-verified 提升到 rendered/visually-reviewed。

## 下一步

本包先解决镜头中常见的信息图标缺口。后续可继续按成片问题补充插画、空间背景、转场素材以及来源明确的真实音效；各类素材采用独立授权与质量门禁，不让数量代替可用性。

不要把付费内容、用户原始配音、私有角色绿幕视频或别人的品牌Logo上传公共 GitHub。
