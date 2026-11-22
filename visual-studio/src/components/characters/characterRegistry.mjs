/**
 * characterRegistry.mjs — 用户本地角色基础接入注册表（Node CLI 与 Remotion 浏览器共用）
 *
 * 纯数据 + 纯函数，不访问文件系统；私有媒体是否落盘由 Node 渲染层另行校验。
 *
 * 验收状态口径：
 *  - verified-basic：已在真实 Remotion Composition 完成基础叠加 E2E（透明、位置、安全区间抽查）。
 *  - wired-pending：适配器已接线，但动作未通过基础 E2E 验收，渲染时必须显示待验收占位，不得静默播放。
 *
 * 安全播放区间（safeRange）：源片实测可安全使用的秒区间；未验收动作不登记区间。
 * 已验收条目的本地 WebM 在准备阶段已按 safeRange 裁短，渲染层直接播放整段即可。
 * loopAllowed 一律默认 false：未验证无缝循环前，禁止自动循环播放。
 */

export const CHARACTER_IDS = ['fish', 'codex', 'deepseek', 'doubao', 'claude'];

export const CHARACTER_ACTIONS = ['idle', 'wave', 'typing', 'curtsy', 'share', 'dance', 'still'];

export const CHARACTER_WHITELIST = {
  fish: ['idle', 'wave', 'still'],
  codex: ['idle', 'typing', 'still'],
  deepseek: ['idle', 'curtsy', 'still'],
  doubao: ['idle', 'share', 'still'],
  claude: ['idle', 'dance', 'still'],
};

/** 源片统一规格：10s / 24fps（未验收条目也按此记录，便于越界校验） */
export const SOURCE_FPS = 24;
export const SOURCE_DURATION_SEC = 10;

/**
 * 已通过基础 E2E 验收的动作条目。
 * 其他动作进入 getCharacterEntry 时回退为 wired-pending。
 */
const VERIFIED_ENTRIES = {
  'fish/wave': {
    status: 'verified-basic',
    kind: 'video',
    file: 'fish-wave.webm',
    safeRange: {start: 0.2, end: 5.0},
    trimmedToSafeRange: true,
    note: '5.0s 后鱼体漂移放大并探出画外；未验证循环与全长边缘',
  },
  'codex/typing': {
    status: 'verified-basic',
    kind: 'video',
    file: 'codex-typing.webm',
    safeRange: {start: 0.2, end: 5.0},
    trimmedToSafeRange: true,
    note: '结尾变为举臂庆祝姿态；未验证循环与全长边缘',
  },
};

/** @returns {null | {status:string, kind:'video'|'image', file:string, safeRange?:{start:number,end:number}, loopAllowed:boolean, note:string}} */
export function getCharacterEntry(characterId, action) {
  if (!CHARACTER_IDS.includes(characterId)) return null;
  if (!CHARACTER_WHITELIST[characterId].includes(action)) return null;

  if (action === 'still') {
    return {
      status: 'wired-pending',
      kind: 'image',
      file: `${characterId}-transparent.png`,
      loopAllowed: false,
      note: '透明静态图未参与本轮 E2E 验收',
    };
  }

  const key = `${characterId}/${action}`;
  const verified = VERIFIED_ENTRIES[key];
  if (verified) {
    return {
      status: verified.status,
      kind: verified.kind,
      file: verified.file,
      safeRange: verified.safeRange,
      loopAllowed: false,
      note: verified.note,
    };
  }

  return {
    status: 'wired-pending',
    kind: 'video',
    file: `${characterId}-${action}.webm`,
    loopAllowed: false,
    note: '该动作未通过基础 E2E 验收，不能按已验证动作调用',
  };
}

/** 源片安全区间换算成源片帧（24fps）；未登记区间返回 null */
export function safeRangeFrames(entry) {
  if (!entry || !entry.safeRange) return null;
  return {
    startFrom: Math.max(0, Math.round(entry.safeRange.start * SOURCE_FPS)),
    endAt: Math.min(SOURCE_DURATION_SEC * SOURCE_FPS, Math.round(entry.safeRange.end * SOURCE_FPS)),
  };
}
