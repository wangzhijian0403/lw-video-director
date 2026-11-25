import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {openBrowser, selectComposition, renderStill, renderFrames} from '@remotion/renderer';
import {getBundle, browserOptions} from '../render.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'public', 'characters');
const mode = process.argv[3] || 'preview'; // 'preview' | 'full'
const forceBundle = process.argv.includes('--bundle');

fs.mkdirSync(outDir, {recursive: true});

const cachedBundle = path.join(root, '.cache', 'bundle');
const serveUrl =
  !forceBundle && fs.existsSync(path.join(cachedBundle, 'index.html'))
    ? cachedBundle
    : await getBundle();

const baseOpts = browserOptions();
const puppeteerInstance = await openBrowser('chrome', baseOpts);
const options = {...baseOpts, puppeteerInstance};

try {
  async function renderPng(props, frame, outFile) {
    const composition = await selectComposition({
      serveUrl,
      id: 'CHAR-GEMINI-3D',
      inputProps: props,
      ...options,
    });
    await renderStill({
      serveUrl,
      composition,
      inputProps: props,
      frame,
      imageFormat: 'png',
      output: outFile,
      ...options,
    });
    console.log('Rendered still:', outFile);
  }

  async function renderJpg(props, frame, outFile) {
    const composition = await selectComposition({
      serveUrl,
      id: 'CHAR-GEMINI-3D',
      inputProps: props,
      ...options,
    });
    await renderStill({
      serveUrl,
      composition,
      inputProps: props,
      frame,
      imageFormat: 'jpeg',
      jpegQuality: 94,
      output: outFile,
      ...options,
    });
    console.log('Rendered jpeg:', outFile);
  }

  const variants = [
    {variant: 'sparkle', charId: 'gemini'},
    {variant: 'bot', charId: 'gemini-bot'},
    {variant: 'chibi', charId: 'gemini-chibi'},
  ];

  for (const {variant, charId} of variants) {
    await renderPng(
      {variant, action: 'still', bgMode: 'transparent', showShadow: true, width: 1200, height: 1200, fps: 24, durationInFrames: 24},
      0,
      path.join(outDir, `${charId}-transparent.png`),
    );
    if (mode === 'full') {
      await renderJpg(
        {variant, action: 'still', bgMode: 'greenscreen', showShadow: false, width: 960, height: 960, fps: 24, durationInFrames: 24},
        0,
        path.join(outDir, `${charId}-greenscreen.jpg`),
      );
    }
  }

  if (mode === 'full') {
    const actionJobs = [
      {variant: 'sparkle', charId: 'gemini', actions: ['idle', 'wave', 'sparkle', 'typing']},
      {variant: 'bot', charId: 'gemini-bot', actions: ['idle', 'wave', 'sparkle']},
      {variant: 'chibi', charId: 'gemini-chibi', actions: ['idle', 'wave', 'sparkle']},
    ];
    const framesRoot = path.join(root, '.cache', 'gemini-frames');
    for (const job of actionJobs) {
      for (const action of job.actions) {
        const seqDir = path.join(framesRoot, `${job.charId}-${action}`);
        fs.rmSync(seqDir, {recursive: true, force: true});
        fs.mkdirSync(seqDir, {recursive: true});
        const inputProps = {
          variant: job.variant,
          action,
          bgMode: 'transparent',
          showShadow: true,
          width: 720,
          height: 720,
          fps: 24,
          durationInFrames: 116, // 4.83s (matches safeRange 0.2..5.0s = 4.8s)
        };
        const composition = await selectComposition({
          serveUrl,
          id: 'CHAR-GEMINI-3D',
          inputProps,
          ...options,
        });
        await renderFrames({
          serveUrl,
          composition,
          inputProps,
          imageFormat: 'png',
          outputDir: seqDir,
          concurrency: 4,
          onFrameUpdate: () => {},
          ...options,
        });
        console.log(`Rendered 116 alpha frames for ${job.charId}/${action}`);
      }
    }
  }
} finally {
  await puppeteerInstance.close({silent: true});
}
