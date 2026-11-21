// Trusted registry adapter: imported descriptors select existing components, never executable paths.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../visual-studio/package.json',import.meta.url));
const {bundle}=require('@remotion/bundler');const {selectComposition,renderMedia}=require('@remotion/renderer');
const studioPath=fileURLToPath(new URL('../visual-studio/',import.meta.url));

import {defaultsFor,validateProps} from '../visual-studio/src/catalog/validation.mjs';
import catalog from '../visual-studio/external/catalog.json' with {type:'json'};
const [descriptor,output,seconds]=process.argv.slice(2),d=JSON.parse(fs.readFileSync(descriptor,'utf8'));
if(fs.existsSync(output))throw new Error('Refusing to overwrite MG render');
const duration=Number(seconds);if(!Number.isFinite(duration)||duration<1||duration>120)throw new Error('Invalid shot duration');
fs.mkdirSync(path.dirname(output),{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(studioPath,'src/remotion/root.tsx'),rootDir:studioPath,publicDir:path.join(studioPath,'public'),outDir:path.join(path.dirname(output),'mg-bundle-'+process.pid),gitSource:null,webpackOverride:config=>({...config,cache:false})});
const browser={browserExecutable:process.env.LW_BROWSER||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),chromiumOptions:{gl:'angle'}};
async function render(id,inputProps){const composition=await selectComposition({serveUrl,id,inputProps,...browser});await renderMedia({serveUrl,composition,inputProps,outputLocation:output,codec:'h264',pixelFormat:'yuv420p',concurrency:1,crf:20,...browser})}

if(d.library==='lw-originals'){
 const params={...defaultsFor(d.componentId),...d.props,entrance:.7,hold:duration-1.4,exit:.7};
 await render(d.componentId,validateProps({componentId:d.componentId,theme:d.theme||'swiss',params}));
}else if(d.library==='lw-references'&&d.componentId==='MP-001'&&catalog.some(x=>x.id===d.componentId&&x.executable&&x.renderStatus==='passed')){
 await render('REF-MP001',{speed:1,scale:1});
}else throw new Error('No registered verified adapter for imported descriptor');
