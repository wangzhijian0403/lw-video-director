// T20i 细节拉远（开场 4s）：第一帧就是真实页面上一个放大的局部（比如 50.5k Star），观众先看到“这是什么数字”，镜头一口气拉远成完整页面，标题黑胶囊落在页面下沿。
// 观众要看懂的变化：一个吸引人的局部 → 拉远看到它来自哪个完整界面 → 标题落定。
// 动作来源：相机 quintic + cameraTransform（CAM01/T05c 推近读清的反向：先读局部再回全貌）；镜头不越出截图边界，所以不会露出截图外的空白。
import React from 'react';
import { S, clamp, cueAt, mix, p, quintic, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Media, Sfx, textBase, useT } from '../kit/ui';
import { fit, splitHighlight, zoomMix } from './_shared';

export type PullBackProps = HandoffProps & {
  src: string;                          // 真实截图
  srcW: number; srcH: number;           // 截图原始像素
  focus: { x: number; y: number };      // 开场放大的局部（源图像素坐标）
  zoomFrom: number;                     // 开场放大倍数（相对终态）
  title: string;
  highlight: string;
  cues?: number[];                      // [0]=开始拉远，[1]=标题落下
};

export const pullBackDefaults: PullBackProps = {
  src: 'fredtalk/media/lw-work-02.jpg',
  srcW: 2304, srcH: 1520,
  focus: { x: 2200, y: 1392 },
  zoomFrom: 3.4,
  title: '5 万人收藏的放大工具',
  highlight: '5 万人收藏',
};

export function PullBack(props: Partial<PullBackProps>) {
  const c = { ...pullBackDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.55);
  const titleAt = cueAt(c.cues, 1, at + 1.15);

  // 终态：截图宽 1200，顶边避开右上角标，下沿给胶囊留位置
  const W = 1200, H = W * c.srcH / c.srcW;
  const box = { x: 960 - W / 2, y: Math.max(125, 500 - H / 2), w: W, h: H };
  const k = W / c.srcW;
  const fx0 = box.x + c.focus.x * k, fy0 = box.y + c.focus.y * k;

  // 开场 0–at 轻推 3%（不定格），at 起一口气拉远
  const e = quintic(t, at, at + 1.05);
  const z = zoomMix(c.zoomFrom * mix(1, 1.03, clamp(t / Math.max(0.01, at))), 1, e);
  // 镜头中心：从局部移到截图中心；夹在截图范围内，不露出截图外的白
  const clampAxis = (v: number, lo: number, len: number, half: number) => (len >= half * 2 ? clamp(v, lo + half, lo + len - half) : lo + len / 2);
  const cx = clampAxis(mix(fx0, box.x + box.w / 2, e), box.x, box.w, 960 / z);
  const cy = clampAxis(mix(fy0, box.y + box.h / 2, e), box.y, box.h, 540 / z);
  const endCx = 960, endCy = box.y + box.h / 2;
  // 拉远到底时，截图回到 box 原位（屏幕中心 = 截图中心 → 平移到终态中心）
  const sx = mix(960, endCx, e), sy = mix(540, endCy, e);
  const cam = `translate(${sx}px, ${sy}px) scale(${z}) translate(${-cx}px, ${-cy}px)`;

  const size = fit(c.title, 108, 1300);
  const PH = size * 1.62, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt, titleAt + 0.42);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);
  const radius = mix(0, S.radius, e);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, transform: cam, transformOrigin: '0 0' }}>
        <Media src={c.src} box={box} radius={radius} style={{ boxShadow: e > 0.6 ? S.shadow : 'none' }} />
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
