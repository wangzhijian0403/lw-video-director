// T20k 屏幕立起（开场 4s）：一块正在播放真实录屏的屏幕平躺在画面下方，像打开笔记本屏幕一样绕下沿翻起、立正，影子随之落下；立稳后标题黑胶囊压在下沿。
// 观众要看懂的变化：平躺看不清的画面 → 翻起立正、看清正在发生什么 → 标题。
// 动作来源：T10/99-13“从设备看清内容”的屏幕放大关系，换成绕下沿的 3D 翻起（quintic 两端零速度，不回弹）；媒体时钟从第一帧起连续播放。
import React from 'react';
import { S, clamp, cueAt, mix, p, quintic, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Media, Sfx, textBase, useT } from '../kit/ui';
import { fit, splitHighlight } from './_shared';

export type ScreenRiseProps = HandoffProps & {
  src: string;          // 真实录屏或截图
  ratio: number;        // 宽高比
  start: number;        // 视频从第几秒开始播
  title: string;
  highlight: string;
  cues?: number[];      // [0]=开始翻起，[1]=标题落下
};

export const screenRiseDefaults: ScreenRiseProps = {
  src: 'fredtalk/media/lw-recording.mp4',
  ratio: 1440 / 1080,
  start: 1,
  title: '一键把模糊图变高清',
  highlight: '变高清',
};

export function ScreenRise(props: Partial<ScreenRiseProps>) {
  const c = { ...screenRiseDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.2);
  const titleAt = cueAt(c.cues, 1, at + 1.2);

  const H = Math.min(820, 1300 / c.ratio), W = H * c.ratio;
  const box = { x: 960 - W / 2, y: 70, w: W, h: H };

  const appear = p(t, 0, 0.3);
  const rise = quintic(t, at, at + 1.0);
  const ang = mix(82, 0, rise);                 // 绕下沿：82° 近乎平躺 → 0° 立正
  const lift = mix(150, 0, rise);               // 平躺时整体更靠下
  const shadowK = clamp(rise * 1.2);

  const size = fit(c.title, 108, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, perspective: 1900, perspectiveOrigin: `960px ${box.y + box.h}px` }}>
        <div style={{
          position: 'absolute', left: box.x, top: box.y + lift, width: W, height: H, transformOrigin: '50% 100%',
          transform: `rotateX(${ang}deg)`, opacity: appear,
        }}>
          <Media src={c.src} start={c.start} box={{ x: 0, y: 0, w: W, h: H }} radius={S.radius} style={{
            boxShadow: `0 ${mix(4, 16, shadowK)}px ${mix(8, 25, shadowK)}px 0 rgba(0,0,0,${mix(0.05, 0.1333, shadowK).toFixed(3)})`,
          }} />
          {/* 平躺时屏幕偏暗，立起来亮度回正 */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: S.radius, background: '#000', opacity: (1 - rise) * 0.35 }} />
        </div>
      </div>
      {pill > 0 && <div style={{
        position: 'absolute', left: 960 - PW / 2, top: box.y + box.h - PH * 0.42, width: PW, height: PH, borderRadius: PH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * 46}px) scale(${mix(1.1, 1, pill)})`,
      }}>
        <span style={{ ...textBase(size, 400, S.display), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
      </div>}
    </Handoff>
    <Sfx name="woosh" at={at} />
    <Sfx name="pop" at={titleAt + 0.1} />
  </Frame>;
}
