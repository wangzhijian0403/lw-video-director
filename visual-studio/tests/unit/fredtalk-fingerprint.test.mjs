import assert from 'node:assert/strict';
import test from 'node:test';
import {computeInputFingerprint, shouldRender} from '../../tools/fredtalk/fingerprint.mjs';

const entry = {
  id: 'FT-TEST-1',
  adapterVersion: 'fred-batch/1.1',
  adapterSha256: 'aaa',
  sourceSha256: 'bbb',
  sampleProps: {title: 'hello'},
  accent: '#8554E8',
  background: '#f5f3eb',
  fps: 60,
  nativeFrames: 300,
  sourceFrames: 300,
};

test('fingerprint is stable for identical inputs', () => {
  assert.equal(computeInputFingerprint(entry), computeInputFingerprint(structuredClone(entry)));
});

test('source, props, theme and adapter version all invalidate the fingerprint', () => {
  const base = computeInputFingerprint(entry);
  for (const patch of [
    {sourceSha256: 'ccc'},
    {sampleProps: {title: 'changed'}},
    {accent: '#c4553f'},
    {background: '#ffffff'},
    {adapterVersion: 'fred-batch/1.2'},
    {nativeFrames: 420},
  ]) {
    assert.notEqual(computeInputFingerprint({...entry, ...patch}), base, JSON.stringify(patch));
  }
});

test('resume only reuses a pass with matching fingerprint and present mp4', () => {
  const fp = computeInputFingerprint(entry);
  assert.equal(shouldRender({status: {render: 'pass', inputFingerprint: fp}, mp4Exists: true, fingerprint: fp}).render, false);
  assert.equal(shouldRender({status: {render: 'pass', inputFingerprint: 'old'}, mp4Exists: true, fingerprint: fp}).reason, 'input-changed');
  assert.equal(shouldRender({status: {render: 'pass', inputFingerprint: fp}, mp4Exists: false, fingerprint: fp}).reason, 'missing-mp4');
  assert.equal(shouldRender({status: {render: 'fail', inputFingerprint: fp}, mp4Exists: true, fingerprint: fp}).reason, 'not-passed');
  assert.equal(shouldRender({status: {render: 'pass', inputFingerprint: fp}, mp4Exists: true, fingerprint: fp, force: true}).reason, 'forced');
});

test('fail then retry is allowed without force', () => {
  const fp = computeInputFingerprint(entry);
  const first = shouldRender({status: undefined, mp4Exists: false, fingerprint: fp});
  assert.equal(first.render, true);
  const retry = shouldRender({status: {render: 'fail', inputFingerprint: fp}, mp4Exists: true, fingerprint: fp});
  assert.equal(retry.render, true);
  assert.equal(retry.reason, 'not-passed');
});
