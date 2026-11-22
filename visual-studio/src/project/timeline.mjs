/**
 * timeline.mjs — 整片时间轴引擎（Node CLI 与 Remotion 渲染共用同一份计算）
 *
 * 单位约定：对外一律秒，落帧后全部取整（frames = round(sec * fps)）。
 * 项目规则第 5 条：时间只在这里换算一次，别处不再出现第二套换算。
 *
 * 兼容两种输入：
 *  1) project.json —— 顺序式，场景给时长/文本，转场重叠自动算；
 *  2) episode.json —— 帧精确式，场景带 startFrame/durationFrames/componentId/props，
 *     直接按给定帧排布，不做重叠（与 episode_preflight.py 的契约一致）。
 */
import {getCharacterEntry, CHARACTER_IDS} from '../components/characters/characterRegistry.mjs';

export const DEFAULT_FPS = 30;
export const TRANSITIONS = ['cut', 'fade', 'slide', 'zoom', 'wipe'];
export const SAFE_MARGIN = 0.075;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const round = Math.round;

export function paramSeconds(params = {}) {
  const {entrance = 1, hold = 2, exit = 1} = params;
  return Math.max(0.2, entrance + hold + exit);
}

const unit = (ch) => (/[\u0000-\u00ff]/.test(ch) ? 0.56 : 1);

/** 语义断行：优先标点，其次按字数均分；每行 ≤ maxUnits，最多 maxLines 行 */
export function breakCaption(text, maxUnits = 12, maxLines = 2) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return [''];
  const segs = clean.split(/(?<=[，。！？、；：,.!?;:])\s*/).filter(Boolean);
  const lines = [];
  let cur = '';
  let wide = 0;
  const push = () => {
    if (cur.trim()) lines.push(cur.trim());
    cur = '';
    wide = 0;
  };
  for (const seg of segs) {
    const w = [...seg].reduce((s, c) => s + unit(c), 0);
    if (wide + w <= maxUnits) {
      cur += seg;
      wide += w;
      continue;
    }
    if (cur.trim()) push();
    if (w <= maxUnits) {
      cur = seg;
      wide = w;
      continue;
    }
    let buf = '';
    let bw = 0;
    for (const ch of [...seg]) {
      if (bw + unit(ch) > maxUnits && buf) {
        lines.push(buf.trim());
        buf = '';
        bw = 0;
      }
      buf += ch;
      bw += unit(ch);
    }
    cur = buf;
    wide = bw;
  }
  if (cur.trim()) lines.push(cur.trim());
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[，。！？、；：,.!?;:]$/, '') + '…';
    return kept;
  }
  return lines.length ? lines : [''];
}

/**
 * 一句口播拆成多条字幕。
 *
 * 为什么要拆：一个镜头往往配一整段定稿文案（三十字以上），单条字幕只留两行会吞掉后半句。
 * 「能不能塞进两行」直接用 breakCaption 的返回值判断（截断时末行会带省略号，拼接后必然不等于原文），
 * 而不是靠字数估算；装不下就按标点断句重排，块与块之间按字数比例分配停留时长，
 * 仍然贴着该镜配音的起止，不改动音画关系。本来就装得下的短句原样只出一条，既有工程字幕节奏不变。
 */
export function splitSceneCues(text, start, end, maxUnits = 12) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  const dur = Math.max(0.3, end - start);
  if (!clean) return [];
  const fitsTwo = (t) => breakCaption(t, maxUnits, 2).join('') === String(t).trim();
  if (fitsTwo(clean)) return [{start, end, text: clean}];

  const width = (s) => [...s].reduce((n, ch) => n + unit(ch), 0);
  const clauses = clean.split(/(?<=[，。！？；：])\s*/).filter(Boolean);
  const chunks = [];
  let cur = '';
  for (const c of clauses) {
    if (cur && !fitsTwo(cur + c)) {
      chunks.push(cur);
      cur = '';
    }
    if (!cur && !fitsTwo(c)) {
      // 单个从句本身就装不下两行：按字数硬切，保证每块都落在两行内
      let buf = '';
      for (const ch of [...c]) {
        if (buf && !fitsTwo(buf + ch)) {
          chunks.push(buf);
          buf = '';
        }
        buf += ch;
      }
      cur = buf;
      continue;
    }
    cur += c;
  }
  if (cur.trim()) chunks.push(cur);

  const total = chunks.reduce((n, s) => n + width(s), 0) || 1;
  let cursor = start;
  return chunks.map((s, i) => {
    const share = (width(s) / total) * dur;
    const st = cursor;
    const en = i === chunks.length - 1 ? end : Math.min(end, cursor + Math.max(0.35, share));
    cursor = en;
    return {start: st, end: en, text: s.trim()};
  });
}

export function parseSrt(raw) {
  const text = String(raw ?? '').replace(/\r/g, '');
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  const toSec = (stamp) => {
    const m = stamp.trim().match(/(\d+):(\d{1,2}):(\d{1,2})[.,](\d{1,3})/);
    if (!m) return null;
    return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4].padEnd(3, '0') / 1000;
  };
  return blocks
    .map((block) => {
      const lines = block.split('\n').filter((l) => l.trim());
      const idx = lines.findIndex((l) => l.includes('-->'));
      if (idx < 0) return null;
      const [a, b] = lines[idx].split('-->');
      const start = toSec(a);
      const end = toSec(b);
      if (start === null || end === null || end <= start) return null;
      return {start, end, text: lines.slice(idx + 1).join('\n').trim()};
    })
    .filter((c) => c && c.text);
}

export function formatSrt(cues) {
  const stamp = (sec) => {
    const ms = Math.round((sec % 1) * 1000);
    const s = Math.floor(sec) % 60;
    const m = Math.floor(sec / 60) % 60;
    const h = Math.floor(sec / 3600);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };
  return cues.map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');
}

const asTrack = (v, fallbackVolume) => {
  if (!v) return null;
  if (typeof v === 'string') return {src: v, volume: fallbackVolume, fadeIn: 0, fadeOut: 0, start: 0};
  return {volume: fallbackVolume, fadeIn: 0, fadeOut: 0, start: 0, ...v};
};

/** episode.json 与 project.json 的字段名统一成一种场景规格 */
const normalizeScene = (s, i, fps) => ({
  id: s.id ?? `s${i + 1}`,
  component: s.component ?? s.componentId,
  params: s.params ?? s.props ?? {},
  theme: s.theme,
  text: s.text ?? s.narrationText ?? '',
  caption: s.caption ?? s.narrationText ?? s.text ?? '',
  vo: s.vo ?? null,
  voDuration: isNum(s.voDuration) ? s.voDuration : null,
  duration: isNum(s.duration) ? s.duration : isNum(s.durationFrames) ? s.durationFrames / fps : null,
  startFrame: isNum(s.startFrame) ? s.startFrame : null,
  tail: isNum(s.tail) ? s.tail : 0,
  transition: s.transition ?? {type: 'cut', duration: 0},
});

/**
 * 构建时间轴快照。
 *
 * 时长优先级（顺序式）：scene.duration > 单镜配音实测时长（+0.2s 余量，画面同时吃下转场前导）
 * > 按字数比例分口播总时长 > 组件参数时长。
 * 帧精确式（任一场景带 startFrame）直接照搬给定帧，不做重叠。
 */
export function buildTimeline(project = {}) {
  const meta = project.meta ?? {};
  const fps = isNum(meta.fps) ? meta.fps : DEFAULT_FPS;
  const width = isNum(meta.width) ? meta.width : 1920;
  const height = isNum(meta.height) ? meta.height : 1080;
  const theme = meta.theme ?? 'future';
  const scenesIn = (Array.isArray(project.scenes) ? project.scenes : []).map((s, i) => normalizeScene(s, i, fps));
  const voDur = isNum(project.voDuration) ? project.voDuration : isNum(meta.voDuration) ? meta.voDuration : null;
  const precise = scenesIn.some((s) => s.startFrame !== null);

  let scenes = [];
  let totalFrames = 0;

  if (precise) {
    let cursor = 0;
    scenes = scenesIn.map((s) => {
      const from = s.startFrame !== null ? s.startFrame : cursor;
      const duration = Math.max(1, round((s.duration ?? paramSeconds(s.params)) * fps));
      cursor = from + duration;
      return {
        ...s,
        theme: s.theme ?? theme,
        from,
        duration,
        prevOverlap: 0,
        nextOverlap: 0,
        startSec: from / fps,
        endSec: (from + duration) / fps,
      };
    });
    totalFrames = Math.max(1, cursor);
  } else {
    const explicit = scenesIn.map((s) => (s.duration ? round(s.duration * fps) : null));
    const fixedSum = explicit.reduce((a, v) => a + (v ?? 0), 0) / fps;
    const weight = scenesIn.map((s) => [...String(s.text ?? '')].reduce((a, c) => a + unit(c), 0) || 1);
    const wSum = weight.reduce((a, b) => a + b, 0) || 1;
    const freeBudget = voDur && project.timing === 'vo' && !scenesIn.some((s) => s.vo) ? Math.max(0.5, voDur - fixedSum) : null;

    const durF = [];
    const overlapF = [];
    scenesIn.forEach((s, i) => {
      let o = 0;
      if (i > 0 && s.transition && s.transition.type !== 'cut' && isNum(s.transition.duration) && s.transition.duration > 0) {
        o = Math.min(round(s.transition.duration * fps), Math.floor(durF[i - 1] / 2));
      }
      overlapF[i] = o;
      let d;
      if (explicit[i]) d = explicit[i];
      else if (s.voDuration) d = round((s.voDuration + 0.2 + s.tail) * fps) + o;
      else if (freeBudget !== null) d = Math.max(1, round(((freeBudget * weight[i]) / wSum) * fps));
      else d = round(paramSeconds(s.params) * fps);
      durF[i] = Math.max(1, d);
    });

    let cursor = 0;
    scenes = scenesIn.map((s, i) => {
      const from = cursor - overlapF[i];
      cursor = from + durF[i];
      return {
        ...s,
        theme: s.theme ?? theme,
        from,
        duration: durF[i],
        prevOverlap: overlapF[i],
        nextOverlap: overlapF[i + 1] ?? 0,
        startSec: from / fps,
        endSec: (from + durF[i]) / fps,
      };
    });
    totalFrames = Math.max(1, cursor);
  }

  // 音轨
  const audioIn = project.audio ?? {};
  const vo = asTrack(audioIn.vo, 1);
  const bgm = (Array.isArray(audioIn.bgm) ? audioIn.bgm : audioIn.bgm ? [audioIn.bgm] : []).map((t) => asTrack(t, 0.18)).filter(Boolean);

  // 分镜配音：起点在画面转场完成之后，避免两句叠着说
  const voSegments = scenes
    .filter((s) => s.vo)
    .map((s) => {
      const from = s.from + s.prevOverlap;
      const duration = Math.max(1, round(((s.voDuration ?? s.duration / fps) + 0.05) * fps));
      return {
        src: s.vo,
        sceneId: s.id,
        from,
        duration: Math.max(1, Math.min(duration, totalFrames - from)),
        volume: 1,
      };
    })
    .filter((s) => s.duration > 0);

  const sfxEvents = (Array.isArray(project.sfx) ? project.sfx : [])
    .filter((e) => e && typeof e.name === 'string' && (isNum(e.at) || typeof e.anchor === 'string'))
    .map((e) => {
      const name = e.name.replace(/\.wav$/i, '');
      // 优先按镜头锚点定位：配音时长变化后音效仍贴着画面走
      const anchorScene = typeof e.anchor === 'string' ? scenes.find((s) => s.id === e.anchor) : null;
      const at = anchorScene ? (anchorScene.from + Math.round((isNum(e.offset) ? e.offset : 0) * fps)) / fps : e.at;
      return {
        name,
        src: `sfx/${name}.wav`,
        from: round(at * fps),
        at: +at.toFixed(3),
        volume: isNum(e.volume) ? e.volume : 0.8,
        anchor: e.anchor ?? null,
      };
    });

  const voTrack = vo
    ? {
        src: vo.src,
        from: round((vo.start ?? 0) * fps),
        start: vo.start ?? 0,
        duration: round((isNum(vo.duration) ? vo.duration : voDur ?? 0) * fps),
        volume: isNum(vo.volume) ? vo.volume : 1,
        fadeIn: vo.fadeIn ?? 0,
        fadeOut: vo.fadeOut ?? 0,
      }
    : null;

  // 字幕：显式 cues > 场景文本（有分镜配音就贴在配音起止上）
  const subIn = project.subtitles ?? {};
  const maxUnits = isNum(subIn.maxCharsPerLine) ? subIn.maxCharsPerLine : 12;
  let cues = [];
  if (Array.isArray(subIn.cues) && subIn.cues.length) {
    cues = subIn.cues;
  } else {
    cues = scenes
      .filter((s) => String(s.caption).trim())
      .flatMap((s) => {
        if (s.vo && s.voDuration) {
          const st = (s.from + s.prevOverlap) / fps;
          return splitSceneCues(s.caption, st, st + s.voDuration + 0.05, maxUnits);
        }
        return splitSceneCues(s.caption, s.startSec, s.endSec - 0.08, maxUnits);
      });
  }

  cues = cues
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((c, i, all) => {
      const next = all[i + 1];
      const hardEnd = next ? Math.min(c.end, next.start - 0.05) : c.end;
      return {...c, end: Math.max(c.start + 0.2, hardEnd)};
    });

  const subtitleCues =
    subIn.enabled === false
      ? []
      : cues
          .map((c) => {
            const from = round(c.start * fps);
            const to = round(c.end * fps);
            const duration = Math.max(1, Math.min(to, totalFrames) - from);
            const text = String(c.text).trim();
            // 优先级：显式 lines（build 阶段按词边界排好的两行）> 文本里自带的换行 > 现场断行
            const lines = Array.isArray(c.lines) && c.lines.length
              ? c.lines.map((l) => String(l))
              : text.includes('\n')
                ? text.split('\n')
                : breakCaption(text, maxUnits, 2);
            return {from, duration, start: c.start, end: c.end, text, lines};
          })
          .filter((c) => c.duration > 0 && c.from < totalFrames);

  // 用户角色叠加层：秒 → 帧；校验角色 ID / 动作白名单 / 起止时间 / 位置，夹紧到整片与画布。
  // 媒体存在性不在此处访问文件系统：Node 渲染层把校验结果写入 project._characterMedia。
  const mediaMap = project._characterMedia && typeof project._characterMedia === 'object' ? project._characterMedia : {};
  const characterErrors = [];
  const characters = (Array.isArray(project.characters) ? project.characters : [])
    .map((c, i) => {
      const slotNo = i + 1;
      const errors = [];
      const characterId = typeof c?.characterId === 'string' ? c.characterId : '';
      const action = typeof c?.action === 'string' && c.action ? c.action : 'idle';
      const entry = getCharacterEntry(characterId, action);
      if (!entry) {
        if (!CHARACTER_IDS.includes(characterId)) errors.push(`角色槽位 ${slotNo}：未知角色 ID「${characterId}」`);
        else errors.push(`角色槽位 ${slotNo}：角色「${characterId}」不支持动作「${action}」`);
      }
      const start = isNum(c.start) ? c.start : 0;
      const totalSec = totalFrames / fps;
      const durSec = isNum(c.duration) ? c.duration : Math.max(0.2, totalSec - Math.max(0, start));
      if (!isNum(c.start) || start < 0) errors.push(`角色槽位 ${slotNo}：起始时间必须为不小于 0 的秒数`);
      if (!isNum(c.duration) || durSec <= 0) errors.push(`角色槽位 ${slotNo}：时长必须大于 0 秒`);
      const sx = isNum(c.x) ? c.x : 100;
      const sy = isNum(c.y) ? c.y : 100;
      const sw = isNum(c.width) && c.width > 0 ? c.width : 380;
      const sh = isNum(c.height) && c.height > 0 ? c.height : 380;
      if (!Number.isFinite(sx) || !Number.isFinite(sy)) errors.push(`角色槽位 ${slotNo}：位置必须为有效数字`);
      if (sw <= 0 || sh <= 0) errors.push(`角色槽位 ${slotNo}：宽高必须大于 0`);

      const from = Math.max(0, round(start * fps));
      const duration = Math.max(1, Math.min(round(durSec * fps), totalFrames - from));
      if (from >= totalFrames) errors.push(`角色槽位 ${slotNo}：起始时间超出整片时长`);

      // 位置夹紧到画布内，避免角色出画
      const cw = Math.min(Math.max(40, sw), width);
      const ch = Math.min(Math.max(40, sh), height);
      const cx = Math.min(Math.max(0, sx), Math.max(0, width - cw));
      const cy = Math.min(Math.max(0, sy), Math.max(0, height - ch));
      const opacity = isNum(c.opacity) ? Math.max(0, Math.min(1, c.opacity)) : 1;

      const mediaKey = entry ? `${characterId}/${action}` : null;
      const mediaPresent = mediaKey && Object.prototype.hasOwnProperty.call(mediaMap, mediaKey)
        ? Boolean(mediaMap[mediaKey])
        : null;

      if (errors.length) characterErrors.push(...errors);
      return {
        characterId, action, entry,
        x: cx, y: cy, width: cw, height: ch,
        from, duration, opacity, mediaPresent, errors,
      };
    });

  return {
    fps,
    width,
    height,
    theme,
    meta: project.meta ?? {},
    totalFrames,
    totalSeconds: +(totalFrames / fps).toFixed(3),
    precise,
    scenes,
    characters,
    characterErrors,
    audio: {vo: voTrack, voSegments, bgm, sfx: sfxEvents},
    subtitles: {
      enabled: subIn.enabled !== false && subtitleCues.length > 0,
      cues: subtitleCues,
      safeBottom: isNum(subIn.safeBottom) ? subIn.safeBottom : SAFE_MARGIN,
    },
  };
}

/** 场景内的本地相位：进/出转场各占多少帧 */
export function transitionPhase(scene) {
  return {
    inF: Math.min(scene.prevOverlap, Math.floor(scene.duration * 0.5)),
    outF: Math.min(scene.nextOverlap, Math.floor(scene.duration * 0.5)),
  };
}
