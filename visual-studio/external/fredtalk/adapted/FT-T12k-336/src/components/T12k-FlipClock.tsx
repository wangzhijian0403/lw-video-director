// T12k 翻页序号（快过渡 3s）：黑窗里两张白色翻页卡，从上一章序号翻到本章序号，章节名从下方接出。
// 观众要看懂的变化：上一章序号 → 翻页翻到本章序号，章节名接出。
// 动作来源：翻页钟的上下两半翻折；章节名揭出沿 T12a 的逐行裁切上推。和 T12b（方块让位、胶囊抽出）、T12a（点长成胶囊）动作不同。
import React from 'react';
import { S, clamp, cueAt, mix, p, q } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, pad2, partLabel } from './_shared';

export type FlipClockProps = HandoffProps & {
  index: number;      // 本章序号
  from?: number;      // 从哪个序号翻过来；不传为 index-1
  label: string;      // 小标签；留空用「第N部分」
  title: string;      // 本章名
  cues?: number[];    // [0]=开始翻页，[1]=章节名出现
};

export const flipClockDefaults: FlipClockProps = {
  index: 2,
  label: '',
  title: 'PDF 一键翻译',
};

const CW = 270, CH = 380, GAP = 26, DIGIT = 330;

// 一张卡的半边：top 只露上半，bottom 只露下半
function Half({ d, part, style }: { d: string; part: 'top' | 'bottom'; style?: React.CSSProperties }) {
  return <div style={{
    position: 'absolute', left: 0, top: part === 'top' ? 0 : CH / 2, width: CW, height: CH / 2, overflow: 'hidden',
    background: '#fff', borderRadius: part === 'top' ? `${S.radius}px ${S.radius}px 0 0` : `0 0 ${S.radius}px ${S.radius}px`,
    backfaceVisibility: 'hidden', ...style,
  }}>
    <div style={{
      position: 'absolute', left: 0, top: part === 'top' ? 0 : -CH / 2, width: CW, height: CH,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ ...textBase(DIGIT, 900), lineHeight: 1, color: S.ink, fontVariantNumeric: 'tabular-nums' }}>{d}</span>
    </div>
  </div>;
}

function FlipCard({ from, to, flip }: { from: string; to: string; flip: number }) {
  // flip 0→0.5：旧数字上半向下翻折到水平；0.5→1：新数字下半从水平落下盖住旧下半
  const a = clamp(flip * 2), b = clamp(flip * 2 - 1);
  const same = from === to;
  return <div style={{ position: 'relative', width: CW, height: CH, borderRadius: S.radius, boxShadow: '30px 22px 25px #0009' }}>
    <Half d={to} part="top" />
    <Half d={same || b >= 1 ? to : from} part="bottom" />
    {!same && a < 1 && <Half d={from} part="top" style={{
      transformOrigin: '50% 100%', transform: `perspective(1400px) rotateX(${-90 * a}deg)`, zIndex: 2,
      filter: `brightness(${mix(1, 0.72, a)})`,
    }} />}
    {!same && b > 0 && b < 1 && <Half d={to} part="bottom" style={{
      transformOrigin: '50% 0%', transform: `perspective(1400px) rotateX(${90 * (1 - b)}deg)`, zIndex: 2,
      filter: `brightness(${mix(0.72, 1, b)})`,
    }} />}
    {/* 翻页钟中缝：卡体本身的结构，不是装饰线 */}
    <div style={{ position: 'absolute', left: 0, right: 0, top: CH / 2 - 2, height: 4, background: S.dark, zIndex: 3 }} />
  </div>;
}

export function FlipClock(props: Partial<FlipClockProps>) {
  const c = { ...flipClockDefaults, ...props };
  const t = useT();
  const label = partLabel(c.index, c.label);
  const fromS = pad2(c.from ?? c.index - 1), toS = pad2(c.index);

  const flipAt = cueAt(c.cues, 0, 0.5);
  const titleAt = cueAt(c.cues, 1, flipAt + 0.62);

  const cardsIn = p(t, 0, 0.42);
  const flip = q(t, flipAt, flipAt + 0.56);
  const lift = p(t, titleAt - 0.08, titleAt + 0.5);

  const tSize = fit(c.title, 150, 1640);
  const LAB = 52;
  const stackH = CH + 64 + LAB * 1.16 + 16 + tSize * 1.12;
  const topEnd = (1080 - stackH) / 2;
  const cardsTop = mix(540 - CH / 2, topEnd, lift);
  const textTop = topEnd + CH + 64;
  const lab = p(t, titleAt, titleAt + 0.4);
  const ti = p(t, titleAt + 0.08, titleAt + 0.56);

  return <Frame dark>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: 960 - (CW * 2 + GAP) / 2, top: cardsTop, display: 'flex', gap: GAP,
        opacity: cardsIn, transform: `translateY(${(1 - cardsIn) * 70}px)`,
      }}>
        {[0, 1].map((i) => <FlipCard key={i} from={fromS[i]} to={toS[i]} flip={flip} />)}
      </div>
      <div style={{
        ...textBase(LAB, 600), position: 'absolute', left: 0, right: 0, top: textTop, textAlign: 'center',
        color: S.accentDark, letterSpacing: 4, opacity: lab, transform: `translateY(${(1 - lab) * 18}px)`,
      }}>{label}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: textTop + LAB * 1.16 + 16, height: tSize * 1.12, overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ ...textBase(tSize, 400, S.display), lineHeight: 1.12, color: '#fff', transform: `translateY(${(1 - ti) * tSize * 1.12}px)` }}>{c.title}</div>
      </div>
    </Handoff>
    <Sfx name="whoosh-short" at={flipAt} />
    <Sfx name="pop" at={flipAt + 0.5} volume={0.4} />
  </Frame>;
}
