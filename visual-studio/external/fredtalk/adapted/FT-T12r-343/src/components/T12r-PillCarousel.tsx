// T12r 胶囊轮播（快过渡 3s）：整期的章节排成一行黑胶囊，上一章在正中；整行向左滑一格，本章停到正中并放大，两边的章节缩小退后。
// 观众要看懂的变化：一排章节胶囊 → 横向滑动，本章停在正中放大（同时看到前后还有什么）。
// 动作来源：T12d 阶段胶囊“收到当前这一段”的主次关系 + 横向镜头平移（quintic 两端零速度）；T12g 是竖向清单划掉，这里是横向轮播。
import React from 'react';
import { S, clamp, cueAt, mix, p, quintic, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { pad2 } from './_shared';

export type PillCarouselProps = HandoffProps & {
  titles: string[];     // 整期各章名（按顺序）
  index: number;        // 本章（从 1 开始）
  cues?: number[];      // [0]=开始滑动
};

export const pillCarouselDefaults: PillCarouselProps = {
  titles: ['图片高清放大', 'PDF 一键翻译', '语音输入法', '视频字幕翻译', '录屏美化'],
  index: 3,
};

const H = 150, FS = 72, NS = 60, GAP = 60, FOCUS = 1.5;

export function PillCarousel(props: Partial<PillCarouselProps>) {
  const c = { ...pillCarouselDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.6);
  const n = c.titles.length;
  const cur = Math.max(1, Math.min(n, c.index)) - 1;
  const prev = Math.max(0, cur - 1);

  // 每颗胶囊的自然宽度（1 倍）
  const fs = c.titles.map((s) => Math.min(FS, 900 / Math.max(1, textWidth(s, 1))));
  const ws = c.titles.map((s, i) => H * 0.9 + textWidth(pad2(i + 1), NS) + 28 + textWidth(s, fs[i]));

  const enter = p(t, 0, 0.45);
  const slide = quintic(t, at, at + 0.75);
  const focusIdx = mix(prev, cur, slide);                // 连续的“焦点位置”
  const scale = c.titles.map((_, i) => mix(0.82, FOCUS, clamp(1 - Math.abs(i - focusIdx))));
  // 按当前缩放后的实际宽度排成一行（互不压住），再把焦点平移到画面中心
  const cx: number[] = [];
  let acc = 0;
  ws.forEach((w, i) => { cx.push(acc + (w * scale[i]) / 2); acc += w * scale[i] + GAP; });
  const lo = Math.floor(focusIdx), hi = Math.min(n - 1, lo + 1);
  const rowFocus = mix(cx[lo], cx[hi], focusIdx - lo);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {c.titles.map((s, i) => {
        const k = clamp(1 - Math.abs(i - focusIdx));        // 1=正中
        const sc = scale[i];
        const x = 960 + (cx[i] - rowFocus);
        const isCur = i === cur;
        const op = enter * mix(0.32, 1, k);
        return <div key={i} style={{
          position: 'absolute', left: x - ws[i] / 2, top: 540 - H / 2, width: ws[i], height: H, borderRadius: H / 2,
          background: S.dark, boxShadow: S.capsuleShadow, opacity: op,
          transform: `translateY(${(1 - enter) * 50}px) scale(${sc})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28,
        }}>
          <span style={{ ...textBase(NS, 900), color: isCur ? S.accentDark : S.faint, fontVariantNumeric: 'tabular-nums' }}>{pad2(i + 1)}</span>
          <span style={{ ...textBase(fs[i], 400, S.display), color: '#fff' }}>{s}</span>
        </div>;
      })}
    </Handoff>
    <Sfx name="slide" at={at} />
    <Sfx name="pop" at={at + 0.7} volume={0.35} />
  </Frame>;
}
