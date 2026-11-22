// FredTalk 2.5 distribution: fred-recording-8-20261018
// T09s-ClickTrail：点击足迹：每次点击留下序号，最后连成一条路径回看
// 观众要看懂的变化：在真实界面上的几次点击 → 每次点下的位置留下黑色序号点；全部做完后镜头拉回全貌，
// 序号点按顺序连成一条细线，“就点了这几下”。
// 关系：同一张真实界面、同一支光标。和 T09a 区分：T09a 只演“下一步点哪里”、不留痕；本条强调累计的操作路径。
// 连线只在最后拉回全貌时出现一次：细线、#19191c 半透明、不用箭头。
// 返工 2026-10-17（按 NEW-GATE）：跟随点击时推近到 2.3 倍（界面字 ≥36px），远距离换点时先拉远再落下；
// 拉回全貌后截图整体压暗，只留序号点、连线和结论，序号点放大到 84px，全貌期间镜头缓慢推进。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { S, clamp, cueAt, mix, p, q, quintic, settle, textWidth } from '../kit/theme';
import { ClickRing, Cursor, Frame, Handoff, HandoffProps, Pill, Sfx, Surface, textBase, useT } from '../kit/ui';

export type TrailClick = { x: number; y: number; label?: string; labelGap?: number };   // 源图像素；labelGap=说明离点的距离（屏幕像素，避开被点的字）
export type ClickTrailProps = HandoffProps & {
  image: string;
  imageSize: { w: number; h: number };
  clicks: TrailClick[];
  zoom: number;            // 跟随点击时的推近倍数
  summary: string;         // 拉回全貌后的一句话
  highlight: string;       // summary 里染紫的词
  maskBoxes?: { x: number; y: number; w: number; h: number }[];   // 源图像素里要实心盖掉的区域（如“完全访问”）
  maskColor?: string;
  brand?: boolean;
  cues?: number[];         // [i]=第 i 次点击；[clicks.length]=拉回全貌
};

// 默认：Codex 桌面整窗（Fred 真实截图），开一个新任务一共就点这几下
export const clickTrailDefaults: ClickTrailProps = {
  image: 'media/codex-full.png',
  imageSize: { w: 3024, h: 1712 },
  clicks: [
    { x: 151, y: 222, label: '新聊天', labelGap: 190 },
    { x: 151, y: 658, label: '选项目', labelGap: 230 },
    { x: 1100, y: 1522, label: '写需求', labelGap: 200 },
    { x: 2362, y: 1628, label: '选模型' },
    { x: 2493, y: 1628, label: '发送' },
  ],
  zoom: 2.3,
  summary: '从开窗到发出去，只点了 5 下',
  highlight: '5 下',
  maskBoxes: [{ x: 1150, y: 1600, w: 175, h: 56 }],
  maskColor: '#fff',
  brand: false,
};

const FULL = { x: 60, y: 33.222106, w: 1800, h: 1013.555787 };
type Cam = { fx: number; fy: number; z: number };

export function ClickTrail(props: Partial<ClickTrailProps>) {
  const c = { ...clickTrailDefaults, ...props };
  const t = useT();
  const clicks = c.clicks.length ? c.clicks : clickTrailDefaults.clicks;
  const n = clicks.length;

  // 源图 → 世界坐标（cover 进主视频窗）
  const k = Math.max(FULL.w / c.imageSize.w, FULL.h / c.imageSize.h);
  const ox = FULL.x + (FULL.w - c.imageSize.w * k) / 2, oy = FULL.y + (FULL.h - c.imageSize.h * k) / 2;
  const pts = clicks.map((ck) => ({ x: ox + ck.x * k, y: oy + ck.y * k }));

  // 时间：点击间隔按数量收紧（2 下宽松、7 下紧凑），间隔不完全等距
  const span = Math.min(3.0, 0.75 * n);
  const at = clicks.map((_, i) => cueAt(c.cues, i, 0.75 + (n > 1 ? (span * i) / (n - 1) : 0) + (i % 2) * 0.06));
  const backAt = cueAt(c.cues, n, at[n - 1] + 0.45);
  const lineAt = backAt + 0.5;
  const sumAt = lineAt + 0.45;

  // 相机：跟着下一个点击点移动（每段 0.45s quintic），最后拉回全貌
  const camFor = (pt: { x: number; y: number }): Cam => {
    const z = c.zoom, hx = 960 / z, hy = 540 / z;
    return { z, fx: clamp(pt.x, FULL.x + hx, FULL.x + FULL.w - hx), fy: clamp(pt.y, FULL.y + hy, FULL.y + FULL.h - hy) };
  };
  const lerp = (a: Cam, b: Cam, v: number): Cam => ({ fx: mix(a.fx, b.fx, v), fy: mix(a.fy, b.fy, v), z: mix(a.z, b.z, v) });
  const home: Cam = { fx: 960, fy: 540, z: 1 };
  let cam = lerp(home, camFor(pts[0]), quintic(t, at[0] - 0.6, at[0] - 0.15));
  for (let i = 1; i < n; i++) {
    const v = quintic(t, at[i] - 0.5, at[i] - 0.1);
    cam = lerp(cam, camFor(pts[i]), v);
    // 远距离换点：途中先拉远一点再落下，观众看得出“从哪到哪”
    const dist = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    cam = { ...cam, z: cam.z * (1 - 0.32 * Math.sin(Math.PI * v) * Math.min(1, dist / 900)) };
  }
  cam = lerp(cam, home, quintic(t, backAt, backAt + 0.6));
  cam = { ...cam, z: cam.z * (1 + 0.05 * q(t, backAt + 0.6, backAt + 2.4)) };   // 全貌期间缓慢推进
  const toScreen = (pt: { x: number; y: number }) => ({ x: (pt.x - cam.fx) * cam.z + 960, y: (pt.y - cam.fy) * cam.z + 540 });
  const sp = pts.map(toScreen);

  // 光标：从右下进场，依次落到每个点
  let cx = 1500, cy = 1150;
  for (let i = 0; i < n; i++) {
    const g = p(t, i === 0 ? 0.25 : at[i - 1] + 0.08, at[i] - 0.04);
    cx = mix(cx, sp[i].x, g); cy = mix(cy, sp[i].y, g);
  }
  const press = Math.max(0, ...at.map((a) => clamp(1 - Math.abs(t - a - 0.05) / 0.1)));
  const cursorOut = p(t, backAt, backAt + 0.4);

  const enter = p(t, 0, 0.45);
  const line = p(t, lineAt, lineAt + 0.6);
  // 连线：依次经过各点（屏幕坐标），按长度画出
  const segs = sp.slice(1).map((b, i) => Math.hypot(b.x - sp[i].x, b.y - sp[i].y));
  const total = segs.reduce((a, b) => a + b, 0);
  const d = sp.map((pt, i) => `${i ? 'L' : 'M'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

  const sumIn = settle(t, sumAt, 0.6);
  const SS = Math.min(64, 1300 / Math.max(1, textWidth(c.summary, 1)));
  const SH = SS * 2, SW = textWidth(c.summary, SS) + SS * 1.8;
  const [before, after = ''] = c.summary.split(c.highlight);
  const hasHL = !!c.highlight && c.summary.includes(c.highlight);

  return <Frame brand={c.brand}>
    <Handoff enter={c.enter} exit={c.exit} exitAt={c.exitAt}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(960px,540px) scale(${cam.z}) translate(${-cam.fx}px,${-cam.fy}px)` }}>
        <div style={{
          position: 'absolute', left: FULL.x, top: FULL.y, width: FULL.w, height: FULL.h, borderRadius: S.radius, overflow: 'hidden',
          boxShadow: S.shadow, background: '#fff', opacity: enter, transform: `scale(${mix(0.965, 1, enter)})`,
        }}>
          <Img src={staticFile(c.image)} style={{ position: 'absolute', left: ox - FULL.x, top: oy - FULL.y, width: c.imageSize.w * k, height: c.imageSize.h * k }} />
          {(c.maskBoxes ?? []).map((m, i) => <div key={i} style={{ position: 'absolute', left: ox - FULL.x + m.x * k, top: oy - FULL.y + m.y * k, width: m.w * k, height: m.h * k, background: c.maskColor ?? '#fff' }} />)}
          {/* 拉回全貌后整张截图压暗，路径和序号点成为主体 */}
          <div style={{ position: 'absolute', inset: 0, background: S.ink, opacity: 0.26 * p(t, backAt + 0.1, backAt + 0.6) }} />
        </div>
      </div>

      {/* 回看路径：只在拉回全貌后出现一次 */}
      {line > 0 && n > 1 && <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, zIndex: 600 }}>
        <path d={d} fill="none" stroke={S.ink} strokeOpacity={0.62} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={total} strokeDashoffset={total * (1 - line)} />
      </svg>}

      {/* 序号点：点下那一刻落下，跟着画面走（屏幕坐标，大小不随推近变化） */}
      {sp.map((pt, i) => {
        const v = settle(t, at[i] + 0.04, 0.45);
        if (v <= 0) return null;
        const R = 38;
        return <div key={i} style={{
          position: 'absolute', left: pt.x - R, top: pt.y - R, width: R * 2, height: R * 2, borderRadius: R, background: S.ink, zIndex: 650,
          boxShadow: S.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: v, transform: `scale(${mix(0.4, 1, v)})`,
        }}>
          <span style={{ ...textBase(42, 900), color: '#fff', lineHeight: 1 }}>{i + 1}</span>
        </div>;
      })}
      {/* 当前这一下在做什么：只跟着当前点，下一次点击时退下 */}
      {clicks.map((ck, i) => {
        if (!ck.label) return null;
        const v = p(t, at[i] + 0.1, at[i] + 0.4) * (1 - p(t, i + 1 < n ? at[i + 1] - 0.15 : backAt, i + 1 < n ? at[i + 1] + 0.05 : backAt + 0.25));
        if (v <= 0) return null;
        const LS = 46, h = 84, w = textWidth(ck.label, LS) + 56;
        const pt = sp[i];
        const gap = ck.labelGap ?? 52;
        let x = pt.x + gap, y = pt.y - h / 2;
        if (x + w > 1880) x = pt.x - 52 - w;
        y = clamp(y, 30, 1050 - h);
        return <Surface key={i} box={{ x, y, w, h }} radius={18} style={{ clipPath: `inset(0 ${100 * (1 - v)}% 0 0 round 18px)`, zIndex: 660, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...textBase(LS, 900), color: S.ink }}>{ck.label}</span>
        </Surface>;
      })}

      {at.map((a, i) => <ClickRing key={i} x={sp[i].x} y={sp[i].y} t={t} at={a} />)}
      {cursorOut < 1 && <Cursor x={cx - 6} y={cy - 4} scale={1.1} press={press} style={{ opacity: p(t, 0.2, 0.45) * (1 - cursorOut) }} />}

      {sumIn > 0 && <Pill box={{ x: 960 - SW / 2, y: 150 - SH / 2 + (1 - sumIn) * 24, w: SW, h: SH }} style={{ opacity: sumIn, zIndex: 700 }}>
        <span style={{ ...textBase(SS, 400, S.display), color: '#fff' }}>
          {hasHL ? <>{before}<span style={{ color: S.accentDark }}>{c.highlight}</span>{after}</> : c.summary}
        </span>
      </Pill>}
    </Handoff>
    {at.slice(0, 5).map((a, i) => <Sfx key={i} name="click" at={a} />)}
    <Sfx name="slide" at={lineAt} />
    <Sfx name="pop" at={sumAt} />
  </Frame>;
}
