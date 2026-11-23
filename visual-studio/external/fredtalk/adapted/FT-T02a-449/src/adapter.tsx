// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {AgendaThree as __Component} from './components/T02a-AgendaThree';
import {agendaThreeDefaults as __defaults} from './components/T02a-AgendaThree';

export const adapterMeta = {"id": "FT-T02a-449", "ftId": "T02a", "category": "内容交接", "nativeFrames": 300, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["items", "current", "mode"];
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
