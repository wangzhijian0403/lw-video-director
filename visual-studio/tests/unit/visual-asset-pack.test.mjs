import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyIcons, searchIcons, iconById, iconPack} from '../../scripts/icon-assets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('24 Tabler icons: pinned sources, MIT notice, exact git blob hashes and safe SVG', () => {
  const result = verifyIcons();
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(result.count, 24);
  assert.match(result.revision, /^[0-9a-f]{40}$/);
});

test('all icon IDs are unique and resolve to locally installed SVG files', () => {
  assert.equal(new Set(iconPack.entries.map((e) => e.id)).size, 24);
  for (const entry of iconPack.entries) {
    assert.deepEqual(iconById(entry.id), entry);
    assert.equal(fs.existsSync(path.join(ROOT, 'public', entry.publicPath)), true);
    assert.equal(entry.license, undefined); // license is correctly scoped at pack level
  }
  assert.equal(iconById('tabler:not-installed'), null);
  assert.equal(iconById('../../credentials'), null);
});

test('offline Chinese and English lookups return distinct intent-relevant assets', () => {
  assert.equal(searchIcons('配音')[0]?.id, 'tabler:microphone');
  assert.equal(searchIcons('layers')[0]?.id, 'tabler:layers-intersect');
  assert.equal(searchIcons('声音')[0]?.id, 'tabler:waveform');
  assert.equal(searchIcons('nonexistentjunk-8899').length, 0);
  assert.equal(searchIcons('', 100).length, 24);
});

test('ProjectVideo composes icon overlays without modifying FredTalk or original scenes', () => {
  const project = fs.readFileSync(path.join(ROOT, 'src/project/ProjectVideo.tsx'), 'utf8');
  const lint = fs.readFileSync(path.join(ROOT, 'scripts/lint-project.mjs'), 'utf8');
  const types = fs.readFileSync(path.join(ROOT, 'src/project/types.ts'), 'utf8');
  assert.match(project, /project\.iconOverlays/);
  assert.match(project, /<IconOverlay/);
  assert.match(project, /<FredTalkApprovedScene/);
  assert.match(lint, /未知或未授权的图标 ID/);
  assert.match(types, /iconOverlays\?: IconOverlayCue\[\]/);
});
