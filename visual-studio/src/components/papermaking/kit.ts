/**
 * kit.ts — 《造纸术》三镜共用的确定性绘图工具
 *
 * 唯一约束：所有随机都来自固定种子（mulberry32），不碰 Math.random / Date，
 * 因此同一帧号永远得到同一画面，渲染可重现、可换文案后重算。
 */
import {useCurrentFrame, useVideoConfig} from 'remotion';

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - (1 - clamp01(t)) ** 3;
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
};
/** 把 [a,b] 区间映射成 0–1 进度，越界自动夹紧 */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1e-6, b - a));

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 镜头本地进度。
 * span 由工程里的 params.span 传入（= 该镜实际占用的秒数），
 * 这样组件不需要猜自己多长，换文案重排后只要重算 span 即可。
 */
export function useShot(span: number | undefined, fallback = 3.6) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = Math.max(1, Math.round(((span && span > 0 ? span : fallback)) * fps));
  return {frame, fps, t: frame / fps, p: clamp01(frame / total), total};
}

export type Strand = {
  x: number;
  y: number;
  rot: number;
  len: number;
  curve: number;
  w: number;
  a: number;
};

/** 一根纤维：起点 → 终点的一条二次贝塞尔，弯度由 curve 控制 */
export function strandPath(s: {curve: number}, x: number, y: number, rot: number, len: number) {
  const rad = (rot * Math.PI) / 180;
  const x2 = x + Math.cos(rad) * len;
  const y2 = y + Math.sin(rad) * len;
  const mx = (x + x2) / 2 - Math.sin(rad) * s.curve;
  const my = (y + y2) / 2 + Math.cos(rad) * s.curve;
  return `M${x.toFixed(1)} ${y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/** 毛边纸路径：沿矩形四边取样并加抖动，做出手工纸的规矩毛边 */
export function decklePath(x: number, y: number, w: number, h: number, seed: number, amp = 5) {
  const r = mulberry32(seed);
  const jitter = () => (r() - 0.5) * 2 * amp;
  const step = 34;
  const pts: string[] = [];
  const push = (px: number, py: number) => pts.push(`${px.toFixed(1)} ${py.toFixed(1)}`);
  for (let i = 0; i <= w; i += step) push(x + Math.min(i, w), y + jitter());
  for (let i = 0; i <= h; i += step) push(x + w + jitter(), y + Math.min(i, h));
  for (let i = w; i >= 0; i -= step) push(x + Math.max(i, 0), y + h + jitter());
  for (let i = h; i >= 0; i -= step) push(x + jitter(), y + Math.max(i, 0));
  return `M${pts[0]} L${pts.slice(1).join(' L')} Z`;
}

/** 通用：把一组数值写进 SVG 的 transform */
export const xf = (x: number, y: number, s = 1, rot = 0, ox = 0, oy = 0) =>
  `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)} ${ox} ${oy}) scale(${s.toFixed(4)})`;
