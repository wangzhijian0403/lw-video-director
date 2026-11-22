/**
 * ProcessStrip.tsx — 镜头 02「四道工序总览」(PROCESS-001)
 *
 * 用途：开场第二段（0:04.9–0:10.0）把全片结构一次交代清楚：泡 → 捣 → 抄 → 晒。
 * 四张卡片依次亮起，卡片内是一步动作的小剖面，而不是贴图。
 * 说明字最小 16px（缩放后仍可读），不放大段装饰性英文。
 */
import React from 'react';
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperBackdrop, paperPalette} from './palette';
import {clamp01, easeInOut, easeOut, lerp, seg, useShot} from './kit';

type P = Params & {span?: number};

const W = 1280;
const H = 720;
const CARD_W = 232;
const CARD_H = 300;
const GAP = 26;
const TOP = 236;

const STEPS = [
  {no: '01', name: '泡', note: '泡到一撕就碎'},
  {no: '02', name: '捣', note: '捣成浆，越细越平'},
  {no: '03', name: '抄', note: '竹帘入水，荡匀成膜'},
  {no: '04', name: '晒', note: '贴墙阴干，揭下是纸'},
];

/** 四步小图标：只用几何与纸色，保证与其它镜头同源 */
const Glyph: React.FC<{i: number; pal: ReturnType<typeof paperPalette>; on: number}> = ({i, pal, on}) => {
  const ink = pal.ink;
  const base = {fill: 'none', stroke: ink, strokeOpacity: 0.55, strokeWidth: 1.6};
  if (i === 0)
    return (
      <g opacity={0.5 + 0.5 * on}>
        <path d="M44 44 L136 44 L126 118 L54 118 Z" {...base} strokeOpacity={0.4} />
        <path d="M50 62 L130 62 L122 112 L58 112 Z" fill={pal.waterMid} opacity={0.45} />
        <path d="M50 62 L130 62" stroke={pal.foam} strokeWidth={2} opacity={0.9} />
        <rect x="76" y="72" width="26" height="14" transform="rotate(-9 89 79)" fill={pal.lumpFiber} opacity={on * 0.9} />
      </g>
    );
  if (i === 1)
    return (
      <g opacity={0.5 + 0.5 * on}>
        <path d="M46 66 L134 66 L116 118 L64 118 Z" {...base} strokeOpacity={0.4} />
        <path d="M54 78 L126 78 L114 112 L66 112 Z" fill={pal.lump} opacity={0.55} />
        <line x1="90" y1="18" x2="90" y2={lerp(40, 92, on)} stroke={ink} strokeWidth={6} strokeOpacity={0.5} strokeLinecap="round" />
        <ellipse cx="90" cy={lerp(26, 100, on)} rx="12" ry="6" fill={ink} opacity={0.35} />
      </g>
    );
  if (i === 2)
    return (
      <g opacity={0.5 + 0.5 * on}>
        <rect x="40" y="44" width="100" height="66" rx="3" {...base} strokeOpacity={0.4} />
        {Array.from({length: 9}, (_, k) => (
          <line key={k} x1={46 + k * 11} y1="46" x2={46 + k * 11} y2="108" stroke={pal.weave} strokeWidth="1" opacity={0.45} />
        ))}
        <rect x="46" y="46" width="88" height="62" fill={pal.paperHi} opacity={0.55 * on} />
        <path d="M40 110 L140 110" stroke={pal.foam} strokeWidth={2} opacity={0.5} />
      </g>
    );
  return (
    <g opacity={0.5 + 0.5 * on}>
      <rect x="40" y="40" width="100" height="92" fill={pal.paperLo} opacity={0.5} />
      <rect x="46" y="52" width="42" height="54" fill={pal.paperHi} opacity={0.35 + 0.5 * on} stroke={ink} strokeOpacity={0.2} />
      <rect x="94" y="48" width="40" height="58" fill={pal.paperHi} opacity={0.3 + 0.4 * on} stroke={ink} strokeOpacity={0.15} />
      <path d="M40 132 L140 132" stroke={ink} strokeWidth={1.4} strokeOpacity={0.25} />
    </g>
  );
};

export function ProcessStrip({params, theme}: SceneProps) {
  const p = params as P;
  const s = resolveStyle(theme, p);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 5.1);

  const active = Math.min(4, 1 + Math.floor(clamp01(prog) * 4.02));
  const kick = easeOut(seg(prog, 0.02, 0.16));
  const tail = 1 - easeInOut(seg(prog, 0.92, 1));

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: '-16%', background: paperBackdrop(pal, theme)}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <g opacity={kick * tail}>
          <text x="110" y="112" fill={pal.accent} fontFamily={s.mono} fontSize="15" letterSpacing="4">
            FOUR STEPS
          </text>
          <text x="110" y="176" fill={pal.ink} fontFamily={s.display} fontSize="54" fontWeight="500">
            {String(p.title || '一张纸，四道工序')}
          </text>
          <text x="110" y="208" fill={pal.muted} fontFamily={s.font} fontSize="20" opacity={0.85}>
            {String(p.subtitle || '两千年前的手上功夫，一步都不能省')}
          </text>
          <line x1="110" y1="226" x2={110 + 210 * kick} y2="226" stroke={pal.accent} strokeWidth="2" opacity={0.7} />
        </g>

        {STEPS.map((st, i) => {
          const x = 122 + i * (CARD_W + GAP);
          const appear = easeOut(seg(prog, 0.06 + i * 0.06, 0.24 + i * 0.06));
          const isOn = active === i + 1;
          const glow = isOn ? easeOut(seg(prog, (i + 0.2) / 4.05, (i + 0.5) / 4.05)) : 0;
          const dim = isOn ? 1 : 0.62;
          return (
            <g key={st.no} transform={`translate(${x} ${TOP + (1 - appear) * 26})`} opacity={appear * tail}>
              <rect width={CARD_W} height={CARD_H} rx="4" fill={pal.paperHi} opacity={isOn ? 0.96 : 0.78} />
              <rect width={CARD_W} height={CARD_H} rx="4" fill="none" stroke={pal.edge} strokeWidth="1" opacity={0.35} />
              <rect width={CARD_W} height={isOn ? 4 + 3 * glow : 3} fill={pal.accent} opacity={isOn ? 0.85 : 0.25} />
              <g transform="translate(44 54)" opacity={dim}>
                <Glyph i={i} pal={pal} on={glow} />
              </g>
              <text x="26" y="196" fill={pal.muted} fontFamily={s.mono} fontSize="18" letterSpacing="2" opacity={0.75 * dim}>
                {st.no}
              </text>
              <text x={CARD_W - 26} y="198" textAnchor="end" fill={pal.ink} fontFamily={s.display} fontSize="40" fontWeight="600" opacity={dim}>
                {st.name}
              </text>
              <line x1="26" y1="214" x2={CARD_W - 26} y2="214" stroke={pal.edge} strokeWidth="1" opacity={0.3} />
              <text x="26" y="248" fill={pal.muted} fontFamily={s.font} fontSize="16" opacity={dim}>
                {st.note}
              </text>
              {isOn ? <rect x="0" y={CARD_H - 6} width={CARD_W * glow} height="4" fill={pal.accent} opacity="0.55" /> : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
