// Deterministic render-input fingerprint. Pure module, used by render_batch.mjs and tests.
import crypto from 'node:crypto';

export const RENDER_INPUT_SCHEMA = 2;
export const DEFAULT_SPEED = 1;

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export function fingerprintParts(entry, {speed = DEFAULT_SPEED} = {}) {
  return {
    schema: RENDER_INPUT_SCHEMA,
    id: entry.id,
    adapterVersion: entry.adapterVersion ?? 'missing',
    adapterSha256: entry.adapterSha256 ?? 'missing',
    sourceSha256: entry.sourceSha256 ?? 'missing',
    sampleProps: entry.sampleProps ?? {},
    accent: entry.accent,
    background: entry.background,
    speed,
    fps: entry.fps,
    nativeFrames: entry.nativeFrames,
    sourceFrames: entry.sourceFrames,
  };
}

export function computeInputFingerprint(entry, options = {}) {
  return crypto.createHash('sha256').update(canonical(fingerprintParts(entry, options))).digest('hex');
}

export function shouldRender({status, mp4Exists, fingerprint, force = false}) {
  if (force) return {render: true, reason: 'forced'};
  if (!mp4Exists) return {render: true, reason: 'missing-mp4'};
  if (!status || status.render !== 'pass') return {render: true, reason: 'not-passed'};
  if (!status.inputFingerprint) return {render: true, reason: 'missing-fingerprint'};
  if (status.inputFingerprint !== fingerprint) return {render: true, reason: 'input-changed'};
  return {render: false, reason: 'unchanged'};
}
