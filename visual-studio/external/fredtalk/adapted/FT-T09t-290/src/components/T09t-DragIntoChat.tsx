// FredTalk 2.5 distribution: fred-recording-8-20261018
// T09t-DragIntoChat：拖文件进对话框：从文件夹拖进去，落成附件
// 观众要看懂的变化：文件夹里的几张照片 → 逐张点选 → 光标按住拖出（缩略图跟手叠成一摞、带数量，原位留下半透明重影）
// → 对话框被点亮成落点 → 松手后照片落进框里成为附件，输入框原位向上撑开。
// 镜头（返工 2026-10-17，按 NEW-GATE）：全貌 ≤0.8s → cameraTransform 推近到文件夹（缩略图 ≥340px、文件名 ≥36px）
// → 镜头跟着拖动的那一摞下移 → 文件夹退场，镜头落在整只输入框上停读（附件 ≥190px）。
// 关系：同一组照片（文件夹里的缩略图 → 跟手的一摞 → 框里的附件），同一个真实输入框（豆包截图，上下两段之间撑开）。
// 和 T09l（复制一段地址）、N044（商品图压成附件、无拖拽过程）区分：本条是真实的拖放动作，可一次多张。
// 文件夹是 kit 窗口（不冒充 Finder 截图）；输入框是真实截图，只把被录屏光标圈住的占位字盖掉重写。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { S, cameraTransform, clamp, cueAt, mix, p, q, quintic, textWidth } from '../kit/theme';
import { Box, ClickRing, Cursor, Frame, Handoff, HandoffProps, MacWindow, Sfx, Spotlight, abs, between, textBase, useT } from '../kit/ui';

type Rect = { x: number; y: number; w: number; h: number };
export type DragFile = { name: string; thumb: string };
export type DragIntoChatProps = HandoffProps & {
  files: DragFile[];            // 文件夹里显示的文件
  drag: number[];               // 要拖走的是哪几个（下标）
  sourceWindowTitle: string;
  folderIcon?: string;          // 窗口标题旁的真实图标（可留空）
  target: string;               // 输入框所在的真实截图
  targetSize: { w: number; h: number };
  targetCrop: Rect;             // 输入框本体（源像素，贴着边线取）
  targetRadius: number;         // 输入框圆角（源像素）
  splitY: number;               // 从这一行把输入框上下分开，附件放进撑开的空隙（源像素，取占位字和工具栏之间的干净行）
  placeholderBox: Rect;         // 要盖掉重写的占位字区域（源像素）
  placeholder: string;
  boxInnerX: [number, number];  // 输入框左右边线之间的内侧范围（源像素）
  dropLabel: string;            // 拖到框上时，占位字换成这句
  cues?: number[];              // [0]=按下开始拖，[1]=松手
};

// 默认：124 期“把芝麻糊的几张照片拖进去”——Fred 家布偶猫的照片，拖进豆包的对话框（豆包真实截图）
export const dragIntoChatDefaults: DragIntoChatProps = {
  files: [
    { name: '芝麻糊-1.png', thumb: 'fredtalk/media/lw-work-01.jpg' },
    { name: '芝麻糊-2.png', thumb: 'fredtalk/media/lw-work-06.jpg' },
    { name: '芝麻糊-3.png', thumb: 'fredtalk/media/lw-work-01.jpg' },
    { name: '芝麻糊-4.png', thumb: 'fredtalk/media/lw-work-04.jpg' },
  ],
  drag: [0, 1],
  sourceWindowTitle: '芝麻糊的照片',
  folderIcon: 'fredtalk/media/lw-work-06.jpg',
  target: 'fredtalk/media/lw-work-02.jpg',
  targetSize: { w: 3840, h: 2160 },
  targetCrop: { x: 722, y: 1820, w: 2800, h: 290 },
  targetRadius: 70,
  splitY: 1975,
  placeholderBox: { x: 768, y: 1862, w: 620, h: 88 },
  placeholder: '发消息或按住空格说话...',
  boxInnerX: [728, 3516],
  dropLabel: '松手，放进对话框',
};

const INPUT_W = 1500;

// 文件名太长时中间省略：保留开头几个字和结尾（序号、扩展名），和 Finder 的截断方式一致
const fitName = (name: string, size: number, maxW: number) => {
  if (textWidth(name, size) <= maxW) return name;
  const ch = Array.from(name);
  const head = ch.slice(0, 4).join('');
  let tail = '';
  for (let i = ch.length - 1; i > 4; i--) {
    const next = ch[i] + tail;
    if (textWidth(head + '…' + next, size) > maxW) break;
    tail = next;
  }
  return head + '…' + tail;
};

// 相机关键帧（设计坐标 1920×1080）：x/y 焦点，z 倍数；段间 quintic，倍数按对数插值
type Key = { at: number; x: number; y: number; z: number };
const camAt = (keys: Key[], t: number) => {
  let k = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= a.at) break;
    const v = quintic(t, a.at, b.at);
    const z = Math.exp(mix(Math.log(a.z), Math.log(b.z), v));
    k = { at: t, x: mix(a.x, b.x, v), y: mix(a.y, b.y, v), z };
  }
  return k;
};

export function DragIntoChat(props: Partial<DragIntoChatProps>) {
  const c = { ...dragIntoChatDefaults, ...props };
  const t = useT();
  const files = c.files.length ? c.files : dragIntoChatDefaults.files;
  const drag = (c.drag.length ? c.drag : [0]).filter((i) => i >= 0 && i < files.length);
  const nd = drag.length;

  // —— 版式（设计坐标）：上方文件夹窗口，下方真实输入框 ——
  const nf = files.length;
  const GAP_T = 36;
  const TILE = Math.min(300, (1560 - 120 - (nf - 1) * GAP_T) / nf);
  const NAME = 30;
  const BAR = 72;
  const WIN: Box = { w: nf * TILE + (nf - 1) * GAP_T + 120, h: BAR + 36 + TILE + 18 + NAME * 1.4 + 34, x: 0, y: 46 };
  WIN.x = 960 - WIN.w / 2;
  const tileBox = (i: number): Box => ({ x: WIN.x + 60 + i * (TILE + GAP_T), y: WIN.y + BAR + 36, w: TILE, h: TILE });

  const TC = c.targetCrop;
  const k = INPUT_W / TC.w;
  const topH = (c.splitY - TC.y) * k;
  const botH = (TC.y + TC.h - c.splitY) * k;
  const AT = Math.min(230, (INPUT_W - 100) / Math.max(1, nd) - 22);   // 附件缩略图边长
  const GAP_MAX = AT + 34;
  const INPUT_X = 960 - INPUT_W / 2;
  const INPUT_BOTTOM = 1046;

  // —— 时间 ——
  const grabAt = cueAt(c.cues, 0, 1.4);
  const dropAt = cueAt(c.cues, 1, grabAt + 1.2);
  const enter = p(t, 0, 0.3);
  const selAt = (j: number) => grabAt - 0.42 + j * Math.min(0.14, 0.3 / Math.max(1, nd));
  const lift = p(t, grabAt, grabAt + 0.28);
  const travel = q(t, grabAt + 0.12, dropAt - 0.04);
  const hover = p(t, dropAt - 0.42, dropAt - 0.1) * (1 - p(t, dropAt + 0.05, dropAt + 0.3));
  const open = q(t, dropAt - 0.02, dropAt + 0.26);   // 先撑开，照片再落进去，不压工具栏
  const land = q(t, dropAt, dropAt + 0.45);
  const gap = GAP_MAX * open;
  const INPUT_TOP = INPUT_BOTTOM - topH - botH - gap;
  const folderOut = q(t, dropAt - 0.35, dropAt + 0.25);   // 文件夹退后（不留半截在画里）

  // 拖拽轨迹：从被拖文件的中心，沿弧线到输入框中部
  const srcC = (() => { const b = tileBox(drag[0]); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; })();
  const dst = { x: 760, y: INPUT_BOTTOM - botH - 120 };
  const ctl = { x: (srcC.x + dst.x) / 2 + 300, y: (srcC.y + dst.y) / 2 - 40 };
  const bez = (u: number) => ({
    x: (1 - u) ** 2 * srcC.x + 2 * (1 - u) * u * ctl.x + u * u * dst.x,
    y: (1 - u) ** 2 * srcC.y + 2 * (1 - u) * u * ctl.y + u * u * dst.y,
  });
  const hand = bez(travel);
  const DS = Math.min(240, TILE * 0.82);   // 跟手时的缩略图边长
  const slot = (j: number): Box => ({ x: INPUT_X + 34 + j * (AT + 18), y: INPUT_TOP + topH + 6, w: AT, h: AT });

  // —— 镜头 ——
  const zF = Math.min(1.9, 1840 / (WIN.w + 40), 1000 / (WIN.h + 40));
  const finalTop = INPUT_BOTTOM - topH - botH - GAP_MAX;
  const zI = Math.min(1.3, 1840 / (INPUT_W + 60));
  const slotsW = nd * AT + (nd - 1) * 18 + 34;
  const zC = Math.max(zI, Math.min(1.8, 1780 / (slotsW + 160)));
  const keys: Key[] = [
    { at: 0, x: 960, y: 540, z: 1 },
    { at: 0.4, x: 960, y: 540, z: 1 },
    { at: Math.max(0.9, grabAt - 0.45), x: WIN.x + WIN.w / 2, y: WIN.y + WIN.h / 2, z: zF },
    { at: grabAt + 0.1, x: WIN.x + WIN.w / 2, y: WIN.y + WIN.h / 2, z: zF },
    // 拖动途中镜头拉回全貌：文件夹和输入框都完整在画内，那一摞从上走到下
    { at: dropAt - 0.12, x: 960, y: 540, z: 1 },
    { at: dropAt + 0.55, x: 960, y: (finalTop + INPUT_BOTTOM) / 2, z: zI },
    // 落定后再推近一档：附件 + 输入框左段成为画面主体（附件 ≥400px），停读
    { at: dropAt + 1.25, x: INPUT_X - 70 / zC + 960 / zC, y: (finalTop + INPUT_BOTTOM) / 2, z: zC },
  ];
  const cam = camAt(keys, t);
  const camX = cam.x, camY = cam.y, z = cam.z;
  const scr = (x: number, y: number) => ({ x: 960 + (x - camX) * z, y: 540 + (y - camY) * z });

  // 光标（屏幕坐标）：进场 → 逐张点选 → 按住拖 → 松手后离开
  const tileC = (i: number) => { const b = tileBox(i); return { x: b.x + b.w * 0.55, y: b.y + b.h * 0.6 }; };
  let wx = tileC(drag[0]).x + 260, wy = tileC(drag[0]).y + 300;
  const toFirst = p(t, 0.55, selAt(0) - 0.05);
  wx = mix(wx, tileC(drag[0]).x, toFirst); wy = mix(wy, tileC(drag[0]).y, toFirst);
  for (let j = 1; j < nd; j++) {
    const v = p(t, selAt(j - 1) + 0.03, selAt(j) - 0.02);
    wx = mix(wx, tileC(drag[j]).x, v); wy = mix(wy, tileC(drag[j]).y, v);
  }
  const back = p(t, selAt(nd - 1) + 0.04, grabAt - 0.02);
  wx = mix(wx, srcC.x + 20, back); wy = mix(wy, srcC.y + 20, back);
  if (t >= grabAt) { wx = hand.x + 30; wy = hand.y + 30; }
  const away = p(t, dropAt + 0.25, dropAt + 0.85);
  const cs = scr(wx, wy);
  const cx = cs.x + away * 300, cy = cs.y + away * 200;
  const press = t >= grabAt - 0.05 && t < dropAt ? 1 : Math.max(0, ...drag.map((_, j) => clamp(1 - Math.abs(t - selAt(j)) / 0.08)));

  const textY = INPUT_TOP + (c.placeholderBox.y + c.placeholderBox.h / 2 - TC.y) * k;
  const phSize = Math.round(c.placeholderBox.h * k * 0.52);
  const dropSize = Math.max(phSize, 38);   // 落点提示在全貌镜头里也要 ≥36px
  const showDrop = hover > 0.5;
  const imgStyle = (offsetY: number) => ({ position: 'absolute' as const, left: -TC.x * k, top: -offsetY * k, width: c.targetSize.w * k, height: c.targetSize.h * k });
  const R = c.targetRadius * k;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transformOrigin: '0 0', transform: cameraTransform(camX, camY, z, 1) }}>
        {/* 文件夹窗口（kit 窗口，内容是真实照片）；松手前后整只退后淡出 */}
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - folderOut, transform: `scale(${mix(1, 0.94, folderOut)})`, transformOrigin: `${WIN.x + WIN.w / 2}px ${WIN.y}px` }}>
          <MacWindow light box={WIN} bar={BAR}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: -BAR, height: BAR, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              {c.folderIcon && <Img src={staticFile(c.folderIcon)} style={{ width: 36, height: 36 }} />}
              <span style={{ ...textBase(28, 500), color: S.muted }}>{c.sourceWindowTitle}</span>
            </div>
            {files.map((f, i) => {
              const b = tileBox(i);
              const j = drag.indexOf(i);
              const picked = j >= 0;
              const sel = picked ? p(t, selAt(j), selAt(j) + 0.12) : 0;
              const name = fitName(f.name, NAME, TILE + 10);
              const nameW = Math.min(TILE + 24, textWidth(name, NAME) + NAME * 0.9);
              return <div key={i} style={{ position: 'absolute', left: b.x - WIN.x, top: b.y - WIN.y - BAR, width: TILE }}>
                <div style={{
                  width: TILE, height: TILE, borderRadius: 18, overflow: 'hidden', boxShadow: S.shadow,
                  opacity: picked ? mix(1, 0.35, lift) : 1, transform: `scale(${1 + 0.03 * sel * (1 - lift)})`,
                }}>
                  <Img src={staticFile(f.thumb)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ position: 'relative', marginTop: 14, height: NAME * 1.4, width: TILE }}>
                  <div style={{ position: 'absolute', left: (TILE - nameW) / 2, width: nameW, height: NAME * 1.4, borderRadius: NAME * 0.7, background: S.ink, opacity: sel * (1 - 0.6 * lift) }} />
                  <div style={{ ...textBase(NAME, sel > 0.5 ? 600 : 500), position: 'absolute', left: 0, width: TILE, top: NAME * 0.2, textAlign: 'center', color: sel > 0.5 ? '#fff' : S.muted }}>{name}</div>
                </div>
              </div>;
            })}
          </MacWindow>
        </div>

        {/* 真实输入框：上下两段之间撑开放附件（底边不动，向上长） */}
        <div style={{
          position: 'absolute', left: INPUT_X, top: INPUT_TOP, width: INPUT_W, height: topH + gap + botH, borderRadius: R, overflow: 'hidden',
          transform: `scale(${1 + 0.012 * hover})`, transformOrigin: '50% 50%', boxShadow: `0 ${16 * hover}px ${30 * hover}px rgba(0,0,0,${0.12 * hover})`,
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: INPUT_W, height: topH, overflow: 'hidden' }}>
            <Img src={staticFile(c.target)} style={imgStyle(TC.y)} />
            <div style={{ position: 'absolute', left: (c.placeholderBox.x - TC.x) * k, top: (c.placeholderBox.y - TC.y) * k, width: c.placeholderBox.w * k, height: c.placeholderBox.h * k, background: '#fff' }} />
          </div>
          {/* 撑开的空隙：用分界处几行真实像素拉伸，左右边线保持连续 */}
          <div style={{ position: 'absolute', left: 0, top: topH - 1, width: INPUT_W, height: gap + 2, overflow: 'hidden' }}>
            <Img src={staticFile(c.target)} style={{ ...imgStyle(c.splitY - 3), transformOrigin: `0 ${(c.splitY - 3) * k}px`, transform: `scaleY(${Math.max(0.01, (gap + 2) / (3 * k))})` }} />
            <div style={{ position: 'absolute', left: (c.boxInnerX[0] - TC.x) * k, top: 0, width: (c.boxInnerX[1] - c.boxInnerX[0]) * k, height: gap + 2, background: '#fff' }} />
          </div>
          <div style={{ position: 'absolute', left: 0, top: topH + gap, width: INPUT_W, height: botH, overflow: 'hidden' }}>
            <Img src={staticFile(c.target)} style={imgStyle(c.splitY)} />
          </div>
          <div style={{ ...textBase(showDrop ? dropSize : phSize, showDrop ? 900 : 500), position: 'absolute', left: (c.placeholderBox.x + 8 - TC.x) * k, top: textY - INPUT_TOP - (showDrop ? dropSize : phSize) * 0.6, color: showDrop ? S.ink : S.faint }}>
            {showDrop ? c.dropLabel : <span style={{ opacity: 1 - Math.sin(Math.PI * clamp((t - dropAt) / 0.55)) * (t > dropAt ? 1 : 0) }}>{c.placeholder}</span>}
          </div>
        </div>
        {/* 落点：其余画面局部压暗，只留输入框 */}
        <Spotlight rects={[{ x: INPUT_X, y: INPUT_TOP, w: INPUT_W, h: topH + gap + botH }]} amount={hover} dim={0.35} radius={R} pad={4} />

        {/* 跟手的一摞 → 落成附件 */}
        {lift > 0 && drag.map((fi, j) => {
          const f = files[fi];
          const backN = nd - 1 - j;
          const flyB: Box = { x: hand.x - DS / 2 + backN * 16, y: hand.y - DS / 2 - backN * 12, w: DS, h: DS };
          const from = tileBox(fi);
          const carried = t < dropAt ? between(from, flyB, lift) : between(flyB, slot(j), land);
          const rot = (backN - (nd - 1) / 2) * 6 * (t < dropAt ? lift : 1 - land);
          return <div key={fi} style={{
            ...abs(carried), borderRadius: mix(18, 16, land), overflow: 'hidden', zIndex: 700 + j,
            boxShadow: t < dropAt ? S.capsuleShadow : S.shadow, transform: `rotate(${rot}deg)`, opacity: t < dropAt ? mix(1, 0.94, lift) : 1,
          }}>
            <Img src={staticFile(f.thumb)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>;
        })}
        {/* 多张时，叠在一起的那一摞带数量 */}
        {nd > 1 && lift > 0 && t < dropAt + 0.05 && <div style={{
          position: 'absolute', left: hand.x + DS / 2 - 10, top: hand.y - DS / 2 - 44, width: 64, height: 64, borderRadius: 32, background: S.ink, zIndex: 760,
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: S.shadow, transform: `scale(${lift * (1 - p(t, dropAt - 0.05, dropAt + 0.05))})`,
        }}><span style={{ ...textBase(36, 900), color: '#fff', lineHeight: 1 }}>{nd}</span></div>}
      </div>

      {drag.map((fi, j) => { const s = scr(tileC(fi).x, tileC(fi).y); return <ClickRing key={fi} x={s.x} y={s.y} t={t} at={selAt(j)} />; })}
      {away < 1 && <Cursor x={cx - 6} y={cy - 4} scale={1.1} press={press} style={{ opacity: p(t, 0.5, 0.75) * (1 - away), zIndex: 800 }} />}
    </Handoff>
    <Sfx name="click" at={selAt(0)} volume={0.35} />
    <Sfx name="whoosh-short" at={grabAt} />
    <Sfx name="pop" at={dropAt + 0.3} />
  </Frame>;
}
