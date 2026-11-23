// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {PickerSwitch as __Component} from './components/T09v-PickerSwitch';
import {pickerSwitchDefaults as __defaults} from './components/T09v-PickerSwitch';

export const adapterMeta = {"id": "FT-T09v-291", "ftId": "T09v", "category": "讲解段落", "nativeFrames": 120, "fps": 30, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["image", "imageSize", "crop", "cropRadius", "lift", "anchor", "anchorMaxW", "anchorIconsX", "current", "options", "pick", "note", "maskBoxes", "dark"];
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
