import React,{useMemo,useState} from 'react';
import {Player} from '@remotion/player';
import {IllustratedScene,type IllustrationId} from '../scene-packs/IllustratedScene';
import sceneManifest from '../scene-packs/manifest.json' with {type:'json'};
import iconManifest from '../resource-packs/tabler-outline.json' with {type:'json'};
import {CHARACTER_IDS,getCharacterEntry} from '../components/characters/characterRegistry.mjs';

type Kind='scenes'|'icons'|'characters';
type Item={id:string;title:string;desc:string;kind:Kind;status:string;tags:string[];path?:string};
const items:Item[]=[
 ...sceneManifest.entries.map(e=>({id:e.id,title:e.title,desc:e.description,kind:'scenes' as const,status:'原创·待成片视觉审核',tags:e.tags})),
 ...iconManifest.entries.map(e=>({id:e.id,title:e.label,desc:e.tags.join(' · '),kind:'icons' as const,status:'源文件及许可证已核验',tags:e.tags,path:e.publicPath})),
 ...CHARACTER_IDS.map(id=>{const act=id==='fish'?'wave':id==='codex'?'typing':'idle';const e=getCharacterEntry(id,act);return {id:id+'/'+act,title:id.toUpperCase(),desc:e?.note??'本地动作尚待验收',kind:'characters' as const,status:e?.status??'not-wired',tags:['角色','用户私有素材',id]};}),
];

const kindLabels:Record<Kind,string>={scenes:'原创分层场景',icons:'正版 SVG 图标',characters:'本地角色登记'};
const names:Kind[]=['scenes','icons','characters'];
const artId=(id:string)=>id as IllustrationId;

export function ResourceGallery({search}:{search:string}){
 const [kind,setKind]=useState<Kind>('scenes');
 const [selected,setSelected]=useState('ILLUS-STUDIO-01');
 const [color,setColor]=useState('#3B91A1');
 const [playing,setPlaying]=useState(true);
 const subset=useMemo(()=>items.filter(x=>x.kind===kind&&(search.trim()?([x.title,x.id,x.desc,...x.tags].join(' ').toLowerCase().includes(search.trim().toLowerCase())):true)),[kind,search]);
 const current=subset.find(x=>x.id===selected)??subset[0];
 const changeKind=(next:Kind)=>{setKind(next);setSelected(items.find(x=>x.kind===next)?.id??'');setPlaying(true)};
 const isScene=current?.kind==='scenes',isIcon=current?.kind==='icons';
 const iconURL=isIcon?'/'+current.path:'';
 return <section className="resource-gallery" aria-label="已接入资源图鉴">
   <div className="resource-top"><div><small>LW VIDEO DIRECTOR / INSTALLED LIBRARIES</small><h2>素材库</h2><p>插画场景、SVG 图标与本地角色登记。动效请到「动效库」栏目查看与渲染。</p></div><span>{items.length}条目录记录</span></div>
   <div className="resource-kind-tabs">{names.map(k=><button type="button" key={k} className={kind===k?'active':''} onClick={()=>changeKind(k)}>{kindLabels[k]} <small>{items.filter(x=>x.kind===k).length}</small></button>)}</div>
   <div className="resource-body">
    <div className="resource-list">{subset.map(e=><button type="button" key={e.id} className={current?.id===e.id?'selected':''} onClick={()=>setSelected(e.id)}><span>{e.id}</span><strong>{e.title}</strong><small>{e.status}</small></button>)}{!subset.length&&<p>当前分类没有符合搜索条件的条目。</p>}</div>
    <div className="resource-showcase">{current?<><div className="resource-summary"><div><small>{current.id}</small><h3>{current.title}</h3><p>{current.desc}</p></div><span>{current.status}</span></div>
      <div className="resource-video" key={current.id}>
       {isScene?<Player key={current.id} component={IllustratedScene} inputProps={{id:artId(current.id),title:'',subtitle:'',intensity:1}} compositionWidth={1920} compositionHeight={1080} fps={30} durationInFrames={210} style={{width:'100%',aspectRatio:'16/9'}} controls loop autoPlay={playing} initiallyMuted={true}/>:null}
       {isIcon?<div className="resource-icon-preview"><div style={{width:175,height:175,backgroundColor:color,maskImage:'url("'+iconURL+'")',WebkitMaskImage:'url("'+iconURL+'")',maskSize:'contain',WebkitMaskSize:'contain',maskRepeat:'no-repeat',WebkitMaskRepeat:'no-repeat',maskPosition:'center',WebkitMaskPosition:'center'}}/><div>{current.title}</div></div>:null}
       {current.kind==='characters'?<div className="resource-placeholder"><strong>角色文件由用户本地单独管理</strong><p>fish/wave、codex/typing 曾通过基础 E2E，但此视图不访问私有角色媒体。其余动作仍待验收。</p><p>本机素材目录：visual-studio/public/characters</p><p>没有将角色原片上传到公开 GitHub。</p></div>:null}
      </div>
      <div className="resource-options">
       {isIcon?<label>预览颜色 <input aria-label="图标颜色" type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>:null}
       {isScene?<button type="button" onClick={()=>setPlaying(v=>!v)}>{playing?'自动播放：开':'自动播放：关（重新选择资源生效）'}</button>:null}
       <button type="button" onClick={()=>navigator.clipboard?.writeText(current.id)}>复制资源 ID</button>
       {isIcon?<span>调用方式：project.json → iconOverlays</span>:isScene?<span>调用方式：project.json → scenes.component</span>:<span>角色需本机媒体及安全区间校验</span>}
      </div>
      <p className="resource-caveat">注意：这里显示的是当前 Git 提交里已登记的资源；你在其他本地分支、历史工程或私有目录里制作的效果，必须另行对照文件后才能在这里显示。工作台不是自动扫描整个 D 盘的素材管理器。</p>
     </>:<div className="resource-placeholder">请选择左侧资源。</div>}</div>
   </div>
 </section>;
}
