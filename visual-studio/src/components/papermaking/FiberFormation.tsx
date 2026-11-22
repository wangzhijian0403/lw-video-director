/**
 * FiberFormation.tsx — 镜头 01「一张纸，四道工序」(PAPER-001)
 *
 * 内容解释：纸不是现成的，它是纸浆被抄起、水走、纤维留下来的结果。
 * 所以主体动作是「抄纸」：浆水从左向右铺过帘面，纤维顺水流落定并交织，
 * 纸面跟着水线显影；镜头从纤维肌理（大特写）拉开到全幅 —— 先看见「纤维」，再看见「纸」。
 * 结尾 0.85s：纤维重新松散、向四外散开，作为给镜头 02「四种原料」的交接动作。
 */
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperBackdrop, paperPalette} from './palette';
import {clamp01, decklePath, easeInOut, easeOut, lerp, mulberry32, seg, strandPath, useShot} from './kit';

type P = Params & {span?: number};

const W = 1280;
const H = 720;
const SHEET = {x: 86, y: 46, w: 1108, h: 560};
const DECKLE = decklePath(SHEET.x, SHEET.y, SHEET.w, SHEET.h, 0x9e37, 4.5);

type Fiber = {
  x: number;
  y: number;
  rot: number;
  len: number;
  curve: number;
  w: number;
  a: number;
  sx: number;
  sy: number;
  delay: number;
  dur: number;
  outAngle: number;
};

/**
 * 500 根纤维：
 * 落点在纸面网格上抖动，主流方向±16°（手工纸的纤维是「顺帘」的，不是乱草），
 * 约 1/4 反向交叉，形成帘纹；入口统一在画面左侧（浆水推进方向），
 * 延迟按落点 x 排开 —— 左边先落，右边后落，视觉上是一条推进的水线。
 */
const FIBERS: Fiber[] = (() => {
  const r = mulberry32(0x51a7c3);
  const list: Fiber[] = [];
  const cols = 44;
  const rows = 34;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (r() > 0.5) continue;
      const cx = SHEET.x + 8 + (i + 0.5) * ((SHEET.w - 16) / cols);
      const cy = SHEET.y + 8 + (j + 0.5) * ((SHEET.h - 16) / rows);
      const cross = r() < 0.24;
      const sweep = (cx - SHEET.x) / SHEET.w;
      list.push({
        x: cx + (r() - 0.5) * 16,
        y: cy + (r() - 0.5) * 14,
        rot: cross ? 56 + r() * 36 : -16 + r() * 32,
        len: 20 + r() * 46,
        curve: (r() - 0.5) * 26,
        w: 0.32 + r() * 0.42,
        a: 0.06 + r() * 0.1,
        sx: SHEET.x - 340 - r() * 260,
        sy: cy + (r() - 0.5) * 46,
        delay: 0.03 + sweep * 0.3 + r() * 0.06,
        dur: 0.24 + r() * 0.16,
        outAngle: (Math.atan2(cy - 320, cx - 640) * 180) / Math.PI,
      });
    }
  }
  return list;
})();

/** 纸面里的细小纤维点：让纸看起来是「纤维堆出来的」，不是纯色块 */
const SPECKS = (() => {
  const r = mulberry32(0x31b9);
  return Array.from({length: 240}, () => ({
    x: SHEET.x + 12 + r() * (SHEET.w - 24),
    y: SHEET.y + 12 + r() * (SHEET.h - 24),
    r: 0.5 + r() * 1.7,
    a: 0.08 + r() * 0.2,
  }));
})();

/** 帘纹：纤维落定后补一层交叉短线，让纸面出现抄纸帘的网格 */
const WEAVE = (() => {
  const r = mulberry32(0x77e1);
  return Array.from({length: 170}, () => ({
    x: SHEET.x + 10 + r() * (SHEET.w - 20),
    y: SHEET.y + 10 + r() * (SHEET.h - 20),
    rot: r() < 0.5 ? 60 + r() * 22 : -60 - r() * 22,
    len: 28 + r() * 70,
    a: 0.04 + r() * 0.06,
  }));
})();

/** 抄纸帘：竹丝斜织的底纹，纸还没显影时是画面上唯一的「工具」 */
const SCREEN = (() => {
  const list: {x: number; y: number; rot: number; len: number; w: number; a: number}[] = [];
  for (let y = SHEET.y - 40; y < SHEET.y + SHEET.h + 40; y += 17) {
    list.push({x: SHEET.x - 40, y, rot: 64, len: SHEET.w + 120, w: 0.8, a: 0.1});
    list.push({x: SHEET.x - 40, y: y + 8, rot: -64, len: SHEET.w + 120, w: 0.8, a: 0.08});
  }
  for (let x = SHEET.x + 20; x < SHEET.x + SHEET.w; x += 132) {
    list.push({x, y: SHEET.y - 30, rot: 90, len: SHEET.h + 60, w: 1.6, a: 0.08});
  }
  return list;
})();

export function FiberFormation({params, theme}: SceneProps) {  const p = params as P;
  const s = resolveStyle(theme, params);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 3.8);

  // 镜头：1.5 起（纤维肌理大特写，镜头跟着水线走）→ 0.62 处回到全幅 → 末尾极缓推进，避免静止
  const pull = easeInOut(seg(prog, 0.18, 0.62));
  const push = easeOut(seg(prog, 0.62, 1));
  const camScale = lerp(1.5, 1.0, pull) + push * 0.03;
  const camRot = lerp(0.85, 0, pull);

  // 浆水推进：水线从左扫到右，纸面跟着水线显影
  const frontX = lerp(SHEET.x - 46, SHEET.x + SHEET.w + 70, easeInOut(seg(prog, 0.0, 0.55)));
  const frontNorm = clamp01((frontX - SHEET.x) / SHEET.w);
  const camX = lerp(Math.min(980, Math.max(320, frontX)), 640, pull);
  const camY = lerp(300, 312, pull);
  const wetOpacity = 0.5 * (1 - easeInOut(seg(prog, 0.46, 0.72)));

  const weaveIn = easeOut(seg(prog, 0.5, 0.86));
  const out = easeOut(seg(prog, 0.86, 1));

  // 标题分层揭示：眉标 → 第一行 → 第二行 → 朱红短线 + 副题（整体后移，让开场钩子先说完）
  const qKicker = easeOut(seg(prog, 0.58, 0.68));
  const qL1 = easeOut(seg(prog, 0.64, 0.76));
  const qL2 = easeOut(seg(prog, 0.7, 0.8));
  const qRule = easeOut(seg(prog, 0.78, 0.9));

  const grainOpacity = 0.05 + 0.02 * Math.sin(prog * Math.PI * 2);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* 满幅底板：盖住工程层缩放后露出的两侧留白 */}
      <div style={{position: 'absolute', inset: '-16%', background: paperBackdrop(pal, theme)}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="ff-paper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F5F2E6" />
            <stop offset="0.55" stopColor="#EFEADD" />
            <stop offset="1" stopColor="#E4DFD0" />
          </linearGradient>
          {/* 纸面显影：0 到水线之间是纸，水线之后仍是空的帘 */}
          <linearGradient id="ff-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset={frontNorm} stopColor="#fff" stopOpacity="1" />
            <stop offset={Math.min(1, frontNorm + 0.085)} stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          {/* 湿痕：水线处一层暖色反光 */}
          <linearGradient id="ff-wet" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={pal.spot} stopOpacity="0" />
            <stop offset="0.62" stopColor={pal.spot} stopOpacity="0.28" />
            <stop offset="1" stopColor={pal.edge} stopOpacity="0.12" />
          </linearGradient>
          <mask id="ff-sweepmask" maskUnits="userSpaceOnUse" x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h}>
            <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} fill="url(#ff-sweep)" />
          </mask>
          <radialGradient id="ff-vignette" cx="0.5" cy="0.48" r="0.8">            <stop offset="0.52" stopColor={pal.vignette} stopOpacity="0" />
            <stop offset="1" stopColor={pal.vignette} stopOpacity="0.26" />
          </radialGradient>
          <radialGradient id="ff-table" cx="0.5" cy="0.5" r="0.62">
            <stop offset="0" stopColor={pal.shadow} stopOpacity="0.24" />
            <stop offset="1" stopColor={pal.shadow} stopOpacity="0" />
          </radialGradient>
          <filter id="ff-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="3" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.9 0" />
          </filter>
          <filter id="ff-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <clipPath id="ff-clip">
            <path d={DECKLE} />
          </clipPath>
          <clipPath id="ff-clip-l1">
            <rect x="136" y="244" width={580 * qL1} height="126" />
          </clipPath>
          <clipPath id="ff-clip-l2">
            <rect x="136" y="352" width={580 * qL2} height="132" />
          </clipPath>
        </defs>

        {/* 桌面与纸下投影 */}
        <rect width={W} height={H} fill="none" />
        <ellipse cx="640" cy="600" rx="556" ry="112" fill="url(#ff-table)" />

        <g transform={`translate(${camX} ${camY}) rotate(${camRot}) scale(${camScale}) translate(-${camX} -${camY})`}>
          {/* 帘床：纸还没成形时，底下是抄纸帘（竹丝斜纹），它先给一个「工具」的交代 */}
          <g clipPath="url(#ff-clip)" opacity="0.55">
            {SCREEN.map((l, i) => (
              <line
                key={`scr-${i}`}
                x1={l.x}
                y1={l.y}
                x2={l.x + Math.cos((l.rot * Math.PI) / 180) * l.len}
                y2={l.y + Math.sin((l.rot * Math.PI) / 180) * l.len}
                stroke={pal.fiber}
                strokeWidth={l.w}
                opacity={l.a}
              />
            ))}
          </g>

          {/* 纸面本体：沿水线从左显影 */}
          <g clipPath="url(#ff-clip)">
            <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} fill="url(#ff-paper)" mask="url(#ff-sweepmask)" />
            <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} opacity={grainOpacity} filter="url(#ff-grain)" mask="url(#ff-sweepmask)" />
          </g>

          {/* 纤维：跟着水线进入，顺帘落定；结尾重新松散外散 */}
          <g clipPath="url(#ff-clip)">
            {FIBERS.map((f, i) => {
              const a = easeOut(seg(prog, f.delay, f.delay + f.dur));
              const x = lerp(f.sx, f.x, a) + Math.cos((f.outAngle * Math.PI) / 180) * out * 250;
              const y = lerp(f.sy, f.y, a) + Math.sin((f.outAngle * Math.PI) / 180) * out * 168;
              const rot = f.rot + out * (f.rot > 0 ? 24 : -24);
              // 行进中拉长成流线，落定后回到真实长度
              const len = f.len * (1 + 1.1 * (1 - a)) * (1 + out * 0.3);
              const alpha = (0.34 * (1 - a) + f.a * a) * (1 - out * 0.6);
              return (
                <path
                  key={i}
                  d={strandPath(f, x, y, rot, len)}
                  stroke={pal.fiberAlt}
                  strokeWidth={f.w}
                  strokeOpacity={clamp01(alpha)}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* 水线湿痕 */}
          <g clipPath="url(#ff-clip)" opacity={wetOpacity} transform={`translate(${frontX - 300} 0)`}>
            <rect x="0" y={SHEET.y} width="300" height={SHEET.h} fill="url(#ff-wet)" />
            <line x1="300" y1={SHEET.y} x2="300" y2={SHEET.y + SHEET.h} stroke={pal.fiberAlt} strokeWidth="1.4" opacity="0.4" filter="url(#ff-soft)" />
          </g>

          {/* 纸内细纤维点 */}
          <g clipPath="url(#ff-clip)" mask="url(#ff-sweepmask)">
            {SPECKS.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={pal.grain} opacity={d.a} />
            ))}
          </g>

          {/* 帘纹 */}
          <g clipPath="url(#ff-clip)" opacity={weaveIn * (1 - out)}>
            {WEAVE.map((l, i) => (
              <line
                key={i}
                x1={l.x}
                y1={l.y}
                x2={l.x + Math.cos((l.rot * Math.PI) / 180) * l.len}
                y2={l.y + Math.sin((l.rot * Math.PI) / 180) * l.len}
                stroke={pal.weave}
                strokeWidth="0.7"
                strokeOpacity={l.a}
              />
            ))}
          </g>

          {/* 纸边与压痕 */}
          <path d={DECKLE} fill="none" stroke={pal.edge} strokeWidth="1.1" opacity={0.5 * frontNorm} />
          <path d={DECKLE} fill="none" stroke={pal.deckleHi} strokeWidth="0.7" opacity={0.45 * frontNorm} transform="translate(0.7 0.7)" />

          {/* 标题：保持在场（长镜头里 span 提前饱和，若跟随 prog 淡出会中途空白） */}
          <g opacity={1}>
            <text x="150" y="212" fill={s.accent} fontFamily={s.mono} fontSize="18" letterSpacing="5" opacity={qKicker * 0.95}>
              LW / 造纸术 · 第一辑
            </text>
            <line x1="150" y1="224" x2={150 + 46 * qKicker} y2="224" stroke={s.accent} strokeWidth="2" />

            <g clipPath="url(#ff-clip-l1)">
              <text x="150" y="332" fill={s.fg} fontFamily={s.display} fontSize="96" fontWeight="500" letterSpacing="-1" opacity="0.95">
                {((p as Record<string, unknown>).title1 as string | undefined) ?? '一张纸，'}
              </text>
            </g>
            <g clipPath="url(#ff-clip-l2)">
              <text x="150" y="440" fill={s.fg} fontFamily={s.display} fontSize="96" fontWeight="500" letterSpacing="-1" opacity="0.95">
                {((p as Record<string, unknown>).title2 as string | undefined) ?? '四道工序。'}
              </text>
            </g>

            <line x1="150" y1="478" x2={150 + 214 * qRule} y2="478" stroke={s.accent} strokeWidth="2.4" />
            <text x="150" y="514" fill={s.muted} fontFamily={s.font} fontSize="23" letterSpacing="1" opacity={qRule * 0.92}>
              {((p as Record<string, unknown>).subtitle as string | undefined) ?? '公元 105 年 · 蔡伦'}
            </text>
            <text x="150" y="556" fill={s.muted} fontFamily={s.mono} fontSize="16" letterSpacing="3" opacity={qRule * 0.62}>
              原料 → 浸泡 → 蒸煮 → 抄造
            </text>
          </g>

          {/* 右侧竖排档案标记 */}
          <g transform="translate(1172 158) rotate(90)" opacity={0.38 * qKicker}>
            <line x1="0" y1="-9" x2="190" y2="-9" stroke={s.muted} strokeWidth="0.8" />
            <text x="0" y="6" fill={s.muted} fontFamily={s.mono} fontSize="16" letterSpacing="4">
              PAPER · 105 A.D. / 第一辑
            </text>
          </g>
        </g>

        <rect width={W} height={H} fill="url(#ff-vignette)" pointerEvents="none" />

        {/* 开场钩子：Codex / Claude 的对比，只在 hook=true 时出现，2.6s 内让观众知道「这条片子是 Codex 做的」
            设计说明：用文字排印与划线做对比，不使用任何品牌标识、图标或素材 */}
        {String((p as Record<string, unknown>).hook ?? '') === 'true' || (p as Record<string, unknown>).hook === true ? (
          <g opacity={1 - easeInOut(seg(prog, 0.5, 0.6))}>
            <g opacity={easeOut(seg(prog, 0.0, 0.1))}>
              <text x="150" y="252" fill={s.muted} fontFamily={s.mono} fontSize="20" letterSpacing="6" opacity="0.8">
                TWO MODELS · ONE BRIEF
              </text>
            </g>
            <g opacity={easeOut(seg(prog, 0.02, 0.16))}>
              <text x="150" y="344" fill={s.muted} fontFamily={s.display} fontSize="78" fontWeight="400" letterSpacing="1" opacity="0.55">
                Claude
              </text>
              <line
                x1="150"
                y1="318"
                x2={150 + 300 * easeInOut(seg(prog, 0.14, 0.3))}
                y2="318"
                stroke={s.accent}
                strokeWidth="3"
                opacity="0.85"
              />
            </g>
            <g opacity={easeOut(seg(prog, 0.1, 0.26))}>
              <text x="150" y="452" fill={s.fg} fontFamily={s.display} fontSize="104" fontWeight="600" letterSpacing="-1">
                Codex
              </text>
              <line
                x1="150"
                y1="474"
                x2={150 + 300 * easeOut(seg(prog, 0.24, 0.42))}
                y2="474"
                stroke={s.accent}
                strokeWidth="4"
                opacity="0.9"
              />
            </g>
            <g opacity={easeOut(seg(prog, 0.26, 0.42))}>
              <text x="150" y="524" fill={s.muted} fontFamily={s.font} fontSize="26">
                这条视频的动画，就是 Codex 做的。
              </text>
            </g>
            {/* 「我不信」印章：带旋转落下的压印 */}
            <g
              transform={`translate(966 236) rotate(${lerp(-14, -7, easeOut(seg(prog, 0.2, 0.34)))} ) scale(${lerp(1.5, 1, easeOut(seg(prog, 0.2, 0.34)))})`}
              opacity={easeOut(seg(prog, 0.2, 0.32))}
            >
              <rect x="-92" y="-42" width="184" height="84" rx="6" fill="none" stroke={s.accent} strokeWidth="3" opacity="0.85" />
              <text x="0" y="12" textAnchor="middle" fill={s.accent} fontFamily={s.display} fontSize="44" fontWeight="600">
                我不信
              </text>
            </g>
          </g>
        ) : null}
      </svg>
    </div>
  );
}


