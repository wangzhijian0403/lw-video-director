import React,{useMemo,useState,useEffect} from 'react';
import {Player} from '@remotion/player';
import {IllustratedScene,type IllustrationId} from '../scene-packs/IllustratedScene';
import sceneManifest from '../scene-packs/manifest.json' with {type:'json'};
import iconManifest from '../resource-packs/tabler-outline.json' with {type:'json'};
import fredManifest from '../integrations/fredtalk-approved.json' with {type:'json'};
import {FredTalkApprovedScene} from '../integrations/FredTalkApprovedScene';
import {CHARACTER_IDS,getCharacterEntry} from '../components/characters/characterRegistry.mjs';
import {UserCharacterActor} from '../components/characters/UserCharacterActor';

export type InstalledKind='scenes'|'fredtalk'|'icons'|'characters';
type Kind=InstalledKind;
type Item={id:string;title:string;desc:string;kind:Kind;status:string;tags:string[];path?:string};
const items:Item[]=[
 ...sceneManifest.entries.map(e=>({id:e.id,title:e.title,desc:e.description,kind:'scenes' as const,status:'原创·待成片视觉审核',tags:e.tags})),
 ...fredManifest.entries.map(e=>({id:e.id,title:e.label,desc:e.stage==='visual-initial-approved'?'已完成视觉初审的 Remotion 适配组件':'此前已完成独立技术验收',kind:'fredtalk' as const,status:e.stage,tags:[e.id,'mg','fredtalk']})),
 ...iconManifest.entries.map(e=>({id:e.id,title:e.label,desc:e.tags.join(' · '),kind:'icons' as const,status:'源文件及许可证已核验',tags:e.tags,path:e.publicPath})),
 ...CHARACTER_IDS.map(id=>{const act=id==='fish'?'wave':id==='codex'?'typing':'idle';const e=getCharacterEntry(id,act);return {id:id+'/'+act,title:id.toUpperCase(),desc:e?.note??'本地动作尚待验收',kind:'characters' as const,status:e?.status??'not-wired',tags:['角色','用户私有素材',id]};}),
];

const kindLabels:Record<Kind,string>={scenes:'原创分层场景',fredtalk:'FredTalk 实装动效',icons:'正版 SVG 图标',characters:'本地角色登记'};
export const installedResourceCounts={scenes:sceneManifest.entries.length,fredtalk:fredManifest.entries.length,icons:iconManifest.entries.length,characters:CHARACTER_IDS.length} as const;
const FredPreview:React.FC<{id:string}>=({id})=><FredTalkApprovedScene id={id} sceneProps={{}} accent="#6194A6" background="#F3F0E8" ink="#1D3541"/>;
const artId=(id:string)=>id as IllustrationId;

/** Browser-only check: missing assets can appear as HTML in SPA fallback, so verify MIME too. */
const CharacterPreview:React.FC<{id:string}>=({id})=>{
 const [person,action]=id.split('/');
 const entry=getCharacterEntry(person,action);
 const [exists,setExists]=useState<boolean|null>(null);
 const [dark,setDark]=useState(false);
 useEffect(()=>{
   let cancelled=false;
   setExists(null);
   if(!entry || entry.status!=='verified-basic'){setExists(false);return;}
   fetch('/characters/'+encodeURIComponent(entry.file),{method:'HEAD',cache:'no-store'}).then(r=>{
     const type=r.headers.get('content-type')??'';
     if(!cancelled)setExists(r.ok&&(/video\/webm|video\/|application\/octet-stream/.test(type)));
   }).catch(()=>{if(!cancelled)setExists(false);});
   return ()=>{cancelled=true;};
 },[id]);
 if(!entry || entry.status!=='verified-basic')return <div className="resource-placeholder"><strong>该动作尚未通过基础验收</strong><p>{id} · wired-pending</p><p>不展示为可执行视频，也不自动读取或上传私有原片。</p></div>;
 if(exists===null)return <div className="resource-placeholder">正在检查本机角色文件：characters/{entry.file}</div>;
 if(!exists)return <div className="resource-placeholder"><strong>本机缺少可播放的私有媒体</strong><p>请检查 visual-studio/public/characters/{entry.file}</p><p>系统只检查当前本地工作台服务器，不自动下载、不上传、不覆盖角色文件。</p></div>;
 const sec=entry.safeRange?entry.safeRange.end-entry.safeRange.start:4.8;
 const duration=Math.max(1,Math.round(Math.min(4.8,sec)*30));
 const Comp:React.FC=()=> <div style={{width:'100%',height:'100%',background:dark?'#162333':'#DCE8E4'}}>
   <UserCharacterActor characterId={person} action={action} x={580} y={100} width={760} height={830} durationInFrames={duration} mediaPresent={true} enterFrames={3}/>
 </div>;
 return <>
  <Player key={id+(dark?'dark':'light')} component={Comp} inputProps={{}} compositionWidth={1920} compositionHeight={1080} fps={30} durationInFrames={duration} style={{width:'100%',aspectRatio:'16/9'}} controls loop={false} autoPlay initiallyMuted={true}/>
  <button type="button" className="resource-alpha-test" onClick={()=>setDark(v=>!v)}>透明度底色：{dark?'深色':'浅色'}（点击切换）</button>
  <div className="resource-alpha-note">仅安全片段 {duration/30} 秒，不循环；以原始 VP9 Alpha 解码后的合成画面为准。</div>
 </>;
};

export function ResourceGallery({search,kind}:{search:string;kind:InstalledKind}){
 const [selected,setSelected]=useState('ILLUS-STUDIO-01');
 const [color,setColor]=useState('#3B91A1');
 const [playing,setPlaying]=useState(true);
 const subset=useMemo(()=>items.filter(x=>x.kind===kind&&(search.trim()?([x.title,x.id,x.desc,...x.tags].join(' ').toLowerCase().includes(search.trim().toLowerCase())):true)),[kind,search]);
 const current=subset.find(x=>x.id===selected)??subset[0];
 const isScene=current?.kind==='scenes',isFred=current?.kind==='fredtalk',isIcon=current?.kind==='icons';
 const iconURL=isIcon?'/'+current.path:'';
 return <section className="resource-gallery" aria-label="已接入资源图鉴">
   <div className="resource-top"><div><small>LW VIDEO DIRECTOR / ORIGINALS / INSTALLED RESOURCES</small><h2>{kindLabels[kind]}</h2><p>在 Originals 左侧统一选择资源分类；右侧查看真实组件、来源与可用状态。未验收的条目不会被冒充为可发布资源。</p></div><span>{subset.length}条当前分类资源</span></div>
   <div className="resource-body">
    <div className="resource-list">{subset.map(e=><button type="button" key={e.id} className={current?.id===e.id?'selected':''} onClick={()=>setSelected(e.id)}><span>{e.id}</span><strong>{e.title}</strong><small>{e.status}</small></button>)}{!subset.length&&<p>当前分类没有符合搜索条件的条目。</p>}</div>
    <div className="resource-showcase">{current?<><div className="resource-summary"><div><small>{current.id}</small><h3>{current.title}</h3><p>{current.desc}</p></div><span>{current.status}</span></div>
      <div className="resource-video" key={current.id}>
       {isScene?<Player key={current.id} component={IllustratedScene} inputProps={{id:artId(current.id),title:'',subtitle:'',intensity:1}} compositionWidth={1920} compositionHeight={1080} fps={30} durationInFrames={210} style={{width:'100%',aspectRatio:'16/9'}} controls loop autoPlay={playing} initiallyMuted={true}/>:null}
       {isFred?<Player key={current.id} component={FredPreview} inputProps={{id:current.id}} compositionWidth={1920} compositionHeight={1080} fps={30} durationInFrames={180} style={{width:'100%',aspectRatio:'16/9'}} controls loop autoPlay={playing} initiallyMuted={true}/>:null}
       {isIcon?<div className="resource-icon-preview"><div style={{width:175,height:175,backgroundColor:color,maskImage:'url("'+iconURL+'")',WebkitMaskImage:'url("'+iconURL+'")',maskSize:'contain',WebkitMaskSize:'contain',maskRepeat:'no-repeat',WebkitMaskRepeat:'no-repeat',maskPosition:'center',WebkitMaskPosition:'center'}}/><div>{current.title}</div></div>:null}
       {current.kind==='characters'?<CharacterPreview key={current.id} id={current.id}/>:null}
      </div>
      <div className="resource-options">
       {isIcon?<label>预览颜色 <input aria-label="图标颜色" type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>:null}
       {(isScene||isFred)?<button type="button" onClick={()=>setPlaying(v=>!v)}>{playing?'自动播放：开':'自动播放：关（重新选择资源生效）'}</button>:null}
       <button type="button" onClick={()=>navigator.clipboard?.writeText(current.id)}>复制资源 ID</button>
       {isIcon?<span>调用方式：project.json → iconOverlays</span>:isScene?<span>调用方式：project.json → scenes.component</span>:isFred?<span>调用方式：project.json → scenes.component</span>:<span>角色需本机媒体及安全区间校验</span>}
      </div>
      <p className="resource-caveat">注意：这里显示的是当前 Git 提交里已登记的资源；你在其他本地分支、历史工程或私有目录里制作的效果，必须另行对照文件后才能在这里显示。工作台不是自动扫描整个 D 盘的素材管理器。</p>
     </>:<div className="resource-placeholder">请选择左侧资源。</div>}</div>
   </div>
 </section>;
}
