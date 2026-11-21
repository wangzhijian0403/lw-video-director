// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {StatTriplet as __Component} from './components/T14e-StatTriplet';
import {statTripletDefaults as __defaults} from './components/T14e-StatTriplet';

export const adapterMeta = {"id": "FT-T14e-378", "ftId": "T14e", "category": "数值与图表", "nativeFrames": 300, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["stats", "hero"];
export const sampleProps = {"stats": [{"label": "渲染耗时", "value": 42, "suffix": " 秒", "unit": "1080p / 30fps"}, {"label": "素材占用", "value": 128, "suffix": " MB", "unit": "单条组件"}, {"label": "复用组件", "value": 12, "suffix": " 条", "unit": "本轮验收"}], "hero": 2};

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
