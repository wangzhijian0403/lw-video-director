# LWFT-FULL-84 验收报告（最终）

> 触发：用户 2026-11-23 口述「**已经审完，继续**」。
> 范围：上一轮交付说明中「84 个动画已真实渲染、等待人工过目」的**活跃库**条目。
> 本轮不重跑渲染、不重跑 84 条工作台导出，只完成审片结论落盘、双门槛晋级、
> 全库清单重生成、Skill 运行时安装与回归验证。

## 1. 一句话结论

**用户要接的活跃库 286 条，现在有 112 条能在 Skill 工作台真实调用，还差 174 条。**
（全量 432 口径为 113 条可执行，多出的 1 条是归档老版本，不属于用户要接的库。）

## 2. 数字对照

| 指标 | 本轮前 | 本轮后 | 变化 |
| --- | ---: | ---: | ---: |
| 活跃库可执行 | 46 | **112** | +66 |
| `production-ready`（全量 432） | 35 | **101** | +66 |
| `production-ready`（活跃 286） | 34 | **100** | +66 |
| 工作台导出 pass（全量） | 35 | **119** | +84 |
| 人工视觉 pass（全量） | 47 | **131** | +84 |
| `catalog.executable`（全库） | 47 | **114** | +67 |
| 活跃库还差 | 240 | **174** | −66 |

## 3. 审片结论（如实标注）

证据：`LWFT-FULL-84-reviews.json`（开发工作树 `batches/`，本 Skill 内有副本）。

- `runId = LWFT-FULL-84`，`scope = visual-final-pass`，`reviewedCount = 84`。
- `reviewer = user (verbal batch verdict)`，`source = user-verbal-batch-verdict`。
- `method` 明确为口述批量结论，对应上一轮 84 条待审片活跃库条目；
  **不伪装为看板逐条签字**。
- `caveat`：用户未逐条指出 reject/hold；后续若有具体条目需回退，须单独落盘变更。
- `machineQaHoldCount = 18`，`machineQaHoldIds` 原样保留 18 条机器 QA 未过条目。

## 4. 工作台导出：84 / 84 真实 pass

证据：`LWFT-FULL-84-workbench-export.json`，每条含真实 MP4 路径、sha256、bytes、OpenCV probe。

- 45 条为中断前已下载的真实 MP4，以 `resumedFromMp4=true` 按 hash / 大小 / probe 补记，
  **未重新渲染、未伪造结论**。
- `FT-T11c-417`：`noEditableParam=true`，默认参数只含媒体路径数组、无可编辑标量，
  以默认参数完成真实工作台导出，并明确标注「未声称执行了参数编辑」。
- 中断原因是旧脚本逐条 `unlink` 临时 CJS 累计触发 `safe-delete` 批量删除保护；
  修复为 `.cache/fred-props/<cid>.cjs` 复用 + 每条增量持久化 + 断点续跑，
  并由 `run_full84_export.py` 单进程串行驱动（避免 Chrome OOM）。

## 5. 双门槛晋级：66 晋级 / 18 保留

`promote_candidates.py --run-id LWFT-FULL-84` 只处理 `plan.json` 中 66 条同时满足
「人工视觉 pass + 工作台导出 pass + 机器 QA pass」的条目：

```
executable=true, installStatus=source-adapted-verified, workbenchExport=pass
```

`finalize_full84.py` 把 18 条机器 QA 未过条目的限时预览授权按
`preview-authorization.json` 的 `before` 快照恢复为 `executable=false` / `adapter=null`，
**无残留临时可执行标记**。最终：

```json
{"catalogExecutable": 114, "fredtalkExecutable": 113, "promoted": 66, "held": 18}
```

> 诚实说明：这 18 条虽然人工口述审片通过、工作台导出也 18/18 pass，
> 但机器 QA 为 fail / not-tested，**一律不晋级**。口述审片不覆盖机器 QA。

## 6. 全库清单重生成

`full_library_status.py` 新增读取本轮审片与导出证据，重生成
`STATUS.md` / `status.json` / `status.csv`（432 行 / 0 重复）：

```
tier   : blocked-dependency 282, candidate-not-adapted 16, production-ready 101,
         visual-accepted 12, rendered-qa-not-pass 19, machine-qa-only 2
visual : pending 301, pass 131
workbench pass 119 | render pass 134 | machine QA pass 115
```

> 口径提醒：`status.json` 的 `executable` 列是 `catalog.executable OR inRegistry` 的并集
> （=134，「已注册可渲染」），**不等于**双门槛晋级后的 `catalog.executable`（=113）。
> 汇报「能用多少」一律取后者。

活跃库 286 口径的机器可读复算见 `active-library-scope.json`：

```
activeExecutable = 112
activeRemaining  = 174 = 18 (机器 QA 未过) + 8 (差适配) + 148 (依赖缺失)
```

## 7. Skill 运行时已装好（关键）

`sync_skill_runtime.py` 把已验证运行时增量安装到本 Skill 自带的 `visual-studio/`，
**保留 `ProjectVideo` / `buildTimeline` 多镜头引擎，不做整体覆盖**：

- 新增：`external/fredtalk/adapted`（965 文件）、registry 数据与 `generated.tsx`、
  `placeholders.tsx`、`public/fredtalk`（15）、`tools/fredtalk`（25）、
  `full-library`（6）、`external/catalog.json`。
- 合并：`root.tsx` 注册 `Placeholders` / `REF-FT-T03E` / `fredBatch.map`；
  `render.mjs` 增加 `renderFredReference` / `renderFredComponent`；
  `server.mjs` 的 `/api/render-reference` 增加 `fred-step-chain` / `fred-batch` 分支。
- Skill 原本无 `node_modules`，以目录联接到同版本依赖；合并前对 4 个被改文件做备份
  （`review/LWFT-FULL-84/skill-backup/`）。
- 输出：`{"skillFredtalkExecutable": 113, "registryEntries": 133}`。
  `FT-T03e-414` 为 `fred-step-chain`，走独立注册路径，**不是缺失**。

## 8. 真实回归验证（全套通过）

| 验证 | 结果 |
| --- | --- |
| `npx tsc --noEmit`（Skill 目录） | `TSC_EXIT=0` |
| `npm test`（vite build + test:unit + test:api） | **退出码 0** |
| `npm run test:unit` | **29 / 29 pass** |
| `npm run test:api` | **8 / 8 pass** |
| `npm run test:accepted` | 3 / 3 pass |
| `npm run test:visual-assets` | 4 / 4 pass |
| `python -m unittest discover -s tests`（Skill 根） | **26 / 26 OK** |
| `node scripts/icon-assets.mjs --check` | `ok=true`，24 图标，0 errors |
| `lint:project`（3 个示例工程） | 3 / 3 lint 通过 |
| `verify_skill_runtime.py` 用 Skill 自己的 `server.mjs`（端口 4201）渲染 `FT-T09w-292` | **pass**（最终复跑） |
| 产物 | `skill-runtime-smoke.mp4`，410735 bytes，sha256 `492f60f4…`，180 帧 / 1280×720，OpenCV probe |
| 主仓库 `main` | 已合入验收成果；6 项未跟踪改动与用户私有素材先备份后完整保留 |

**回归中修复的三项真实问题（均为陈旧断言 / 环境产物，非伪造通过）**：

1. `tests/unit/schema.test.mjs` 与 `tests/api/api.test.mjs` 原本断言
   「FredTalk 引用一律 `!executable`」「production candidates 只有 6 条且不含 FredTalk」，
   这是接入前的历史基线。已改为**更强的不变量**：断言 113 条可执行 FredTalk 全部具备
   `installStatus=source-adapted-verified`、`renderStatus=passed` 与受支持 adapter，
   且未晋级条目不得伪装 `source-adapted-verified`；`MP-002` 等元数据条目仍被排除。
2. `tests/unit/visual-asset-pack.test.mjs` 的 24 图标固定哈希校验在 `main` 与 Skill 中
   **均失败**（既有问题）：SVG 被 Windows 写成 CRLF，而 `gitBlob` 按 LF 固定。
   已把 24 个 SVG 恢复为与上游 pinned blob 完全一致的 LF 字节（24/24 哈希匹配），
   `--check` 现为 `ok=true`。这不是改测试放水，而是恢复被复制过程破坏的原始字节。
3. 本机无 `pytest`，Python 测试改用 `python -m unittest discover` 运行，26/26 通过。

证据副本：`skill-verification.json`。这证明 112 条已可在主仓库与本地 Skill 工作台真实调用，
不再依赖独立工作树。

## 9. 诚实保留的边界

- **18 条**机器 QA 未过：未晋级，须逐条机器复核。
- **8 条** `candidate-not-adapted`：只完成可行性核查，未实质补齐；需通用
  `project-expand` / `standalone` 适配器（缺 `kit/theme.ts` 等、`entryExport` 元数据、
  共享 entry 解析、`registerRoot` 处理）。
- **148 条** `blocked-dependency`：缺项目内相对模块与 JSON 配置，需通用适配器还原依赖图；
  tag tree 已取到 7047 文件，但路径契约不匹配，**不等于可跑**。
- 主仓库 `main` **已合入本轮验收成果**；未晋级条目仍按原边界保留，不因合并而变成可执行。
- `tsc` 通过 + 单条 smoke test **不等于**全部视觉与整片验收通过。

## 10. 证据索引（本 Skill 内 `references/fredtalk-full-library-data/`）

| 文件 | 内容 |
| --- | --- |
| `STATUS.md` / `status.json` / `status.csv` | 432 条逐条最终状态 |
| `active-library-scope.json` | 286 活跃库口径复算与 ID 清单 |
| `LWFT-FULL-84-reviews.json` | 84 条审片结论（口述批量，含 18 条 hold） |
| `LWFT-FULL-84-workbench-export.json` | 84/84 真实工作台导出证据 |
| `skill-verification.json` | Skill 运行时 smoke test 结论 |
| `blocked-dependency-breakdown.*` | 阻塞依赖逐类清单 |
| `LWFT-batch-22-acceptance.md` / `LWFT-FULL-64-acceptance.md` | 历史批次验收 |

开发工作树中的原始证据（84 个真实 MP4 等）位于
`D:/Codex工作目录/lw-fredtalk-full-LW-FT-FULL-001/review/LWFT-FULL-84/` 与
`visual-studio/external/fredtalk/batch/runs/LWFT-FULL-84/`。
