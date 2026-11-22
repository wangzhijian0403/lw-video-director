#!/usr/bin/env node
/**
 * narration_tts.mjs — 用用户本地配音服务（127.0.0.1:7788）逐镜合成口播
 *
 * 为什么逐镜合成：
 * 一句一条音频，实测时长就是该镜的真实时长；不需要按字数猜、也不需要用 ASR 对齐，
 * 天然音画同步。整篇合成再切分则必须依赖强制对齐，误差会累积到后半段。
 *
 * 用法：
 *   node scripts/narration_tts.mjs projects/<slug>/project.json            # 合成缺失/过期的分镜音频
 *   node scripts/narration_tts.mjs projects/<slug>/project.json --force    # 重录全部
 *   node scripts/narration_tts.mjs --voices                                # 列出可用克隆音色
 *
 * 输出：
 *   assets/vo-<sceneId>.mp3 与 assets/vo-<sceneId>.json（文本、音色、语速、实测时长）
 *   并把 scene.vo / scene.voDuration 回填进 project.json
 *
 * 注意：音色 id、克隆模型只写入本机 project.json / assets 侧车文件，
 * 不提交到公共仓库；上层 .gitignore 已排除 projects/<slug>/assets。
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const API = process.env.LW_TTS_API || 'http://127.0.0.1:7788';
// 用户指定音色：老王3.0_紧凑版（qwen 克隆）
const DEFAULT_VOICE = process.env.LW_TTS_VOICE || 'qwen-audio-3.1-tts-flash-bailian-9417dd62e1404598a177568fa67376c4';
const DEFAULT_ENGINE = process.env.LW_TTS_ENGINE || 'qwen';
const RATE = Number(process.env.LW_TTS_RATE || 1);

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);

const probe = (file) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], {encoding: 'utf8'});
  const d = parseFloat((r.stdout || '').trim());
  return Number.isFinite(d) ? +d.toFixed(3) : null;
};

async function voices() {
  const r = await fetch(`${API}/api/voices`);
  const classic = await r.json();
  const clones = await (await fetch(`${API}/api/qwen/clones`)).json();
  const fmt = (v) => `  ${v.id}\n     ${v.name} · ${v.gender ?? ''} ${v.category ?? ''} ${v.status ?? ''}`;
  console.log('克隆音色（推荐）：');
  (clones.list ?? []).forEach((v) => console.log(fmt(v)));
  console.log(`\n普通音色共 ${(classic.list ?? []).length} 个，例：`);
  (classic.list ?? []).slice(0, 5).forEach((v) => console.log(fmt(v)));
}

async function synth(text, dest) {
  const res = await fetch(`${API}/api/synth`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({text, engine: DEFAULT_ENGINE, voice: DEFAULT_VOICE, rate: RATE, volume: 1, style: '', precision: 10}),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  const audio = await fetch(`${API}/api/audio?name=${encodeURIComponent(body.file)}`);
  if (!audio.ok) throw new Error(`下载配音失败 HTTP ${audio.status}`);
  fs.writeFileSync(dest, Buffer.from(await audio.arrayBuffer()));
  return body;
}

async function main() {
  if (has('voices')) return voices();

  const projectArg = args.find((a) => !a.startsWith('--') && a.endsWith('.json'));
  if (!projectArg) {
    console.error('用法: node scripts/narration_tts.mjs <project.json> [--force]  或  --voices');
    process.exit(2);
  }
  const projectPath = path.resolve(projectArg);
  const baseDir = path.dirname(projectPath);
  const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  const assetDir = path.join(baseDir, 'assets');
  fs.mkdirSync(assetDir, {recursive: true});

  const scenes = project.scenes ?? [];
  const force = has('force');
  const updated = structuredClone(project);

  for (const [i, scene] of scenes.entries()) {
    const text = String(scene.narrationText ?? scene.text ?? '').trim();
    const id = scene.id ?? `s${i + 1}`;
    if (!text) {
      console.log(`  skip ${id}：没有 narrationText/text`);
      continue;
    }
    const rel = `assets/vo-${id}.mp3`;
    const dest = path.join(baseDir, rel);
    const sidecar = dest.replace(/\.mp3$/, '.json');

    if (fs.existsSync(dest) && !force) {
      const meta = fs.existsSync(sidecar) ? JSON.parse(fs.readFileSync(sidecar, 'utf8')) : null;
      const dur = meta?.duration ?? probe(dest);
      updated.scenes[i] = {...updated.scenes[i], vo: rel, voDuration: dur, narrationText: text};
      console.log(`  reuse ${id}  ${dur}s  ${text.slice(0, 18)}…`);
      continue;
    }

    process.stdout.write(`  synth ${id}  ${text.length} 字 … `);
    const info = await synth(text, dest);
    const dur = probe(dest) ?? info.seconds ?? null;
    fs.writeFileSync(
      sidecar,
      JSON.stringify(
        {text, voice: DEFAULT_VOICE, engine: DEFAULT_ENGINE, rate: RATE, duration: dur, chunks: info.chunks ?? 1, synthesizedAt: new Date().toISOString()},
        null,
        2,
      ),
    );
    updated.scenes[i] = {...updated.scenes[i], vo: rel, voDuration: dur, narrationText: text};
    console.log(`${dur}s（服务端 ${info.seconds ?? '?'}s，${info.chunks ?? 1} 段）`);
  }

  // 是否需要整条 vo：多镜时不需要，留空即按分镜播
  if (updated.audio?.vo && String(updated.audio.vo).startsWith('assets/vo-')) delete updated.audio.vo;

  fs.writeFileSync(projectPath, JSON.stringify(updated, null, 2) + '\n');
  const total = updated.scenes.reduce((s, x) => s + (x.voDuration ?? 0), 0);
  console.log(`\n口播合计 ${total.toFixed(2)}s，已回填 ${projectPath}`);
}

main().catch((e) => {
  console.error(`\n配音失败：${e.message}`);
  process.exit(1);
});
