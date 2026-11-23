// T12p 百叶黑条（快过渡 3s）：六根横向黑条依次从右侧刷进来拼满画面，每根黑条带着章节字的一条切片，拼满时字也正好拼齐。
// 观众要看懂的变化：黑条依次拼满画面 → 序号和标题随黑条拼合落定（可选：黑条再依次让开）。
// 动作来源：页面擦除 wipe() 曲线（C034/T12e）按条错开；“容器走到哪里字就到哪里”沿 motion-craft 第 6 节双层反色写法，这里是字切片跟着黑条走。
import React from 'react';
import { S, cueAt, textWidth, wipe } from '../kit/theme';
import { Brand, Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, pad2, partLabel } from './_shared';

export type BlindsProps = HandoffProps & {
  index: number;
  label: string;        // 留空用「第N部分」
  title: string;
  bars: number;         // 黑条数量（4–8）
  outAt?: number;       // 传了就在这一秒让黑条依次向左让开（交给下一段）
  cues?: number[];      // [0]=黑条开始刷入
};

export const blindsDefaults: BlindsProps = {
  index: 5,
  label: '',
  title: '最后一个：录屏美化',
  bars: 6,
};

const NUM = 240, LAB = 56;

export function Blinds(props: Partial<BlindsProps>) {
  const c = { ...blindsDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.05);
  const n = Math.max(4, Math.min(8, Math.round(c.bars)));
  const bh = 1080 / n;
  const num = pad2(c.index), label = partLabel(c.index, c.label);

  // 横排：序号｜（标签 + 标题）
  const tSize = fit(c.title, 150, 1700 - textWidth(num, NUM) - 90);
  const numW = textWidth(num, NUM) * 1.04;
  const groupW = numW + 90 + textWidth(c.title, tSize);
  const gx = 960 - groupW / 2;
  const blockH = LAB * 1.16 + 20 + tSize * 1.12;

  const content = <>
    <div style={{ ...textBase(NUM, 900), lineHeight: 1, position: 'absolute', left: gx, top: 540 - NUM * 0.5, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{num}</div>
    <div style={{ position: 'absolute', left: gx + numW + 90, top: 540 - blockH / 2 }}>
      <div style={{ ...textBase(LAB, 600), color: S.accentDark, letterSpacing: 4 }}>{label}</div>
      <div style={{ ...textBase(tSize, 400, S.display), lineHeight: 1.12, color: '#fff', marginTop: 20 }}>{c.title}</div>
    </div>
  </>;

  // 每根条 0.5s 刷入，条与条错开 0.055s（自上而下）；让开时同样错开，向左出画
  const barX = (i: number) => {
    const inn = wipe(t, at + i * 0.055, at + i * 0.055 + 0.5);
    const out = c.outAt !== undefined ? wipe(t, c.outAt + i * 0.05, c.outAt + i * 0.05 + 0.45) : 0;
    const x = (1 - inn) * 1980 - out * 1980;
    return Math.abs(x) < 1.5 ? 0 : x;
  };
  const covered = barX(0) < 1549 && barX(0) > -25;   // 第一根条盖住角标区时用深底角标

  return <Frame brand={false}>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {Array.from({ length: n }, (_, i) => {
        const x = barX(i);
        if (x >= 1920 || x <= -1920) return null;
        return <div key={i} style={{ position: 'absolute', left: -2, top: i * bh, width: 1924, height: Math.ceil(bh) + 1, overflow: 'hidden', transform: `translateX(${x}px)`, background: S.dark }}>
          <div style={{ position: 'absolute', left: 2, top: -i * bh, width: 1920, height: 1080 }}>{content}</div>
        </div>;
      })}
    </Handoff>
    <Brand dark={covered} />
    <Sfx name="whoosh-short" at={at} />
    <Sfx name="pop" at={at + (n - 1) * 0.055 + 0.45} volume={0.4} />
  </Frame>;
}
