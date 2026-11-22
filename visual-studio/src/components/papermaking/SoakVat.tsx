/**
 * SoakVat.tsx — 镜头 03「泡到一撕就碎」(SOAK-001)
 *
 * 内容解释：浸泡不是「把东西放在水里」，是水进到纤维之间，把纤维束泡软、泡散。
 * 所以这一镜用水槽的剖面来说明：一团干纤维落水 → 吸水 → 松解 → 分散；
 * 盆壁是斜的（截面有厚度），水色随浸泡加深，气泡从盆底升到水面，
 * 水面涟漪只在落水那一下出现 —— 所有动态都为「吸水」服务。
 */
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperPalette} from './palette';
import {clamp01, easeInOut, easeOut, lerp, mulberry32, seg, strandPath, useShot} from './kit';

type P = Params & {span?: number};

const W = 1280;
const H = 720;

/** 木盆：外壁在内收（斜壁），截面上能看到盆壁的厚度 */
const VAT = {
  outTopL: 150,
  outTopR: 1130,
  inTopL: 190,
  inTopR: 1090,
  top: 262,
  floor: 528,
  outBottom: 566,
  slope: 26,
};
const W_L = VAT.inTopL + VAT.slope; // 内壁底线 x
const W_R = VAT.inTopR - VAT.slope;
const WATER_Y = 294;
const FLOOR_Y = VAT.floor;
const CX = (VAT.inTopL + VAT.inTopR) / 2;

const DROP_FROM = 186;
const DROP_TO = WATER_Y + 46;

/** 悬在水里的纤维：从落水点向四周散开，越泡越长、越泡越散 */
const FIBERS = (() => {
  const r = mulberry32(0x0a51);
  return Array.from({length: 220}, () => {
    const t = r();
    const hx = VAT.inTopL + 40 + r() * (VAT.inTopR - VAT.inTopL - 80);
    const hy = WATER_Y + 30 + (FLOOR_Y - WATER_Y - 52) * (0.2 + 0.8 * t);
    return {
      hx,
      hy,
      rot: r() * 180 - 90,
      len: 34 + r() * 60,
      curve: (r() - 0.5) * 30,
      w: 0.8 + r() * 0.7,
      a: 0.26 + r() * 0.3,
      delay: r() * 0.12,
    };
  });
})();

/** 气泡：从盆底上升，越接近水面越淡；泡透后气泡更密 */
const BUBBLES = (() => {
  const r = mulberry32(0x2bc7);
  return Array.from({length: 120}, () => ({
    x: VAT.inTopL + 26 + r() * (VAT.inTopR - VAT.inTopL - 52),
    r: 1.6 + r() * 5,
    phase: r(),
    speed: 0.62 + r() * 0.6,
    wob: r() * Math.PI * 2,
  }));
})();

/** 水里的流向线：极淡，只用来让水「在动」 */
const FLOW = (() => {
  const r = mulberry32(0x7c31);
  return Array.from({length: 14}, () => ({
    x: VAT.inTopL + 30 + r() * (VAT.inTopR - VAT.inTopL - 90),
    y: WATER_Y + 26 + r() * (FLOOR_Y - WATER_Y - 50),
    len: 60 + r() * 130,
    a: 0.05 + r() * 0.06,
    phase: r() * Math.PI * 2,
  }));
})();

/** 溅起的水珠：落水瞬间的抛物线 */
const SPLASH = (() => {
  const r = mulberry32(0x1189);
  return Array.from({length: 14}, () => ({
    vx: (r() - 0.5) * 250,
    vy: 190 + r() * 150,
    r: 0.8 + r() * 1.6,
    t: 0.04 + r() * 0.34,
  }));
})();

/** 干纤维团：一团乱麻，落水后摊开 */
const CLUMP = (() => {
  const r = mulberry32(0x33af);
  return Array.from({length: 30}, (_, i) => ({
    x1: (r() - 0.5) * 104,
    y1: (r() - 0.5) * 58,
    x2: (r() - 0.5) * 104,
    y2: (r() - 0.5) * 58,
    a: 0.5 + r() * 0.4,
    d: i / 30,
  }));
})();

export function SoakVat({params, theme}: SceneProps) {
  const p = params as P;
  const s = resolveStyle(theme, params);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 3.8);

  const soak = easeInOut(seg(prog, 0.16, 0.92));
  const drop = easeOut(seg(prog, 0.02, 0.17));
  const impact = seg(prog, 0.16, 0.62);
  const spread = easeOut(seg(prog, 0.2, 0.86));
  const clump = 1 - easeInOut(seg(prog, 0.22, 0.52));

  const qKicker = easeOut(seg(prog, 0.1, 0.24));
  const qTitle = easeOut(seg(prog, 0.12, 0.32));
  const qSub = easeOut(seg(prog, 0.12, 0.34));
  const qNote = easeOut(seg(prog, 0.3, 0.55));

  const dropY = lerp(DROP_FROM, DROP_TO, drop);
  const squash = 1 + 0.22 * Math.max(0, impact - 0.06) * (1 - impact);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: '-16%', background: pal.page}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="sv-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={pal.waterHi} stopOpacity="0.92" />
            <stop offset="0.5" stopColor={pal.waterMid} stopOpacity="0.94" />
            <stop offset="1" stopColor={pal.waterLo} stopOpacity="0.97" />
          </linearGradient>
          <linearGradient id="sv-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={pal.clayHi} />
            <stop offset="0.3" stopColor={pal.clayMid} />
            <stop offset="1" stopColor={pal.clayLo} />
          </linearGradient>
          <linearGradient id="sv-wall-in" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={pal.tankIn} />
            <stop offset="1" stopColor={pal.tankLo} />
          </linearGradient>
          <linearGradient id="sv-glass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={pal.foam} stopOpacity="0" />
            <stop offset="0.45" stopColor={pal.foam} stopOpacity="0.14" />
            <stop offset="1" stopColor={pal.foam} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sv-depth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.16" />
          </linearGradient>
          <radialGradient id="sv-table" cx="0.5" cy="0.5" r="0.62">
            <stop offset="0" stopColor={pal.shadow} stopOpacity="0.24" />
            <stop offset="1" stopColor={pal.shadow} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sv-vignette" cx="0.5" cy="0.46" r="0.82">
            <stop offset="0.5" stopColor={pal.tankLo} stopOpacity="0" />
            <stop offset="1" stopColor={pal.tankLo} stopOpacity="0.28" />
          </radialGradient>
          <filter id="sv-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="sv-blur2" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
          <clipPath id="sv-water-clip">
            <polygon points={`${VAT.inTopL},${WATER_Y} ${VAT.inTopR},${WATER_Y} ${W_R},${FLOOR_Y} ${W_L},${FLOOR_Y}`} />
          </clipPath>
        </defs>

        {/* 台面 */}
        <rect width={W} height={H} fill={pal.page} />
        <ellipse cx={CX} cy={VAT.outBottom + 12} rx={530} ry={44} fill="url(#sv-table)" />

        {/* 文本区 */}
        <g>
          <text x={VAT.outTopL} y="120" fill={s.accent} fontFamily={s.mono} fontSize="18" letterSpacing="5" opacity={qKicker}>
            STEP 01 / 浸泡
          </text>
          <line x1={VAT.outTopL} y1="132" x2={VAT.outTopL + 46 * qKicker} y2="132" stroke={s.accent} strokeWidth="2" />
          <text x={VAT.outTopL} y="198" fill={s.fg} fontFamily={s.display} fontSize="62" fontWeight="500" opacity={qTitle * 0.95}>
            泡到一撕就碎。
          </text>
          <text x={VAT.outTopL} y="238" fill={s.muted} fontFamily={s.font} fontSize="21" opacity={qSub * 0.9}>
            水进到纤维之间，纤维束才会松开
          </text>
          <text x={VAT.outTopR} y="120" textAnchor="end" fill={s.muted} fontFamily={s.mono} fontSize="16" letterSpacing="3" opacity={qKicker * 0.9}>
            SECTION · 水槽剖面
          </text>
          <text x={VAT.outTopR} y="144" textAnchor="end" fill={s.muted} fontFamily={s.mono} fontSize="15" letterSpacing="3" opacity={qKicker * 0.42}>
            古法造纸 · 第一道工序
          </text>
          <text x={VAT.outTopR} y="166" textAnchor="end" fill={s.muted} fontFamily={s.mono} fontSize="15" letterSpacing="3" opacity={qNote * 0.75}>
            纤维吸水 → 松解 → 分离
          </text>
        </g>

        {/* 木盆：外壁 + 斜内壁 + 盆底 */}
        <g>
          {/* 盆壁（截面厚度）：左右各一块梯形 */}
          <polygon
            points={`${VAT.outTopL},${VAT.top} ${VAT.inTopL},${VAT.top} ${W_L},${FLOOR_Y} ${VAT.outTopL + 16},${VAT.outBottom}`}
            fill="url(#sv-wood)"
          />
          <polygon
            points={`${VAT.outTopR},${VAT.top} ${VAT.inTopR},${VAT.top} ${W_R},${FLOOR_Y} ${VAT.outTopR - 16},${VAT.outBottom}`}
            fill="url(#sv-wood)"
          />
          {/* 盆底 */}
          <polygon
            points={`${VAT.outTopL + 16},${VAT.outBottom} ${VAT.outTopR - 16},${VAT.outBottom} ${W_R},${FLOOR_Y} ${W_L},${FLOOR_Y}`}
            fill={pal.tankDark}
          />
          {/* 内壁（水面以上可见） */}
          <polygon
            points={`${VAT.inTopL},${VAT.top} ${VAT.inTopR},${VAT.top} ${VAT.inTopR},${WATER_Y} ${VAT.inTopL},${WATER_Y}`}
            fill="url(#sv-wall-in)"
            opacity="0.9"
          />
          {/* 木纹 */}
          {Array.from({length: 10}, (_, i) => (
            <line
              key={`grain-${i}`}
              x1={VAT.outTopL + 3}
              y1={VAT.top + 22 + i * 30}
              x2={VAT.outTopL + 13}
              y2={VAT.top + 26 + i * 30}
              stroke={pal.tankDark}
              strokeWidth="1"
              opacity="0.22"
            />
          ))}
          {Array.from({length: 10}, (_, i) => (
            <line
              key={`grain-r-${i}`}
              x1={VAT.outTopR - 3}
              y1={VAT.top + 22 + i * 30}
              x2={VAT.outTopR - 13}
              y2={VAT.top + 26 + i * 30}
              stroke={pal.tankDark}
              strokeWidth="1"
              opacity="0.22"
            />
          ))}
          {/* 盆沿与盆脚的暗线 */}
          <line x1={VAT.outTopL} y1={VAT.top} x2={VAT.inTopL} y2={VAT.top} stroke={pal.clayHi} strokeWidth="1.6" opacity="0.55" />
          <line x1={VAT.inTopR} y1={VAT.top} x2={VAT.outTopR} y2={VAT.top} stroke={pal.clayHi} strokeWidth="1.6" opacity="0.55" />
          <line x1={VAT.inTopL} y1={VAT.top} x2={VAT.inTopR} y2={VAT.top} stroke={pal.vignette} strokeWidth="1.2" opacity="0.45" />
          <line x1={VAT.outTopL + 16} y1={VAT.outBottom} x2={VAT.outTopR - 16} y2={VAT.outBottom} stroke={pal.vignette} strokeWidth="2" opacity="0.4" />
        </g>

        {/* 落水的干纤维团：画在水体之下，入水后自然被水吞掉 */}
        <g opacity={clump}>
          <g transform={`translate(${CX} ${dropY}) scale(1.32 ${1.32 / squash})`}>
            <ellipse cx="0" cy="0" rx="52" ry="30" fill={pal.lump} opacity="0.2" />
            {CLUMP.map((c, i) => (
              <line
                key={`clump-${i}`}
                x1={c.x1}
                y1={c.y1}
                x2={c.x2}
                y2={c.y2}
                stroke={pal.lumpFiber}
                strokeWidth="1.4"
                strokeOpacity={c.a}
                strokeLinecap="round"
                transform={`rotate(${c.d * 40})`}
              />
            ))}
          </g>
        </g>

        {/* 水体 */}
        <g clipPath="url(#sv-water-clip)">
          <rect x={VAT.inTopL} y={WATER_Y} width={VAT.inTopR - VAT.inTopL} height={FLOOR_Y - WATER_Y} fill="url(#sv-water)" />
          <rect x={VAT.inTopL} y={WATER_Y} width={VAT.inTopR - VAT.inTopL} height={FLOOR_Y - WATER_Y} fill={pal.waterLo} opacity={0.04 + soak * 0.14} />
          <rect x={VAT.inTopL} y={WATER_Y} width={VAT.inTopR - VAT.inTopL} height={FLOOR_Y - WATER_Y} fill="url(#sv-depth)" />

          {FLOW.map((f, i) => {
            const dx = Math.sin(prog * 2 + f.phase) * 26;
            return (
              <line key={`flow-${i}`} x1={f.x + dx} y1={f.y} x2={f.x + dx + f.len} y2={f.y - 4} stroke={pal.foam} strokeWidth="1" opacity={f.a} />
            );
          })}

          {/* 纤维：从落点散开，吸水后变长变散 */}
          {FIBERS.map((f, i) => {
            const d = easeOut(seg(prog, 0.2 + f.delay, 0.86 + f.delay));
            const x = lerp(CX + (f.hx - CX) * 0.1, f.hx, d) + Math.sin(prog * 3 + i) * 3 * d;
            const y = lerp(DROP_TO + (f.hy - DROP_TO) * 0.08, f.hy, d) + Math.cos(prog * 2.4 + i * 0.6) * 4 * d;
            const len = f.len * (0.7 + 0.3 * soak) * (0.6 + 0.4 * d);
            return (
              <path
                key={`fib-${i}`}
                d={strandPath(f, x, y, f.rot + soak * 6, len)}
                stroke={pal.foam}
                strokeWidth={f.w}
                strokeOpacity={clamp01(f.a * (0.3 + 0.7 * d))}
                fill="none"
                strokeLinecap="round"
                filter={i % 6 === 0 ? 'url(#sv-blur2)' : undefined}
              />
            );
          })}

          {/* 盆底沉积的浆垫 */}
          <ellipse cx={CX} cy={FLOOR_Y - 10} rx={410} ry="14" fill={pal.waterMid} opacity={0.16 + soak * 0.18} filter="url(#sv-soft)" />

          {/* 气泡 */}
          {BUBBLES.map((b, i) => {
            const cyc = (prog * 2.2 * b.speed + b.phase) % 1;
            const y = lerp(FLOOR_Y - 8, WATER_Y + 2, cyc);
            const r = b.r * (0.7 + cyc * 0.55);
            const a = 0.5 * (1 - Math.pow(cyc, 3)) * (0.35 + soak * 0.65);
            const wob = Math.sin(cyc * 6 + b.wob) * 3;
            return (
              <g key={`bub-${i}`}>
                <circle cx={b.x + wob} cy={y} r={r} fill="none" stroke={pal.bubble} strokeWidth="0.9" opacity={a} />
                <circle cx={b.x + wob - r * 0.32} cy={y - r * 0.34} r={r * 0.3} fill={pal.foam} opacity={a * 0.55} />
              </g>
            );
          })}

          {/* 斜壁在水里的暗边：让水体有厚度 */}
          <polygon
            points={`${VAT.inTopL},${WATER_Y} ${VAT.inTopL + 16},${WATER_Y} ${W_L + 10},${FLOOR_Y} ${W_L},${FLOOR_Y}`}
            fill={pal.ink}
            opacity="0.35"
          />
          <polygon
            points={`${VAT.inTopR},${WATER_Y} ${VAT.inTopR - 16},${WATER_Y} ${W_R - 10},${FLOOR_Y} ${W_R},${FLOOR_Y}`}
            fill={pal.ink}
            opacity="0.32"
          />
        </g>

        {/* 水面 */}
        <g>
          <line x1={VAT.inTopL} y1={WATER_Y} x2={VAT.inTopR} y2={WATER_Y} stroke={pal.foam} strokeWidth="1.8" opacity="0.7" />
          <rect x={VAT.inTopL} y={WATER_Y - 4} width={VAT.inTopR - VAT.inTopL} height="12" fill={pal.foam} opacity="0.1" filter="url(#sv-soft)" />
          {Array.from({length: 5}, (_, i) => {
            const ph = i * 0.9;
            const cx = VAT.inTopL + 170 + i * 195 + Math.sin(prog * 3 + ph) * 18;
            return (
              <ellipse key={`rip-${i}`} cx={cx} cy={WATER_Y + 2} rx={30 + i * 9} ry="3.4" fill="none" stroke={pal.foam} strokeWidth="1" opacity="0.26" />
            );
          })}
          {Array.from({length: 3}, (_, i) => {
            const t = clamp01((impact - i * 0.12) / 0.7);
            if (t <= 0 || t >= 1) return null;
            return (
              <ellipse
                key={`splash-${i}`}
                cx={CX}
                cy={WATER_Y + 3}
                rx={12 + t * (68 + i * 24)}
                ry={4 + t * (13 + i * 6)}
                fill="none"
                stroke={pal.foam}
                strokeWidth={1.5 - t}
                opacity={(1 - t) * 0.42}
              />
            );
          })}
          {SPLASH.map((d, i) => {
            const t = clamp01((impact - d.t) / 0.42);
            if (t <= 0 || t >= 1) return null;
            const x = CX + d.vx * t;
            const y = WATER_Y - (d.vy * t - 210 * t * t);
            return <circle key={`spt-${i}`} cx={x} cy={y} r={d.r} fill={pal.foam} opacity={(1 - t) * 0.5} />;
          })}
        </g>

        {/* 前景玻璃反光 */}
        <g opacity="0.45">
          <rect x={VAT.inTopL} y={WATER_Y} width="46" height={FLOOR_Y - WATER_Y} fill="url(#sv-glass)" />
          <rect x={VAT.inTopR - 36} y={WATER_Y} width="36" height={FLOOR_Y - WATER_Y} fill="url(#sv-glass)" />
        </g>

        <rect width={W} height={H} fill="url(#sv-vignette)" pointerEvents="none" />
      </svg>
    </div>
  );
}

