// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {ResultFirstHook as __Component} from './components/T20a2-ResultFirstHook';
import {resultFirstHookDefaults as __defaults} from './components/T20a2-ResultFirstHook';

export const adapterMeta = {"id": "FT-T20a2-405", "ftId": "T20a2", "category": "图片与作品", "nativeFrames": 300, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["media", "heroIndex", "hook", "highlight"];
export const sampleProps = {"media": ["fredtalk/media/lw-work-01.jpg", "fredtalk/media/lw-work-02.jpg", "fredtalk/media/lw-work-03.jpg", "fredtalk/media/lw-work-04.jpg", "fredtalk/media/lw-work-05.jpg", "fredtalk/media/lw-work-06.jpg"], "heroIndex": 0, "hook": "这些图，一句话就能做出来？", "highlight": "一句话"};

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
