import React from 'react';
import {AbsoluteFill,Composition,registerRoot} from 'remotion';
import {StableLottie,paperTheme} from './adapters';
import data from '../assets/paper-precomp.json';
// Left: 30fps source in 60fps output at 2x with repeat. Right: 2x + end hold.
const Demo=()=> <AbsoluteFill style={{background:paperTheme.bg,flexDirection:'row',alignItems:'center',justifyContent:'space-around'}}>
  <StableLottie data={data} size={320} rate={2} loop/>
  <StableLottie data={data} size={320} rate={2} theme={{...paperTheme,accent:'#304d5b'}}/>
</AbsoluteFill>;
registerRoot(()=> <Composition id="ResourceCompatibility" component={Demo} width={800} height={400} fps={60} durationInFrames={240}/>);
