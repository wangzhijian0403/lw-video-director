import React from 'react';
import {AbsoluteFill,Composition,registerRoot} from 'remotion';
import {StableLottie,paperTheme} from './adapters';
import fallback from '../assets/paper-sheet.json';
type Props={data:Record<string,any>;settings:{width:number;height:number;fps:number;durationFrames:number;rate:number;loop:boolean;startFrame:number;accent:string;background:string}};
const defaults:Props={data:fallback,settings:{width:960,height:540,fps:30,durationFrames:120,rate:1,loop:false,startFrame:0,accent:'#4f9296',background:'#f5f3eb'}};
const Asset=({data,settings}:Props)=><AbsoluteFill style={{background:settings.background,justifyContent:'center',alignItems:'center'}}><StableLottie data={data} size={Math.floor(Math.min(settings.width,settings.height)*.8)} rate={settings.rate} loop={settings.loop} startFrame={settings.startFrame} theme={{...paperTheme,accent:settings.accent}}/></AbsoluteFill>;
registerRoot(()=><Composition id="AuditedLottieAsset" component={Asset} defaultProps={defaults} width={960} height={540} fps={30} durationInFrames={120} calculateMetadata={({props})=>({width:props.settings.width,height:props.settings.height,fps:props.settings.fps,durationInFrames:props.settings.durationFrames})}/>);
