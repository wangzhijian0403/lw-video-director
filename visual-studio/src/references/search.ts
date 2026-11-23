export type AssetRecord={id:string;name:string;category:string;description:string;library:'originals'|'references';provider:string;executable:boolean;installStatus:string;renderStatus:string;sourceAvailable?:boolean;officialUrl?:string;license?:string;licenseUrl?:string;previewUrl?:string|null;adapter?:string|null};
import {searchAssets as query,productionCandidates as ready} from '../catalog/search.mjs';
export const searchAssets=(q:string,library?:'originals'|'references',provider?:string,category?:string)=>query(q,library,provider,category) as AssetRecord[];
export const productionCandidates=()=>ready() as AssetRecord[];
