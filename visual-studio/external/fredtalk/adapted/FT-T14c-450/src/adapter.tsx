// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {PriceLand as __Component} from './components/T14c-PriceLand';
import {priceLandDefaults as __defaults} from './components/T14c-PriceLand';

export const adapterMeta = {"id": "FT-T14c-450", "ftId": "T14c", "category": "数值与图表", "nativeFrames": 300, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["label", "value", "decimals", "prefix", "unit", "compareLabel", "compareValue", "deltaText", "background"];
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
