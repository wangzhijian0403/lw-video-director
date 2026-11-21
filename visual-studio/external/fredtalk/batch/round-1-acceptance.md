# FredTalk 全库接入 · 第一轮验收报告

分支 `feature/fredtalk-batch-adapter`（基线 PR #6 `feature/resource-adapters-poc`，未改 `main`，未触碰 PR #7《造纸术》）。

## 1. 第一轮结论

| 指标 | 数值 |
|---|---|
| 纳入验收组件 | 12 |
| 实际取得源码（含 SHA/路径证据） | 12 |
| 自动接入成功（含 T03e 既有） | 12 |
| 新增批量适配 | 11（9 kit-overlay + 2 project-expand） |
| 需要特殊适配 | 3（2 个整项目展开 + 1 个数字字宽源内补丁） |
| 来源/权限阻塞 | 0 |
| 真实 Remotion MP4 渲染通过 | 12 |
| 自动 QA 通过（帧数/fps/分辨率/黑帧/运动） | 12 |
| 人工视觉审核通过 | 12（1 条带字距备注） |

样片验证点：中文文字可替换；主题色/背景色可配置；图片与录屏可替换为用户自有素材；速度/时长参数可调；均导出真实 MP4（1280×720，h264）；均已注册进 LW Visual Studio References（`fred-batch` 适配器，可预览 + 可导出）。

LW Visual Studio 调用已端到端验证：`POST /api/render-reference` → `fred-batch` 分支 → `renderFredComponent` → MP4。测试改写了 FT-T14e-378 的参数（主题色 `#c4553f`、主角卡 `hero:0`），成片与帧图证明用户输入确实进入组件：`external/fredtalk/batch/evidence/FT-T14e-378/studio-api.mp4` 与 `studio-api-final.png`。

## 2. 逐组件验收

| LW ID | 类别 | 策略 | 源码通道 | 文件 | SHA 校验 | 可编辑参数 | 渲染 | 帧/fps | 亮度 | 运动 | 视觉 | 证据 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FT-T03e-414 | 讲解段落 | existing-component | sha-assets | 4 | ✓ | 标题/步骤/强调色/高亮/速度 | ✓ | 420/60.0 | 131.92 | 0.335 | pass | `external/fredtalk/batch/evidence/FT-T03e-414/` |
| FT-OP03-467 | 录屏与视频入场 | project-expand | sha-assets | 10 | ✓ | 视频 src | ✓ | 240/60.0 | 242.47 | 0.548 | pass | `external/fredtalk/batch/evidence/FT-OP03-467/` |
| FT-RC02-471 | 录屏聚焦 | project-expand | sha-assets | 10 | ✓ | 视频/起点/ROI/冻结区间 | ✓ | 480/60.0 | 242.91 | 0.812 | pass | `external/fredtalk/batch/evidence/FT-RC02-471/` |
| FT-T05a-436 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | 前后图/标签/说明/滑杆停留 | ✓ | 300/60.0 | 188.56 | 0.5 | pass | `external/fredtalk/batch/evidence/FT-T05a-436/` |
| FT-T09n-374 | 录屏聚焦 | kit-overlay | sha-assets | 3 | ✓ | 截图/截图尺寸/遮罩/标签/分钟/前后缀 | ✓ | 180/60.0 | 142.86 | 2.086 | pass | `external/fredtalk/batch/evidence/FT-T09n-374/` |
| FT-T09s-289 | 讲解段落 | kit-overlay | sha-assets | 3 | ✓ | 截图/截图尺寸/点击坐标/缩放/结论/高亮词/遮罩 | ✓ | 180/30.0 | 226.32 | 2.958 | pass | `external/fredtalk/batch/evidence/FT-T09s-289/` |
| FT-T12d-407 | 内容交接 | kit-overlay | sha-assets | 3 | ✓ | 阶段文字/强调字/焦点/底图 | ✓ | 360/60.0 | 217.72 | 1.219 | pass-with-note | `external/fredtalk/batch/evidence/FT-T12d-407/` |
| FT-T12l-337 | 内容交接 | kit-overlay | sha-assets | 4 | ✓ | 章节号/小标签/标题/圆心 | ✓ | 180/60.0 | 51.4 | 2.181 | pass | `external/fredtalk/batch/evidence/FT-T12l-337/` |
| FT-T14e-378 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | 三项数字/主角卡 | ✓ | 300/60.0 | 230.72 | 0.329 | pass | `external/fredtalk/batch/evidence/FT-T14e-378/` |
| FT-T15a-426 | 数值与图表 | kit-overlay | sha-assets | 3 | ✓ | 条目/主角/小数位/前后缀/脚注 | ✓ | 300/60.0 | 232.05 | 0.215 | pass | `external/fredtalk/batch/evidence/FT-T15a-426/` |
| FT-T20a2-405 | 图片与作品 | kit-overlay | sha-assets | 3 | ✓ | 作品数组/主角序号/钩子/高亮词 | ✓ | 300/60.0 | 176.15 | 1.845 | pass | `external/fredtalk/batch/evidence/FT-T20a2-405/` |
| FT-T20f-395 | 录屏与视频入场 | kit-overlay | sha-assets | 3 | ✓ | 视频/起点/标题/高亮词/角标 | ✓ | 300/60.0 | 240.19 | 0.549 | pass | `external/fredtalk/batch/evidence/FT-T20f-395/` |

### 视觉审核备注

- **FT-T03e-414**（步骤折行串起）：讲解段落基线；六步链路完整，中文与强调色均生效。
- **FT-OP03-467**（圆形入口展开为视频窗）：圆形入口展开后播放用户录屏；共享宿主角标/音效已移除。
- **FT-RC02-471**（整页镜头推近与回全貌）：中段推近 ROI、末段回全貌；ROI 需按每段录屏重设，属该类限制。
- **FT-T05a-436**（滑杆前后对比）：滑杆前后对比；before/after 已换成 LW 自有占位作品图。
- **FT-T09n-374**（等待快进）：等待快进卡；数字滚轮中间帧是滚动切片，不是丢字。
- **FT-T09s-289**（点击足迹：每次点击留下序号，最后连成一条路径回看）：点击轨迹与白色标签卡可见；截图与点击坐标为 LW 占位素材，非上游原图。
- **FT-T12d-407**（阶段胶囊：三枚胶囊建立，聚焦当前阶段）：阶段胶囊按‘前/中/后’建立并聚焦第 2 段；OFL 斜体字面紧排，字距略紧，可读。
- **FT-T12l-337**（黑圆扩散：黑圆接管画面，序号落定后领出章节名）：黑圆扩散 + 章节号 03 + 两行中文标题，层级干净。
- **FT-T14e-378**（三个关键数字）：三张数字卡 + 主角卡深底；数字/单位/说明均可替换。
- **FT-T15a-426**（跑分条形图：条依次长出，主角高亮）：条形跑分 + 主角条 + 脚注；明确标注 LW 测试口径。
- **FT-T20a2-405**（成果先行开场（返修）：默认主图换单张作品）：十二格作品墙 + 主角图 + 钩子文案；素材为 LW 占位图循环。
- **FT-T20f-395**（先看结果再倒回来）：先成品后问题；录屏窗口、标题、高亮词、‘成品’角标均正确。

### 已记录的类别限制（不宣称所有组件具备同等参数能力）

- **FT-OP03-467**：上游目录只登记 3 个文件，必须整项目展开才能编译；共享层已宿主化。
- **FT-RC02-471**：ROI（x/y/w/h）与录屏画面强相关，无法跨素材通用；每换一段录屏必须重设。
- **FT-T05a-436**：上游 before/after 图不随 MIT 分发；只能使用用户自有素材或 LW 占位图。
- **FT-T09n-374**：数字滚轮按宿主字宽做了 0.62em→1.0em 的源内补丁，已记入 provenance。
- **FT-T12d-407**：宿主字体为 OFL 斜体，字距比上游 MiSans 紧；如需大字可加 0.02–0.05em 字距。
- **FT-T20a2-405**：上游 12 张作品图不随 MIT 分发；参数只接受用户自有图片数组。

## 3. 全库 432 条源码与版权状态

| 维度 | 数量 | 说明 |
|---|---|---|
| 目录条目 | 432 | 上游 `library/catalog.json` v2.5.0 |
| 全部文件可匿名取得并 SHA-256 校验 | 258 | `/api/visual-library/assets/<sha>.txt` 或 `/visual-library-app/objects/<sha>.txt` |
| 需公开 tag 项目树补全 | 174 | tag `v2.5.0` 的 `components/projects/**` |
| 其中完整命中 | 158 | `implementation.projects[0]` + label 全命中 |
| 其中部分命中 | 16 | 缺 1–2 个同项目兄弟模块，可整项目展开补齐 |
| 完全无源码 | 0 | 无 |

适配策略分布：`blocked-dependency` 284；`kit-overlay` 135；`standalone-module` 5；`standalone` 8。
类别分布：讲解段落 234；内容交接 54；录屏与视频入场 42；录屏聚焦 43；数值与图表 19；图片与作品 40。

版权口径：FredTalk 第一方代码/工具/模板按 MIT（作者公开授权，2026-10-13）；字体 SmileySans 为 OFL-1.1、按原样打包；音效、图片、截图、录屏、Logo 等媒体不随 MIT 授权，本轮一律不入库，改用 LW 自有占位素材。所有适配组件保留 FredTalk 来源与许可，不标为 LW 原创。

## 4. 批量适配器第一版

- `tools/fredtalk/ftlib.py`：双通道取源、SHA-256 校验、tag 树索引、依赖/入口/参数静态分析。
- `tools/fredtalk/inventory.py`：432 条盘点，产出 `inventory.json/md/csv`、`source-manifest.json`。
- `tools/fredtalk/adapt.py`：策略化适配器。`kit-overlay` 仅替换宿主层（字体/角标/音效/主题/时钟）；`project-expand` 整项目展开后再覆盖 shared；支持声明式 `sourcePatches` 处理字体度量差异。逐条写 `provenance.json` 与 `props.json`，自动生成 Remotion registry。
- `tools/fredtalk/render_batch.mjs`：bundle → selectComposition → 真实 renderMedia → 首/中/尾/关键动作帧 still；读取/写回 `status.json`，已通过的默认跳过，`--force` 重跑。
- `tools/fredtalk/qa_media.py`：cv2 解码检查帧数、fps、分辨率、黑帧率、平均亮度、帧间运动。
- `tools/fredtalk/report.py`：生成本报告与 `status.json`。
- 断点恢复：`status.json` + 证据目录；失败重试；已通过跳过；上游源码副本与 `.cache` 分离，`.cache` 不入库。

## 5. 下一批可自动扩展范围

- **kit-overlay 剩余 125 条**：同一 kit 指纹（`kit/theme.ts` + `kit/ui.tsx`）可直接按批 20 条跑 `adapt.py` + `render_batch.mjs`，无需人工写适配。
- **blocked-dependency 284 条**：不是权限阻塞，而是目录只登记部分文件；按 tag 项目分组做 `project-expand`，首批 20 条验证共享层差异后可批量推进。
- **standalone/standalone-module 13 条**：无 kit 依赖，需逐条确认根组件 props 与媒体，走独立模板。

## 6. 必须特殊处理的范围

- 依赖非 kit 共享模块（如 `shared.tsx`、`FullscreenVideoWindow.tsx`、项目私有 `lib`）的条目：必须整项目展开并逐项目核对宿主替换点。
- 数字/里程表类组件：上游按 MiSans 数字宽度硬编码单元格，换字体后需按宿主字体度量做源内补丁（已示范 T09n）。
- 依赖上游品牌角标、音效、截图、录屏、作品图的条目：媒体不随 MIT，必须替换为用户自有素材或 LW 占位，不能沿用上游媒体。
- 参数与画面强绑定的组件（如录屏 ROI、点击坐标）：只能提供参数入口，不能承诺跨素材通用。
- 16 条 tag 树部分命中：先整项目展开补齐，再判断是否仍缺模块。

## 7. 证据与复现

```bash
cd visual-studio
npm ci
python3 scripts/install-fred-font.py
python3 tools/fredtalk/inventory.py
python3 tools/fredtalk/adapt.py
LW_BROWSER=/usr/local/bin/chromium node tools/fredtalk/render_batch.mjs
python3 tools/fredtalk/qa_media.py
python3 tools/fredtalk/report.py
```

每个组件的 MP4、5 张审片帧与 `qa.json` 位于 `external/fredtalk/batch/evidence/<LW-ID>/`；`provenance.json` 记录逐文件上游 URL/SHA、宿主改动与源内补丁。

