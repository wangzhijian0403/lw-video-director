// T12m 方块翻转（快过渡 3s）：一根黑色长条方块写着上一章，整根向上翻一面（像滚动的棱柱），翻上来的新一面就是本章。
// 观众要看懂的变化：上一章名 → 长条方块向上翻一面 → 本章名。
// 动作来源：3D 棱柱翻面（同一对象换面）；外观为 kit 黑胶囊语言（实心 #19191c + 右下投影）。T12h 是胶囊内左右翻转换身份，这里是整块绕横轴滚一面、并带出序号。
import React from 'react';
import { S, clamp, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, pad2 } from './_shared';

export type CubeTurnProps = HandoffProps & {
  index: number;
  prevTitle: string;   // 上一章名（翻走的那一面）
  title: string;       // 本章名
  cues?: number[];     // [0]=开始翻面
};

export const cubeTurnDefaults: CubeTurnProps = {
  index: 4,
  prevTitle: '语音输入法',
  title: '视频字幕翻译',
};

const H = 250, NUM = 128, PAD = 96, GAP = 54;

function Face({ num, title, size, w, numColor }: { num: string; title: string; size: number; w: number; numColor: string }) {
  return <div style={{
    position: 'absolute', left: 0, top: 0, width: w, height: H, background: S.dark, borderRadius: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: GAP, backfaceVisibility: 'hidden',
  }}>
    <span style={{ ...textBase(NUM, 900), lineHeight: 1, color: numColor, fontVariantNumeric: 'tabular-nums' }}>{num}</span>
    <span style={{ ...textBase(size, 400, S.display), lineHeight: 1, color: '#fff' }}>{title}</span>
  </div>;
}

export function CubeTurn(props: Partial<CubeTurnProps>) {
  const c = { ...cubeTurnDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.62);

  const avail = 1720 - PAD * 2 - GAP - textWidth('00', NUM);
  const sPrev = fit(c.prevTitle, 132, avail), sNow = fit(c.title, 132, avail);
  const wOf = (title: string, s: number) => PAD * 2 + textWidth('00', NUM) + GAP + textWidth(title, s);
  const W = Math.min(1720, Math.max(980, wOf(c.prevTitle, sPrev), wOf(c.title, sNow)));

  const enter = p(t, 0, 0.42);
  const turn = q(t, at, at + 0.62);
  // 棱柱翻面：旧面 0→-90°，新面 90→0°，绕方块中心轴（translateZ = H/2）
  const ang = 90 * turn;
  const lift = Math.sin(turn * Math.PI) * 0.06;   // 翻到一半时离画面稍近，给翻滚的体积感（无回弹）
  const shadeOld = clamp(turn * 1.4), shadeNew = clamp((1 - turn) * 1.4);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: 960 - W / 2, top: 540 - H / 2, width: W, height: H, perspective: 2400,
        opacity: enter, transform: `translateY(${(1 - enter) * 60}px) scale(${1 + lift})`,
      }}>
        {/* 投影跟着方块的正面高度走：翻到一半时正面最矮，影子收窄 */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 30, boxShadow: S.capsuleShadow, transform: `scaleY(${mix(1, 0.72, Math.sin(turn * Math.PI))})` }} />
        <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${-H / 2}px) rotateX(${ang}deg)` }}>
          <div style={{ position: 'absolute', inset: 0, transform: `translateZ(${H / 2}px)`, backfaceVisibility: 'hidden' }}>
            <Face num={pad2(c.index - 1)} title={c.prevTitle} size={sPrev} w={W} numColor={S.faint} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 30, background: '#000', opacity: shadeOld * 0.55 }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, transform: `rotateX(-90deg) translateZ(${H / 2}px)`, backfaceVisibility: 'hidden' }}>
            <Face num={pad2(c.index)} title={c.title} size={sNow} w={W} numColor={S.accentDark} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 30, background: '#000', opacity: shadeNew * 0.55 }} />
          </div>
        </div>
      </div>
    </Handoff>
    <Sfx name="woosh" at={at} />
    <Sfx name="pop" at={at + 0.56} volume={0.4} />
  </Frame>;
}
