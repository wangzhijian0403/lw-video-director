// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './lw-host';
import {configureTheme} from './shared';
import {OP03 as __Component} from './OpeningScenes';
const __defaults: Record<string, unknown> = {"src": "fredtalk/media/lw-recording.mp4"};

export const adapterMeta = {"id": "FT-OP03-467", "ftId": "OP03", "category": "录屏与视频入场", "nativeFrames": 240, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "project-expand"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["src"];
export const sampleProps = {"src": "fredtalk/media/lw-recording.mp4"};

export function Adapter(input: {props?: Record<string, unknown>; accent?: string; background?: string; accentDark?: string; ink?: string; speed?: number}) {
  const p = {...(__defaults as Record<string, unknown>), ...(input.props ?? {})};
  configureTheme({accent: input.accent, accentDark: input.accentDark, ink: input.ink});
  const host = {
    accent: input.accent ?? '#8554E8',
    accentDark: input.accentDark ?? '#D6BEFF',
    background: input.background ?? '#ffffff',
    ink: input.ink ?? '#19191c',
    speed: input.speed ?? 1,
    font: 'LW Fred SmileySans',
  };
  return <FredHost.Provider value={host}><__Component {...p} /></FredHost.Provider>;
}
