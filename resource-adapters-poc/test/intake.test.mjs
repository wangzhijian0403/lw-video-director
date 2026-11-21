import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectAsset,prepareRender,settingsFor,hash} from '../intake.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
test('actual fixture intake requires matching reviewed rights for render preparation',()=>{assert.equal(inspectAsset(path.join(root,'assets/paper-precomp.json')).receipt.rights.status,'reference-only');assert.throws(()=>prepareRender(path.join(root,'assets/paper-precomp.json')));assert.equal(prepareRender(path.join(root,'assets/paper-precomp.json'),path.join(root,'rights-example.json')).receipt.rights.status,'declaration-validated');});
test('render settings reject typos, excessive dimensions/duration and invalid playback',()=>{assert.equal(settingsFor({width:540,height:960}).height,960);for(const c of [{width:541},{fps:25},{durationFrames:601},{width:1920,height:1920},{rate:Infinity},{rate:5},{loop:'yes'},{background:'red'},{unknown:true},{startFrame:120}])assert.throws(()=>settingsFor(c));});
test('missing rights, stale hash and escaped evidence block before creating render outputs',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lw-intake-test-')),asset=path.join(root,'assets/paper-precomp.json');
 const record=JSON.parse(fs.readFileSync(path.join(root,'rights-example.json'),'utf8'));record.evidence={path:'license.txt',sha256:hash(Buffer.from('test evidence'))};fs.writeFileSync(path.join(temp,'license.txt'),'test evidence');record.assetSha256='stale';const rights=path.join(temp,'rights.json');fs.writeFileSync(rights,JSON.stringify(record));
 const output=path.join(temp,'must-not-exist');const result=spawnSync(process.execPath,[path.join(root,'render-asset.mjs'),asset,rights,output],{encoding:'utf8'});assert.equal(result.status,2);assert.equal(fs.existsSync(output),false);assert.match(result.stderr,/hash mismatch/);
 record.assetSha256=hash(fs.readFileSync(asset));record.evidence.path='../outside.txt';fs.writeFileSync(rights,JSON.stringify(record));assert.throws(()=>prepareRender(asset,rights));
});
