import http from 'node:http';
import {createServer} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {renderVideo,renderReference} from './render.mjs';
import {validateProps} from './src/catalog/validation.mjs';
import {searchAssets,productionCandidates} from './src/catalog/search.mjs';
import {readJsonBody as body} from './scripts/request-body.mjs';
const port=Number(process.env.LW_PORT??4173);
const vite=await createServer({server:{middlewareMode:true,...(port===0?{hmr:false,ws:false}:{})},appType:'spa'}),jobs=new Map();let busy=false;
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data))};
function startJob(res,work){if(busy){json(res,409,{error:'已有渲染任务，请稍后重试'});return}const id=randomUUID(),file=`${id}.mp4`,job={id,status:'queued',progress:0};fs.mkdirSync('exports',{recursive:true});jobs.set(id,job);busy=true;json(res,202,job);work(path.resolve('exports',file),({progress})=>Object.assign(job,{status:'rendering',progress})).then(()=>Object.assign(job,{status:'done',progress:1,url:`/exports/${file}`})).catch(e=>Object.assign(job,{status:'failed',error:e.message})).finally(()=>busy=false)}
const server=http.createServer(async(req,res)=>{const url=new URL(req.url||'/','http://127.0.0.1:4173');if(url.pathname.startsWith('/api/')){if(req.headers.origin&&![`http://127.0.0.1:${server.address().port}`,`http://localhost:${server.address().port}`].includes(req.headers.origin)){json(res,403,{error:'Local origin only'});return}try{
if(req.method==='GET'&&url.pathname==='/api/health'){json(res,200,{service:'LW Visual Studio',ready:true,port:server.address().port,workbench:'resources-gallery'});return}
if(req.method==='GET'&&url.pathname==='/api/catalog'){json(res,200,searchAssets(url.searchParams.get('q')||'',url.searchParams.get('library')||undefined,url.searchParams.get('provider')||undefined,url.searchParams.get('category')||undefined));return}
if(req.method==='GET'&&url.pathname==='/api/production-candidates'){json(res,200,productionCandidates());return}
if(req.method==='GET'&&url.pathname.startsWith('/api/jobs/')){const j=jobs.get(url.pathname.split('/').pop());json(res,j?200:404,j||{error:'Job not found'});return}
if(req.method==='POST'&&url.pathname==='/api/render'){const props=validateProps(await body(req));startJob(res,(file,progress)=>renderVideo(props,file,progress));return}
if(req.method==='POST'&&url.pathname==='/api/render-reference'){const data=await body(req);const asset=searchAssets('','references').find(c=>c.id===data.id);if(!asset?.executable||asset.adapter!=='motion-pop-in')throw new Error('外部条目尚不具备已验证可执行状态');if(!Number.isFinite(data.speed)||data.speed<.5||data.speed>2||!Number.isFinite(data.scale)||data.scale<.8||data.scale>1.2)throw new Error('外部参数超出适配范围');startJob(res,(file,progress)=>renderReference({speed:data.speed,scale:data.scale},file,progress));return}
json(res,404,{error:'Not found'});}catch(e){json(res,400,{error:e.message})}return}
if(url.pathname.startsWith('/exports/')){const name=url.pathname.slice(9);if(!/^[a-f0-9-]+\.mp4$/.test(name)||!fs.existsSync(path.resolve('exports',name))){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':'video/mp4','Content-Disposition':`attachment; filename="LW-${name}"`});fs.createReadStream(path.resolve('exports',name)).pipe(res);return}vite.middlewares(req,res)
}).listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}`;console.log(`LW Visual Studio 0.2 ${url}`);process.send?.({type:'ready',url})});
let closing=false;async function shutdown(){if(closing)return;closing=true;server.close();server.closeAllConnections();await vite.close();console.log('LW server stopped');process.exit(0)}
process.on('message',m=>{if(m?.type==='shutdown')void shutdown()});process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
