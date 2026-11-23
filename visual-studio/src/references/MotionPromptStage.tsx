import {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {getCell, getMeta} from '../../external/motion-prompt/generated-runtime.js';

export type MotionPromptProps = {id: string; speed: number; scale: number};

/**
 * LW-MP-FULL-240: generic Remotion stage for every upstream Motion Prompt cell.
 * `id` is the zero-padded upstream number (001..240); the cell itself is a pure
 * function of time u, so frame / fps reproduces the official canvas animation.
 */
export function MotionPromptStage({id, speed, scale}: MotionPromptProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  useLayoutEffect(() => {
    const meta = getMeta(id);
    const cell = getCell(id);
    const canvas = ref.current;
    if (!meta || !cell || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 1280, 720);
    ctx.save();
    const factor = Math.min(1280 / meta.width, 720 / meta.height) * scale;
    ctx.translate(640 - meta.width * factor / 2, 360 - meta.height * factor / 2);
    ctx.scale(factor, factor);
    cell(ctx, meta.width, meta.height, (frame / fps * speed) % meta.cycle);
    ctx.restore();
  }, [id, frame, fps, speed, scale]);
  return <canvas ref={ref} width={1280} height={720} style={{width: '100%', height: '100%'}}/>;
}
