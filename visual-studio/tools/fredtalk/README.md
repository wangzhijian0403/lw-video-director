# FredTalk Batch Adapter

可重复运行的 FredTalk → LW References 适配流水线。基线是 PR #6 的 `feature/resource-adapters-poc`（T03e 已验证）；本目录新增全库盘点、策略化适配、批量渲染、QA 与报告。

## 取源通道

1. 目录条目带 `sha256`：`https://www.fred-fu.com/api/visual-library/assets/<sha>.txt`，失败时回退 `https://www.fred-fu.com/visual-library-app/objects/<sha>.txt`。逐字节校验 SHA-256，缓存到 `external/fredtalk/.cache/sources/<LW-ID>/`（不入库）。
2. 目录条目没有 `sha256`：上游公开 tag `v2.5.0`（`a60c45e8…`）的 `components/projects/**` 源码树，按 `implementation.projects[0]` + 文件 label 匹配。
3. 不绕过登录/付费/访问控制；不使用网站预览 MP4 作为可编辑组件证据。

## 命令

```bash
python3 tools/fredtalk/inventory.py       # 432 条盘点 -> external/fredtalk/batch/inventory.{json,md,csv}
python3 tools/fredtalk/adapt.py           # 12 条代表组件适配 -> external/fredtalk/adapted/
LW_BROWSER=/usr/local/bin/chromium \
  node tools/fredtalk/render_batch.mjs    # 真实 Remotion MP4 + 审片帧，支持断点/跳过/--force
python3 tools/fredtalk/qa_media.py        # cv2 解码 QA -> evidence/<id>/qa.json
python3 tools/fredtalk/report.py          # status.json + round-1-acceptance.md
python3 tools/fredtalk/update_catalog.py  # 仅把渲染+QA 通过的条目写回 external/catalog.json
```

## 适配策略

- `kit-overlay`：组件文件原样复制；仅替换 `kit/theme.ts`、`kit/ui.tsx` 的宿主层——字体换 OFL SmileySans、去 Fred 角标、静音 SFX、Frame 使用 host 背景、`useT` 乘 host speed、追加 `configureTheme`。
- `project-expand`：公开目录只登记部分文件、但组件依赖同项目共享模块时，整项目 `src/` 从公开 tag 展开，再宿主化 `shared.tsx` 并把 `assets.json` 重写到 `fredtalk/media/*`（LW 自有占位素材）。
- `sourcePatches`：声明式源内补丁，仅用于字体度量差异（例如数字滚轮单元格宽度），逐条写入 `provenance.json`。

每个适配目录包含：上游副本 `src/`、`adapter.tsx`（统一入参 `{props, accent, background, speed}`）、`provenance.json`（逐文件 URL/SHA、宿主改动、许可）、`props.json`（默认/示例参数）。

## 证据

`external/fredtalk/batch/evidence/<LW-ID>/`：`render.mp4`、5 张审片帧、`qa.json`。`status.json` 记录 adapted/render/qa/visual 状态，用于断点恢复；失败写具体错误而非“运行失败”。

## 边界

- 上游媒体（截图、录屏、图片、Logo、音效）不随 MIT 授权，仓库不收录；样片使用 LW 自有占位素材。
- ROI、点击坐标等参数与画面强绑定，只提供参数入口，不承诺跨素材通用。
- 所有适配组件保留 FredTalk 来源与许可，不标为 LW 原创。
