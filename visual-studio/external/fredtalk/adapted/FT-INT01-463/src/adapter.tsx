import React from 'react';
import {FredHost} from './lw-host';
import {configureTheme} from './shared';
import {NewsBrushFocus as __Component} from './NewsFocus';
const __defaults: Record<string, unknown> = {src:'fredtalk/media/lw-ui-screenshot.png',sourceWidth:3024,sourceHeight:1712,regions:[{x:.12,y:.18,width:.3,height:.12},{x:.4,y:.5,width:.25,height:.1}],color:'#FFE949'};
export const adapterMeta = {"id":"FT-INT01-463","ftId":"INT01","category":"说明数据","nativeFrames":210,"fps":30,"upstreamRevision":"59b9e9957957dc9f3fd94ab78f95cec33c29e915","strategy":"standalone"};
export const defaultProps = __defaults;
export const editableKeys = ["src", "sourceWidth", "sourceHeight", "regions", "color", "zoom"];
export const sampleProps = __defaults;
export function Adapter(input: {props?: Record<string, unknown>; accent?: string; background?: string; speed?: number}) {
  const p = {...__defaults, ...(input.props ?? {})};
  configureTheme({});
  return <FredHost.Provider value={{accent:input.accent??'#8554E8',accentDark:'#D6BEFF',background:input.background??'#fff',ink:'#19191c',speed:input.speed??1,font:'sans-serif'}}><__Component {...(p as any)} /></FredHost.Provider>;
}
