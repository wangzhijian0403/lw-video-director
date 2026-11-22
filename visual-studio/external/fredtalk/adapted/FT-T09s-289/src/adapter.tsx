// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {FredHost} from './kit/lw-host';
import {configureTheme} from './kit/theme';
import {ClickTrail as __Component} from './components/T09s-ClickTrail';
import {clickTrailDefaults as __defaults} from './components/T09s-ClickTrail';

export const adapterMeta = {"id": "FT-T09s-289", "ftId": "T09s", "category": "讲解段落", "nativeFrames": 180, "fps": 30, "upstreamRevision": "59b9e9957957dc9f3fd94ab78f95cec33c29e915", "strategy": "kit-overlay"};

export const defaultProps = __defaults as Record<string, unknown>;
export const editableKeys = ["image", "imageSize", "clicks", "zoom", "summary", "highlight", "maskBoxes"];
export const sampleProps = {"image": "fredtalk/media/lw-ui-screenshot.png", "imageSize": {"w": 3024, "h": 1712}, "clicks": [{"x": 150, "y": 400, "label": "素材", "labelGap": 180}, {"x": 610, "y": 260, "label": "搜索", "labelGap": 150}, {"x": 700, "y": 740, "label": "打开镜头", "labelGap": 170}, {"x": 2100, "y": 1090, "label": "生成", "labelGap": 150}, {"x": 1500, "y": 1390, "label": "看进度"}], "zoom": 1.35, "summary": "改三处参数，就换成自己的素材", "highlight": "自己的素材", "maskBoxes": [], "brand": false};

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
