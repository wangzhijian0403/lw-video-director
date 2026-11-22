import type {Params, ThemeId} from '../catalog/types';
import type {UserCharacterId, UserCharacterAction} from '../components/characters/UserCharacterActor';
import type {IconOverlayCue} from '../components/resources/IconOverlay';

export type TransitionType = 'cut' | 'fade' | 'slide' | 'zoom' | 'wipe';

/** 时间轴上的用户角色叠加槽位（私有本地媒体，不进 Git / 不上传） */
export type CharacterSlot = {
  characterId: UserCharacterId;
  action?: UserCharacterAction;
  /** 1920×1080 基准坐标 */
  x: number;
  y: number;
  width: number;
  height: number;
  /** 秒；缺省从 0 开始，时长缺省吃到整片末尾 */
  start?: number;
  duration?: number;
  opacity?: number;
};

export type Transition = {type: TransitionType; duration: number};

export type SceneSpec = {
  id?: string;
  /** catalog 组件编号，如 TYPE-001 */
  component: string;
  params?: Partial<Params>;
  theme?: ThemeId;
  /** 口播文本：用于字幕与按字数分配时长 */
  text?: string;
  /** 屏幕字幕文本，缺省用 text */
  caption?: string;
  /** 秒；不填则由 vo 时长按字数比例分配，再退到组件参数时长 */
  duration?: number;
  transition?: Transition;
};

export type AudioInput = {
  src: string;
  start?: number;
  duration?: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
};

export type SubtitleCueInput = {start: number; end: number; text: string};

export type ProjectFile = {
  meta: {
    title?: string;
    width?: number;
    height?: number;
    fps?: number;
    theme?: ThemeId;
    style?: string;
    /** 背景层：目前支持 mist-mountains（分层视差青山 + 雾） */
    backdrop?: 'mist-mountains' | 'none';
    backdropHaze?: number;
    backdropParallax?: number;
    voDuration?: number;
  };
  /** vo：口播音频（相对 project.json 的路径或 URL） */
  audio?: {vo?: string | AudioInput; bgm?: AudioInput | AudioInput[]};
  /** 音效点位，name 对应 public/sfx/<name>.wav */
  sfx?: {name: string; at: number; volume?: number}[];
  subtitles?: {
    enabled?: boolean;
    cues?: SubtitleCueInput[];
    /** CLI 解析 SRT 后回填的 cues */
    srt?: string;
    maxCharsPerLine?: number;
    safeBottom?: number;
  };
  timing?: 'vo' | 'fixed';
  voDuration?: number;
  scenes: SceneSpec[];
  /** 用户角色叠加槽位（私有本地媒体） */
  characters?: CharacterSlot[];
  /** 可叠加在任意镜头之上的已许可本地图标；与 FredTalk/原创 MG 场景并存 */
  iconOverlays?: IconOverlayCue[];
  /** Node 渲染层写入的媒体存在性校验表：`角色/动作 -> 是否存在`，浏览器侧不生成 */
  _characterMedia?: Record<string, boolean>;
};

// ---- 以下为 buildTimeline() 的输出结构（渲染侧只读） ----
export type TimelineScene = {
  id: string;
  component: string;
  params: Partial<Params>;
  theme: ThemeId;
  text: string;
  caption: string;
  transition: Transition;
  from: number;
  duration: number;
  prevOverlap: number;
  nextOverlap: number;
  startSec: number;
  endSec: number;
};

export type TimelineCue = {from: number; duration: number; start: number; end: number; text: string; lines: string[]};

/** 角色条目（与 characterRegistry.mjs 对齐的宽松结构，渲染侧只读） */
export type CharacterEntryInfo = {
  status: 'verified-basic' | 'wired-pending';
  kind: 'video' | 'image';
  file: string;
  safeRange?: {start: number; end: number};
  loopAllowed: boolean;
  note: string;
};

export type TimelineCharacter = {
  characterId: string;
  action: string;
  entry: CharacterEntryInfo | null;
  x: number;
  y: number;
  width: number;
  height: number;
  from: number;
  duration: number;
  opacity: number;
  /** null = 未做文件系统校验（浏览器侧）；false = Node 层确认私有媒体缺失 */
  mediaPresent: boolean | null;
  errors: string[];
};

export type Timeline = {
  fps: number;
  width: number;
  height: number;
  theme: ThemeId;
  meta: ProjectFile['meta'];
  totalFrames: number;
  totalSeconds: number;
  scenes: TimelineScene[];
  characters: TimelineCharacter[];
  characterErrors: string[];
  audio: {
    vo: {src: string; from: number; start: number; duration: number; volume: number; fadeIn: number; fadeOut: number} | null;
    /** 分镜配音：每条独立落轨 */
    voSegments: {src: string; sceneId: string; from: number; duration: number; volume: number}[];
    bgm: {src: string; start: number; volume: number; fadeIn: number; fadeOut: number; duration?: number}[];
    sfx: {name: string; src: string; from: number; at: number; volume: number; anchor: string | null}[];
  };
  subtitles: {enabled: boolean; cues: TimelineCue[]; safeBottom: number};
};
