// T12t 黑白分屏（快过渡 3s）：左侧黑幕从上往下落下占住画面 40%，里面的大序号像里程表一样从上一章滚到本章；右侧白底上章节名从左擦出。
// 观众要看懂的变化：画面劈成黑白两半 → 左边序号滚到本章，右边章节名擦出。
// 动作来源：wipe() 章节擦出（C034/T12e）+ 竖向滚动换数（里程表）；左右分区的对象关系沿 T05 对比的“同框两区”。
import React from 'react';
import { S, cueAt, p, q, textWidth, wipe } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, pad2, partLabel, splitTitle } from './_shared';

export type SplitScreenProps = HandoffProps & {
  index: number;
  label: string;        // 留空用「第N部分」
  title: string;
  ratio: number;        // 黑幕占宽（0.34–0.46）
  cues?: number[];      // [0]=序号滚动，[1]=章节名擦出
};

export const splitScreenDefaults: SplitScreenProps = {
  index: 3,
  label: '',
  title: '语音输入法',
  ratio: 0.4,
};

const NUM = 360, LAB = 56;

export function SplitScreen(props: Partial<SplitScreenProps>) {
  const c = { ...splitScreenDefaults, ...props };
  const t = useT();
  const rollAt = cueAt(c.cues, 0, 0.42);
  const titleAt = cueAt(c.cues, 1, rollAt + 0.3);
  const DW = Math.round(1920 * Math.max(0.34, Math.min(0.46, c.ratio)));
  const label = partLabel(c.index, c.label);

  const drop = wipe(t, 0, 0.5);
  const roll = q(t, rollAt, rollAt + 0.55);
  const from = pad2(c.index - 1), to = pad2(c.index);

  const RW = 1920 - DW;
  const lines = splitTitle(c.title, (RW - 240) / 120);
  const tSize = Math.min(160, ...lines.map((l) => fit(l, 160, RW - 240)));
  const blockH = LAB * 1.16 + 22 + lines.length * tSize * 1.1;
  const tx = DW + 120;
  const ty = 540 - blockH / 2;
  const lab = p(t, titleAt, titleAt + 0.4);

  // 数字逐位滚：变化的位从旧数字滚到新数字（竖向一列两格），不变的位不动
  const digitW = textWidth('0', NUM) * 1.08;
  const LH = NUM * 1.05;
  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: DW, height: 1080, background: S.dark, clipPath: `inset(0 0 ${100 * (1 - drop)}% 0)` }}>
        <div style={{ position: 'absolute', left: DW / 2 - digitW, top: 540 - LH / 2, display: 'flex', opacity: p(t, 0.18, 0.45) }}>
          {[0, 1].map((i) => {
            const changes = from[i] !== to[i];
            const y = changes ? -roll * LH : 0;
            return <div key={i} style={{ width: digitW, height: LH, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: y, width: digitW }}>
                {(changes ? [from[i], to[i]] : [to[i]]).map((d, k) => <div key={k} style={{ height: LH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ ...textBase(NUM, 900), lineHeight: 1, color: '#fff' }}>{d}</span>
                </div>)}
              </div>
            </div>;
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: tx, top: ty }}>
        <div style={{ ...textBase(LAB, 600), color: S.accent, letterSpacing: 4, opacity: lab, transform: `translateX(${(1 - lab) * -30}px)` }}>{label}</div>
        {lines.map((l, i) => {
          const e = wipe(t, titleAt + 0.08 + i * 0.1, titleAt + 0.62 + i * 0.1);
          return <div key={i} style={{
            ...textBase(tSize, 400, S.display), lineHeight: 1.1, color: S.ink, marginTop: i === 0 ? 22 : 0,
            clipPath: `inset(0 ${100 * (1 - e)}% 0 0)`, transform: `translateX(${(1 - e) * -40}px)`,
          }}>{l}</div>;
        })}
      </div>
    </Handoff>
    <Sfx name="whoosh-short" at={0} />
    <Sfx name="slide" at={rollAt} volume={0.4} />
    <Sfx name="pop" at={titleAt + 0.5} volume={0.35} />
  </Frame>;
}
