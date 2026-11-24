#!/usr/bin/env python3
"""把 4 条已验证真渲+QA 的 props 驱动 standalone 组件正式注册进工作台。
注册点：catalog.json / fredtalk-registry.data.json / fredtalk-registry.generated.tsx。
生成：每条的 provenance.json / props.json。
"""
from __future__ import annotations
import json, hashlib
from pathlib import Path

VS = Path(__file__).resolve().parents[2]
EXT = VS / "external"
ADAPTED = EXT / "fredtalk" / "adapted"

# (id, ftId, name, category, frames, fps, accent, background, sampleProps, editableKeys)
ITEMS = [
    ("FT-NMC01-457", "NMC01", "新闻关键词快闪", "衔接内容", 180, 30, "#8554E8", "#111111",
     {"pages":[{"src":"fredtalk/media/lw-work-01.jpg","durationInFrames":60},{"src":"fredtalk/media/lw-work-02.jpg","durationInFrames":60},{"src":"fredtalk/media/lw-work-03.jpg","durationInFrames":60}]},
     ["pages","audioSrc","audioVolume"]),
    ("FT-INT01-463", "INT01", "新闻要点高亮扫过", "说明数据", 210, 30, "#FFE949", "#ffffff",
     {"src":"fredtalk/media/lw-ui-screenshot.png","sourceWidth":3024,"sourceHeight":1712,"regions":[{"x":.12,"y":.18,"width":.3,"height":.12},{"x":.4,"y":.5,"width":.25,"height":.1}],"color":"#FFE949"},
     ["src","sourceWidth","sourceHeight","regions","color","zoom"]),
    ("FT-INT02-464", "INT02", "新闻要点聚光聚焦", "说明数据", 210, 30, "#8554E8", "#ffffff",
     {"src":"fredtalk/media/lw-ui-screenshot.png","sourceWidth":3024,"sourceHeight":1712,"regions":[{"x":.12,"y":.18,"width":.3,"height":.12}],"dimOpacity":.76},
     ["src","sourceWidth","sourceHeight","regions","dimOpacity","zoom"]),
    ("FT-INT04-466", "INT04", "聊天消息流动画", "衔接内容", 330, 30, "#9FEF9C", "#fafafa",
     {"contactName":"项目沟通","withSound":False},
     ["contactName","messages","withSound","fontFamily"]),
]

def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest() if Path(p).exists() else ""

def main():
    cat_path = EXT / "catalog.json"
    reg_data_path = VS / "src" / "references" / "fredtalk-registry.data.json"
    reg_gen_path = VS / "src" / "references" / "fredtalk-registry.generated.tsx"

    catalog = json.loads(cat_path.read_text(encoding="utf-8"))
    reg_data = json.loads(reg_data_path.read_text(encoding="utf-8"))
    gen = reg_gen_path.read_text(encoding="utf-8")
    cat_map = {x["id"]: x for x in catalog}

    existing = {e["id"] for e in reg_data}
    new_imports = []
    new_entries = []
    added = []
    for lid, ftid, name, cat, frames, fps, accent, bg, sample, keys in ITEMS:
        adapter = ADAPTED / lid / "src" / "adapter.tsx"
        if not adapter.exists():
            print("SKIP no adapter", lid); continue
        idx = 133 + len(added)  # 现有 133 条
        # provenance / props
        src_files = ADAPTED / lid / "src"
        files = [{"path": f.name, "sha256": sha(f)} for f in sorted(src_files.glob("*.tsx"))]
        ADAPTED.joinpath(lid, "provenance.json").write_text(json.dumps({
            "lwId": lid, "ftId": ftid, "name": name, "category": cat, "strategy": "standalone-verified",
            "adapterVersion": "fred-standalone/1.0",
            "sourceSha256": sha(adapter),
            "upstream": {"revision":"59b9e9957957dc9f3fd94ab78f95cec33c29e915","publicTag":"v2.5.0","officialUrl":"https://www.fred-fu.com/visual-library"},
            "license": {"firstPartyCode":"MIT (FredTalk owner grant 2026-10-13)","thirdPartyMedia":"not covered; LW placeholders used for screenshot/video props","font":"system font stack (upstream font not redistributed)","audio":"omitted (withSound=false default)","attribution":"FredTalk component library; adapted by LW, not claimed as LW original"},
            "note": "props 驱动媒体组件，示例使用 LW 占位素材；渲染真实组件、非静态截图。",
        }, ensure_ascii=False, indent=2), encoding="utf-8")
        ADAPTED.joinpath(lid, "props.json").write_text(json.dumps({
            "defaultProps": sample, "editableKeys": keys, "accent": accent, "background": bg,
            "notes": "媒体路径由 props 传入；替换为你的图片/视频即可。",
        }, ensure_ascii=False, indent=2), encoding="utf-8")

        a_sha = sha(adapter)
        # registry data
        reg_data.append({
            "id": lid, "ftId": ftid, "name": name, "category": cat, "strategy": "standalone-verified",
            "nativeFrames": frames, "fps": fps, "width": 1280, "height": 720,
            "accent": accent, "background": bg, "sampleProps": sample, "editableKeys": keys,
            "sourceSha256": a_sha, "adapterSha256": a_sha, "adapterVersion": "fred-standalone/1.0",
            "importPath": f"../../external/fredtalk/adapted/{lid}/src/adapter", "sourceFrames": frames,
        })
        # generated import + entry
        new_imports.append(f"import {{Adapter as A{idx}, defaultProps as D{idx}, adapterMeta as M{idx}}} from '../../external/fredtalk/adapted/{lid}/src/adapter';")
        new_entries.append('  {adapter:A%d, defaultProps:D%d, meta:M%d, id:"%s", nativeFrames:%d, fps:%d, accent:"%s", background:"%s", sampleProps:%s, editableKeys:%s, sourceFrames:%d, sourceSha256:"%s", adapterSha256:"%s", adapterVersion:"fred-standalone/1.0"},' % (
            idx, idx, idx, lid, frames, fps, accent, bg,
            json.dumps(sample, ensure_ascii=False), json.dumps(keys, ensure_ascii=False), frames, a_sha, a_sha))
        # catalog
        if lid in cat_map:
            c = cat_map[lid]
            c["installStatus"] = "source-adapted-verified"
            c["renderStatus"] = "passed"
            c["executable"] = True
            c["adapter"] = "fred-batch"
            c["previewStatus"] = "rendered"
        added.append(lid)

    if not added:
        print("nothing to add"); return

    # 追加 import（在最后一条 import 之后）
    anchor = [l for l in gen.split("\n") if l.startswith("import {Adapter as A")][-1]
    gen = gen.replace(anchor, anchor + "\n" + "\n".join(new_imports), 1)
    # 追加数组项（在最后一个 ]; 之前）
    gen = gen.replace("\n];\n", "\n" + "\n".join(new_entries) + "\n];\n", 1)

    cat_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    reg_data_path.write_text(json.dumps(reg_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    reg_gen_path.write_text(gen, encoding="utf-8")
    print("promoted", len(added), added)
    print("registry", len(reg_data), "catalog executable",
          sum(1 for x in catalog if x.get("provider")=="FredTalk" and x.get("executable")))

if __name__ == "__main__":
    main()
