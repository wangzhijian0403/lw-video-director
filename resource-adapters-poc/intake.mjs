import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {validateLottie} from './src/timing.mjs';import {checkRights} from './src/rights.mjs';
export const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const readJson=(file,max)=>{if(fs.statSync(file).size>max)throw new Error('JSON exceeds profile size limit');const bytes=fs.readFileSync(file);return {bytes,data:JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''))};};
export function inspectAsset(file,rightsFile){
  const {bytes,data}=readJson(path.resolve(file),5*1024*1024);validateLottie(data);
  let record=null,evidenceHash=null,rightsSha256=null;
  if(rightsFile){
    const rightsPath=fs.realpathSync(rightsFile),base=path.dirname(rightsPath),loaded=readJson(rightsPath,1024*1024);record=loaded.data;rightsSha256=hash(loaded.bytes);
    if(!record.evidence?.path||path.isAbsolute(record.evidence.path))throw new Error('Evidence must be relative to rights file');
    const evidence=fs.realpathSync(path.resolve(base,record.evidence.path)),relative=path.relative(base,evidence);
    if(path.isAbsolute(relative)||relative==='..'||relative.startsWith(`..${path.sep}`))throw new Error('Evidence must stay within rights directory');
    if(fs.statSync(evidence).size>2*1024*1024)throw new Error('Evidence exceeds 2 MiB limit');
    evidenceHash=hash(fs.readFileSync(evidence));
  }
  const rights=checkRights(record,hash(bytes),evidenceHash);
  const receipt={profile:'lw-vector-precomp/2',assetSha256:hash(bytes),rightsSha256,evidenceSha256:evidenceHash,compatibility:'eligible-for-render-test',rights,renderStatus:'not-run',productionApproved:false,sourceFps:data.fr,inPoint:data.ip,outPoint:data.op,embeddedPrecomps:data.assets?.length??0};
  return {data,record,receipt};
}
export function settingsFor(config={}){
  const defaults={width:960,height:540,fps:30,durationFrames:120,rate:1,loop:false,startFrame:0,accent:'#4f9296',background:'#f5f3eb'};
  if(!config||Array.isArray(config)||typeof config!=='object')throw new Error('Settings must be an object');
  for(const key of Object.keys(config))if(!(key in defaults))throw new Error(`Unknown setting: ${key}`);
  const s={...defaults,...config};
  if(![s.width,s.height,s.fps,s.durationFrames,s.startFrame].every(Number.isInteger)||s.width<128||s.height<128||s.width%2||s.height%2||s.width>1920||s.height>1920||s.width*s.height>2500000||![30,60].includes(s.fps)||s.durationFrames<2||s.durationFrames>600||s.durationFrames/s.fps>10||s.startFrame<0||s.startFrame>=s.durationFrames)throw new Error('Settings exceed POC output limits');
  if(!Number.isFinite(s.rate)||s.rate<=0||s.rate>4||typeof s.loop!=='boolean'||!/^#[a-fA-F0-9]{6}$/.test(s.accent)||!/^#[a-fA-F0-9]{6}$/.test(s.background))throw new Error('Invalid rate, loop or colors');
  return s;
}
export function prepareRender(file,rightsFile,config){
  const inspected=inspectAsset(file,rightsFile);
  if(inspected.receipt.rights.status!=='declaration-validated')throw new Error('Render blocked: reviewed rights declaration required');
  return {...inspected,settings:settingsFor(config)};
}
