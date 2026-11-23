// T20p 方块翻出（开场 4s）：一整片黑色小方块从左上角开始，像多米诺一样斜向依次翻面，翻过来的每一块都是同一张真实作品的一小片；全部翻完后缝隙合拢成一张完整作品，标题黑胶囊落在下沿。
// 观众要看懂的变化：一片黑方块 → 逐块翻面拼出一张真实作品 → 标题。
// 动作来源：107 证据卡/T05f 的错开节奏（按对角线距离错开）+ T12h 的 3D 翻面（这里每块绕竖轴翻 180°，背面是作品切片）。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { S, clamp, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, splitHighlight } from './_shared';

export type TileFlipProps = HandoffProps & {
  src: string;          // 真实作品图
  ratio: number;
  cols: number;         // 列数（行数按比例算）
  title: string;
  highlight: string;
  cues?: number[];      // [0]=开始翻，[1]=标题落下
};

export const tileFlipDefaults: TileFlipProps = {
  src: 'fredtalk/media/lw-work-03.jpg',
  ratio: 1672 / 942,
  cols: 9,
  title: '一句话，画出整套设定',
  highlight: '整套设定',
};

export function TileFlip(props: Partial<TileFlipProps>) {
  const c = { ...tileFlipDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.3);

  const W = 1400, H = W / c.ratio;
  const box = { x: 960 - W / 2, y: Math.max(145, 470 - H / 2), w: W, h: H };
  const cols = Math.max(4, Math.min(14, Math.round(c.cols)));
  const rows = Math.max(3, Math.round(cols / c.ratio));
  const tw = W / cols, th = H / rows;

  const per = 0.42;                                   // 每块翻转时长
  const stagger = 0.9 / (cols + rows - 2);            // 对角线错开：整片约 0.9s 翻完
  const doneAt = at + 0.9 + per;
  const merge = q(t, doneAt, doneAt + 0.4);           // 缝隙合拢 + 圆角/阴影出现
  const gapPx = mix(6, 0, merge);
  const titleAt = cueAt(c.cues, 1, doneAt + 0.3);

  const size = fit(c.title, 108, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);
  const appear = p(t, 0, 0.3);

  const tiles = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const st = at + (r + k) * stagger;
    const f = q(t, st, st + per);
    const ang = 180 * f;
    const x = k * tw, y = r * th;
    const face: React.CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', overflow: 'hidden', borderRadius: mix(8, 0, merge) };
    tiles.push(<div key={`${r}-${k}`} style={{
      position: 'absolute', left: x + gapPx / 2, top: y + gapPx / 2, width: tw - gapPx, height: th - gapPx,
      transformStyle: 'preserve-3d', transform: `perspective(1400px) rotateY(${ang}deg) scale(${1 + 0.08 * Math.sin(f * Math.PI)})`,
      zIndex: Math.round(Math.sin(f * Math.PI) * 10),
    }}>
      <div style={{ ...face, background: S.dark }} />
      <div style={{ ...face, transform: 'rotateY(180deg)' }}>
        <Img src={staticFile(c.src)} style={{ position: 'absolute', left: -x - gapPx / 2, top: -y - gapPx / 2, width: W, height: H, maxWidth: 'none' }} />
      </div>
    </div>);
  }

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: box.x, top: box.y, width: W, height: H, borderRadius: S.radius * merge,
        boxShadow: merge > 0 ? S.shadow : 'none', opacity: appear, transform: `scale(${mix(0.96, 1, appear)})`,
      }}>{tiles}</div>
      {pill > 0 && <div style={{
        position: 'absolute', left: 960 - PW / 2, top: box.y + box.h - PH * 0.42, width: PW, height: PH, borderRadius: PH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * 46}px) scale(${mix(1.1, 1, pill)})`,
      }}>
        <span style={{ ...textBase(size, 400, S.display), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
      </div>}
    </Handoff>
    <Sfx name="whoosh-short" at={at} />
    <Sfx name="pop" at={doneAt} volume={0.35} />
    <Sfx name="pop" at={titleAt + 0.1} />
  </Frame>;
}
