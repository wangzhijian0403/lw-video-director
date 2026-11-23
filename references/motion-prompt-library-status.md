# Motion Prompt 全库接入状态（LW-MP-FULL-240 · 运行时已装进本 Skill）

> 本文件是 Motion Prompt 组件选型的**事实来源**。240 条全部来自上游公开源码，
> 经真实渲染、客观机器 QA 后晋级为可执行；不把目录条目当作已实现能力。

## 1. 来源与口径

| 项目 | 值 |
| --- | --- |
| 上游仓库 | `showheyohtaki/motion-prompt` |
| 许可 | MIT（© 2026 Shohei Ohtaki） |
| 固定 revision | `683ecca0548a1754ada141d10dc3a009d4c59bef` |
| 全库规模 | **240 条** = 10 个套件（pack）× 24 条 |
| 上游 API | `https://showheyohtaki.github.io/motion-prompt/api/v1/en/e/<id>.txt`、`.../api/v1/kit/<pack>.js` |
| 用户口径 | 这就是「Motion Prompt 那个库」的全部 240 条，没有活跃/归档之分 |

套件：`motion`(001–024)、`camera`(025–048)、`ui`(049–072)、`lp`(073–096)、`photo`(097–120)、
`motion2`(121–144)、`lp2`(145–168)、`camera2`(169–192)、`artstyle`(193–216)、`diagram`(217–240)。

每条元素是上游独立的纯绘制函数 `CELLS[n-1](ctx, w, h, u)`，`u` 为秒；不是共享一个通用动画换参数。

## 2. 全量验收结果

| 阶段 | 结果 | 证据 |
| --- | --- | --- |
| 源码下载（240 element + 10 kit） | **250/250** | `provenance-full.json`（逐文件 SHA-256） |
| 源码执行校验（mock canvas 逐条绘制） | **240/240** | `source-verification.json` |
| artstyle 图片资源 | **27/27**，1,006,274 bytes | `assets-provenance.json` |
| 真实 MP4 渲染 | **240/240**，0 失败 | `media/render-progress.json` + 240 个 MP4 |
| 机器 QA（帧数/尺寸/真实帧变化） | **240/240** | `media/qa.json` |
| 晋级 `executable=true` | **240/240** | `promotion.json` |
| 工作台 HTTP 端到端抽样 | **10/10**（10 个套件各抽 1 条） | `workbench-verification.json` |

- 渲染规格：1280×720、30 fps、H.264；帧数按上游 cycle 计算，范围 **135–282 帧**。
- 机器 QA 判据：帧数不少于预期 90%、尺寸 1280×720、存在真实相邻帧变化（`adjMax ≥ 0.05` 或 `maxDiff ≥ 2.0`）、画面非空白（`frameStd ≥ 5`）。
  「定格」及徽标/下划线/滚动提示等真实微动效不会被平均帧差误杀；完全静止的截图会被拦截。
- MP-001 保留此前已验证的 `motion-pop-in` adapter 与 `REF-MP001` Composition；其余 239 条使用 `motion-prompt-cell`。

## 3. 运行时与选件

已增量安装到本 Skill 的 `visual-studio/`，**保留 Skill 自带的 `ProjectVideo` 多镜头引擎与 FredTalk 合并结果**：

- `external/motion-prompt/generated-runtime.js`（约 863 KB）：10 个 IIFE 包裹的静态运行时，导出 `getCell(id)` / `getMeta(id)` / `REGISTRY`。运行时不执行远程代码。
- `external/motion-prompt/generated-runtime.d.ts`：TypeScript 类型声明。
- `src/references/MotionPromptStage.tsx`：通用 Remotion 舞台，按 id 取 cell 绘制到 canvas。
- `src/references/motion-prompt-registry.data.json` / `.generated.tsx`：元数据与 239 个 Composition 声明。
- `src/remotion/root.tsx`：`LW-MP-FULL-240 ROOT-IMPORTS/COMPS` sentinel 区块。
- `render.mjs::renderMotionPromptComponent`、`server.mjs` 的 `motion-prompt-cell` 分支。
- `public/img/*.webp` 27 张：artstyle 套件所需图片。

工作方式：工作台「动效库」中选中 Motion Prompt 条目 → 点「本地渲染 MP4」→ 走 `/api/render-reference`，
返回真实 MP4。官方预览依赖外网，加载不出不影响本地渲染。

工作台修复记录（2026-11-23）：此前无 `previewUrl` 但 `sourceAvailable=true` 的条目错误显示“该条目未安装源码”，现已改为“本地源码已装好；官方动态预览受网络影响可能加载不出”；渲染状态与下载入口移到按钮下方，渲染中按钮禁用。Remotion 浏览器启动超时从 30 秒提高到 120 秒，避免机器忙时出现 `Timed out after 30000ms while setting up the headless browser`。修复后已重启 4173 服务，实际点击 MP-006 并生成 141 帧 / 1280×720 MP4。

## 4. 关键工程决策与坑

1. **上游代码按原样入库**：只做一处必要适配——artstyle 套件原按 `document.currentScript` 推导 `/img/`，而 Remotion 把 publicDir 挂在 `/public/img/`，导致任何条目渲染都报 `image did not load: img/base.webp`。该改动已写入 `provenance-full.json` 的 `runtimeAdaptations`。
2. **渲染性能**：每条 `renderMedia` 单独启动 Chrome 约 60 秒，240 条需 4 小时；提高 `concurrency` 无效（瓶颈在冷启动）。批量渲染改用 `openBrowser('chrome')` + 所有调用传 `puppeteerInstance`，单条降到约 15 秒。`browser.close()` 必须传 `{silent: true}`。
3. **源码校验器需要浏览器模拟**：上游 kit 使用离屏 canvas 与 `getTransform()`；校验器须 mock `document.createElement('canvas')`、`getTransform() → {a,b,c,d,e,f}`，否则出现大量假失败。
4. **ID 口径**：QA / registry 使用上游纯数字 `001..240`；工作台 catalog 使用 `MP-001` 形式。晋级与端到端验证脚本必须做前缀转换。

## 5. 证据文件索引

证据副本已归档到 [motion-prompt-library-data](motion-prompt-library-data/)；原始产物（含 240 个 MP4）位于独立工作树 `D:/Codex工作目录/lw-fredtalk-full-LW-FT-FULL-001/review/LWMP-FULL-240/`：

| 内容 | 路径 |
| --- | --- |
| 源码下载 provenance | [provenance-full.json](motion-prompt-library-data/provenance-full.json) |
| 源码执行校验 | [source-verification.json](motion-prompt-library-data/source-verification.json) |
| 图片 provenance | [assets-provenance.json](motion-prompt-library-data/assets-provenance.json) |
| 渲染进度 / QA | [render-progress.json](motion-prompt-library-data/render-progress.json)、[qa.json](motion-prompt-library-data/qa.json) |
| 晋级记录 | [promotion.json](motion-prompt-library-data/promotion.json) |
| 工作台端到端 | [workbench-verification.json](motion-prompt-library-data/workbench-verification.json) |
| 240 个真实 MP4 | 工作树 `review/LWMP-FULL-240/media/*.mp4`（体积较大，未复制到 Skill） |
| Skill 合并备份 | 工作树 `review/LWMP-FULL-240/skill-backup/` |

生成脚本：`visual-studio/tools/motion-prompt/`（按第 2 节顺序执行）。

## 6. 与主仓库的关系

全部成果原位于独立工作树 `work/fredtalk-full-001`，现已合入主仓库 `main`，并同步到本 Skill 的 `visual-studio/` 副本。
主仓库与本地 Skill 均可直接本地渲染，不再依赖独立工作树。
