// T20q 大字透画（开场 4s）：白画布上两三个巨大的字，字里透出一张真实作品；字慢慢变大，字外的白一下子被画面填满，整张作品再收成一个大窗，标题黑胶囊落在下沿。
// 观众要看懂的变化：巨大的字里透着画面 → 字撑开成满屏画面 → 收成窗口和标题。
// 动作来源：字形蒙版（SVG mask，字就是窗口）+ T20m/108 大播放窗的“满屏 → 窗口”收束；镂空字只用于开场，不和章节页共用。
import React from 'react';
import { staticFile } from 'remotion';
import { S, clamp, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, splitHighlight } from './_shared';

export type TextMaskProps = HandoffProps & {
  word: string;         // 透出画面的大字（2–4 个字最好）
  src: string;          // 真实作品图
  ratio: number;
  title: string;
  highlight: string;
  cues?: number[];      // [0]=字撑开成满屏，[1]=收成窗口
};

export const textMaskDefaults: TextMaskProps = {
  word: '仙境',
  src: 'fredtalk/media/lw-work-06.jpg',
  ratio: 1672 / 942,
  title: '一句话，生成国风仙境',
  highlight: '国风仙境',
};

export function TextMask(props: Partial<TextMaskProps>) {
  const c = { ...textMaskDefaults, ...props };
  const t = useT();
  const openAt = cueAt(c.cues, 0, 1.15);
  const shrinkAt = cueAt(c.cues, 1, openAt + 0.75);
  const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const ws = fit(c.word, 620, 1700);
  const inE = p(t, 0, 0.5);
  const grow = mix(mix(0.9, 1, inE), 1.55, q(t, openAt - 0.2, openAt + 0.55));
  const fill = q(t, openAt, openAt + 0.5);           // 字外区域：中心圆一刀揭开，边缘清楚
  const drift = mix(1.14, 1.0, clamp(t / (shrinkAt + 0.6)));   // 画面本身缓慢回正（有生命，不定格）

  // 满屏 → 窗口
  const shrink = q(t, shrinkAt, shrinkAt + 0.6);
  const WW = 1360, WH = WW / c.ratio;
  const win = { x: 960 - WW / 2, y: Math.max(145, 470 - WH / 2) };
  const sc = mix(1, WW / 1920, shrink);
  const tx = mix(0, win.x, shrink), ty = mix(0, win.y - (1080 * sc - WH) / 2, shrink);
  const radius = mix(0, S.radius / sc, shrink);

  const titleAt = shrinkAt + 0.45;
  const size = fit(c.title, 108, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0',
        transform: `translate(${tx}px, ${ty}px) scale(${sc})`, borderRadius: radius, overflow: 'hidden',
        boxShadow: shrink > 0.3 ? S.shadow : 'none',
      }}>
        <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
          <defs>
            <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
              <rect x={0} y={0} width={1920} height={1080} fill="#000" />
              <g transform={`translate(960 540) scale(${grow}) translate(-960 -540)`}>
                <text x={960} y={540 + ws * 0.36} textAnchor="middle" fill="#fff"
                  style={{ ...textBase(ws, 400, S.display), lineHeight: 1 }}>{c.word}</text>
              </g>
              <circle cx={960} cy={540} r={fill * 1110} fill="#fff" />
            </mask>
          </defs>
          <g mask={`url(#${id}-m)`}>
            <image href={staticFile(c.src)} x={0} y={0} width={1920} height={1080} preserveAspectRatio="xMidYMid slice"
              transform={`translate(960 540) scale(${drift}) translate(-960 -540)`} />
          </g>
        </svg>
      </div>
      {pill > 0 && <div style={{
        position: 'absolute', left: 960 - PW / 2, top: win.y + WH - PH * 0.42, width: PW, height: PH, borderRadius: PH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * 46}px) scale(${mix(1.1, 1, pill)})`,
      }}>
        <span style={{ ...textBase(size, 400, S.display), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
      </div>}
    </Handoff>
    <Sfx name="pop" at={0.05} volume={0.4} />
    <Sfx name="woosh" at={openAt} />
    <Sfx name="slide" at={shrinkAt} volume={0.4} />
    <Sfx name="pop" at={titleAt + 0.1} />
  </Frame>;
}
