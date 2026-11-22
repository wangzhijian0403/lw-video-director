// LW 自有占位素材：用于验证“外部组件可以换成用户自己的合法素材”。
// 不是 FredTalk 原片，也不冒充上游素材；只是本仓库可再生成的测试输入。
import React, {useLayoutEffect} from 'react';
import {AbsoluteFill, Composition, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Easing} from 'remotion';

const FONT = 'LW Placeholder Sans';
let ready: Promise<void> | undefined;

function Font() {
  useLayoutEffect(() => {
    const h = delayRender('LW placeholder font');
    ready ??= (async () => {
      const face = new FontFace(FONT, `url(${staticFile('fredtalk/SmileySans-Oblique.ttf')})`);
      await face.load();
      (document.fonts as unknown as {add: (f: FontFace) => void}).add(face);
    })();
    ready.then(() => continueRender(h)).catch(() => continueRender(h));
  }, []);
  return null;
}

const Cursor = ({x, y, press}: {x: number; y: number; press: number}) => (
  <svg width={48} height={58} viewBox="0 0 52 64" style={{position: 'absolute', left: x, top: y, filter: 'drop-shadow(0 6px 8px #0004)'}}>
    <path d="M5 3 L5 50 L17 38 L27 60 L37 55 L27 34 L44 34 Z" fill="#171719" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
    {press > 0 && <circle cx={5} cy={3} r={8 + press * 22} fill="none" stroke="#8554E8" strokeWidth={3} opacity={1 - press} />}
  </svg>
);

export const RecordingPlaceholder = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const ease = Easing.bezier(0.4, 0, 0.2, 1);
  const move = interpolate(t, [0, 2.2, 4.4, 6.2], [0, 1, 0.35, 1], {easing: ease, extrapolateRight: 'clamp'});
  const targetX = interpolate(move, [0, 0.5, 1], [360, 980, 1390]);
  const targetY = interpolate(move, [0, 0.5, 1], [720, 420, 820]);
  const press = Math.max(0, Math.sin(t * 6)) * (t > 1.2 && t < 6 ? 1 : 0);
  const progress = interpolate(t, [2.4, 6.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#f4f2ec', fontFamily: FONT, color: '#19191c'}}>
      <Font />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 96, background: '#fff', borderBottom: '2px solid #e6e2d8', display: 'flex', alignItems: 'center', paddingLeft: 42, gap: 18}}>
        {['#f06a5e', '#f2c14e', '#69c47a'].map((c) => <span key={c} style={{width: 22, height: 22, borderRadius: 11, background: c}} />)}
        <span style={{marginLeft: 40, fontSize: 34, color: '#6c6c72'}}>LW 素材占位 · 用户自有录屏</span>
        <span style={{marginLeft: 'auto', marginRight: 48, fontSize: 28, color: '#8b8b93'}}>1920 × 1080 · 30fps</span>
      </div>
      <div style={{position: 'absolute', left: 0, top: 96, width: 330, height: 984, background: '#fff', borderRight: '2px solid #e6e2d8', padding: '46px 36px'}}>
        <div style={{fontSize: 46, fontWeight: 400, marginBottom: 54}}>LW Studio</div>
        {['项目', '素材', '时间轴', '导出'].map((s, i) => (
          <div key={s} style={{fontSize: 34, padding: '18px 22px', marginBottom: 12, borderRadius: 16, background: i === 1 ? '#efe9fb' : 'transparent', color: i === 1 ? '#6f3fd0' : '#4d4d55'}}>{s}</div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 412, top: 200, width: 1040, height: 300, background: '#fff', borderRadius: 34, boxShadow: '0 20px 40px #00000012', padding: 44}}>
        <div style={{fontSize: 54}}>把这段换成你自己的素材</div>
        <div style={{fontSize: 32, color: '#6c6c72', marginTop: 24}}>图片 / 录屏 / 成片都可以；参数面板里改路径即可。</div>
      </div>
      <div style={{position: 'absolute', left: 412, top: 560, width: 1040, height: 260, background: '#fff', borderRadius: 34, boxShadow: '0 20px 40px #00000012', display: 'flex', alignItems: 'center', paddingLeft: 52, gap: 36}}>
        <div style={{width: 760, height: 64, borderRadius: 32, background: '#f0eee8', display: 'flex', alignItems: 'center', paddingLeft: 34, fontSize: 32, color: '#8b8b93'}}>描述你想做的镜头…</div>
        <div style={{width: 220, height: 64, borderRadius: 32, background: '#8554E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32}}>生成</div>
      </div>
      <div style={{position: 'absolute', left: 412, top: 880, width: 1040, height: 96}}>
        <div style={{width: '100%', height: 12, borderRadius: 6, background: '#e3dfd5'}}>
          <div style={{width: `${progress * 100}%`, height: 12, borderRadius: 6, background: '#8554E8'}} />
        </div>
        <div style={{fontSize: 28, color: '#6c6c72', marginTop: 18}}>{progress < 1 ? `渲染中 ${Math.round(progress * 100)}%` : '渲染完成'}</div>
      </div>
      <Cursor x={targetX} y={targetY} press={press} />
      <div style={{position: 'absolute', right: 60, bottom: 34, fontSize: 26, color: '#8b8b93'}}>LW placeholder recording · not upstream footage</div>
    </AbsoluteFill>
  );
};

export const ResultPlaceholder = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const pan = interpolate(t, [0, 8], [1.06, 1.14]);
  return (
    <AbsoluteFill style={{background: '#111114'}}>
      <Font />
      <AbsoluteFill style={{transform: `scale(${pan})`}}>
        <Img src={staticFile('fredtalk/media/lw-work-01.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 1280, height: 720, objectFit: 'cover'}} />
        <Img src={staticFile('fredtalk/media/lw-work-02.jpg')} style={{position: 'absolute', left: 640, top: 360, width: 1280, height: 720, objectFit: 'cover', opacity: 0.82, boxShadow: '-30px 10px 50px #0006'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 96, top: 820, color: '#fff', fontSize: 64, fontFamily: FONT}}>成片占位 · 可替换</div>
    </AbsoluteFill>
  );
};

export const Placeholders = () => (
  <>
    <Composition id="LW-RECORDING" component={RecordingPlaceholder} width={1920} height={1080} fps={30} durationInFrames={240} />
    <Composition id="LW-RESULT" component={ResultPlaceholder} width={1920} height={1080} fps={30} durationInFrames={240} />
  </>
);
