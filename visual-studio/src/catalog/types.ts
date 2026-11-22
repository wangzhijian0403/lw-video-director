import type {ComponentType} from 'react';
export type ThemeId='swiss'|'future'|'archive'|'mist-blue-paper';
export type Datum={label:string;value:number};
export type Params={title:string;subtitle:string;color:string;entrance:number;hold:number;exit:number;easing:string;distance:number;rotation:number;scale:number;intensity:number;radius:number;ambient:number;metalness:number;roughness:number;focus:number;aperture:number;chartData:Datum[];unit:string;dataSource:string;imageBefore:string;imageAfter:string;imageFit:'contain'|'cover'};
export type SceneProps={params:Params;theme:ThemeId};
export type ParamKey=keyof Params;
export type ParamDefinition={label:string;type:string;default:unknown;min?:number;max?:number;step?:number;maxLength?:number;options?:string[]};
export type Entry={id:string;name:string;category:string;description:string;duration:number;fps:number;defaultProps:Params;editableParams:ParamKey[];supportedStyles:ThemeId[];source:string;renderStatus:string;visualReviewStatus:string;component:ComponentType<SceneProps>};
