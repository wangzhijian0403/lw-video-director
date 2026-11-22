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
