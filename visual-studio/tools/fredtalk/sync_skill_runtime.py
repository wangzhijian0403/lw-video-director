#!/usr/bin/env python3
"""Install verified FredTalk runtime into the ai-video-director Skill copy.

The Skill ships its own visual-studio snapshot (v0.3.0-preview.1) which has a
NEWER multi-shot engine (ProjectVideo / buildTimeline) than the FredTalk batch
branch. Therefore we do a careful INCREMENTAL merge, never a wholesale copy:

  - copy (new, non-conflicting): adapted/<ID>/, registry data+generated,
    placeholders.tsx, public/fredtalk/, tools/fredtalk/, batch evidence,
    external/catalog.json (superset of fields, same 672 ids)
  - merge (preserve Skill's ProjectVideo engine): src/remotion/root.tsx adds
    FredTalk Compositions; render.mjs adds Fred render helpers; server.mjs adds
    fred-batch / fred-step-chain branches to /api/render-reference

Every changed Skill file is backed up first. Idempotent: re-running replaces
only generated blocks marked by BEGIN/END sentinels.
"""
import json
import pathlib
import shutil
import sys

WT = pathlib.Path(r"D:/Codex工作目录/lw-fredtalk-full-LW-FT-FULL-001/visual-studio")
SK = pathlib.Path(r"D:/workbuddy工作目录/.workbuddy/skills/ai-video-director/visual-studio")
BACKUP = pathlib.Path(r"D:/Codex工作目录/lw-fredtalk-full-LW-FT-FULL-001/review/LWFT-FULL-84/skill-backup")
BLOCK = lambda tag: (f"// --- LW-FT-FULL-001 {tag} BEGIN ---",
                     f"// --- LW-FT-FULL-001 {tag} END ---")


def backup(rel):
    src = SK / rel
    if not src.exists():
        return
    dst = BACKUP / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists():
        shutil.copy2(src, dst)
        print("backup", rel)


def replace_block(text, tag, body):
    b, e = BLOCK(tag)
    if b in text and e in text:
        pre, rest = text.split(b, 1)
        _, post = rest.split(e, 1)
        return pre + b + "\n" + body + "\n" + e + post
    return text.rstrip() + "\n" + b + "\n" + body + "\n" + e + "\n"


def copy_tree(src, dst):
    if not src.exists():
        print("  SKIP (missing)", src)
        return 0
    n = 0
    for p in src.rglob("*"):
        if p.is_file():
            rel = p.relative_to(src)
            t = dst / rel
            t.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, t)
            n += 1
    return n


def main():
    if not SK.exists():
        print("ERROR: Skill visual-studio not found")
        return 1
    BACKUP.mkdir(parents=True, exist_ok=True)

    # ---- 1. pure additions -------------------------------------------------
    adds = [
        ("external/fredtalk/adapted", "external/fredtalk/adapted"),
        ("src/references/fredtalk-registry.data.json", "src/references/fredtalk-registry.data.json"),
        ("src/references/fredtalk-registry.generated.tsx", "src/references/fredtalk-registry.generated.tsx"),
        ("src/remotion/placeholders.tsx", "src/remotion/placeholders.tsx"),
        ("public/fredtalk", "public/fredtalk"),
        ("tools/fredtalk", "tools/fredtalk"),
        ("external/fredtalk/batch/full-library", "external/fredtalk/batch/full-library"),
    ]
    for s, d in adds:
        src, dst = WT / s, SK / d
        if src.is_dir():
            n = copy_tree(src, dst)
        elif src.is_file():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            n = 1
        else:
            n = 0
            print("  SKIP (missing)", s)
        print(f"copy {s} -> {n} files")

    # catalog.json: same 672 ids, worktree has the verified executable flags
    backup("external/catalog.json")
    shutil.copy2(WT / "external/catalog.json", SK / "external/catalog.json")
    print("copy external/catalog.json (verified executable flags)")

    # ---- 2. incremental merges --------------------------------------------
    # 2a. root.tsx: keep Skill's ProjectVideo, add FredTalk compositions
    backup("src/remotion/root.tsx")
    root = (SK / "src/remotion/root.tsx").read_text(encoding="utf-8")
    imports = ("import {FredTalkAdapter} from '../references/FredTalkAdapter';\n"
               "import {fredDefaults} from '../references/fred-props.mjs';\n"
               "import {fredBatch} from '../references/fredtalk-registry.generated';\n"
               "import {Placeholders} from './placeholders';\n")
    bi, ei = BLOCK("ROOT-IMPORTS")
    if bi not in root:
        # imports must sit at module top level, before any other statement
        root = bi + "\n" + imports.rstrip() + "\n" + ei + "\n" + root
    comps = ("      <Placeholders/>\n"
             "      <Composition id=\"REF-FT-T03E\" component={FredTalkAdapter} width={1280} height={720} "
             "fps={60} durationInFrames={420} defaultProps={fredDefaults} "
             "calculateMetadata={({props}) => ({durationInFrames: Math.ceil(420 / props.speed)})}/>\n"
             "      {fredBatch.map((e) => (\n"
             "        <Composition key={e.id} id={`REF-${e.id}`} component={e.adapter} width={1280} height={720} "
             "fps={e.fps} durationInFrames={e.nativeFrames} "
             "defaultProps={{props: e.sampleProps, accent: e.accent, background: e.background, speed: 1}} "
             "calculateMetadata={({props}) => ({durationInFrames: Math.ceil(e.nativeFrames / (((props as {speed?: number}).speed) ?? 1))})}/>\n"
             "      ))}\n")
    # Insert compositions right after the opening fragment of Root(), wrapped in
    # JSX comment sentinels so re-running is a no-op (no duplicate Compositions).
    b, e = BLOCK("ROOT-COMPS")
    if b not in root:
        jb = "      {/* " + b + " */}"
        je = "      {/* " + e + " */}"
        comps_block = jb + "\n" + comps + je + "\n"
        marker = "    <>\n"
        if marker in root:
            root = root.replace(marker, marker + comps_block, 1)
        else:
            print("  WARN: root.tsx Root() fragment marker not found; compositions not inserted")
    (SK / "src/remotion/root.tsx").write_text(root, encoding="utf-8")
    print("merge root.tsx (FredTalk compositions + placeholders)")

    # 2b. render.mjs: add Fred render helpers
    backup("render.mjs")
    rm = (SK / "render.mjs").read_text(encoding="utf-8")
    helpers = (WT / "render.mjs").read_text(encoding="utf-8")
    fred_start = helpers.index("export async function renderFredReference")
    fred_body = helpers[fred_start:]
    rm = replace_block(rm, "RENDER-FRED", fred_body.rstrip())
    (SK / "render.mjs").write_text(rm, encoding="utf-8")
    print("merge render.mjs (renderFredReference / renderFredComponent)")

    # 2c. server.mjs: add imports and the fred-batch branches
    backup("server.mjs")
    sm = (SK / "server.mjs").read_text(encoding="utf-8")
    sm = sm.replace("import {renderVideo,renderReference} from './render.mjs';",
                    "import {renderVideo,renderReference,renderFredReference,renderFredComponent} from './render.mjs';\n"
                    "import {validateFredProps} from './src/references/fred-props.mjs';")
    old = ("if(req.method==='POST'&&url.pathname==='/api/render-reference'){const data=await body(req);"
           "const asset=searchAssets('','references').find(c=>c.id===data.id);")
    new = ("if(req.method==='POST'&&url.pathname==='/api/render-reference'){const data=await body(req);"
           "const candidate=searchAssets('','references').find(c=>c.id===data.id);"
           "if(candidate?.executable&&candidate.adapter==='fred-step-chain'){const props=validateFredProps(data.props);"
           "startJob(res,(file,progress)=>renderFredReference(props,file,progress));return}"
           "if(candidate?.executable&&candidate.adapter==='fred-batch'){"
           "startJob(res,(file,progress)=>renderFredComponent(data,file,progress));return}"
           "const asset=searchAssets('','references').find(c=>c.id===data.id);")
    if old not in sm:
        print("  WARN: server.mjs render-reference pattern not found")
    else:
        sm = sm.replace(old, new, 1)
    (SK / "server.mjs").write_text(sm, encoding="utf-8")
    print("merge server.mjs (fred-batch / fred-step-chain render branches)")

    # ---- 3. sanity ---------------------------------------------------------
    cat = json.loads((SK / "external/catalog.json").read_text(encoding="utf-8"))
    ft_exec = [c["id"] for c in cat if str(c.get("id", "")).startswith("FT-") and c.get("executable")]
    reg = json.loads((SK / "src/references/fredtalk-registry.data.json").read_text(encoding="utf-8"))
    missing = [i for i in ft_exec if not (SK / "external/fredtalk/adapted" / i / "src/adapter.tsx").exists()]
    print(json.dumps({"skillFredtalkExecutable": len(ft_exec), "registryEntries": len(reg),
                      "executableMissingAdapter": missing}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
