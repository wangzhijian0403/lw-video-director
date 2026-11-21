// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {SliderCompare as __Component} from './components/T05a-SliderCompare';
import {sliderCompareDefaults as __defaults} from './components/T05a-SliderCompare';

export const adapterMeta = {"id": "FT-T05a-436", "ftId": "T05a", "category": "图片与作品", "nativeFrames": 300, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["before", "after", "beforeLabel", "afterLabel", "caption", "rest"];
export const sampleProps = {"before": "fredtalk/media/lw-work-01.jpg", "after": "fredtalk/media/lw-work-02.jpg", "beforeLabel": "上一版", "afterLabel": "这一版", "caption": "同一句提示词", "rest": 0.6};

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
