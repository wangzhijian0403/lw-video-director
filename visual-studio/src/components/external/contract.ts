/**
 * 外部组件适配接口（统一参数入口）
 *
 * 为什么要有这一层：
 * 后面要接的东西品类完全不同——SVG 图形动画、Lottie、图像分层、动态卡片、角色动画、
 * 音效事件映射——但它们进片子的方式其实只有一个：占一个时间段 + 一个矩形区域 +
 * 一份主题色 + 一组参数。所以先把这个「进片合同」定死，接谁都不用改镜头组件。
 *
 * 状态四态（任何一个适配器只能处于其中一态，不许含糊）：
 *   declared  已在清单里立项，代码没接，片子不会渲染它
 *   wired     代码接进来了，参数能传，但没在成片里出过帧
 *   verified  在真实工程里渲过帧/出过片，有帧号或 sha256 可查
 *   licensed  除 verified 外，授权与商用具结清（素材来源、字体、AIGC 标识）
 *
 * 注意：本文件只定义类型与解析函数，不含任何真实外部素材；接入方自己往 registry 里注册。
 */
import type {ThemeId} from '../../catalog/types';

export type ExternalKind =
  | 'svg-motion'
  | 'lottie'
  | 'image-layers'
  | 'dynamic-card'
  | 'character-rig'
  | 'sfx-event-map';

export type AdapterState = 'declared' | 'wired' | 'verified' | 'licensed';

/** 外部组件进片时要遵守的框：只允许在这些范围内落东西 */
export interface SafeBox {
  /** 画布坐标（1920×1080 基准，组件自己按 meta 缩放） */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 时间轴上的一个槽：微秒口径与剪映一致，避免两套单位换来换去 */
export interface ExternalSlot {
  kind: ExternalKind;
  /** 槽的唯一名，同一工程内不可重复，用于日志与 QA 定位 */
  id: string;
  /** 进入/退出时间（毫秒，相对本场景起点） */
  startMs: number;
  endMs: number;
  box: SafeBox;
  theme: ThemeId;
  /** 只允许主题色板内的键，禁止外部组件自带品牌色 */
  paletteKeys: Array<'ink' | 'muted' | 'accent' | 'page' | 'fiber' | 'water'>;
  /** 组件自己的参数，必须可 JSON 序列化，禁止传函数/实例 */
  params: Record<string, unknown>;
  /** 入场/出场，统一走这三档，避免每个库一套缓动 */
  enter?: 'none' | 'fade' | 'wipe';
  exit?: 'none' | 'fade' | 'wipe';
  /** 该槽的降级方案：外部组件加载失败时渲染什么（必须是本仓已有组件名） */
  fallbackComponent?: string;
}

export interface ExternalAdapter {
  kind: ExternalKind;
  /** 适配器实现名，用于日志 */
  adapter: string;
  state: AdapterState;
  /** 已接入时填：渲染函数所在的模块路径 */
  module?: string;
  /** verified 时填：验证用工程与帧号/秒数 */
  evidence?: {
    project: string;
    atSeconds: number[];
    sha256?: string;
    checkedAt: string;
  };
  /** licensed 时填：素材来源与授权 */
  license?: {
    source: string;
    license: string;
    commercialUse: boolean;
    aigcDisclosure: boolean;
  };
  /** 已知限制，交付时照抄，不许省略 */
  limits?: string[];
}

export class ExternalSlotError extends Error {}

const KIND_STATE_ORDER: AdapterState[] = ['declared', 'wired', 'verified', 'licensed'];

/** 安全区：正文区 x 102–1178 / y 60–580（字幕条在 580 以下，不许压） */
export const SAFE_BOX = {x: 102, y: 60, w: 1076, h: 520};

export const assertSlot = (slot: ExternalSlot): ExternalSlot => {
  if (!slot.id || !/^[a-z0-9-]{3,}$/.test(slot.id)) {
    throw new ExternalSlotError(`槽 id 非法：${slot.id}`);
  }
  if (slot.endMs <= slot.startMs) {
    throw new ExternalSlotError(`槽 ${slot.id} 时长必须为正：${slot.startMs}→${slot.endMs}`);
  }
  const bx = slot.box;
  if (bx.x < SAFE_BOX.x || bx.y < SAFE_BOX.y || bx.x + bx.w > SAFE_BOX.x + SAFE_BOX.w || bx.y + bx.h > SAFE_BOX.y + SAFE_BOX.h) {
    throw new ExternalSlotError(`槽 ${slot.id} 越出安全区：${JSON.stringify(bx)}`);
  }
  if (slot.fallbackComponent === undefined) {
    throw new ExternalSlotError(`槽 ${slot.id} 缺 fallbackComponent，外部组件失败会直接黑屏`);
  }
  return slot;
};

/** 只放行已经到 verified 及以上的适配器；declared / wired 一律不渲染 */
export const pickRenderable = (adapters: ExternalAdapter[]): ExternalAdapter[] =>
  adapters.filter((a) => KIND_STATE_ORDER.indexOf(a.state) >= 2);

export const stateLabel = (state: AdapterState): string =>
  ({declared: '未接入', wired: '已接入', verified: '已渲染验证', licensed: '具备发布许可'})[state];
