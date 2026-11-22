// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './lw-host';
import {configureTheme} from './shared';
import {RC02 as __Component} from './RecordingScenes';
const __defaults: Record<string, unknown> = {"src": "fredtalk/media/lw-recording.mp4", "start": 1.0, "roi": {"x": 1292, "y": 132, "w": 557, "h": 530}, "clock": {"freezeFrom": 2.2, "freezeTo": 5.4}};

export const adapterMeta = {"id": "FT-RC02-471", "ftId": "RC02", "category": "录屏聚焦", "nativeFrames": 480, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "project-expand"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["src", "start", "roi", "clock"];
export const sampleProps = {"src": "fredtalk/media/lw-recording.mp4", "start": 1.0, "roi": {"x": 1292, "y": 132, "w": 557, "h": 530}, "clock": {"freezeFrom": 2.2, "freezeTo": 5.4}};

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
