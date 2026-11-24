import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {getCharacterEntry, safeRangeFrames, CHARACTER_IDS, CHARACTER_WHITELIST} from '../../src/components/characters/characterRegistry.mjs';
import {buildTimeline} from '../../src/project/timeline.mjs';

const baseProject = (characters = []) => ({
  meta: {width: 1920, height: 1080, fps: 30, theme: 'future'},
  scenes: [{component: 'TYPE-001', duration: 5, params: {title: '测试'}}],
  characters,
});

test('registry: 两个已验收动作登记安全区间且禁止循环', () => {
  const wave = getCharacterEntry('fish', 'wave');
  const typing = getCharacterEntry('codex', 'typing');
  assert.equal(wave.status, 'verified-basic');
  assert.equal(typing.status, 'verified-basic');
  assert.deepEqual(wave.safeRange, {start: 0.2, end: 5.0});
  assert.equal(wave.loopAllowed, false);
  assert.equal(typing.loopAllowed, false);
  const range = safeRangeFrames(wave);
  assert.ok(range.startFrom > 0 && range.endAt < 240);
});

test('registry: 未知角色 / 未登记动作返回 null；15 条角色媒体全部已验收且文件落盘', () => {
  assert.equal(getCharacterEntry('nobody', 'idle'), null);
  assert.equal(getCharacterEntry('fish', 'dance'), null);
  let count = 0;
  for (const id of CHARACTER_IDS) {
    for (const action of CHARACTER_WHITELIST[id]) {
      const entry = getCharacterEntry(id, action);
      assert.ok(entry, `${id}/${action} 应有登记`);
      assert.equal(entry.status, 'verified-basic', `${id}/${action} 必须通过真渲验收`);
      assert.equal(entry.loopAllowed, false);
      const file = path.resolve('public/characters', entry.file);
      assert.ok(fs.existsSync(file), `媒体缺失：${entry.file}`);
      if (entry.kind === 'video') assert.deepEqual(entry.safeRange, {start: 0.2, end: 5.0});
      count += 1;
    }
  }
  assert.equal(count, 15);
});

test('timeline: 合法角色槽位解析条目并夹紧到整片范围', () => {
  const tl = buildTimeline(baseProject([
    {characterId: 'fish', action: 'wave', x: 110, y: 370, width: 420, height: 280, start: 0.2, duration: 4.6},
    {characterId: 'codex', action: 'typing', x: 1380, y: 350, width: 380, height: 380, start: 0.2, duration: 4.6},
  ]));
  assert.equal(tl.characters.length, 2);
  const fish = tl.characters[0];
  assert.equal(fish.entry.file, 'fish-wave.webm');
  assert.ok(fish.from >= 0 && fish.duration <= tl.totalFrames);
  assert.equal(fish.mediaPresent, null); // 未做文件系统校验
  assert.deepEqual(tl.characterErrors, []);
});

test('timeline: 未知角色与非法动作进入错误清单，槽位保留为占位', () => {
  const tl = buildTimeline(baseProject([
    {characterId: 'fish', action: 'dance', x: 10, y: 10, width: 200, height: 200},
    {characterId: 'ghost', action: 'idle', x: 10, y: 10, width: 200, height: 200},
  ]));
  assert.equal(tl.characters.length, 2);
  assert.ok(tl.characterErrors.some((e) => e.includes('不支持动作')));
  assert.ok(tl.characterErrors.some((e) => e.includes('未知角色 ID')));
  assert.equal(tl.characters[0].entry, null);
});

test('timeline: 媒体存在性表回灌 mediaPresent，缺失显式标 false', () => {
  const project = baseProject([
    {characterId: 'fish', action: 'wave', x: 110, y: 370, width: 420, height: 280, start: 0.2, duration: 4.6},
  ]);
  project._characterMedia = {'fish/wave': false};
  const tl = buildTimeline(project);
  assert.equal(tl.characters[0].mediaPresent, false);
});

test('timeline: 越界起始与非法位置产生错误，坐标夹紧到画布', () => {
  const tl = buildTimeline(baseProject([
    {characterId: 'codex', action: 'typing', x: -50, y: -20, width: 380, height: 380, start: 6, duration: 1},
  ]));
  assert.ok(tl.characterErrors.some((e) => e.includes('超出整片时长')));
  assert.ok(tl.characters[0].x >= 0 && tl.characters[0].y >= 0);
});
