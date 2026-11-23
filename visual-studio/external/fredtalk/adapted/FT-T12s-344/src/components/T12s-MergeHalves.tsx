// T12s 左右合拢（快过渡 3s）：序号圆从左边、标题胶囊从右边同时加速冲向中间，“咔”地拼成一枚完整的大黑胶囊（序号嵌在左端圆头里）。
// 观众要看懂的变化：序号和章节名各自从两侧进来 → 在中间合成一枚胶囊。
// 动作来源：T12b“方块 + 胶囊”的同一组对象关系，改成两件从两侧对撞合体（ease-in 加速到接触即停，无回弹）；终态外观同 kit 黑胶囊。
import React from 'react';
import { S, cueAt, mix, p, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { easeIn, fit, pad2, partLabel } from './_shared';

export type MergeHalvesProps = HandoffProps & {
  index: number;
  label: string;        // 留空用「第N部分」；合拢后出现在胶囊上方
  title: string;
  cues?: number[];      // [0]=两件对撞的时刻
};

export const mergeHalvesDefaults: MergeHalvesProps = {
  index: 2,
  label: '',
  title: 'PDF 一键翻译',
};

const H = 230, NUM = 112, LAB = 54;

export function MergeHalves(props: Partial<MergeHalvesProps>) {
  const c = { ...mergeHalvesDefaults, ...props };
  const t = useT();
  const hit = cueAt(c.cues, 0, 0.58);
  const num = pad2(c.index), label = partLabel(c.index, c.label);

  const size = fit(c.title, 140, 1720 - H - 160);
  const pillW = textWidth(c.title, size) + H * 0.62 + H / 2;   // 标题胶囊：左端留出给序号圆盖住的半圆
  const W = H + pillW - H / 2;                                     // 合体后总宽
  const left = 960 - W / 2;
  // 终态：序号圆中心在 left + H/2；标题胶囊左缘在 left + H/2
  const circX = left, pillX = left + H / 2;

  // 两件从画外加速冲向终态（ease-in），在 hit 时刻同时到位
  const go = easeIn(t, 0, hit);
  const cx0 = -H * 0.6, px0 = 1920 - H * 0.4;
  const circLeft = mix(cx0, circX, go);
  const pillLeft = mix(px0, pillX, go);
  // 接触瞬间：整体横向压扁 3% 再回正（一次，0.16s，不振荡）
  const sq = t >= hit ? 1 - 0.03 * Math.max(0, 1 - (t - hit) / 0.16) : 1;
  const lab = p(t, hit + 0.12, hit + 0.5);
  const top = 540 - H / 2 + 30;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, transform: `scaleX(${sq})`, transformOrigin: '960px 540px' }}>
        <div style={{
          position: 'absolute', left: pillLeft, top, width: pillW, height: H, borderRadius: H / 2, background: S.dark,
          boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: H * 0.31,
        }}>
          <span style={{ ...textBase(size, 400, S.display), color: '#fff' }}>{c.title}</span>
        </div>
        <div style={{
          position: 'absolute', left: circLeft, top, width: H, height: H, borderRadius: H / 2, background: S.dark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: S.capsuleShadow,
        }}>
          <span style={{ ...textBase(NUM, 900), color: S.accentDark, fontVariantNumeric: 'tabular-nums' }}>{num}</span>
        </div>
      </div>
      <div style={{
        ...textBase(LAB, 600), position: 'absolute', left: 0, right: 0, top: top - LAB * 1.16 - 30, textAlign: 'center',
        color: S.accent, letterSpacing: 4, opacity: lab, transform: `translateY(${(1 - lab) * 18}px)`,
      }}>{label}</div>
    </Handoff>
    <Sfx name="woosh" at={0.06} />
    <Sfx name="pop" at={hit} />
  </Frame>;
}
