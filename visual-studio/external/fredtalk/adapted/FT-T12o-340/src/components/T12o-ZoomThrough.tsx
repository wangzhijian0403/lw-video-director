// T12o 穿过序号（快过渡 3s）：巨大的黑色序号落定，镜头对准数字“0”的空心一路推进、穿过去，空心里等着的本章黑胶囊正好放大到正常尺寸。
// 观众要看懂的变化：巨大序号 → 镜头穿过数字的空心 → 本章标题。
// 动作来源：相机推近（kit cameraTransform 的写法，按对数插值保证匀速感）+ T12a 黑胶囊终态；空心即“入口”，前后是同一个世界坐标，不切镜。
import React from 'react';
import { S, cueAt, mix, p, q, quintic, textWidth } from '../kit/theme';
import { Brand, Frame, Handoff, HandoffProps, Pill, Sfx, textBase, useT } from '../kit/ui';
import { fit, pad2, partLabel, zoomMix } from './_shared';

export type ZoomThroughProps = HandoffProps & {
  index: number;
  label: string;        // 留空用「第N部分」
  title: string;
  cues?: number[];      // [0]=开始穿越
};

export const zoomThroughDefaults: ZoomThroughProps = {
  index: 2,
  label: '',
  title: 'PDF 一键翻译',
};

const NUM = 640, DW = NUM * 0.66, ZEND = 22;
// MiSans Heavy 数字在 line-height 1 盒子里的字形中心（相对盒顶，按字号比例；sheet 实测校准）
const GLYPH_CY = 0.5;

export function ZoomThrough(props: Partial<ZoomThroughProps>) {
  const c = { ...zoomThroughDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.78);
  const num = pad2(c.index);
  const label = partLabel(c.index, c.label);

  // 世界坐标：数字组居中
  const digits = Array.from(num);
  const groupW = DW * digits.length;
  const top = 540 - NUM / 2 + 40;
  const zi = digits.indexOf('0');
  // 没有 0（如 11）就穿过两个数字之间的缝
  const hx = zi >= 0 ? 960 - groupW / 2 + DW * (zi + 0.5) : 960;
  const hy = top + NUM * GLYPH_CY;

  const numIn = p(t, 0, 0.42);
  const labIn = p(t, 0.18, 0.55);
  const e = quintic(t, at, at + 0.95);
  const z = zoomMix(1, ZEND, e);
  const sx = mix(hx, 960, e), sy = mix(hy, 540, e);
  const cam = `translate(${sx}px, ${sy}px) scale(${z}) translate(${-hx}px, ${-hy}px)`;

  const PH = 230, size = fit(c.title, 132, 1260), NS = 104;
  const PW = Math.max(760, textWidth(num, NS) + 44 + textWidth(c.title, size) + PH * 0.9);
  const pillIn = p(t, at + 0.35, at + 0.7);
  const labOut = p(t, at, at + 0.3);

  const brandOp = 1 - q(t, at + 0.05, at + 0.2) + q(t, at + 0.75, at + 0.95);   // 数字扫过角标区时让开
  return <Frame brand={false}>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, transform: cam, transformOrigin: '0 0' }}>
        <div style={{
          ...textBase(54, 600), position: 'absolute', left: 0, width: 1920, top: top - 70, textAlign: 'center', color: S.accent, letterSpacing: 4,
          opacity: labIn * (1 - labOut), transform: `translateY(${(1 - labIn) * 16}px)`,
        }}>{label}</div>
        <div style={{
          position: 'absolute', left: 960 - groupW / 2, top, display: 'flex', opacity: numIn,
          transform: `scale(${mix(0.86, 1, numIn)})`, transformOrigin: `${groupW / 2}px ${NUM / 2}px`,
        }}>
          {digits.map((d, i) => <div key={i} style={{ width: DW, height: NUM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ ...textBase(NUM, 900), lineHeight: 1, color: S.ink }}>{d}</span>
          </div>)}
        </div>
        {/* 空心里等着的本章胶囊：世界尺寸 = 1/ZEND，镜头推到底时正好 1:1 */}
        <div style={{ position: 'absolute', left: hx, top: hy, transform: `scale(${1 / ZEND})`, transformOrigin: '0 0', opacity: pillIn }}>
          <Pill box={{ x: -PW / 2, y: -PH / 2, w: PW, h: PH }}>
            <span style={{ ...textBase(NS, 900), color: S.accentDark, marginRight: 44 }}>{num}</span>
            <span style={{ ...textBase(size, 400, S.display), color: '#fff' }}>{c.title}</span>
          </Pill>
        </div>
      </div>
    </Handoff>
    <div style={{ opacity: brandOp }}><Brand /></div>
    <Sfx name="woosh" at={at} />
    <Sfx name="pop" at={at + 0.85} volume={0.4} />
  </Frame>;
}
