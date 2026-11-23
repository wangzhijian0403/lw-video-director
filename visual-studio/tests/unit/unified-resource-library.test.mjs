import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const json=(p)=>JSON.parse(read(p));

test('all existing original component IDs are preserved without duplication',()=>{
 const m=json('src/catalog/manifest.json');
 const ids=m.components.map(x=>x.id);
 assert.equal(ids.length,15);
 assert.equal(new Set(ids).size,15);
 for(const id of ['TYPE-001','TRANS-001','CAM-001','INFO-001','LIGHT-001','PAPER-001','MATERIAL-001','SOAK-001','POUND-001','SCOOP-001','PROCESS-001','DRY-001','TIMELINE-001','BAMBOO-001','ENDING-001']){
   assert.ok(ids.includes(id),id);
 }
});

test('workbench exposes only motion library and resource gallery',()=>{
 const app=read('src/app/main.tsx');
 const motion=read('src/app/MotionLibrary.tsx');
 const gallery=read('src/app/ResourceGallery.tsx');
 assert.match(app,/type Library = 'motion' \| 'assets'/);
 assert.match(app,/>动效库<\/button>/);
 assert.match(app,/>素材库<\/button>/);
 assert.match(app,/<MotionLibrary search=\{search\} providers=\{providers\}\/>/);
 assert.match(app,/<ResourceGallery search=\{search\}\/>/);
 assert.match(app,/<ProductionWizard /);
 assert.match(app,/<CopyAssetFinder /);
 assert.doesNotMatch(app,/>Originals<\/button>/);
 assert.doesNotMatch(app,/>References<\/button>/);
 assert.match(motion,/\/api\/render-reference/);
 assert.match(gallery,/type Kind='scenes'|'icons'|'characters'/);
 assert.doesNotMatch(gallery,/fredtalk-approved/);
 assert.doesNotMatch(gallery,/UserCharacterActor/);
 assert.match(gallery,/CHARACTER_IDS/);
 assert.equal(json('src/scene-packs/manifest.json').entries.length,3);
 assert.equal(json('src/resource-packs/tabler-outline.json').entries.length,24);
});

test('copy-to-asset reuses the existing asset engine instead of a parallel matcher',()=>{
 const server=read('server.mjs');
 const engine=fs.readFileSync(path.join(root,'../scripts/lw_assets.py'),'utf8');
 assert.match(server,/\/api\/assets\/from-copy/);
 assert.match(server,/asset_engine\.py/);
 assert.match(server,/\/api\/asset-engine\/status/);
 assert.match(engine,/def select_for_copy\(/);
 assert.match(engine,/select_for_shot\(index, effective, scope\)/);
 assert.match(engine,/reviewRequired':True/);
});

test('resource gallery does not expose stale original export button',()=>{
 const app=read('src/app/main.tsx');
 assert.doesNotMatch(app,/\/api\/render/);
 const motion=read('src/app/MotionLibrary.tsx');
 assert.match(motion,/本地渲染 MP4/);
});

test('character resources remain local-only placeholders',()=>{
 const gallery=read('src/app/ResourceGallery.tsx');
 assert.match(gallery,/角色文件由用户本地单独管理/);
 assert.match(gallery,/visual-studio\/public\/characters/);
 assert.match(gallery,/没有将角色原片上传到公开 GitHub/);
});
