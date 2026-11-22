/**
 * FiberBridge.tsx — 跨镜转场用的「纤维桥」
 *
 * 为什么要有它：两个镜头之间原来是 0.4s 交叉溶解，纸和原料各淡一半，
 * 观感是「两张图叠了一下」。专业片的接法是把上一镜正在运动的元素直接
 * 交到下一镜：镜头1 散开的纤维 → 镜头2 四件原料的落点；
 * 镜头2 收成一束往下掉的纤维 → 镜头3 落进水槽的那一束。
 *
 * 这一层画在所有场景之上、字幕之下，只在接点前后存在；
 * 它的纤维位置和两端镜头用的是同一套 1280×720 设计坐标，所以能对上。
 */
import {mulberry32, clamp01, lerp, easeOut, strandPath} from './kit';

type Kind = 'toMaterials' | 'intoVat' | 'intoMortar' | 'intoScoop';

const W = 1280;
const H = 720;

/** 镜头2 四件原料的落点（与 Materials.tsx 的 SLOTS 一致：x=1280*fx, y=336+dy） */
const SLOTS = [
  {x: 1280 * 0.19, y: 344},
  {x: 1280 * 0.43, y: 394},
  {x: 1280 * 0.66, y: 342},
  {x: 1280 * 0.85, y: 388},
];

type Streak = {sx: number; sy: number; ex: number; ey: number; delay: number; dur: number; w: number; a: number; bend: number; rot: number};

const TO_MATERIALS: Streak[] = (() => {
  const r = mulberry32(0x6e21);
  return Array.from({length: 260}, () => {
    const slot = SLOTS[Math.floor(r() * SLOTS.length)];
    return {
      // 起点铺在纸面范围内（镜头1 的纸就在这个区间），末端是四件原料的落点
      sx: 70 + r() * 1140,
      sy: 50 + r() * 560,
      ex: slot.x + (r() - 0.5) * 76,
      ey: slot.y + (r() - 0.5) * 56,
      delay: 0.05 + r() * 0.34,
      dur: 0.34 + r() * 0.2,
      w: 0.5 + r() * 0.8,
      a: 0.12 + r() * 0.22,
      bend: (r() - 0.5) * 240,
      rot: -30 + r() * 60,
    };
  });
})();

const INTO_VAT: Streak[] = (() => {
  const r = mulberry32(0x2f77);
  return Array.from({length: 84}, () => {
    // 收成一束：横向只散 90px，纵向拉长，读起来是「一绺纤维往下掉」而不是瀑布
    const x = 640 + (r() - 0.5) * 90;
    return {
      sx: x + (r() - 0.5) * 24,
      sy: -70 + r() * 150,
      ex: x + (r() - 0.5) * 40,
      ey: 392 + r() * 78,
      delay: r() * 0.18,
      dur: 0.55 + r() * 0.3,
      w: 0.7 + r() * 1.1,
      a: 0.12 + r() * 0.16,
      bend: (r() - 0.5) * 30,
      rot: 84 + r() * 12,
    };
  });
})();

/** 镜头4 石臼口：与 PoundMortar.tsx 的 MILL 一致（cx 858 / top 372 / rx 186 / ry 50） */
const INTO_MORTAR: Streak[] = (() => {
  const r = mulberry32(0x51c3);
  return Array.from({length: 72}, () => {
    const cx = 858 + (r() - 0.5) * 130;
    return {
      // 从左侧水槽那一带横着荡过来，落在臼口里
      sx: 470 + r() * 130,
      sy: 300 + (r() - 0.5) * 220,
      ex: cx + (r() - 0.5) * 24,
      ey: 372 + (r() - 0.5) * 34,
      delay: 0.04 + r() * 0.3,
      dur: 0.4 + r() * 0.24,
      w: 0.6 + r() * 1.0,
      a: 0.12 + r() * 0.16,
      bend: (r() - 0.5) * 120,
      rot: 6 + r() * 22,
    };
  });
})();

/** 镜头5 水槽水面：与 SheetScoop.tsx 的 VAT 一致（x 690–1190 / top 402） */
const INTO_SCOOP: Streak[] = (() => {
  const r = mulberry32(0x3ad1);
  return Array.from({length: 78}, () => {
    const ex = 760 + r() * 380;
    return {
      // 从石臼那一带往右荡，落进水面
      sx: 700 + (r() - 0.5) * 200,
      sy: 330 + (r() - 0.5) * 130,
      ex,
      ey: 414 + (r() - 0.5) * 20,
      delay: 0.04 + r() * 0.3,
      dur: 0.42 + r() * 0.26,
      w: 0.6 + r() * 1.0,
      a: 0.12 + r() * 0.16,
      bend: (r() - 0.5) * 90,
      rot: -8 + r() * 24,
    };
  });
})();

const CONFIG: Record<Kind, {list: Streak[]; tail: number; water: number; column?: {x: number; w: number; y: number; h: number} }> = {
  toMaterials: {list: TO_MATERIALS, tail: 110, water: 0},
  intoVat: {list: INTO_VAT, tail: 58, water: 420, column: {x: 500, y: 0, w: 280, h: H}},
  intoMortar: {list: INTO_MORTAR, tail: 64, water: 0, column: {x: 700, y: 150, w: 320, h: 260}},
  intoScoop: {list: INTO_SCOOP, tail: 90, water: 430},
};

export function FiberBridge({kind, progress, accent, muted}: {kind: Kind; progress: number; accent: string; muted: string}) {
  const cfg = CONFIG[kind] ?? CONFIG.intoVat;
  const list = cfg.list;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="fb-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* 纤维：每根都有一条拖尾，尾巴长度 = 还没走完的距离，读起来是「流过去」 */}
        {list.map((k, i) => {
          const a = easeOut(clamp01((progress - k.delay) / k.dur));
          if (a <= 0) return null;
          const x = lerp(k.sx, k.ex, a);
          const y = lerp(k.sy, k.ey, a) + Math.sin(a * Math.PI) * k.bend * 0.12;
          const tail = 0.5;
          const back = easeOut(clamp01((progress - k.delay - k.dur * tail) / k.dur));
          const tx = lerp(k.sx, k.ex, back);
          const ty = lerp(k.sy, k.ey, back) + Math.sin(back * Math.PI) * k.bend * 0.12;
          // 拖尾长度必须封顶：不封顶会变成横贯全画面的长划痕；竖向下落时再收紧，避免划出水槽
          const tailLen = Math.min(cfg.tail, Math.hypot(x - tx, y - ty) + 8);
          const fade = clamp01(progress / 0.12) * (1 - clamp01((progress - 0.72) / 0.28) * 0.55);
          // 入水后收掉：落到水面以下的纤维逐渐淡出，交给镜头自己的水体与纤维继续演
          const intoWater = cfg.water ? 1 - clamp01((y - cfg.water) / 70) : 1;
          const taper = cfg.water || kind === 'intoMortar' ? 1 - clamp01((a - 0.5) / 0.5) * 0.9 : 1;
          return (
            <g key={`fb-${i}`} opacity={fade * intoWater * taper}>
              <path
                d={strandPath({curve: k.bend / 40}, x, y, k.rot + 180, tailLen)}
                stroke={muted}
                strokeWidth={k.w * 0.7}
                strokeOpacity={k.a * 0.5}
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={strandPath({curve: k.bend / 60}, x, y, k.rot, 22 + k.w * 14)}
                stroke={muted}
                strokeWidth={k.w}
                strokeOpacity={k.a}
                fill="none"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {kind === 'toMaterials'
          ? SLOTS.map((slot, i) => {
              const p = clamp01((progress - 0.5 - i * 0.04) / 0.4);
              if (p <= 0) return null;
              return (
                <ellipse
                  key={`slot-${i}`}
                  cx={slot.x}
                  cy={slot.y}
                  rx={70 + p * 40}
                  ry={70 + p * 40}
                  fill={accent}
                  opacity={0.16 * (1 - p * 0.6)}
                  filter="url(#fb-soft)"
                />
              );
            })
          : null}

        {cfg.column ? (
          <rect
            x={cfg.column.x}
            y={cfg.column.y}
            width={cfg.column.w}
            height={cfg.column.h}
            fill={muted}
            opacity={0.05 * (1 - progress)}
            filter="url(#fb-soft)"
          />
        ) : null}
      </svg>
    </div>
  );
}
