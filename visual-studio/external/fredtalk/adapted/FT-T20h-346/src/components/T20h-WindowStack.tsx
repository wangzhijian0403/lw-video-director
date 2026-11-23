// T20h 窗口连弹（开场 4s）：一串真实页面截图“嘟嘟嘟”连续弹出叠在一起，最后一张是主角；其余被一把扫出画面，主角放大回正，标题黑胶囊压在它下沿。
// 观众要看懂的变化：一串真实界面连续弹出 → 其它被扫开，只留主角和标题。
// 动作来源：107 证据卡/T05f 的错开摊开节奏（这里压到 0.13s 一张做“连弹”）+ T20a2 推向主作品；和 T20d（先汇聚再散到四边、中央落主题）不同，这里是逐张叠起、只留一张。
import React from 'react';
import { S, clamp, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Box, Frame, Handoff, HandoffProps, Media, Sfx, between, textBase, useT } from '../kit/ui';
import { fit, splitHighlight } from './_shared';

export type WindowStackProps = HandoffProps & {
  media: string[];      // 真实截图（public 下路径），按弹出顺序
  ratio: number;        // 截图宽高比
  heroIndex: number;    // 留下来的那张
  title: string;
  highlight: string;
  cues?: number[];      // [0]=扫开，[1]=标题落下
};

export const windowStackDefaults: WindowStackProps = {
  media: ['fredtalk/media/lw-work-05.jpg', 'fredtalk/media/lw-work-01.jpg', 'fredtalk/media/lw-work-03.jpg', 'fredtalk/media/lw-work-01.jpg', 'fredtalk/media/lw-work-06.jpg'],
  ratio: 2304 / 1520,
  heroIndex: 4,
  title: '5 个免费开源工具',
  highlight: '免费开源',
};

// 散落位置（中心点 + 角度），循环取用
const SCATTER = [
  { x: 640, y: 420, r: -6 }, { x: 1290, y: 380, r: 5 }, { x: 760, y: 650, r: 4 }, { x: 1200, y: 680, r: -4 },
  { x: 960, y: 520, r: -2 }, { x: 560, y: 560, r: 3 }, { x: 1380, y: 560, r: -3 },
];

export function WindowStack(props: Partial<WindowStackProps>) {
  const c = { ...windowStackDefaults, ...props };
  const t = useT();
  const n = c.media.length;
  const hero = Math.max(0, Math.min(n - 1, c.heroIndex));
  const gap = Math.min(0.13, 0.9 / Math.max(1, n));
  // 主角最后一个弹出（压在最上面）
  const order = [...c.media.keys()].filter((i) => i !== hero).concat(hero);
  const lastPop = 0.05 + (n - 1) * gap;
  const sweepAt = cueAt(c.cues, 0, lastPop + 0.55);
  const titleAt = cueAt(c.cues, 1, sweepAt + 0.42);

  const CW = 860, CH = CW / c.ratio;
  const sweep = q(t, sweepAt, sweepAt + 0.5);
  const heroMove = q(t, sweepAt + 0.04, sweepAt + 0.66);

  const HW = 1200, HH = HW / c.ratio;
  const heroEnd: Box = { x: 960 - HW / 2, y: Math.max(125, 470 - HH / 2), w: HW, h: HH };

  const size = fit(c.title, 112, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      {order.map((mi, k) => {
        const at = 0.05 + k * gap;
        if (t < at) return null;
        const e = p(t, at, at + 0.34);
        const sc = SCATTER[k % SCATTER.length];
        const start: Box = { x: sc.x - CW / 2, y: sc.y - CH / 2, w: CW, h: CH };
        const isHero = mi === hero;
        let box = start, rot = sc.r * (isHero ? 1 - heroMove : 1), dx = 0, dy = 0, op = clamp(e * 2.5);
        if (isHero) box = between(start, heroEnd, heroMove);
        else {
          // 扫开：沿“离开画面中心”的方向飞出，越靠外越先走
          const dir = Math.sign(sc.x - 960) || (k % 2 ? 1 : -1);
          const s = q(t, sweepAt + Math.abs(sc.x - 960) / 9000, sweepAt + 0.42);
          dx = dir * s * 1500; dy = (sc.y - 540) * s * 1.2; rot += dir * s * 14; op *= 1 - clamp(s * 1.4 - 0.4);
          if (op <= 0.001) return null;
        }
        return <div key={mi} style={{
          position: 'absolute', inset: 0, opacity: op, zIndex: k,
          transform: `translate(${dx}px, ${dy + (1 - e) * 90}px)`,
        }}>
          <Media src={c.media[mi]} box={box} radius={S.radius} style={{
            boxShadow: S.shadow, transform: `rotate(${rot}deg) scale(${mix(0.82, 1, e)})`,
          }} />
        </div>;
      })}
      {pill > 0 && <div style={{
        position: 'absolute', left: 960 - PW / 2, top: heroEnd.y + heroEnd.h - PH * 0.45, width: PW, height: PH, borderRadius: PH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * -50}px) scale(${mix(1.12, 1, pill)})`,
      }}>
        <span style={{ ...textBase(size, 400, S.display), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
      </div>}
    </Handoff>
    <Sfx name="pop" at={0.05} volume={0.35} />
    <Sfx name="pop" at={lastPop} volume={0.35} />
    <Sfx name="woosh" at={sweepAt} />
    <Sfx name="pop" at={titleAt + 0.1} />
  </Frame>;
}
