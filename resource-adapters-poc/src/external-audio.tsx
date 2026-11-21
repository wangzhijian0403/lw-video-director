import React from 'react';
import {AbsoluteFill,Audio,Composition,Sequence,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import {IconMotion,paperTheme} from './adapters';
// The WAV is acquired by scripts/fetch_reference_audio.py and kept out of GitHub.
const Demo=()=>{const f=useCurrentFrame();return <AbsoluteFill style={{background:paperTheme.bg,justifyContent:'center',alignItems:'center'}}>
  <IconMotion name="droplets" startFrame={20}/>
  <div style={{position:'absolute',bottom:80,width:18,height:18,borderRadius:9,background:f>=30&&f<104?paperTheme.accent:paperTheme.muted}}/>
  <Sequence from={30} durationInFrames={75}><Audio src={staticFile('external-water.wav')} volume={.6}/></Sequence>
</AbsoluteFill>};
registerRoot(()=><Composition id="ExternalAudioPOC" component={Demo} width={960} height={540} fps={30} durationInFrames={180}/>);
