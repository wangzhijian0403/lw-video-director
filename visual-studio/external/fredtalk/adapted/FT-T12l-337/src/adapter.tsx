// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {IrisBadge as __Component} from './components/T12l-IrisBadge';
import {irisBadgeDefaults as __defaults} from './components/T12l-IrisBadge';

export const adapterMeta = {"id": "FT-T12l-337", "ftId": "T12l", "category": "内容交接", "nativeFrames": 180, "fps": 60, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["index", "label", "title", "origin"];
export const sampleProps = {"index": 3, "label": "第 3 部分", "title": "内容交接：换成新的章节名", "origin": {"x": 960, "y": 540}};

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
