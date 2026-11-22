# FredTalk 上游版权与第三方媒体状态

更新时间：2026-11-22。范围：`feature/fredtalk-batch-adapter`（PR #8，Draft），batch-20 与 432 条 inventory。

## 1. 结论

- **第一方代码**：FredTalk 组件代码按上游 MIT / 作者授权使用；LW 的适配层（host、字体替换、品牌移除、媒体重写、静音）为 LW 新增，不主张 FredTalk 原作为 LW 原创。
- **上游演示媒体**：不随 MIT 分发。仓库不重新分发上游 `public/media/*`；适配阶段把硬编码 `media/*` 确定性重写到 LW 自有占位素材，provenance 的 `hostEdits` 记录改写数量。
- **字体**：`SmileySans-Oblique.ttf`，OFL-1.1，未修改，SHA-256 `b447d7e781f08bc95c4c9f23ba71ed2b8ebb639aa7184485c71c4ca5afcd25c4`；不入 Git，由 `scripts/install-fred-font.py` 校验后安装。
- **音频**：上游 SFX 不随代码分发；适配版 `Sfx` 当前 `return null`，所有 MP4 静音。音效对接见 `SFX_INTEGRATION.md`，在取得授权或使用自有音效前不启用。
- **T04e 新素材**：使用 LW 自有公开仓库页面截图，来源见第 3 节；不是上游 FredTalk 媒体。

## 2. batch-20 逐组件媒体状态

| LW ID | 代码许可 | 默认媒体 | 媒体来源/许可状态 | 结论 |
|---|---|---|---|---|
| FT-T01b-431 | MIT + LW 适配 | `fredtalk/media/lw-work-*.jpg` | LW 自绘占位 | 可演示，替换后交付 |
| FT-T01c-432 | MIT + LW 适配 | 同上 | LW 自绘占位 | 可演示 |
| FT-T01d-451 | MIT + LW 适配 | `lw-work-02/03/04.jpg` | LW 自绘占位；评分数据标注为演示数据 | 可演示 |
| FT-T01e-410 | MIT + LW 适配 | `lw-recording.mp4` | LW 自绘录屏占位 | 可演示 |
| FT-T01f-409 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T01g-411 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T01h-396 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T02a-449 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T02e-412 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T02f-413 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T02g-360 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T02h-371 | MIT + LW 适配 | `lw-work-*.jpg` | LW 自绘占位 | 可演示 |
| FT-T03c-416 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T03d-435 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T04a-452 | MIT + LW 适配 | `fred` 默认空 | 已关闭非透明占位卡；仅接受调用方提供透明 PNG | 开发预览 |
| FT-T04b-434 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T04d-415 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T04e-365 | MIT + LW 适配 | `fredtalk/media/t04e/repo-page.png` + 三块裁切 | 自有公开仓库页面，见第 3 节 | 开发预览 |
| FT-T04f-369 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |
| FT-T04g-393 | MIT + LW 适配 | 无外部媒体 | — | 可演示 |

## 3. T04e 截图来源与边界

- 来源 URL：`https://github.com/wangzhijian0403/lw-video-director`（公开仓库）。
- 抓取时间：2026-11-22；headless Chromium，2× DPR，1440×1800 视口，等待 8s 水合。
- 母图 `/tmp/repo-page2.png` 2880×3600；派生文件：
  - `public/fredtalk/media/t04e/repo-page.png`（965×1607，页卡）
  - `repo-title.png`（965×260）
  - `file-list.png`（965×520）
  - `readme-intro.png`（965×380，源自 y=1200 区域）
- 许可边界：仓库代码为 MIT；截图中的 GitHub 页面框架、Octocat 等 UI 元素归 GitHub，不在 MIT 范围内。此处仅作为自有项目介绍的可视演示，不主张对 GitHub UI 的权利，不用于商标/背书用途。
- 发布建议：若要对外商用，建议替换为纯 README/仓库内容截图，裁掉 GitHub 品牌元素；或改成用户自己的产品界面截图。

## 4. 交付时必须带的说明

1. 上游 FredTalk 代码 MIT；LW 适配层为新增。
2. 上游演示媒体未随 MIT 分发，当前使用 LW 占位素材。
3. 字体 OFL-1.1，需在目标机器安装或打包。
4. T04e 截图来自自有公开仓库，含 GitHub UI，商用前建议去品牌化。
5. 所有 batch-20 MP4 静音；音效资产未授权前不启用。
