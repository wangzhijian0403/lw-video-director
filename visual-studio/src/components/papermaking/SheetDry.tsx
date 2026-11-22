/**
 * SheetDry.tsx — 镜头 07「第四道：晒」(DRY-001)
 *
 * 内容解释：抄好的纸膜贴在石灰墙上阴干，水走掉、纤维抱紧，揭下来才是纸。
 * 动作链：贴墙（已在墙上）→ 水汽一点点退（湿痕从边缘往中间收）→ 纸面由暗转白 → 揭角 → 整张揭下。
 * 只用「湿→干」的两种质地和一次揭纸动作叙事，不靠加装饰元素凑时长。
 */
import React from 'react';
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperBackdrop, paperPalette} from './palette';
import {clamp01, decklePath, easeInOut, easeOut, lerp, seg, useShot} from './kit';

type P = Params & {span?: number};

const W = 1280;
const H = 720;
const WALL = {x: 566, y: 96, w: 604, h: 512};

const SHEETS = [
  {x: 602, y: 150, w: 168, h: 246, seed: 0x51a, d: 0.0},
  {x: 790, y: 150, w: 168, h: 246, seed: 0x77b, d: 0.08},
  {x: 978, y: 150, w: 168, h: 246, seed: 0x9c3, d: 0.16},
];

export function SheetDry({params, theme}: SceneProps) {
  const p = params as P;
  const s = resolveStyle(theme, p);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 3.1);

  const dry = easeInOut(seg(prog, 0.08, 0.62));
  const peel = easeInOut(seg(prog, 0.66, 0.94));
  const kick = easeOut(seg(prog, 0.0, 0.14));
  const tail = 1 - easeInOut(seg(prog, 0.95, 1));
  const last = SHEETS[2];

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: '-16%', background: paperBackdrop(pal, theme)}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="dr-wall" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={pal.paperMid} />
            <stop offset="0.55" stopColor={pal.paperLo} />
            <stop offset="1" stopColor={pal.paperMid} />
          </linearGradient>
          <linearGradient id="dr-wet" x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor={pal.fiber} stopOpacity="0.42" />
            <stop offset="1" stopColor={pal.fiberAlt} stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="dr-gloss" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="dr-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {/* 墙：一块石灰面，上沿与投影把「贴」这个动作说清楚 */}
        <g opacity={kick * tail}>
          <ellipse cx={WALL.x + WALL.w / 2} cy={WALL.y + WALL.h + 14} rx={WALL.w * 0.5} ry="16" fill={pal.vignette} opacity="0.14" filter="url(#dr-blur)" />
          <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} fill="url(#dr-wall)" opacity="0.96" />
          <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} fill="none" stroke={pal.clayLo} strokeWidth="2" opacity="0.55" />
          <rect x={WALL.x} y={WALL.y} width={WALL.w} height="26" fill={pal.edge} opacity="0.18" />
          {Array.from({length: 16}, (_, i) => (
            <line key={`l-${i}`} x1={WALL.x + 30 + (i % 4) * 150} y1={WALL.y + 90 + Math.floor(i / 4) * 130} x2={WALL.x + 30 + (i % 4) * 150 + 22} y2={WALL.y + 90 + Math.floor(i / 4) * 130 + 6} stroke={pal.edge} strokeWidth="1" opacity="0.12" />
          ))}
        </g>

        {/* 已干的两张 + 正在干的第三张 */}
        {SHEETS.map((sh, i) => {
          const isLast = i === 2;
          const localDry = isLast ? dry : Math.min(1, dry * 1.4);
          const sheen = 1 - localDry;
          const peelT = isLast ? peel : 0;
          const rot = -7 * peelT;
          const dx = 60 * peelT;
          const dy = 46 * peelT;
          const shrinkX = 1 + 0.02 * peelT;
          return (
            <g key={sh.seed} transform={`translate(${sh.x + dx} ${sh.y + dy}) rotate(${rot} ${sh.w} ${sh.h})`} opacity={kick * tail}>
              <ellipse cx={sh.w / 2} cy={sh.h - 2} rx={sh.w * 0.46} ry="6" fill={pal.shadow} opacity="0.22" />
              <path d={decklePath(3, 3, sh.w - 6, sh.h - 6, sh.seed, 4)} fill={pal.paperHi} opacity={0.72 + 0.24 * localDry} transform={`scale(${shrinkX})`} />
              <path d={decklePath(3, 3, sh.w - 6, sh.h - 6, sh.seed, 4)} fill="none" stroke={pal.edge} strokeWidth="1.4" opacity={0.45 + 0.2 * localDry} />
              {/* 湿痕：从边缘往里退，不是整张一起淡 */}
              {sheen > 0.02 ? (
                <>
                  <path d={decklePath(3, 3, sh.w - 6, sh.h - 6, sh.seed, 4)} fill="url(#dr-wet)" opacity={0.62 * sheen} />
                  <rect x={sh.w * 0.18} y={sh.h * 0.2} width={sh.w * 0.64} height={sh.h * 0.52} fill="url(#dr-gloss)" opacity={0.45 * sheen} transform={`translate(${(1 - sheen) * sh.w * 0.1} 0)`} />
                  {/* 未干的纸还会滴水：底沿一串水珠，随退水变少 */}
                  {[0.2, 0.38, 0.56, 0.74].map((fx, k) => (
                    <ellipse key={k} cx={sh.w * fx} cy={sh.h + 6 + (1 - sheen) * 10} rx="2.1" ry="3.6" fill={pal.waterHi} opacity={0.5 * sheen} />
                  ))}
                </>
              ) : null}
              {/* 纤维：干了才看得见 */}
              {Array.from({length: 10}, (_, k) => (
                <line
                  key={k}
                  x1={12 + k * 17}
                  y1={8}
                  x2={12 + k * 17 + 4}
                  y2={sh.h - 8}
                  stroke={pal.fiber}
                  strokeWidth="0.7"
                  opacity={0.06 + 0.1 * localDry}
                />
              ))}
              {peelT > 0.01 ? (
                <path d={`M${sh.w - 26} ${sh.h} L${sh.w} ${sh.h} L${sh.w} ${sh.h - 26} Z`} fill={pal.shadow} opacity={0.16 * peelT} />
              ) : null}
            </g>
          );
        })}

        {/* 文案 */}
        <g opacity={kick * tail}>
          <text x="110" y="112" fill={pal.accent} fontFamily={s.mono} fontSize="15" letterSpacing="4">
            STEP 04 / 晒
          </text>
          <text x="110" y="186" fill={pal.ink} fontFamily={s.display} fontSize="58" fontWeight="500">
            {String(p.title || '第四道，晒')}
          </text>
          <text x="110" y="232" fill={pal.muted} fontFamily={s.font} fontSize="20">
            {String(p.subtitle || '贴墙阴干，水走掉就是纸')}
          </text>
          <line x1="110" y1="256" x2={110 + 196 * kick} y2="256" stroke={pal.accent} strokeWidth="2" opacity="0.7" />
          <g opacity={easeOut(seg(prog, 0.2, 0.4))}>
            <text x="110" y="308" fill={pal.muted} fontFamily={s.font} fontSize="18" opacity={0.9}>
              湿的时候一碰就破，干透了才敢揭
            </text>
            <text x="110" y="342" fill={pal.muted} fontFamily={s.font} fontSize="18" opacity={0.75}>
              阴干，不是晒干——日头一晒就翘
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
