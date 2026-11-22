/**
 * PoundMortar.tsx — 镜头 04「第二道：捣」(POUND-001)
 *
 * 内容解释：捣不是「敲一下」，是把泡软的纤维反复舂，把纤维束打断、打散，
 * 浆越细，抄出来的纸面越平。所以主体动作是「杵—臼—浆」三者的循环：
 * 杵抬起（蓄力）→ 快速落下（冲击）→ 臼体受压微沉、浆面荡开、纤维被打短。
 * 画面右侧只有石臼与杵，没有多余信息；文字只负责命名工序与结果。
 */
import React from 'react';
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperBackdrop, paperPalette} from './palette';
import {clamp01, easeInOut, easeOut, lerp, mulberry32, seg, useShot} from './kit';

type P = Params & {span?: number; hits?: number};
const W = 1280;
const H = 720;

const MILL = {cx: 858, top: 372, rxTop: 186, ryTop: 50, bodyHalf: 146, floor: 566};

/** 杵的落点与抬起高度：杵头要压得住臼口，杵身比臼口窄一档，才像木头而不是针管 */
const PESTLE = {topY: 150, hitY: 356, w: 56, headW: 104, headH: 104};

const PUMP = (() => {
  const r = mulberry32(0x7c31);
  return Array.from({length: 96}, () => ({
    x: (r() - 0.5) * 300,
    y: (r() - 0.5) * 46,
    len: 8 + r() * 26,
    rot: r() * 360,
    a: 0.16 + r() * 0.34,
    w: 0.5 + r() * 1.1,
    ph: r() * 6.28,
  }));
})();

const SPRAY = (() => {
  const r = mulberry32(0x51b9);
  return Array.from({length: 22}, () => ({
    ang: -Math.PI * 0.78 + r() * Math.PI * 1.56,
    dist: 40 + r() * 150,
    r: 0.9 + r() * 2.6,
    sp: 0.6 + r() * 0.9,
  }));
})();

export function PoundMortar({params, theme}: SceneProps) {
  const p = params as P;
  const s = resolveStyle(theme, p);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 5.2);

  const hits = Math.max(3, Math.min(12, Math.round(p.hits ?? 7)));
  const beat = clamp01(seg(prog, 0.1, 0.9)) * hits;
  const idx = Math.floor(beat);
  const local = beat - idx;

  // 抬杵：正弦起落，末段突然加速落下（力感来自加速度而不是位移）
  const lift = Math.pow(Math.sin(Math.PI * Math.min(1, local)), 0.72);
  const pestleY = lerp(PESTLE.hitY, PESTLE.topY, easeInOut(lift));
  const impact = Math.max(0, 1 - Math.min(local, 1 - local) * 12);
  const squash = 1 - 0.014 * impact;
  const ring = clamp01((local < 0.5 ? local + 0.5 : local - 0.5) * 2);

  // 浆：随舂捣次数变浓、变细、变平
  const refine = easeInOut(seg(prog, 0.12, 0.9));
  const pulpTop = lerp(MILL.top + 26, MILL.top - 6, refine);
  const fiberLen = lerp(1, 0.55, refine);

  // 文字节奏：标头 8%，标题 14%，副题 26%，注 42%
  const qKick = easeOut(seg(prog, 0.05, 0.18));
  const qTitle = easeOut(seg(prog, 0.1, 0.3));
  const qSub = easeOut(seg(prog, 0.2, 0.42));
  const qNote = easeOut(seg(prog, 0.36, 0.6));
  const textOut = 1 - easeInOut(seg(prog, 0.84, 0.96));
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: '-16%', background: paperBackdrop(pal, theme)}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="pm-stone" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor={pal.clayHi} />
            <stop offset="0.55" stopColor={pal.clayMid} />
            <stop offset="1" stopColor={pal.clayLo} />
          </linearGradient>
          <linearGradient id="pm-stone-in" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={pal.tankDark} />
            <stop offset="1" stopColor={pal.tankLo} />
          </linearGradient>
          <linearGradient id="pm-wood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={pal.clayLo} />
            <stop offset="0.35" stopColor={pal.clayHi} />
            <stop offset="1" stopColor={pal.clayMid} />
          </linearGradient>
          <radialGradient id="pm-pulp" cx="0.5" cy="0.35" r="0.75">
            <stop offset="0" stopColor={pal.paperHi} />
            <stop offset="0.55" stopColor={pal.lumpFiber} />
            <stop offset="1" stopColor={pal.lump} />
          </radialGradient>
          <filter id="pm-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="pm-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="3" seed="9" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.26  0 0 0 0 0.31  0 0 0 0.6 0" />
          </filter>
        </defs>

        <rect width={W} height={H} opacity="0.05" filter="url(#pm-grain)" />

        {/* 工序号水印：压住左下的空白，和右上标头呼应 */}
        <text x="86" y="566" fill={pal.muted} opacity="0.07" fontFamily={s.display} fontSize="210" letterSpacing="-6">
          02
        </text>

        {/* 地面投影：臼与杵的重量感 */}
        <ellipse cx={MILL.cx + 10} cy={MILL.floor + 14} rx="230" ry="22" fill={pal.shadow} opacity="0.22" filter="url(#pm-soft)" />

        {/* 标头 */}
        <g opacity={qKick * textOut}>
          <text x="110" y="96" fill={pal.accent} fontFamily={s.mono} fontSize="17" letterSpacing="5">
            STEP 02 / 捣
          </text>
          <line x1="110" y1="112" x2={110 + 34 * qKick} y2="112" stroke={pal.accent} strokeWidth="2" />
          <text x="1176" y="96" textAnchor="end" fill={pal.muted} fontFamily={s.mono} fontSize="16" letterSpacing="3">
            SECTION · 石臼剖面
          </text>
          <text x="1176" y="118" textAnchor="end" fill={pal.muted} fontFamily={s.mono} fontSize="15" letterSpacing="2">
            古法造纸 · 第二道工序
          </text>
        </g>

        {/* 标题 */}
        <g opacity={textOut}>
          <text x="110" y="212" fill={pal.ink} fontFamily={s.display} fontSize="62" fontWeight="500" opacity={qTitle}>
            {String(p.title || '第二道，捣')}
          </text>
          <text x="110" y="262" fill={pal.muted} fontFamily={s.font} fontSize="22" opacity={qSub * 0.92}>
            {String(p.subtitle || '捣得越细，纸越平')}
          </text>
          <line x1="110" y1="290" x2={110 + 196 * qTitle} y2="290" stroke={pal.accent} strokeWidth="2" />
          <g opacity={qNote * 0.9}>
            <text x="110" y="330" fill={pal.muted} fontFamily={s.font} fontSize="16" letterSpacing="0.5">
              泡透的纤维，舂成细浆
            </text>
            <text x="110" y="356" fill={pal.muted} fontFamily={s.mono} fontSize="15" letterSpacing="2">
              杵落 → 纤维束被打断 → 浆变细
            </text>
          </g>
        </g>

        {/* 右侧工序计数：随每一次落下进位 */}
        <g opacity={qKick * textOut} transform="translate(1176 300)">
          <text textAnchor="end" fill={pal.accent} fontFamily={s.mono} fontSize="15" letterSpacing="2">
            {`HIT ${String(Math.min(hits, idx + 1)).padStart(2, '0')} / ${String(hits).padStart(2, '0')}`}
          </text>
          {Array.from({length: hits}, (_, i) => (
            <rect key={i} x={-6 - i * 12} y={12} width="6" height={i < idx ? 14 : 5} fill={i < idx ? pal.accent : pal.muted} opacity={i < idx ? 0.95 : 0.35} rx="1" />
          ))}
        </g>

        {/* 右侧标注：统一收在右上空白区，避开臼体与 HIT 计数 */}
        <g opacity={qNote * textOut} fontFamily={s.mono} letterSpacing="1.2">
          <text x="1040" y="156" fill={pal.accent} fontSize="15">
            石臼 · 青石凿制
          </text>
          <text x="1040" y="180" fill={pal.muted} fontSize="14" opacity="0.8">
            木杵 · 枣木 · 头宽 8cm
          </text>
          <text x="1040" y="206" fill={pal.accent} fontSize="15">
            浆 · 细度
          </text>
          <rect x="1040" y="214" width="54" height="3" fill={pal.muted} opacity="0.22" rx="1.5" />
          <rect x="1040" y="214" width={54 * refine} height="3" fill={pal.accent} opacity="0.9" rx="1.5" />
          <text x="1104" y="218" fill={pal.muted} fontSize="14" opacity="0.8">
            {refine > 0.62 ? '细浆' : '粗浆'}
          </text>
        </g>

        <g transform={`translate(${MILL.cx} ${MILL.floor}) scale(1 ${squash}) translate(${-MILL.cx} ${-MILL.floor})`}>
          {/* 臼身：剖一半的石臼，能看到内部浆面 */}
          <path
            d={`M${MILL.cx - MILL.rxTop} ${MILL.top}
                C ${MILL.cx - MILL.rxTop - 6} ${MILL.top + 90}, ${MILL.cx - MILL.bodyHalf - 8} ${MILL.floor - 46}, ${MILL.cx - MILL.bodyHalf} ${MILL.floor - 20}
                L ${MILL.cx + MILL.bodyHalf} ${MILL.floor - 20}
                C ${MILL.cx + MILL.bodyHalf + 8} ${MILL.floor - 46}, ${MILL.cx + MILL.rxTop + 6} ${MILL.top + 90}, ${MILL.cx + MILL.rxTop} ${MILL.top} Z`}
            fill="url(#pm-stone)"
          />
          {/* 断面厚度 */}
          <path
            d={`M${MILL.cx - MILL.rxTop} ${MILL.top} C ${MILL.cx - MILL.rxTop - 6} ${MILL.top + 90}, ${MILL.cx - MILL.bodyHalf - 8} ${MILL.floor - 46}, ${MILL.cx - MILL.bodyHalf} ${MILL.floor - 20}`}
            fill="none"
            stroke={pal.tankLo}
            strokeWidth="3"
            opacity="0.5"
          />
          {/* 石质肌理：裁在臼身里的极淡斑块，避免看起来像一块蓝色塑料 */}
          <g opacity="0.22">
            {Array.from({length: 14}, (_, i) => {
              const r = mulberry32(0x3b19 + i * 11);
              const cx = MILL.cx - MILL.bodyHalf + 20 + r() * (MILL.bodyHalf * 2 - 40);
              const cy = MILL.top + 60 + r() * (MILL.floor - MILL.top - 90);
              return (
                <ellipse
                  key={`stone-${i}`}
                  cx={cx}
                  cy={cy}
                  rx={10 + r() * 30}
                  ry={6 + r() * 14}
                  fill={r() > 0.5 ? pal.tankLo : pal.clayHi}
                  opacity={0.1 + r() * 0.14}
                />
              );
            })}
          </g>
          {/* 臼身下缘的落地暗部 */}
          <path
            d={`M${MILL.cx - MILL.bodyHalf} ${MILL.floor - 22} Q${MILL.cx} ${MILL.floor - 4} ${MILL.cx + MILL.bodyHalf} ${MILL.floor - 22}`}
            fill="none"
            stroke={pal.vignette}
            strokeWidth="10"
            opacity="0.14"
            filter="url(#pm-soft)"
          />
          {/* 臼沿 */}
          <ellipse cx={MILL.cx} cy={MILL.top} rx={MILL.rxTop} ry={MILL.ryTop} fill="url(#pm-stone-in)" />
          <ellipse cx={MILL.cx} cy={MILL.top} rx={MILL.rxTop} ry={MILL.ryTop} fill="none" stroke={pal.clayHi} strokeWidth="2.4" opacity="0.62" />
          <ellipse cx={MILL.cx} cy={MILL.top + 5} rx={MILL.rxTop - 14} ry={MILL.ryTop - 6} fill="none" stroke={pal.vignette} strokeWidth="1.2" opacity="0.45" />

          {/* 浆面 */}
          <clipPath id="pm-pulp-clip">
            <ellipse cx={MILL.cx} cy={MILL.top + 2} rx={MILL.rxTop - 12} ry={MILL.ryTop - 4} />
          </clipPath>
          <g clipPath="url(#pm-pulp-clip)">
            <ellipse cx={MILL.cx} cy={pulpTop} rx={MILL.rxTop - 10} ry={MILL.ryTop - 2} fill="url(#pm-pulp)" opacity="0.98" />
            {/* 杵头压出的凹坑：浆不是平的，落点处往下沉 */}
            <ellipse
              cx={MILL.cx}
              cy={pulpTop + 6}
              rx={PESTLE.headW / 2 - 4}
              ry={PESTLE.headW / 5}
              fill={pal.shadow}
              opacity={0.18 + impact * 0.3}
            />
            <ellipse
              cx={MILL.cx}
              cy={pulpTop + 2}
              rx={PESTLE.headW / 2 + 4}
              ry={PESTLE.headW / 5 + 3}
              fill="none"
              stroke={pal.paperHi}
              strokeWidth="2"
              opacity={0.35 + impact * 0.4}
            />
            {/* 被打散的短纤维，越捣越短 */}
            {PUMP.map((f, i) => {
              const wob = Math.sin(prog * 9 + f.ph) * 3;
              const l = f.len * fiberLen;
              return (
                <line
                  key={`pulp-${i}`}
                  x1={MILL.cx + f.x}
                  y1={pulpTop + f.y + wob}
                  x2={MILL.cx + f.x + Math.cos((f.rot * Math.PI) / 180) * l}
                  y2={pulpTop + f.y + wob + Math.sin((f.rot * Math.PI) / 180) * l * 0.28}
                  stroke={pal.fiber}
                  strokeWidth={f.w}
                  strokeOpacity={f.a}
                  strokeLinecap="round"
                />
              );
            })}
            {/* 冲击涟漪：一次落下荡开一圈 */}
            <ellipse
              cx={MILL.cx}
              cy={pulpTop + 4}
              rx={26 + ring * 140}
              ry={8 + ring * 34}
              fill="none"
              stroke={pal.paperHi}
              strokeWidth="2"
              opacity={0.55 * (1 - ring) * (0.4 + impact * 0.6)}
            />
          </g>

          {/* 冲击溅起的浆点 */}
          {SPRAY.map((d, i) => {
            const t = impact;
            const x = MILL.cx + Math.cos(d.ang) * d.dist * t;
            const y = MILL.top - 6 - Math.sin(Math.abs(d.ang)) * d.dist * 0.55 * t + 40 * t * t;
            const a = impact * (1 - t) * 0.9;
            return a > 0.02 ? <circle key={`sp-${i}`} cx={x} cy={y} r={d.r} fill={pal.paperHi} opacity={a} /> : null;
          })}

          {/* 臼沿被杵顶出的接触暗影 */}
          <ellipse cx={MILL.cx} cy={MILL.top + 2} rx={PESTLE.headW / 2 + 10} ry="12" fill={pal.vignette} opacity={0.14 + impact * 0.18} filter="url(#pm-soft)" />
        </g>

        {/* 木杵：从上方落下，杵头正面压进臼沿（不参与臼体压缩） */}
        <g>
          {/* 杵身：上端出画，带木纹与明暗，读起来是一根立着的木杆 */}
          <rect x={MILL.cx - PESTLE.w / 2} y={pestleY - 340} width={PESTLE.w} height="340" rx="10" fill="url(#pm-wood)" />
          {[0, 1, 2].map((i) => (
            <rect
              key={`grain-${i}`}
              x={MILL.cx - PESTLE.w / 2 + 9 + i * 16}
              y={pestleY - 330}
              width={1.6 + i}
              height="320"
              fill={pal.tankLo}
              opacity={0.1 + i * 0.03}
            />
          ))}
          <rect x={MILL.cx - PESTLE.w / 2 + 3} y={pestleY - 340} width="5" height="340" fill={pal.paperHi} opacity="0.36" />
          <rect x={MILL.cx + PESTLE.w / 2 - 8} y={pestleY - 340} width="5" height="340" fill={pal.vignette} opacity="0.2" />
          {/* 杵头：比杵身宽，下缘有一个圆形端面 */}
          <path
            d={`M${MILL.cx - PESTLE.w / 2} ${pestleY - PESTLE.headH}
                L${MILL.cx - PESTLE.headW / 2} ${pestleY - PESTLE.headH + 18}
                Q${MILL.cx - PESTLE.headW / 2} ${pestleY + 4} ${MILL.cx - PESTLE.headW / 2 + 16} ${pestleY + 4}
                L${MILL.cx + PESTLE.headW / 2 - 16} ${pestleY + 4}
                Q${MILL.cx + PESTLE.headW / 2} ${pestleY + 4} ${MILL.cx + PESTLE.headW / 2} ${pestleY - PESTLE.headH + 18}
                L${MILL.cx + PESTLE.w / 2} ${pestleY - PESTLE.headH} Z`}
            fill="url(#pm-wood)"
          />
          <path
            d={`M${MILL.cx - PESTLE.headW / 2 + 14} ${pestleY - 2} Q${MILL.cx} ${pestleY + 14} ${MILL.cx + PESTLE.headW / 2 - 14} ${pestleY - 2}`}
            fill="none"
            stroke={pal.paperHi}
            strokeWidth="3"
            opacity="0.5"
          />
          <ellipse cx={MILL.cx} cy={pestleY + 4} rx={PESTLE.headW / 2 - 10} ry="10" fill={pal.clayMid} opacity="0.9" />
          <ellipse cx={MILL.cx} cy={pestleY + 7} rx={PESTLE.headW / 2 - 18} ry="7" fill={pal.tankLo} opacity={0.4 + impact * 0.4} />
        </g>
      </svg>
    </div>
  );
}

