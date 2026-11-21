import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {prepareRender,hash} from './intake.mjs';
import {spawnSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));let output,run;
const save=()=>fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(run,null,2));
try{
  const args=process.argv.slice(2),check=args.includes('--check'),pos=args.filter(x=>x!=='--check');
  if(pos.length<3||pos.length>4)throw new Error('Usage: node render-asset.mjs asset.json rights.json new-output-dir [settings.json] [--check]');
  const config=pos[3]?JSON.parse(fs.readFileSync(pos[3],'utf8')):{};
  const prepared=prepareRender(pos[0],pos[1],config);
  // Snapshot both data and declaration before rendering. Later source edits cannot alter this run.
  const {data,record,receipt,settings}=prepared;
  if(check){console.log(JSON.stringify({...receipt,settings,renderStatus:'ready-for-test'},null,2));}
  else{
    output=path.resolve(pos[2]);if(fs.existsSync(output))throw new Error('Output already exists; use a new directory');
    fs.mkdirSync(path.dirname(output),{recursive:true});fs.mkdirSync(output);
    const rendererFiles=['render-asset.mjs','verify-asset.py','intake.mjs','src/asset-root.tsx','src/adapters.tsx','src/timing.mjs','src/rights.mjs','package-lock.json'];
    run={...receipt,renderStatus:'preparing',productionApproved:false,settings,attribution:record.attribution,source:{assetId:record.assetId,author:record.author,sourceUrl:record.sourceUrl,license:record.license,rightsScopes:record.rightsScopes,reviewedBy:record.reviewedBy},rendererHashes:Object.fromEntries(rendererFiles.map(f=>[f,hash(fs.readFileSync(path.join(root,f)))])),runtime:{node:process.version,platform:process.platform}};save();
    fs.writeFileSync(path.join(output,'input-snapshot.json'),JSON.stringify({data,settings},null,2));
    const {bundle}=await import('@remotion/bundler');const {selectComposition,renderMedia,renderStill}=await import('@remotion/renderer');
    const serveUrl=await bundle({entryPoint:path.join(root,'src/asset-root.tsx'),rootDir:root,publicDir:path.join(root,'public'),gitSource:null});
    const opts={browserExecutable:process.env.LW_BROWSER||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),chromiumOptions:{gl:'angle'}};
    const inputProps={data,settings},composition=await selectComposition({serveUrl,id:'AuditedLottieAsset',inputProps,...opts});
    await renderMedia({serveUrl,composition,inputProps,outputLocation:path.join(output,'asset.mp4'),codec:'h264',pixelFormat:'yuv420p',concurrency:2,crf:18,timeoutInMilliseconds:30000,...opts});
    const frames=[0,Math.floor(settings.durationFrames/3),Math.floor(2*settings.durationFrames/3),settings.durationFrames-1,Math.floor(settings.durationFrames/3)];
    for(const [i,frame] of frames.entries())await renderStill({serveUrl,composition,inputProps,frame,output:path.join(output,`frame-${i}-${frame}.png`),timeoutInMilliseconds:30000,...opts});
    run={...run,renderStatus:'rendered-unverified',frames,files:Object.fromEntries(fs.readdirSync(output).filter(f=>f!=='receipt.json').map(f=>[f,hash(fs.readFileSync(path.join(output,f)))])),visualReview:'pending',productionApproved:false};save();
    const verification=spawnSync(process.env.LW_PYTHON||'python',[path.join(root,'verify-asset.py'),output],{encoding:'utf8',windowsHide:true});
    if(verification.status!==0)throw new Error(`Rendered file retained; verification failed: ${verification.stderr||verification.stdout||verification.error?.message}`);
    console.log(JSON.stringify({output,renderStatus:'technical-pass',qa:'qa.json',productionApproved:false}));
  }
}catch(error){if(run&&output){run={...run,renderStatus:'failed',error:error.message,productionApproved:false};save();}console.error(JSON.stringify({status:'blocked',reason:error.message,productionApproved:false}));process.exitCode=2;}
