/**
 * RecapEnding.tsx — 镜头 11「收尾：四道工序回收 + 评论钩子」(ENDING-001)
 *
 * 结尾不停在一张静态标题纸上：
 *  1) 泡 / 捣 / 抄 / 晒 四格各自做一段微动（水位上升、杵落、帘入水、纸变干），
 *     每格都是本片已用动作的缩略复现，不引入新语义；
 *  2) 四格向中心收拢、缩小淡出，合成为一张完整纸面；
 *  3) 纸面上落标题「两千年，没变过。」与评论提示，收在已批准的结尾口播上。
 *
 * 组件不读时间轴，只用自身进度，可被任何工程当收尾镜复用。
 */
import React from 'react';
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperBackdrop, paperPalette} from './palette';
import {clamp01, decklePath, easeInOut, easeOut, lerp, seg, useShot} from './kit';

type P = Params & {span?: number};

const W = 1280;
const H = 720;
const PW = 240;
const PH = 168;
const PX = [132, 408, 684, 960];
const PY = 214;

const STEPS = ['泡', '捣', '抄', '晒'];
const STEP_YEAR = ['泡到烂', '捣成浆', '抄成膜', '晒干揭'];

/** 每格内部的微动：全部由 prog 驱动，不循环、不机械重复 */
function PanelArt({i, prog, pal}: {i: number; prog: number; pal: ReturnType<typeof paperPalette>}) {
  const local = clamp01((prog - 0.06 - i * 0.06) / 0.5);
  if (i === 0) {
    // 泡：水面上升，纤维团下沉
    const level = lerp(0.62, 0.28, easeOut(local));
    const top = PY + 24;
    const inner = 112;
    return (
      <g>
        <rect x={PX[0] + 34} y={top} width="172" height={inner} fill="#FCFAF2" opacity="0.5" />
        <rect x={PX[0] + 34} y={top + inner * level} width="172" height={inner * (1 - level)} fill={pal.waterMid} opacity="0.45" />
        <rect x={PX[0] + 34} y={top} width="172" height={inner} fill="none" stroke={pal.edge} strokeWidth="1.2" opacity="0.55" />
        {[0, 1, 2, 3].map((k) => (
          <ellipse key={k} cx={PX[0] + 52 + k * 40} cy={top + inner * level + 8 + k * 5} rx="13" ry="5" fill={pal.fiberAlt} opacity={0.45 - k * 0.06} />
        ))}
      </g>
    );
  }
  if (i === 1) {
    // 捣：杵三次落下，臼口涟漪
    const phase = Math.sin(local * Math.PI * 6);
    const drop = 26 * Math.abs(phase);
    const hit = local > 0.12 ? 1 : 0;
    return (
      <g>
        <path d={`M${PX[1] + 62} ${PY + 96} Q${PX[1] + 120} ${PY + 140} ${PX[1] + 178} ${PY + 96}`} fill={pal.clayMid} opacity="0.8" />
        <ellipse cx={PX[1] + 120} cy={PY + 96} rx="58" ry="14" fill={pal.paperHi} />
        <ellipse cx={PX[1] + 120} cy={PY + 96} rx="58" ry="14" fill="none" stroke={pal.edge} strokeWidth="1.2" />
        <rect x={PX[1] + 108} y={PY + 30 + drop} width="24" height="62" rx="4" fill={pal.fiber} opacity="0.85" />
        <ellipse cx={PX[1] + 120} cy={PY + 92} rx={14 + 10 * hit} ry="3" fill={pal.foam} opacity={0.5 * hit} />
      </g>
    );
  }
  if (i === 2) {
    // 抄：竹帘斜插入水，带出两滴水
    const dip = lerp(-14, 12, easeInOut(clamp01(local * 1.6)));
    return (
      <g>
        <rect x={PX[2] + 40} y={PY + 76} width="164" height="52" fill={pal.waterMid} opacity="0.55" />
        <rect x={PX[2] + 40} y={PY + 76} width="164" height="8" fill={pal.foam} opacity="0.5" />
        <g transform={`translate(${PX[2] + 56} ${PY + 34 + dip}) rotate(-8)`}>
          <rect x="0" y="0" width="126" height="52" fill={pal.paperHi} opacity="0.9" />
          {[0, 1, 2, 3, 4].map((k) => (
            <line key={k} x1={10 + k * 26} y1="2" x2={10 + k * 26} y2="50" stroke={pal.weave} strokeWidth="1" opacity="0.5" />
          ))}
        </g>
        <circle cx={PX[2] + 96} cy={PY + 120} r="3" fill={pal.waterLo} opacity={0.6 * clamp01(local)} />
        <circle cx={PX[2] + 140} cy={PY + 132} r="2" fill={pal.waterLo} opacity={0.45 * clamp01(local)} />
      </g>
    );
  }
  // 晒：湿纸转干
  const dry = easeInOut(clamp01((local - 0.15) / 0.6));
  const fill = dry > 0.5 ? pal.paperHi : pal.paperLo;
  return (
    <g>
      {[0, 1, 2, 3].map((k) => (
        <line key={k} x1={PX[3] + 24} y1={PY + 40 + k * 34} x2={PX[3] + 216} y2={PY + 40 + k * 34} stroke={pal.edge} strokeWidth="1" opacity="0.25" />
      ))}
      <path d={decklePath(PX[3] + 54, PY + 30, 132, 108, 0x77, 3)} fill={fill} opacity={0.6 + 0.35 * dry} />
      <path d={decklePath(PX[3] + 54, PY + 30, 132, 108, 0x77, 3)} fill="none" stroke={pal.edge} strokeWidth="1" opacity="0.6" />
    </g>
  );
}

export function RecapEnding({params, theme}: SceneProps) {
  const p = params as P;
  const s = resolveStyle(theme, p);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 10.5);

  const assemble = easeOut(seg(prog, 0.05, 0.3));
  const converge = easeInOut(seg(prog, 0.44, 0.64));
  const sheetIn = easeOut(seg(prog, 0.56, 0.74));
  const titleIn = easeOut(seg(prog, 0.68, 0.82));
  const ctaIn = easeOut(seg(prog, 0.8, 0.9));
  const SH = {x: 320, y: 168, w: 640, h: 396};

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: '-16%', background: paperBackdrop(pal, theme)}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* 眉标 */}
        <g opacity={assemble}>
          <text x="132" y="104" fill={pal.accent} fontFamily={s.mono} fontSize="17" letterSpacing="4">
            RECAP / 泡 · 捣 · 抄 · 晒
          </text>
          <line x1="132" y1="126" x2={132 + 196 * assemble} y2="126" stroke={pal.accent} strokeWidth="2" opacity="0.6" />
        </g>

        {/* 四格：错峰出现 → 收拢 */}
        {STEPS.map((label, i) => {
          const t0 = 0.08 + i * 0.07;
          const a = easeOut(seg(prog, t0, t0 + 0.2)) * (1 - converge);
          if (a <= 0.001) return null;
          const cx = PX[i] + PW / 2;
          const cy = PY + PH / 2;
          const tx = 640 - cx;
          const ty = 300 - cy;
          return (
            <g
              key={label}
              opacity={a}
              transform={`translate(${tx * converge} ${ty * converge}) translate(${cx} ${cy}) scale(${1 - 0.42 * converge}) translate(${-cx} ${-cy})`}
            >
              <rect x={PX[i]} y={PY} width={PW} height={PH} rx="6" fill="#FCFAF2" opacity="0.86" />
              <rect x={PX[i]} y={PY} width={PW} height={PH} rx="6" fill="none" stroke={pal.edge} strokeWidth="1" opacity="0.55" />
              <PanelArt i={i} prog={prog} pal={pal} />
              <text x={PX[i] + 18} y={PY + PH - 16} fill={pal.ink} fontFamily={s.display} fontSize="26" fontWeight="500">
                {label}
              </text>
              <text x={PX[i] + PW - 16} y={PY + PH - 18} textAnchor="end" fill={pal.muted} fontFamily={s.font} fontSize="17" opacity="0.8">
                {STEP_YEAR[i]}
              </text>
            </g>
          );
        })}

        {/* 合成：完整纸面 */}
        <g opacity={sheetIn}>
          <path d={decklePath(SH.x, SH.y, SH.w, SH.h, 0x2f, 5)} fill="#FAF8F0" opacity="0.97" />
          <path d={decklePath(SH.x, SH.y, SH.w, SH.h, 0x2f, 5)} fill="none" stroke={pal.edge} strokeWidth="1.2" opacity="0.6" />
          <path d={decklePath(SH.x + 6, SH.y + 6, SH.w, SH.h, 0x2f, 5)} fill="none" stroke={pal.deckleHi} strokeWidth="0.8" opacity="0.5" />

          <g opacity={titleIn}>
            <text x="640" y="360" textAnchor="middle" fill={pal.ink} fontFamily={s.display} fontSize="76" fontWeight="500">
              两千年，
            </text>
            <text x="640" y="452" textAnchor="middle" fill={pal.ink} fontFamily={s.display} fontSize="76" fontWeight="500">
              没变过。
            </text>
            <line x1="500" y1="486" x2={500 + 280 * titleIn} y2="486" stroke={pal.accent} strokeWidth="2.4" opacity="0.8" />
          </g>

          <g opacity={ctaIn}>
            <text x="640" y="528" textAnchor="middle" fill={pal.muted} fontFamily={s.font} fontSize="30">
              有需要的，评论区留言。
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}




