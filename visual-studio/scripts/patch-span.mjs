#!/usr/bin/env node
/**
 * patch-span.mjs — 把时间轴算出的真实镜长回填进 params.span
 *
 * 组件靠 params.span 决定自己的动画进度（几秒内完成入场、聚焦、转场交接），
 * 而真实镜长由 buildTimeline 决定（配音实测 + 余量 + 转场重叠）。
 * 两者必须一致，否则换文案后动画会提前结束或拖到下一镜。
 *
 * 用法：node scripts/patch-span.mjs projects/<slug>/project.json
 */
import fs from 'node:fs';
import {buildTimeline} from '../src/project/timeline.mjs';

const file = process.argv[2];
if (!file) {
  console.error('用法: node scripts/patch-span.mjs <project.json>');
  process.exit(2);
}
const project = JSON.parse(fs.readFileSync(file, 'utf8'));
const timeline = buildTimeline(project);

let changed = 0;
timeline.scenes.forEach((s, i) => {
  const span = +(s.duration / timeline.fps).toFixed(3);
  const scene = project.scenes[i];
  scene.params = {...(scene.params ?? {}), span};
  changed++;
  console.log(`  ${s.id}  ${s.duration} 帧 → span=${span}s  (${s.startSec.toFixed(2)}–${s.endSec.toFixed(2)}s)`);
});
fs.writeFileSync(file, JSON.stringify(project, null, 2) + '\n');
console.log(`\n已回填 ${changed} 个 span，总长 ${timeline.totalSeconds}s`);
