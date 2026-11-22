/**
 * character-media.mjs — Node 渲染层私有媒体存在性校验（浏览器包不引入此模块）。
 *
 * 角色媒体是用户本地私有文件，不进 Git。这里只做文件存在性核对，
 * 结果以 `角色/动作 -> boolean` 表回灌 project._characterMedia，
 * 渲染层据此显示「缺少私有媒体」占位，不允许静默黑屏。
 */
import fs from 'node:fs';
import path from 'node:path';

/** @param {Array<{characterId:string, action:string, entry:{file:string}|null}>} characters */
export function checkCharacterMedia(characters, publicDir) {
  const map = {};
  for (const c of characters) {
    if (!c.entry) continue;
    const file = path.join(publicDir, 'characters', c.entry.file);
    map[`${c.characterId}/${c.action}`] = fs.existsSync(file);
  }
  return map;
}
