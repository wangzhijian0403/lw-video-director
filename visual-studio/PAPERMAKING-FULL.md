# 造纸术 · 完整成片交付（11 镜 / 83.7 秒 / 人声优先）

本文件对应**完整成片**，替换此前 27.267 秒样片的交付口径。上一轮样片说明见 git 历史（commit `7a548b7` 之前）。

## 0. 返修版 v2（第二轮审核后，2026-11-22）

| 项 | 首版 | 返修版 |
|---|---|---|
| 文件 | `exports/papermaking-full.mp4` | 同名覆盖；首版留档 `exports/papermaking-full-v1.mp4` |
| 体积 / 码率 | 19,745,121 B / 1.89 Mbps | 21,539,776 B / 2.06 Mbps（crf 18→16） |
| sha256 | `D579F30C…7DFA` | `AEED21C7B5D5AB573BE511D3A6AC9331A5EA98B349D5DCF5C09DFCAF023B2417` |
| 响度 | I −15.9 LUFS / TP −6.5 dBFS | 同左（I −15.9 / TP −6.5 / LRA 1.6） |
| 渲染耗时 | 671 s | 510.1 s（`--concurrency 6`） |

改动只发生在四个 P0 段与背景层，时间轴总长、配音、口播文本均未改：

- 0–4s 开场：`FiberFormation` 新增 `hook` 层（Codex vs Claude 文字钩子 + 「我不信」印章），标题揭示后移。
- 40.5–51.6s 蔡伦段：`Timeline.tsx` 重写为「132px 大年份 105 + 三张史料卡（不是发明/定流程/变便宜）+ 结论句」。
- 60.7–71.9s 传播段：同文件 spread 分支重写为「经纬弧 + 折线路线 + 站点卡 + 行走点 + 审慎注」。
- 71.9–83.5s 结尾：新增 `RecapEnding.tsx`（ENDING-001），泡捣抄晒四格复活 → 收拢 → 合成整纸 → 标题 + CTA。
- 背景层：`Scene` 去掉自带底色、分镜内半透明纸改为空操作、页面底压到 `#DFDAC9`、远山层 0.30、网格 3%，修掉「刺眼 + 竖直接缝」。

逐事件音效时间码、返修前后对比、验收矩阵与未解决项见 `exports/papermaking-full-revision.md`。

## 1. 结论先行

- 有 1 条 **83.700 秒、1920×1080、30fps、从头可播到尾** 的真实成片：`exports/papermaking-full.mp4`。
- 时长由**口播母版实测 83.664 秒**决定，不是按 27 秒卡出来的；11 镜的切换点全部落在母版真实语音段的段落边界上。
- 声音按「人声优先」重做：音效整体先 −12dB 起调 → 实测回调到「最响一击 = 人声 −11dB」→ 持续音/音乐在人声期再退 → 20ms 块级限幅兜底（实测未触发）。
- 画面模板同步改版：字幕条由 22.6% 收薄到 16.8%、字号 45→49px、厚蓝底条改为主题色渐变遮罩；开场 3.5 秒内出现纸张主体与标题；各镜 10–14px 小注统一放大到 14–18px。
- 保留并继续使用：PAPER / MATERIAL / SOAK / POUND / SCOOP 五镜的既有构图与动作，只做模板与字号层面的调整；新增 PROCESS / DRY / TIMELINE / BAMBOO 四镜。
- **未解决项在第 8 节单列**，导出成功不等于质量通过。

## 2. 成片参数

| 项 | 值 |
|---|---|
| 文件 | `exports/papermaking-full.mp4` |
| 时长 / 帧数 | 83.700 s / 2508 帧 @30fps |
| 画幅 / 编码 | 1920×1080 / H.264 + AAC 48kHz 立体声 |
| 体积 / 码率 | 19,745,121 B（≈18.8 MB）/ 1.89 Mbps |
| sha256 | `D579F30C30E75120CA44216EF9ACD6457A75D489A46E91B78F64775B5A917DFA` |
| 响度 | I −15.9 LUFS / TP −6.5 dBFS |
| 渲染命令 | `node scripts/direct.mjs projects/papermaking-full/project.json --out exports/papermaking-full.mp4 --concurrency 6` |
| 渲染耗时 | 671 s（i5-9300H / 16G / GTX1650，Chrome 软件合成） |

> 必须带 `--concurrency 6`。`direct.mjs` 的默认并发是 1，84 秒成片会掉到 0.4 fps（约 90 分钟）。

## 3. 11 镜结构与时长

| # | 场景 | 组件 | 口播段 | 时长 | 转场进 |
|---|---|---|---|---|---|
| s01 | 开场（纸张主体 + 标题） | PAPER-001 | hook 0–10.036 | 10.05 | cut |
| s02 | 四道工序总览 | PROCESS-001 | intro 10.036–14.472 | 4.89 | wipe |
| s03 | 四种原料 | MATERIAL-001 | material 14.472–19.697 | 5.33 | wipe |
| s04 | 泡 | SOAK-001 | soak 19.697–24.476 | 4.90 | fade |
| s05 | 捣 | POUND-001 | pound 24.476–29.881 | 5.53 | slide |
| s06 | 抄 | SCOOP-001 | scoop 29.881–37.421 | 7.65 | wipe |
| s07 | 晒 | DRY-001 | dry 37.421–40.525 | 3.20 | cut |
| s08 | 蔡伦与 105 年 | TIMELINE-001(origin) | cailun 40.525–51.616 | 11.24 | fade |
| s09 | 竹简退场 | BAMBOO-001 | bamboo 51.616–60.729 | 9.25 | wipe |
| s10 | 纸往西传 | TIMELINE-001(spread) | spread 60.729–71.883 | 11.27 | zoom |
| s11 | 收尾 + 评论钩子（返修版换 ENDING-001：四格回顾→合成整纸→标题+Cta） | ENDING-001 | ending 71.883–83.48 | 11.80 | fade |

- 每镜 `duration` = 下一镜段落起点 + 转场重叠 − 本镜起点；最后一镜 = 段落 end + 0.18。
- 转场混用 cut / wipe 0.55–0.65 / fade 0.45–0.5 / slide 0.55 / zoom 0.55，没有统一套同一种。
- 段落边界由 `scripts/build-vo-plan.py` 从母版语音段推算（20ms RMS + 字数权重），见 §5。

## 4. 模板改动（会影响全片的部分）

| 项 | 改前 | 改后 |
|---|---|---|
| 字幕条高 | ≈244px（22.6%） | ≈181px（16.8%） |
| 字幕字号 | 45px | 49px（画面高 4.55%） |
| 字幕底 | 实心厚蓝条 | 主题色渐变遮罩 `${tint}00→C4→EC→F7` + 纸白双光晕 |
| 字幕行 | 渲染时二次断行 | 生成阶段预排 `lines`（token + 双字词保护） |
| contentScale | 0.774 | 0.83（主画面更大） |
| 场景小注 | 10–14px | 14–18px |
| 开场 | 6–7s 才出标题 | 纸张主体满幅 + 3.5s 内标题立住 |

主题未变：`mist-blue-paper`（青灰蓝 `#193447` / `#537B87`、宣纸白 `#F8F7F2`、铜色 `#B78456`）。

## 5. 时间轴怎么来的（可复跑）

1. 母版 `assets/vo-full-source.mp3`（83.664 s）→ `build/audio/master.wav`（48k 单声道）。
2. `scripts/align-master-vo.py`：−34dB/0.12s 检出 55 段静音；与 5 条逐镜 TTS 做 FFT 互相关，ncc 仅 0.061–0.126 且位置自相矛盾 → **母版与逐镜 TTS 不同源，不能按互相关切段**。
3. 改用 `scripts/build-vo-plan.py`：20ms RMS 判语音/静音 → 中文 1 / 英文数字 1.7 的字数权重铺到真实语音段 → 段落边界 = 累计字数对应时间。
4. 段内按标点切句、太短合并、>24 字强切、每行 ≤12 字两行排版 → `build/audio/vo-plan.json` + `subtitles-full.srt`（30 条）。
5. `scripts/gen-full-project.py` 读 vo-plan 生成 11 镜工程（场景表 / 音效对位表 / 桥接），再跑 `mix-papermaking.py`。

## 6. 声音：人声优先

| 轨 | 处理 |
|---|---|
| 人声 | 母版居中立体声，不加处理；先单独导出 `exports/papermaking-full-voice.wav` 复检 |
| 音效 | 43 个事件按绝对时间落位；整体 −12dB 起点 → 实测回调（最响一击 = 人声 −11dB）|
| 持续音 | 水床 / 气泡 / 纤维沉降，人声期额外 −8dB |
| 瞬态 | −4dB；捣击对杵落帧，入水/提帘/滴水分开给 |
| 音乐 | 程序合成环境底（正弦和弦 + 低通噪声，无旋律），人声期 −9dB，头尾 1.5s 淡入淡出 |
| 限幅 | 20ms 块内音效 RMS ≤ 人声 −6dB；实测 `limiterBlocks: 0` |

混音报告：`build/audio/mix-report.json`（`voMedianActiveRmsDb −11.69` / `sfxMaxBlockRmsDb −22.69` / `musicMaxBlockRmsDb −35.69`）。
10 秒对照（24.5–34.5 s，捣+抄）：`exports/ab-10s-voice-only.wav` / `exports/ab-10s-mix.wav`。

## 7. 交付物清单

| 文件 | 说明 |
|---|---|
| `exports/papermaking-full.mp4` | 完整成片 |
| `exports/papermaking-full-voice.wav` | 人声轨 |
| `exports/papermaking-full-sfx.wav` | 音效轨 |
| `exports/papermaking-full-music.wav` | 音乐轨 |
| `exports/papermaking-full-mix.wav` | 混音轨（未归一版本）|
| `exports/ab-10s-voice-only.wav` / `ab-10s-mix.wav` | 10 秒对照 |
| `exports/papermaking-full.srt` | 字幕（30 条）|
| `exports/papermaking-full-project.json` | 可编辑工程（Remotion 直接可跑）|
| `exports/papermaking-full-sources.md` | 素材来源清单 |
| `exports/papermaking-full-qa.md` | 自检与返修记录 |

## 8. 未解决 / 未验证

1. SCOOP 镜竹帘离水瞬间偏「悬空贴片」，帘—水接触湿痕未补。
2. POUND 镜杵底平切、抬杵帧与臼口间距偏大，接触感不足。
3. DRY 镜湿→干主要靠透明度与帘纹，纸面深浅变化偏弱，墙面下半部留白多。
4. MATERIAL 镜入场 1s 内只有树皮一张，其余三张还在入场。
5. 主观听感未经人耳确认（客观数据达标，需用户耳机复核）。
6. 5 条字幕单行 13–15 字（含英文），lint 仍 warn（未溢出）。
7. 音乐是否保留由用户决定；不要音乐就不出该轨。

## 9. 验证记录

- `npx tsc --noEmit` 0 错。
- lint：11 场景 / 83.6s / 字幕 30 条 / 音效 43 个（5 条超 12 字 warn）。
- ffprobe：1920×1080 / 30fps / h264 + aac 48k 立体声 / 83.700 s。
- ebur128：I −15.9 LUFS / TP −6.5 dBFS。
- 抽帧复核 12 点（1/9/15/22/28/34/40/48/55/62/70/80 s）→ 修复清单见 `exports/papermaking-full-qa.md` §4。
