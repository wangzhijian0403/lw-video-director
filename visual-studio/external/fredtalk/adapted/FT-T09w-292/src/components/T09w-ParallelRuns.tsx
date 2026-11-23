// FredTalk 2.5 distribution: fred-recording-8-20261018
// T09w-ParallelRuns：一个变多个：同一份任务拆成几份同时跑
// 观众要看懂的变化：一张要逐项去查的清单（真实截图）→ 拆成几组并排的小窗，各组按自己的速度逐项打勾、进度独立推进 →
// 全部查完后几组合回一个窗口，落一句结论。
// 返工 2026-10-17（按 NEW-GATE）：不再用 123 期豆包蓝色气泡（大面积品牌色块）；改用同一期 AI 回复里的“15 件价格速览”
// 白底表格。全貌 ≤0.8s 后，表格里每一行的商品名原位飞出、按组落进小窗（字 ≥37px），每行查完打一个黑色勾。
// 关系：同一张截图的同一批像素（表格的行 → 各组小窗里的行 → 合回一个窗口），对象始终连续。
// 完成态只用黑色勾 + settle 落定，不用红/绿/黄。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { S, clamp, cueAt, mix, p, q, settle, textWidth } from '../kit/theme';
import { Box, Frame, Handoff, HandoffProps, Pill, Sfx, Surface, between, textBase, useT } from '../kit/ui';

type Rect = { x: number; y: number; w: number; h: number };
export type RunLane = {
  label: string;      // 这一组是什么
  rows: number[];     // 这一组包含表格的哪几行（rowTops 的下标）
  duration: number;   // 开跑后多久查完（秒）
};
export type ParallelRunsProps = HandoffProps & {
  source: string;
  sourceSize: { w: number; h: number };
  tableCrop: Rect;      // 开场整表显示的区域（源像素）
  cellX: { x: number; w: number };   // 每行取哪一栏（源像素，横向）
  rowTops: number[];    // 每一行的上边线（源像素）
  lineTop: number;      // 行内第一行字相对上边线的偏移（源像素）
  lineH: number;        // 取多高的一条（源像素）
  lanes: RunLane[];
  doneLabel: string;
  highlight: string;
  cues?: number[];      // [0]=拆开，[1]=合回
};

// 默认：123 期 AI 回复里的“15 件价格速览”表格（Fred 真实截图 L07），按 数码 / 洗护 / 日常 三组同时查
export const parallelRunsDefaults: ParallelRunsProps = {
  source: 'fredtalk/media/lw-work-03.jpg',
  sourceSize: { w: 1320, h: 4000 },
  tableCrop: { x: 84, y: 1340, w: 1152, h: 2592 },
  cellX: { x: 228, w: 506 },
  rowTops: [1540, 1750, 1906, 2062, 2272, 2428, 2584, 2686, 2788, 2944, 3046, 3202, 3358, 3568, 3724],
  lineTop: 14,
  lineH: 82,
  lanes: [
    { label: '数码 5 件', rows: [0, 1, 2, 3, 4], duration: 1.5 },
    { label: '洗护 5 件', rows: [5, 6, 7, 8, 9], duration: 2.0 },
    { label: '日常 5 件', rows: [10, 11, 12, 13, 14], duration: 2.4 },
  ],
  doneLabel: '15 件商品，三组同时查完',
  highlight: '同时',
};

export function ParallelRuns(props: Partial<ParallelRunsProps>) {
  const c = { ...parallelRunsDefaults, ...props };
  const t = useT();
  const lanes = (c.lanes.length ? c.lanes : parallelRunsDefaults.lanes).map((l) => ({ ...l, rows: l.rows.filter((r) => r >= 0 && r < c.rowTops.length) }));
  const n = lanes.length;

  // —— 开场整表：按源比例放在正中 ——
  const TC = c.tableCrop;
  const k0 = Math.min(1500 / TC.w, 960 / TC.h);
  const BIG: Box = { w: TC.w * k0, h: TC.h * k0, x: 960 - (TC.w * k0) / 2, y: 545 - (TC.h * k0) / 2 };
  const inBig = (r: Rect): Box => ({ x: BIG.x + (r.x - TC.x) * k0, y: BIG.y + (r.y - TC.y) * k0, w: r.w * k0, h: r.h * k0 });
  const itemSrc = (r: number): Rect => ({ x: c.cellX.x, y: c.rowTops[r] + c.lineTop, w: c.cellX.w, h: c.lineH });

  // —— 小窗版式 ——
  const cols = Math.min(3, n), rowsN = Math.ceil(n / cols);
  const GAP = 30, LABEL = 70, BAR = 64, PADY = 16, IG = 6, RIGHT = 74, LEFT = 16;
  const maxItemsRow = Array.from({ length: rowsN }, (_, r) => Math.max(...lanes.map((l, i) => (Math.floor(i / cols) === r ? l.rows.length : 0))));
  const sW = ((1850 - (cols - 1) * GAP) / cols - LEFT - RIGHT) / c.cellX.w;
  const fixedH = rowsN * (LABEL + BAR + PADY * 2) + (rowsN - 1) * GAP;
  const varH = maxItemsRow.reduce((a, m) => a + m * c.lineH + Math.max(0, m - 1) * IG, 0);
  const s = Math.min(1.08, sW, (1010 - fixedH) / Math.max(1, varH));
  const bh = c.lineH * s, cw = c.cellX.w * s;
  const CW = cw + LEFT + RIGHT;
  const cardH = (r: number) => maxItemsRow[r] * bh + Math.max(0, maxItemsRow[r] - 1) * IG + PADY * 2;
  const blockH = Array.from({ length: rowsN }, (_, r) => cardH(r) + LABEL + BAR).reduce((a, b) => a + b, 0) + (rowsN - 1) * GAP;
  // 拆开时：带标题和进度条、有间距；合回时：无间距拼成一个窗口
  const cardBox = (i: number, merged: boolean): Box => {
    const col = i % cols, row = Math.floor(i / cols);
    const rowN = Math.min(cols, n - row * cols);
    const g = merged ? 0 : GAP;
    const totalW = rowN * CW + (rowN - 1) * g;
    const x = 960 - totalW / 2 + col * (CW + g);
    let y: number;
    if (merged) {
      const mh = Array.from({ length: rowsN }, (_, r) => cardH(r)).reduce((a, b) => a + b, 0);
      y = 470 - mh / 2;
      for (let r = 0; r < row; r++) y += cardH(r);
    } else {
      y = 555 - blockH / 2 + LABEL;
      for (let r = 0; r < row; r++) y += cardH(r) + LABEL + BAR + GAP;
    }
    return { x, y, w: CW, h: cardH(row) };
  };
  const slot = (card: Box, j: number): Box => ({ x: card.x + LEFT, y: card.y + PADY + j * (bh + IG), w: cw, h: bh });

  // —— 时间 ——
  const enter = p(t, 0, 0.3);
  const splitAt = cueAt(c.cues, 0, 0.7);
  const nItems = lanes.reduce((a, l) => a + l.rows.length, 0);
  const stagger = Math.min(0.03, 0.4 / Math.max(1, nItems));
  const runAt = splitAt + 0.95;
  const doneAt = lanes.map((l) => runAt + l.duration);
  const allDone = Math.max(...doneAt);
  const mergeAt = cueAt(c.cues, 1, allDone + 0.4);
  const merge = q(t, mergeAt, mergeAt + 0.5);
  const pillAt = mergeAt + 0.45;
  const pillIn = settle(t, pillAt, 0.6);
  const bigFade = 1 - q(t, splitAt, splitAt + 0.35);
  const cardIn = p(t, splitAt + 0.25, splitAt + 0.6);
  const sideOut = 1 - q(t, mergeAt - 0.05, mergeAt + 0.25);   // 标题、进度条在合回时退下

  const DS = Math.min(68, 1300 / Math.max(1, textWidth(c.doneLabel, 1)));
  const PW = textWidth(c.doneLabel, DS) + DS * 1.8, PH = DS * 2;
  const [before, after = ''] = c.doneLabel.split(c.highlight);
  const hasHL = !!c.highlight && c.doneLabel.includes(c.highlight);
  const mergedBottom = Math.max(...lanes.map((_, i) => { const b = cardBox(i, true); return b.y + b.h; }));

  const crop = (b: Box, r: Rect, extra?: React.CSSProperties, key?: React.Key) => {
    const kk = b.w / r.w;
    return <div key={key} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, overflow: 'hidden', ...extra }}>
      <Img src={staticFile(c.source)} style={{ position: 'absolute', left: -r.x * kk, top: -r.y * kk, width: c.sourceSize.w * kk, height: c.sourceSize.h * kk }} />
    </div>;
  };
  let gi = 0;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 整表：开场全貌，拆开时退掉（每一行自己飞走） */}
      {bigFade > 0 && crop({ ...BIG, y: BIG.y + (1 - enter) * 30 }, TC, { opacity: enter * bigFade, borderRadius: 20, boxShadow: S.shadow, background: '#fff' })}

      {/* 合回后的一个窗口底 */}
      {merge > 0 && (() => {
        const bs = lanes.map((_, i) => cardBox(i, true));
        const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y));
        const x1 = Math.max(...bs.map((b) => b.x + b.w)), y1 = Math.max(...bs.map((b) => b.y + b.h));
        return <Surface box={{ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }} style={{ opacity: merge }} />;
      })()}

      {lanes.map((l, i) => {
        const card = between(cardBox(i, false), cardBox(i, true), merge);
        const run = clamp((t - runAt) / l.duration);
        const done = t >= doneAt[i];
        const cnt = l.rows.length;
        const shown = Math.min(cnt, Math.floor(run * cnt + 1e-6));
        const LS = Math.min(44, (CW - 70) / Math.max(1, textWidth(l.label, 1)));
        const lab = cardBox(i, false);
        const tick = done ? settle(t, doneAt[i], 0.45) : 0;
        return <React.Fragment key={i}>
          {/* 小窗底：拆开后出现；合回时阴影交给整窗 */}
          <Surface box={card} radius={mix(20, 0, merge)} shadow={merge > 0.5 ? 'none' : S.shadow} style={{ opacity: cardIn }} />
          {/* 组名 + 完成勾 */}
          <div style={{ position: 'absolute', left: lab.x, width: lab.w, top: lab.y - LABEL + 4, height: LABEL - 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: cardIn * sideOut }}>
            <span style={{ ...textBase(LS, 900), color: done ? S.ink : S.muted }}>{l.label}</span>
            {tick > 0 && <span style={{ width: 44, height: 44, borderRadius: 22, background: S.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${mix(0.4, 1, tick)})` }}>
              <svg width={28} height={28} viewBox="0 0 24 24"><path d="M5 12.5 L10 17 L19 7.5" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>}
          </div>
          {/* 进度：底条 + 已查数 */}
          <div style={{ position: 'absolute', left: lab.x + 10, top: lab.y + lab.h + 22, width: lab.w - 20, height: 12, borderRadius: 6, background: 'rgba(25,25,28,0.10)', opacity: cardIn * sideOut }} />
          <div style={{ position: 'absolute', left: lab.x + 10, top: lab.y + lab.h + 22, width: (lab.w - 20) * run, height: 12, borderRadius: 6, background: S.ink, opacity: cardIn * sideOut }} />
          <div style={{ ...textBase(36, 600, S.mono), position: 'absolute', left: lab.x, width: lab.w - 10, top: lab.y + lab.h + 38, textAlign: 'right', color: done ? S.ink : S.muted, opacity: cardIn * sideOut }}>{shown}/{cnt}</div>

          {/* 每一行：从整表原位飞进小窗；查到它时右侧落一个黑色勾 */}
          {l.rows.map((r, j) => {
            const k = gi++;
            // 先横向散开、再落到行上（中间那组稍后再动），飞行中不压别组的字
            const midCol = cols % 2 === 1 && i % cols === (cols - 1) / 2;
            const f0 = splitAt + k * stagger + (midCol ? 0.22 : 0);
            const ux = q(t, f0, f0 + 0.32), uy = q(t, f0 + 0.18, f0 + 0.55);
            const dst = slot(card, j);
            const src0 = inBig(itemSrc(r));
            const b = uy < 1 ? { x: mix(src0.x, dst.x, ux), y: mix(src0.y, dst.y, uy), w: mix(src0.w, dst.w, uy), h: mix(src0.h, dst.h, uy) } : dst;
            const checkAt = runAt + l.duration * ((j + 1) / cnt);
            const ck = settle(t, checkAt - 0.04, 0.3);
            const active = t >= runAt && t < checkAt && t >= runAt + l.duration * (j / cnt);
            return <React.Fragment key={j}>
              {active && <div style={{ position: 'absolute', left: dst.x - 10, top: dst.y - 2, width: cw + 20, height: bh + 4, borderRadius: 10, background: 'rgba(25,25,28,0.06)' }} />}
              {crop(b, itemSrc(r), { opacity: ck > 0 ? mix(1, 0.92, ck) : 1 }, `c${j}`)}
              {ck > 0 && <div style={{
                position: 'absolute', left: dst.x + cw + 14, top: dst.y + bh / 2 - 22, width: 44, height: 44, borderRadius: 22, background: S.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${mix(0.4, 1, ck)})`, opacity: clamp(ck * 2),
              }}>
                <svg width={26} height={26} viewBox="0 0 24 24"><path d="M5 12.5 L10 17 L19 7.5" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={22} strokeDashoffset={22 * (1 - ck)} /></svg>
              </div>}
            </React.Fragment>;
          })}
        </React.Fragment>;
      })}

      {pillIn > 0 && <Pill box={{ x: 960 - PW / 2, y: Math.min(1040 - PH, mergedBottom + 50) + (1 - pillIn) * 24, w: PW, h: PH }} style={{ opacity: pillIn, zIndex: 60 }}>
        <span style={{ ...textBase(DS, 400, S.display), color: '#fff' }}>
          {hasHL ? <>{before}<span style={{ color: S.accentDark }}>{c.highlight}</span>{after}</> : c.doneLabel}
        </span>
      </Pill>}
    </Handoff>
    <Sfx name="slide" at={splitAt} />
    {doneAt.slice(0, 4).map((d, i) => <Sfx key={i} name="pop" at={d} />)}
  </Frame>;
}
