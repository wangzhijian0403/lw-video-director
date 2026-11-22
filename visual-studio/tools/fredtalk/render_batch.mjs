// Batch renderer for adapted FredTalk components.
// Usage:
//   LW_BROWSER=/usr/local/bin/chromium node tools/fredtalk/render_batch.mjs [--only ID ...] [--force]
//   LW_BROWSER=/usr/local/bin/chromium node tools/fredtalk/render_batch.mjs --plan batch/runs/<run>/plan.json
//
// A pass is reused only when the full input fingerprint matches: adapter version,
// generated adapter bytes, upstream source hashes, props, accent, background,
// speed, fps and duration. Any input change forces a new MP4.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {computeInputFingerprint, fingerprintParts, shouldRender} from './fingerprint.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const vs = path.resolve(here, '../..');
const evidenceRoot = path.join(vs, 'external/fredtalk/batch/evidence');
const runsRoot = path.join(vs, 'external/fredtalk/batch/runs');
const registryPath = path.join(vs, 'src/references/fredtalk-registry.data.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const argv = process.argv.slice(2);

function argValue(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : null;
}

const planPath = argValue('--plan');
const plan = planPath ? JSON.parse(fs.readFileSync(path.resolve(vs, planPath), 'utf8')) : null;
const runId = plan?.runId ?? argValue('--run-id');
const only = argv.includes('--only')
  ? argv.slice(argv.indexOf('--only') + 1).filter((a) => !a.startsWith('--'))
  : plan?.components?.map((c) => c.lwId) ?? null;
const force = argv.includes('--force');
const browserExecutable = process.env.LW_BROWSER || '/usr/local/bin/chromium';
const speed = 1;

const runDir = plan || runId ? path.join(runsRoot, runId) : null;
const statusPath = runDir ? path.join(runDir, 'status.json') : path.join(vs, 'external/fredtalk/batch/status.json');
fs.mkdirSync(path.dirname(statusPath), {recursive: true});
const status = fs.existsSync(statusPath) ? JSON.parse(fs.readFileSync(statusPath, 'utf8')) : {};

function saveStatus(id, patch) {
  status[id] = {...(status[id] ?? {}), ...patch, updatedAt: new Date().toISOString()};
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');
}

function outputDir(id) {
  return runDir ? path.join(runDir, 'evidence', id) : path.join(evidenceRoot, id);
}

const bundleLocation = await bundle({entryPoint: path.join(vs, 'src/remotion/root.tsx')});
const summary = {runId: runId ?? null, startedAt: new Date().toISOString(), rendered: [], skipped: [], failed: []};

for (const entry of registry) {
  if (only && !only.includes(entry.id)) continue;
  const id = entry.id;
  const outDir = outputDir(id);
  fs.mkdirSync(outDir, {recursive: true});
  const mp4 = path.join(outDir, 'render.mp4');
  const fingerprint = computeInputFingerprint(entry, {speed});
  const decision = shouldRender({status: status[id], mp4Exists: fs.existsSync(mp4), fingerprint, force});
  if (!decision.render) {
    console.log(`skip ${id} (${decision.reason})`);
    summary.skipped.push({id, reason: decision.reason, fingerprint});
    saveStatus(id, {inputFingerprint: fingerprint, render: 'pass'});
    continue;
  }
  if (fs.existsSync(mp4)) {
    fs.renameSync(mp4, path.join(outDir, 'render.previous.mp4'));
  }
  const t0 = Date.now();
  saveStatus(id, {
    render: 'running',
    phase: 'select',
    inputFingerprint: fingerprint,
    fingerprintParts: fingerprintParts(entry, {speed}),
    rerenderReason: decision.reason,
    previousMp4: fs.existsSync(path.join(outDir, 'render.previous.mp4')) ? path.relative(vs, path.join(outDir, 'render.previous.mp4')) : null,
  });
  try {
    const inputProps = {props: entry.sampleProps, accent: entry.accent, background: entry.background, speed};
    const comp = await selectComposition({
      serveUrl: bundleLocation,
      id: `REF-${id}`,
      inputProps,
      browserExecutable,
    });
    saveStatus(id, {render: 'running', phase: 'render', durationInFrames: comp.durationInFrames, fps: comp.fps, width: comp.width, height: comp.height});
    await renderMedia({
      serveUrl: bundleLocation,
      composition: comp,
      codec: 'h264',
      outputLocation: mp4,
      inputProps,
      browserExecutable,
      muted: true,
      onProgress: ({progress}) => {
        if (Math.floor(progress * 100) % 10 === 0) process.stdout.write(`  ${id} ${Math.round(progress * 100)}%\r`);
      },
    });
    const frames = [0, Math.floor(comp.durationInFrames / 2), comp.durationInFrames - 1].concat(
      [Math.floor(comp.durationInFrames * 0.2), Math.floor(comp.durationInFrames * 0.8)],
    );
    const stills = [];
    for (const [i, frame] of frames.entries()) {
      const p = path.join(outDir, `frame-${String(i)}-f${frame}.png`);
      await renderStill({
        serveUrl: bundleLocation,
        composition: comp,
        frame,
        output: p,
        inputProps,
        browserExecutable,
      });
      stills.push(p);
    }
    const ms = Date.now() - t0;
    saveStatus(id, {
      render: 'pass',
      ms,
      mp4: path.relative(vs, mp4),
      stills: stills.map((s) => path.relative(vs, s)),
      inputFingerprint: fingerprint,
      error: null,
      staleReason: null,
    });
    summary.rendered.push({id, fingerprint, mp4: path.relative(vs, mp4), ms});
    console.log(`\npass ${id} ${comp.durationInFrames}f in ${ms}ms (${decision.reason}) -> ${path.relative(vs, mp4)}`);
  } catch (err) {
    const message = String(err && err.stack ? err.stack : err).slice(0, 4000);
    saveStatus(id, {render: 'fail', error: message, ms: Date.now() - t0, inputFingerprint: fingerprint, staleReason: null});
    summary.failed.push({id, fingerprint, error: message, rerenderReason: decision.reason});
    console.error(`\nFAIL ${id}: ${message.split('\n')[0]}`);
  }
}

summary.finishedAt = new Date().toISOString();
summary.render = summary.failed.length ? 'fail' : 'pass';
if (runDir) {
  fs.writeFileSync(path.join(runDir, 'render-summary.json'), JSON.stringify(summary, null, 2) + '\n');
}
console.log(`\nrender ${summary.render}: rendered=${summary.rendered.length} skipped=${summary.skipped.length} failed=${summary.failed.length}`);
if (summary.failed.length) process.exitCode = 1;
