/**
 * Reusable Tabler SVG visual overlay for ANY ProjectVideo scene.
 *
 * Only local, pinned, MIT-licensed SVG files are allowed. CSS masks tint them
 * without altering source files. Separate visual overlays from MG scene IDs.
 * This component does not imply auto-director / semantic matching is solved.
 */
import React from 'react';
import {interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import pack from '../../resource-packs/tabler-outline.json' with {type: 'json'};

export type IconOverlayCue = {
  id: string; // tabler:brain, tabler:photo, ...
  at: number; // seconds on full timeline
  duration: number; // seconds; never silently loop
  x: number; y: number; size: number; // actual output pixels
  color?: string; // #RRGGBB
  opacity?: number;
  motion?: 'reveal' | 'float' | 'pulse' | 'wipe';
  plate?: 'none' | 'soft';
  label?: string;
};
const sourceById = new Map(pack.entries.map((item) => [item.id, item.publicPath]));
export const isApprovedIcon = (id: string): boolean => sourceById.has(id);

export const IconOverlay: React.FC<{cue: IconOverlayCue; durationInFrames: number}> = ({cue, durationInFrames}) => {
  const source = sourceById.get(cue.id);
  if (!source) throw new Error('Unknown/blocked resource icon: ' + cue.id);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = Math.min(12, Math.max(3, Math.floor(durationInFrames * 0.2)));
  const leave = Math.min(9, Math.max(3, Math.floor(durationInFrames * 0.12)));
  const appear = interpolate(frame, [0, enter], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const disappear = interpolate(frame, [Math.max(enter + 1, durationInFrames - leave), durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const active = Math.max(0, Math.min(1, appear * disappear));
  const mode = cue.motion ?? 'reveal';
  const offset = mode === 'float'
    ? (1 - appear) * 22 + Math.sin((frame / fps) * 2.1) * 5
    : (1 - appear) * 22;
  const scale = (0.88 + 0.12 * appear) * (mode === 'pulse' ? 1 + Math.sin((frame / fps) * 3.2) * 0.035 : 1);
  const wipe = mode === 'wipe' ? 'inset(0 ' + ((1 - appear) * 100) + '% 0 0)' : 'none';
  const opacity = typeof cue.opacity === 'number' ? Math.max(0, Math.min(1, cue.opacity)) : 1;
  const color = cue.color ?? '#1F6375';
  const svg = staticFile(source);
  const mask = 'url("' + svg + '")';
  const size = cue.size;
  const padded = cue.plate === 'soft';
  const halo = padded ? Math.round(size * 0.13) : 0;
  const label = cue.label?.trim().slice(0, 20);

  return (
    <div style={{
      position: 'absolute', left: cue.x, top: cue.y, width: size,
      pointerEvents: 'none', display: 'flex', alignItems: 'center', flexDirection: 'column',
      opacity: opacity * active, clipPath: wipe,
      transform: 'translateY(' + offset + 'px) scale(' + scale + ')',
      transformOrigin: 'center center',
    }}>
      <div style={{
        width: size, height: size, borderRadius: padded ? Math.round(size * 0.22) : 0,
        background: padded ? 'rgba(248,250,249,0.90)' : 'transparent',
        boxShadow: padded ? '0 12px 36px rgba(18,42,56,0.12)' : 'none',
        boxSizing: 'border-box', padding: halo,
      }}>
        <div style={{
          width: '100%', height: '100%', backgroundColor: color,
          WebkitMaskImage: mask, maskImage: mask,
          WebkitMaskSize: 'contain', maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center', maskPosition: 'center',
        }} />
      </div>
      {label ? <div style={{
        maxWidth: size * 2.4, minWidth: size, textAlign: 'center', marginTop: Math.round(size * 0.09),
        fontSize: Math.max(16, Math.min(37, Math.round(size * 0.21))),
        fontWeight: 700, lineHeight: 1.25, color,
        fontFamily: "'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif",
        textShadow: '0 1px 4px rgba(255,255,255,0.8)',
        whiteSpace: 'nowrap',
      }}>{label}</div> : null}
    </div>
  );
};
