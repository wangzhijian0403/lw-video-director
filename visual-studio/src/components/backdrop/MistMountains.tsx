/**
 * 薄雾青山背景（通用背景层，不绑定任何主题内容）
 *
 * 设计要求：
 * - 分层视差：四道山脊按景深不同做不同幅度的横移，远山几乎不动，近山跟得多；
 * - 轻微雾效：横向雾带缓慢漂移，压住山脚，不做成整张参考图；
 * - 克制：所有颜色都比主题前景低对比，字幕条与 MG 主体在上面依然清晰。
 *
 * 只依赖参数，不读写时间轴，可被任何工程当作 backdrop 使用。
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {themes} from '../../styles/themes';
import type {ThemeId} from '../../catalog/types';

type Ridge = {base: number; amp: number; freq: number; phase: number; depth: number; color: string; soft: number};

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const ridgePath = (r: Ridge, w: number, h: number) => {
  const steps = 40;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    const u = i / steps;
    const y =
      r.base +
      Math.sin(u * Math.PI * r.freq + r.phase) * r.amp +
      Math.sin(u * Math.PI * r.freq * 2.7 + r.phase * 1.7) * r.amp * 0.34;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M0,${h} L${pts.join(' L')} L${w},${h} Z`;
};

export const MistMountains: React.FC<{
  theme: ThemeId;
  /** 视差强度：0 静止，1 标准 */
  parallax?: number;
  /** 雾浓淡 0–1 */
  haze?: number;
  /** 是否加细颗粒 */
  grain?: boolean;
}> = ({theme, parallax = 1, haze = 1, grain = true}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const t = themes[theme];
  const isMist = theme === 'mist-blue-paper';
  const rnd = mulberry32(0x51a7);
  const ridges: Ridge[] = [
    {base: height * 0.4, amp: 26, freq: 2.1, phase: 0.4, depth: 0.18, color: isMist ? '#C3D5DD' : '#ded2ba', soft: 0.5},
    {base: height * 0.53, amp: 34, freq: 1.7, phase: 2.2, depth: 0.34, color: isMist ? '#A7BEC9' : '#cebfa3', soft: 0.36},
    {base: height * 0.68, amp: 42, freq: 1.35, phase: 4.1, depth: 0.58, color: isMist ? '#88A3AF' : '#b9a684', soft: 0.22},
    {base: height * 0.85, amp: 30, freq: 1.05, phase: 1.1, depth: 0.9, color: isMist ? '#6A8895' : '#a5906f', soft: 0.12},
  ];
  const cycle = frame / Math.max(1, durationInFrames - 1);
  const drift = (cycle - 0.5) * 2; // -1 → 1，全片单向推进，不做来回摆
  const fogSeed = Array.from({length: 5}, () => ({x: rnd(), y: rnd(), r: 0.2 + rnd() * 0.35, sp: 0.4 + rnd()}));

  return (
    <AbsoluteFill style={{backgroundColor: isMist ? '#EDF2F3' : t.bg, overflow: 'hidden'}}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="mm-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={isMist ? '#CBD9DF' : '#efe6d5'} />
            <stop offset="0.48" stopColor={isMist ? '#DCE7EA' : '#f3ebda'} />
            <stop offset="0.8" stopColor={isMist ? '#E9F0F1' : '#efe6d3'} />
            <stop offset="1" stopColor={isMist ? '#F1F2EC' : '#efe6d3'} />
          </linearGradient>
          <radialGradient id="mm-vig" cx="0.5" cy="0.46" r="0.78">
            <stop offset="0.45" stopColor="#193447" stopOpacity="0" />
            <stop offset="1" stopColor="#193447" stopOpacity="0.16" />
          </radialGradient>
          <filter id="mm-blur-lg" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id="mm-blur-sm" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="mm-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.10  0 0 0 0 0.20  0 0 0 0 0.27  0 0 0 0.35 0" />
          </filter>
        </defs>

        <rect width={width} height={height} fill="url(#mm-sky)" />

        {ridges.map((r, i) => {
          const shift = -drift * r.depth * 34 * parallax;
          return (
            <g key={`ridge-${i}`} transform={`translate(${shift} 0)`} opacity={1}>
              <path
                d={ridgePath(r, width * 1.14, height)}
                transform={`translate(${-width * 0.07} 0)`}
                fill={r.color}
                opacity={0.94}
              />
              {r.soft > 0 ? (
                <path
                  d={ridgePath(r, width * 1.14, height)}
                  transform={`translate(${-width * 0.07} ${-10 * r.soft})`}
                  fill={r.color}
                  opacity={0.35}
                  filter="url(#mm-blur-sm)"
                />
              ) : null}
            </g>
          );
        })}

        {/* 雾带：横向拉长的柔光，沿山脚缓慢漂移 */}
        {fogSeed.map((f, i) => {
          const x = ((f.x + drift * f.sp * 0.12) % 1) * width;
          const y = height * (0.5 + i * 0.09) + Math.sin(drift * 2 + i) * 6;
          return (
            <ellipse
              key={`fog-${i}`}
              cx={x}
              cy={y}
              rx={width * f.r}
              ry={height * 0.045}
              fill={isMist ? '#FFFFFF' : '#FFF9EC'}
              opacity={(0.18 + i * 0.03) * haze}
              filter="url(#mm-blur-lg)"
            />
          );
        })}

        {grain ? <rect width={width} height={height} filter="url(#mm-grain)" opacity="0.05" /> : null}
        {/* 整体压一层暗角，避免大面积近白刺眼 */}
        <rect width={width} height={height} fill="url(#mm-vig)" />
      </svg>
    </AbsoluteFill>
  );
};
