// --- LW-FT-FULL-001 ROOT-IMPORTS BEGIN ---
import {FredTalkAdapter} from '../references/FredTalkAdapter';
import {fredDefaults} from '../references/fred-props.mjs';
import {fredBatch} from '../references/fredtalk-registry.generated';
import {Placeholders} from './placeholders';
// --- LW-FT-FULL-001 ROOT-IMPORTS END ---
// --- LW-MP-FULL-240 ROOT-IMPORTS BEGIN ---
import {MotionPromptStage} from '../references/MotionPromptStage';
import {motionPromptBatch} from '../references/motion-prompt-registry.generated';
// --- LW-MP-FULL-240 ROOT-IMPORTS END ---

import {Composition, registerRoot} from 'remotion';
import {Scene} from './Scene';
import {catalog} from '../catalog/registry';
import {totalDuration} from '../components/shared';
import {MotionPromptAdapter} from '../references/MotionPromptAdapter';
import {ProjectVideo} from '../project/ProjectVideo';
import {buildTimeline} from '../project/timeline.mjs';
import type {ProjectFile} from '../project/types';

/** Studio 里直接打开 Project 组合时用的示例工程（渲染时会被 CLI 的 inputProps 覆盖） */
const defaultProject: ProjectFile = {
  meta: {title: 'LW Demo', width: 1920, height: 1080, fps: 30, theme: 'future'},
  scenes: [
    {
      component: 'TYPE-001',
      duration: 3,
      text: '把口播直接变成成片',
      params: {title: '把口播直接变成成片', subtitle: 'LW Visual Studio · 成片管线', entrance: 0.6, hold: 1.8, exit: 0.6},
    },
    {component: 'INFO-001', duration: 3, text: '时间轴、音轨、字幕一次对齐'},
  ],
};

function Root() {
  return (
    <>
      {/* // --- LW-FT-FULL-001 ROOT-COMPS BEGIN --- */}
      <Placeholders/>
      <Composition id="REF-FT-T03E" component={FredTalkAdapter} width={1280} height={720} fps={60} durationInFrames={420} defaultProps={fredDefaults} calculateMetadata={({props}) => ({durationInFrames: Math.ceil(420 / props.speed)})}/>
      {fredBatch.map((e) => (
        <Composition key={e.id} id={`REF-${e.id}`} component={e.adapter} width={1280} height={720} fps={e.fps} durationInFrames={e.nativeFrames} defaultProps={{props: e.sampleProps, accent: e.accent, background: e.background, speed: 1}} calculateMetadata={({props}) => ({durationInFrames: Math.ceil(e.nativeFrames / (((props as {speed?: number}).speed) ?? 1))})}/>
      ))}
      {/* // --- LW-FT-FULL-001 ROOT-COMPS END --- */}
{/* // --- LW-MP-FULL-240 ROOT-COMPS BEGIN --- */}
      {motionPromptBatch.map((e) => (
        <Composition key={'MP'+e.id} id={`REF-MP-${e.id}`} component={MotionPromptStage} width={1280} height={720} fps={30} durationInFrames={e.frames} defaultProps={{id: e.id, speed: 1, scale: 1}}/>
      ))}
      {/* // --- LW-MP-FULL-240 ROOT-COMPS END --- */}

      <Composition
        id="REF-MP001"
        component={MotionPromptAdapter}
        width={1280}
        height={720}
        fps={30}
        durationInFrames={141}
        defaultProps={{speed: 1, scale: 1}}
      />
      {catalog.map((c) => (
        <Composition
          key={c.id}
          id={c.id}
          component={Scene}
          width={1280}
          height={720}
          fps={30}
          durationInFrames={120}
          defaultProps={{componentId: c.id, params: c.defaultProps, theme: 'future' as const}}
          calculateMetadata={({props}) => ({durationInFrames: Math.round(totalDuration(props.params) * 30)})}
        />
      ))}
      <Composition
        id="Project"
        component={ProjectVideo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
        defaultProps={{project: defaultProject}}
        calculateMetadata={({props}) => {
          const timeline = buildTimeline(props.project);
          return {
            durationInFrames: timeline.totalFrames,
            fps: timeline.fps,
            width: timeline.width,
            height: timeline.height,
          };
        }}
      />
    </>
  );
}

registerRoot(Root);
