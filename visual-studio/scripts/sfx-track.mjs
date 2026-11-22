#!/usr/bin/env node
/**
 * sfx-track.mjs — 单独导出一条音效轨（不含配音），并输出音效事件时间码
 *
 * 为什么单独导：返修要求「独立 SFX 轨 + 音效事件时间码」，
 * 这样审片时可以只听音效设计，也能核对每个音效是否真的落在画面动作上。
 *
 * 用法：node scripts/sfx-track.mjs projects/<slug>/project.json
 * 输出：build/<slug>/sfx-track.wav、sfx-events.json、sfx-events.md
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildTimeline} from '../src/project/timeline.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC = path.join(ROOT, 'public');

const projectArg = process.argv.find((a) => !a.startsWith('--') && a.endsWith('.json'));
if (!projectArg) {
  console.error('用法: node scripts/sfx-track.mjs <project.json>');
  process.exit(2);
}
const projectPath = path.resolve(projectArg);
const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
const slug = project.meta?.slug || 'project';
const outDir = path.join(ROOT, 'build', slug);
fs.mkdirSync(outDir, {recursive: true});

const timeline = buildTimeline(project);
const events = timeline.audio.sfx;
const total = timeline.totalSeconds;

// 事件表（人读 + 机读）
const rows = events.map((e, i) => ({
  index: i + 1,
  name: e.name,
  at: e.at,
  from: e.from,
  seconds: +e.at.toFixed(3),
  volume: e.volume,
  anchor: e.anchor,
  scene: timeline.scenes.find((s) => e.from >= s.from && e.from < s.from + s.duration)?.id ?? '-',
}));
fs.writeFileSync(path.join(outDir, 'sfx-events.json'), JSON.stringify({total, fps: timeline.fps, events: rows}, null, 2) + '\n');

const md = [
  `# 音效事件时间码 · ${project.meta?.title ?? slug}`,
  '',
  `成片 ${total}s · ${timeline.fps}fps · 共 ${rows.length} 个音效事件`,
  '',
  '| # | 时间码 | 帧 | 音效 | 镜头 | 音量 | 锚点 |',
  '|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.index} | ${r.seconds.toFixed(2)}s | ${r.from} | ${r.name} | ${r.scene} | ${r.volume} | ${r.anchor ?? 'at'} |`,
  ),
  '',
];
fs.writeFileSync(path.join(outDir, 'sfx-events.md'), md.join('\n'));

// 合成音效轨：静音底 + 逐条 adelay/volume + amix(normalize=0)
const inputs = ['-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000'];
const filters = [];
events.forEach((e, i) => {
  const file = path.join(PUBLIC, e.src);
  if (!fs.existsSync(file)) throw new Error(`音效文件不存在：${file}`);
  inputs.push('-i', file);
  const delayMs = Math.round(e.at * 1000);
  filters.push(`[${i + 1}:a]volume=${e.volume},adelay=${delayMs}|${delayMs}[s${i}]`);
});
const mixIn = ['[0:a]', ...events.map((_, i) => `[s${i}]`)].join('');
filters.push(`${mixIn}amix=inputs=${events.length + 1}:duration=first:normalize=0,volume=4[aout]`);

const outWav = path.join(outDir, 'sfx-track.wav');
const args = [
  '-y', '-v', 'error',
  ...inputs,
  '-filter_complex', filters.join(';'),
  '-map', '[aout]',
  '-t', String(total),
  '-c:a', 'pcm_s16le', '-ar', '48000',
  outWav,
];
const r = spawnSync('ffmpeg', args, {encoding: 'utf8'});
if (r.status !== 0) {
  console.error(r.stderr?.slice(-800));
  throw new Error('音效轨合成失败');
}
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', outWav], {
  encoding: 'utf8',
});
console.log(`音效轨 ${path.relative(ROOT, outWav)}  ${(parseFloat(probe.stdout) || 0).toFixed(3)}s  ${events.length} 个事件`);
console.log(`事件表 ${path.relative(ROOT, path.join(outDir, 'sfx-events.md'))}`);
