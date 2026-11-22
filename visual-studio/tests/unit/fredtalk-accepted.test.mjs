import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/integrations/fredtalk-approved.json'), 'utf8'));
const prior = new Set(['FT-T01d-451','FT-T02a-449','FT-T04g-393','FT-T04a-452','FT-T04e-365']);
test('only accepted 15 + independently verified T03e are exposed', () => {
  const ids = manifest.entries.map(x => x.id);
  assert.equal(ids.length, 16);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of prior) assert.equal(ids.includes(id), false, 'blocked ID: ' + id);
});
test('each approved source and provenance exists in repo', () => {
  for (const e of manifest.entries) {
    assert.ok(fs.existsSync(path.resolve(ROOT, '..', e.source)), e.id + ' source missing');
    const provenance = e.id === 'FT-T03e-414'
      ? path.join(ROOT, 'external/fredtalk/t03e/provenance.json')
      : path.join(ROOT, 'external/fredtalk/adapted',e.id,'provenance.json');
    assert.ok(fs.existsSync(provenance), e.id + ' provenance missing');
  }
});
test('renderer and project preflight both recognize vetted IDs', () => {
  const comp = fs.readFileSync(path.join(ROOT, 'src/project/ProjectVideo.tsx'), 'utf8');
  const preflight = fs.readFileSync(path.join(ROOT,'scripts/lint-project.mjs'),'utf8');
  assert.match(comp, /FredTalkApprovedScene/);
  assert.match(preflight, /fredtalk-approved\.json/);
});
