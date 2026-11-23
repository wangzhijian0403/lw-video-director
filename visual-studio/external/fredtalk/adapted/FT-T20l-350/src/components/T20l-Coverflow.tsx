// T20l 卡片快扫（开场 4s）：一排真实作品卡以 3D 卡片流快速横扫过去、逐渐减速，停在主作品上；两侧卡片退开，主作品放大成主角，标题黑胶囊落在下沿。
// 观众要看懂的变化：一排作品快速扫过 → 停在主作品 → 主作品放大成主角。
// 动作来源：T20a2“作品墙推向一张主作品”的主次关系，改成横向卡片流扫动（p() 主曲线减速停稳，不回弹）；侧卡角度/缩放随距离连续变化。
import React from 'react';
import { S, clamp, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Media, Sfx, textBase, useT } from '../kit/ui';
import { fit, splitHighlight } from './_shared';

export type CoverflowProps = HandoffProps & {
  media: string[];      // 作品图（按顺序排成一排；不够会循环）
  ratio: number;
  heroIndex: number;    // 停在哪一张（media 下标）
  title: string;
  highlight: string;
  cues?: number[];      // [0]=主作品放大，[1]=标题落下
};

export const coverflowDefaults: CoverflowProps = {
  media: ['fredtalk/media/lw-work-03.jpg', 'fredtalk/media/lw-work-03.jpg', 'fredtalk/media/lw-work-02.jpg', 'fredtalk/media/lw-work-06.jpg', 'fredtalk/media/lw-work-01.jpg'],
  ratio: 16 / 9,
  heroIndex: 4,
  title: 'AI 出图，一次到位',
  highlight: '一次到位',
};

const CW = 860;

export function Coverflow(props: Partial<CoverflowProps>) {
  const c = { ...coverflowDefaults, ...props };
  const t = useT();
  const m = c.media.length;
  const hero = Math.max(0, Math.min(m - 1, c.heroIndex));
  // 卡片流：再往前垫一轮，让扫过的距离够长（约 6–8 张）
  const slots = Math.max(8, m + 3);
  const heroSlot = slots - 2;
  const items = Array.from({ length: slots }, (_, s) => (hero - (heroSlot - s) % m + m * 10) % m);

  const growAt = cueAt(c.cues, 0, 1.75);
  const titleAt = cueAt(c.cues, 1, growAt + 0.35);
  const scroll = mix(0.6, heroSlot, p(t, 0.05, growAt - 0.1));   // 越扫越慢，停在主作品
  const grow = q(t, growAt, growAt + 0.6);
  const CH = CW / c.ratio;
  const cy = 470;

  const size = fit(c.title, 108, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);
  const heroScale = mix(1, 1.35, grow);   // 放大后右上角不压角标
  const heroBottom = cy + (CH * heroScale) / 2;

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, perspective: 2000, opacity: p(t, 0, 0.25) }}>
        {items.map((mi, s) => {
          const d = s - scroll;
          const ad = Math.abs(d), sg = Math.sign(d);
          if (ad > 3.2) return null;
          const near = Math.min(ad, 1);
          const isHero = s === heroSlot;
          // 侧卡：离中心越远越往外、越侧、越小；主作品放大时侧卡往外让开并淡出
          const spread = mix(1, 1.9, isHero ? 0 : grow);
          const x = 960 + sg * (near * 560 + Math.max(0, ad - 1) * 250) * spread;
          const rot = -sg * near * 52;
          const sc = isHero ? mix(1, 0.78, near) * heroScale : mix(1, 0.78, near);
          const op = isHero ? 1 : 1 - grow;
          if (op <= 0.001) return null;
          return <div key={s} style={{
            position: 'absolute', left: x - CW / 2, top: cy - CH / 2, width: CW, height: CH, zIndex: 100 - Math.round(ad * 10),
            transform: `rotateY(${rot}deg) scale(${sc})`, opacity: op,
          }}>
            <Media src={c.media[mi]} box={{ x: 0, y: 0, w: CW, h: CH }} radius={S.radius} style={{ boxShadow: S.shadow }} />
            {/* 侧面略压暗，主次更清楚 */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: S.radius, background: '#000', opacity: near * 0.28 }} />
          </div>;
        })}
      </div>
      {pill > 0 && <div style={{
        position: 'absolute', left: 960 - PW / 2, top: Math.min(1080 - PH - 30, heroBottom - PH * 0.42), width: PW, height: PH, borderRadius: PH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * 46}px) scale(${mix(1.1, 1, pill)})`,
      }}>
        <span style={{ ...textBase(size, 400, S.display), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
      </div>}
    </Handoff>
    <Sfx name="whoosh-short" at={0.05} />
    <Sfx name="woosh" at={growAt} />
    <Sfx name="pop" at={titleAt + 0.1} />
  </Frame>;
}
