// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {WaitSkip as __Component} from './components/T09n-WaitSkip';
import {waitSkipDefaults as __defaults} from './components/T09n-WaitSkip';

export const adapterMeta = {"id": "FT-T09n-374", "ftId": "T09n", "category": "录屏聚焦", "nativeFrames": 180, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["image", "imageSize", "maskBoxes", "maskColor", "label", "minutes", "prefix", "suffix"];
export const sampleProps = {"image": "fredtalk/media/lw-ui-screenshot.png", "imageSize": {"w": 3024, "h": 1712}, "maskBoxes": [], "maskColor": "#ffffff", "label": "安装依赖", "minutes": 8, "prefix": "约", "suffix": "分钟后"};

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
