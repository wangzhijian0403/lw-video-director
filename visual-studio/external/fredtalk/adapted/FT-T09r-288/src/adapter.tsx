// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {SpeedRamp as __Component} from './components/T09r-SpeedRamp';
import {speedRampDefaults as __defaults} from './components/T09r-SpeedRamp';

export const adapterMeta = {"id": "FT-T09r-288", "ftId": "T09r", "category": "讲解段落", "nativeFrames": 180, "fps": 30, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["video", "videoSize", "start", "end", "rampIn", "rampOut", "maxRate", "processFocus", "processZoom", "resultFocus", "resultZoom", "speedLabel", "brand"];
export const sampleProps = {};

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
