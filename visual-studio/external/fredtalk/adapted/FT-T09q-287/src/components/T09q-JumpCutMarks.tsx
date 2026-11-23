// FredTalk 2.5 distribution: fred-recording-8-20261018
// T09q-JumpCutMarks：长录屏跳读：时间条标出几处，播放头逐处跳过去
// 观众要看懂的变化：一段很长的真实录屏 → 下沿时间条上落出几个关键时刻，播放头按口播逐个跳过去，每处窗内推近读清再跳下一处。
// 关系：同一段录屏、同一条时间条。时间条代表“原片有多长”，标记是“只看这几处”，播放头是“现在在哪”。
// 和 T09n 区分：T09n 只有一跳、看不到过程；和 CAM01 区分：CAM01 是同一时刻多目标换焦。本条是多处时刻的跳读。
// 素材：public/media 下的 clip 是把原片几处关键时刻截出来拼成的短片（≤6 秒），marks[i].clip 是它在 clip 里的起点，
// marks[i].src 是它在原片里的秒数（只用来画时间条位置）。
import React from 'react';
import { Freeze, OffthreadVideo, staticFile, useVideoConfig } from 'remotion';
import { S, clamp, cueAt, mix, p, q, quintic, settle, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';

type Rect = { x: number; y: number; w: number; h: number };
export type JumpMark = {
  src: number;       // 原片里的秒数（决定标记在时间条上的位置）
  clip: number;      // 拼接短片里这一处的起点（秒）
  label: string;     // 这一处讲什么（只显示当前那一处）
  focus?: Rect;      // 源视频像素里要推近读清的区域；不给就不推近
  zoom?: number;     // 推近倍数上限
};

export type JumpCutMarksProps = HandoffProps & {
  video: string;                       // public/ 下的拼接短片
  videoSize: { w: number; h: number }; // 源视频像素（竖版也可以）
  clipDuration: number;                // 拼接短片总长（秒）
  sourceDuration: number;              // 原片总长（秒），时间条按它画
  marks: JumpMark[];
  sourceLabel?: string;                // 左下来源小字，可留空
  brand?: boolean;
  cues?: number[];                     // [i]=跳到第 i+1 处的时刻（秒）
};

// 默认：120 期 Gemini 实测的 3D 飞行游戏录屏，44 秒原片里只看四处
export const jumpCutMarksDefaults: JumpCutMarksProps = {
  video: 'fredtalk/media/lw-recording.mp4',
  videoSize: { w: 1920, h: 1080 },
  clipDuration: 6.0,
  sourceDuration: 44,
  marks: [
    { src: 6.0, clip: 0, label: '开场先给玩法说明', focus: { x: 560, y: 260, w: 820, h: 550 }, zoom: 1.6 },
    { src: 15.0, clip: 1.4, label: '路上让你选岔路', focus: { x: 470, y: 180, w: 1000, h: 130 }, zoom: 2.0 },
    { src: 22.9, clip: 3.0, label: '按 B 召唤主炮', focus: { x: 420, y: 190, w: 1080, h: 560 }, zoom: 1.5 },
    { src: 27.9, clip: 4.5, label: '打得好还会升军衔', focus: { x: 600, y: 190, w: 760, h: 110 }, zoom: 2.0 },
  ],
  sourceLabel: 'Gemini 生成的小游戏 · 实测录屏',
  brand: false,
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function JumpCutMarks(props: Partial<JumpCutMarksProps>) {
  const c = { ...jumpCutMarksDefaults, ...props };
  const t = useT();
  const { fps } = useVideoConfig();
  const marks = c.marks.length ? c.marks : jumpCutMarksDefaults.marks;
  const n = marks.length;

  // —— 版式：视频窗按源比例放进上部可用区，时间条贴在窗下 ——
  const AREA = { x: 100, y: 24, w: 1720, h: 836 };
  // 竖版源：窗口用横向取景框（全貌时整屏居中，推近后铺满取景框），不让主体缩成一条
  const portrait = c.videoSize.h > c.videoSize.w;
  const vk = Math.min(AREA.w / c.videoSize.w, AREA.h / c.videoSize.h);
  const VW = c.videoSize.w * vk, VH = c.videoSize.h * vk;
  const W = portrait ? Math.min(AREA.w, AREA.h * 1.5) : VW, H = VH;
  const VX = (W - VW) / 2;
  const WIN = { x: 960 - W / 2, y: AREA.y + (AREA.h - H) / 2 };
  const TRACK = { x: 180, w: 1560, y: 900 };
  const posX = (s: number) => TRACK.x + TRACK.w * clamp(s / Math.max(0.01, c.sourceDuration));

  // —— 时间：第 0 处直接开播；之后每处按 cue 跳 ——
  const arrive = marks.map((_, i) => (i === 0 ? 0 : cueAt(c.cues, i - 1, 1.6 + (i - 1) * 1.55)));
  let cur = 0;
  for (let i = 0; i < n; i++) if (t >= arrive[i]) cur = i;
  const m = marks[cur];
  const segLen = (i: number) => (i + 1 < n ? marks[i + 1].clip : c.clipDuration) - marks[i].clip;
  const clipT = Math.min(c.clipDuration - 0.12, m.clip + clamp(t - arrive[cur], 0, segLen(cur) - 1.5 / fps));   // 不取最后一帧（解码不稳）

  // 相机：到达后推近（quintic 0.55s），停稳阅读；下一跳直接切回全貌
  const pushAt = arrive[cur] + (cur === 0 ? 0.75 : 0.12);
  const push = m.focus ? quintic(t, pushAt, pushAt + 0.55) : 0;
  let z = 1, fx = W / 2, fy = H / 2;
  if (m.focus) {
    const f = { x: VX + m.focus.x * vk, y: m.focus.y * vk, w: m.focus.w * vk, h: m.focus.h * vk };
    const zt = Math.max(1, Math.min(m.zoom ?? 2.2, (W * 0.9) / f.w, (H * 0.86) / f.h));
    const cx = clamp(f.x + f.w / 2, W / (2 * zt), W - W / (2 * zt));
    const cy = clamp(f.y + f.h / 2, H / (2 * zt), H - H / (2 * zt));
    z = mix(1, zt, push); fx = mix(W / 2, cx, push); fy = mix(H / 2, cy, push);
  }
  // 跳切那一下：新画面从右侧轻推进来（同一窗，内容换了），0.28s
  const kick = cur === 0 ? 1 : q(t, arrive[cur], arrive[cur] + 0.28);
  const enter = p(t, 0, 0.45);

  // 播放头：跳的时候沿时间条快走（0.32s），在每处随播放前进
  const headSrc = (i: number) => marks[i].src + clamp(t - arrive[i], 0, segLen(i));
  const prevX = cur === 0 ? posX(marks[0].src) : posX(headSrc(cur - 1));
  const headX = mix(prevX, posX(headSrc(cur)), cur === 0 ? 1 : q(t, arrive[cur], arrive[cur] + 0.32));

  // 当前那一处的说明：一次只读一句
  const LS = Math.max(36, Math.min(48, 1500 / Math.max(1, textWidth(m.label, 1))));
  const labelIn = p(t, arrive[cur] + (cur === 0 ? 0.6 : 0.18), arrive[cur] + (cur === 0 ? 1.0 : 0.55));
  const labelW = textWidth(m.label, LS);
  const labelX = clamp(posX(m.src) - labelW / 2, TRACK.x, TRACK.x + TRACK.w - labelW);

  return <Frame brand={c.brand}>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: WIN.x, top: WIN.y + (1 - enter) * 30, width: W, height: H, borderRadius: S.radius, overflow: 'hidden',
        background: portrait ? '#f2f2f4' : S.dark, boxShadow: S.shadow, opacity: enter,
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0',
          transform: `translateX(${(1 - kick) * 70}px) translate(${W / 2}px, ${H / 2}px) scale(${z}) translate(${-fx}px, ${-fy}px)`,
        }}>
          <Freeze frame={0}>
            <OffthreadVideo muted src={staticFile(c.video)} startFrom={Math.max(0, Math.round(clipT * fps))} style={{ position: 'absolute', left: VX, top: 0, width: VW, height: VH, display: 'block' }} />
          </Freeze>
        </div>
        {c.sourceLabel && <div style={{ ...textBase(24, 500), position: 'absolute', left: 24, bottom: 18, color: '#fff', opacity: 0.85, textShadow: '0 2px 6px #0008' }}>{c.sourceLabel}</div>}
      </div>

      {/* 时间条：整段原片的长度；已播过的部分为墨色 */}
      <div style={{ position: 'absolute', left: TRACK.x, top: TRACK.y - 5, width: TRACK.w, height: 10, borderRadius: 5, background: S.faint, opacity: 0.45 * enter }} />
      <div style={{ position: 'absolute', left: TRACK.x, top: TRACK.y - 5, width: Math.max(0, headX - TRACK.x), height: 10, borderRadius: 5, background: S.ink, opacity: enter }} />
      {marks.map((mk, i) => {
        const drop = settle(t, 0.3 + i * 0.09, 0.5);
        const lit = i <= cur;
        const x = posX(mk.src);
        return <React.Fragment key={i}>
          <div style={{
            position: 'absolute', left: x - 16, top: TRACK.y - 16 - (1 - drop) * 34, width: 32, height: 32, borderRadius: 16,
            background: lit ? S.ink : '#fff', boxShadow: S.shadow, opacity: drop,
          }} />
          <div style={{ ...textBase(36, 600, S.mono), position: 'absolute', left: x - 70, width: 140, textAlign: 'center', top: TRACK.y + 24, color: i === cur ? S.ink : S.muted, opacity: drop }}>{fmt(mk.src)}</div>
        </React.Fragment>;
      })}
      {/* 播放头 */}
      <div style={{ position: 'absolute', left: headX - 5, top: TRACK.y - 30, width: 10, height: 60, borderRadius: 5, background: S.ink, boxShadow: S.shadow, opacity: enter }} />
      <div style={{ ...textBase(LS, 900), position: 'absolute', left: labelX, top: 984, color: S.ink, clipPath: `inset(0 ${100 * (1 - labelIn)}% 0 0)` }}>{m.label}</div>
    </Handoff>
    {marks.slice(1).map((_, i) => <Sfx key={i} name="whoosh-short" at={arrive[i + 1]} />)}
  </Frame>;
}
