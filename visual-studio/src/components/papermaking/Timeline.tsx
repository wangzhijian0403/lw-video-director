/**
 * Timeline.tsx — 镜头 08 / 10「蔡伦与传播」(TIMELINE-001)
 *
 * 一个组件两种用法，靠 mode 切换，两块版式完全不同：
 *  - origin：左侧「大年份」105 逐位翻上，右侧三张史料卡依次落位（不是发明 / 定流程 / 变便宜），
 *            底部一条紧凑年份尺做聚焦；不用整页白底小字。
 *  - spread：一条分层动态路线（中原 → 撒马尔罕 → 巴格达 → 欧洲），路线带方向箭头与行走点，
 *            每到一站弹出一张「地点 + 年份 + 发生了什么」的卡片；底部一条审慎表述的注。
 *
 * 所有文字 ≥17px（1280×720 viewBox → 1080p 约 25px），不做装饰性小字。
 */
import React from 'react';
import type {Params, SceneProps} from '../../catalog/types';
import {resolveStyle} from '../../styles/themes';
import {paperBackdrop, paperPalette} from './palette';
import {easeInOut, easeOut, lerp, seg, useShot} from './kit';

type P = Params & {span?: number; mode?: string};

const W = 1280;
const H = 720;

const ROUTE = [
  {t: 0, name: '中原', year: '起源', note: '麻纸与造纸术的起点', x: 300, y: 452},
  {t: 0.38, name: '撒马尔罕', year: '751', note: '怛罗斯战后，工匠西行', x: 620, y: 402},
  {t: 0.68, name: '巴格达', year: '8 世纪', note: '阿拉伯世界出现造纸作坊', x: 900, y: 462},
  {t: 1, name: '欧洲', year: '12 世纪', note: '经阿拉伯半岛与地中海传入', x: 1128, y: 340},
];

const CARDS = [
  {no: '01', head: '不是发明', year: '前 100 年', body: '西汉已经有麻纸，蔡伦做的是改进。'},
  {no: '02', head: '定流程', year: '105 年', body: '把泡、捣、抄、晒四道工序做稳定，品质才统一。'},
  {no: '03', head: '变便宜', year: '之后', body: '从贵族案头的稀罕物，变成普通人写的日用品。'},
];

const cardY = (i: number) => 248 + i * 138;

export function Timeline({params, theme}: SceneProps) {
  const p = params as P;
  const s = resolveStyle(theme, p);
  const pal = paperPalette(theme, p.color);
  const {p: prog} = useShot(p.span, 5.2);
  const spread = String(p.mode ?? 'origin') === 'spread';

  const tail = 1 - easeInOut(seg(prog, 0.93, 1));
  const kick = easeOut(seg(prog, 0, 0.14));
  const head = easeOut(seg(prog, 0.04, 0.24));

  // 大年份：从 000 翻到 105
  const yv = Math.round(105 * easeOut(seg(prog, 0.1, 0.4)));
  const yearIn = easeOut(seg(prog, 0.08, 0.3));

  // 路线/节点
  const routeIn = easeInOut(seg(prog, 0.06, 0.46));
  const dot = easeInOut(seg(prog, 0.34, 0.88));

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', inset: '-16%', background: paperBackdrop(pal, theme)}} />
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="tl-route" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={pal.accent} stopOpacity="0.55" />
            <stop offset="1" stopColor={pal.accent} stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="tl-card" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FCFAF2" stopOpacity="0.96" />
            <stop offset="1" stopColor={pal.paperHi} stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* 头：眉标 / 标题 / 副题 */}
        <g opacity={kick * tail}>
          <text x="110" y="104" fill={pal.accent} fontFamily={s.mono} fontSize="17" letterSpacing="4">
            {spread ? 'HOW PAPER TRAVELLED WEST' : 'WHO MADE IT CHEAP'}
          </text>
          <text x="110" y="176" fill={pal.ink} fontFamily={s.display} fontSize="54" fontWeight="500">
            {String(p.title || (spread ? '纸，一路往西' : '蔡伦，把纸做便宜'))}
          </text>
          <text x="110" y="212" fill={pal.muted} fontFamily={s.font} fontSize="21" opacity={0.9}>
            {String(p.subtitle || (spread ? '751 → 阿拉伯 → 12 世纪欧洲' : '公元 105 年，东汉'))}
          </text>
          <line x1="110" y1="232" x2={110 + 210 * kick} y2="232" stroke={pal.accent} strokeWidth="2" opacity="0.75" />
        </g>

        {spread ? (
          <g opacity={tail}>
            {/* 背景经纬弧：给「空间」一点暗示，不画真实地图 */}
            <g opacity={0.18 * routeIn}>
              {[0, 1, 2, 3].map((i) => (
                <ellipse
                  key={i}
                  cx="640"
                  cy="430"
                  rx={260 + i * 190}
                  ry={92 + i * 62}
                  fill="none"
                  stroke={pal.muted}
                  strokeWidth="1"
                />
              ))}
            </g>

            {/* 路线：折线 + 方向箭头 + 行走点 */}
            <g>
              {ROUTE.slice(0, -1).map((r, i) => {
                const n = ROUTE[i + 1];
                const k = easeInOut(seg(prog, 0.08 + i * 0.07, 0.34 + i * 0.07));
                if (k <= 0) return null;
                const x2 = lerp(r.x, n.x, k);
                const y2 = lerp(r.y, n.y, k);
                const ang = (Math.atan2(n.y - r.y, n.x - r.x) * 180) / Math.PI;
                return (
                  <g key={`seg-${i}`}>
                    <line x1={r.x} y1={r.y} x2={x2} y2={y2} stroke="url(#tl-route)" strokeWidth="3" strokeLinecap="round" />
                    {k > 0.6 ? (
                      <g transform={`translate(${x2} ${y2}) rotate(${ang})`} opacity={(k - 0.6) / 0.4}>
                        <path d="M-10 -7 L4 0 L-10 7 Z" fill={pal.accent} opacity="0.85" />
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </g>

            {/* 节点 */}
            {ROUTE.map((r, i) => {
              const on = dot >= r.t - 0.03 ? 1 : 0;
              const pop = easeOut(seg(dot, r.t - 0.05, r.t + 0.02));
              const above = i % 2 === 1;
              return (
                <g key={r.name}>
                  <circle cx={r.x} cy={r.y} r={12 + 3 * pop} fill={on ? pal.accent : pal.paperHi} stroke={pal.muted} strokeWidth="1.6" opacity={0.45 + 0.55 * on} />
                  <text
                    x={r.x}
                    y={r.y + (above ? -30 : 40)}
                    textAnchor="middle"
                    fill={on ? pal.ink : pal.muted}
                    fontFamily={s.font}
                    fontSize="26"
                    fontWeight={on ? 600 : 400}
                    opacity={0.5 + 0.5 * on}
                  >
                    {r.name}
                  </text>
                  {/* 站点卡片：年份 + 发生了什么 */}
                  <g opacity={pop}>
                    <rect
                      x={r.x - 118}
                      y={r.y + (above ? -112 : 56)}
                      width="236"
                      height="62"
                      rx="6"
                      fill="url(#tl-card)"
                      opacity="0.92"
                    />
                    <rect x={r.x - 118} y={r.y + (above ? -112 : 56)} width="5" height="62" fill={pal.accent} opacity="0.9" />
                    <text
                      x={r.x - 100}
                      y={r.y + (above ? -86 : 82)}
                      fill={pal.accent}
                      fontFamily={s.mono}
                      fontSize="18"
                      letterSpacing="1"
                    >
                      {r.year}
                    </text>
                    <text
                      x={r.x - 100}
                      y={r.y + (above ? -62 : 106)}
                      fill={pal.muted}
                      fontFamily={s.font}
                      fontSize="18"
                    >
                      {r.note}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* 行走的点 */}
            <circle cx={lerp(ROUTE[0].x, ROUTE[3].x, dot)} cy={lerp(ROUTE[0].y, ROUTE[3].y, dot)} r="8" fill={pal.paperHi} stroke={pal.accent} strokeWidth="3" />

            {/* 审慎表述 */}
            <text x="110" y="640" fill={pal.muted} fontFamily={s.font} fontSize="17" opacity={0.78 * easeOut(seg(prog, 0.5, 0.7))}>
              通行说法：751 年怛罗斯之战后造纸术西传；具体年份与路径学界仍有讨论。
            </text>
          </g>
        ) : (
          <g opacity={tail}>
            {/* 大年份 */}
            <g opacity={yearIn}>
              <text x="110" y="386" fill={pal.ink} fontFamily={s.display} fontSize="132" fontWeight="500" letterSpacing="-2">
                {String(yv).padStart(3, '0')}
              </text>
              <text x="118" y="424" fill={pal.accent} fontFamily={s.mono} fontSize="20" letterSpacing="3">
                公元 105 年 · 东汉元兴元年
              </text>
              <line x1="118" y1="444" x2={118 + 246 * yearIn} y2="444" stroke={pal.accent} strokeWidth="2" opacity="0.7" />
            </g>

            {/* 三张史料卡：右进、轻旋、错峰落位 */}
            {CARDS.map((c, i) => {
              const t0 = 0.18 + i * 0.09;
              const a = easeOut(seg(prog, t0, t0 + 0.2));
              if (a <= 0) return null;
              const y = cardY(i);
              return (
                <g key={c.no} opacity={a} transform={`translate(${(1 - a) * 54} ${(1 - a) * 16}) rotate(${(1 - a) * 1.4} 470 ${y + 56})`}>
                  <rect x={470} y={y} width="716" height="112" rx="8" fill="url(#tl-card)" opacity="0.94" />
                  <rect x={470} y={y + 112} width="716" height="9" rx="4" fill={pal.edge} opacity="0.12" />
                  <rect x={470} y={y} width="6" height="112" fill={pal.accent} opacity="0.85" />
                  <text x="500" y={y + 34} fill={pal.accent} fontFamily={s.mono} fontSize="17" letterSpacing="2">
                    {c.no}
                  </text>
                  <text x="500" y={y + 80} fill={pal.ink} fontFamily={s.display} fontSize="31" fontWeight="500">
                    {c.head}
                  </text>
                  <text x="660" y={y + 79} fill={pal.muted} fontFamily={s.font} fontSize="19">
                    {c.body}
                  </text>
                  <text x="1160" y={y + 46} textAnchor="end" fill={pal.accent} fontFamily={s.mono} fontSize="17" opacity="0.75">
                    {c.year}
                  </text>
                </g>
              );
            })}

            {/* 一句话结论，替掉大段时间线 */}
            <g opacity={easeOut(seg(prog, 0.66, 0.84))}>
              <text x="470" y="672" fill={pal.ink} fontFamily={s.font} fontSize="20" opacity="0.9">
                纸早就有了。蔡伦把它做稳、做便宜 —— 这才是「纸」进入日常的那一步。
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

