export type MotionPromptMeta = {
  pack: string; no: number; width: number; height: number; cycle: number;
  frames: number; name: string; slug: string; category: string;
};
export type MotionPromptCell = (ctx: CanvasRenderingContext2D, w: number, h: number, u: number) => void;
export function getCell(id: string): MotionPromptCell | null;
export function getMeta(id: string): MotionPromptMeta | null;
export const REGISTRY: Record<string, MotionPromptMeta>;
export const PACKS: Record<string, unknown[]>;
