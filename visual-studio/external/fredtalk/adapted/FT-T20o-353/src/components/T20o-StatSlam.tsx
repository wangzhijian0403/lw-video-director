// T20o 数字狂跳（开场 3.6s）：一个巨大的真实数字从 0 一路狂跳到目标值（越跳越慢、停稳），说明这个数字是什么；随后数字缩到上方，本期主题黑胶囊在下面落定。
// 观众要看懂的变化：数字从 0 冲到目标值 → 让位给本期主题。
// 动作来源：T14c 价格落定的“数字滚动后落定”（数字等宽、右对齐不左右跳）+ T01 当前观点让位给下一观点（缩小上移保留上下文）。
import React from 'react';
import { S, clamp, cueAt, mix, p, q, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, splitHighlight } from './_shared';

export type StatSlamProps = HandoffProps & {
  value: number;        // 目标值
  decimals: number;
  unit: string;         // 单位（可空），跟在数字后面
  caption: string;      // 数字下方说明：这个数字是什么
  title: string;
  highlight: string;
  cues?: number[];      // [0]=数字停稳，[1]=主题落下
};

export const statSlamDefaults: StatSlamProps = {
  value: 50500,
  decimals: 0,
  unit: '',
  caption: '个 Star，GitHub 上的真实收藏数',
  title: '免费开源的 AI 放大工具',
  highlight: '免费开源',
};

const fmt = (v: number, d: number) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export function StatSlam(props: Partial<StatSlamProps>) {
  const c = { ...statSlamDefaults, ...props };
  const t = useT();
  const landAt = cueAt(c.cues, 0, 1.25);
  const titleAt = cueAt(c.cues, 1, landAt + 0.45);

  const count = p(t, 0.08, landAt);
  // 前段跳得很快、尾段逐个数停稳；最后一帧一定是准确值
  const v = count >= 1 ? c.value : c.value * count;
  const final = fmt(c.value, c.decimals) + c.unit;
  const now = fmt(v, c.decimals) + c.unit;

  const NS = fit(final, 330, 1500);
  const numW = textWidth(final, NS) * 1.06;
  const capS = fit(c.caption, 56, 1400);
  const up = q(t, titleAt - 0.1, titleAt + 0.45);
  const groupY = mix(400, 250, up);
  const groupScale = mix(1, 0.62, up);
  const land = clamp((t - landAt) / 0.2);

  const size = fit(c.title, 120, 1500);
  const PH = size * 1.7, PW = textWidth(c.title, size) + PH * 1.05;
  const pill = p(t, titleAt + 0.25, titleAt + 0.65);
  const [a, hl, b] = splitHighlight(c.title, c.highlight);

  return <Frame>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', left: 0, width: 1920, top: groupY, transform: `scale(${groupScale})`, transformOrigin: '960px 0px', opacity: p(t, 0, 0.15) }}>
        {/* 数字盒按最终值的宽度固定，右对齐：跳动时整串不左右挪 */}
        <div style={{
          position: 'absolute', left: 960 - numW / 2, width: numW, top: -NS * 0.58, textAlign: 'right',
          ...textBase(NS, 900), color: S.ink, fontVariantNumeric: 'tabular-nums',
          transform: `scale(${1 + 0.035 * (1 - land) * (t >= landAt ? 1 : 0)})`, transformOrigin: '50% 50%',
        }}>{now}</div>
      </div>
      <div style={{
        position: 'absolute', left: 0, width: 1920, top: groupY + NS * 0.66 * groupScale + mix(34, 18, up), textAlign: 'center', ...textBase(capS, 500), color: S.muted,
        opacity: p(t, landAt - 0.15, landAt + 0.25),
      }}>{c.caption}</div>
      {pill > 0 && <div style={{
        position: 'absolute', left: 960 - PW / 2, top: 600, width: PW, height: PH, borderRadius: PH / 2,
        background: S.dark, boxShadow: S.capsuleShadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: clamp(pill * 4), transform: `translateY(${(1 - pill) * 50}px) scale(${mix(1.1, 1, pill)})`,
      }}>
        <span style={{ ...textBase(size, 400, S.display), color: '#fff' }}>{a}<span style={{ color: S.accentDark }}>{hl}</span>{b}</span>
      </div>}
    </Handoff>
    <Sfx name="scroll" at={0.08} volume={0.4} duration={Math.round((landAt - 0.08) * 60)} />
    <Sfx name="pop" at={landAt} />
    <Sfx name="woosh" at={titleAt} volume={0.4} />
  </Frame>;
}
