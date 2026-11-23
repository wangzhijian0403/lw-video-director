// T20n 头像发问（开场 4s）：Fred 的圆形头像从左下冒出来，旁边的黑色气泡逐字打出一个问题；问题打完，下方“答案”黑胶囊砸出本期主题。
// 观众要看懂的变化：Fred 冒出来 → 抛出一个问题 → 本期给出的答案就是主题。
// 动作来源：W 系逐字打出（等宽占位、不跳位）+ INT04 消息气泡出现；T21b 是问题被答案接上并打勾，这里是开场“一问一答”定下本期主题。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { S, clamp, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, splitHighlight } from './_shared';

export type AvatarAskProps = HandoffProps & {
  avatar: string;       // Fred 头像（真实照片或卡通头像）
  face: { x: number; y: number };   // 脸在图里的位置（0–1），头像圆框以它为中心放大
  zoom: number;
  question: string;
  answer: string;
  highlight: string;    // answer 里的强调词
  cues?: number[];      // [0]=开始打字，[1]=答案砸出
};

export const avatarAskDefaults: AvatarAskProps = {
  avatar: 'fredtalk/media/lw-work-06.jpg',
  face: { x: 0.56, y: 0.33 },
  zoom: 1.9,
  question: '你还在花钱买会员吗？',
  answer: '这 5 个开源工具就够了',
  highlight: '开源工具',
};

const AV = 250;

export function AvatarAsk(props: Partial<AvatarAskProps>) {
  const c = { ...avatarAskDefaults, ...props };
  const t = useT();
  const typeAt = cueAt(c.cues, 0, 0.55);
  const chars = Array.from(c.question);
  const typeEnd = typeAt + Math.min(1.3, chars.length * 0.1);
  const ansAt = cueAt(c.cues, 1, typeEnd + 0.35);

  // 版式：头像 + 气泡一行；答案胶囊在下
  const qs = fit(c.question, 96, 1200);
  const BH = qs * 1.9, BW = textWidth(c.question, qs) + BH * 0.9;
  const rowW = AV + 40 + BW;
  const rowX = 960 - rowW / 2;
  const as = fit(c.answer, 120, 1500);
  const AH = as * 1.7, AW = textWidth(c.answer, as) + AH * 1.05;
  const ans = p(t, ansAt, ansAt + 0.38);
  const lift = q(t, ansAt - 0.1, ansAt + 0.35);
  const rowY = mix(540, 360, lift);   // 头像中心：先居中，答案来时上移
  const ansY = 360 + AV / 2 + 90;

  const av = p(t, 0, 0.45);
  const bub = p(t, typeAt - 0.2, typeAt + 0.15);
  const shown = Math.floor(clamp((t - typeAt) / Math.max(0.01, typeEnd - typeAt)) * chars.length);
  const [a, hl, b] = splitHighlight(c.answer, c.highlight);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        position: 'absolute', left: rowX, top: rowY - AV / 2, width: AV, height: AV, borderRadius: AV / 2, overflow: 'hidden',
        boxShadow: S.shadow, opacity: clamp(av * 2), transform: `translate(${(1 - av) * -60}px, ${(1 - av) * 120}px) scale(${mix(0.7, 1, av)})`,
      }}>
        <Img src={staticFile(c.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${c.zoom})`, transformOrigin: `${c.face.x * 100}% ${c.face.y * 100}%` }} />
      </div>
      {bub > 0 && <div style={{
        position: 'absolute', left: rowX + AV + 40, top: rowY - BH / 2, width: BW, height: BH, borderRadius: BH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', paddingLeft: BH * 0.45,
        clipPath: `inset(0 ${100 * (1 - bub)}% 0 0 round ${BH / 2}px)`,
      }}>
        {/* 整句先排好，没打到的字透明占位：打字时整行不挪 */}
        <span style={{ ...textBase(qs, 900), color: '#fff' }}>
          {chars.map((ch, i) => <span key={i} style={{ color: i < shown ? '#fff' : 'transparent' }}>{ch}</span>)}
        </span>
      </div>}
      {ans > 0 && <div style={{
        position: 'absolute', left: 960 - AW / 2, top: ansY, width: AW, height: AH, borderRadius: AH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: clamp(ans * 2), transform: `translateY(${(1 - ans) * -40}px) scale(${mix(1.14, 1, ans)})`,
      }}>
        <span style={{ ...textBase(as, 400, S.display), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
      </div>}
    </Handoff>
    <Sfx name="pop" at={0.1} volume={0.4} />
    <Sfx name="typing" at={typeAt} volume={0.4} duration={Math.max(1, Math.round((typeEnd - typeAt) * 60))} />
    <Sfx name="pop" at={ansAt} />
  </Frame>;
}
