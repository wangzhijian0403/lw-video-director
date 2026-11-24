/**
 * User-created character overlay.
 *
 * Media for the five mascots lives in visual-studio/public/characters/ and is
 * part of this repository (user approved, 2026-11-24). Node verifies the files
 * before render; a missing file shows an explicit placeholder instead of a
 * silent black frame.
 *
 * 验收状态：5 角色 × (待机 / 专属动作 / 透明静图) 共 15 条均已通过真实 Remotion
 * 渲染验收（verified-basic）；未登记的动作仍是 wired-pending，渲染显示占位。
 * 未验证无缝循环前，视频一律 loop={false}；媒体在准备阶段裁到安全区间。
 */
import React from 'react';
import {AbsoluteFill, Img, Video, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {getCharacterEntry} from './characterRegistry.mjs';

export type UserCharacterId = 'fish' | 'codex' | 'deepseek' | 'doubao' | 'claude';
export type UserCharacterAction = 'idle' | 'wave' | 'typing' | 'curtsy' | 'share' | 'dance' | 'still';

type ActorEntry = NonNullable<ReturnType<typeof getCharacterEntry>>;

export type UserCharacterActorProps = {
  characterId: string;
  action?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  durationInFrames?: number;
  enterFrames?: number;
  opacity?: number;
  /** 时间轴已解析的注册表条目；缺省时组件内部回退查询 */
  entry?: ActorEntry | null;
  /** null=未做文件系统校验；false=Node 层确认私有媒体缺失 */
  mediaPresent?: boolean | null;
  errors?: string[];
};

const Placeholder: React.FC<{tone: 'error' | 'missing' | 'pending'; title: string; lines: string[]}> = ({tone, title, lines}) => {
  const border = tone === 'error' ? '#d9534f' : tone === 'missing' ? '#e0a93c' : '#8a97a8';
  const color = tone === 'error' ? '#ffb4ae' : tone === 'missing' ? '#f3d9a0' : '#c3ccd8';
  return (
    <AbsoluteFill style={{
      border: `2px dashed ${border}`,
      borderRadius: 12,
      background: 'rgba(8, 16, 26, 0.78)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      gap: 6,
      textAlign: 'center',
      color,
      fontFamily: 'monospace',
    }}>
      <div style={{fontWeight: 700, fontSize: 18}}>{title}</div>
      {lines.map((l, i) => <div key={i} style={{fontSize: 13, opacity: 0.9}}>{l}</div>)}
    </AbsoluteFill>
  );
};

export const UserCharacterActor: React.FC<UserCharacterActorProps> = ({
  characterId, action = 'idle', x = 100, y = 100, width = 380, height = 380,
  durationInFrames = 240, enterFrames = 8, opacity = 1,
  entry, mediaPresent = null, errors = [],
}) => {
  const frame = useCurrentFrame();
  const resolved: ActorEntry | null = entry ?? getCharacterEntry(characterId, action);

  if (!Number.isFinite(durationInFrames) || durationInFrames <= 0) {
    return (
      <AbsoluteFill>
        <Placeholder tone="error" title="角色槽位配置错误" lines={['durationInFrames 必须为正数']} />
      </AbsoluteFill>
    );
  }

  const t = enterFrames > 0
    ? interpolate(frame, [0, enterFrames], [0, 1], {extrapolateRight: 'clamp'})
    : 1;

  let body: React.ReactNode;
  if (errors.length > 0 || !resolved) {
    body = <Placeholder tone="error" title="角色槽位配置错误" lines={errors.length ? errors : [`未知角色/动作：${characterId}/${action}`]} />;
  } else if (mediaPresent === false) {
    body = <Placeholder tone="missing" title="缺少角色媒体" lines={[`characters/${resolved.file}`, '文件未落盘，请检查 public/characters 目录']} />;
  } else if (resolved.status !== 'verified-basic') {
    body = <Placeholder tone="pending" title="动作待验收" lines={[`${characterId}/${action}`, resolved.note]} />;
  } else if (resolved.kind === 'image') {
    body = <Img src={staticFile(`characters/${resolved.file}`)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />;
  } else {
    // 媒体在准备阶段已按 safeRange 裁短；这里不做帧裁剪，禁止自动循环
    body = (
      <Video
        src={staticFile(`characters/${resolved.file}`)}
        muted
        loop={false}
        style={{width: '100%', height: '100%', objectFit: 'contain'}}
      />
    );
  }

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{
        position: 'absolute', left: x, top: y, width, height,
        opacity: Math.max(0, Math.min(1, opacity)) * t,
        transform: `translateY(${(1 - t) * 12}px)`,
      }}>
        {body}
      </div>
    </AbsoluteFill>
  );
};
