/**
 * BambooVsPaper.tsx — 镜头 09「竹简退场」(BAMBOO-001)
 *
 * 内容解释：纸出来之前，书是竹简——一册要一车才拉得动，帛又贵得平民用不起。
 * 画面用「同一段文字，两种载体」的对照：左边竹简沉、右边纸册轻；
 * 竹简先在场，随后被抬走（退场），纸册落下并压住空出来的位置，重量/价格两根对比条同步给出。
 */
import React from 'react';
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperBackdrop, paperPalette} from './palette';
import {clamp01, easeInOut, easeOut, lerp, seg, useShot} from './kit';

type P = Params & {span?: number};

const W = 1280;
const H = 720;
const GROUND = 596;

export function BambooVsPaper({params, theme}: SceneProps) {
  const p = params as P;
  const s = resolveStyle(theme, p);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 5.2);

  const kick = easeOut(seg(prog, 0.0, 0.16));
  const tail = 1 - easeInOut(seg(prog, 0.93, 1));
  const bambooIn = easeOut(seg(prog, 0.04, 0.22));
  const lift = easeInOut(seg(prog, 0.42, 0.72));
  const paperIn = easeOut(seg(prog, 0.5, 0.78));
  const bars = easeInOut(seg(prog, 0.24, 0.7));

  const BX = 336;
  const BY = 236;
  const SLAT = {w: 22, h: 300, gap: 4};

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: '-16%', background: paperBackdrop(pal, theme)}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="bp-slat" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={pal.clayMid} />
            <stop offset="0.45" stopColor={pal.clayHi} />
            <stop offset="1" stopColor={pal.clayLo} />
          </linearGradient>
          <linearGradient id="bp-paper" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor={pal.paperHi} />
            <stop offset="1" stopColor={pal.paperLo} />
          </linearGradient>
          <filter id="bp-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        <g opacity={kick * tail}>
          <text x="110" y="104" fill={pal.accent} fontFamily={s.mono} fontSize="15" letterSpacing="4">
            BAMBOO OUT / PAPER IN
          </text>
          <text x="110" y="172" fill={pal.ink} fontFamily={s.display} fontSize="50" fontWeight="500">
            {String(p.title || '竹简退场')}
          </text>
          <text x="110" y="206" fill={pal.muted} fontFamily={s.font} fontSize="19" opacity={0.88}>
            {String(p.subtitle || '同样的字，换个载体就便宜了')}
          </text>
          <line x1="110" y1="226" x2={110 + 190 * kick} y2="226" stroke={pal.accent} strokeWidth="2" opacity="0.7" />
        </g>

        {/* 地面 */}
        <line x1="110" y1={GROUND} x2="1170" y2={GROUND} stroke={pal.edge} strokeWidth="1.4" opacity="0.35" />
        <ellipse cx={BX} cy={GROUND + 8} rx="150" ry="14" fill={pal.vignette} opacity={0.1} filter="url(#bp-blur)" />

        {/* 竹简：一捆，抬起来退场 */}
        <g transform={`translate(${BX} ${lerp(0, -26, lift)})`} opacity={bambooIn * (1 - 0.55 * lift)}>
          {Array.from({length: 12}, (_, i) => {
            const jx = i * (SLAT.w + SLAT.gap);
            const hh = SLAT.h - (i % 3) * 6;
            return (
              <g key={i} transform={`translate(${jx} ${GROUND - hh})`}>
                <rect width={SLAT.w} height={hh} rx="3" fill="url(#bp-slat)" />
                <rect width={SLAT.w} height={hh} rx="3" fill="none" stroke={pal.clayLo} strokeWidth="0.8" opacity="0.5" />
                {Array.from({length: 3}, (_, k) => (
                  <line key={k} x1="4" y1={40 + k * 78} x2={SLAT.w - 4} y2={40 + k * 78} stroke={pal.ink} strokeWidth="0.8" opacity="0.18" />
                ))}
                {i % 4 === 0 ? <circle cx={SLAT.w / 2} cy={hh - 26} r="4" fill={pal.accent} opacity="0.25" /> : null}
              </g>
            );
          })}
          {/* 编绳 */}
          <line x1="-4" y1={GROUND - SLAT.h + 60} x2={12 * (SLAT.w + SLAT.gap) - SLAT.gap + 4} y2={GROUND - SLAT.h + 60} stroke={pal.clayLo} strokeWidth="3" opacity="0.5" />
          <line x1="-4" y1={GROUND - 40} x2={12 * (SLAT.w + SLAT.gap) - SLAT.gap + 4} y2={GROUND - 40} stroke={pal.clayLo} strokeWidth="3" opacity="0.5" />
        </g>

        {/* 纸册：落在空位右侧，轻、薄、白 */}
        <g transform={`translate(${820} ${GROUND - 210 + (1 - paperIn) * 30})`} opacity={paperIn}>
          {[0, 1, 2].map((k) => (
            <rect key={k} x={k * 3} y={k * 3} width="250" height="196" rx="2" fill="url(#bp-paper)" stroke={pal.edge} strokeWidth="1" opacity={0.9 - k * 0.05} />
          ))}
          {Array.from({length: 8}, (_, k) => (
            <line key={k} x1="26" y1={40 + k * 18} x2="224" y2={40 + k * 18} stroke={pal.ink} strokeWidth="1" opacity="0.14" />
          ))}
          <rect x="0" y="0" width="250" height="10" fill={pal.accent} opacity="0.24" />
        </g>

        {/* 对比条：重量 / 价格 */}
        <g opacity={easeOut(seg(prog, 0.3, 0.55)) * tail} fontFamily={s.font}>
          {/* 重量 */}
          <text x="640" y="278" fill={pal.muted} fontSize="17" opacity="0.9">
            一册竹简的重量
          </text>
          <rect x="640" y="288" width="440" height="14" rx="7" fill={pal.edge} opacity="0.22" />
          <rect x="640" y="288" width={440 * 0.92 * bars} height="14" rx="7" fill={pal.muted} opacity="0.55" />
          <text x="1100" y="278" textAnchor="end" fill={pal.muted} fontSize="16" opacity="0.75">
            要一车拉
          </text>
          <text x="640" y="348" fill={pal.muted} fontSize="17" opacity="0.9">
            同样的字，抄在纸上
          </text>
          <rect x="640" y="358" width="440" height="14" rx="7" fill={pal.edge} opacity="0.22" />
          <rect x="640" y="358" width={440 * 0.18 * bars} height="14" rx="7" fill={pal.accent} opacity="0.6" />
          <text x="1100" y="348" textAnchor="end" fill={pal.accent} fontSize="16" opacity="0.85">
            一只手拿走
          </text>
        </g>

      </svg>
    </div>
  );
}
