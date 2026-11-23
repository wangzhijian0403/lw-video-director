// T12n 卡叠抽走（快过渡 3s）：一叠黑色章节卡，最上面一张（上一章）被斜着抽走飞出画面，下面那张顶上来，就是本章。
// 观众要看懂的变化：一叠章节卡 → 顶上一张抽走 → 下一张就是本章。
// 动作来源：卡叠依次摊开的错位写法（T05f/107 证据卡 0.045–0.075 秒错开）+ 顶卡抽离；黑卡用 kit 黑面与胶囊投影。
import React from 'react';
import { S, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, pad2, partLabel, splitTitle } from './_shared';

export type DeckPullProps = HandoffProps & {
  index: number;
  prevTitle: string;
  title: string;
  label: string;        // 留空用「第N部分」
  depth: number;        // 卡叠里再垫几张（1–3）
  cues?: number[];      // [0]=顶卡抽走
};

export const deckPullDefaults: DeckPullProps = {
  index: 2,
  prevTitle: '图片高清放大',
  title: 'PDF 一键翻译',
  label: '',
  depth: 2,
};

const W = 1380, H = 620, NUM = 280, LAB = 54;

function Card({ index, label, title }: { index: number; label: string; title: string }) {
  const lines = splitTitle(title, 760 / 120);
  const size = Math.min(140, ...lines.map((l) => fit(l, 140, 760)));
  return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 110, gap: 80 }}>
    <span style={{ ...textBase(NUM, 900), lineHeight: 1, color: '#fff', fontVariantNumeric: 'tabular-nums', width: textWidth('00', NUM) * 1.04 }}>{pad2(index)}</span>
    <div>
      <div style={{ ...textBase(LAB, 600), color: S.accentDark, letterSpacing: 4, marginBottom: 18 }}>{label}</div>
      {lines.map((l, i) => <div key={i} style={{ ...textBase(size, 400, S.display), lineHeight: 1.1, color: '#fff' }}>{l}</div>)}
    </div>
  </div>;
}

export function DeckPull(props: Partial<DeckPullProps>) {
  const c = { ...deckPullDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.72);
  const depth = Math.max(1, Math.min(3, Math.round(c.depth)));

  // 卡叠落下：从下方依次落位（错开 0.06s）
  const settleIn = (k: number) => p(t, 0.04 * k, 0.42 + 0.04 * k);
  // 顶卡：斜向上抽走（smoothstep，带 9° 旋转），下一张同进度顶上来
  const pull = q(t, at, at + 0.52);
  const rise = p(t, at + 0.1, at + 0.62);

  // 第 k 张（0=顶卡）的叠放偏移：越往下越往右下错开、越小
  const slot = (k: number) => ({ x: k * 34, y: k * 30, s: 1 - k * 0.035 });
  const x0 = 960 - W / 2, y0 = 540 - H / 2 - 30;

  const cards = [];
  for (let k = depth + 1; k >= 0; k--) {
    // k=0 顶卡（上一章）；k=1 本章；k≥2 垫底空卡
    const into = settleIn(depth + 1 - k);
    const sl = k === 0 ? slot(0) : k === 1 ? { x: mix(slot(1).x, 0, rise), y: mix(slot(1).y, 0, rise), s: mix(slot(1).s, 1, rise) }
      : { x: mix(slot(k).x, slot(k - 1).x, rise), y: mix(slot(k).y, slot(k - 1).y, rise), s: mix(slot(k).s, slot(k - 1).s, rise) };
    let extra = '';
    let op = 1;
    if (k === 0) {
      extra = `translate(${-pull * 980}px, ${-pull * 900}px) rotate(${-pull * 9}deg)`;   // 往左上抽走，不扫过右上角标
      op = 1 - q(t, at + 0.36, at + 0.52);
      if (op <= 0.001) continue;
    }
    const body = k === 0 ? <Card index={c.index - 1} label={partLabel(c.index - 1)} title={c.prevTitle} />
      : k === 1 ? <Card index={c.index} label={partLabel(c.index, c.label)} title={c.title} /> : null;
    cards.push(<div key={k} style={{
      position: 'absolute', left: x0 + sl.x, top: y0 + sl.y, width: W, height: H, borderRadius: 36, background: k <= 1 ? S.dark : S.windowBody,
      boxShadow: S.capsuleShadow, overflow: 'hidden', transformOrigin: '50% 50%',
      opacity: op, transform: `${extra} translateY(${(1 - into) * 160}px) scale(${sl.s})`,
    }}>{body}</div>);
  }

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}><div style={{ position: 'absolute', inset: 0, opacity: p(t, 0, 0.2) }}>{cards}</div></Handoff>
    <Sfx name="slide" at={at} />
    <Sfx name="pop" at={at + 0.5} volume={0.35} />
  </Frame>;
}
