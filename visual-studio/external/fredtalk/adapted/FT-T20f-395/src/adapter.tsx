// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {ResultFirst as __Component} from './components/T20f-ResultFirst';
import {resultFirstDefaults as __defaults} from './components/T20f-ResultFirst';

export const adapterMeta = {"id": "FT-T20f-395", "ftId": "T20f", "category": "录屏与视频入场", "nativeFrames": 300, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["media", "start", "title", "highlight", "badge"];
export const sampleProps = {"media": "fredtalk/media/lw-recording.mp4", "start": 0.5, "title": "这是\n怎么做的？", "highlight": "怎么做", "badge": "成品"};

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
