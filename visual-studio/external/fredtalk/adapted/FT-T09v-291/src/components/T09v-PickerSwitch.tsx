// FredTalk 2.5 distribution: fred-recording-8-20261018
// T09v-PickerSwitch：下拉切换：选择器展开，选中一项，标签改写
// 观众要看懂的变化：输入框上的选择器 → 展开成选项列表，光标落到目标项（那一行变黑），列表收回，
// 原位标签逐字改写成新选项。
// 镜头（返工 2026-10-17，按 NEW-GATE；做法沿 CAM04 / INT03 的“Codex 全貌 → 浮起输入近景”）：
// Codex 整窗全貌 ≤0.8s → 输入框从窗口里浮起、背景压暗失焦，同时 cameraTransform 推近到“选择器 + 向上展开的列表”
// （列表字、标签字 ≥45px）→ 列表收回后镜头再推近一档到标签本身，停读逐字改写。
// 关系：同一张真实截图、同一个标签位置：列表从标签处长出、又收回标签处，标签原位改写。
// 和 T09i（截图列表里按条件选一行，判断过程）区分：本条是 UI 选择器的开合与标签改写（操作过程）。
// 选项列表是 kit 白卡（不冒充软件原生菜单）；标签原位只盖掉文字和箭头重写，图标与其余像素保持原样。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { S, cameraTransform, clamp, cueAt, mix, p, q, quintic, textWidth } from '../kit/theme';
import { ClickRing, Cursor, Frame, Handoff, HandoffProps, Sfx, Spotlight, Surface, textBase, useT } from '../kit/ui';

type Rect = { x: number; y: number; w: number; h: number };
export type PickerSwitchProps = HandoffProps & {
  image: string;
  imageSize: { w: number; h: number };
  crop: Rect;                // 输入框本体（源像素，贴着边线取）
  cropRadius: number;        // 输入框圆角（源像素）
  lift: number;              // 输入框从窗口里浮起多少（源像素，向上）；背景同时压暗失焦
  anchor: Rect;              // 选择器标签文字 + 箭头所在区域（源像素，会被盖掉重写）
  anchorMaxW: number;        // 标签原位能占多宽（源像素，右边是别的按钮）；更长的标签像真实界面一样向左撑开
  anchorIconsX: number;      // 标签左边跟着它走的图标（加载圈、闪电）的左边界（源像素）
  current: string;
  options: string[];
  pick: string;
  note?: string;             // 选完后输入框上方补一句（可留空）
  maskBoxes?: Rect[];        // 要实心盖掉的区域（如“完全访问”）
  dark?: boolean;            // 截图是深色界面时选项卡用黑卡
  cues?: number[];           // [0]=点开，[1]=选中
};

// 默认：Codex 输入框右下的模型 / 推理强度选择器（Fred 真实截图）
export const pickerSwitchDefaults: PickerSwitchProps = {
  image: 'fredtalk/media/lw-work-03.jpg',
  imageSize: { w: 3024, h: 1712 },
  crop: { x: 1063, y: 1473, w: 1478, h: 202 },
  cropRadius: 50,
  lift: 140,
  anchor: { x: 2150, y: 1614, w: 232, h: 46 },
  anchorMaxW: 262,
  anchorIconsX: 2055,
  current: 'GPT-6.1 Sol 高',
  options: ['GPT-6.1 Sol 低', 'GPT-6.1 Sol 中', 'GPT-6.1 Sol 高', 'GPT-6.1 Sol 超高'],
  pick: 'GPT-6.1 Sol 超高',
  note: '',
  maskBoxes: [{ x: 1150, y: 1611, w: 170, h: 50 }],
  dark: false,
};

// 共同前缀之后的部分先删再打（逐字改写）
const commonPrefix = (a: string, b: string) => {
  const A = Array.from(a), B = Array.from(b);
  let i = 0;
  while (i < A.length && i < B.length && A[i] === B[i]) i++;
  return i;
};

// 相机关键帧：x/y 为源像素焦点，d 为“源像素 → 屏幕像素”的倍数；段间 quintic，倍数按对数插值
type Key = { at: number; x: number; y: number; d: number };
const camAt = (keys: Key[], t: number) => {
  let k = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= a.at) break;
    const v = quintic(t, a.at, b.at);
    const d = Math.exp(mix(Math.log(a.d), Math.log(b.d), v));
    // 焦点按可见范围的变化走，画面边缘匀速收拢，不先偏后回
    const u = Math.abs(b.d - a.d) < 1e-4 ? v : clamp((1 / d - 1 / a.d) / (1 / b.d - 1 / a.d));
    k = { at: t, x: mix(a.x, b.x, u), y: mix(a.y, b.y, u), d };
  }
  return k;
};

export function PickerSwitch(props: Partial<PickerSwitchProps>) {
  const c = { ...pickerSwitchDefaults, ...props };
  const t = useT();
  const options = c.options.length ? c.options : [c.current, c.pick];
  const pickIdx = Math.max(0, options.indexOf(c.pick));
  const curIdx = options.indexOf(c.current);
  const n = options.length;

  // —— 世界坐标 = 源像素。全貌时整窗铺满 1920 宽 ——
  const IW = c.imageSize.w, IH = c.imageSize.h;
  const d0 = 1920 / IW;
  const B = c.crop;
  const boxR = B.x + B.w;

  // —— 时间 ——
  const openAt = cueAt(c.cues, 0, 1.2);
  const pickAt = cueAt(c.cues, 1, openAt + 0.9);
  const pushA = Math.max(0.35, openAt - 0.85), pushB = Math.max(pushA + 0.45, openAt - 0.1);
  const enter = p(t, 0, 0.3);
  const liftV = quintic(t, pushA, pushB);
  const L = c.lift * liftV;                          // 输入框当前上浮量
  const A = { ...c.anchor, y: c.anchor.y - L };      // 浮起后的标签位置（世界坐标）
  const BY = B.y - L;

  // 标签字号：贴合截图里的字，放不下就缩
  // 标签字号：贴合截图里的字；只有长到输入框放不下时才缩
  const room = c.anchor.x + c.anchorMaxW - (B.x + 260) - (c.anchor.x - c.anchorIconsX);
  const LFS = Math.min(c.anchor.h * 0.6, room / (Math.max(1, textWidth(c.current, 1), textWidth(c.pick, 1)) + 1.1));
  const blockW = (s: string) => textWidth(s, LFS) + LFS * 1.1;          // 字 + 箭头
  const shiftOf = (s: string) => Math.max(0, blockW(s) - c.anchorMaxW);  // 向左撑开多少

  // 选项列表（源像素尺度，接近原生菜单大小；从标签上方展开）
  const RH = n <= 5 ? 60 : 50;
  const OFS = Math.round(RH * 0.45);
  const LW = Math.max(...options.map((o) => textWidth(o, OFS))) + OFS * 3.4;
  const LH = n * RH + 20;
  const LX = clamp(c.anchor.x - 26, B.x + 20, boxR - LW - 12);
  const LY = A.y - 14 - LH;   // 列表底边贴着标签上沿（和原生菜单一样盖住输入框上半）
  const rowY = (i: number) => LY + 10 + i * RH;

  const open = p(t, openAt + 0.03, openAt + 0.3) * (1 - q(t, pickAt + 0.18, pickAt + 0.4));
  const hoverFrom = curIdx >= 0 ? curIdx : 0;
  const hoverMove = q(t, openAt + 0.35, pickAt - 0.12);
  const hoverRow = mix(hoverFrom, pickIdx, hoverMove);
  const hlIn = p(t, openAt + 0.2, openAt + 0.35);
  const chosen = p(t, pickAt, pickAt + 0.12);
  const pre = commonPrefix(c.current, c.pick);
  const delN = Array.from(c.current).length - pre;
  const addN = Array.from(c.pick).length - pre;
  const rwAt = pickAt + 0.5;
  const perChar = Math.min(0.08, 0.7 / Math.max(1, delN + addN));
  const delEnd = rwAt + delN * perChar, addEnd = delEnd + addN * perChar;
  let label = c.current;
  if (t >= rwAt) {
    const del = Math.min(delN, Math.floor((t - rwAt) / perChar));
    const add = t >= delEnd ? Math.min(addN, Math.floor((t - delEnd) / perChar)) : 0;
    label = Array.from(c.current).slice(0, Array.from(c.current).length - del).join('') + (add > 0 ? Array.from(c.pick).slice(pre, pre + add).join('') : '');
  }
  const typing = t >= rwAt && t < addEnd + 0.2;
  const labelW = textWidth(label, LFS);
  const shift = shiftOf(label);
  const labelX = c.anchor.x - shift;
  const settled = p(t, addEnd, addEnd + 0.45);

  // —— 镜头（全部按“浮起后”的位置取景）——
  const fit = (x0: number, x1: number, y0: number, y1: number, d: number) => ({
    x: clamp((x0 + x1) / 2, 960 / d, IW - 960 / d),
    y: clamp((y0 + y1) / 2, 540 / d, IH - 540 / d),
  });
  const BYf = B.y - c.lift, Ayf = c.anchor.y - c.lift, LYf = Ayf - 14 - LH;
  // 镜头 1（列表）：列表 + 标签 + 输入框右段
  const r1 = { x0: Math.min(LX, c.anchor.x - 170) - 40, x1: Math.max(LX + LW, boxR) + 50, y0: LYf - 40, y1: BYf + B.h + 30 };
  const d1 = Math.min(1.95, 1800 / (r1.x1 - r1.x0), 1000 / (r1.y1 - r1.y0));
  const f1 = fit(r1.x0, r1.x1, r1.y0, r1.y1, d1);
  // 镜头 2（标签）：再推近一档，标签居中停读
  const NS = c.note ? Math.min(30, 700 / Math.max(1, textWidth(c.note, 1))) : 0;   // 源像素字号
  const x2a = c.anchor.x - shiftOf(c.pick) - 260, x2b = boxR + 40;
  const y2a = c.note ? BYf - NS * 3.2 : BYf - 60, y2b = BYf + B.h + 40;
  const d2 = Math.min(2.1, 1820 / (x2b - x2a), 960 / (y2b - y2a));
  const f2 = fit(x2a, x2b, y2a, y2b, d2);
  const keys: Key[] = [
    { at: 0, x: IW / 2, y: IH / 2, d: d0 },
    { at: pushA, x: IW / 2, y: IH / 2, d: d0 },
    { at: pushB, x: f1.x, y: f1.y, d: d1 },
    { at: pickAt + 0.2, x: f1.x, y: f1.y, d: d1 },
    { at: pickAt + 0.85, x: f2.x, y: f2.y, d: d2 },
  ];
  const cam = camAt(keys, t);
  const z = cam.d / d0;
  const fx = cam.x * d0, fy = cam.y * d0;
  // 屏幕坐标（光标、点击环不随镜头放大）
  const scr = (x: number, y: number) => ({ x: 960 + (x * d0 - fx) * z, y: 540 + (y * d0 - fy) * z });

  // —— 光标：进场 → 选择器 → 目标行 → 让开 ——
  const anchorPt = { x: c.anchor.x - shiftOf(c.current) + textWidth(c.current, LFS) * 0.55, y: A.y + A.h * 0.62 };
  const rowPt = (i: number) => ({ x: LX + Math.min(LW * 0.42, 300), y: rowY(i) + RH * 0.62 });
  const g1 = p(t, pushA + 0.3, openAt - 0.06), g2 = q(t, openAt + 0.35, pickAt - 0.12), g3 = p(t, pickAt + 0.3, pickAt + 0.85);
  const s0 = { x: 1560, y: 1180 };
  const sA = scr(anchorPt.x, anchorPt.y);
  const sR = scr(rowPt(pickIdx).x, mix(rowPt(hoverFrom).y, rowPt(pickIdx).y, hoverMove));
  const sOut = scr(boxR - 30, BY + B.h + 40);
  let cx = mix(s0.x, sA.x, g1), cy = mix(s0.y, sA.y, g1);
  cx = mix(cx, sR.x, g2); cy = mix(cy, sR.y, g2);
  cx = mix(cx, sOut.x, g3); cy = mix(cy, sOut.y, g3);
  const press = Math.max(clamp(1 - Math.abs(t - openAt) / 0.1), clamp(1 - Math.abs(t - pickAt) / 0.1));
  const curOn = p(t, pushA + 0.25, pushA + 0.5) * (1 - p(t, pickAt + 0.6, pickAt + 0.9));
  const ringA = scr(anchorPt.x, anchorPt.y), ringR = scr(rowPt(pickIdx).x, rowPt(pickIdx).y);

  const noteIn = c.note ? p(t, addEnd + 0.1, addEnd + 0.5) : 0;
  const ink = c.dark ? '#fff' : S.ink;
  const focusRects = [{ x: B.x, y: BY, w: B.w, h: B.h }];   // 列表画在压暗层之上，本身不受压暗
  // 输入框内的元素用“输入框局部坐标”（源像素 - crop 原点）
  const lx = (x: number) => x - B.x, ly = (y: number) => y - B.y;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transformOrigin: '0 0', transform: cameraTransform(fx, fy, z, 1) }}>
        {/* 世界层：源像素 → 1920 宽 */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: IW, height: IH, transformOrigin: '0 0', transform: `scale(${d0})` }}>
          {/* 窗口背景：输入框浮起时失焦 */}
          <Img src={staticFile(c.image)} style={{ position: 'absolute', left: 0, top: 0, width: IW, height: IH, filter: liftV > 0.01 ? `blur(${4 * liftV}px)` : undefined }} />
          {(c.maskBoxes ?? []).map((m, i) => <div key={i} style={{ position: 'absolute', left: m.x, top: m.y, width: m.w, height: m.h, background: '#fff' }} />)}
          {/* 输入框浮起后，原位置留下的是窗口底色（不留第二个输入框） */}
          <div style={{ position: 'absolute', left: B.x - 6, top: B.y - 6, width: B.w + 12, height: B.h + 12, borderRadius: c.cropRadius, background: c.dark ? S.windowBody : '#fcfcfc', opacity: q(liftV, 0, 0.35), filter: 'blur(4px)' }} />
          {/* 背景压暗，只留浮起的输入框（和展开的列表） */}
          <Spotlight rects={focusRects} amount={liftV} dim={0.3} pad={0} radius={c.cropRadius} feather={3} />

          {/* 浮起的输入框（同一张截图的同一块像素） */}
          <div style={{
            position: 'absolute', left: B.x, top: BY, width: B.w, height: B.h, borderRadius: c.cropRadius, overflow: 'hidden', background: '#fff',
            boxShadow: liftV > 0.01 ? `0 ${24 * liftV}px ${40 * liftV}px rgba(0,0,0,${0.16 * liftV})` : undefined,
          }}>
            <Img src={staticFile(c.image)} style={{ position: 'absolute', left: -B.x, top: -B.y, width: IW, height: IH }} />
            {(c.maskBoxes ?? []).map((m, i) => <div key={i} style={{ position: 'absolute', left: lx(m.x), top: ly(m.y), width: m.w, height: m.h, background: '#fff' }} />)}
            {/* 标签：盖掉原字，原位重写；箭头跟在字后 */}
            <div style={{ position: 'absolute', left: lx(shift > 0 ? c.anchorIconsX - shift - 4 : c.anchor.x), top: ly(c.anchor.y), width: c.anchorMaxW + (shift > 0 ? c.anchor.x - c.anchorIconsX + shift + 4 : 0), height: c.anchor.h, background: '#fff' }} />
            {shift > 0 && <div style={{ position: 'absolute', left: lx(c.anchorIconsX - shift), top: ly(c.anchor.y), width: c.anchor.x - c.anchorIconsX, height: c.anchor.h, overflow: 'hidden' }}>
              <Img src={staticFile(c.image)} style={{ position: 'absolute', left: -c.anchorIconsX, top: -c.anchor.y, width: IW, height: IH }} />
            </div>}
            {settled > 0 && settled < 1 && <div style={{ position: 'absolute', left: lx(labelX) - 4, top: ly(c.anchor.y) + c.anchor.h * 0.6, width: (labelW + 8) * Math.min(1, settled * 2), height: c.anchor.h * 0.32, borderRadius: 5, background: S.accent, opacity: 0.24 * (1 - q(settled, 0.6, 1)) }} />}
            <div style={{ ...textBase(LFS, 500), position: 'absolute', left: lx(labelX), top: ly(c.anchor.y), height: c.anchor.h, display: 'flex', alignItems: 'center', lineHeight: 1, color: S.ink }}>
              <span>{label}</span>
              <span style={{ display: 'inline-block', width: 2, height: LFS * 1.05, marginLeft: 1, background: S.ink, opacity: typing && Math.floor(t * 5) % 2 === 0 ? 1 : 0 }} />
              <svg width={LFS * 0.62} height={LFS * 0.62} viewBox="0 0 24 24" style={{ marginLeft: LFS * 0.4 }}>
                <path d="M6 9 L12 15 L18 9" stroke={S.muted} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* 选项列表：从标签处向上展开 */}
          {open > 0 && <div style={{ position: 'absolute', left: LX - 60, top: LY - 60, width: LW + 120, height: LH + 100, overflow: 'hidden', clipPath: `inset(${60 + LH * (1 - open)}px 0 0 0)` }}>
            <Surface box={{ x: 60, y: 60 + (1 - open) * 14, w: LW, h: LH }} dark={c.dark} radius={18}>
              <div style={{ position: 'absolute', left: 8, right: 8, top: 10 + hoverRow * RH, height: RH, borderRadius: 12, background: ink, opacity: hlIn, transform: `scale(${mix(0.97, 1, chosen)})` }} />
              {options.map((o, i) => {
                const on = Math.abs(hoverRow - i) < 0.5 && hlIn > 0.5;
                const isCur = i === curIdx;
                return <div key={i} style={{ position: 'absolute', left: 8, right: 8, top: 10 + i * RH, height: RH, display: 'flex', alignItems: 'center' }}>
                  <span style={{ ...textBase(OFS, i === pickIdx || isCur ? 600 : 500), position: 'relative', marginLeft: OFS * 0.85, color: on ? (c.dark ? S.ink : '#fff') : ink }}>{o}</span>
                  {isCur && <svg width={OFS} height={OFS} viewBox="0 0 24 24" style={{ position: 'absolute', right: OFS * 0.7 }}>
                    <path d="M5 12.5 L10 17 L19 7.5" stroke={on ? (c.dark ? S.ink : '#fff') : ink} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>}
                </div>;
              })}
            </Surface>
          </div>}

          {c.note && <div style={{ ...textBase(NS, 900), position: 'absolute', left: x2a, width: x2b - x2a, textAlign: 'center', top: BY - NS * 2.3 + (1 - noteIn) * 10, color: S.ink, opacity: noteIn }}>{c.note}</div>}
        </div>
      </div>
      <ClickRing x={ringA.x} y={ringA.y} t={t} at={openAt} />
      <ClickRing x={ringR.x} y={ringR.y} t={t} at={pickAt} />
      {curOn > 0 && <Cursor x={cx - 6} y={cy - 4} scale={1.1} press={press} style={{ opacity: curOn }} />}
    </Handoff>
    <Sfx name="whoosh-short" at={openAt} />
    <Sfx name="click" at={pickAt} />
  </Frame>;
}
