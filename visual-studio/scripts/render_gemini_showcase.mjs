import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openBrowser, selectComposition, renderMedia, renderStill} from '@remotion/renderer';
import {getBundle, browserOptions} from '../render.mjs';
import {buildTimeline} from '../src/project/timeline.mjs';
import {checkCharacterMedia} from '../src/project/character-media.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectPath = path.resolve(root, '..', 'references', 'character-library-data', 'gemini-showcase-project.json');
const outVideo = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'exports', 'gemini-character-showcase.mp4');
const framesDir = process.argv[3] ? path.resolve(process.argv[3]) : path.dirname(outVideo);

fs.mkdirSync(path.dirname(outVideo), {recursive: true});
fs.mkdirSync(framesDir, {recursive: true});

const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const preTimeline = buildTimeline(project);
if (preTimeline.characterErrors.length > 0) {
  throw new Error('Character timeline errors: ' + preTimeline.characterErrors.join('; '));
}
project._characterMedia = checkCharacterMedia(preTimeline.characters, path.join(root, 'public'));
for (const [k, ok] of Object.entries(project._characterMedia)) {
  if (!ok) throw new Error(`Missing character media for ${k}`);
}

const cachedBundle = path.join(root, '.cache', 'bundle');
const serveUrl = fs.existsSync(path.join(cachedBundle, 'index.html')) ? cachedBundle : await getBundle();

const baseOpts = browserOptions();
const puppeteerInstance = await openBrowser('chrome', baseOpts);
const options = {...baseOpts, puppeteerInstance};

try {
  const inputProps = {project};
  const composition = await selectComposition({
    serveUrl,
    id: 'Project',
    inputProps,
    ...options,
  });

  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    outputLocation: outVideo,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    concurrency: 2,
    crf: 19,
    ...options,
  });
  console.log('Rendered showcase video:', outVideo);

  for (const [frame, name] of [
    [45, 'showcase-act1-variants.png'],
    [135, 'showcase-act2-ensemble.png'],
    [225, 'showcase-act3-idle-still.png'],
  ]) {
    const outPng = path.join(framesDir, name);
    await renderStill({
      serveUrl,
      composition,
      inputProps,
      frame,
      imageFormat: 'png',
      output: outPng,
      ...options,
    });
    console.log('Rendered showcase frame:', outPng);
  }
} finally {
  await puppeteerInstance.close({silent: true});
}
