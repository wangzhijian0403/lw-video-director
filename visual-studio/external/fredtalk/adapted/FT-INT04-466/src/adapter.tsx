import React from 'react';
import {FredHost} from './lw-host';
import {configureTheme} from './shared';
import {WeChatConversation as __Component} from './WeChatConversation';
const __defaults: Record<string, unknown> = {contactName:'项目沟通',withSound:false};
export const adapterMeta = {"id":"FT-INT04-466","ftId":"INT04","category":"衔接内容","nativeFrames":330,"fps":30,"upstreamRevision":"59b9e9957957dc9f3fd94ab78f95cec33c29e915","strategy":"standalone"};
export const defaultProps = __defaults;
export const editableKeys = ["contactName", "messages", "withSound", "fontFamily"];
export const sampleProps = __defaults;
export function Adapter(input: {props?: Record<string, unknown>; accent?: string; background?: string; speed?: number}) {
  const p = {...__defaults, ...(input.props ?? {})};
  configureTheme({});
  return <FredHost.Provider value={{accent:input.accent??'#8554E8',accentDark:'#D6BEFF',background:input.background??'#fff',ink:'#19191c',speed:input.speed??1,font:'sans-serif'}}><__Component {...(p as any)} /></FredHost.Provider>;
}
