/**
 * SheetScoop.tsx — 镜头 05「第三道：抄」(SCOOP-001)
 *
 * 内容解释：抄是整套工序里最靠手感的一步——竹帘斜着插进水槽，荡匀，再平着抬起，
 * 帘面上留下一层薄纸膜；厚了写不动，薄了会破。动作必须完整演出来：
 * 入水（水面被压出凹）→ 荡帘（水在帘面走一遍）→ 起帘（水从帘边漏下去）→ 成膜。
 * 水体用半透明覆盖：帘子在水下会被水色压暗，出水后立刻回到纸白色，这是「浸没」的最省钱画法。
 */
import React from 'react';
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperBackdrop, paperPalette} from './palette';
import {clamp01, easeInOut, easeOut, lerp, mulberry32, seg, strandPath, useShot} from './kit';

type P = Params & {span?: number};

const W = 1280;
const H = 720;

/** 水槽：x 690–1190 与纤维桥的落点一致；水面固定在 414，桥的入水判据也用它 */
const VAT = {x1: 690, x2: 1190, rim: 402, water: 414, bottom: 600, waterRx: 232, waterRy: 30};
const SCREEN = {w: 244, h: 172};

const RIBS = Array.from({length: 19}, (_, i) => i);
const FILM = (() => {
  const r = mulberry32(0x2f5d);
  return Array.from({length: 120}, () => ({
    x: r(),
    y: r(),
    rot: r() * 360,
    len: 12 + r() * 26,
    curve: (r() - 0.5) * 8,
    w: 0.5 + r() * 0.9,
    a: 0.18 + r() * 0.4,
  }));
})();
const DROPS = (() => {
  const r = mulberry32(0x8a17);
  return Array.from({length: 26}, () => ({
    x: r(),
    delay: r() * 0.55,
    sp: 0.55 + r() * 0.7,
    r0: 1.2 + r() * 2,
  }));
})();
const RIPPLES = [0, 1, 2, 3, 4].map((i) => ({x: 0.18 + i * 0.16, d: i * 0.08}));

export function SheetScoop({params, theme}: SceneProps) {
  const p = params as P;
  const s = resolveStyle(theme, p);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 5.4);

  // 入水：从右上斜插进水面（抄纸是斜着荡进去的，不是垂直砸）
  const enter = easeOut(seg(prog, 0.02, 0.22));
  const submerge = easeInOut(seg(prog, 0.18, 0.38));
  const sweep = easeInOut(seg(prog, 0.34, 0.6));
  const lift = easeInOut(seg(prog, 0.62, 0.86));
  const settle = easeOut(seg(prog, 0.82, 1));

  const dip = submerge * (1 - lift);
  const screenX = lerp(1080, 900, enter) - 132 * sweep;
  const screenY = lerp(232, 396, submerge) + 24 * dip - 208 * lift;
  const tilt = lerp(-12, -3, enter) * (1 - sweep * 0.35) + 7 * lift;

  // 水面因帘子下沉而凹陷，荡帘时整片起波
  const ripple = clamp01(sweep * 1.5 - 0.08);
  const film = easeOut(seg(prog, 0.66, 0.9));

  const qKick = easeOut(seg(prog, 0.04, 0.16));
  const qTitle = easeOut(seg(prog, 0.09, 0.28));
  const qSub = easeOut(seg(prog, 0.18, 0.38));
  const qNote = easeOut(seg(prog, 0.34, 0.56));
  const textOut = 1 - easeInOut(seg(prog, 0.86, 0.97));

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: '-16%', background: paperBackdrop(pal, theme)}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="sc-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={pal.waterHi} stopOpacity="0.62" />
            <stop offset="0.35" stopColor={pal.waterMid} stopOpacity="0.7" />
            <stop offset="1" stopColor={pal.waterLo} stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id="sc-vat" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={pal.clayLo} />
            <stop offset="0.2" stopColor={pal.clayMid} />
            <stop offset="0.82" stopColor={pal.clayHi} />
            <stop offset="1" stopColor={pal.clayLo} />
          </linearGradient>
          <linearGradient id="sc-film" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={pal.paperHi} stopOpacity="0.94" />
            <stop offset="1" stopColor={pal.paperLo} stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id="sc-surface" cx="0.5" cy="0.4" r="0.72">
            <stop offset="0" stopColor={pal.foam} stopOpacity="0.55" />
            <stop offset="0.6" stopColor={pal.waterHi} stopOpacity="0.32" />
            <stop offset="1" stopColor={pal.waterLo} stopOpacity="0.5" />
          </radialGradient>
          <filter id="sc-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="sc-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed="14" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.2  0 0 0 0 0.25  0 0 0 0.55 0" />
          </filter>
        </defs>

        <rect width={W} height={H} opacity="0.05" filter="url(#sc-grain)" />

        {/* 工序号水印：压住左下的空白，和右上标头呼应 */}
        <text x="86" y="566" fill={pal.muted} opacity="0.07" fontFamily={s.display} fontSize="210" letterSpacing="-6">
          03
        </text>

        {/* 标头 */}
        <g opacity={qKick * textOut}>
          <text x="110" y="96" fill={pal.accent} fontFamily={s.mono} fontSize="17" letterSpacing="5">
            STEP 03 / 抄
          </text>
          <line x1="110" y1="112" x2={110 + 34 * qKick} y2="112" stroke={pal.accent} strokeWidth="2" />
          <text x="1176" y="96" textAnchor="end" fill={pal.muted} fontFamily={s.mono} fontSize="16" letterSpacing="3">
            SECTION · 水槽侧剖
          </text>
          <text x="1176" y="118" textAnchor="end" fill={pal.muted} fontFamily={s.mono} fontSize="15" letterSpacing="2">
            古法造纸 · 第三道工序
          </text>
        </g>

        {/* 左侧文案 */}
        <g opacity={textOut}>
          <text x="110" y="212" fill={pal.ink} fontFamily={s.display} fontSize="62" fontWeight="500" opacity={qTitle}>
            {String(p.title || '第三道，抄')}
          </text>
          <text x="110" y="262" fill={pal.muted} fontFamily={s.font} fontSize="22" opacity={qSub * 0.92}>
            {String(p.subtitle || '竹帘入水，荡匀，起帘')}
          </text>
          <line x1="110" y1="290" x2={110 + 196 * qTitle} y2="290" stroke={pal.accent} strokeWidth="2" />
          <g opacity={qNote * 0.9}>
            <text x="110" y="330" fill={pal.muted} fontFamily={s.font} fontSize="16" letterSpacing="0.5">
              帘面留下的，就是一层纸膜
            </text>
            <text x="110" y="356" fill={pal.muted} fontFamily={s.mono} fontSize="15" letterSpacing="2">
              厚了写不动 / 薄了会破 / 全凭手感
            </text>
          </g>
        </g>

        {/* 槽体落地影 */}
        <ellipse cx="940" cy={VAT.bottom + 16} rx="250" ry="22" fill={pal.shadow} opacity="0.2" filter="url(#sc-blur)" />

        {/* 槽体：外壁 → 内腔 → 水体 → 帘子 → 水面覆盖 → 前缘 */}
        <g>
          <path
            d={`M${VAT.x1 - 14} ${VAT.rim} L${VAT.x2 + 14} ${VAT.rim} L${VAT.x2} ${VAT.bottom} L${VAT.x1} ${VAT.bottom} Z`}
            fill="url(#sc-vat)"
          />
          {/* 内腔：一块压暗的底，水体覆盖后自然出深度 */}
          <path
            d={`M${VAT.x1 + 10} ${VAT.rim + 10} L${VAT.x2 - 10} ${VAT.rim + 10} L${VAT.x2 - 22} ${VAT.bottom - 8} L${VAT.x1 + 22} ${VAT.bottom - 8} Z`}
            fill={pal.tankIn}
            opacity="0.62"
          />
          <path
            d={`M${VAT.x1 + 10} ${VAT.rim + 10} L${VAT.x2 - 10} ${VAT.rim + 10} L${VAT.x2 - 22} ${VAT.bottom - 8} L${VAT.x1 + 22} ${VAT.bottom - 8} Z`}
            fill="url(#sc-water)"
          />

          {/* 悬浮纤维：水里不是清水，是纸浆水 */}
          {Array.from({length: 40}, (_, i) => {
            const r = mulberry32(0x12c9 + i * 7);
            const r1 = r();
            const r2 = r();
            const y = VAT.water + 30 + r1 * (VAT.bottom - VAT.water - 60);
            return (
              <line
                key={`w-${i}`}
                x1={VAT.x1 + 24 + r2 * (VAT.x2 - VAT.x1 - 80)}
                y1={y}
                x2={VAT.x1 + 24 + r2 * (VAT.x2 - VAT.x1 - 80) + 10 + r1 * 18}
                y2={y + 2}
                stroke={pal.foam}
                strokeWidth="0.8"
                opacity={0.12 + r1 * 0.16}
              />
            );
          })}

          {/* 竹帘 + 纸膜 */}
          <g transform={`translate(${screenX} ${screenY}) rotate(${tilt}) translate(${-SCREEN.w / 2} ${-SCREEN.h / 2})`}>
            {/* 帘框 */}
            <rect x="-13" y="-13" width={SCREEN.w + 26} height={SCREEN.h + 26} rx="5" fill={pal.clayLo} opacity="0.92" />
            <rect x="-13" y="-13" width={SCREEN.w + 26} height="7" fill={pal.clayHi} opacity="0.5" />
            <rect x="-8" y="-8" width={SCREEN.w + 16} height={SCREEN.h + 16} rx="2" fill={pal.paperLo} opacity="0.94" />
            {/* 竹丝 */}
            {RIBS.map((i) => (
              <line
                key={`rib-${i}`}
                x1={3 + i * ((SCREEN.w - 6) / (RIBS.length - 1))}
                y1="0"
                x2={3 + i * ((SCREEN.w - 6) / (RIBS.length - 1))}
                y2={SCREEN.h}
                stroke={pal.weave}
                strokeWidth="1.4"
                opacity="0.5"
              />
            ))}
            {Array.from({length: 9}, (_, i) => (
              <line key={`ribh-${i}`} x1="0" y1={8 + i * ((SCREEN.h - 16) / 8)} x2={SCREEN.w} y2={8 + i * ((SCREEN.h - 16) / 8)} stroke={pal.weave} strokeWidth="0.7" opacity="0.3" />
            ))}

            {/* 纸膜：起帘后出现，纤维顺着帘面方向排布（不是乱划） */}
            <g opacity={film}>
              <rect width={SCREEN.w} height={SCREEN.h} fill="url(#sc-film)" />
              {FILM.map((f, i) => {
                if (i % 4 === 0) return null;
                const flat = {x: f.x, y: f.y, len: f.len * (0.6 + (i % 6) * 0.11), rot: ((i % 9) - 4) * 7};
                return (
                  <path
                    key={`f-${i}`}
                    d={strandPath(f, flat.x * SCREEN.w, flat.y * SCREEN.h, flat.rot, flat.len)}
                    stroke={pal.fiber}
                    strokeWidth={Math.max(0.45, f.w * 0.62)}
                    strokeOpacity={f.a * film * 0.5}
                    fill="none"
                  />
                );
              })}
              <rect width={SCREEN.w} height={SCREEN.h} fill={pal.foam} opacity={(1 - settle) * 0.2} />
            </g>

            {/* 帘面滴水：起帘后从底边往下漏 */}
            {lift > 0.05 && lift < 1.02
              ? DROPS.map((d, i) => {
                  const t = clamp01(lift - d.delay);
                  if (t <= 0) return null;
                  const yy = SCREEN.h + t * 190 * d.sp;
                  return <ellipse key={`dp-${i}`} cx={d.x * SCREEN.w} cy={yy} rx={d.r0} ry={d.r0 * 2.1} fill={pal.waterHi} opacity={0.55 * (1 - t) * (1 - settle)} />;
                })
              : null}
          </g>

          {/* 水面覆盖：压在水下部分之上，帘子在水里就被水色染暗 */}
          <g opacity={0.58 + dip * 0.3}>
            <rect x={VAT.x1 + 10} y={VAT.water} width={VAT.x2 - VAT.x1 - 20} height={VAT.bottom - VAT.water - 8} fill="url(#sc-water)" opacity="0.74" />
            <rect x={VAT.x1 + 10} y={VAT.water} width={VAT.x2 - VAT.x1 - 20} height="18" fill={pal.waterLo} opacity="0.2" />
          </g>

          {/* 水面本体：一条透视椭圆 + 高光，读得出「有水面」 */}
          <ellipse cx={(VAT.x1 + VAT.x2) / 2} cy={VAT.water} rx={VAT.waterRx} ry={VAT.waterRy} fill="url(#sc-surface)" />
          <ellipse
            cx={(VAT.x1 + VAT.x2) / 2 + 6 * sweep}
            cy={VAT.water + 2 * dip}
            rx={VAT.waterRx - 6}
            ry={VAT.waterRy - 4}
            fill="none"
            stroke={pal.foam}
            strokeWidth="1.6"
            opacity={(0.28 + ripple * 0.22) * (1 - lift * 0.35)}
          />
          {/* 荡帘时的横向波纹 */}
          {RIPPLES.map((r, i) => {
            const a = clamp01(ripple * 1.5 - r.d) * (1 - clamp01(ripple * 1.5 - r.d - 0.4));
            return a > 0.02 ? (
              <ellipse
                key={`rp-${i}`}
                cx={VAT.x1 + 40 + r.x * (VAT.x2 - VAT.x1)}
                cy={VAT.water + 10}
                rx={48 + 22 * i}
                ry="7"
                fill="none"
                stroke={pal.foam}
                strokeWidth="1.4"
                opacity={a * 0.55}
              />
            ) : null;
          })}
          {/* 起帘后帘体在槽口投下的柔影，避免帘子像悬空贴片 */}
          {lift > 0.02 ? (
            <ellipse
              cx={screenX + 10}
              cy={VAT.bottom - 26}
              rx={SCREEN.w * 0.62}
              ry={10}
              fill={pal.vignette}
              opacity={0.16 * lift * (1 - settle * 0.4)}
              filter="url(#sc-blur)"
            />
          ) : null}

          {/* 前缘：遮住内腔下沿，槽体才闭合 */}
          <path
            d={`M${VAT.x1} ${VAT.bottom - 26} L${VAT.x2} ${VAT.bottom - 26} L${VAT.x2} ${VAT.bottom} L${VAT.x1} ${VAT.bottom} Z`}
            fill={pal.clayLo}
            opacity="0.9"
          />
          <path d={`M${VAT.x1 - 14} ${VAT.rim} L${VAT.x2 + 14} ${VAT.rim} L${VAT.x2 + 14} ${VAT.rim + 9} L${VAT.x1 - 14} ${VAT.rim + 9} Z`} fill={pal.clayHi} opacity="0.55" />
        </g>

        {/* 标注：纸膜 / 水面，收在安全区内，不与槽体重叠 */}
        <g opacity={easeOut(seg(prog, 0.7, 0.88)) * textOut} fontFamily={s.mono} letterSpacing="1.2">
          <line x1="1040" y1="330" x2="1096" y2="330" stroke={pal.accent} strokeWidth="1" opacity="0.5" />
          <text x="1040" y="322" fill={pal.accent} fontSize="15">
            纸膜
          </text>
          <text x="1040" y="352" fill={pal.muted} fontSize="14" opacity="0.7">
            厚薄全靠手
          </text>
          <line x1="1040" y1="386" x2="1096" y2="386" stroke={pal.muted} strokeWidth="1" opacity="0.3" />
          <text x="1040" y="404" fill={pal.muted} fontSize="14" opacity="0.7">
            水面 · 与帘面齐
          </text>
        </g>
      </svg>
    </div>
  );
}

