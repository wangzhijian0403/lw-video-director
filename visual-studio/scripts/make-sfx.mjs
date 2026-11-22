#!/usr/bin/env node
/**
 * make-sfx.mjs — 纯代码合成音效库（零第三方音频、零版权风险）
 *
 * 输出：public/sfx/<name>.wav（48k / 16bit / stereo）+ public/sfx/manifest.json
 * 用法：node scripts/make-sfx.mjs
 *
 * 设计来源：与 paxon-yang/talking-video-skills 的 make_sfx_lib.py 同一思路
 * （音效算出来而不是借来的），本实现为 Node 原生版本，无 numpy/scipy 依赖，
 * 但数值参数与用途分类独立重写。
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 48000;
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'public', 'sfx');

// ---------- 基础工具 ----------
const nSamp = (d) => Math.round(SR * d);
const lin = (a, b, n) => Array.from({length: n}, (_, i) => (n === 1 ? a : a + ((b - a) * i) / (n - 1)));

// 确定性随机（mulberry32），保证每次生成结果一致
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const noise = (seed, n) => {
  const r = rng(seed);
  return Array.from({length: n}, () => r() * 2 - 1);
};

const expEnv = (n, tau) => Array.from({length: n}, (_, i) => Math.exp(-i / SR / tau));
const hump = (n, p = 1.5) => Array.from({length: n}, (_, i) => Math.sin((Math.PI * i) / (n - 1)) ** p);

function fade(x, fi = 0.004, fo = 0.02) {
  const n = x.length;
  const a = Math.min(nSamp(fi), Math.floor(n / 3));
  const b = Math.min(nSamp(fo), Math.floor(n / 3));
  for (let i = 0; i < a; i++) x[i] *= (i / a) ** 2;
  for (let i = 0; i < b; i++) x[n - b + i] *= (1 - i / b) ** 2;
  return x;
}

// RBJ 双二阶滤波器
function biquad(x, type, f0, q = 0.7071) {
  const w0 = (2 * Math.PI * Math.min(f0, SR / 2 - 100)) / SR;
  const cw = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') {
    b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2;
  } else if (type === 'hp') {
    b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2;
  } else {
    b0 = alpha; b1 = 0; b2 = -alpha;
  }
  a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha;
  const y = new Float64Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = (b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = xi; y2 = y1; y1 = yi; y[i] = yi;
  }
  return Array.from(y);
}

// 中心频率随时间扫描的谐振带通（state-variable filter），f0 -> f1 -> f2
function sweptBandpass(d, f0, f1, f2, q = 1.2, seed = 1) {
  const n = nSamp(d);
  const x = noise(seed, n);
  const out = new Float64Array(n);
  let low = 0;
  let band = 0;
  const qd = 1 / q;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const fc = t < 0.5 ? f0 * (f1 / f0) ** (t / 0.5) : f1 * (f2 / f1) ** ((t - 0.5) / 0.5);
    const F = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    low += F * band;
    const high = x[i] - low - qd * band;
    band += F * high;
    out[i] = band;
  }
  return biquad(Array.from(out), 'lp', 6500, 0.7071);
}

const maxAbs = (arr) => {
  let m = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = Math.abs(arr[i]);
    if (v > m) m = v;
  }
  return m;
};

// 廉价混响尾：三级反馈梳状滤波 + 阻尼低通（O(n)，短音效用足够，不做真卷积）
function reverb(x, tail = 0.5, wet = 0.25, seed = 3, damp = 6000) {
  const out = x.slice();
  const taps = [
    {d: Math.round(0.011 * SR) + (seed % 7), g: 0.6},
    {d: Math.round(0.019 * SR) + (seed % 5), g: 0.45},
    {d: Math.round(0.031 * SR) + (seed % 3), g: 0.32},
  ];
  const tailN = Math.min(nSamp(tail), Math.round(x.length * 0.8));
  const total = x.length + tailN;
  for (let i = 0; i < total; i++) {
    let fb = 0;
    for (const t of taps) {
      const idx = i - t.d;
      if (idx >= 0) fb += out[idx] * t.g;
    }
    out[i] = (out[i] || 0) + fb * 0.5;
  }
  const y = biquad(out, 'lp', damp, 0.7071);
  const dry = 1 - wet * 0.5;
  return y.map((v, i) => (i < x.length ? x[i] * dry : 0) + v * wet);
}

// 单声道 -> 立体声（可做左右声像扫描）
function panSweep(m, a = -0.5, b = 0.5) {
  const n = m.length;
  const L = new Float64Array(n);
  const R = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const p = a + ((b - a) * i) / (n - 1);
    const ang = ((p + 1) * Math.PI) / 4;
    L[i] = m[i] * Math.cos(ang) * Math.SQRT2;
    R[i] = m[i] * Math.sin(ang) * Math.SQRT2;
  }
  return [Array.from(L), Array.from(R)];
}

const decor = (m, tail = 0.25, wet = 0.5, seed = 5) => {
  const a = reverb(m, tail, wet, seed);
  const b = reverb(m, tail, wet, seed + 11);
  const n = Math.max(a.length, b.length);
  const pad = (arr) => (arr.length < n ? arr.concat(new Array(n - arr.length).fill(0)) : arr);
  return [pad(a), pad(b)];
};

const PEAK = 10 ** (-14 / 20); // -14 dBFS

function finish(ch) {
  // 兼容单声道（直接传数组）：自动复制成左右两声道
  const mono = typeof ch[0] === 'number';
  let [L, R] = mono ? [ch, ch.slice()] : [ch[0], ch[1]];
  const n = L.length;
  // 去直流
  const mL = L.reduce((s, v) => s + v, 0) / n;
  const mR = R.reduce((s, v) => s + v, 0) / n;
  L = L.map((v) => v - mL);
  R = R.map((v) => v - mR);
  // 裁掉尾部近静音
  let last = n - 1;
  const peak = maxAbs(L) || 1e-9;
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(L[i]) > peak * 0.002) { last = i; break; }
  }
  L = fade(L.slice(0, last + 1), 0.003, 0.03);
  R = fade(R.slice(0, last + 1), 0.003, 0.03);
  const mx = Math.max(maxAbs(L), maxAbs(R), 1e-9);
  const g = PEAK / mx;
  return [L.map((v) => v * g), R.map((v) => v * g)];
}

function stats([L, R]) {
  const n = L.length;
  const pk = Math.max(maxAbs(L), maxAbs(R));
  let sum = 0;
  for (let i = 0; i < n; i++) sum += L[i] * L[i] + R[i] * R[i];
  const rms = Math.sqrt(sum / (2 * n));
  // 频谱质心：对左声道做 DFT（抽样到 4096 点降低开销）
  const N = 4096;
  const step = n / N;
  let num = 0;
  let den = 0;
  for (let k = 1; k < N / 2; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < N; i++) {
      const v = L[Math.floor(i * step)] || 0;
      const ang = (-2 * Math.PI * k * i) / N;
      re += v * Math.cos(ang);
      im += v * Math.sin(ang);
    }
    const mag = Math.hypot(re, im);
    num += mag * ((k * SR) / N);
    den += mag;
  }
  return {
    peakDb: +(20 * Math.log10(pk || 1e-9)).toFixed(1),
    rmsDb: +(20 * Math.log10(rms || 1e-9)).toFixed(1),
    centroidHz: den ? Math.round(num / den) : 0,
  };
}

function writeWav(file, [L, R]) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(2, 22); // stereo
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

// ---------- 音效定义 ----------
const lib = {};

{
  // whoosh_short —— 短转场（切点前 2 帧起）
  const d = 0.35;
  const n = nSamp(d);
  const w = sweptBandpass(d, 500, 2600, 900, 3.5, 1).map((v, i) => v * Math.sin((Math.PI * i) / (n - 1)) ** 1.8);
  lib.whoosh_short = [panSweep(w, -0.4, 0.4), d, '短转场：B-roll/镜头切点，比切点提前 2 帧'];
}
{
  // whoosh_long —— 章节转场 / 大镜头
  const d = 0.7;
  const n = nSamp(d);
  const w = sweptBandpass(d, 350, 2200, 700, 3.0, 2).map((v, i) => v * Math.sin((Math.PI * i) / (n - 1)) ** 1.6);
  lib.whoosh_long = [decor(w.slice(0, n + 4000), 0.3, 0.3, 4), d, '章节转场 / 大镜头切换'];
}
{
  // whoosh_down —— 下沉式转场 / 收束
  const d = 0.5;
  const n = nSamp(d);
  const w = sweptBandpass(d, 3000, 1200, 300, 3.0, 3).map(
    (v, i) => v * Math.sin((Math.PI * i) / (n - 1)) * (0.6 + 0.4 * (i / (n - 1))),
  );
  const a = nSamp(0.04);
  for (let i = 0; i < a; i++) w[i] *= i / a;
  lib.whoosh_down = [panSweep(w, 0.4, -0.4), d, '下沉式转场 / 段落收束'];
}
{
  // pop —— 卡片 / 标注出现
  const d = 0.08;
  const n = nSamp(d);
  const body = Array.from({length: n}, (_, i) => {
    const t = i / SR;
    const f = 180 + 700 * Math.exp(-t / 0.012);
    return Math.sin(2 * Math.PI * (f * t)) * Math.exp(-t / 0.03);
  });
  const click = biquad(noise(11, n), 'hp', 2500, 0.7071).map((v, i) => v * Math.exp(-i / SR / 0.0015) * 0.25);
  lib.pop = [body.map((v, i) => v + click[i]), d, '卡片 / 标注 / 药丸出现'];
}
{
  // tick —— 字幕 / 列表项点击
  const d = 0.03;
  const n = nSamp(d);
  const c = biquad(noise(12, n), 'bp', 4200, 1.2).map((v, i) => v * Math.exp(-i / SR / 0.004) * 1.6);
  const tone = Array.from({length: n}, (_, i) => Math.sin(2 * Math.PI * 1900 * (i / SR)) * Math.exp(-i / SR / 0.005) * 0.5);
  lib.tick = [c.map((v, i) => v + tone[i]), d, '字幕逐字 / 列表项干脆点击'];
}
{
  // ding —— 结尾 / 完成
  const d = 1.2;
  const n = nSamp(d);
  const f0 = 1318.5;
  const b = Array.from({length: n}, (_, i) => {
    const t = i / SR;
    const v =
      Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t / 0.35) +
      0.45 * Math.sin(2 * Math.PI * f0 * 2.76 * t) * Math.exp(-t / 0.16) +
      0.25 * Math.sin(2 * Math.PI * f0 * 5.4 * t) * Math.exp(-t / 0.05);
    return v * Math.min(1, t / 0.002);
  });
  lib.ding = [decor(b.slice(0, nSamp(1.5)), 0.6, 0.25, 8).map((ch) => ch.slice(0, nSamp(1.5))), d, '结尾 / 完成 / 正确提示'];
}
{
  // impact_low —— 章节卡 / 大数字揭示
  const d = 1.0;
  const n = nSamp(d);
  const body = Array.from({length: n}, (_, i) => {
    const t = i / SR;
    const f = 48 + 90 * Math.exp(-t / 0.07);
    return Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.28);
  });
  const nz = biquad(noise(13, n), 'lp', 900, 0.7071).map((v, i) => v * Math.exp(-i / SR / 0.07) * 0.8);
  const hi = biquad(biquad(noise(14, n), 'lp', 6000, 0.7071), 'hp', 1500, 0.7071).map(
    (v, i) => v * Math.exp(-i / SR / 0.012) * 0.3,
  );
  const m = biquad(body.map((v, i) => v + nz[i] + hi[i]), 'lp', 4000, 0.7071);
  lib.impact_low = [decor(m.slice(0, nSamp(1.6)), 1.2, 0.5, 9), d, '章节卡 / 大数字揭示的低频重击'];
}
{
  // riser —— 铺垫，结束点 = 揭示帧
  const d = 2.0;
  const n = nSamp(d);
  const nz = sweptBandpass(d, 300, 5000, 6000, 0.9, 5);
  const nzPeak = maxAbs(nz) || 1;
  const out = Array.from({length: n}, (_, i) => {
    const u = i / (n - 1);
    const tone = Math.sin(2 * Math.PI * 120 * 4 ** u ** 1.5 * (i / SR)) * 0.25 +
      Math.sin(2 * Math.PI * 240 * 4 ** u ** 1.5 * (i / SR)) * 0.12;
    let v = ((nz[i] / nzPeak) * 0.9 + tone) * u ** 2.2;
    v *= Math.min(1, (d - i / SR) / 0.03);
    return v;
  });
  lib.riser = [panSweep(out, -0.3, 0.3), d, '铺垫关键时刻（结束点对齐揭示帧）'];
}
{
  // shimmer —— 金句高亮 / 金色强调
  const d = 1.0;
  const n = nSamp(d);
  const sh = new Float64Array(n);
  [2093, 2637, 3136, 3951, 4699, 5588].forEach((f0, k) => {
    const st = Math.round(SR * 0.05 * k * 0.7);
    const len = n - st;
    for (let i = 0; i < len; i++) {
      const t = i / SR;
      sh[st + i] += Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t / 0.25) * Math.min(1, t / 0.003) / (1 + 0.15 * k);
    }
  });
  const air = biquad(noise(15, n), 'hp', 6000, 0.7071).map((v, i) => v * Math.exp(-i / SR / 0.2) * 0.05);
  lib.shimmer = [decor(Array.from(sh).map((v, i) => v + air[i]).slice(0, nSamp(1.3)), 0.7, 0.4, 12), d, '金句高亮 / 金色强调'];
}
{
  // swipe —— 卡片滑入
  const d = 0.25;
  const n = nSamp(d);
  const w = sweptBandpass(d, 1200, 3500, 5000, 2.5, 9).map((v, i) => v * Math.sin((Math.PI * i) / (n - 1)) ** 1.3);
  lib.swipe = [panSweep(w, -0.6, 0.6), d, '卡片滑入 / 面板推出'];
}
{
  // flash —— 亮闪瞬态
  const d = 0.12;
  const n = nSamp(d);
  const fl = biquad(noise(16, n), 'hp', 4000, 0.7071).map((v, i) => v * Math.exp(-i / SR / 0.012));
  const tone = Array.from({length: n}, (_, i) => Math.sin(2 * Math.PI * 3200 * (i / SR)) * Math.exp(-i / SR / 0.02) * 0.4);
  lib.flash = [fl.map((v, i) => v + tone[i]), d, 'flash_cut 亮闪瞬态 / 硬切过渡'];
}

{
  // fiber_rustle —— 植物纤维摩擦 / 纸浆纤维散开（颗粒感，不是白噪声）
  const d = 1.0;
  const n = nSamp(d);
  const r = rng(21);
  const out = new Float64Array(n);
  for (let k = 0; k < 70; k++) {
    const at = Math.floor(r() * (n - 200));
    const amp = 0.25 + r() * 0.6;
    const len = 40 + Math.floor(r() * 260);
    const decay = 0.006 + r() * 0.02;
    const burst = biquad(noise(22 + k, len), 'bp', 2200 + r() * 4200, 1.4);
    for (let i = 0; i < len && at + i < n; i++) out[at + i] += burst[i] * amp * Math.exp(-i / SR / decay);
  }
  // hump 必须提到 map 外面：放进回调里会每帧重建整条包络，复杂度变成 O(n²)（之前整库生成卡住就是这个原因）
  const env = hump(n, 1.2);
  const body = biquad(noise(23, n), 'bp', 3600, 0.9).map((v, i) => v * env[i] * 0.25);
  lib.fiber_rustle = [decor(Array.from(out).map((v, i) => v + body[i]).slice(0, nSamp(1.3)), 0.35, 0.32, 24), d, '纤维摩擦 / 纸浆纤维散开'];
}
{
  // paper_form —— 纸张成形（一声轻脆的纸响 + 低频落定）
  const d = 0.5;
  const n = nSamp(d);
  const thud = Array.from({length: n}, (_, i) => Math.sin(2 * Math.PI * 74 * (i / SR)) * Math.exp(-i / SR / 0.16) * 0.7);
  const snap = biquad(noise(25, n), 'hp', 1600, 0.7071).map((v, i) => v * Math.exp(-i / SR / 0.02) * 0.55);
  const tear = biquad(noise(26, n), 'bp', 3200, 1.1).map((v, i) => v * Math.exp(-i / SR / 0.06) * 0.22);
  lib.paper_form = [decor(thud.map((v, i) => v + snap[i] + tear[i]).slice(0, nSamp(0.7)), 0.3, 0.3, 27), d, '纸张成形 / 纤维压平'];
}
{
  // material_tap —— 原料标本落位（木质轻叩）
  const d = 0.16;
  const n = nSamp(d);
  const body = Array.from({length: n}, (_, i) => {
    const t = i / SR;
    return (Math.sin(2 * Math.PI * 210 * t) * 0.6 + Math.sin(2 * Math.PI * 96 * t) * 0.4) * Math.exp(-t / 0.028);
  });
  const click = biquad(noise(28, n), 'bp', 2600, 1.4).map((v, i) => v * Math.exp(-i / SR / 0.006) * 0.3);
  lib.material_tap = [body.map((v, i) => v + click[i]), d, '原料标本落位 / 木质轻叩'];
}
{
  // cloth_swish —— 布料入场 / 破布摊开
  const d = 0.55;
  const n = nSamp(d);
  const w = sweptBandpass(d, 260, 2400, 1100, 1.8, 29).map((v, i) => v * Math.sin((Math.PI * i) / (n - 1)) ** 1.4);
  lib.cloth_swish = [panSweep(w, -0.5, 0.5), d, '布料摊开 / 织物质感入场'];
}
{
  // fiber_converge —— 四原料汇聚成束（上升的收束声）
  const d = 1.0;
  const n = nSamp(d);
  const sweep = sweptBandpass(d, 420, 3200, 2200, 1.3, 30).map((v, i) => {
    const u = i / (n - 1);
    return v * u ** 1.6 * Math.min(1, (1 - u) / 0.05);
  });
  const tick = new Float64Array(n);
  const r = rng(31);
  for (let k = 0; k < 26; k++) {
    const at = Math.floor(r() * (n - 300));
    const len = 200;
    const b = biquad(noise(32 + k, len), 'bp', 3000 + r() * 2000, 2);
    for (let i = 0; i < len && at + i < n; i++) tick[at + i] += b[i] * 0.18 * Math.exp(-i / SR / 0.01);
  }
  lib.fiber_converge = [panSweep(Array.from(sweep).map((v, i) => v + tick[i]), -0.35, 0.35), d, '四原料汇聚成纤维束'];
}
{
  // splash_in —— 纤维团落水（低频 plop + 溅水 + 小气泡）
  const d = 0.9;
  const n = nSamp(d);
  const plop = Array.from({length: n}, (_, i) => {
    const t = i / SR;
    const f = 96 * Math.exp(-t / 0.14) + 42;
    return Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.2);
  });
  const splash = biquad(noise(33, n), 'hp', 900, 0.7071).map((v, i) => v * Math.exp(-i / SR / 0.11) * 0.7);
  const bub = Array.from({length: n}, (_, i) => {
    const t = i / SR;
    return Math.sin(2 * Math.PI * (520 - 180 * t) * t) * Math.exp(-t / 0.22) * 0.12 * Math.min(1, i / 120);
  });
  lib.splash_in = [decor(plop.map((v, i) => v + splash[i] + bub[i]).slice(0, nSamp(1.1)), 0.4, 0.35, 34), d, '纤维团入水 / 溅水'];
}
{
  // bubbles_loop —— 浸泡气泡床（可循环铺在浸泡段）
  const d = 2.8;
  const n = nSamp(d);
  const out = new Float64Array(n);
  const r = rng(35);
  for (let k = 0; k < 90; k++) {
    const at = Math.floor(r() * n);
    const f0 = 380 + r() * 900;
    const len = 200 + Math.floor(r() * 900);
    const amp = 0.12 + r() * 0.3;
    for (let i = 0; i < len && at + i < n; i++) {
      const t = i / SR;
      const env = Math.sin((Math.PI * i) / len);
      out[at + i] += Math.sin(2 * Math.PI * f0 * (1 + 0.02 * Math.sin(t * 30)) * t) * env * amp * 0.5;
    }
  }
  const bed = biquad(noise(36, n), 'lp', 1200, 0.7071).map((v) => v * 0.06);
  lib.bubbles_loop = [decor(Array.from(out).map((v, i) => v + bed[i]).slice(0, nSamp(3.0)), 0.5, 0.4, 37), d, '浸泡气泡床 / 循环'];
}
{
  // water_bed —— 水下低频环境（浸泡段底噪）
  const d = 4.0;
  const n = nSamp(d);
  const nz = biquad(biquad(noise(38, n), 'lp', 780, 0.7071), 'hp', 90, 0.7071);
  const out = nz.map((v, i) => {
    const u = i / (n - 1);
    const mod = 0.55 + 0.45 * Math.sin(2 * Math.PI * 0.6 * u + 1.2);
    return v * mod * Math.sin(Math.PI * u) ** 0.6;
  });
  lib.water_bed = [decor(out, 0.6, 0.3, 39), d, '水下环境底噪 / 浸泡段'];
}
{
  // fiber_settle —— 纤维沉底 / 浆垫成形（颗粒由密到疏）
  const d = 0.9;
  const n = nSamp(d);
  const out = new Float64Array(n);
  const r = rng(40);
  for (let k = 0; k < 34; k++) {
    const u = k / 34;
    const at = Math.floor(u ** 1.4 * (n - 400));
    const amp = (0.5 - u * 0.28) * (0.5 + r() * 0.7);
    const len = 300;
    const b = biquad(noise(41 + k, len), 'bp', 1400 + r() * 2600, 1.6);
    for (let i = 0; i < len && at + i < n; i++) out[at + i] += b[i] * amp * Math.exp(-i / SR / 0.012);
  }
  lib.fiber_settle = [decor(Array.from(out).slice(0, nSamp(1.1)), 0.4, 0.3, 42), d, '纤维沉底 / 浆垫成形'];
}

{
  // mortar_hit —— 木杵砸进石臼（低频闷响 + 石质硬壳 + 湿浆挤压）
  const d = 0.6;
  const n = nSamp(d);
  const thud = Array.from({length: n}, (_, i) => {
    const t = i / SR;
    const f = 68 * Math.exp(-t / 0.06) + 44;
    return Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.09);
  });
  const stone = biquad(noise(43, n), 'bp', 780, 0.9).map((v, i) => v * Math.exp(-i / SR / 0.018) * 0.45);
  const wet = biquad(noise(44, n), 'lp', 420, 0.7071).map((v, i) => v * Math.exp(-i / SR / 0.12) * 0.5);
  lib.mortar_hit = [decor(thud.map((v, i) => v + stone[i] + wet[i]).slice(0, nSamp(0.75)), 0.25, 0.28, 45), d, '石臼舂捣：木杵落点闷响'];
}
{
  // screen_dip —— 竹帘入水（下扫的水声 + 短促入水）
  const d = 0.75;
  const n = nSamp(d);
  const sweep = sweptBandpass(d, 2400, 900, 420, 1.8, 46).map((v, i) => {
    const u = i / (n - 1);
    return v * Math.sin(Math.PI * u ** 0.7) ** 1.5;
  });
  const plop = Array.from({length: n}, (_, i) => {
    const t = i / SR;
    const f = 120 * Math.exp(-t / 0.1) + 55;
    return Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.16) * 0.45 * Math.min(1, i / 240);
  });
  lib.screen_dip = [panSweep(Array.from(sweep).map((v, i) => v + plop[i]), 0.3, -0.15), d, '竹帘入水 / 荡帘'];
}
{
  // drip_water —— 起帘滴水（多颗水滴错落）
  const d = 1.7;
  const n = nSamp(d);
  const out = new Float64Array(n);
  const r = rng(47);
  for (let k = 0; k < 14; k++) {
    const at = Math.floor((0.05 + r() * 0.9) * (n - 400));
    const f0 = 700 + r() * 900;
    const len = Math.round(SR * (0.05 + r() * 0.09));
    const amp = 0.25 + r() * 0.45;
    for (let i = 0; i < len && at + i < n; i++) {
      const t = i / SR;
      out[at + i] += Math.sin(2 * Math.PI * (f0 + 120 * Math.sin(t * 60)) * t) * Math.exp(-t / 0.018) * amp;
    }
  }
  lib.drip_water = [decor(Array.from(out).slice(0, nSamp(1.9)), 0.3, 0.25, 48), d, '竹帘起帘后滴水'];
}
{
  // pulp_fold —— 纸膜在帘面上成形的轻微润湿（低频柔和起落，托住起帘动作）
  const d = 0.9;
  const n = nSamp(d);
  const nz = biquad(biquad(noise(49, n), 'lp', 620, 0.7071), 'hp', 70, 0.7071);
  const env = hump(n, 2.4);
  const out = nz.map((v, i) => v * env[i] * 0.5);
  lib.pulp_fold = [decor(out, 0.35, 0.3, 50), d, '纸膜成形的润湿声 / 起帘收束'];
}

// ---------- 输出 ----------
// --only a,b,c 只重算指定音效（新增音效不必等整库重算完），--skip-stats 跳过频谱统计（更快）
const argv = process.argv.slice(2);
const argVal = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const only = argVal('only')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;
const skipStats = argv.includes('--skip-stats');
fs.mkdirSync(OUT, {recursive: true});
const manifestPath = path.join(OUT, 'manifest.json');
const prevManifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const manifest = {...prevManifest};
const todo = Object.entries(lib).filter(([name]) => !only || only.includes(name));
if (!todo.length) {
  console.error(`--only 没有匹配到音效：${only.join(', ')}`);
  process.exit(2);
}
console.log('name'.padEnd(14), 'dur'.padStart(5), 'peak'.padStart(7), 'rms'.padStart(7), 'centroid'.padStart(9));
for (const [name, [ch, nominal, use]] of todo) {
  const out = finish(ch);
  writeWav(path.join(OUT, `${name}.wav`), out);
  const s = skipStats ? {peakDb: null, rmsDb: null, centroidHz: null} : stats(out);
  const dur = +(out[0].length / SR).toFixed(3);
  manifest[name] = {file: `sfx/${name}.wav`, duration: dur, ...s, use};
  console.log(
    name.padEnd(14),
    String(dur).padStart(5),
    String(s.peakDb).padStart(7),
    String(s.rmsDb).padStart(7),
    String(s.centroidHz).padStart(9),
  );
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${todo.length} 个音效已重算 → ${path.relative(ROOT, OUT)}（manifest 共 ${Object.keys(manifest).length} 条）`);

