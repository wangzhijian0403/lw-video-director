# FredTalk 全库接入 · 第一轮验收报告

分支 `feature/fredtalk-batch-adapter`（基线 PR #6 `feature/resource-adapters-poc`，未改 `main`，未触碰 PR #7《造纸术》）。

## 1. 结论（机器与人工分开计数）

| 指标 | 数值 | 说明 |
|---|---|---|
| 纳入验收组件 | 12 | 六类代表组件 |
| 机器 QA 通过 | 12 | 仅代表解码/帧数/fps/分辨率/黑帧/运动等结构检查 |
| 人工视觉通过 | 12 | 人工审片记录，见 `reviews-round1.json` |
| 人工视觉待审 | 0 | 机器通过不等于视觉通过 |
| 人工视觉不通过 | 0 | — |
| 真实 Remotion MP4 | 12 | 1280×720，h264 |

> 机器 QA 只证明视频可解码、帧数/fps/分辨率匹配、不是纯黑/纯白且有帧间运动；它**不证明排版、可读性、审美或内容正确**。人工视觉结论单独记录。

## 2. 逐组件验收

| LW ID | 类别 | 策略 | 通道 | 文件 | SHA | 可编辑参数 | 渲染 | 机器QA | 人工视觉 | 帧/fps | 证据 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FT-T03e-414 | 讲解段落 | existing-component | sha-assets | 4 | ✓ | 标题/步骤/强调色/高亮/速度 | pass | pass | pass | 420/60.0 | `external/fredtalk/batch/evidence/FT-T03e-414/` |
| FT-T09s-289 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | 截图/截图尺寸/点击坐标/缩放/结论/高亮词/遮罩 | pass | pass | pass | 180/30.0 | `external/fredtalk/batch/evidence/FT-T09s-289/` |
| FT-T12d-407 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | 阶段文字/强调字/焦点/底图 | pass | pass | pass-with-note | 360/60.0 | `external/fredtalk/batch/evidence/FT-T12d-407/` |
| FT-T12l-337 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | 章节号/小标签/标题/圆心 | pass | pass | pass | 180/60.0 | `external/fredtalk/batch/evidence/FT-T12l-337/` |
| FT-T20f-395 | 录屏与视频入场 | kit-overlay | sha-assets | 3 | ✓ | 视频/起点/标题/高亮词/角标 | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/evidence/FT-T20f-395/` |
| FT-OP03-467 | 录屏与视频入场 | project-expand | sha-assets | 10 | ✓ | 视频 src | pass | pass | pass | 240/60.0 | `external/fredtalk/batch/evidence/FT-OP03-467/` |
| FT-T05a-436 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | 前后图/标签/说明/滑杆停留 | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/evidence/FT-T05a-436/` |
| FT-T20a2-405 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | 作品数组/主角序号/钩子/高亮词 | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/evidence/FT-T20a2-405/` |
| FT-T14e-378 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | 三项数字/主角卡 | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/evidence/FT-T14e-378/` |
| FT-T15a-426 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | 条目/主角/小数位/前后缀/脚注 | pass | pass | pass | 300/60.0 | `external/fredtalk/batch/evidence/FT-T15a-426/` |
| FT-T09n-374 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | 截图/截图尺寸/遮罩/标签/分钟/前后缀 | pass | pass | pass | 180/60.0 | `external/fredtalk/batch/evidence/FT-T09n-374/` |
| FT-RC02-471 | 录屏聚焦 | project-expand | sha-assets | 10 | ✓ | 视频/起点/ROI/冻结区间 | pass | pass | pass | 480/60.0 | `external/fredtalk/batch/evidence/FT-RC02-471/` |

### 视觉审核备注

- **FT-T03e-414**（步骤折行串起）：pass — 讲解段落基线；六步链路完整，中文与强调色均生效。
- **FT-T09s-289**（点击足迹：每次点击留下序号，最后连成一条路径回看）：pass — 点击轨迹与白色标签卡可见；截图与点击坐标为 LW 占位素材，非上游原图。
- **FT-T12d-407**（阶段胶囊：三枚胶囊建立，聚焦当前阶段）：pass-with-note — 阶段胶囊按前/中/后建立并聚焦第 2 段；OFL 斜体字面紧排，字距略紧，可读。
- **FT-T12l-337**（黑圆扩散：黑圆接管画面，序号落定后领出章节名）：pass — 黑圆扩散 + 章节号 03 + 两行中文标题，层级干净。
- **FT-T20f-395**（先看结果再倒回来）：pass — 先成品后问题；录屏窗口、标题、高亮词、成品角标均正确。
- **FT-OP03-467**（圆形入口展开为视频窗）：pass — 圆形入口展开后播放用户录屏；共享宿主角标/音效已移除。
- **FT-T05a-436**（滑杆前后对比）：pass — 滑杆前后对比；before/after 已换成 LW 自有占位作品图。
- **FT-T20a2-405**（成果先行开场（返修）：默认主图换单张作品）：pass — 十二格作品墙 + 主角图 + 钩子文案；素材为 LW 占位图循环。
- **FT-T14e-378**（三个关键数字）：pass — 三张数字卡 + 主角卡深底；数字/单位/说明均可替换。
- **FT-T15a-426**（跑分条形图：条依次长出，主角高亮）：pass — 条形跑分 + 主角条 + 脚注；明确标注 LW 测试口径。
- **FT-T09n-374**（等待快进）：pass — 等待快进卡；数字滚轮中间帧是滚动切片，不是丢字。
- **FT-RC02-471**（整页镜头推近与回全貌）：pass — 中段推近 ROI、末段回全貌；ROI 需按每段录屏重设，属该类限制。

### 已记录的类别限制

- **FT-T12d-407**：宿主字体为 OFL 斜体，字距比上游 MiSans 紧；如需大字可加 0.02–0.05em 字距。
- **FT-OP03-467**：上游目录只登记 3 个文件，必须整项目展开才能编译；共享层已宿主化。
- **FT-T05a-436**：上游 before/after 图不随 MIT 分发；只能使用用户自有素材或 LW 占位图。
- **FT-T20a2-405**：上游 12 张作品图不随 MIT 分发；参数只接受用户自有图片数组。
- **FT-T09n-374**：数字滚轮按宿主字宽做了 0.62em→1.0em 的源内补丁，已记入 provenance。
- **FT-RC02-471**：ROI（x/y/w/h）与录屏画面强相关，无法跨素材通用；每换一段录屏必须重设。

## 3. 全库 432 条源码与版权状态

| 维度 | 数量 | 说明 |
|---|---|---|
| 目录条目 | 432 | 上游 `library/catalog.json` v2.5.0 |
| 全 SHA 通道 | 258 | `/api/visual-library/assets/<sha>.txt` 或 `/visual-library-app/objects/<sha>.txt` |
| 公开 tag 树补全 | 174 | tag `v2.5.0` 的 `components/projects/**` |
| 无源码 | 0 | — |

适配策略分布：`blocked-dependency` 284；`kit-overlay` 135；`standalone-module` 5；`standalone` 8。
类别分布：讲解段落 234；内容交接 54；录屏与视频入场 42；录屏聚焦 43；数值与图表 19；图片与作品 40。

版权口径：FredTalk 第一方代码/工具/模板按 MIT；字体 SmileySans 为 OFL-1.1、按原样打包；音效、图片、截图、录屏、Logo 等媒体不随 MIT，本轮一律不入库，改用 LW 自有占位素材。所有适配组件保留 FredTalk 来源与许可。

## 4. 批量适配器

- `adapt.py`：`kit-overlay` / `project-expand` / 声明式 `sourcePatches`；`--all-kit --limit N` 从 inventory 自动选件并生成 profile，不依赖手工逐条配置。
- `render_batch.mjs`：真实 Remotion 渲染；`status.json` 存 `inputFingerprint`（适配器版本、生成适配器 SHA、源码 SHA、props、主题、背景、速度、fps、时长）；输入变化自动重渲，`--force` 强制。
- `qa_media.py`：只做机器结构 QA，输出 `machineStatus`，不写人工视觉结论。
- `report.py`：机器 QA 与人工视觉分开计数；人工结论来自 `reviews-round1.json` / `reviews/<id>.json`。
- 新批次视频写入 `batch/runs/<runId>/`，该目录不入库；仓库只保留报告、状态与第一轮 12 条证据。

## 5. 下一批自动扩展范围

- `kit-overlay` 中符合“kit 文件齐全 + 入口导出可解析 + 入口 import 可解析”的组件：自动选件，首批 20 条通过 `tools/fredtalk/batch.py --next 20`。
- 三个只登记 `S12/shared`、`Open6/ep` 的成片项目仍属 `blocked-dependency`：需要整项目展开，不进入自动 kit 批次。
- `blocked-dependency` 284 条按 tag 项目分组后做 `project-expand`；`standalone` 13 条独立模板。

## 6. 必须特殊处理的范围

- 非 kit 共享模块（`shared.tsx`、`FullscreenVideoWindow.tsx`、项目私有 lib）：整项目展开并逐项目核对宿主替换点。
- 数字/里程表类：按宿主字体度量做源内补丁（已示范 T09n）。
- 上游品牌/音效/截图/录屏/作品图：媒体不随 MIT，必须替换。
- ROI、点击坐标等画面强绑定参数：只提供入口，不承诺跨素材通用。
- 16 条 tag 树部分命中：先整项目展开补齐。

## 7. 复现

```bash
cd visual-studio
npm ci
python3 scripts/install-fred-font.py
python3 tools/fredtalk/inventory.py
python3 tools/fredtalk/adapt.py
LW_BROWSER=/usr/local/bin/chromium node tools/fredtalk/render_batch.mjs --only FT-T14e-378
python3 tools/fredtalk/qa_media.py --only FT-T14e-378
python3 tools/fredtalk/report.py
```

新批次：`python3 tools/fredtalk/batch.py --next 20`（自动选件 → 适配 → 渲染 → 机器 QA → 报告）。

