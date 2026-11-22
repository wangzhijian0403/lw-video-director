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

test('installed resources are integrated under Originals, no redundant top-level gallery',()=>{
 const app=read('src/app/main.tsx');
 const gallery=read('src/app/ResourceGallery.tsx');
 assert.match(app,/setResourceGroup/);
 assert.match(app,/installedResourceCounts/);
 assert.match(app,/resourceGroup!=='originals'/);
 assert.match(app,/kind=\{resourceGroup\}/);
 assert.doesNotMatch(app,/>素材图鉴<\/button>/);
 assert.match(gallery,/export function ResourceGallery\(\{search,kind\}/);
 assert.match(gallery,/CHARACTER_IDS/);
 assert.equal(json('src/scene-packs/manifest.json').entries.length,3);
 assert.equal(json('src/integrations/fredtalk-approved.json').entries.length,16);
 assert.equal(json('src/resource-packs/tabler-outline.json').entries.length,24);
});

test('resource gallery cannot export stale Originals selection',()=>{
 const app=read('src/app/main.tsx');
 assert.match(app,/disabled=\{library!=='originals'\|\|resourceGroup!=='originals'/);
});

test('character preview verifies local media and preserves verified safety gate',()=>{
 const gallery=read('src/app/ResourceGallery.tsx');
 assert.match(gallery,/UserCharacterActor/);
 assert.match(gallery,/method:'HEAD'/);
 assert.match(gallery,/entry.status!=='verified-basic'/);
 assert.match(gallery,/loop=\{false\}/);
 assert.match(gallery,/public\/characters/);
});
