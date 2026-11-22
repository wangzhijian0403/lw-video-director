#!/usr/bin/env node
/** LW visual assets: offline source verification and lightweight search.
 * This is a searchable asset registry, NOT an automatic semantic director.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifestFile = path.join(ROOT, 'src/resource-packs/tabler-outline.json');
export const iconPack = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
export const iconIds = new Set(iconPack.entries.map((e) => e.id));

export function iconById(id) {
  return iconPack.entries.find((e) => e.id === id) ?? null;
}

export function searchIcons(query, limit = 12) {
  const tokens = String(query ?? '').trim().toLowerCase().split(/\s+/u).filter(Boolean);
  const scored = iconPack.entries.map((e) => {
    const txt = [e.name, e.label, ...e.tags].join(' ').toLowerCase();
    let score = tokens.length ? tokens.reduce((n, word) => n +
      (txt === word ? 10 : e.name.includes(word) ? 8 : e.label.includes(word) ? 7 : e.tags.some((tag) => tag.includes(word)) ? 5 : txt.includes(word) ? 1 : 0), 0) : 1;
    return {id: e.id, name: e.label, tags: e.tags, publicPath: e.publicPath, score, license: iconPack.license, technicalStatus: e.technicalStatus};
  }).filter((e) => e.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return scored.slice(0, Math.max(0, Math.min(100, limit)));
}

export function verifyIcons() {
  const errors = [];
  if (iconPack.schemaVersion !== 'lw/visual-assets/1' || iconPack.license !== 'MIT' || !/^[a-f0-9]{40}$/.test(iconPack.revision)) {
    errors.push('Invalid pack schema/license/upstream revision');
  }
  if (!fs.existsSync(path.join(ROOT, 'public', iconPack.licensePath))) errors.push('MIT license notice missing');
  const ids = new Set();
  for (const e of iconPack.entries) {
    if (!/^tabler:[a-z0-9-]+$/.test(e.id) || !/^resource-packs\/tabler-outline\/icons\/[a-z0-9-]+\.svg$/.test(e.publicPath)) {
      errors.push('Invalid ID/path: ' + e.id);
      continue;
    }
    if (ids.has(e.id)) errors.push('Duplicate ID: ' + e.id);
    ids.add(e.id);
    const file = path.join(ROOT, 'public', e.publicPath);
    if (!fs.existsSync(file)) { errors.push('Missing: ' + e.publicPath); continue; }
    const raw = fs.readFileSync(file);
    const xml = raw.toString('utf8');
    if (!xml.includes('<svg') || !xml.includes('viewBox="0 0 24 24"') || /<(script|image|foreignObject)\b|(?:href|xlink:href)\s*=|<iframe\b/i.test(xml)) {
      errors.push('Unsafe or unsupported SVG: ' + e.id);
    }
    const blob = crypto.createHash('sha1').update('blob ' + raw.length + '\0').update(raw).digest('hex');
    if (blob !== e.gitBlob) errors.push('Content hash mismatch: ' + e.id);
    if (!e.source.includes('/blob/' + iconPack.revision + '/icons/outline/' + e.name + '.svg')) {
      errors.push('Unpinned source URL: ' + e.id);
    }
  }
  return {ok: errors.length === 0, count: iconPack.entries.length, revision: iconPack.revision, errors};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--check')) {
    const result = verifyIcons();
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  } else if (args.includes('--list')) {
    console.log(JSON.stringify(searchIcons('', 100), null, 2));
  } else if (args.includes('--search')) {
    const pos = args.indexOf('--search');
    console.log(JSON.stringify(searchIcons(args.slice(pos + 1).join(' ')), null, 2));
  } else {
    console.log('用法: node scripts/icon-assets.mjs --check | --list | --search "配音"');
    process.exitCode = 2;
  }
}
