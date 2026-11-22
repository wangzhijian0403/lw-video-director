/**
 * Materials.tsx — 镜头 02「原料就四样」(MATERIAL-001)
 *
 * 内容解释：纸的原料是四种含纤维的废弃物 —— 树皮、麻头、破布、渔网。
 * 旧版用「4/3/2/1 份」柱状图，那些比例没有任何史料依据（《后汉书》原文只记
 * 「用树肤、麻头及敝布、鱼网以为纸」，没有配比），等于用假数据包装事实，整组删除。
 *
 * 新版：四件标本插画以档案标本方式错位入场（不同大小、角度、景深、落位高度），
 * 依次聚焦（口播点名哪一样，哪一样就亮、抬、加朱红标注），
 * 最后四件收拢、化成束纤维下落 —— 交接给镜头 03 的浸泡水槽。
 * 插画是本工程自绘素材（无第三方版权），白底用 multiply 直接印在纸面上。
 */
import {staticFile} from 'remotion';
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperBackdrop, paperPalette} from './palette';
import {clamp01, easeInOut, easeOut, lerp, mulberry32, seg, useShot} from './kit';

type Material = {src: string; label: string; note?: string};
type P = Params & {span?: number; materials?: Material[]};

const FALLBACK: Material[] = [
  {src: 'projects/papermaking-v2/materials/bark.png', label: '树皮', note: '构树 · 去外皮'},
  {src: 'projects/papermaking-v2/materials/hemp.png', label: '麻头', note: '旧麻 · 打散'},
  {src: 'projects/papermaking-v2/materials/rag.png', label: '破布', note: '敝布 · 洗净'},
  {src: 'projects/papermaking-v2/materials/net.png', label: '渔网', note: '鱼网 · 拆绳'},
];

/** 四件的错位关系：大小 / 角度 / 高度 / 景深都不同，避免「四格等分」的看板感 */
const SLOTS = [
  {fx: 0.19, dy: 8, size: 286, rot: -2.4, depth: 0.9, blur: 0.7},
  {fx: 0.43, dy: 58, size: 310, rot: 1.7, depth: 1.14, blur: 0},
  {fx: 0.66, dy: 6, size: 300, rot: -1.2, depth: 1.0, blur: 0.35},
  {fx: 0.85, dy: 52, size: 262, rot: 2.1, depth: 1.24, blur: 0},
];

/** 每件标本身后的纤维拖尾：交代「原料 = 纤维」 */
const TRAILS = (() => {
  const r = mulberry32(0xa31f);
  return Array.from({length: 7}, () => ({off: r() * 150 - 75, len: 40 + r() * 90, rot: -22 + r() * 44}));
})();

export function Materials({params, theme}: SceneProps) {
  const p = params as P;
  const s = resolveStyle(theme, params);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 4.5);
  const list = (p.materials && p.materials.length ? p.materials : FALLBACK).slice(0, 4);
  const n = list.length;

  // 依次聚焦：口播「树皮、麻头、破布、渔网」，画面跟着点名
  const focus = seg(prog, 0.36, 0.72);
  const active = Math.min(n - 1, Math.floor(focus * n + 0.0001));

  // 汇聚：四件同时收向中心，化成束纤维后下落
  const conv = easeInOut(seg(prog, 0.74, 0.97));
  const drop = easeOut(seg(prog, 0.9, 1));
  const bundle = easeOut(seg(prog, 0.76, 0.94));

  const drift = easeOut(seg(prog, 0.1, 1));
  const camY = -8 * drift;
  // 交叉淡化期间只让纸张和纤维参与溶解：字先退干净，避免两镜文字叠影
  const headIn = easeOut(seg(prog, 0.08, 0.26));
  const textOut = 1 - easeInOut(seg(prog, 0.78, 0.92));

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: '-16%', background: paperBackdrop(pal, theme)}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="ma-paper" x1="0" y1="0" x2="1" y2="1.1">
            <stop offset="0" stopColor={pal.paperHi} />
            <stop offset="0.6" stopColor={pal.paperMid} />
            <stop offset="1" stopColor={pal.paperLo} />
          </linearGradient>
          <radialGradient id="ma-spot" cx="0.5" cy="0.52" r="0.62">
            <stop offset="0" stopColor={pal.paperHi} stopOpacity="0.55" />
            <stop offset="1" stopColor={pal.paperHi} stopOpacity="0" />
          </radialGradient>
          <filter id="ma-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="ma-far">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
          <filter id="ma-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="11" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.32  0 0 0 0 0.26  0 0 0 0 0.19  0 0 0 0.55 0" />
          </filter>
        </defs>

        <rect width="1280" height="720" fill="url(#ma-paper)" />
        <rect width="1280" height="720" opacity="0.05" filter="url(#ma-grain)" />
        <ellipse cx="650" cy="400" rx="560" ry="230" fill="url(#ma-spot)" />

        {/* 标头 */}
        <g opacity={headIn * textOut}>
          <text x="88" y="80" fill={s.accent} fontFamily={s.mono} fontSize="17" letterSpacing="5">
            02 / MATERIALS · 原料
          </text>
          <text x="88" y="128" fill={s.fg} fontFamily={s.display} fontSize="44" fontWeight="500">
            原料就四样
          </text>
          <line x1="88" y1="146" x2={88 + 332 * easeOut(seg(prog, 0.12, 0.4))} y2="146" stroke={s.muted} strokeWidth="0.9" opacity="0.7" />
          <text x="1192" y="80" textAnchor="end" fill={s.muted} fontFamily={s.mono} fontSize="16" letterSpacing="3">
            皆含植物纤维 · 废料再用
          </text>
        </g>

        <g transform={`translate(640 ${360 + camY}) translate(-640 -360)`}>
          {list.map((m, i) => {
            const slot = SLOTS[i % SLOTS.length];
            const enter = easeOut(seg(prog, 0.02 + i * 0.09, 0.42 + i * 0.09));
            const isActive = active === i && prog < 0.77;
            const fromX = (i % 2 === 0 ? -1 : 1) * 160 * (1 - enter) * slot.depth;
            const fromY = 120 * (1 - enter) * slot.depth;

            const baseX = 1280 * slot.fx;
            const baseY = 336 + slot.dy;
            const cx = lerp(baseX, 640, conv * 0.84) + fromX;
            const cy = lerp(baseY, 404, conv * 0.9) + fromY + (isActive ? -10 : 0) + drop * 150;
            const scaleItem = lerp(1, 0.22, conv) * (isActive ? 1.05 : 1);
            const rot = lerp(slot.rot * (1 - enter * 0.55), 0, conv);
            const alpha = clamp01(enter * 1.1) * (1 - conv * 0.9);
            const dim = isActive ? 1 : 0.76;

            return (
              <g key={`${m.src}-${i}`} opacity={alpha}>
                {/* 投影：投影大小与位移随景深变化，撑出 2.5D */}
                <ellipse
                  cx={cx + 10 * slot.depth}
                  cy={cy + slot.size * 0.46}
                  rx={slot.size * 0.38 * slot.depth}
                  ry={slot.size * 0.09 * slot.depth}
                  fill={pal.shadow}
                  opacity={0.24 * dim}
                  filter="url(#ma-soft)"
                />
                {/* 纤维拖尾 */}
                {TRAILS.map((t, k) => (
                  <line
                    key={k}
                    x1={cx + t.off}
                    y1={cy + slot.size * 0.32}
                    x2={cx + t.off * 0.45}
                    y2={cy + slot.size * 0.32 + t.len * (1 - enter * 0.75)}
                    stroke={pal.fiberAlt}
                    strokeWidth="0.9"
                    strokeOpacity={0.18 * (1 - enter) * dim}
                  />
                ))}
                {/* 插画本体：白底 multiply，直接印在纸上 */}
                <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${scaleItem})`} opacity={dim}>
                  <g filter={slot.blur ? 'url(#ma-far)' : undefined}>
                    <image
                      href={staticFile(m.src)}
                      x={-slot.size / 2}
                      y={-slot.size / 2}
                      width={slot.size}
                      height={slot.size}
                      preserveAspectRatio="xMidYMid meet"
                      style={{mixBlendMode: 'multiply'}}
                    />
                  </g>
                </g>

                {/* 标签：序号 + 名称 + 标注线，只在聚焦时亮起；位置固定在物体下缘之外 */}
                {conv < 0.5 ? (
                  <g opacity={clamp01(enter * 1.2) * (1 - conv * 2) * (isActive ? 1 : 0.7) * textOut}>
                    <line
                      x1={cx - slot.size * 0.34}
                      y1={508}
                      x2={cx - slot.size * 0.34 + (isActive ? 128 : 56)}
                      y2={508}
                      stroke={isActive ? s.accent : s.muted}
                      strokeWidth={isActive ? 2 : 0.8}
                      opacity={isActive ? 1 : 0.45}
                    />
                    <text
                      x={cx - slot.size * 0.34}
                      y={508 + 20}
                      fill={isActive ? s.accent : s.muted}
                      fontFamily={s.mono}
                      fontSize="16"
                      letterSpacing="3"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </text>
                    <text
                      x={cx - slot.size * 0.34 + 30}
                      y={508 + 21}
                      fill={s.fg}
                      fontFamily={s.display}
                      fontSize="26"
                      letterSpacing="1"
                    >
                      {m.label}
                    </text>
                    {m.note ? (
                      <text
                        x={cx - slot.size * 0.34}
                        y={508 + 52}
                        fill={s.muted}
                        fontFamily={s.font}
                        fontSize="18"
                        opacity={isActive ? 0.95 : 0.5}
                      >
                        {m.note}
                      </text>
                    ) : null}
                  </g>
                ) : null}
              </g>
            );
          })}

          {/* 汇聚成纤维束：从四件中心收向一点，再下落出画 */}
          <g opacity={bundle * 0.95}>
            {list.map((_, i) =>
              Array.from({length: 10}, (_, k) => {
                const a = easeOut(seg(prog, 0.76 + i * 0.015, 0.94 + k * 0.004));
                const x1 = 1280 * SLOTS[i % SLOTS.length].fx;
                const y1 = 336 + SLOTS[i % SLOTS.length].dy;
                const x2 = 640 + (k - 5) * 3.2;
                const y2 = 402 + (k - 5) * 2;
                return (
                  <line
                    key={`b-${i}-${k}`}
                    x1={x1}
                    y1={y1 + drop * 220}
                    x2={lerp(x1, x2, a)}
                    y2={lerp(y1, y2, a) + drop * 220}
                    stroke={pal.fiber}
                    strokeWidth={0.9}
                    strokeOpacity={0.44 * (1 - drop)}
                    strokeLinecap="round"
                  />
                );
              }),
            )}
          </g>
        </g>

        {/* 纸面暖调压一层，统一四张插画的色温 */}
        <rect width="1280" height="720" fill={pal.ink} opacity="0.045" />
      </svg>
    </div>
  );
}

