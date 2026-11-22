// T12l 黑圆扩散（快过渡 3s）：白画布上一个黑点，猛地扩成满屏黑圆接管画面；巨大序号在圆心落定，再让到左边，右侧逐行揭出章节名。
// 观众要看懂的变化：画面被黑圆接管 → 序号落定 → 序号让位领出章节名。
// 动作来源：圆形遮罩扩散（光圈转场）+ T12a 的“点 → 圆”起手；序号让位同进度驱动沿 T12b。终态为横排（序号｜名字），和 T12k 的竖排区分。
import React from 'react';
import { S, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Brand, Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, pad2, partLabel, splitTitle } from './_shared';

export type IrisBadgeProps = HandoffProps & {
  index: number;
  label: string;          // 留空用「第N部分」
  title: string;
  origin: { x: number; y: number };   // 黑点出现的位置（可对准上一段的焦点）
  cues?: number[];        // [0]=黑圆扩散，[1]=章节名出现
};

export const irisBadgeDefaults: IrisBadgeProps = {
  index: 3,
  label: '',
  title: '语音输入法',
  origin: { x: 960, y: 540 },
};

const NUM = 400, LAB = 54;

export function IrisBadge(props: Partial<IrisBadgeProps>) {
  const c = { ...irisBadgeDefaults, ...props };
  const t = useT();
  const label = partLabel(c.index, c.label);
  const num = pad2(c.index);

  const at = cueAt(c.cues, 0, 0.14);
  const titleAt = cueAt(c.cues, 1, at + 0.78);

  // 黑点 0–at 出现，at 起扩成满屏（半径到画面对角线外）
  const dot = p(t, 0, at + 0.02);
  const grow = p(t, at, at + 0.62);
  const ox = c.origin.x, oy = c.origin.y;
  const far = Math.hypot(Math.max(ox, 1920 - ox), Math.max(oy, 1080 - oy)) + 40;
  const r = mix(22 * dot, far, grow);

  // 序号：先在中心放大落定，章节名到来时让到左边（同一进度）
  const numIn = p(t, at + 0.16, at + 0.6);
  const shift = q(t, titleAt - 0.12, titleAt + 0.36);
  const reveal = titleAt + 0.22;   // 序号基本让开后再揭字，避免叠在序号上

  const lines = splitTitle(c.title, 900 / 120);
  const tSize = Math.min(150, ...lines.map((l) => fit(l, 150, 960)));
  const numW = textWidth(num, NUM) * 1.04;
  const textW = Math.max(textWidth(label, LAB), ...lines.map((l) => textWidth(l, tSize)));
  const GAP = 90;
  const groupW = numW + GAP + textW;
  const numCx = mix(960, 960 - groupW / 2 + numW / 2, shift);
  const textX = 960 - groupW / 2 + numW + GAP;
  const blockH = LAB * 1.16 + 18 + lines.length * tSize * 1.1;
  const textTop = 540 - blockH / 2;

  const dark = r > Math.hypot(1722 - ox, 78 - oy);   // 黑圆边缘越过角标中心时换深底版角标
  return <Frame brand={false}>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', left: ox - r, top: oy - r, width: r * 2, height: r * 2, borderRadius: r, background: S.dark }} />
      <div style={{
        position: 'absolute', left: numCx - numW / 2, top: 540 - NUM * 0.58, width: numW, height: NUM * 1.16, textAlign: 'center',
        ...textBase(NUM, 900), lineHeight: 1.16, color: '#fff', fontVariantNumeric: 'tabular-nums',
        opacity: numIn, transform: `scale(${mix(1.35, 1, numIn)})`,
      }}>{num}</div>
      <div style={{ position: 'absolute', left: textX, top: textTop }}>
        <div style={{ ...textBase(LAB, 600), color: S.accentDark, letterSpacing: 4, clipPath: `inset(0 ${100 * (1 - p(t, reveal, reveal + 0.4))}% 0 0)` }}>{label}</div>
        {lines.map((l, i) => {
          const li = p(t, reveal + 0.06 + i * 0.1, reveal + 0.54 + i * 0.1);
          return <div key={i} style={{ height: tSize * 1.1, overflow: 'hidden', marginTop: i === 0 ? 18 : 0 }}>
            <div style={{ ...textBase(tSize, 400, S.display), lineHeight: 1.1, color: '#fff', transform: `translateY(${(1 - li) * tSize * 1.1}px)` }}>{l}</div>
          </div>;
        })}
      </div>
    </Handoff>
    <Brand dark={dark} />
    <Sfx name="woosh" at={at} />
    <Sfx name="pop" at={reveal} volume={0.4} />
  </Frame>;
}
