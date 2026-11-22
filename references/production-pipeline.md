# 成片管线（project.json → 1080p）

把"口播音频 + 分镜文本"变成带画面、转场、音轨、字幕的成片。范围只有画面 / 音轨 / 字幕；BGM 之后自己加，不做平台发布。

## 命令

| 目的 | 命令 | 产物 |
|---|---|---|
| 生成音效库（首次或删库后） | `npm run sfx` | `public/sfx/*.wav` + `manifest.json` |
| 校验工程 | `npm run lint:project -- projects/demo/project.json` | 终端报告，错误时非 0 退出 |
| 出成片 | `npm run direct -- projects/demo/project.json --out exports/x.mp4` | 1080p H.264 + AAC |
| 只出一帧检查版式 | `npm run direct -- projects/demo/project.json --still 3.2` | `*-3.2s.png` |
| 半分辨率快预览 | `npm run direct -- <project.json> --draft` | 960×540 成片 |
| 逐镜合成口播（本地 7788） | `node visual-studio/scripts/narration_tts.mjs <project.json>` | `assets/vo-<镜>.mp3` + 回填实测时长 |
| 关掉响度规范化 | `--no-loudnorm` | 保留原始音量 |

出片前会依次做：ffprobe 实测分镜配音 → 素材复制进 `public/projects/<slug>/` → SRT 解析 → lint → 渲染 → 落盘 `build/<slug>/project.resolved.json`、`timeline.json`、`subtitles.srt`。渲染后默认用 ffmpeg 把音频规范到 -16 LUFS（画面直接拷贝，不重编码）。

## 两种输入格式

- `project.json`：顺序式。场景给 `duration` 或靠配音实测时长；转场重叠自动算。
- `episode.json`：帧精确式。场景带 `startFrame`/`durationFrames`/`componentId`/`props` 时按给定帧排布，不做重叠，与 `episode_preflight.py` 的契约一致。

关键差异：有配音的分镜，画面时长 = 配音实测 + 0.2s 余量 + 转场前导，配音从转场结束处起，避免两句叠着说。


## project.json

最小可跑：

```json
{
  "meta": {"title":"示例","width":1920,"height":1080,"fps":30,"theme":"future"},
  "audio": {"vo":"assets/vo.mp3"},
  "timing": "vo",
  "scenes": [
    {"component":"TYPE-001","text":"口播第一句","transition":{"type":"fade","duration":0.3}},
    {"component":"INFO-001","text":"第二句"}
  ]
}
```

字段要点：

| 字段 | 说明 |
|---|---|
| `meta.theme` | `swiss` / `future` / `archive`，决定配色与字体 |
| `audio.vo` | 口播；相对 `project.json` 的路径或 URL。时长由 CLI 实测回填，别手写 |
| `audio.bgm` | 数组或单条，`volume`/`fadeIn`/`fadeOut`（秒），口播期自动压到 35% |
| `sfx` | `[{"name":"whoosh_short","at":3.2}]`，`name` 必须是 `public/sfx` 里的音效 |
| `subtitles.srt` | SRT 路径；与 `cues` 二选一。无 SRT 时用 `scene.text` 生成 |
| `subtitles.maxCharsPerLine` | 默认 12（按中文全角算，ASCII 记 0.56） |
| `scenes[].duration` | 秒。填了就用；不填且 `timing:"vo"` 按字数比例分口播时长；再兜底组件参数时长 |
| `scenes[].transition` | `cut` / `fade` / `slide` / `zoom` / `wipe` + 秒；重叠上限＝相邻场景各自一半 |

参数只写要改的键，其余取 `src/catalog/manifest.json` 默认值。

## 转场与音效对位

- 转场重叠是"两段同时在画"的时间，`fade` 0.3–0.4s、`wipe` 0.35–0.45s 比较稳；超过 0.6s 会显得拖。
- 音效点位按画面事件算，不按时间硬塞：切点前 2 帧给 `whoosh_short`，卡片弹出给 `pop`，章节卡给 `whoosh_long` + `impact_low`，金句给 `shimmer`。
- `riser` 结束点要对齐揭示帧：`at` 填"揭示时间 − 2s"。

## 字幕规则

- 一条一行到两行，超过 12 字自动断行；断点优先标点。
- 底部安全区默认 7.5% 画面高，自带压底渐变保证对比度。
- 字幕条互相重叠会被自动裁短 0.05s，不手动拼文本轨。

## 验收

1. `ffprobe` 查成片：分辨率、帧率、时长、是否有音轨。
2. 抽 3 帧看：字幕不压关键信息、不越安全区、主体不出框。
3. 音画偏差：口播起点与首帧字幕差 ≤1 帧。
4. 渲染失败或版本不兼容：回滚 `build/<slug>/`，改交"素材包 + SRT + 分镜表 + 操作步骤"降级方案，不反复试写。
