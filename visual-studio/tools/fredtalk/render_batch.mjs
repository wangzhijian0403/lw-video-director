// Batch renderer for adapted FredTalk components.
// Usage: LW_BROWSER=/usr/local/bin/chromium node tools/fredtalk/render_batch.mjs [--only ID ...] [--force]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const vs = path.resolve(here, '../..');
const evidence = path.join(vs, 'external/fredtalk/batch/evidence');
const registry = JSON.parse(fs.readFileSync(path.join(vs, 'src/references/fredtalk-registry.data.json'), 'utf8'));
const statusPath = path.join(vs, 'external/fredtalk/batch/status.json');
const status = fs.existsSync(statusPath) ? JSON.parse(fs.readFileSync(statusPath, 'utf8')) : {};
const argv = process.argv.slice(2);
const only = argv.includes('--only') ? argv.slice(argv.indexOf('--only') + 1).filter((a) => !a.startsWith('--')) : null;
const force = argv.includes('--force');
const browserExecutable = process.env.LW_BROWSER || '/usr/local/bin/chromium';

const bundleLocation = await bundle({entryPoint: path.join(vs, 'src/remotion/root.tsx')});

function saveStatus(id, patch) {
  status[id] = {...(status[id] ?? {}), ...patch, updatedAt: new Date().toISOString()};
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');
}

for (const entry of registry) {
  if (only && !only.includes(entry.id)) continue;
  const id = entry.id;
  const outDir = path.join(evidence, id);
  fs.mkdirSync(outDir, {recursive: true});
  const mp4 = path.join(outDir, 'render.mp4');
  if (!force && status[id]?.render === 'pass' && fs.existsSync(mp4)) {
    console.log(`skip ${id} (already passed)`);
    continue;
  }
  const t0 = Date.now();
  saveStatus(id, {render: 'running', phase: 'select'});
  try {
    const comp = await selectComposition({
      serveUrl: bundleLocation,
      id: `REF-${id}`,
      inputProps: {props: entry.sampleProps, accent: entry.accent, background: entry.background, speed: 1},
      browserExecutable,
    });
    saveStatus(id, {render: 'running', phase: 'render', durationInFrames: comp.durationInFrames, fps: comp.fps, width: comp.width, height: comp.height});
    await renderMedia({
      serveUrl: bundleLocation,
      composition: comp,
      codec: 'h264',
      outputLocation: mp4,
      inputProps: {props: entry.sampleProps, accent: entry.accent, background: entry.background, speed: 1},
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
        inputProps: {props: entry.sampleProps, accent: entry.accent, background: entry.background, speed: 1},
        browserExecutable,
      });
      stills.push(p);
    }
    const ms = Date.now() - t0;
    saveStatus(id, {render: 'pass', ms, mp4: path.relative(vs, mp4), stills: stills.map((s) => path.relative(vs, s)), error: null});
    console.log(`\npass ${id} ${comp.durationInFrames}f in ${ms}ms -> ${path.relative(vs, mp4)}`);
  } catch (err) {
    const message = String(err && err.stack ? err.stack : err).slice(0, 4000);
    saveStatus(id, {render: 'fail', error: message, ms: Date.now() - t0});
    console.error(`\nFAIL ${id}: ${message.split('\n')[0]}`);
  }
}
