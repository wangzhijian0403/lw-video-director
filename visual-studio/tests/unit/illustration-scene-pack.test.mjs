import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {lintProject} from '../../scripts/lint-project.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'src/scene-packs/manifest.json'),'utf8'));
const project=JSON.parse(fs.readFileSync(path.join(ROOT,'projects/illustration-scene-smoke/project.json'),'utf8'));

test('three distinct user-accessible original illustrated scenes and rights',()=>{
 assert.equal(manifest.entries.length,3);
 assert.equal(new Set(manifest.entries.map(e=>e.id)).size,3);
 assert.equal(manifest.entries.every(e=>e.renderer==='remotion'),true);
 assert.equal(manifest.license.includes('LW original'),true);
});
test('illustration smoke passes full project timeline preflight with 3 scene IDs',()=>{
 const v=lintProject(project,{publicDir:path.join(ROOT,'public'),baseDir:path.join(ROOT,'projects/illustration-scene-smoke')});
 assert.deepEqual(v.errors,[]);
 assert.equal(v.timeline.scenes.length,3);
 assert.ok(v.timeline.totalSeconds>8);
 assert.equal(project.iconOverlays.length,3);
});
test('unregistered illustrated scene IDs cannot enter render projects',()=>{
 const invalid=structuredClone(project);
 invalid.scenes[0].component='ILLUS-NOT-REGISTERED';
 const result=lintProject(invalid,{publicDir:path.join(ROOT,'public')});
 assert.ok(result.errors.some(e=>e.includes('不在 catalog')));
});
test('Workbench lists actually installed scene, FredTalk, SVG and character registries',()=>{
 const app=fs.readFileSync(path.join(ROOT,'src/app/main.tsx'),'utf8');
 const gallery=fs.readFileSync(path.join(ROOT,'src/app/ResourceGallery.tsx'),'utf8');
 assert.match(app,/ResourceGallery/);
 assert.match(app,/素材图鉴/);
 for(const phrase of ['fredtalk-approved.json','tabler-outline.json','scene-packs/manifest.json','characterRegistry.mjs','<Player']) assert.ok(gallery.includes(phrase),phrase);
});
