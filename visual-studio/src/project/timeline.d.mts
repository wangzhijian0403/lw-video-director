import type {ProjectFile, Timeline} from './types';

export const DEFAULT_FPS: number;
export const TRANSITIONS: string[];
export const SAFE_MARGIN: number;

export function paramSeconds(params?: Record<string, unknown>): number;
export function breakCaption(text: string, maxUnits?: number, maxLines?: number): string[];
export function parseSrt(raw: string): {start: number; end: number; text: string}[];
export function formatSrt(cues: {start: number; end: number; text: string}[]): string;
export function buildTimeline(project: ProjectFile | Record<string, unknown>): Timeline;
export function transitionPhase(scene: {prevOverlap: number; nextOverlap: number; duration: number}): {
  inF: number;
  outF: number;
};
