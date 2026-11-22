import {AbsoluteFill} from 'remotion';import {catalog} from '../catalog/registry';import type {SceneProps} from '../catalog/types';
// 分镜不再自带底色：底色统一由 ProjectVideo 的纸面层 / 远山背景提供，
// 否则每个分镜都会在缩放区里刷一块实色，和两侧留白之间出现竖直接缝。
export type CompositionProps=SceneProps&{componentId:string};
export function Scene({componentId,...props}:CompositionProps){const entry=catalog.find(c=>c.id===componentId);if(!entry)throw new Error('Unknown component');const Component=entry.component;return <AbsoluteFill style={{overflow:'visible'}}><Component {...props}/></AbsoluteFill>}
