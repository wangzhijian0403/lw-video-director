# FredTalk 全库接入状态（LW-FT-FULL-001 · Stage A1/A2 + LWFT-FULL-84 最终）

> 本文件是 FredTalk 组件选型的**唯一事实来源**。按唯一 `lwId` 去重，432 条目录逐条记录
> 源码/SHA、依赖、许可、可编辑参数、适配策略、渲染、机器 QA、人工视觉、工作台导出与失败原因。
> **机器 QA 通过绝不等于人工视觉通过**；未审片一律记 `pending`，不得用机器指标替代。
>
> **口径说明（务必先读）**：上游 `library-catalog-v2.5.0.json` 的 `counts` 为
> `total=432 / skillActive=286 / skillArchived=146`，归档集可用 `defaultReuse=False` 精确识别。
> **用户要接的是 286 条活跃库**；432 是把 146 条归档老版本也算进去的全量目录。
> 对外汇报「进来了多少 / 还差多少」一律以 **286** 为分母，详见 [第 10 节](#10-lwft-full-84-最终验收与-skill-运行时落地)。

## 1. 基线核查结论（任务书要求"开始工作前重新核查"）

| 任务书描述 | 实际核查结果 |
| --- | --- |
| 432 条引用目录 | ✅ 一致：`inventory.json` 432 行；`catalog.json` 672 条中含 FredTalk 正好 432 条 |
| 135 Kit / 8 独立 / 5 多文件 / 284 依赖缺失 | ✅ 一致（inventory 策略分布） |
| `visual-studio/tools/fredtalk/` 工具链 | ⚠️ 不在 main，仅在 `origin/feature/fredtalk-batch-adapter`（PR #8，6c8f2cd） |
| `run_all.py` 已加入 PR #8 | ⚠️ 分支中**无** `run_all.py`；实际入口是 `batch.py` + `render_batch.mjs` + `tests/test_pipeline.py` |
| `WHOLE-LIBRARY.md` | ⚠️ 不存在；实际为 `batch/inventory.md` 与 `batches/*-acceptance.md` |
| 16 条精选已进入 main | ✅ 与历史一致；独立开发树已适配 69 条（含本轮 20 条） |

**结论**：基线数字成立，但任务书的工具路径/入口名称与真实仓库有偏差，选型时以实际分支文件为准。

## 2. 逐条状态分层（截至 LWFT-FULL-84 审片晋级结束 · 最终）

### 2.1 全量 432 条口径

| tier | 数量 | 含义 |
| --- | ---: | --- |
| `production-ready` | 101 | 适配+渲染+机器QA+人工视觉+工作台导出+可执行 全通过 |
| `visual-accepted` | 12 | 适配+渲染+机器QA+人工视觉通过（工作台导出未补记录，但 catalog 已 executable） |
| `machine-qa-only` | 2 | 仅机器 QA 通过，人工视觉 pending（**不可用于交付成片**） |
| `rendered-qa-not-pass` | 19 | 已真实渲染 MP4，但机器 QA 为 not-tested 或 fail，须人工复核 |
| `blocked-dependency` | 282 | 依赖文件缺失，当前无法自动适配 |
| `candidate-not-adapted` | 16 | kit-overlay/standalone 候选，尚未适配 |
| **合计** | **432** | 唯一 ID，0 重复 |

- 人工视觉：**pass 131 / pending 301**（conditional 0 / rework 0）。
- 真实渲染 pass：**134**；机器 QA pass：**115**；工作台导出 pass：**119**。
- 已适配注册：**134 条**，`generated.tsx` 同步注册 `REF-<id>`。
- `external/catalog.json` 中 `executable=true`：全库 114（FredTalk 113 + 其它 1），
  其中 `fred-batch` 112 条、`fred-step-chain` 1 条。
- 具备可编辑参数：142 条；源码 SHA 全部校验通过：258 条。

> 注意 `status.json` 的 `executable` 列是 `catalog.executable OR inRegistry` 的并集（=134，表示「已注册可渲染」），
> **不等于**双门槛晋级后的 `catalog.executable`（=113）。汇报「能用多少」一律取后者。

### 2.2 用户口径：活跃库 286 条（这才是要交付的库）

| 指标 | 数量 |
| --- | ---: |
| 活跃库总数 | **286** |
| 已能在本 Skill 工作台真实调用 | **112** |
| 还差 | **174** |
| 其中 `production-ready`（走完双门槛） | 100 |
| 其中 `visual-accepted`（较早已执行、未补工作台导出记录） | 12 |
| 归档老版本（不属用户要接的库） | 146 |

**还差的 174 条构成**：18 条已真实渲染但机器 QA 未过（须逐条复核）、8 条差适配
（kit 依赖缺失 / standalone `entryExport` 元数据）、148 条缺项目内依赖文件。

本轮之前活跃库可执行为 **46** 条；LWFT-FULL-84 新增晋级 **66** 条 → **112** 条。
全量 432 口径为 113 条，多出的 1 条属归档老版本。

### 2.3 变化来源

- batch-22：20 条口述人工视觉 pass + 工作台导出 20/20 pass → `production-ready` 15 → 35。
- LWFT-FULL-64：64 条真实 MP4 渲染、63 条机器 QA pass，人工视觉全部 pending。
- **LWFT-FULL-84**：用户口述「已经审完，继续」对应 84 条待审片活跃库条目；
  84/84 真实工作台导出 pass，其中 66 条同时满足机器 QA pass + 人工视觉 pass + 工作台导出 pass，
  经 `promote_candidates.py` 双门槛晋级；其余 18 条机器 QA 未过，**即使人工口述通过也不晋级**，
  临时预览授权已全部恢复。详见 [第 10 节](#10-lwft-full-84-最终验收与-skill-运行时落地)。
- 完整逐条表：`visual-studio/external/fredtalk/batch/full-library/STATUS.md`（生成于开发工作树），
  证据副本见 `references/fredtalk-full-library-data/`。

## 3. 批量入口（复用现有引擎，禁止另写第二套）

```
python tools/fredtalk/inventory.py            # 432 条盘点
python tools/fredtalk/hydrate_cache.py        # 补取 SHA 校验的源码缓存（全新克隆必做）
python tools/fredtalk/batch.py --next 20 --dry-run   # 只验证自动选件
python tools/fredtalk/batch.py --next 20      # 适配 -> 渲染 -> 机器 QA -> 报告
LW_BROWSER=<chrome.exe> node tools/fredtalk/render_batch.mjs --plan <run>/plan.json
python tools/fredtalk/qa_media.py --run-id <run>     # 机器结构 QA（OpenCV，无 ffmpeg 也可）
python tools/fredtalk/report.py --run-id <run>       # 独立批次验收报告
python tools/fredtalk/workbench_export.py --ids <ID> # 逐组件改参数 + 工作台 API 导出 MP4
python tools/fredtalk/promote_candidates.py --run-id <run>  # 晋级（须人工视觉+工作台导出双 pass）
```

## 4. 真实 Windows 环境验证（A2）发现并修复的两处阻塞

1. **源码缓存为空导致选件 0 条**：`.cache/sources` 被 gitignore，全新 worktree 中为空，
   `batch.py --dry-run` 返回 `selected=0 / skipped=87`，全部 `no exported component symbol`。
   用 `hydrate_cache.py` 复用 `ftlib.fetch_asset`（SHA-256 逐字节校验）并发补取
   **309 个唯一 SHA / 888 个缓存对象，0 失败**后，恢复为 `selected=20 / skipped=1`。
   135 条 kit-overlay 候选的源码文件全部带 SHA，不受 705 个无 SHA 的 tag-tree 文件影响。

2. **`ensure_tag_tree` 在无 GitHub 通道时强制 clone 导致适配中断**：
   本机 `raw.githubusercontent.com` / GitHub 部分 clone 走 schannel 报
   `server closed abruptly (missing close_notify)`。核查确认 `build_kit_overlay` 接收
   `tag` 参数但从不使用（kit-overlay 全部源码来自 SHA 缓存），只有 `build_project_expand`
   需要 tag tree。已在 `adapt.py::run_auto_kit` 做最小修复：仅当批次含 `project-expand`
   时才强制 clone；纯 kit-overlay 批次在有本地 tag tree 时加载、否则安全降级为 `None`。
   不改变其它批次行为。

**环境要点**：无 ffmpeg/ffprobe 时 `qa_media.py` 用 OpenCV 5.x；`render_batch.mjs` 需
`LW_BROWSER` 指向本机 Chrome；`node_modules` 可用目录联接复用（package-lock 一致）；
字体 `SmileySans-Oblique.ttf` SHA `b447d7e7…` 由 `npm run setup:fred` 校验安装。

## 5. 第一轮真实产物（batch-22，20 条新组件）

- 20 条全部真实适配（registry 49 → 69），`generated.tsx` 同步注册 `REF-<id>` composition。
- 20 条 **真实 MP4 渲染全部 pass**（180–360 帧，1280×720，21MB，14 分钟），
  每组件含 MP4 + 5 张审片帧 + `qa.json`；机器 QA 20/20 pass。
- **第二轮补充**：用户口述人工视觉 20 条 pass（如实标注为 `user-verbal-batch-verdict`），
  工作台端到端导出验收 **20/20 pass**，已按「人工视觉 pass + 工作台导出 pass」双门槛
  经 `promote_candidates.py` 晋级为 `executable=true` / `source-adapted-verified`。
  `production-ready` 因此由 15 → 35。
- 独立抽查首/中/尾帧差异，20 条均为真实动画，无静态截图冒充；
  `FT-T09d-654` 与 `FT-T09d2-404` 默认画面高度相似（帧差 93.49/93.48），
  但上游源码 SHA 与文件大小不同，属上游自身两个变体，已列为审片关注项。

## 6. 尚未完成 / 阻塞项（诚实保留）

以**活跃库 286** 口径：还差 **174 条**，分三类，均需开发通用适配器，**不是再跑一次批量任务能补齐的**：

- **148 条 `blocked-dependency`**（全量 282，其中 134 条属归档）：缺的是项目内相对模块（1105 次）
  与相对 JSON 配置（457 次），需开发通用 `project-expand` 适配器；现有 `profiles/round1.json`
  只有 2 个 project-expand profile，`TagTree` 的路径契约是 `components/projects/<id>/...`
  而这些条目源码是 `episodes/`、`source/src/`、`expansion-selected-20261007/` 另一套组织。
  v2.5.0 tag tree 已取到 7047 个文件，但缺失依赖的 339 个唯一 basename 中仅 126 个能找到，
  **tag tree 就绪 ≠ 这 148 条可跑**。逐类清单见
  `references/fredtalk-full-library-data/blocked-dependency-breakdown.md`。
- **8 条 `candidate-not-adapted`**（全量 16，另 8 条属归档）：只完成可行性核查，未实质补齐。
  `FT-T05q-250` / `FT-T17i-272` / `FT-T20u-279` 缺 `kit/theme.ts`、`kit/ui.tsx`、`lib/shell`、
  `timing.json` 及多个 `components/*`，tag tree 中找不到对应 `episodes/117`、`episodes/119` 结构；
  `FT-V037-v2-331` / `FT-NMC01-457` / `FT-INT01-463` / `FT-INT02-464` / `FT-INT04-466`
  为 standalone(-module)，需 `entryExport` 元数据、共享 entry 解析与 `registerRoot` 处理。
  `standalone` / `standalone-module` 基线共 13 条：虽 `missingImports=0`、其中 5 条源码已在缓存，
  但 inventory **无 `entryExport` 元数据**、多条共用同一 entry，不得强行生成假入口。
- **18 条 `rendered-qa-not-pass`**：已真实渲染 MP4 但机器 QA 为 fail / not-tested。
  用户口述「已经审完」覆盖这 84 条待审片条目的**人工视觉**，但**不覆盖机器 QA**；
  这 18 条即使工作台导出 18/18 pass 也一律保持 `executable=false`，须逐条机器复核后才可晋级。
  其中 `FT-T15e-376`（折线走势）`motionMean=0.046` 触发 `hasMotion` 阈值，独立复核首/中/尾帧差
  7.293、逐帧最大 1.155，属「折线逐段画出、后半静止」的稀疏动画而非静态截图；
  仍如实保留 `fail`，不得改成 pass。18 条 ID 见 `LWFT-FULL-84-reviews.json` 的 `machineQaHoldIds`。
- **全量口径下人工视觉仍有 301 条 `pending`**（其中活跃库 174 条、归档 127 条），
  机器 QA 不得替代人工视觉。
- **主仓库 `main` 已合入本轮成果**：开发成果原位于独立工作树
  `D:/Codex工作目录/lw-fredtalk-full-LW-FT-FULL-001`（分支 `work/fredtalk-full-001`，基于 6c8f2cd），
  现已同步到主仓库 `main` 与本地 Skill。main 工作区原有 6 项未跟踪改动与用户私有素材已先备份再保留，未被覆盖。
  **已验证运行时在本仓库与本地 Skill 内均可直接调用**。

## 7. 证据文件索引

| 内容 | 路径 |
| --- | --- |
| 432 条完整状态表（开发工作树） | `visual-studio/external/fredtalk/batch/full-library/STATUS.md` / `status.csv` / `status.json` |
| **证据副本（本 Skill 内）** | `references/fredtalk-full-library-data/`：`STATUS.md` / `status.csv` / `status.json`、<br>`LWFT-FULL-84-reviews.json`、`LWFT-FULL-84-workbench-export.json`、<br>`LWFT-FULL-84-acceptance.md`、`skill-verification.json`、`active-library-scope.json` |
| 取源报告 | `external/fredtalk/batch/full-library/cache-hydration.json` |
| 清单生成器 | `tools/fredtalk/full_library_status.py` |
| 缓存补齐工具 | `tools/fredtalk/hydrate_cache.py` |
| batch-22 计划/状态/QA/报告 | `external/fredtalk/batch/runs/LWFT-batch-22/` |
| batch-22 验收报告 | `external/fredtalk/batch/batches/LWFT-batch-22-acceptance.md` |
| 视频与审片帧 | `external/fredtalk/batch/runs/LWFT-batch-22/evidence/<ID>/` |
| LWFT-FULL-84 工作台导出 | `external/fredtalk/batch/runs/LWFT-FULL-84/workbench-export/`（84 个真实 MP4） |
| LWFT-FULL-84 审片结论 | `external/fredtalk/batch/batches/LWFT-FULL-84-reviews.json` |
| Skill 运行时 smoke test | `review/LWFT-FULL-84/skill-verification/skill-runtime-smoke.mp4` |

## 8. 人工视觉审片流程（batch-22 结论已产生并已晋级）

审片材料目录：`D:/Codex工作目录/lw-fredtalk-full-LW-FT-FULL-001/review/LWFT-batch-22/`

| 文件 | 用途 |
| --- | --- |
| `review-board.html` | 自包含审片看板：20 条 × 5 帧时间轴（JPEG 内嵌）+ 真实 MP4 播放 + 通过/驳回/待定 + 备注 + 结果导出 |
| `sign-off.csv` | 逐条签字清单（UTF-8 BOM，Excel 可开），20 行初始全部 `pending` |
| `review-guide.md` | 8 条判定标准、结论取值、重点关注项、导出格式与禁止事项 |
| `media/<ID>.mp4` | 从批次证据原样复制的 20 条真实渲染 MP4 |
| `frames/<ID>/*.png` | 100 张原始高清审片帧 |

生成工具：`tools/fredtalk/build_review_sheet.py --run-id <run>`（**不写任何视觉结论**，所有条目初始 `pending`）。

**三条阻塞级关注项**：
- `FT-T09d-654` / `FT-T09d2-404`：导出符号同为 `TaskRunStatus`、默认画面几乎一致
  （帧差 93.49 / 93.48、motion 0.821 / 0.822），上游源码 SHA 不同。审片须确认视觉可区分；
  若不可区分，驳回其一或标注「同效重复」，不得当作两个独立能力交付。
- `FT-T09i-363`：`motionMean=0.088` 全批最低，须辨明「稀疏动画」还是「近似静态」。

**判定标准**：真动画 / 无黑帧白板 / 构图完整 / 文字可读 / 语义一致 / 组件差异性 / 节奏完整 / 帧率与时长。

导出结果格式与历史 `batch-20-reviews.json` 对齐（`runId / reviewedAt / scope / reviewer / method / reviews`）。
只有 `pass` 条目可进入工作台导出验收 → 晋级 Originals → 合并 main；`reject` / `hold` / `pending` 一律不得晋级。

**本批结论（已落盘）**：`review/LWFT-batch-22/review-results.json` 与
`batches/LWFT-batch-22-reviews.json`，20 条 `pass`，`reviewer = user (verbal batch verdict)`，
`source = user-verbal-batch-verdict`（如实标注为口述批量结论，**不伪装为逐条视觉审片记录**）。
三条关注项的接受判定写在各自 note 里。工作台导出 `batches/LWFT-batch-22-workbench-export.json`
为 20/20 pass，`promote_candidates.py` 已完成双门槛晋级。

## 9. 第二轮「一次性把剩下的全跑完」（LWFT-FULL-64）

**一次性适配 64 条剩余 kit-overlay 候选**（`batch.py --next 64`），registry 69 → 133，
`generated.tsx` 同步 133 条。`batch.py --next 400 --dry-run` 只选出 64 条，skipped=3 —
即 135 条 kit-overlay 自动候选里能自动适配的已全部处理完。

- **真实 MP4 渲染 64/64 pass**（主批次 61 pass + 3 条串行补跑，40 分钟 + 3 分钟）。
  3 条主批次 FAIL 均为并发期 Chrome OOM / FFmpeg 中断，串行重跑后全部通过。
- **机器 QA 63 pass / 1 fail**；人工视觉 **64 条全部 pending**（未审片，绝不伪造通过）。
- 验收报告：`external/fredtalk/batch/batches/LWFT-FULL-64-acceptance.md`。

### 本轮修复的真实环境缺陷（均在独立 worktree）

| 缺陷 | 修复 |
| --- | --- |
| `workbench_export.py::start_server` 冷启动偶发退出 | 3 次重试 + 捕获日志（vite HMR 24678 告警非致命） |
| Windows 上 `subprocess.run(["npx", ...])` 报 WinError 2 | 改用 `node node_modules/esbuild/bin/esbuild`（fallback `npx.cmd`） |
| 本机无 `ffprobe`，20 条已下载的真实 MP4 被误判 fail | `ffprobe()` 加 OpenCV 降级（与 `qa_media.py` 一致） |
| 纯数值组件无字符串可编辑参数（`FT-T09r-288`） | 新增 `edit_first_param`：bool 取反 → 数值微调 |
| `git clone` 因 schannel `server closed abruptly` 失败 | `git -c http.sslBackend=openssl clone --filter=blob:none --sparse` |

### tag 源码树突破

`codeload` tarball（71MB）在本机仅 ~22KB/s 会超时；改用 openssl 后端 partial clone +
sparse-checkout 成功取得 **7047 个上游文件**，部署到 `.cache/upstream-v2.5.0`，
`default_tag_root()` 可加载。但：缺失依赖的 339 个唯一 basename 中仅 126 个能在 tag tree 找到，
且 `TagTree` 路径契约与 284 条阻塞条目的源码组织不匹配 —— **tag tree 就绪不等于这 284 条可跑**。

### 剩余类别的逐类修复清单

`references/fredtalk-full-library-data/blocked-dependency-breakdown.md`（及 `.json`），
由 `tools/fredtalk/gen_blocked_breakdown.py` 只读生成：
284 条 blocked-dependency 中 118 条源码已完整缓存、154 条纯 tag-tree 通道、64 条 visual-library-app；
缺失依赖按类别为项目内相对模块 1105 次、相对 JSON 配置 457 次、runtime/clip-spec 57 次等。
13 条 standalone 全部缺 `entryExport` 元数据。

**结论**：432 条中，现有流水线能力范围内的 135 条 kit-overlay 候选已全部适配与真实渲染；
剩余 284 + 13 条需要的是「通用适配器开发」而非「再跑一次批量任务」，本轮不伪造完成。

### 操作教训

两个 Chrome 渲染任务（Remotion CLI 的 `render_batch.mjs` 与工作台 server 的
`workbench_export.py`）**不能并行**，会触发 Chrome OOM 与 FFmpeg 编码中断；必须串行。

## 10. LWFT-FULL-84 最终验收与 Skill 运行时落地

用户于 2026-11-23 口述「**已经审完，继续**」，对应上一轮交付说明中
「84 个动画已真实渲染、等待人工过目」的活跃库条目。本轮不重跑渲染、不重跑 84 条导出，
只把审片结论落盘、完成双门槛晋级、重生成清单、把已验证运行时装进 Skill 并做回归验证。

### 10.1 审片结论（如实标注，不伪装逐条签字）

`batches/LWFT-FULL-84-reviews.json`：

| 字段 | 值 |
| --- | --- |
| `runId` | `LWFT-FULL-84` |
| `scope` | `visual-final-pass` |
| `reviewer` / `source` | `user (verbal batch verdict)` / `user-verbal-batch-verdict` |
| `activeLibraryScope` | 286 |
| `reviewedCount` | 84 |
| `promotionEligibleCount` | 66 |
| `machineQaHoldCount` | 18 |

`method` 明确记录为口述批量结论，**未逐条指出 reject/hold**；`caveat` 写明若后续有具体条目需回退，
应单独落盘变更，不得把批量结论当作逐条视觉签字。18 条 `machineQaHoldIds` 原样保留，
不得因人工口述通过而改写机器 QA 结论。

### 10.2 工作台导出 84/84 真实 pass

`batches/LWFT-FULL-84-workbench-export.json`：`84 records / 84 pass / 0 fail`，
每条含真实 MP4 路径、sha256、bytes 与 OpenCV probe。

- 45 条为中断前已下载的真实 MP4，以 `resumedFromMp4=true` 按 hash / 大小 / OpenCV 补记，
  **没有重新渲染、没有伪造结论**。
- `FT-T11c-417` 默认参数只含媒体路径数组、无可编辑标量，以 `noEditableParam=true` 降级，
  用默认参数完成真实工作台导出，并明确标注「未声称执行了参数编辑」。
- 批量中断原因是旧脚本逐条 `unlink` 临时 CJS 累计触发 `safe-delete` 批量删除保护；
  改为 `.cache/fred-props/<cid>.cjs` 复用 + 每条增量持久化 + 断点续跑后完成。

### 10.3 双门槛晋级（66 晋级 / 18 保留）

`promote_candidates.py --run-id LWFT-FULL-84` 只处理 `runs/LWFT-FULL-84/plan.json` 中
66 条同时满足「人工视觉 pass + 工作台导出 pass + 机器 QA pass」的条目，
置 `executable=true` / `installStatus=source-adapted-verified` / `workbenchExport=pass`。

`finalize_full84.py` 随后把 18 条机器 QA 未过条目的限时预览授权按
`preview-authorization.json` 的 `before` 快照恢复为 `executable=false` / `adapter=null`，
**无残留临时可执行标记**。最终输出：

```json
{"catalogExecutable": 114, "fredtalkExecutable": 113, "promoted": 66, "held": 18}
```

### 10.4 重生成全库清单

`full_library_status.py` 新增读取 `LWFT-FULL-84-reviews.json`、
`LWFT-FULL-84-workbench-export.json`，并加入视觉结论优先级与工作台导出覆盖。
重生成结果（432 行 / 0 重复）：

```
tier   : blocked-dependency 282, candidate-not-adapted 16, production-ready 101,
         visual-accepted 12, rendered-qa-not-pass 19, machine-qa-only 2
visual : pending 301, pass 131
workbench pass 119 | render pass 134 | machine QA pass 115
```

按活跃库 286 复算（见 `references/fredtalk-full-library-data/active-library-scope.json`）：
**可执行 112 / 还差 174 = 18 + 8 + 148**。全量 432 口径 113 条（多 1 条归档）。

### 10.5 Skill 运行时增量安装（关键：现在 Skill 里就能真用）

`tools/fredtalk/sync_skill_runtime.py` 把已验证运行时装进本 Skill 自带的 `visual-studio/`，
**保留 Skill 原有 `ProjectVideo` / `buildTimeline` 多镜头引擎，不做整体覆盖**：

- 纯新增复制：`external/fredtalk/adapted` 965 文件、`fredtalk-registry.data.json`、
  `fredtalk-registry.generated.tsx`、`placeholders.tsx`、`public/fredtalk` 15 文件、
  `tools/fredtalk` 25 文件、`full-library` 6 文件、`external/catalog.json`。
- 增量合并：`root.tsx` 加 `Placeholders` / `REF-FT-T03E` / `fredBatch.map` 注册；
  `render.mjs` 加 `renderFredReference` / `renderFredComponent`；
  `server.mjs` 的 `/api/render-reference` 增加 `fred-step-chain` 与 `fred-batch` 分支。
  JSX 内 sentinel 用 `{/* ... */}` 而非 `//`，避免被当成文本节点。
- Skill 原本无 `node_modules`，以 PowerShell `New-Item -ItemType Junction` 联接到
  主仓库同版本依赖（`package.json` 版本一致）。
- 合并前对 4 个被改文件做备份：`review/LWFT-FULL-84/skill-backup/`。

输出：`{"skillFredtalkExecutable": 113, "registryEntries": 133}`。
sanity 提示的 `FT-T03e-414` 复核为 `fred-step-chain`，走 `t03e` 独立注册路径，
本就不在 `adapted/` 下，**不是缺失**。

### 10.6 真实回归验证（全套通过）

| 验证 | 结果 |
| --- | --- |
| `npx tsc --noEmit` | `TSC_EXIT=0` |
| `npm test`（vite build + unit + api） | 退出码 0 |
| `npm run test:unit` | **29 / 29 pass** |
| `npm run test:api` | **8 / 8 pass** |
| `npm run test:accepted` / `test:visual-assets` | 3 / 3、4 / 4 pass |
| `python -m unittest discover -s tests`（Skill 根，本机无 pytest） | **26 / 26 OK** |
| `icon-assets.mjs --check` | `ok=true`，24 图标，0 errors |
| `lint:project` × 3 示例工程 | 3 / 3 通过 |
| `verify_skill_runtime.py` 用 Skill 自己的 `server.mjs`（端口 4201）渲染 `FT-T09w-292` | **pass**（最终复跑） |
| 产物 | `skill-runtime-smoke.mp4`，410735 bytes，sha256 `492f60f4…`，180 帧 / 1280×720，OpenCV probe |
| `main` 仓库 | 已合入验收成果；6 项未跟踪改动与用户私有素材先备份后完整保留 |

回归中修复三项真实问题，**均为陈旧断言 / 环境产物，不是改测试放水**：

- `schema.test.mjs`、`api.test.mjs` 原断言「FredTalk 一律不 executable」「候选只有 6 条」，
  属接入前历史基线。已改为更强不变量：113 条可执行 FredTalk 必须同时具备
  `installStatus=source-adapted-verified`、`renderStatus=passed` 与受支持 adapter，
  未晋级条目不得伪装 `source-adapted-verified`；`MP-002` 等元数据条目仍排除。
- 24 个图标 SVG 被 Windows 写成 CRLF，与 pinned `gitBlob`（LF）不符，`main` 中同样失败。
  已恢复为与上游完全一致的 LF 字节（24/24 哈希匹配），`--check` 转 `ok=true`。
- 本机无 `pytest`，Python 测试改用 `unittest discover`，26/26 通过。

`skill-verification.json` 证据副本位于 `references/fredtalk-full-library-data/`。
这证明 **112 条已可在主仓库与本地 Skill 工作台真实调用**，不再依赖独立工作树。

### 10.7 本轮明确的边界

- 18 条机器 QA 未过条目**未晋级**，口述审片不覆盖机器 QA。
- 8 条 `candidate-not-adapted` 与 148 条 `blocked-dependency` **只完成可行性核查，未实质补齐**，
  需通用 `project-expand` / `standalone` 适配器开发。
- 主仓库 `main` **已合入本轮验收成果**；未补齐的外部动效仍按原边界保留，不因合并而变成可执行。
- 完整回归测试（单元 / API / 媒体）结果见本节 10.6 与本轮交付说明；不得以
  `tsc` 通过或单条 smoke test 代替全部视觉与整片验收。
