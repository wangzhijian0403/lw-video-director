"""FredTalk adapter generator + batch orchestration.

Two strategies are implemented for round 1 and are reusable for the rest of
the library:

``kit-overlay``
    The component is copied verbatim.  Only its shared kit (``kit/theme.ts``,
    ``kit/ui.tsx``) is replaced by an LW host copy that keeps upstream layout
    and animation values but swaps fonts, removes Fred branding/SFX and makes
    the accent/background/speed configurable.

``project-expand``
    Some public snapshots declare only a few files while the component imports
    shared modules that live in the same public project.  For those we copy the
    whole project ``src/`` tree from the public tag, then overlay the shared
    host (fonts/brand/audio) and rewrite ``assets.json`` to LW-owned placeholders.

Every adaptation writes ``provenance.json`` with the upstream URL/hash of each
file, the exact host edits, and the license scope.  Upstream bytes are never
modified in place.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import ftlib as L

ADAPTED = L.EXT / "adapted"
PROFILES = Path(__file__).resolve().parent / "profiles" / "round1.json"
LW_FONT = "LW Fred SmileySans"
DEFAULT_ACCENT = "#8554E8"
DEFAULT_BACKGROUND = "#ffffff"

LW_HOST = """// LW host context for adapted FredTalk components. Not upstream code.
import {createContext, useContext} from 'react';
export type LWHostValue = {accent: string; accentDark: string; background: string; ink: string; speed: number; font: string};
export const FredHost = createContext<LWHostValue>({
  accent: '%s', accentDark: '#D6BEFF', background: '%s', ink: '#19191c', speed: 1, font: '%s',
});
export const useHost = () => useContext(FredHost);
""" % (DEFAULT_ACCENT, DEFAULT_BACKGROUND, LW_FONT)


def brace_match(text: str, open_idx: int) -> int:
    depth = 0
    i = open_idx
    in_str: str | None = None
    while i < len(text):
        ch = text[i]
        if in_str:
            if ch == in_str and text[i - 1] != "\\":
                in_str = None
        elif ch in "'\"`":
            in_str = ch
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise ValueError("unbalanced braces")


def function_body_start(src: str, after_paren: int) -> int:
    depth = 1
    j = after_paren
    while j < len(src) and depth:
        if src[j] == "(":
            depth += 1
        elif src[j] == ")":
            depth -= 1
        j += 1
    while j < len(src):
        while j < len(src) and src[j] in " \n\t":
            j += 1
        if j < len(src) and src[j] == ":":
            j += 1
            while j < len(src) and src[j] in " \n\t":
                j += 1
            if j < len(src) and src[j] == "{":
                j = brace_match(src, j) + 1
                continue
            while j < len(src) and src[j] not in "{":
                j += 1
            continue
        if src.startswith("=>", j):
            j += 2
            continue
        if j < len(src) and src[j] == "{":
            return j
        j += 1
    raise ValueError("body not found")


def replace_function_body(src: str, name: str, body: str) -> tuple[str, bool]:
    m = re.search(r"(?:export\s+)?function\s+%s\s*\(" % re.escape(name), src)
    if not m:
        return src, False
    brace = function_body_start(src, m.end())
    end = brace_match(src, brace)
    return src[: brace + 1] + "\n" + body + "\n" + src[end:], True


def apply_host_edits(src: str, kind: str, font_family: str, ops: list[str]) -> str:
    """kind: 'kit' or 'shared'."""
    if kind == "kit":
        if "from './lw-host'" not in src:
            anchor = re.search(r"import\s+\{[^}]*\}\s+from\s+'\.\/theme';", src)
            if anchor:
                src = src[: anchor.end()] + "\nimport {useHost} from './lw-host';" + src[anchor.end():]
            else:
                src = "import {useHost} from './lw-host';\n" + src
        ops.append("host context import")
        # speed-aware clock
        src2 = re.sub(
            r"export const useT = \(\) => useCurrentFrame\(\) / useVideoConfig\(\)\.fps;",
            "export const useT = () => useCurrentFrame() / useVideoConfig().fps * useHost().speed;",
            src,
        )
        if src2 != src:
            ops.append("useT respects host speed")
        src = src2
        # font loader
        src = src.replace("let fontsReady: Promise<void> | undefined;", "let fontsReady: Promise<void> | undefined;", 1)
        if "__lwFontReady" not in src:
            src = re.sub(r"(?m)^(let fontsReady)", "let __lwFontReady: Promise<void> | undefined;\n\\1", src, count=1)
            if "__lwFontReady" not in src:
                src = src.replace("let fontsReady", "let __lwFontReady: Promise<void> | undefined;\nlet fontsReady", 1)
        font_body = """  useLayoutEffect(() => {
    const handle = delayRender('LW FredTalk font');
    __lwFontReady ??= (async () => {
      const face = new FontFace('%s', `url(${staticFile('fredtalk/SmileySans-Oblique.ttf')})`);
      await face.load();
      (document.fonts as unknown as {add: (f: FontFace) => void}).add(face);
    })();
    __lwFontReady.then(() => continueRender(handle)).catch((e) => cancelRender(e));
  }, []);
  return null;""" % font_family
        src, ok = replace_function_body(src, "Fonts", font_body)
        ops.append("Fonts -> OFL SmileySans" if ok else "Fonts patch FAILED")
    else:
        if "from './lw-host'" not in src:
            src = "import {useHost} from './lw-host';\n" + src
        ops.append("host context import")
        font_body = """  useLayoutEffect(() => {
    const handle = delayRender('LW FredTalk font');
    __lwFontReady ??= (async () => {
      const face = new FontFace('%s', `url(${staticFile('fredtalk/SmileySans-Oblique.ttf')})`);
      await face.load();
      (document.fonts as unknown as {add: (f: FontFace) => void}).add(face);
    })();
    __lwFontReady.then(() => continueRender(handle)).catch((e) => cancelRender(e));
  }, []);
  return null;""" % font_family
        if "__lwFontReady" not in src:
            src = src.replace("let fontsReady", "let __lwFontReady: Promise<void> | undefined;\nlet fontsReady", 1)
        src, ok = replace_function_body(src, "Fonts", font_body)
        ops.append("Fonts -> OFL SmileySans" if ok else "Fonts patch FAILED")
        src2 = re.sub(
            r"export const useT=\(\)=>useCurrentFrame\(\)/useVideoConfig\(\)\.fps;",
            "export const useT=()=>useCurrentFrame()/useVideoConfig().fps*useHost().speed;",
            src,
        )
        src2 = re.sub(
            r"export const useT = \(\) => useCurrentFrame\(\) / useVideoConfig\(\)\.fps;",
            "export const useT = () => useCurrentFrame() / useVideoConfig().fps * useHost().speed;",
            src2,
        )
        if src2 != src:
            ops.append("useT respects host speed")
        src = src2

    src, ok = replace_function_body(src, "Brand", "  return null;")
    ops.append("Brand removed" if ok else "Brand patch skipped")
    if re.search(r"export function Sfx\s*\(", src):
        src, ok = replace_function_body(src, "Sfx", "  return null;")
        ops.append("Sfx muted" if ok else "Sfx patch FAILED")

    before = src
    src = src.replace("background: background ?? (dark ? S.dark : '#fff')",
                      "background: background ?? (dark ? S.dark : useHost().background)")
    src = src.replace("background: dark ? S.dark : '#fff'", "background: dark ? S.dark : useHost().background")
    src = src.replace("background:'#fff'", "background: useHost().background")
    src = src.replace("background: '#fff'", "background: useHost().background")
    if src != before:
        ops.append("Frame background -> host")
    else:
        ops.append("Frame background patch skipped")
    return src


def patch_theme(src: str, ops: list[str]) -> str:
    for key in ("body", "display", "mono", "kai", "font"):
        new, n = re.subn(r"(%s\s*:\s*')[^']*(')" % key, lambda m: m.group(1) + LW_FONT + m.group(2), src)
        if n:
            src = new
            ops.append(f"theme {key} -> LW font")
    if "configureTheme" not in src:
        src += """

export function configureTheme(theme?: {accent?: string; accentDark?: string; ink?: string}) {
  const s = S as unknown as Record<string, string>;
  if (theme?.accent) {
    s.accent = theme.accent;
    s.accentDark = theme.accentDark ?? lighten(theme.accent, 0.55);
  } else if (theme?.accentDark) {
    s.accentDark = theme.accentDark;
  }
  if (theme?.ink) s.ink = theme.ink;
}
function lighten(hex: string, t: number) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const out = rgb.map((v) => Math.round(v + (255 - v) * t));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}
"""
        ops.append("configureTheme added")
    return src


def src_relative(declared: str | None, label: str, entry_root: str) -> str:
    p = (declared or label).replace("\\", "/")
    marker = "/src/"
    if marker in p:
        return p.split(marker, 1)[1]
    if p.startswith("src/"):
        return p[4:]
    if entry_root and p.startswith(entry_root + "/"):
        return p[len(entry_root) + 1:]
    # bare label: place next to the entry
    return p


def build_kit_overlay(profile: dict, row: dict, tag: L.TagTree | None) -> dict:
    lw = profile["lwId"]
    dest = ADAPTED / lw
    if dest.exists():
        shutil.rmtree(dest)
    src_dir = dest / "src"
    src_dir.mkdir(parents=True, exist_ok=True)

    files = row["source"]["files"]
    entry_path = row["adaptation"]["entryPath"] or profile["entryFile"]
    entry_root = entry_path.split("/src/")[0] if "/src/" in entry_path else ""
    copied = []
    for f in files:
        if not f["cachePath"]:
            continue
        rel = src_relative(f["path"], f["label"], entry_root)
        if rel.endswith(("registry.ts", "index.tsx")) and "components" not in rel:
            continue
        target = src_dir / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(L.CACHE / f["cachePath"], target)
        copied.append({"upstreamPath": f["path"] or f["label"], "copy": str(rel),
                       "sha256": f["actualSha256"], "channel": f["channel"], "status": f["status"]})

    ops: list[str] = []
    theme = src_dir / "kit" / "theme.ts"
    ui = src_dir / "kit" / "ui.tsx"
    if not theme.exists() or not ui.exists():
        raise RuntimeError("kit theme/ui not found in declared sources")

    (src_dir / "kit" / "lw-host.tsx").write_text(LW_HOST, encoding="utf-8")
    theme.write_text(patch_theme(theme.read_text(encoding="utf-8"), ops), encoding="utf-8")
    ui.write_text(apply_host_edits(ui.read_text(encoding="utf-8"), "kit", LW_FONT, ops), encoding="utf-8")

    entry_rel = src_relative(entry_path, entry_path.split("/")[-1], entry_root)
    symbol = profile["entryExport"]
    defaults = profile.get("defaultsExport")
    adapter = make_adapter(profile, entry_rel, symbol, defaults, host_import="./kit/lw-host", theme_import="./kit/theme")
    (src_dir / "adapter.tsx").write_text(adapter, encoding="utf-8")

    return finish(profile, row, dest, copied, ops, entry_rel, entry_path)


def copy_project_src(project_dir: Path, dest: Path) -> list[dict]:
    copied = []
    src = project_dir / "src"
    if not src.is_dir():
        raise RuntimeError(f"project src missing: {src}")
    for f in src.rglob("*"):
        if not f.is_file() or f.suffix not in (".tsx", ".ts", ".json", ".css"):
            continue
        rel = f.relative_to(src)
        target = dest / "src" / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(f, target)
        copied.append({"upstreamPath": f.as_posix(), "copy": str(rel), "sha256": L.sha256_file(f), "channel": "tag-tree"})
    return copied


def build_project_expand(profile: dict, row: dict, tag: L.TagTree) -> dict:
    lw = profile["lwId"]
    dest = ADAPTED / lw
    if dest.exists():
        shutil.rmtree(dest)
    project = profile["tagProject"]
    roots = tag.project_dirs(project)
    if not roots:
        raise RuntimeError(f"public tag project not found: {project}")
    project_dir = roots[0]
    copied = copy_project_src(project_dir, dest)
    ops: list[str] = []
    (dest / "src" / "lw-host.tsx").write_text(LW_HOST, encoding="utf-8")
    shared = dest / "src" / "shared.tsx"
    shared_text = shared.read_text(encoding="utf-8").replace("'media/recording-frame.jpg'", "assets['recordingImage']")
    shared.write_text(patch_theme(apply_host_edits(shared_text, "shared", LW_FONT, ops), ops), encoding="utf-8")
    assets = dest / "src" / "assets.json"
    rewritten = {
        "fight-positive": "fredtalk/media/lw-recording.mp4",
        "fred-broll2": "fredtalk/media/lw-recording.mp4",
        "fred-broll3": "fredtalk/media/lw-recording.mp4",
        "frame-analysis": "fredtalk/media/lw-recording.mp4",
        "fred-still1": "fredtalk/media/lw-work-01.jpg",
        "fred-still2": "fredtalk/media/lw-work-02.jpg",
        "fred-still3": "fredtalk/media/lw-work-03.jpg",
        "fred-still4": "fredtalk/media/lw-work-04.jpg",
        "fred-still5": "fredtalk/media/lw-work-05.jpg",
        "work-image1": "fredtalk/media/lw-work-01.jpg",
        "work-image2": "fredtalk/media/lw-work-02.jpg",
        "work-image3": "fredtalk/media/lw-work-03.jpg",
        "work-image4": "fredtalk/media/lw-work-04.jpg",
        "recordingImage": "fredtalk/media/lw-ui-screenshot.png",
    }
    assets.write_text(json.dumps(rewritten, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ops.append("assets.json -> LW placeholders (upstream media not redistributed)")

    entry_rel = profile["entryFile"]
    adapter = make_adapter(profile, entry_rel, profile["entryExport"], profile.get("defaultsExport"),
                           host_import="./lw-host", theme_import="./shared")
    (dest / "src" / "adapter.tsx").write_text(adapter, encoding="utf-8")
    return finish(profile, row, dest, copied, ops, entry_rel, entry_rel, project=str(project_dir.relative_to(tag.root)))


def make_adapter(profile, entry_rel, symbol, defaults, host_import, theme_import) -> str:
    entry_rel = re.sub(r"\.(tsx|ts)$", "", entry_rel)
    module = "./" + entry_rel
    if defaults:
        defaults_line = f"import {{{defaults} as __defaults}} from '{module}';"
    else:
        defaults_line = "const __defaults: Record<string, unknown> = " + json.dumps(profile.get("sampleProps", {}), ensure_ascii=False) + ";"
    defaults_name = "__defaults"
    return f"""// Generated LW adapter. Upstream component is kept verbatim under src/.
import React from 'react';
import {{FredHost}} from '{host_import}';
import {{configureTheme}} from '{theme_import}';
import {{{symbol} as __Component}} from '{module}';
{defaults_line}

export const adapterMeta = {json.dumps({**profile['meta'], 'strategy': profile['strategy']}, ensure_ascii=False)};

export const defaultProps = {defaults_name} as Record<string, unknown>;
export const editableKeys = {json.dumps(profile.get('editableKeys', []), ensure_ascii=False)};
export const sampleProps = {json.dumps(profile.get('sampleProps', {}), ensure_ascii=False)};

export function Adapter(input: {{props?: Record<string, unknown>; accent?: string; background?: string; accentDark?: string; ink?: string; speed?: number}}) {{
  const p = {{...({defaults_name} as Record<string, unknown>), ...(input.props ?? {{}})}};
  configureTheme({{accent: input.accent, accentDark: input.accentDark, ink: input.ink}});
  const host = {{
    accent: input.accent ?? '{DEFAULT_ACCENT}',
    accentDark: input.accentDark ?? '#D6BEFF',
    background: input.background ?? '{DEFAULT_BACKGROUND}',
    ink: input.ink ?? '#19191c',
    speed: input.speed ?? 1,
    font: '{LW_FONT}',
  }};
  return <FredHost.Provider value={{host}}><__Component {{...p}} /></FredHost.Provider>;
}}
"""


def apply_source_patches(dest: Path, patches: list[dict], ops: list[str]) -> list[dict]:
    applied = []
    for patch in patches:
        f = dest / "src" / patch["file"]
        text = f.read_text(encoding="utf-8")
        n = text.count(patch["from"])
        if n == 0:
            raise RuntimeError(f"source patch target not found: {patch['file']} {patch['from']!r}")
        text = text.replace(patch["from"], patch["to"])
        f.write_text(text, encoding="utf-8")
        applied.append({"file": patch["file"], "from": patch["from"], "to": patch["to"], "occurrences": n, "reason": patch.get("reason")})
        ops.append(f"source patch {patch['file']}: {patch['reason']}")
    return applied


def finish(profile, row, dest, copied, ops, entry_rel, entry_path, project=None) -> dict:
    lw = profile["lwId"]
    patched = apply_source_patches(dest, profile.get("sourcePatches", []), ops)
    provenance = {
        "lwId": lw,
        "ftId": profile["ftId"],
        "name": row["name"],
        "category": row["category"],
        "strategy": profile["strategy"],
        "upstream": {
            "revision": L.REVISION,
            "publicTag": L.PUBLIC_TAG,
            "project": project,
            "officialUrl": "https://www.fred-fu.com/visual-library",
        },
        "license": {
            "firstPartyCode": "MIT (FredTalk owner grant 2026-10-13)",
            "thirdPartyMedia": "not covered; upstream media intentionally not redistributed",
            "font": "SmileySans-Oblique OFL-1.1, unmodified, bundled by LW host",
            "audio": "upstream SFX omitted; adapter is silent",
            "attribution": "FredTalk component library; adapted by LW, not claimed as LW original",
        },
        "entry": entry_path,
        "files": copied,
        "hostEdits": ops,
        "sourcePatches": patched,
        "notes": profile.get("notes", ""),
    }
    L.dump_json(dest / "provenance.json", provenance)
    L.dump_json(dest / "props.json", {
        "defaultProps": profile.get("sampleProps", {}),
        "editableKeys": profile.get("editableKeys", []),
        "accent": profile.get("accent", DEFAULT_ACCENT),
        "background": profile.get("background", DEFAULT_BACKGROUND),
        "notes": profile.get("paramNotes", ""),
    })
    return provenance


def load_profiles() -> list[dict]:
    return L.load_json(PROFILES)["profiles"]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="LW ids or FredTalk labels")
    ap.add_argument("--all-kit", action="store_true", help="adapt every kit-overlay component (batch mode)")
    args = ap.parse_args()

    inv = {r["lwId"]: r for r in L.load_json(L.BATCH / "inventory.json")}
    tag = L.ensure_tag_tree(L.default_tag_root())
    profiles = load_profiles()
    if args.only:
        profiles = [p for p in profiles if p["lwId"] in args.only or p["ftId"] in args.only]

    done = []
    for p in profiles:
        row = inv[p["lwId"]]
        if p["strategy"] == "project-expand":
            prov = build_project_expand(p, row, tag)
        else:
            prov = build_kit_overlay(p, row, tag)
        print(f"adapted {p['lwId']} {p['strategy']} -> {len(prov['files'])} files; edits: {len(prov['hostEdits'])}")
        done.append(p["lwId"])
    regenerate_registry()
    return 0


def regenerate_registry() -> None:
    entries = []
    for d in sorted(ADAPTED.glob("*")):
        adapter = d / "src" / "adapter.tsx"
        prov = d / "provenance.json"
        props = d / "props.json"
        if not (adapter.exists() and prov.exists() and props.exists()):
            continue
        p = L.load_json(prov)
        pj = L.load_json(props)
        entries.append({
            "id": p["lwId"], "ftId": p["ftId"], "name": p["name"], "category": p["category"],
            "strategy": p["strategy"], "nativeFrames": p.get("nativeFrames", pj.get("nativeFrames")),
            "fps": p.get("fps", 60), "width": 1280, "height": 720,
            "accent": pj.get("accent"), "background": pj.get("background"),
            "sampleProps": pj.get("defaultProps", {}),
            "editableKeys": pj.get("editableKeys", []),
            "importPath": f"../../external/fredtalk/adapted/{p['lwId']}/src/adapter",
        })
    # native metadata lives in inventory; merge it here
    inv = {r["lwId"]: r for r in L.load_json(L.BATCH / "inventory.json")}
    for e in entries:
        r = inv.get(e["id"])
        if r:
            e["nativeFrames"] = r["upstream"]["nativeFrames"] or 300
            e["fps"] = int(r["upstream"]["fps"] or 60)
            e["sourceFrames"] = e["nativeFrames"]
    lines = ["// AUTO-GENERATED by tools/fredtalk/adapt.py. Do not edit by hand.",
             "import React from 'react';",
             "export type FredBatchEntry = {adapter: React.ComponentType<any>; defaultProps: Record<string, unknown>; meta: {id: string; ftId: string; category: string; strategy: string; nativeFrames: number; fps: number; upstreamRevision: string}; id: string; nativeFrames: number; fps: number; accent: string; background: string; sampleProps: Record<string, unknown>; editableKeys: string[]; sourceFrames: number};"]
    for i, e in enumerate(entries):
        lines.append(f"import {{Adapter as A{i}, defaultProps as D{i}, adapterMeta as M{i}}} from '{e['importPath']}';")
    lines.append("")
    lines.append("export const fredBatch: FredBatchEntry[] = [")
    for i, e in enumerate(entries):
        lines.append("  {adapter:A%d, defaultProps:D%d, meta:M%d, id:%s, nativeFrames:%d, fps:%d, accent:%s, background:%s, sampleProps:%s, editableKeys:%s, sourceFrames:%d},"
                     % (i, i, i, json.dumps(e["id"]), e["nativeFrames"], e["fps"],
                        json.dumps(e["accent"]), json.dumps(e["background"]),
                        json.dumps(e["sampleProps"], ensure_ascii=False),
                        json.dumps(e["editableKeys"], ensure_ascii=False), e["nativeFrames"]))
    lines.append("];")
    path = L.VS / "src" / "references" / "fredtalk-registry.generated.tsx"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    L.dump_json(L.VS / "src" / "references" / "fredtalk-registry.data.json", entries)
    print(f"registry: {len(entries)} adapted components")


if __name__ == "__main__":
    raise SystemExit(main())
