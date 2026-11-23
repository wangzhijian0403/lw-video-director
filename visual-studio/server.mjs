import http from 'node:http';
import {createServer} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import os from 'node:os';
import {renderVideo,renderReference,renderFredReference,renderFredComponent,renderMotionPromptComponent} from './render.mjs';
import {validateFredProps} from './src/references/fred-props.mjs';
import {validateProps} from './src/catalog/validation.mjs';
import {searchAssets,productionCandidates} from './src/catalog/search.mjs';
import {readJsonBody as body} from './scripts/request-body.mjs';
const port=Number(process.env.LW_PORT??4173);
const vite=await createServer({server:{middlewareMode:true,...(port===0?{hmr:false,ws:false}:{})},appType:'spa'}),jobs=new Map();let busy=false;
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data))};
// The copy-to-asset bridge calls the EXISTING Python asset engine CLI, not a parallel matcher.
const runFile=promisify(execFile);
const ENGINE_SCRIPT=path.resolve('..','scripts','asset_engine.py');
const WIZARD_PROJECT=path.resolve('projects','wizard-asset-engine-v2');
async function engine(args){const {stdout}=await runFile(process.env.LW_PYTHON||'python',[ENGINE_SCRIPT,'--project',WIZARD_PROJECT,...args],{cwd:path.resolve('..'),maxBuffer:32*1024*1024,timeout:180000});return JSON.parse(stdout)}
function startJob(res,work){if(busy){json(res,409,{error:'已有渲染任务，请稍后重试'});return}const id=randomUUID(),file=`${id}.mp4`,job={id,status:'queued',progress:0};fs.mkdirSync('exports',{recursive:true});jobs.set(id,job);busy=true;json(res,202,job);work(path.resolve('exports',file),({progress})=>Object.assign(job,{status:'rendering',progress})).then(()=>Object.assign(job,{status:'done',progress:1,url:`/exports/${file}`})).catch(e=>Object.assign(job,{status:'failed',error:e.message})).finally(()=>busy=false)}
const server=http.createServer(async(req,res)=>{const url=new URL(req.url||'/','http://127.0.0.1:4173');if(url.pathname.startsWith('/api/')){if(req.headers.origin&&![`http://127.0.0.1:${server.address().port}`,`http://localhost:${server.address().port}`].includes(req.headers.origin)){json(res,403,{error:'Local origin only'});return}try{
if(req.method==='GET'&&url.pathname==='/api/health'){json(res,200,{service:'LW Visual Studio',ready:true,port:server.address().port,workbench:'resources-gallery'});return}
if(req.method==='GET'&&url.pathname==='/api/catalog'){json(res,200,searchAssets(url.searchParams.get('q')||'',url.searchParams.get('library')||undefined,url.searchParams.get('provider')||undefined,url.searchParams.get('category')||undefined));return}
if(req.method==='GET'&&url.pathname==='/api/production-candidates'){json(res,200,productionCandidates());return}
if(req.method==='GET'&&url.pathname==='/api/asset-engine/status'){try{let assets=await engine(['list']);if(!assets.length){await engine(['seed']);assets=await engine(['list'])}json(res,200,{available:true,project:'projects/wizard-asset-engine-v2',indexedAssets:assets.length,libraries:[...new Set(assets.map(a=>a.library))].sort()})}catch(e){json(res,200,{available:false,project:'projects/wizard-asset-engine-v2',indexedAssets:0,error:e.message})}return}
if(req.method==='POST'&&url.pathname==='/api/assets/from-copy'){const data=await body(req);if(typeof data.copy!=='string'||!data.copy.trim()||data.copy.length>8000)throw new Error('文案不能为空且不得超过 8000 字');const scope=['private-test','project'].includes(data.scope)?data.scope:'project';const maxShots=Number.isInteger(data.maxShots)?Math.min(40,Math.max(1,data.maxShots)):12;if(Array.isArray(data.libraries)&&data.libraries.some(x=>!['user-local','lw-originals','lw-references'].includes(x)))throw new Error('invalid libraries filter');const libraries=Array.isArray(data.libraries)&&data.libraries.length?data.libraries:null;const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lw-copy-'));const file=path.join(temp,'copy.txt');try{fs.writeFileSync(file,data.copy,'utf8');const args=['from-copy','--file',file,'--scope',scope,'--max-shots',String(maxShots),'--seed'];if(libraries&&libraries.length)args.push('--libraries',libraries.join(','));json(res,200,await engine(args))}finally{fs.rmSync(temp,{recursive:true,force:true})}return}
if(req.method==='GET'&&url.pathname.startsWith('/api/jobs/')){const j=jobs.get(url.pathname.split('/').pop());json(res,j?200:404,j||{error:'Job not found'});return}
if(req.method==='POST'&&url.pathname==='/api/render'){const props=validateProps(await body(req));startJob(res,(file,progress)=>renderVideo(props,file,progress));return}
if(req.method==='POST'&&url.pathname==='/api/render-reference'){const data=await body(req);const candidate=searchAssets('','references').find(c=>c.id===data.id);if(candidate?.executable&&candidate.adapter==='motion-prompt-cell'){const sp=Number.isFinite(data.speed)?data.speed:1,sc=Number.isFinite(data.scale)?data.scale:1;if(sp<.5||sp>2||sc<.8||sc>1.2)throw new Error('外部参数超出适配范围');startJob(res,(file,progress)=>renderMotionPromptComponent({...data,speed:sp,scale:sc},file,progress));return}if(candidate?.executable&&candidate.adapter==='fred-step-chain'){const props=validateFredProps(data.props);startJob(res,(file,progress)=>renderFredReference(props,file,progress));return}if(candidate?.executable&&candidate.adapter==='fred-batch'){startJob(res,(file,progress)=>renderFredComponent(data,file,progress));return}const asset=searchAssets('','references').find(c=>c.id===data.id);if(!asset?.executable||asset.adapter!=='motion-pop-in')throw new Error('外部条目尚不具备已验证可执行状态');if(!Number.isFinite(data.speed)||data.speed<.5||data.speed>2||!Number.isFinite(data.scale)||data.scale<.8||data.scale>1.2)throw new Error('外部参数超出适配范围');startJob(res,(file,progress)=>renderReference({speed:data.speed,scale:data.scale},file,progress));return}
json(res,404,{error:'Not found'});}catch(e){json(res,400,{error:e.message})}return}
if(url.pathname.startsWith('/exports/')){const name=url.pathname.slice(9);if(!/^[a-f0-9-]+\.mp4$/.test(name)||!fs.existsSync(path.resolve('exports',name))){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':'video/mp4','Content-Disposition':`attachment; filename="LW-${name}"`});fs.createReadStream(path.resolve('exports',name)).pipe(res);return}vite.middlewares(req,res)
}).listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}`;console.log(`LW Visual Studio 0.2 ${url}`);process.send?.({type:'ready',url})});
let closing=false;async function shutdown(){if(closing)return;closing=true;server.close();server.closeAllConnections();await vite.close();console.log('LW server stopped');process.exit(0)}
process.on('message',m=>{if(m?.type==='shutdown')void shutdown()});process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
