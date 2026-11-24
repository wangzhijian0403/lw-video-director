#!/usr/bin/env python3
"""为 5 条 props 驱动的 standalone 组件生成通用 LW adapter。
这些组件媒体全部由 props 传入（或可关闭），不依赖缺失的上游媒体，可真实渲染。"""
from __future__ import annotations
import json, shutil
from pathlib import Path

VS = Path(__file__).resolve().parents[2]
EXT = VS / "external" / "fredtalk"
CACHE = EXT / ".cache" / "sources"
ADAPTED = EXT / "adapted"

LW_HOST = """import {createContext, useContext} from 'react';
export type LWHostValue = {accent: string; accentDark: string; background: string; ink: string; speed: number; font: string};
export const FredHost = createContext<LWHostValue>({accent:'#8554E8',accentDark:'#D6BEFF',background:'#fff',ink:'#19191c',speed:1,font:'sans-serif'});
export const useHost = () => useContext(FredHost);
"""
SHARED = "export function configureTheme(_o: Record<string, unknown>) {}\n"

# lwId -> (source file, component export, strategy, category, nativeFrames, fps, defaults expr, editableKeys)
ITEMS = {
    "FT-NMC01-457": ("NewsKeywordMatchCut.tsx", "NewsKeywordMatchCut", "standalone", "衔接内容", 180, 30,
        "{pages:[{src:'fredtalk/media/lw-work-01.jpg',durationInFrames:60},{src:'fredtalk/media/lw-work-02.jpg',durationInFrames:60},{src:'fredtalk/media/lw-work-03.jpg',durationInFrames:60}]}",
        ["pages", "audioSrc", "audioVolume"]),
    "FT-INT01-463": ("NewsFocus.tsx", "NewsBrushFocus", "standalone", "说明数据", 210, 30,
        "{src:'fredtalk/media/lw-ui-screenshot.png',sourceWidth:3024,sourceHeight:1712,regions:[{x:.12,y:.18,width:.3,height:.12},{x:.4,y:.5,width:.25,height:.1}],color:'#FFE949'}",
        ["src", "sourceWidth", "sourceHeight", "regions", "color", "zoom"]),
    "FT-INT02-464": ("NewsFocus.tsx", "NewsSpotlightFocus", "standalone", "说明数据", 210, 30,
        "{src:'fredtalk/media/lw-ui-screenshot.png',sourceWidth:3024,sourceHeight:1712,regions:[{x:.12,y:.18,width:.3,height:.12}],dimOpacity:.76}",
        ["src", "sourceWidth", "sourceHeight", "regions", "dimOpacity", "zoom"]),
    "FT-INT04-466": ("WeChatConversation.tsx", "WeChatConversation", "standalone", "衔接内容", 330, 30,
        "{contactName:'项目沟通',withSound:false}",
        ["contactName", "messages", "withSound", "fontFamily"]),
}

ADAPTER_TPL = """import React from 'react';
import {{FredHost}} from './lw-host';
import {{configureTheme}} from './shared';
import {{{comp} as __Component}} from './{mod}';
const __defaults: Record<string, unknown> = {defaults};
export const adapterMeta = {{"id":"{lid}","ftId":"{ftid}","category":"{cat}","nativeFrames":{frames},"fps":{fps},"upstreamRevision":"59b9e9957957dc9f3fd94ab78f95cec33c29e915","strategy":"{strat}"}};
export const defaultProps = __defaults;
export const editableKeys = {keys};
export const sampleProps = __defaults;
export function Adapter(input: {{props?: Record<string, unknown>; accent?: string; background?: string; speed?: number}}) {{
  const p = {{...__defaults, ...(input.props ?? {{}})}};
  configureTheme({{}});
  return <FredHost.Provider value={{{{accent:input.accent??'#8554E8',accentDark:'#D6BEFF',background:input.background??'#fff',ink:'#19191c',speed:input.speed??1,font:'sans-serif'}}}}><__Component {{...(p as any)}} /></FredHost.Provider>;
}}
"""

def main():
    built = []
    for lid, (src, comp, strat, cat, frames, fps, defaults, keys) in ITEMS.items():
        srcdir = CACHE / lid / "src"
        srcfile = srcdir / src
        if not srcfile.exists():
            print("SKIP missing", lid, srcfile); continue
        dest = ADAPTED / lid / "src"
        if dest.exists(): shutil.rmtree(dest)
        dest.mkdir(parents=True, exist_ok=True)
        # 复制所有源码（含同目录依赖）
        for f in srcdir.glob("*"):
            if f.is_file() and f.suffix in (".tsx", ".ts"):
                shutil.copyfile(f, dest / f.name)
        (dest / "lw-host.tsx").write_text(LW_HOST, encoding="utf-8")
        (dest / "shared.tsx").write_text(SHARED, encoding="utf-8")
        ftid = lid.split("-")[1] if "-" in lid else lid
        adapter = ADAPTER_TPL.format(comp=comp, mod=Path(src).stem, defaults=defaults, lid=lid,
                                     ftid=ftid, cat=cat, frames=frames, fps=fps, strat=strat,
                                     keys=json.dumps(keys, ensure_ascii=False))
        (dest / "adapter.tsx").write_text(adapter, encoding="utf-8")
        built.append({"lwId": lid, "component": comp, "frames": frames, "fps": fps, "files": [f.name for f in dest.glob("*")]})
    print(json.dumps(built, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
