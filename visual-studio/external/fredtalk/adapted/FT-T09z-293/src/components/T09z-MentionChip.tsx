// FredTalk 2.5 distribution: fred-recording-8-20261018
// T09z-MentionChip：@ 引用：输入 @，联想列表弹出，选中后变成框内标签
// 观众要看懂的变化：输入框里打出 @ → 联想列表弹出 → 选中的那一行缩成一枚标签，落回刚才 @ 的位置，后面继续打字。
// 镜头（返工 2026-10-17，按 NEW-GATE；做法沿 CAM04 / INT03 的“Codex 全貌 → 浮起输入近景”）：
// Codex 整窗全貌 ≤0.8s → 输入框浮起、背景压暗失焦，cameraTransform 推近到“输入行 + 向上弹出的列表”（字 ≥45px）
// → 选中后镜头横移、按整句长度重新取景，停读整句（长句也 ≥36px）。
// 关系：同一个真实输入框（Codex 截图）；被选中的那一项是同一个对象（列表里的一行 → 飞回输入框 → 框内标签）。
// 和 INT03 / T09d（打字发送）区分：本条是“把某个文件 / 能力挂进指令”的中间动作。
// 联想列表是 kit 白卡（不冒充原生菜单）；输入框只盖掉占位字重写，“完全访问”实心遮住。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { S, cameraTransform, clamp, cueAt, mix, p, q, quintic, textWidth } from '../kit/theme';
import { Box, ClickRing, Cursor, Frame, Handoff, HandoffProps, Sfx, Spotlight, Surface, abs, between, textBase, useT } from '../kit/ui';

type Rect = { x: number; y: number; w: number; h: number };
export type MentionItem = { icon?: string; label: string; desc?: string };
export type MentionChipProps = HandoffProps & {
  image: string;
  imageSize: { w: number; h: number };
  crop: Rect;                 // 输入框本体（源像素，贴着边线取）
  cropRadius: number;         // 输入框圆角（源像素）
  lift: number;               // 输入框从窗口里浮起多少（源像素，向上）
  textStart: { x: number; y: number };   // 第一行文字起点（左端、行中线，源像素）
  textSize: number;           // 截图里正文的字号（源像素）
  placeholderBox: Rect;       // 要盖掉的占位字（源像素）
  maskBoxes?: Rect[];
  prefix: string;             // @ 前已经打好的字
  query: string;              // @ 后接着打的检索词（可空）
  items: MentionItem[];
  pick: number;               // 选第几项
  after: string;              // 标签后继续打的字
  cues?: number[];            // [0]=打出 @，[1]=选中，[2]=开始继续打字
};

// 默认：在 Codex 里引用 Fred 组件库的规则文件（文件名为 fred-remotion-output 里的真实文件）
export const mentionChipDefaults: MentionChipProps = {
  image: 'fredtalk/media/lw-work-03.jpg',
  imageSize: { w: 3024, h: 1712 },
  crop: { x: 1063, y: 1473, w: 1478, h: 202 },
  cropRadius: 50,
  lift: 140,
  textStart: { x: 1093, y: 1532 },
  textSize: 28,
  placeholderBox: { x: 1084, y: 1504, w: 260, h: 58 },
  maskBoxes: [{ x: 1150, y: 1611, w: 170, h: 50 }],
  prefix: '按 ',
  query: '',
  items: [
    { label: 'DESIGN.md', desc: 'fred-remotion-output' },
    { label: 'motion-craft.md', desc: 'references' },
    { label: 'new-component-workflow.md', desc: 'references' },
  ],
  pick: 0,
  after: ' 的规则，做一个新组件',
};

const MONO = 0.6 / 0.58;   // Source Code Pro 字宽相对 textWidth 的拉丁估算
const take = (s: string, n: number) => Array.from(s).slice(0, Math.max(0, n)).join('');

// 相机关键帧：x/y 为源像素焦点，d 为“源像素 → 屏幕像素”的倍数；段间 quintic，倍数按对数插值
type Key = { at: number; x: number; y: number; d: number };
const camAt = (keys: Key[], t: number) => {
  let k = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= a.at) break;
    const v = quintic(t, a.at, b.at);
    const d = Math.exp(mix(Math.log(a.d), Math.log(b.d), v));
    const u = Math.abs(b.d - a.d) < 1e-4 ? v : clamp((1 / d - 1 / a.d) / (1 / b.d - 1 / a.d));
    k = { at: t, x: mix(a.x, b.x, u), y: mix(a.y, b.y, u), d };
  }
  return k;
};

// 按宽度折行（中文逐字、英文按字符估宽）
const wrap = (s: string, size: number, first: number, rest: number) => {
  const lines: string[] = [''];
  let w = 0, room = first;
  for (const ch of Array.from(s)) {
    const cw = textWidth(ch, size);
    if (w + cw > room && lines[lines.length - 1] !== '') { lines.push(''); w = 0; room = rest; }
    lines[lines.length - 1] += ch; w += cw;
  }
  return lines;
};

export function MentionChip(props: Partial<MentionChipProps>) {
  const c = { ...mentionChipDefaults, ...props };
  const t = useT();
  const items = c.items.length ? c.items : mentionChipDefaults.items;
  const pick = clamp(Math.round(c.pick), 0, items.length - 1);
  const chosen = items[pick];
  const n = items.length;

  const IW = c.imageSize.w, IH = c.imageSize.h;
  const d0 = 1920 / IW;
  const B = c.crop;

  // —— 时间 ——
  const atAt = cueAt(c.cues, 0, 1.15);
  const pushA = Math.max(0.35, atAt - 0.8), pushB = Math.max(pushA + 0.45, atAt - 0.15);
  const enter = p(t, 0, 0.3);
  const liftV = quintic(t, pushA, pushB);
  const L = c.lift * liftV;
  const BY = B.y - L;
  const preStart = Math.min(pushA + 0.3, atAt - 0.2), preEnd = atAt - 0.04;
  const qLen = Array.from(c.query).length;
  const qEnd = atAt + 0.1 + qLen * 0.08;
  const listAt = atAt + 0.06;
  const pickAt = cueAt(c.cues, 1, Math.max(qEnd + 0.5, listAt + 0.8));
  const fly = q(t, pickAt + 0.05, pickAt + 0.42);
  const listOpen = p(t, listAt, listAt + 0.28);
  const listVis = 1 - q(t, pickAt + 0.02, pickAt + 0.16);   // 选中后列表很快淡掉，飞出的标签不压别的行
  const afterAt = cueAt(c.cues, 2, pickAt + 0.5);
  const afterLen = Array.from(c.after).length;
  const afterEnd = afterAt + Math.min(1.1, afterLen * 0.065);

  const preShown = t < preStart ? '' : take(c.prefix, Math.floor(clamp((t - preStart) / Math.max(0.01, preEnd - preStart)) * Array.from(c.prefix).length + 1e-6));
  const typedQ = t < atAt ? '' : '@' + take(c.query, Math.floor(clamp((t - atAt - 0.1) / Math.max(0.01, qEnd - atAt - 0.1)) * qLen + 1e-6));
  const afterShown = t < afterAt ? '' : take(c.after, Math.floor(clamp((t - afterAt) / Math.max(0.01, afterEnd - afterAt)) * afterLen + 1e-6));
  const chipOn = t >= pickAt + 0.42;

  // —— 输入框里的文字（源像素，输入框局部坐标）——
  const TX = c.textStart.x - B.x, TY = c.textStart.y - B.y;
  const availW = B.w - TX * 2 - 20;
  // 长句：收尾镜头要整只输入框入画（不切半截），这时正文略放大到推近后仍 ≥37px
  const dWhole = 1840 / (B.w + 60);
  const longCase = textWidth(c.prefix + '@' + chosen.label + c.after, c.textSize) > B.w * 0.62;
  const FS = longCase ? Math.max(c.textSize, 37 / dWhole) : c.textSize;
  const LINE = FS * 1.5;
  const chipLabel = '@' + chosen.label;
  const chipFS = FS * 0.86;
  const chipW = textWidth(chipLabel, chipFS) * MONO + chipFS * 0.9;
  const preW = textWidth(preShown, FS);
  const headW = preW + (chipOn ? chipW + 8 : textWidth(t < pickAt + 0.05 ? typedQ : '', FS));
  const lines = wrap(afterShown, FS, availW - headW, availW);
  const nLines = afterShown ? lines.length : 1;
  const scrollUp = Math.max(0, nLines - 2) * LINE;
  // 整句最终长度（取景用）
  const fullHead = textWidth(c.prefix, FS) + chipW + 8;
  const fullLines = wrap(c.after, FS, availW - fullHead, availW);
  const finalExtent = fullLines.length > 1 ? availW : fullHead + textWidth(c.after, FS);

  // —— 联想列表（源像素尺度，接近原生菜单大小；左边对齐 @）——
  const RH = n <= 4 ? 58 : 50;
  const LFS = Math.round(RH * 0.44);
  const hasIcon = items.some((it) => it.icon);
  const LW = Math.max(...items.map((it) => textWidth(it.label, LFS) * MONO + (it.desc ? textWidth(it.desc, LFS * 0.8) + LFS * 1.1 : 0))) + LFS * 2.4 + (hasIcon ? RH * 0.7 : 0);
  const listH = n * RH + 20;
  const atLocalX = TX + textWidth(c.prefix, FS);
  const LX = clamp(B.x + atLocalX - 18, B.x + 10, B.x + B.w - LW - 10);
  const LY = BY - 12 - listH;
  const rowBox = (i: number): Box => ({ x: LX + 8, y: LY + 10 + i * RH, w: LW - 16, h: RH });
  const hover = q(t, listAt + 0.3, pickAt - 0.12);
  const hoverY = mix(rowBox(0).y, rowBox(pick).y, hover);

  // —— 镜头 ——
  const fit = (x0: number, x1: number, y0: number, y1: number, d: number) => ({
    x: clamp((x0 + x1) / 2, 960 / d, IW - 960 / d),
    y: clamp((y0 + y1) / 2, 540 / d, IH - 540 / d),
  });
  const BYf = B.y - c.lift, LYf = BYf - 12 - listH;
  // 镜头 1：输入行 + 列表
  const r1 = { x0: B.x - 40, x1: Math.max(LX + LW, B.x + atLocalX + 420) + 50, y0: LYf - 40, y1: BYf + TY + LINE + 20 };
  const d1 = Math.min(2.0, 1800 / (r1.x1 - r1.x0), 1000 / (r1.y1 - r1.y0));
  const f1 = fit(r1.x0, r1.x1, r1.y0, r1.y1, d1);
  // 镜头 2：按整句长度重新取景，整只输入框的高度都在画内
  const r2 = longCase ? { x0: B.x - 30, x1: B.x + B.w + 30, y0: BYf - 50, y1: BYf + B.h + 40 }
    : { x0: B.x - 50, x1: B.x + TX + Math.max(finalExtent, 420) + 70, y0: BYf - 50, y1: BYf + B.h + 40 };
  const d2 = Math.min(2.0, 1840 / (r2.x1 - r2.x0), 960 / (r2.y1 - r2.y0));
  const f2 = fit(r2.x0, r2.x1, r2.y0, r2.y1, d2);
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
  const scr = (x: number, y: number) => ({ x: 960 + (x * d0 - fx) * z, y: 540 + (y * d0 - fy) * z });

  // 选中的那一行 → 缩成框内标签（同一个对象；世界坐标）
  const lineY = BY + TY - scrollUp;
  const chipBox: Box = { x: B.x + TX + preW, y: lineY - FS * 0.7, w: chipW, h: FS * 1.4 };
  const fromRow = rowBox(pick);
  const flyFrom: Box = { x: fromRow.x + 6, y: fromRow.y + 8, w: textWidth(chipLabel, LFS) * MONO + LFS * 1.2, h: fromRow.h - 16 };
  const flyB = between(flyFrom, chipBox, fly);
  const flyFS = mix(LFS, chipFS, fly);

  // 光标：只在点选那一下出现（屏幕坐标，不随镜头放大）
  const rowPt = { x: fromRow.x + Math.min(fromRow.w * 0.45, 240), y: 0 };
  const curIn = p(t, listAt + 0.2, listAt + 0.45) * (1 - p(t, pickAt + 0.1, pickAt + 0.3));
  const sRow = scr(rowPt.x, hoverY + RH * 0.62);
  const sStart = scr(rowPt.x + 120, rowBox(0).y + RH * 2.2);
  const curMove = p(t, listAt + 0.2, listAt + 0.5);
  const cx = mix(sStart.x, sRow.x, curMove), cy = mix(sStart.y, sRow.y, curMove);
  const press = clamp(1 - Math.abs(t - pickAt) / 0.1);
  const ring = scr(rowPt.x, rowBox(pick).y + RH * 0.62);
  const caretOn = Math.floor(t * 3.2) % 2 === 0;
  const lx = (x: number) => x - B.x, ly = (y: number) => y - B.y;
  const lv = listOpen * listVis;
  const focusRects = [{ x: B.x, y: BY, w: B.w, h: B.h }];   // 列表画在压暗层之上，本身不受压暗

  const caret = <span style={{ display: 'inline-block', width: 2, height: FS * 1.1, marginLeft: 1, background: S.ink, opacity: caretOn ? 1 : 0, verticalAlign: 'middle' }} />;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, opacity: enter, transformOrigin: '0 0', transform: cameraTransform(fx, fy, z, 1) }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: IW, height: IH, transformOrigin: '0 0', transform: `scale(${d0})` }}>
          {/* 窗口背景：输入框浮起时失焦、压暗 */}
          <Img src={staticFile(c.image)} style={{ position: 'absolute', left: 0, top: 0, width: IW, height: IH, filter: liftV > 0.01 ? `blur(${4 * liftV}px)` : undefined }} />
          {(c.maskBoxes ?? []).map((m, i) => <div key={i} style={{ position: 'absolute', left: m.x, top: m.y, width: m.w, height: m.h, background: '#fff' }} />)}
          <div style={{ position: 'absolute', left: B.x - 6, top: B.y - 6, width: B.w + 12, height: B.h + 12, borderRadius: c.cropRadius, background: '#fcfcfc', opacity: q(liftV, 0, 0.35), filter: 'blur(4px)' }} />
          <Spotlight rects={focusRects} amount={liftV} dim={0.3} pad={0} radius={c.cropRadius} feather={3} />

          {/* 浮起的真实输入框 */}
          <div style={{
            position: 'absolute', left: B.x, top: BY, width: B.w, height: B.h, borderRadius: c.cropRadius, overflow: 'hidden', background: '#fff',
            boxShadow: liftV > 0.01 ? `0 ${24 * liftV}px ${40 * liftV}px rgba(0,0,0,${0.16 * liftV})` : undefined,
          }}>
            <Img src={staticFile(c.image)} style={{ position: 'absolute', left: -B.x, top: -B.y, width: IW, height: IH }} />
            {(c.maskBoxes ?? []).map((m, i) => <div key={i} style={{ position: 'absolute', left: lx(m.x), top: ly(m.y), width: m.w, height: m.h, background: '#fff' }} />)}
            <div style={{ position: 'absolute', left: lx(c.placeholderBox.x), top: ly(c.placeholderBox.y), width: c.placeholderBox.w, height: c.placeholderBox.h, background: '#fff' }} />
            {/* 文字区：两行可见，超出时上卷 */}
            <div style={{ position: 'absolute', left: TX, top: TY - LINE / 2, width: availW + 40, height: LINE * 2, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: -scrollUp, width: availW + 40 }}>
                <div style={{ height: LINE, display: 'flex', alignItems: 'center', ...textBase(FS, 500), lineHeight: 1, color: S.ink }}>
                  <span style={{ whiteSpace: 'pre' }}>{preShown}</span>
                  {chipOn
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: chipW, height: FS * 1.4, borderRadius: FS * 0.3, background: S.ink, marginRight: 8 }}>
                      <span style={{ ...textBase(chipFS, 600, S.mono), color: '#fff' }}>{chipLabel}</span></span>
                    : <span style={{ whiteSpace: 'pre' }}>{t < pickAt + 0.05 ? typedQ : ''}</span>}
                  <span style={{ whiteSpace: 'pre' }}>{lines[0]}</span>
                  {nLines <= 1 && caret}
                </div>
                {lines.slice(1).map((ln, i) => <div key={i} style={{ ...textBase(FS, 500), height: LINE, display: 'flex', alignItems: 'center', lineHeight: 1, whiteSpace: 'pre', color: S.ink }}>
                  {ln}{i === lines.length - 2 && caret}
                </div>)}
              </div>
            </div>
          </div>

          {/* 联想列表：从 @ 处向上弹出 */}
          {lv > 0.01 && <div style={{ position: 'absolute', left: LX - 60, top: LY - 60, width: LW + 120, height: listH + 90, overflow: 'hidden', opacity: listVis, clipPath: `inset(${60 + listH * (1 - listOpen)}px 0 0 0)` }}>
            <Surface box={{ x: 60, y: 60 + (1 - listOpen) * 14, w: LW, h: listH }} radius={18}>
              <div style={{ position: 'absolute', left: 8, top: hoverY - LY, width: LW - 16, height: RH, borderRadius: 12, background: S.ink, opacity: p(t, listAt + 0.2, listAt + 0.35) }} />
              {items.map((it, i) => {
                const on = Math.abs(rowBox(i).y - hoverY) < RH * 0.5 && t >= listAt + 0.28;
                const hideLabel = i === pick && t >= pickAt + 0.05;
                return <div key={i} style={{ position: 'absolute', left: 8, top: 10 + i * RH, width: LW - 16, height: RH, display: 'flex', alignItems: 'center', gap: LFS * 0.55, paddingLeft: LFS * 0.75 }}>
                  {it.icon && <Img src={staticFile(it.icon)} style={{ width: RH * 0.5, height: RH * 0.5, borderRadius: 8, objectFit: 'cover' }} />}
                  <span style={{ ...textBase(LFS, 600, S.mono), color: on ? '#fff' : S.ink, opacity: hideLabel ? 0 : 1 }}>{it.label}</span>
                  {it.desc && <span style={{ ...textBase(LFS * 0.8, 500), color: on ? S.faint : S.muted, opacity: hideLabel ? 0 : 1 }}>{it.desc}</span>}
                </div>;
              })}
            </Surface>
          </div>}

          {/* 被选中的那一行在飞 */}
          {t >= pickAt + 0.05 && !chipOn && <div style={{ ...abs(flyB), borderRadius: mix(12, FS * 0.3, fly), background: S.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: S.shadow }}>
            <span style={{ ...textBase(flyFS, 600, S.mono), color: '#fff' }}>{chipLabel}</span>
          </div>}
        </div>
      </div>
      <ClickRing x={ring.x} y={ring.y} t={t} at={pickAt} dark />
      {curIn > 0 && <Cursor x={cx - 6} y={cy - 4} scale={1.1} press={press} style={{ opacity: curIn }} />}
    </Handoff>
    <Sfx name="typing" at={preStart} duration={Math.round((qEnd - preStart) * 60) + 6} volume={0.4} />
    <Sfx name="whoosh-short" at={listAt} />
    <Sfx name="click" at={pickAt} />
    {afterLen > 0 && <Sfx name="typing" at={afterAt} duration={Math.round((afterEnd - afterAt) * 60) + 6} volume={0.4} />}
  </Frame>;
}
