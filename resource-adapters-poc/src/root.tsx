import React from 'react';
import {AbsoluteFill,Composition,registerRoot,useCurrentFrame} from 'remotion';
import {IconMotion,StableLottie,SfxEvents,paperTheme} from './adapters';
import data from '../assets/paper-sheet.json';
const Demo=()=>{const f=useCurrentFrame();return <AbsoluteFill style={{background:paperTheme.bg,color:paperTheme.fg,justifyContent:'center',alignItems:'center'}}>
  <svg width="960" height="540" style={{position:'absolute',opacity:.13}}><path d="M0 440 Q160 220 300 390 Q490 160 650 390 Q800 260 960 410 V540 H0Z" fill={paperTheme.muted}/></svg>
  <div style={{display:'flex',gap:120,alignItems:'center'}}><IconMotion name="droplets" startFrame={20}/><StableLottie data={data} startFrame={20}/><IconMotion name="paper" startFrame={90} motion="reveal"/></div>
  <div style={{position:'absolute',bottom:60,width:800,height:4,background:paperTheme.muted}}><div style={{height:4,width:800*f/179,background:paperTheme.accent}}/></div>
  <SfxEvents events={[{id:'pulp-contact',assetId:'pulp-splash',startFrame:30,durationFrames:30,volume:.65},{id:'sheet-lift',assetId:'paper-lift',startFrame:90,durationFrames:36,volume:.7}]}/>
  <div style={{position:'absolute',left:80,top:70,width:12,height:12,borderRadius:6,background:f>=30&&f<60?paperTheme.accent:paperTheme.muted}}/>
  <div style={{position:'absolute',right:80,top:70,width:12,height:12,borderRadius:6,background:f>=90&&f<126?paperTheme.accent:paperTheme.muted}}/>
  </AbsoluteFill>};
registerRoot(()=> <Composition id="ResourceAdaptersPOC" component={Demo} width={960} height={540} fps={30} durationInFrames={180}/>);
