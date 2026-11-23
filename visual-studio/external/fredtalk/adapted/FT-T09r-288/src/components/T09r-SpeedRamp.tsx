// FredTalk 2.5 distribution: fred-recording-8-20261018
// T09r-SpeedRamp：录屏变速：原速 → 快进 → 回原速看结果
// 观众要看懂的变化：真实录屏原速播放 → 角落速度读数从 1× 拉到 8×（画面真的快进、进度条飞走）→ 到结果前回 1×，结果处推近。
// 镜头（返工 2026-10-17，按 NEW-GATE）：整窗全貌 ≤0.8s → 推近到“正在跑的过程区”（对话栏，字 ≥36px），
// 快进时停在这里看消息一路刷过去 → 回 1× 时镜头横移到结果区推近停读。速度读数放大到右下空白处。
// 关系：同一段录屏、同一个窗口，只改“源时钟走多快”。过程一直可见（证明它真的在跑），和 T09n 的“虚化 + 钟面翻过”不同。
// 源时钟按逐帧积分 rate(t) 算出来（确定、可复现），用 Freeze 把视频钉在那一帧。
import React from 'react';
import { Freeze, OffthreadVideo, staticFile, useVideoConfig } from 'remotion';
import { S, clamp, cueAt, mix, p, q, quintic, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Pill, Sfx, textBase, useT } from '../kit/ui';

type Rect = { x: number; y: number; w: number; h: number };
export type SpeedRampProps = HandoffProps & {
  video: string;
  videoSize: { w: number; h: number };
  start: number;          // 从源视频第几秒开始放
  end: number;            // 源视频最多放到第几秒（到了就停在最后一帧）
  rampIn: number;         // 开始提速的时刻（组件内秒）
  rampOut: number;        // 开始减速回 1× 的时刻
  maxRate: number;        // 快进倍数（4–16）
  processFocus?: Rect;    // 快进时镜头停在哪（源像素，过程在这里刷过去）；不给就看全貌
  processZoom?: number;
  resultFocus?: Rect;     // 回到 1× 后推近的结果区域（源像素）
  resultZoom?: number;
  speedLabel: boolean;    // 是否显示角落速度读数
  sourceLabel?: string;
  brand?: boolean;
  cues?: number[];        // [0]=开始提速，[1]=开始减速
};

// 默认：115 期美图设计室“亚马逊英文套图”生成全过程（Fred 自录），20 秒过程压到 6 秒里
export const speedRampDefaults: SpeedRampProps = {
  video: 'fredtalk/media/lw-recording.mp4',
  videoSize: { w: 1920, h: 1080 },
  start: 1.5,
  end: 20.3,
  rampIn: 1.0,
  rampOut: 3.2,
  maxRate: 8,
  processFocus: { x: 0, y: 330, w: 600, h: 460 },
  processZoom: 2.2,
  resultFocus: { x: 590, y: 240, w: 1210, h: 320 },
  resultZoom: 1.5,
  speedLabel: true,
  brand: false,
};

const RAMP = 0.5;
const FULL = { x: 60, y: 33.222106, w: 1800, h: 1013.555787 };

export function SpeedRamp(props: Partial<SpeedRampProps>) {
  const c = { ...speedRampDefaults, ...props };
  const t = useT();
  const { fps } = useVideoConfig();
  const inAt = cueAt(c.cues, 0, c.rampIn);
  const outAt = Math.max(inAt + RAMP, cueAt(c.cues, 1, c.rampOut));
  const maxRate = clamp(c.maxRate, 1, 16);
  const rateAt = (s: number) => 1 + (maxRate - 1) * (q(s, inAt, inAt + RAMP) - q(s, outAt, outAt + RAMP));
  // 源时钟：逐帧积分（帧号驱动，确定）
  const frame = Math.round(t * fps);
  let src = c.start;
  for (let f = 0; f < frame; f++) src += rateAt(f / fps) / fps;
  src = Math.min(src, c.end - 1 / fps);
  const rate = rateAt(t);
  const shown = Math.max(1, Math.round(rate));

  // 窗口：源比例 cover 进主视频窗
  const k = Math.max(FULL.w / c.videoSize.w, FULL.h / c.videoSize.h);
  const vw = c.videoSize.w * k, vh = c.videoSize.h * k;
  const enter = p(t, 0, 0.45);

  // 镜头：全貌 → 过程区（快进时停在这里）→ 回 1× 时横移到结果区推近
  const camFor = (f: Rect | undefined, zMax: number) => {
    if (!f) return { z: 1, x: FULL.w / 2, y: FULL.h / 2 };
    const bx = (FULL.w - vw) / 2 + f.x * k, by = (FULL.h - vh) / 2 + f.y * k, bw = f.w * k, bh = f.h * k;
    const zt = Math.max(1, Math.min(zMax, (FULL.w * 0.95) / bw, (FULL.h * 0.95) / bh));
    return { z: zt, x: clamp(bx + bw / 2, FULL.w / (2 * zt), FULL.w - FULL.w / (2 * zt)), y: clamp(by + bh / 2, FULL.h / (2 * zt), FULL.h - FULL.h / (2 * zt)) };
  };
  const home = { z: 1, x: FULL.w / 2, y: FULL.h / 2 };
  const P = camFor(c.processFocus, c.processZoom ?? 2.2), R = camFor(c.resultFocus, c.resultZoom ?? 1.6);
  const pushA = Math.min(0.4, inAt - 0.5), pushB = Math.max(pushA + 0.4, inAt - 0.02);
  const zAt = outAt;
  const v1 = quintic(t, pushA, pushB), v2 = c.resultFocus ? quintic(t, zAt, zAt + 0.8) : 0;
  const lz = (a: number, b: number, v: number) => Math.exp(mix(Math.log(a), Math.log(b), v));
  let z = lz(home.z, P.z, v1), fx = mix(home.x, P.x, v1), fy = mix(home.y, P.y, v1);
  if (v2 > 0) { z = lz(P.z, R.z, v2); fx = mix(P.x, R.x, v2); fy = mix(P.y, R.y, v2); }

  // 进度条：源进度（快进时明显“飞走”）
  const prog = clamp((src - c.start) / Math.max(0.01, c.end - c.start));
  // 速度读数：快进中放大一点，回 1× 后在结果推近时退场
  const fast = q(t, inAt, inAt + RAMP) * (1 - q(t, outAt, outAt + RAMP));
  const badgeOut = p(t, outAt + RAMP + 0.35, outAt + RAMP + 0.75);
  const label = `${shown}×`;
  const BS = mix(80, 112, fast);
  const slotW = textWidth('16×', BS) + BS * 1.1;   // 按最宽的“16×”留槽，数字变化时胶囊不跳宽
  const BH = BS * 1.7;

  return <Frame brand={c.brand}>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: FULL.x, top: FULL.y + (1 - enter) * 30, width: FULL.w, height: FULL.h, borderRadius: S.radius,
        overflow: 'hidden', background: '#fff', boxShadow: S.shadow, opacity: enter,
      }}>
        <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${FULL.w / 2}px, ${FULL.h / 2}px) scale(${z}) translate(${-fx}px, ${-fy}px)` }}>
          <Freeze frame={0}>
            <OffthreadVideo muted src={staticFile(c.video)} startFrom={Math.max(0, Math.round(src * fps))} style={{ position: 'absolute', left: (FULL.w - vw) / 2, top: (FULL.h - vh) / 2, width: vw, height: vh }} />
          </Freeze>
        </div>
        {/* 底部进度条：贴着窗下沿，结果推近后退场 */}
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: FULL.w, height: 10, background: S.faint, opacity: 0.35 * (1 - badgeOut) }} />
        <div style={{ position: 'absolute', left: 0, bottom: 0, width: FULL.w * prog, height: 10, background: S.ink, opacity: 1 - badgeOut }} />
        {c.sourceLabel && <div style={{ ...textBase(24, 500), position: 'absolute', left: 24, bottom: 22, color: S.muted }}>{c.sourceLabel}</div>}
      </div>
      {c.speedLabel && <Pill box={{ x: FULL.x + FULL.w - 56 - slotW, y: FULL.y + FULL.h - 56 - BH, w: slotW, h: BH }}
        style={{ opacity: enter * (badgeOut < 0.98 ? 1 : 0), transform: `scale(${1 - badgeOut})`, transformOrigin: '70% 60%' }}>
        <span style={{ ...textBase(BS, 900), color: fast > 0.5 ? S.accentDark : '#fff', fontVariantNumeric: 'tabular-nums' }}>{label}</span>
      </Pill>}
    </Handoff>
    <Sfx name="woosh" at={inAt} />
    <Sfx name="pop" at={outAt + RAMP} />
  </Frame>;
}
