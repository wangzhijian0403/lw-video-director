import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {Params} from '../catalog/types';
import {catalog} from '../catalog/registry';
import {themes} from '../styles/themes';
import {Scene} from '../remotion/Scene';
import {FredTalkApprovedScene} from '../integrations/FredTalkApprovedScene';
import {FiberBridge} from '../components/papermaking/FiberBridge';
import {MistMountains} from '../components/backdrop/MistMountains';
import {buildTimeline, transitionPhase} from './timeline.mjs';
import type {ProjectFile, TimelineScene} from './types';
import {UserCharacterActor} from '../components/characters/UserCharacterActor';
import {IconOverlay} from '../components/resources/IconOverlay';

const resolveSrc = (src: string) =>
  /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src.replace(/^\/+/, ''));

/** 字幕条高度（渲染与画面缩放共用，保证画面底边正好压在条顶上）
 *  收薄：字号加大但行距收紧、底部安全区下压，条高从 0.226×H 降到 0.168×H，主画面多出约 60px。 */
const SUB_FONT_RATIO = 0.0455;
const SUB_BOTTOM_RATIO = 0.044;
const bandHeight = (timeline: ReturnType<typeof buildTimeline>) => {
  const fontSize = Math.round(timeline.height * SUB_FONT_RATIO);
  const bottom = Math.round(timeline.height * SUB_BOTTOM_RATIO);
  return Math.max(Math.round(fontSize * 1.28 * 2 + bottom + 8), Math.round(timeline.height * 0.152));
};

/** 单场景：负责自身的进出转场（淡入淡出 / 竖向滑入 / 缩放 / 擦除） */
const SceneTake: React.FC<{scene: TimelineScene; contentScale: number}> = ({scene, contentScale}) => {
  const frame = useCurrentFrame();
  const {inF, outF} = transitionPhase(scene);
  const kind = scene.transition?.type ?? 'cut';
  // 组件参数只有部分时，用 catalog 默认值补齐，避免组件拿到 undefined
  const params = {...(catalog.find((c) => c.id === scene.component)?.defaultProps ?? {}), ...scene.params} as Params;
  let opacity = 1;
  let transform = 'none';
  let clipPath = 'none';
  let maskImage: string | undefined;
  // 软边擦除：边界带 7% 羽化，两镜互补，不会像硬切那样断开，也不会像淡入淡出那样两段文字重影
  const wipeDir = (scene.transition as {direction?: string} | undefined)?.direction === 'down' ? 'to bottom' : 'to right';
  const wipeMask = (keepFarSide: boolean, p: number) => {
    const edge = Math.max(0, Math.min(100, p * 100));
    const feather = 7;
    return keepFarSide
      ? `linear-gradient(${wipeDir}, transparent 0%, transparent ${Math.max(0, edge - feather)}%, #000 ${Math.min(100, edge + feather)}%, #000 100%)`
      : `linear-gradient(${wipeDir}, #000 0%, #000 ${Math.max(0, edge - feather)}%, transparent ${Math.min(100, edge + feather)}%, transparent 100%)`;
  };

  if (inF > 0 && frame < inF) {
    const p = interpolate(frame, [0, inF], [0, 1], {extrapolateRight: 'clamp'});
    if (kind === 'fade') opacity = p;
    else if (kind === 'slide') {
      opacity = p;
      transform = `translateY(${(1 - p) * 8}%)`;
    } else if (kind === 'zoom') {
      opacity = p;
      transform = `scale(${1.08 - 0.08 * p})`;
    } else if (kind === 'wipe') {
      maskImage = wipeMask(false, p);
    }
  }
  if (outF > 0 && frame > scene.duration - outF) {
    const p = interpolate(frame, [scene.duration - outF, scene.duration], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    opacity = Math.min(opacity, kind === 'wipe' ? 1 : p);
    if (kind === 'wipe') maskImage = wipeMask(true, 1 - p);
    else if (kind === 'slide') transform = `translateY(${-(1 - p) * 8}%)`;
    else if (kind === 'zoom') transform = `scale(${1 + 0.08 * (1 - p)})`;
  }

  return (
    <AbsoluteFill style={{opacity, transform, clipPath, overflow: 'hidden', maskImage, WebkitMaskImage: maskImage}}>
      {/* 画面整体等比缩到字幕条之上：组件底部标题/坐标不会被字幕压住 */}
      <div style={{position: 'absolute', inset: 0, transform: `scale(${contentScale})`, transformOrigin: '50% 0%'}}>
        {scene.component.startsWith('FT-')
          ? <FredTalkApprovedScene id={scene.component}
              sceneProps={scene.params as unknown as Record<string, unknown>}
              accent={themes[scene.theme].accent}
              background={themes[scene.theme].bg}
              ink={themes[scene.theme].fg} />
          : <Scene componentId={scene.component} params={params} theme={scene.theme} />}
      </div>
    </AbsoluteFill>
  );
};

/** 纤维桥：接点前后把「正在动的纤维」交到下一镜，替代整段交叉溶解 */
const BridgeTake: React.FC<{kind: 'toMaterials' | 'intoVat' | 'intoMortar' | 'intoScoop'; dur: number; contentScale: number; accent: string; muted: string}> = ({
  kind,
  dur,
  contentScale,
  accent,
  muted,
}) => {
  const frame = useCurrentFrame();
  const progress = dur <= 1 ? 1 : frame / (dur - 1);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${contentScale})`, transformOrigin: '50% 0%'}}>
        <FiberBridge kind={kind} progress={progress} accent={accent} muted={muted} />
      </div>
    </AbsoluteFill>
  );
};

/** 口播轨：淡入淡出 + 帧级音量（Remotion 每帧重渲染，常量音量即可构成包络） */
const VoTrack: React.FC<{track: NonNullable<ReturnType<typeof buildTimeline>['audio']['vo']>}> = ({track}) => {
  const frame = useCurrentFrame();
  const {duration, volume, fadeIn, fadeOut} = track;
  let v = volume;
  if (fadeIn > 0 && frame < fadeIn * 30) v *= interpolate(frame, [0, fadeIn * 30], [0, 1], {extrapolateRight: 'clamp'});
  if (fadeOut > 0 && frame > duration - fadeOut * 30)
    v *= interpolate(frame, [duration - fadeOut * 30, duration], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <Audio src={resolveSrc(track.src)} volume={Math.max(0, v)} />;
};

const BgmTrack: React.FC<{
  track: {src: string; volume: number; fadeIn: number; fadeOut: number; duration?: number};
  from: number;
  totalFrames: number;
  duck: [number, number] | null;
}> = ({track, from, totalFrames, duck}) => {
  const frame = useCurrentFrame();
  const abs = from + frame;
  const end = track.duration ? from + track.duration : totalFrames;
  let v = track.volume;
  if (track.fadeIn > 0) v *= interpolate(abs, [from, from + track.fadeIn * 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (track.fadeOut > 0) v *= interpolate(abs, [end - track.fadeOut * 30, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (duck && abs >= duck[0] && abs <= duck[1]) v *= 0.35; // 口播期压低 BGM
  return <Audio src={resolveSrc(track.src)} volume={Math.max(0, v)} />;
};

/** 字幕层：底部安全区内，最多两行，进出行各 4 帧淡入淡出
 *  改版要点：不再铺厚蓝底条，改成向下加深的纸色渐变遮罩（透明→纸白），字用主题墨色 + 纸白描边光晕，
 *  既把字从画面上「拎」出来，又不把主画面切掉一块。 */
const SubtitleLayer: React.FC<{timeline: ReturnType<typeof buildTimeline>}> = ({timeline}) => {
  const style = themes[timeline.theme];
  const fontSize = Math.round(timeline.height * SUB_FONT_RATIO);
  const bottom = Math.round(timeline.height * SUB_BOTTOM_RATIO);
  const band = bandHeight(timeline);
  const paper = '#FAF8F0';
  const tint = timeline.theme === 'mist-blue-paper' ? '#E3DFD3' : themes[timeline.theme].bg;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          top: 'auto',
          height: band + Math.round(timeline.height * 0.05),
          background: `linear-gradient(180deg, ${tint}00 0%, ${tint}C4 42%, ${tint}EC 78%, ${tint}F7 100%)`,
        }}
      />
      {timeline.subtitles.cues.map((cue, i) => (
        <Sequence key={`${cue.from}-${i}`} from={cue.from} durationInFrames={cue.duration}>
          <CueView cue={cue} fontSize={fontSize} bottom={bottom} color={style.fg === '#193447' ? '#12202B' : style.fg} font={style.display} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const CueView: React.FC<{cue: {duration: number; lines: string[]}; fontSize: number; bottom: number; color: string; font: string}> = ({
  cue,
  fontSize,
  bottom,
  color,
  font,
}) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    interpolate(frame, [0, 4], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(frame, [Math.max(0, cue.duration - 4), cue.duration], [1, 0], {extrapolateLeft: 'clamp'}),
  );
  const rise = interpolate(frame, [0, 6], [12, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: bottom - Math.round(fontSize * 0.35), opacity}}>
      <div style={{transform: `translateY(${rise}px)`, textAlign: 'center', fontFamily: font, color}}>
        {cue.lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize,
              lineHeight: 1.28,
              fontWeight: 700,
              letterSpacing: 1,
              textShadow: '0 0 4px rgba(248,247,242,.45), 0 1px 2px rgba(20,32,43,.3)',
              padding: '0 .4em',
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const ProjectVideo: React.FC<{project: ProjectFile}> = ({project}) => {
  const timeline = useMemo(() => buildTimeline(project), [project]);
  const bridges = ((project as ProjectFile & {bridges?: {to: string; kind: 'toMaterials' | 'intoVat' | 'intoMortar' | 'intoScoop'; duration?: number}[]})
    .bridges ?? []).filter((b) => b && b.to);
  const style = themes[timeline.theme];
  const band = timeline.subtitles.enabled ? bandHeight(timeline) : 0;
  const contentScale = band > 0 ? (timeline.height - band) / timeline.height : 1;
  const bg = themes[timeline.theme].bg;
  const vo = timeline.audio.vo;
  // 是否已经把 vo/sfx/music 三轨预混成一条（预混后 Remotion 只播这一条，避免重复叠加）
  const premuxed = (timeline.meta as {audioPreMuxed?: boolean} | undefined)?.audioPreMuxed === true;
  // 口播覆盖区间：整条 vo 与分镜段落并起来，BGM 在这段里压低
  const spans: [number, number][] = [
    ...(vo ? [[vo.from, vo.from + vo.duration] as [number, number]] : []),
    ...timeline.audio.voSegments.map((s) => [s.from, s.from + s.duration] as [number, number]),
  ];
  const duck: [number, number] | null = spans.length
    ? [Math.min(...spans.map((s) => s[0])), Math.max(...spans.map((s) => s[1]))]
    : null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        // 全局纸格纹理：画面缩放后左右留白也延续同一套网格，不出现空洞
        backgroundImage: `linear-gradient(${themes[timeline.theme].fg}08 1px, transparent 1px), linear-gradient(90deg, ${themes[timeline.theme].fg}08 1px, transparent 1px)`,
        backgroundSize: `${themes[timeline.theme].grid}px ${themes[timeline.theme].grid}px`,
      }}
    >
      {timeline.meta?.backdrop === 'mist-mountains' ? (
        <div style={{position: 'absolute', inset: 0, opacity: 0.30}}>
          <MistMountains
            theme={timeline.theme}
            parallax={timeline.meta.backdropParallax ?? 1}
            haze={timeline.meta.backdropHaze ?? 1}
          />
        </div>
      ) : null}

      {timeline.scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration} name={scene.id}>
          <SceneTake scene={scene} contentScale={contentScale} />
        </Sequence>
      ))}

      {bridges.map((b, i) => {
        const to = timeline.scenes.find((s) => s.id === b.to);
        if (!to) return null;
        const dur = Math.max(2, Math.round((b.duration ?? 0.55) * timeline.fps));
        const cutFrame = to.from + Math.round(to.prevOverlap / 2);
        const start = Math.max(0, cutFrame - Math.round(dur / 2));
        return (
          <Sequence key={`bridge-${i}-${b.kind}`} from={start} durationInFrames={dur} name={`BRIDGE-${b.kind}`}>
            <BridgeTake kind={b.kind} dur={dur} contentScale={contentScale} accent={style.accent} muted={style.muted} />
          </Sequence>
        );
      })}

      {/* 已许可SVG图标，可叠在任意原生MG或FredTalk镜头上；时间/位置由工程控制。 */}
      {(project.iconOverlays ?? []).map((cue, i) => {
        const from = Math.max(0, Math.round(cue.at * timeline.fps));
        const requested = Math.round(cue.duration * timeline.fps);
        const frames = Math.min(requested, timeline.totalFrames - from);
        if (!Number.isFinite(from) || !Number.isFinite(frames) || frames < 1) return null;
        return (
          <Sequence key={'icon-' + i + '-' + cue.id} from={from} durationInFrames={frames} name={'ICON-' + cue.id}>
            <IconOverlay cue={cue} durationInFrames={frames} />
          </Sequence>
        );
      })}

      {timeline.characters.map((c, i) => (
        <Sequence
          key={`char-${i}-${c.characterId}-${c.action}`}
          from={c.from}
          durationInFrames={c.duration}
          name={`CHAR-${c.characterId}-${c.action}`}
        >
          <UserCharacterActor
            characterId={c.characterId}
            action={c.action}
            entry={c.entry}
            mediaPresent={c.mediaPresent}
            errors={c.errors}
            x={c.x}
            y={c.y}
            width={c.width}
            height={c.height}
            durationInFrames={c.duration}
            opacity={c.opacity}
          />
        </Sequence>
      ))}

      {timeline.subtitles.enabled ? <SubtitleLayer timeline={timeline} /> : null}

      {vo ? (
        <Sequence from={vo.from} durationInFrames={Math.max(1, vo.duration)} name="VO">
          <VoTrack track={vo} />
        </Sequence>
      ) : null}

      {timeline.audio.voSegments.filter(() => !premuxed).map((seg) => (
        <Sequence key={`vo-${seg.sceneId}`} from={seg.from} durationInFrames={Math.max(1, seg.duration)} name={`VO-${seg.sceneId}`}>
          <Audio src={resolveSrc(seg.src)} volume={seg.volume} />
        </Sequence>
      ))}

      {timeline.audio.bgm.filter(() => !premuxed).map((track, i) => (
        <Sequence key={`bgm-${i}`} from={Math.round((track.start ?? 0) * timeline.fps)} name={`BGM-${i + 1}`}>
          <BgmTrack
            track={track}
            from={Math.round((track.start ?? 0) * timeline.fps)}
            totalFrames={timeline.totalFrames}
            duck={duck}
          />
        </Sequence>
      ))}

      {timeline.audio.sfx
        .filter(() => !premuxed)
        .map((cue, i) => (
          <Sequence key={`sfx-${i}-${cue.name}`} from={cue.from} name={`SFX-${cue.name}`}>
            <Audio src={staticFile(cue.src)} volume={cue.volume} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};

