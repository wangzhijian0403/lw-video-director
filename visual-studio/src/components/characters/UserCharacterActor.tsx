/**
 * User-created character overlay.
 *
 * Media is private and MUST NOT be committed: user locally places
 * characterId-action.webm (VP9 alpha) and characterId-transparent.png
 * under visual-studio/public/characters/.
 *
 * Code review state: WIRED ONLY. E2E Remotion+Chrome alpha/animation validation
 * remains pending; alpha metadata and FFmpeg composite are NOT E2E evidence.
 */
import React from 'react';
import {AbsoluteFill, Img, Video, interpolate, staticFile, useCurrentFrame} from 'remotion';

export type UserCharacterId = 'fish' | 'codex' | 'deepseek' | 'doubao' | 'claude';
export type UserCharacterAction = 'idle' | 'wave' | 'typing' | 'curtsy' | 'share' | 'dance' | 'still';

const allowed: Record<UserCharacterId, readonly UserCharacterAction[]> = {
  fish: ['idle', 'wave', 'still'],
  codex: ['idle', 'typing', 'still'],
  deepseek: ['idle', 'curtsy', 'still'],
  doubao: ['idle', 'share', 'still'],
  claude: ['idle', 'dance', 'still'],
};

export type UserCharacterActorProps = {
  characterId: UserCharacterId;
  action?: UserCharacterAction;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  durationInFrames?: number;
  enterFrames?: number;
  opacity?: number;
};

export const UserCharacterActor: React.FC<UserCharacterActorProps> = ({
  characterId, action = 'idle', x = 100, y = 100, width = 380, height = 380,
  durationInFrames = 240, enterFrames = 8, opacity = 1,
}) => {
  const frame = useCurrentFrame();
  if (!allowed[characterId].includes(action)) {
    throw new Error("Unsupported character action: " + characterId + "/" + action);
  }
  if (!Number.isFinite(durationInFrames) || durationInFrames <= 0) {
    throw new Error("durationInFrames must be positive");
  }
  const t = enterFrames > 0
    ? interpolate(frame, [0, enterFrames], [0, 1], {extrapolateRight: 'clamp'})
    : 1;
  const image = action === 'still';
  const src = staticFile("characters/" + characterId +
    (image ? "-transparent.png" : "-" + action + ".webm"));
  const mediaStyle: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'contain'};
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{
        position: 'absolute', left: x, top: y, width, height,
        opacity: Math.max(0, Math.min(1, opacity)) * t,
        transform: "translateY(" + ((1 - t) * 12) + "px)",
      }}>
        {image
          ? <Img src={src} style={mediaStyle} />
          : <Video src={src} muted style={mediaStyle} />}
      </div>
    </AbsoluteFill>
  );
};
