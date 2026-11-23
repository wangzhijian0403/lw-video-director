// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {PhaseCapsules as __Component} from './components/T12d-PhaseCapsules';
import {phaseCapsulesDefaults as __defaults} from './components/T12d-PhaseCapsules';

export const adapterMeta = {"id": "FT-T12d-407", "ftId": "T12d", "category": "内容交接", "nativeFrames": 360, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["items", "focus", "background"];
export const sampleProps = {"items": [{"text": "拍摄前", "highlight": "前"}, {"text": "拍摄中", "highlight": "中"}, {"text": "拍摄后", "highlight": "后"}], "focus": 1, "background": "fredtalk/media/lw-workspace-bg.jpg"};

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
