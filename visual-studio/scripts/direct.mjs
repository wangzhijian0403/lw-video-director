#!/usr/bin/env node
/**
 * direct.mjs — 一条命令出片：project.json → 1080p 成片（画面 + 音轨 + 字幕）
 *
 * 用法：
 *   node scripts/direct.mjs projects/demo/project.json --out exports/demo.mp4
 *   node scripts/direct.mjs projects/demo/project.json --still 3.2        # 只出某一秒的截图
 *   node scripts/direct.mjs projects/demo/project.json --draft            # 半分辨率快速预览
 *
 * 做的事：读工程 → ffprobe 实测口播时长 → 素材同步进 public → SRT 解析 → lint → 渲染 → 写回执。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildTimeline, parseSrt, formatSrt} from '../src/project/timeline.mjs';
import {lintProject} from './lint-project.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC = path.join(ROOT, 'public');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], {encoding: 'utf8'});
  const dur = parseFloat((r.stdout || '').trim());
  return Number.isFinite(dur) ? dur : null;
}

const slugify = (s) =>
  String(s || 'project')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'project';

/** 把工程里引用的本地素材复制进 public/projects/<slug>/，并改写为 staticFile 可用的相对路径 */
function syncAsset(baseDir, src, slug, tag) {
  if (!src) return src;
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  const abs = path.isAbsolute(src) ? src : path.resolve(baseDir, src);
  if (!fs.existsSync(abs)) throw new Error(`素材不存在：${abs}`);
  const hash = crypto.createHash('sha1').update(abs + fs.statSync(abs).mtimeMs).digest('hex').slice(0, 6);
  const ext = path.extname(abs);
  const name = `${tag}-${path.basename(abs, ext).replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 24)}-${hash}${ext}`;
  const destDir = path.join(PUBLIC, 'projects', slug);
  fs.mkdirSync(destDir, {recursive: true});
  const dest = path.join(destDir, name);
  if (!fs.existsSync(dest)) fs.copyFileSync(abs, dest);
  return `projects/${slug}/${name}`;
}

async function main() {
  const projectArg = args.find((a) => !a.startsWith('--') && a.endsWith('.json'));
  if (!projectArg) {
    console.error('用法: node scripts/direct.mjs <project.json> [--out x.mp4] [--still 3.2] [--draft] [--concurrency 1]');
    process.exit(2);
  }
  const projectPath = path.resolve(projectArg);
  const baseDir = path.dirname(projectPath);
  const raw = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  const slug = slugify(raw.meta?.slug || path.basename(baseDir) || raw.meta?.title);

  // 1. 口播实测时长（项目规则第 7 条：先测时长再排轨道）
  const voIn = raw.audio?.vo;
  let resolved = structuredClone(raw);
  resolved.meta = {...resolved.meta, fps: raw.meta?.fps ?? 30, width: raw.meta?.width ?? 1920, height: raw.meta?.height ?? 1080};
  if (voIn) {
    const src = typeof voIn === 'string' ? voIn : voIn.src;
    const abs = /^(https?:|data:)/.test(src) ? null : path.resolve(baseDir, src);
    if (abs) {
      const measured = probe(abs);
      if (!measured) throw new Error(`ffprobe 读不出口播时长：${abs}`);
      resolved.voDuration = +measured.toFixed(3);
      resolved.meta.voDuration = resolved.voDuration;
      console.log(`口播实测 ${resolved.voDuration}s`);
      resolved.audio.vo = typeof voIn === 'string'
        ? {src: syncAsset(baseDir, src, slug, 'vo'), duration: resolved.voDuration}
        : {...voIn, src: syncAsset(baseDir, src, slug, 'vo'), duration: resolved.voDuration};
    } else {
      resolved.audio.vo = typeof voIn === 'string' ? {src} : voIn;
      if (raw.voDuration) resolved.voDuration = raw.voDuration;
    }
  }

  // 2. BGM / 分镜配音素材同步
  const bgm = resolved.audio?.bgm;
  if (bgm) {
    resolved.audio.bgm = (Array.isArray(bgm) ? bgm : [bgm]).map((t, i) => {
      const o = typeof t === 'string' ? {src: t} : {...t};
      return {...o, src: syncAsset(baseDir, o.src, slug, `bgm${i + 1}`)};
    });
  }
  resolved.scenes = (resolved.scenes ?? []).map((s, i) => {
    // 场景参数里引用的本地图片（如原料标本 materials[]）同样要同步进 public，
    // 否则成片里会出现 404 的破图——截图看不出来，渲完才发现。
    let next = s;
    const mats = s.params?.materials;
    if (Array.isArray(mats) && mats.length) {
      next = {...s, params: {...s.params, materials: mats.map((m, k) => ({...m, src: syncAsset(baseDir, m.src, slug, `mat${i + 1}-${k + 1}`)}))}};
    }
    if (!next.vo) return next;
    const abs = /^(https?:|data:)/.test(next.vo) ? null : path.resolve(baseDir, next.vo);
    const voDuration = next.voDuration ?? (abs ? probe(abs) : null);
    return {...next, vo: syncAsset(baseDir, next.vo, slug, `vo-${next.id ?? i + 1}`), voDuration: voDuration ?? next.voDuration};
  });

  // 3. SRT → cues（字幕只走 SRT 或显式 cues，不做文本轨硬拼）
  const sub = resolved.subtitles ?? {};
  if (sub.srt) {
    const srtAbs = path.isAbsolute(sub.srt) ? sub.srt : path.resolve(baseDir, sub.srt);
    if (!fs.existsSync(srtAbs)) throw new Error(`SRT 不存在：${srtAbs}`);
    const cues = parseSrt(fs.readFileSync(srtAbs, 'utf8'));
    if (!cues.length) throw new Error(`SRT 解析出 0 条字幕：${srtAbs}`);
    resolved.subtitles = {...sub, cues};
    console.log(`字幕 ${cues.length} 条`);
  }

  // 4. lint
  const {errors, warnings, timeline} = lintProject(resolved, {publicDir: PUBLIC, baseDir});
  warnings.forEach((w) => console.log(`  warn  ${w}`));
  if (errors.length) {
    errors.forEach((e) => console.log(`  ERROR ${e}`));
    throw new Error('lint 未通过，已中止渲染');
  }

  // 5. 留档：解析后的工程 + 时间轴 + 字幕 SRT（可复现、可 debug）
  const buildDir = path.join(ROOT, 'build', slug);
  fs.mkdirSync(buildDir, {recursive: true});
  fs.writeFileSync(path.join(buildDir, 'project.resolved.json'), JSON.stringify(resolved, null, 2));
  fs.writeFileSync(path.join(buildDir, 'timeline.json'), JSON.stringify(timeline, null, 2));
  if (timeline.subtitles.cues.length) {
    fs.writeFileSync(
      path.join(buildDir, 'subtitles.srt'),
      formatSrt(timeline.subtitles.cues.map((c) => ({start: c.start, end: c.end, text: c.lines.join('\n')}))),
    );
  }
  console.log(`时间轴：${timeline.scenes.length} 场景 / ${timeline.totalSeconds}s / 字幕 ${timeline.subtitles.cues.length} 条 / 音效 ${timeline.audio.sfx.length} 个`);

  // 6. 渲染
  const outArg = flag('out', `exports/${slug}-${Date.now()}.mp4`);
  const output = path.resolve(outArg);
  fs.mkdirSync(path.dirname(output), {recursive: true});
  const {getBundle, browserOptions} = await import('../render.mjs');
  const {selectComposition, renderMedia, renderStill} = await import('@remotion/renderer');

  const serveUrl = await getBundle();
  const opts = browserOptions();

  if (has('draft')) {
    resolved.meta.width = Math.round(resolved.meta.width / 2 / 2) * 2;
    resolved.meta.height = Math.round(resolved.meta.height / 2 / 2) * 2;
  }

  const inputProps = {project: resolved};
  const composition = await selectComposition({serveUrl, id: 'Project', inputProps, ...opts});

  if (flag('still')) {
    const sec = parseFloat(flag('still'));
    const frame = Math.min(composition.durationInFrames - 1, Math.round(sec * composition.fps));
    const stillPath = output.replace(/\.mp4$/, `-${sec}s.png`);
    await renderStill({serveUrl, composition, inputProps, frame, output: stillPath, ...opts});
    console.log(`截图 ${stillPath}`);
    return;
  }

  const started = Date.now();
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    outputLocation: output,
    codec: 'h264',
    pixelFormat: 'yuv420p',
    crf: has('draft') ? 24 : 16,
    audioCodec: 'aac',
    audioBitrate: '192k',
    concurrency: Number(flag('concurrency', 1)),
    ...opts,
    onProgress: ({renderedFrames, encodedFrames, progress}) => {
      if (renderedFrames % 30 === 0) process.stdout.write(`\r  ${(progress * 100).toFixed(0)}%  ${renderedFrames}/${composition.durationInFrames} 帧`);
    },
  });
  console.log(`\n成片 ${output}  (${((Date.now() - started) / 1000).toFixed(1)}s)`);

  // 响度规范化（默认开启）：抖音/视频号目标 -16 LUFS 左右；音频重编码，画面直接拷贝
  if (!has('no-loudnorm')) {
    const tmp = output.replace(/\.mp4$/, '.norm.mp4');
    const r = spawnSync(
      'ffmpeg',
      [
        '-y', '-v', 'error', '-i', output,
        '-c:v', 'copy',
        // loudnorm 默认会升到 192k 采样率，这里显式锁回 48k；TP 留 -2dB 余量，避免峰值贴 0
        '-af', 'loudnorm=I=-16:TP=-2.0:LRA=11',
        '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
        '-movflags', '+faststart',
        tmp,
      ],
      {encoding: 'utf8'},
    );
    if (r.status === 0 && fs.existsSync(tmp)) {
      fs.renameSync(tmp, output);
      console.log('音频已规范化到 -16 LUFS');
    } else {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      console.log(`响度规范化跳过：${(r.stderr || '').slice(0, 200)}`);
    }
  }
}

main().catch((e) => {
  console.error(`\n渲染失败：${e.message}`);
  process.exit(1);
});

