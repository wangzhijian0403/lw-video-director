# 用户卡通角色 · Character Actor（v0.3 全量入库）

## 来源和权利

用户提供的 `G:\智能体卡通人物形象.zip`（内含 `video-style/README.md`，已归档为 `references/character-library-README.md`）包含 5 个自制主题角色（fish、codex、deepseek、doubao、claude）共 20 份原件：5 张透明 PNG、5 张绿幕 JPG、10 条 10 秒 / 24fps 绿幕 MP4。角色是用户自制的工具主题拟人形象，**不是相应品牌官方形象**。

v0.2 时的约定是「私有媒体不进 Git、不上传 GitHub」。**2026-11-24 用户明确要求把这批角色接进主仓库**，因此媒体与抠绿成品已纳入 `visual-studio/public/characters/`，`visual-studio/.gitignore` 已放行该目录。

> 权利提醒：原包说明只允许用于用户自己的视频、无公开再分发许可。2026-11-24 用户已明确知情并确认推送到**公开**的 `origin/main`（`wangzhijian0403/lw-video-director`），这批素材因此对外可见；后续若需撤回，须同时处理 Git 历史，不能只删文件。

## 验收状态（v0.3）

15 条条目（5 角色 × 待机 / 专属动作 / 透明静图）**全部为 `verified-basic`**，不再显示「动作待验收」占位：

| 角色 | 待机 | 专属动作 | 透明静图 |
|---|---|---|---|
| fish（一鱼） | fish-idle.webm | fish-wave.webm（原有） | fish-transparent.png |
| codex | codex-idle.webm | codex-typing.webm（原有） | codex-transparent.png |
| deepseek | deepseek-idle.webm | deepseek-curtsy.webm | deepseek-transparent.png |
| doubao | doubao-idle.webm | doubao-share.webm | doubao-transparent.png |
| claude | claude-idle.webm | claude-dance.webm | claude-transparent.png |

**验收产物**：`exports/character-acceptance.mp4`（1920×1080 / 30fps / 180 帧 / 6s），真 Remotion `Project` Composition，15 个角色槽位分三批各 1.8s 上场。

- 抽帧 f045（专属动作）、f105（待机）、f165（透明静图）目视复核：5 个角色全部出画，无绿幕块、无虚线占位框、无错误提示。
- OpenCV 全片抽帧：纯绿像素占比 **0.00%**（6 个采样点）；角色区帧差：专属动作 **19.81**、待机 **15.15**、透明静图 **0.00**（静图本就不动）。
- 新增 8 条 WebM 由 `scripts/prepare_character_media.py` 用与原有 2 条一致的抠绿链路产出：`trim 0.2–5.0s → chromakey → despill → VP9 yuva420p`。逐条 sidecar JSON 记录源/产物 SHA-256 与滤镜参数；全量清单见 `references/character-library-data/provenance.json`。
- 回归：TypeScript `tsc --noEmit` 通过；前端 34/34、接口 10/10、Python 33/33 全过。

## 安全播放与默认限制

- 每条视频登记 `safeRange {start: 0.2, end: 5.0}` 与 `loopAllowed: false`；WebM 在准备阶段已裁到安全区间。
- 默认**不允许**未经检查的完整 10 秒播放，也**不允许自动循环**；无缝循环属后续单独验收项。
- 时间轴校验角色 ID、动作白名单、起始/时长/坐标；Node 渲染层核对 `public/characters/<file>` 存在性，缺失时显示显式占位，不允许静默黑屏。

## 资产准备（可复现）

源包直接解压到 `visual-studio/public/characters/`（20 个文件，保持原文件名），然后：

```bash
cd visual-studio
python scripts/prepare_character_media.py            # 生成 8 条 WebM + sidecar
python scripts/prepare_character_media.py --force   # 需要重生成时
```

脚本使用 `imageio-ffmpeg` 自带的 ffmpeg（本机 PATH 无 ffmpeg/ffprobe）。原有 `fish-wave.webm` / `codex-typing.webm` 为既往已验收资产，脚本会跳过，不覆盖。

> 坑：这个 ffmpeg 构建的解码器读不出 VP9 alpha，用 ffprobe / 抽 PNG 判断「有没有透明通道」会得到假的失败结论。alpha 是否生效只能靠真实 Chrome / Remotion 渲染验收（本轮已做）。

## 源码接入

- `src/components/characters/characterRegistry.mjs`：5 角色 × 动作白名单、15 条已验收条目、安全区间、循环开关。
- `src/components/characters/UserCharacterActor.tsx`：三态占位（配置错误 / 缺媒体 / 未验收）+ 已验收视频 / 静态图叠加。
- `src/project/character-media.mjs`：Node 层媒体存在性校验。
- `src/project/types.ts`、`src/project/timeline.mjs`：角色槽位类型、解析、校验与坐标夹紧。
- `src/project/ProjectVideo.tsx`：角色 Sequence 叠加层。
- `src/app/ResourceGallery.tsx`：素材库「卡通角色」栏目列出 15 条，视频用 `<video>`、静图用 `<img>` 直接预览，不再显示占位说明。

调用方式（`project.json`）：

```json
{"characters": [
  {"characterId": "fish", "action": "wave", "x": 80, "y": 440,
   "width": 340, "height": 227, "start": 0.2, "duration": 4.6}
]}
```

## 仍待验收（未通过，不得宣称已完成）

- 脚下白色椭圆 / 地面影残留；绿边溢绿；全长 10s 边缘、抖动与素材漂移。
- 自然无缝循环；口型 / 动作同步；预览与导出一致性。
- 骨骼绑定、任意动作生成、实时交互状态机。角色为现成录像动作，不具备上述能力。
