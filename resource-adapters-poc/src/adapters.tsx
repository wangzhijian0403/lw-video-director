import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Freeze, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Droplets, FileText} from 'lucide-react';
import {Lottie} from '@remotion/lottie';
import {localFrame,lottieFrame,applyTheme} from './timing.mjs';
export type ThemeTokens={bg:string;fg:string;accent:string;muted:string};
export const paperTheme:ThemeTokens={bg:'#f5f3eb',fg:'#304d5b',accent:'#4f9296',muted:'#9bb7b5'};
const icons={droplets:Droplets,paper:FileText};
export function IconMotion({name,theme=paperTheme,size=180,strokeWidth=1.4,startFrame=0,durationFrames=30,motion='draw'}:{name:keyof typeof icons;theme?:ThemeTokens;size?:number;strokeWidth?:number;startFrame?:number;durationFrames?:number;motion?:'draw'|'reveal'|'pulse'}){
  const f=useCurrentFrame();const t=localFrame(f,startFrame,durationFrames)/Math.max(1,durationFrames-1);
  const Icon=icons[name];if(!Icon)throw new Error('Icon not allowlisted');
  const p=1-Math.pow(1-t,3),scale=motion==='pulse'?1+0.06*Math.sin(t*Math.PI*2):0.85+0.15*p;
  return <div style={{opacity:f<startFrame?0:motion==='reveal'?p:1,transform:`scale(${scale})`}}><Icon size={size} color={theme.accent} strokeWidth={strokeWidth} style={motion==='draw'?{strokeDasharray:64,strokeDashoffset:64*(1-p)}:{}}/></div>;
}
export function StableLottie({data,theme=paperTheme,startFrame=0,rate=1,loop=false,size=260}:{data:Record<string,any>;theme?:ThemeTokens;startFrame?:number;rate?:number;loop?:boolean;size?:number}){
  const f=useCurrentFrame(),{fps}=useVideoConfig();
  const checked=useMemo(()=>applyTheme(data,theme.accent),[data,theme.accent]);
  // Freeze the official player at the calculated composition-frame position.
  // Remotion's Lottie player performs seek + render synchronization, no wall clock playback.
  const target=lottieFrame(Math.max(0,f-startFrame),fps,checked,rate,loop);
  const remotionFrame=target-checked.ip;
  return <div style={{width:size,height:size,opacity:f<startFrame?0:1,color:theme.accent}}><Freeze frame={remotionFrame}><Lottie animationData={checked} renderer="svg" loop={false} style={{width:size,height:size}}/></Freeze></div>;
}
export type SfxEvent={id:string;assetId:'pulp-splash'|'paper-lift';startFrame:number;durationFrames:number;volume:number};
export function SfxEvents({events}:{events:SfxEvent[]}){
  const files={'pulp-splash':'pulp-splash.wav','paper-lift':'paper-lift.wav'};
  return <>{events.map(e=>{if(!files[e.assetId]||!Number.isInteger(e.startFrame)||e.startFrame<0||!Number.isInteger(e.durationFrames)||e.durationFrames<=0||!(e.volume>=0&&e.volume<=1))throw new Error('Invalid SFX event');return <Sequence key={e.id} from={e.startFrame} durationInFrames={e.durationFrames}><Audio src={staticFile(files[e.assetId])} volume={e.volume}/></Sequence>;})}</>;
}
// Future interface only; no brand character assets or implementation in this POC.
export type CharacterCue={assetId:string;action:'idle'|'point'|'speak'|'react';startFrame:number;durationFrames:number;theme:ThemeTokens;lookDirection?:[number,number];lipSyncAssetId?:string};
