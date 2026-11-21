import {renderFredReference,getBundle,browserOptions} from '../render.mjs';
import {fredDefaults} from '../src/references/fred-props.mjs';
import {renderStill,selectComposition} from '@remotion/renderer';
import fs from 'node:fs';import path from 'node:path';
const dir=path.resolve(process.argv[2]);fs.mkdirSync(dir,{recursive:true});
const variants=[{name:'papermaking',props:fredDefaults},{name:'three-steps',props:{...fredDefaults,steps:['准备材料','形成纸页','完成晾晒'],title:'三步验证：内容可替换',highlight:1,speed:2,accent:'#f0bd84'}}];
const reports=[];
for(const variant of variants){
 const video=path.join(dir,variant.name+'.mp4');if(fs.existsSync(video))throw new Error('Output exists');
 const comp=await renderFredReference(variant.props,video),serveUrl=await getBundle();
 for(const [i,frame] of [Math.floor(comp.durationInFrames*.25),Math.floor(comp.durationInFrames*.7),comp.durationInFrames-1,Math.floor(comp.durationInFrames*.7)].entries())await renderStill({serveUrl,composition:comp,inputProps:variant.props,frame,output:path.join(dir,`${variant.name}-${i}-${frame}.png`),...browserOptions()});
 reports.push({name:variant.name,props:variant.props,width:comp.width,height:comp.height,fps:comp.fps,frames:comp.durationInFrames});
}
fs.writeFileSync(path.join(dir,'render.json'),JSON.stringify(reports,null,2));console.log(dir);
