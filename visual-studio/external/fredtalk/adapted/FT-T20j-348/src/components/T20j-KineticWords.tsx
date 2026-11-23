// T20j 黑底快切（开场 3.6s）：满屏黑里三个关键词一个接一个砸出来（硬切换词），第三个砸完，整块黑幕收缩成一枚黑胶囊，主题句落在胶囊里，四周露出白画布。
// 观众要看懂的变化：三个关键词逐个砸出 → 满屏黑收成一枚主题胶囊。
// 动作来源：T20g 的“强调词砸下”（这里改为硬切、每词独占全屏）+ T12a 的同一对象变形（满屏黑面 → 胶囊，圆角按 min(w,h)/2 变化）。
import React from 'react';
import { S, clamp, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Brand, Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, splitHighlight } from './_shared';

export type KineticWordsProps = HandoffProps & {
  words: string[];      // 依次砸出的关键词（2–4 个，短词）
  title: string;        // 最后落在胶囊里的主题句
  highlight: string;
  cues?: number[];      // 每个词砸出的时间；再多一个 = 黑幕收成胶囊的时间
};

export const kineticWordsDefaults: KineticWordsProps = {
  words: ['免费', '开源', '不比付费差'],
  title: '5 个 GitHub 宝藏工具',
  highlight: 'GitHub',
};

export function KineticWords(props: Partial<KineticWordsProps>) {
  const c = { ...kineticWordsDefaults, ...props };
  const t = useT();
  const n = c.words.length;
  const wordAt = (i: number) => cueAt(c.cues, i, 0.08 + i * 0.46);
  const shrinkAt = cueAt(c.cues, n, wordAt(n - 1) + 0.6);

  // 当前显示哪个词（硬切：下一个词出现时上一个直接消失）
  let cur = -1;
  for (let i = 0; i < n; i++) if (t >= wordAt(i)) cur = i;

  // 黑幕 → 胶囊（同一个对象）
  const size = fit(c.title, 120, 1400);
  const PH = size * 1.7, PW = textWidth(c.title, size) + PH * 1.05;
  const s = q(t, shrinkAt, shrinkAt + 0.62);
  const w = mix(1920, PW, s), h = mix(1080, PH, s);
  const r = mix(0, PH / 2, clamp(s * 1.6));
  const box = { x: 960 - w / 2, y: 540 - h / 2 };
  const title = p(t, shrinkAt + 0.4, shrinkAt + 0.85);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);
  // 角标：黑幕盖住右上角时用深底版
  const darkCorner = box.x + w > 1895 && box.y < 36;

  return <Frame brand={false}>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: box.x, top: box.y, width: w, height: h, borderRadius: r, background: S.dark, overflow: 'hidden',
        boxShadow: s > 0.02 ? S.capsuleShadow : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {cur >= 0 && s <= 0.001 && (() => {
          const word = c.words[cur];
          const ws = Math.min(...c.words.map((w) => fit(w, 300, 1380)));   // 同组同字号；砸下放大 1.28 倍也不出画
          const e = p(t, wordAt(cur), wordAt(cur) + 0.2);
          const last = cur === n - 1;
          return <span key={cur} style={{
            ...textBase(ws, 400, S.display), color: last ? S.accentDark : '#fff',
            transform: `scale(${mix(1.28, 1, e)})`,
          }}>{word}</span>;
        })()}
        {title > 0 && <span style={{
          ...textBase(size, 400, S.display), color: '#fff', position: 'absolute',
          opacity: title, transform: `translateY(${(1 - title) * 30}px)`,
        }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>}
      </div>
    </Handoff>
    <Brand dark={darkCorner} />
    {c.words.map((_, i) => <Sfx key={i} name="pop" at={wordAt(i)} volume={i === n - 1 ? 0.5 : 0.4} />)}
    <Sfx name="woosh" at={shrinkAt} />
  </Frame>;
}
