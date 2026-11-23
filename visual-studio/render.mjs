import {bundle} from '@remotion/bundler';import {selectComposition,renderMedia,renderStill} from '@remotion/renderer';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {defaultsFor,validateProps} from './src/catalog/validation.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));let bundlePromise;
export const getBundle=()=>bundlePromise??=bundle({entryPoint:path.join(root,'src/remotion/root.tsx'),rootDir:root,outDir:path.join(root,'.cache/bundle'),publicDir:path.join(root,'public'),gitSource:null,onProgress:p=>{if(p===100)console.log('Remotion bundle ready')}});
export const browserOptions=()=>({browserExecutable:process.env.LW_BROWSER||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000});
export async function renderVideo(props,output,onProgress){props=validateProps(props);const serveUrl=await getBundle();console.log('Selecting',props.componentId);const options=browserOptions();const composition=await selectComposition({serveUrl,id:props.componentId,inputProps:props,...options});console.log('Rendering',props.componentId);await renderMedia({serveUrl,composition,inputProps:props,outputLocation:output,codec:'h264',pixelFormat:'yuv420p',concurrency:1,crf:20,...options,onProgress});return composition;}
export async function still(props,frame,output){const serveUrl=await getBundle();const options=browserOptions();const composition=await selectComposition({serveUrl,id:props.componentId,inputProps:props,...options});await renderStill({serveUrl,composition,inputProps:props,frame,output,...options});}
if(process.argv[1]===fileURLToPath(import.meta.url)){const id=process.argv[2]||'TYPE-001';const output=path.resolve(process.argv[3]||`exports/${id}-${Date.now()}.mp4`);if(fs.existsSync(output))throw new Error('Output exists');fs.mkdirSync(path.dirname(output),{recursive:true});const props={componentId:id,theme:'future',params:defaultsFor(id)};await renderVideo(props,output);console.log(output);}

export async function renderReference(props,output,onProgress){const serveUrl=await getBundle();const options=browserOptions();const composition=await selectComposition({serveUrl,id:'REF-MP001',inputProps:props,...options});await renderMedia({serveUrl,composition,inputProps:props,outputLocation:output,codec:'h264',pixelFormat:'yuv420p',concurrency:1,crf:20,...options,onProgress});}
// --- LW-FT-FULL-001 RENDER-FRED BEGIN ---
export async function renderFredReference(props,output,onProgress){const {validateFredProps}=await import('./src/references/fred-props.mjs');props=validateFredProps(props);const serveUrl=await getBundle(),options=browserOptions();const composition=await selectComposition({serveUrl,id:'REF-FT-T03E',inputProps:props,...options});await renderMedia({serveUrl,composition,inputProps:props,outputLocation:output,codec:'h264',pixelFormat:'yuv420p',concurrency:2,crf:18,...options,onProgress});return composition;}

export async function renderFredComponent(data,output,onProgress){
  const entries=JSON.parse(fs.readFileSync(path.join(root,'src/references/fredtalk-registry.data.json'),'utf8'));
  const entry=entries.find(e=>e.id===data?.id); if(!entry) throw new Error('not an adapted FredTalk component');
  const speed=Number(data.speed??1); if(!(speed>=.5&&speed<=2)) throw new Error('speed out of range .5-2');
  const hex=(v,f)=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v)?v:f;
  const props=data.props??entry.sampleProps;
  if(typeof props!=='object'||Array.isArray(props)) throw new Error('props must be an object');
  const inputProps={props,accent:hex(data.accent,entry.accent),background:hex(data.background,entry.background),speed};
  const serveUrl=await getBundle(),options=browserOptions();
  const composition=await selectComposition({serveUrl,id:`REF-${entry.id}`,inputProps,...options});
  await renderMedia({serveUrl,composition,inputProps,outputLocation:output,codec:'h264',pixelFormat:'yuv420p',concurrency:2,crf:18,...options,onProgress});
  return composition;
}
// --- LW-FT-FULL-001 RENDER-FRED END ---

// --- LW-MP-FULL-240 RENDER-MP BEGIN ---
export async function renderMotionPromptComponent(data,output,onProgress){
  const raw=String(data.id||'');
  const id=/^MP-?\d+$/.test(raw)?raw.replace(/^MP-?/,'').padStart(3,'0'):raw;
  const registry=JSON.parse(fs.readFileSync(path.join(root,'src/references/motion-prompt-registry.data.json'),'utf8'));
  const meta=registry[id];
  if(!meta) throw new Error('Motion Prompt 条目不存在: '+raw);
  const speed=Number.isFinite(data.speed)?data.speed:1;
  const scale=Number.isFinite(data.scale)?data.scale:1;
  if(speed<.5||speed>2||scale<.8||scale>1.2) throw new Error('Motion Prompt 参数超出适配范围');
  const props={id,speed,scale};
  const serveUrl=await getBundle(),options=browserOptions();
  const compId=id==='001'?'REF-MP001':`REF-MP-${id}`;
  const composition=await selectComposition({serveUrl,id:compId,inputProps:props,...options});
  await renderMedia({serveUrl,composition,inputProps:props,outputLocation:output,codec:'h264',pixelFormat:'yuv420p',concurrency:4,crf:20,...options,onProgress});
  return composition;
}
// --- LW-MP-FULL-240 RENDER-MP END ---
