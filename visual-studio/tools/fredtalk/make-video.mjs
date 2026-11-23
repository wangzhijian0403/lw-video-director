// Render the two LW-owned placeholder pieces used by the FredTalk acceptance
// samples.  Output goes to public/fredtalk/media/{lw-recording,lw-result}.mp4.
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const publicDir = path.join(root, 'public');
const browserExecutable = process.env.LW_BROWSER || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/local/bin/chromium');

const serveUrl = await bundle({
  entryPoint: path.join(root, 'src/remotion/root.tsx'),
  rootDir: root,
  outDir: path.join(root, '.cache/bundle-placeholders'),
  publicDir,
  gitSource: null,
});

for (const [id, file] of [['LW-RECORDING', 'lw-recording.mp4'], ['LW-RESULT', 'lw-result.mp4']]) {
  const output = path.join(publicDir, 'fredtalk/media', file);
  fs.mkdirSync(path.dirname(output), {recursive: true});
  const composition = await selectComposition({serveUrl, id, browserExecutable, chromiumOptions: {gl: 'angle'}});
  await renderMedia({
    serveUrl, composition, outputLocation: output, codec: 'h264', pixelFormat: 'yuv420p',
    crf: 20, concurrency: 2, browserExecutable, chromiumOptions: {gl: 'angle'},
  });
  console.log(output);
}
