// T12q 解码定格（快过渡 3s）：黑窗里章节名的每个字先快速乱跳，从左到右依次“锁定”成正确的字；序号同时像计数器一样跳到本章。
// 观众要看懂的变化：一串乱跳的字 → 从左到右逐字锁定 → 本章名。
// 动作来源：逐字揭示（typed 的逐字推进节奏，标题约 10 帧/字）+ 等宽占位不跳位（motion-craft 第 6 节：整句先按终态排好）。适合 AI、代码、工具类章节。
import React from 'react';
import { S, clamp, cueAt, p, textWidth } from '../kit/theme';
import { Frame, Handoff, HandoffProps, Sfx, textBase, useT } from '../kit/ui';
import { fit, pad2, partLabel, rand } from './_shared';

export type DecodeProps = HandoffProps & {
  index: number;
  label: string;        // 留空用「第N部分」
  title: string;
  pool: string;         // 乱跳时用的字（默认取自标题和常用字）
  cues?: number[];      // [0]=开始锁定
};

export const decodeDefaults: DecodeProps = {
  index: 4,
  label: '',
  title: '视频字幕翻译',
  pool: '视频字幕翻译开源免费工具自动识别生成模型代码一键',
};

const LAB = 56, NUM = 120;

export function Decode(props: Partial<DecodeProps>) {
  const c = { ...decodeDefaults, ...props };
  const t = useT();
  const at = cueAt(c.cues, 0, 0.55);
  const chars = Array.from(c.title);
  const pool = Array.from(c.pool + c.title).filter((ch) => /[一-鿿]/.test(ch));
  const latinPool = 'ABCDEFGHKMNPRSTUVXZ0123456789';

  const size = fit(c.title, 168, 1600);
  const per = Math.min(0.12, 0.9 / Math.max(1, chars.length));   // 每个字锁定的间隔
  const scrambleFrom = 0.12;                                       // 乱跳开始
  const step = Math.floor(t * 20);                                 // 乱跳刷新率：每秒 20 次（不逐帧，避免糊成残影）

  const lockAt = (i: number) => at + i * per;
  const shown = chars.map((ch, i) => {
    if (ch === ' ' || t >= lockAt(i)) return ch;
    if (t < scrambleFrom + i * 0.03) return '';
    const latin = /[\u0000-ÿ]/.test(ch);
    const src = latin ? Array.from(latinPool) : pool;
    return src[Math.floor(rand(i * 97 + step * 13) * src.length)];
  });

  // 序号计数：从 00 跳到本章（和字锁定同时结束）
  const doneAt = lockAt(chars.length - 1);
  const cnt = Math.round(c.index * p(t, scrambleFrom, doneAt));
  const num = pad2(cnt);
  const label = partLabel(c.index, c.label);
  const fin = p(t, doneAt, doneAt + 0.35);

  const w = textWidth(c.title, size);
  const y0 = 540 - (NUM + 40 + size * 1.16 + 30 + LAB * 1.16) / 2;
  return <Frame dark>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{
        ...textBase(NUM, 900), lineHeight: 1, position: 'absolute', left: 0, right: 0, top: y0, textAlign: 'center',
        color: S.accentDark, fontVariantNumeric: 'tabular-nums', opacity: p(t, 0, 0.3),
      }}>{num}</div>
      {/* 每个字一个固定宽度的格子：乱跳和锁定都不会让整行左右挪 */}
      <div style={{ position: 'absolute', left: 960 - w / 2, top: y0 + NUM + 40, display: 'flex' }}>
        {chars.map((ch, i) => {
          const cw = textWidth(ch, size);
          const locked = t >= lockAt(i);
          const k = clamp((t - lockAt(i)) / 0.18);
          return <div key={i} style={{ width: cw, height: size * 1.16, textAlign: 'center' }}>
            <span style={{
              ...textBase(size, 400, S.display), color: locked ? '#fff' : S.faint,
              display: 'inline-block', transform: `scale(${locked ? 1 + 0.06 * (1 - k) : 0.92})`,
            }}>{shown[i]}</span>
          </div>;
        })}
      </div>
      <div style={{
        ...textBase(LAB, 600), position: 'absolute', left: 0, right: 0, top: y0 + NUM + 40 + size * 1.16 + 30, textAlign: 'center',
        color: '#fff', letterSpacing: 4, opacity: fin, transform: `translateY(${(1 - fin) * 16}px)`,
      }}>{label}</div>
    </Handoff>
    <Sfx name="typing" at={scrambleFrom} volume={0.4} duration={Math.max(1, Math.round((doneAt - scrambleFrom) * 60))} />
    <Sfx name="pop" at={doneAt} volume={0.4} />
  </Frame>;
}
