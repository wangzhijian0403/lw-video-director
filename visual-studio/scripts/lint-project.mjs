#!/usr/bin/env node
/**
 * lint-project.mjs — 工程开渲前校验（对应四条硬约束：尺寸/时长/转场/字幕）
 *
 * 校验不通过直接返回非 0，晚一点发现问题就要多花一次渲染时间。
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTimeline, TRANSITIONS, breakCaption} from '../src/project/timeline.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifestPath = path.join(ROOT, 'src', 'catalog', 'manifest.json');

export function lintProject(project, {publicDir = path.join(ROOT, 'public'), baseDir = process.cwd()} = {}) {
  const errors = [];
  const warnings = [];
  const fsp = fs;

  if (!project || typeof project !== 'object') return {errors: ['project 不是对象'], warnings};
  const manifest = JSON.parse(fsp.readFileSync(manifestPath, 'utf8'));
  const vetted = JSON.parse(fsp.readFileSync(path.join(ROOT, 'src', 'integrations', 'fredtalk-approved.json'), 'utf8'));
  const ids = new Set([...manifest.components.map((c) => c.id), ...vetted.entries.map((x) => x.id)]);

  // 1. 画幅与帧率
  const fps = project.meta?.fps ?? 30;
  if (![24, 25, 30, 50, 60].includes(fps)) errors.push(`fps=${fps} 不在 24/25/30/50/60 之内`);
  const w = project.meta?.width ?? 1920;
  const h = project.meta?.height ?? 1080;
  const ratio = w / h;
  if (Math.abs(ratio - 16 / 9) > 0.01 && Math.abs(ratio - 9 / 16) > 0.01 && Math.abs(ratio - 1) > 0.01) {
    warnings.push(`画幅 ${w}x${h} 不是 16:9 / 9:16 / 1:1，字幕安全区按比例计算可能偏窄`);
  }
  if (w < 720 || h < 720) errors.push(`分辨率 ${w}x${h} 低于 720p`);

  // 2. 场景
  const scenes = Array.isArray(project.scenes) ? project.scenes : [];
  if (!scenes.length) errors.push('scenes 为空');
  scenes.forEach((s, i) => {
    if (!ids.has(s.component)) errors.push(`场景 ${i + 1}（${s.id ?? '-'}）组件 ${s.component} 不在 catalog`);
    const t = s.transition;
    if (t && !TRANSITIONS.includes(t.type)) errors.push(`场景 ${i + 1} 转场类型 ${t.type} 无效`);
    if (t && t.type !== 'cut' && (typeof t.duration !== 'number' || t.duration <= 0)) {
      errors.push(`场景 ${i + 1} 留了 ${t.type} 转场但时长 ≤0`);
    }
    if (typeof s.duration === 'number' && s.duration < 0.5) warnings.push(`场景 ${i + 1} 时长 ${s.duration}s 偏短，转场容易吃掉整段`);
  });

  const timing = project.timing === 'vo';
  if (timing && !project.audio?.vo) errors.push('timing=vo 但没有 audio.vo 口播音频');
  if (timing && !(project.voDuration > 0)) errors.push('timing=vo 但 voDuration 未回填（请先跑 direct，它会用 ffprobe 实测）');

  // 3. 计算时间轴（与渲染同一份实现）
  const timeline = buildTimeline(project);
  if (timeline.totalSeconds < 3) warnings.push(`成片仅 ${timeline.totalSeconds}s`);
  if (timeline.totalSeconds > 180) warnings.push(`成片 ${timeline.totalSeconds}s 超过 3 分钟，渲染耗时要注意`);

  // 4. 转场重叠不得吃掉相邻场景一半以上
  timeline.scenes.forEach((s, i) => {
    if (s.prevOverlap > s.duration * 0.5) errors.push(`场景 ${s.id} 入转场 ${s.prevOverlap} 帧超过自身一半`);
    if (s.nextOverlap > s.duration * 0.5) errors.push(`场景 ${s.id} 出转场 ${s.nextOverlap} 帧超过自身一半`);
    if (i > 0 && s.from < 0) errors.push(`场景 ${s.id} 起点为负，转场重叠过大`);
  });

  // 5. 字幕
  const sub = project.subtitles ?? {};
  const maxUnits = sub.maxCharsPerLine ?? 12;
  if (sub.enabled !== false) {
    const cues = timeline.subtitles.cues;
    if (!cues.length) warnings.push('没有生成任何字幕条');
    cues.forEach((c) => {
      // 已手工排好行的字幕（含换行）按原样检查，不再重新断行
      const lines = Array.isArray(c.lines) && c.lines.length
        ? c.lines.map((l) => String(l))
        : c.text.includes('\n')
          ? c.text.split('\n')
          : breakCaption(c.text, maxUnits, 99);
      if (lines.length > 2) warnings.push(`字幕「${c.text.slice(0, 12)}…」断成 ${lines.length} 行，超过 2 行`);
      const long = lines.filter((l) => [...l].reduce((n, ch) => n + (/[\u0000-\u00ff]/.test(ch) ? 0.56 : 1), 0) > maxUnits + 0.5);
      if (long.length) warnings.push(`字幕「${c.text.slice(0, 12)}…」单行超过 ${maxUnits} 字：${long[0]}`);
      if (c.duration / fps < 0.6) warnings.push(`字幕「${c.text.slice(0, 12)}…」停留 ${(c.duration / fps).toFixed(2)}s，偏短`);
      if (c.end > timeline.totalSeconds + 0.05) errors.push(`字幕「${c.text.slice(0, 12)}…」结束 ${c.end}s 超出成片 ${timeline.totalSeconds}s`);
    });
    for (let i = 1; i < cues.length; i++) {
      if (cues[i].start < cues[i - 1].end - 0.05) warnings.push(`字幕 ${i} 与 ${i + 1} 重叠 ${(cues[i - 1].end - cues[i].start).toFixed(2)}s`);
    }
  }

  // 6. 音频与音效
  const audio = project.audio ?? {};
  const hasSceneVo = scenes.some((s) => s.vo);
  if (!audio.vo && !audio.bgm && !hasSceneVo) warnings.push('没有任何音轨，成片将是静音');
  const sceneIds = new Set(scenes.map((s, i) => s.id ?? `s${i + 1}`));
  const sfxManifestPath = path.join(publicDir, 'sfx', 'manifest.json');
  const sfxNames = fs.existsSync(sfxManifestPath)
    ? new Set(Object.keys(JSON.parse(fs.readFileSync(sfxManifestPath, 'utf8'))))
    : new Set();
  (project.sfx ?? []).forEach((e) => {
    if (!sfxNames.has(String(e.name).replace(/\.wav$/i, ''))) {
      errors.push(`音效 ${e.name} 不在 public/sfx（先跑 npm run sfx）`);
    }
    const at = typeof e.at === 'number' ? e.at : timeline.audio.sfx.find((x) => x.name === e.name && x.anchor === e.anchor)?.at;
    if (typeof at !== 'number' || at < 0) errors.push(`音效 ${e.name} 的时间点无效（需要 at 秒数或 anchor 镜头 id）`);
    if (typeof e.anchor === 'string' && !sceneIds.has(e.anchor)) errors.push(`音效 ${e.name} 锚定的镜头 ${e.anchor} 不存在`);
    if (typeof at === 'number' && at > timeline.totalSeconds) warnings.push(`音效 ${e.name} 落在 ${at}s，超出成片末尾`);
  });

  // 7. 素材存在性（本地路径：既可能已在 public 下，也可能是工程目录里的相对路径）
  const checkAsset = (src, label) => {
    if (!src || /^(https?:|data:|blob:)/.test(src)) return;
    const candidates = path.isAbsolute(src)
      ? [src]
      : [path.join(publicDir, src.replace(/^\/+/, '')), path.resolve(baseDir, src)];
    if (!candidates.some((p) => fs.existsSync(p))) errors.push(`${label} 素材不存在：${candidates.join(' 或 ')}`);
  };
  if (audio.vo) checkAsset(typeof audio.vo === 'string' ? audio.vo : audio.vo.src, '口播');
  scenes.forEach((s) => s.vo && checkAsset(s.vo, `分镜 ${s.id ?? ''} 配音`));
  (Array.isArray(audio.bgm) ? audio.bgm : audio.bgm ? [audio.bgm] : []).forEach((b) => checkAsset(typeof b === 'string' ? b : b.src, 'BGM'));

  return {errors, warnings, timeline};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error('用法: node scripts/lint-project.mjs <project.json>');
    process.exit(2);
  }
  const projectFile = path.resolve(file);
  const project = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
  const {errors, warnings, timeline} = lintProject(project, {baseDir: path.dirname(projectFile)});
  console.log(`场景 ${timeline.scenes.length} · ${timeline.width}x${timeline.height}@${timeline.fps} · ${timeline.totalSeconds}s · 字幕 ${timeline.subtitles.cues.length} 条`);
  warnings.forEach((w) => console.log(`  warn  ${w}`));
  errors.forEach((e) => console.log(`  ERROR ${e}`));
  if (errors.length) {
    console.log(`\n${errors.length} 个错误，先修再渲染`);
    process.exit(1);
  }
  console.log('\nlint 通过');
}
