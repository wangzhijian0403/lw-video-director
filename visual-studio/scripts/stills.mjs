#!/usr/bin/env node
/**
 * stills.mjs — 批量抽帧（只 bundle 一次，做视觉复核用）
 *
 * 用法：node scripts/stills.mjs projects/papermaking-v2/project.json 1.2,2.6,3.6 out-dir
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [projectArg, secsArg, outDirArg] = process.argv.slice(2);
if (!projectArg || !secsArg) {
  console.error('用法: node scripts/stills.mjs <project.json> <秒,秒,...> [outDir]');
  process.exit(2);
}
const projectPath = path.resolve(projectArg);
const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const outDir = path.resolve(outDirArg || path.join(ROOT, 'qa-papermaking'));
fs.mkdirSync(outDir, {recursive: true});

const {getBundle, browserOptions} = await import('../render.mjs');
const {selectComposition, renderStill} = await import('@remotion/renderer');
const serveUrl = await getBundle();
const opts = browserOptions();
const composition = await selectComposition({serveUrl, id: 'Project', inputProps: {project}, ...opts});

for (const raw of secsArg.split(',').map((s) => s.trim()).filter(Boolean)) {
  const sec = parseFloat(raw);
  const frame = Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(sec * composition.fps)));
  const file = path.join(outDir, `v2-t${raw.replace('.', '_')}.jpg`);
  await renderStill({serveUrl, composition, inputProps: {project}, frame, output: file, imageFormat: 'jpeg', jpegQuality: 92, ...opts});
  console.log(`  ${raw}s → frame ${frame} → ${path.basename(file)}`);
}
