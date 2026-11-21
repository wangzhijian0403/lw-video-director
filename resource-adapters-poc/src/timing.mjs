export function localFrame(frame, start, duration) {
  if (![frame,start,duration].every(Number.isFinite) || duration <= 0) throw new Error('Invalid frame range');
  return Math.max(0, Math.min(duration - 1, frame - start));
}
export function lottieFrame(frame, fps, data, rate=1, loop=false) {
  if (![frame,fps,rate,data.fr,data.ip,data.op].every(Number.isFinite) || !(fps>0 && rate>0 && data.fr>0 && data.op>data.ip)) throw new Error('Invalid Lottie timing');
  const n=data.op-data.ip, t=Math.max(0,frame)*data.fr/fps*rate;
  return data.ip+(loop?t%n:Math.min(n-1,t));
}
// Self-contained vector profile. No remote images, fonts, expressions or plugin code.
export function validateLottie(data) {
  if (!data || ![data.fr,data.ip,data.op,data.w,data.h].every(Number.isFinite) || !(data.fr>0 && data.op>data.ip && data.w>0 && data.h>0 && data.w<=8192 && data.h<=8192)) throw new Error('Invalid Lottie header');
  if (data.fonts || data.chars || !Array.isArray(data.layers) || !data.layers.length) throw new Error('Fonts/text are outside POC profile');
  if(data.assets!==undefined&&!Array.isArray(data.assets))throw new Error('Invalid assets');
  const assets=new Map();
  for(const asset of data.assets??[]){
    if(!asset||typeof asset.id!=='string'||assets.has(asset.id)||!Array.isArray(asset.layers)||asset.p!==undefined||asset.u!==undefined)throw new Error('Only unique, embedded vector precomps supported');
    assets.set(asset.id,asset);
  }
  if(assets.size>64)throw new Error('Too many precomps');
  let nodes=0;
  const walk=(x,depth=0)=>{if(!x || typeof x!=='object')return;if(++nodes>50000||depth>64)throw new Error('JSON complexity limit');for(const [k,v] of Object.entries(x)){if(k==='x' && typeof v==='string')throw new Error('Expressions unsupported');if(['u','p'].includes(k)&&typeof v==='string')throw new Error('Resource paths unsupported');if(['ef','masksProperties','tm'].includes(k))throw new Error('Effects/masks/time-remap unsupported');walk(v,depth+1);}};
  walk(data);
  let layerCount=0;
  const shapeTypes=new Set(['gr','tr','rc','el','sh','fl','st','tm']);
  function shapes(list,depth=0){
    if(!Array.isArray(list)||depth>16)throw new Error('Invalid shape group');
    for(const s of list){if(!s||!shapeTypes.has(s.ty))throw new Error('Unsupported shape type');if(s.ty==='gr')shapes(s.it,depth+1);}
  }
  function layers(list){
    if(!Array.isArray(list)||!list.length)throw new Error('Empty/invalid layers');
    const ids=new Map();
    for(const l of list){
      if(++layerCount>512||!l||![0,3,4].includes(l.ty)||l.ddd===1||!Number.isInteger(l.ind)||ids.has(l.ind))throw new Error('Invalid/unsupported layer');
      if(![l.ip,l.op,l.st??0,l.sr??1].every(Number.isFinite)||l.op<=l.ip||l.sr===0)throw new Error('Invalid layer timing');
      ids.set(l.ind,l);
      if(l.ty===0&&!assets.has(l.refId))throw new Error('Missing precomp reference');
      if(l.ty===4)shapes(l.shapes);
    }
    for(const l of list){let cur=l,seen=new Set();while(cur.parent!==undefined){if(seen.has(cur.ind)||!ids.has(cur.parent))throw new Error('Invalid/cyclic parent');seen.add(cur.ind);cur=ids.get(cur.parent);}}
  }
  layers(data.layers);for(const a of assets.values())layers(a.layers);
  const active=new Set(),done=new Set();
  function visit(id,depth=0){if(active.has(id)||depth>16)throw new Error('Cyclic/deep precomp graph');if(done.has(id))return;active.add(id);for(const l of assets.get(id).layers)if(l.ty===0)visit(l.refId,depth+1);active.delete(id);done.add(id);}
  for(const id of assets.keys())visit(id);
  return data;
}
export function applyTheme(data,accent){
  validateLottie(data);
  if(!/^#[0-9a-fA-F]{6}$/.test(accent))throw new Error('Accent must be #RRGGBB');
  const copy=JSON.parse(JSON.stringify(data)),rgb=[1,3,5].map(i=>parseInt(accent.slice(i,i+2),16)/255);
  const shapes=list=>{for(const s of list??[]){if(s.nm==='theme-accent'&&s.ty==='fl')s.c={a:0,k:[...rgb,1]};if(s.ty==='gr')shapes(s.it);}};
  for(const container of [copy,...(copy.assets??[])])for(const l of container.layers)shapes(l.shapes);
  return copy;
}
