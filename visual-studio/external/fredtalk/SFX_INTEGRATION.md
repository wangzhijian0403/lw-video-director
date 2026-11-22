# 动画关键事件与音效系统对接方案

更新时间：2026-11-22。范围：batch-20 的 20 个组件，以及后续 432 条自动批次。

## 1. 现状

- 组件源码通过 `<Sfx name="..." at={...} volume={...} duration={...} />` 声明音效点，`kit/ui.tsx` 中的 `Sfx` 当前直接 `return null`；适配版 MP4 全部静音。
- 这保留了上游的**事件语义**，但还没有音频资产、混音和宿主调度。
- `batch-20/sfx-cues.json` 已静态扫描出 20 个组件的 59 个 cue，作为对接基线；动态 `at` 表达式保留原文，运行时再求值。

## 2. 事件 schema

```json
{
  "schema": "lw.fredtalk.sfx.v1",
  "componentId": "FT-T04e-365",
  "cue": "ding",
  "eventKey": "result-reveal",
  "at": {"expr": "resultAt", "seconds": 3.6},
  "durationMs": 180,
  "volume": 0.45,
  "channel": "sfx",
  "anchor": "visual-event",
  "priority": 2,
  "required": false,
  "speedAdjustedSeconds": 3.6
}
```

- `at` 是组件本地秒（未除以宿主 `speed`）；落时间轴时统一 `t_out = at / speed`。
- `anchor` 用于人工校对：`visual-event`（元素落定/转场/数字停住）、`section`（段落起止）、`emphasis`（关键词强调）。
- `priority`：1=必须（转场/落定），2=默认，3=装饰；同帧冲突时保留高优先级。
- `channel`：`sfx` / `music` / `voice`；口播存在时 `music` 在说话段退后约 12dB。

## 3. 对接方式（推荐，按工序）

1. **事件声明不写在适配层之外**：保留组件里的 `<Sfx>`，由 `kit/ui.tsx` 的 `Sfx` 改为向宿主 `SfxBus` 注册 `{name, at, volume, duration}`；组件源码不因音效改动。
2. **运行时求值**：`Sfx` 接收已解析的 `at` 秒；动态表达式（`openAt`、`barAt(0)`、`at[i]`）在组件渲染函数内已有定义，建议在每个组件把关键时间点提取为 `const` 并传入 `Sfx`，避免静态扫描猜测。
3. **清单落盘**：`render_batch.mjs` 渲染时同时输出 `<ID>.sfx.json`，字段按第 2 节 schema；batch 级汇总为 `sfx-manifest.json`。
4. **音频资产生命周期**：先建立 `public/fredtalk/sfx/` 目录和 `name -> file` 映射；没有资产的 cue 记为 `missing-asset`，不阻塞画面渲染。
5. **离线混音**：画面 MP4 渲染完成后，用 ffmpeg 按 manifest 逐条 `adelay` + `amix`；口播轨优先级最高，音乐在语音段自动 duck。
6. **验收**：cue 数量与 manifest 一致；无负时间/超时长 cue；瞬时音不抢字头；同时发声不超过 2 条；渲染后逐段人耳复检。

## 4. batch-20 cue 统计

| LW ID | cue 数 | cue 名称 | 动态时间点示例 |
|---|---|---|---|
| FT-T01b-431 | 2 | pop, slide | `openAt` |
| FT-T01c-432 | 2 | ding, pop | `at[i]`, `lockAt` |
| FT-T01d-451 | 3 | ding, scroll, woosh | `barAt(0)` |
| FT-T01e-410 | 4 | pop, slide, typing | `a0`, `type1`, `a1` |
| FT-T01f-409 | 2 | pop, slide | `a0`, `a1` |
| FT-T01g-411 | 3 | typing, whoosh-short | `a0`, `titleAt`, `starts[i]` |
| FT-T01h-396 | 3 | ding, pop, whoosh-short | `stampAt - 0.05`, `extAt + 0.5` |
| FT-T02a-449 | 3 | pop, slide, whoosh-short | `startAt(i)`, `focusAt` |
| FT-T02e-412 | 2 | gather, pop | `s`, `mergeAt` |
| FT-T02f-413 | 2 | pop, whoosh-short | `a` |
| FT-T02g-360 | 2 | pop, woosh | `laneAt(i)`, `focusAt` |
| FT-T02h-371 | 2 | pop, whoosh-short | `flipAt(i) + FLIP * 0.5` |
| FT-T03c-416 | 3 | ding, pop, woosh | `appear[0]`, `loopAt`, `resultAt + 0.1` |
| FT-T03d-435 | 3 | ding, pop, slide | `at(0)`, `at(1)`, `at(last) + dur * 0.6` |
| FT-T04a-452 | 4 | ding, gather, pop, slide | `pairAt(i)`, `mergeAt`, `mergeAt + 0.75` |
| FT-T04b-434 | 4 | ding, pop, slide | `splitAt`, `toolAt(0)`, `toolAt(n - 1) + 0.35` |
| FT-T04d-415 | 3 | pop, slide, woosh | `appear[0] - 0.3`, `focusAt` |
| FT-T04e-365 | 4 | ding, pop, slide, whoosh-short | `a + 0.1`, `at[0]`, `resAt` |
| FT-T04f-369 | 4 | click, pop, woosh | `turnAt`, `a` |
| FT-T04g-393 | 4 | ding, pop, slide, woosh | `appear[0] - 0.3`, `T`, `T + 0.6` |

## 5. 与现有系统的边界

- 本方案不改变 `Sfx` 的画面语义，也不在未授权情况下引入上游音频。
- 音效资产、版权和商用授权单独管理；T04e 截图与音效无关。
- `speed` 只影响输出时间，不改变 cue 的相对事件顺序；变速后必须重新生成 manifest 并复检。
- 机器 QA 只检查时长/帧数；音效是否抢字、音乐是否压住人声必须人工听审。
