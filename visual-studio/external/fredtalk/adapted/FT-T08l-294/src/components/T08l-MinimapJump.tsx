// FredTalk 2.5 distribution: fred-recording-8-20261018
// T08l-MinimapJump：长页小地图：侧边缩略条标位置，一跳到下一处
// 观众要看懂的变化：一张很长的页面 → 右侧出现整页缩略条，当前视窗在缩略条上亮着、其余压暗；
// 口播讲到哪一处，缩略条上的亮区跳过去，主画面同步一跳到位并停读（落点的关键词被毛刷刷出）。
// 镜头（返工 2026-10-17，按 NEW-GATE）：整页全貌 ≤0.8s → 主画面从全貌直接推近到第一处（正文按读字尺度显示，
// 默认正文 ≥40px、标题 ≥54px）→ 每次跳转先拉远一点再推近落下（0.5s，带运动模糊）→ 停读时缓慢推进。
// 关系：主画面和缩略条是同一张页面的两个尺度，亮区就是“我现在在哪”。
// 和 T08b（滚到一处停下，单点、纯滚动）区分：多点跳读，并有全局参照。
// 缩略条用局部压暗表示视窗位置，不画框。
import React from 'react';
import { Img, staticFile, useVideoConfig } from 'remotion';
import { S, clamp, cueAt, mix, p, q, quintic, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';

type Rect = { x: number; y: number; w: number; h: number };
export type MinimapStop = { y: number; label?: string; brush?: Rect };   // 源像素（整页坐标）
export type MinimapJumpProps = HandoffProps & {
  tiles: string[];                 // 一张整页图，或按顺序拼接的多张分块
  tileSize: { w: number; h: number };   // 每块的像素（同宽同高；单张时就是整页）
  lastTileH?: number;              // 最后一块实际高度（不足 tileSize.h 时）
  contentX: { x: number; w: number };   // 横向只取正文这一栏
  textPx: number;                  // 页面正文在源图里的字号（源像素），用来定读字尺度
  stops: MinimapStop[];
  cues?: number[];                 // [i]=开始跳到第 i 处（第 0 处是从全貌推近）
};

// 默认：118 期 GitHub 本周热门榜整页长图（Fred 截图），跳读第 1、4、9 名
export const minimapJumpDefaults: MinimapJumpProps = {
  tiles: ['fredtalk/media/lw-work-02.jpg'],
  tileSize: { w: 3840, h: 4417 },
  contentX: { x: 683, w: 2474 },
  textPx: 34,
  stops: [
    { y: 790, label: '第 1 名 rea', brush: { x: 790, y: 828, w: 300, h: 64 } },
    { y: 1644, label: '第 4 名 diagram-design', brush: { x: 790, y: 1682, w: 720, h: 64 } },
    { y: 3174, label: '第 9 名 billion-context', brush: { x: 790, y: 3212, w: 630, h: 64 } },
  ],
};

export function MinimapJump(props: Partial<MinimapJumpProps>) {
  const c = { ...minimapJumpDefaults, ...props };
  const t = useT();
  const { durationInFrames, fps } = useVideoConfig();
  const T = durationInFrames / fps;
  const tiles = c.tiles.length ? c.tiles : minimapJumpDefaults.tiles;
  const stops = c.stops.length ? c.stops : minimapJumpDefaults.stops;
  const n = stops.length;
  const pageH = (tiles.length - 1) * c.tileSize.h + (c.lastTileH ?? c.tileSize.h);
  const CX = c.contentX;

  // —— 版式：左主画面（读字尺度），右缩略条 ——
  const MV = { x: 40, y: 40, w: 1500, h: 1000 };
  const sR = Math.min(2.6, Math.max(1, 40 / c.textPx), MV.w / Math.min(CX.w, 520));   // 读字尺度：正文 ≥40px
  const vw = MV.w / sR, vh = MV.h / sR;           // 主画面一次看到的源像素范围
  const hasLabel = stops.some((s) => s.label);
  const COL = { x: 1590, w: 290, top: 150, bottom: hasLabel ? 870 : 1040 };
  const natH = (COL.w * pageH) / CX.w;
  const miniH = Math.min(COL.bottom - COL.top, natH);
  const miniW = natH > miniH ? Math.max(90, Math.min(COL.w, (miniH * CX.w) / pageH)) : COL.w;
  const MINI = { x: COL.x + (COL.w - miniW) / 2, y: COL.top, w: miniW, h: miniH };
  const msx = miniW / CX.w, msy = miniH / pageH;   // 页太长时纵向压缩（缩略条只看位置）

  // —— 时间 ——
  const DIVE = 0.7, JUMP = 0.5, TAIL = 1.3;
  const step = n > 1 ? Math.max(0.6, (T - (0.55 + DIVE) - TAIL) / (n - 1)) : 0;
  const at = stops.map((_, i) => cueAt(c.cues, i, i === 0 ? 0.55 : 0.55 + DIVE + i * step - JUMP));
  const arrive = at.map((a, i) => a + (i === 0 ? DIVE : JUMP));

  // 每一处的取景（源像素焦点）
  const focusOf = (i: number) => {
    const s = stops[i];
    const bx = s.brush ? s.brush.x + s.brush.w / 2 : CX.x + vw / 2;   // 没给刷痕就从这一栏的行首读起
    const x = vw >= CX.w ? CX.x + CX.w / 2 : clamp(bx, CX.x + vw / 2, CX.x + CX.w - vw / 2);
    const y = clamp(s.y - vh * 0.16 + vh / 2, vh / 2, Math.max(vh / 2, pageH - vh / 2));
    return { x, y };
  };
  // 全貌：整页尽量放进画面；页太长时只给开头一段（全局位置交给缩略条）
  const sOv = Math.max(MV.h / pageH, 420 / CX.w);
  const ovW = CX.w * sOv, ovH = Math.min(MV.h, pageH * sOv);
  const OV = { x: 960 - ovW / 2, y: 540 - ovH / 2 + 10, w: ovW, h: ovH };

  // 当前镜头：焦点 (fx, fy)、尺度 s、主画面外框
  let fx = CX.x + CX.w / 2, fy = ovH / sOv / 2, s = sOv, blur = 0;
  const dive = quintic(t, at[0], arrive[0]);
  const box = { x: mix(OV.x, MV.x, dive), y: mix(OV.y, MV.y, dive), w: mix(OV.w, MV.w, dive), h: mix(OV.h, MV.h, dive) };
  if (t >= at[0]) {
    const f0 = focusOf(0);
    s = Math.exp(mix(Math.log(sOv), Math.log(sR), dive));
    const u = clamp((1 / s - 1 / sOv) / (1 / sR - 1 / sOv));
    fx = mix(fx, f0.x, u); fy = mix(fy, f0.y, u);
    for (let i = 1; i < n; i++) {
      if (t < at[i]) break;
      const a = focusOf(i - 1), b = focusOf(i);
      const v = quintic(t, at[i], arrive[i]);
      const bump = Math.sin(Math.PI * clamp((t - at[i]) / JUMP));
      fx = mix(a.x, b.x, v); fy = mix(a.y, b.y, v);
      s = sR * (1 - 0.38 * bump);                 // 跳的途中先拉远一点再落下
      blur = 4 * bump;
    }
  }
  let cur = -1;
  for (let i = 0; i < n; i++) if (t >= arrive[i] - 0.05) cur = i;
  // 停读时缓慢推进（到下一跳前）
  const nextAt = cur >= 0 && cur + 1 < n ? at[cur + 1] : T;
  const drift = cur >= 0 ? 1 + 0.06 * q(t, arrive[cur], nextAt) : 1;
  const sNow = s * drift;

  const pageImgs = (sx: number, sy: number) => tiles.map((src, i) => <Img key={i} src={staticFile(src)} style={{
    position: 'absolute', left: (0 - CX.x) * sx, top: i * c.tileSize.h * sy, width: c.tileSize.w * sx, height: c.tileSize.h * sy,
  }} />);

  // 缩略条上的亮区（当前视窗）
  const viewTop = fy - box.h / sNow / 2, viewH = box.h / sNow;
  const vy = clamp(viewTop * msy, 0, miniH), vh2 = Math.max(12, Math.min(miniH - vy, viewH * msy));
  const miniIn = p(t, at[0] + 0.15, at[0] + 0.55);
  const label = cur >= 0 ? stops[cur].label : undefined;
  const LS = label ? Math.max(36, Math.min(44, (COL.w * 2.6) / Math.max(1, textWidth(label, 1)))) : 0;
  const labelIn = cur >= 0 ? p(t, arrive[cur] - 0.05, arrive[cur] + 0.3) : 0;
  const enter = p(t, 0, 0.3);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {/* 主画面：全貌 → 推近到第一处；之后在各处之间跳 */}
      <div style={{ position: 'absolute', left: box.x, top: box.y + (1 - enter) * 24, width: box.w, height: box.h, borderRadius: S.radius, overflow: 'hidden', background: '#fff', boxShadow: S.shadow, opacity: enter }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 1, height: 1, transformOrigin: '0 0',
          transform: `translate(${box.w / 2}px, ${box.h / 2}px) scale(${sNow}) translate(${-(fx - CX.x)}px, ${-fy}px)`,
          filter: blur > 0.3 ? `blur(${blur / sNow}px)` : undefined,
        }}>
          {pageImgs(1, 1)}
          {stops.map((st, i) => {
            if (!st.brush) return null;
            const v = p(t, arrive[i] + 0.05, arrive[i] + 0.45);
            if (v <= 0) return null;
            return <div key={i} style={{ position: 'absolute', left: st.brush.x - CX.x - 8, top: st.brush.y, width: (st.brush.w + 16) * v, height: st.brush.h, borderRadius: 10, background: S.accent, opacity: 0.22, mixBlendMode: 'multiply' }} />;
          })}
        </div>
      </div>

      {/* 缩略条：整页缩成一条，当前视窗以外压暗 */}
      <div style={{ position: 'absolute', left: MINI.x + (1 - miniIn) * 40, top: MINI.y, width: miniW, height: miniH, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: S.shadow, opacity: miniIn }}>
        {pageImgs(msx, msy)}
        <div style={{ position: 'absolute', left: 0, top: 0, width: miniW, height: vy, background: S.ink, opacity: 0.42 }} />
        <div style={{ position: 'absolute', left: 0, top: vy + vh2, width: miniW, height: Math.max(0, miniH - vy - vh2), background: S.ink, opacity: 0.42 }} />
      </div>
      {/* 各处在缩略条上的位置：左侧黑点，到过的实心 */}
      {stops.map((st, i) => {
        const v = p(t, at[0] + 0.35 + i * 0.06, at[0] + 0.6 + i * 0.06);
        const done = i <= cur;
        const pop = cur === i ? 1 + 0.35 * Math.sin(Math.PI * clamp((t - arrive[i] + 0.05) / 0.3)) : 1;
        return <div key={i} style={{
          position: 'absolute', left: MINI.x - 30, top: MINI.y + clamp(st.y * msy, 6, miniH - 6) - 9, width: 18, height: 18, borderRadius: 9,
          background: done ? S.ink : '#fff', boxShadow: S.shadow, opacity: v * miniIn, transform: `scale(${pop})`,
        }} />;
      })}
      {/* 当前这处讲什么：写在缩略条下方 */}
      {label && <div style={{
        ...textBase(LS, 900), position: 'absolute', left: COL.x - 10, width: COL.w + 20, textAlign: 'center',
        top: MINI.y + miniH + 34 + (1 - labelIn) * 14, color: S.ink, opacity: labelIn, whiteSpace: 'normal', lineHeight: 1.18,
      }}>{label}</div>}
    </Handoff>
    {at.slice(0, 4).map((a, i) => <Sfx key={i} name="whoosh-short" at={a} />)}
  </Frame>;
}
