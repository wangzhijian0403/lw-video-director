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
import hashlib
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import ftlib as L

ADAPTED = L.EXT / "adapted"
PROFILES = Path(__file__).resolve().parent / "profiles" / "round1.json"
RUNS = L.BATCH / "runs"
LW_FONT = "LW Fred SmileySans"
DEFAULT_ACCENT = "#8554E8"
DEFAULT_BACKGROUND = "#ffffff"
ADAPTER_VERSION = "fred-batch/1.2"
AUTO_PROFILES = Path(__file__).resolve().parent / "profiles" / "auto-kit.generated.json"
SOURCE_PATCHES = Path(__file__).resolve().parent / "profiles" / "source-patches.json"
EXISTING_IDS = {"FT-T03e-414"}

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
    entry_path = profile.get("entryPath") or row["adaptation"]["entryPath"] or profile["entryFile"]
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
    rewrite_media_literals(dest, ops)
    adapter = make_adapter(profile, entry_rel, symbol, defaults, host_import="./kit/lw-host", theme_import="./kit/theme")
    (src_dir / "adapter.tsx").write_text(adapter, encoding="utf-8")

    return finish(profile, row, dest, copied, ops, entry_rel, entry_path)


MEDIA_LITERAL = re.compile(r"(?P<q>['\"])(?P<path>/?media/[^'\"]+)(?P=q)")
PLACEHOLDER_STILLS = [f"fredtalk/media/lw-work-0{i}.jpg" for i in range(1, 7)]


def rewrite_media_literals(dest: Path, ops: list[str]) -> int:
    """Point every hard-coded upstream media literal at an LW-owned placeholder.

    Upstream does not redistribute its demo media.  Components that hard-code
    ``media/foo.jpg`` would otherwise fail in a fresh clone with a 404.  The
    rewrite is deterministic and recorded in provenance ops.
    """
    changed = 0

    def repl(m: re.Match) -> str:
        nonlocal changed
        raw = m.group("path")
        name = raw.rsplit("/", 1)[-1]
        if re.search(r"\.(mp4|mov|webm|m4v)$", name, re.I):
            target = "fredtalk/media/lw-recording.mp4"
        else:
            digest = hashlib.sha256(name.encode("utf-8")).hexdigest()
            target = PLACEHOLDER_STILLS[(int(digest[:8], 16) + changed) % len(PLACEHOLDER_STILLS)]
        if target != raw.lstrip("/"):
            changed += 1
        return f"{m.group('q')}{target}{m.group('q')}"

    for f in (dest / "src").rglob("*"):
        if not f.is_file() or f.suffix not in (".tsx", ".ts"):
            continue
        text = f.read_text(encoding="utf-8")
        new = MEDIA_LITERAL.sub(repl, text)
        if new != text:
            f.write_text(new, encoding="utf-8")
    if changed:
        ops.append(f"media literals -> LW placeholders ({changed} refs; upstream media not redistributed)")
    return changed


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
    rewrite_media_literals(dest, ops)

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
    declared = list(profile.get("sourcePatches", [])) + list(load_source_patches().get(lw, []))
    patched = apply_source_patches(dest, declared, ops)
    adapter_path = dest / "src" / "adapter.tsx"
    source_material = json.dumps(
        sorted(
            [{"path": f.get("copy"), "sha256": L.sha256_file(dest / "src" / f["copy"]),
             "upstreamSha256": f.get("sha256")} for f in copied],
            key=lambda x: (x["path"] or "", x["sha256"] or ""),
        ),
        ensure_ascii=False,
        sort_keys=True,
    ).encode("utf-8")
    provenance = {
        "lwId": lw,
        "ftId": profile["ftId"],
        "name": row["name"],
        "category": row["category"],
        "strategy": profile["strategy"],
        "adapterVersion": ADAPTER_VERSION,
        "sourceSha256": hashlib.sha256(source_material).hexdigest(),
        "adapterSha256": L.sha256_file(adapter_path),
        "nativeFrames": row["upstream"].get("nativeFrames") or 300,
        "fps": int(row["upstream"].get("fps") or 60),
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


def load_source_patches() -> dict[str, list[dict]]:
    if not SOURCE_PATCHES.exists():
        return {}
    return L.load_json(SOURCE_PATCHES).get("patches", {})


def load_profiles() -> list[dict]:
    return L.load_json(PROFILES)["profiles"]


# ---------------------------------------------------------------------------------
# Automatic kit-overlay profile generation (no hand-written per-component profile)


EXPORT_DECL_RE = re.compile(
    r"export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class)\s+([A-Za-z0-9_$]+)"
)
REACT_FC_RE = re.compile(r"export\s+const\s+([A-Za-z0-9_$]+)\s*:\s*React\.FC")
DEFAULT_EXPORT_RE = re.compile(r"export\s+default\s+(?:function|class|const|\()")


def _source_text(row: dict, file_row: dict) -> str:
    cache = file_row.get("cachePath")
    if not cache:
        return ""
    return L.read_text(L.CACHE / cache)


def _component_exports(text: str) -> list[dict]:
    found: list[dict] = []
    for m in REACT_FC_RE.finditer(text):
        found.append({"name": m.group(1), "kind": "react-fc"})
    for m in EXPORT_DECL_RE.finditer(text):
        name = m.group(1)
        if any(x["name"] == name for x in found):
            continue
        head = text[max(0, m.start() - 20):m.end()]
        if "default" in head:
            continue
        found.append({"name": name, "kind": "decl"})
    if not found and DEFAULT_EXPORT_RE.search(text):
        found.append({"name": "default", "kind": "default"})
    return found


def _pick_component_symbol(text: str, label: str, ft_id: str) -> str | None:
    """Pick the scene/component export, not helper constants or defaults."""
    stem = Path(label).stem
    suffix = stem[len(ft_id) + 1:] if stem.startswith(ft_id + "-") else ""
    ranked: list[tuple[int, str]] = []
    for exp in _component_exports(text):
        name = exp["name"]
        if name == "default":
            ranked.append((10, name))
            continue
        if name.endswith("Defaults") or name.startswith("use"):
            continue
        score = 0
        if exp["kind"] == "react-fc":
            score += 60
        if name == ft_id:
            score += 40
        if suffix and name.lower() == suffix.lower():
            score += 45
        if name.lower().startswith(stem.lower()) or stem.lower().startswith(name.lower()):
            score += 25
        if name[:1].isupper():
            score += 10
        if name.isupper():
            score -= 25
        if name.endswith(("_END", "_QP", "_START")):
            score -= 30
        if score >= 0:
            ranked.append((score, name))
    if not ranked:
        return None
    ranked.sort(key=lambda x: (-x[0], len(x[1]), x[1]))
    return ranked[0][1]


def _entry_candidate_score(row: dict, file_row: dict, text: str) -> int:
    label = file_row.get("label") or Path(file_row.get("path", "")).name
    path = file_row.get("path", "")
    stem = Path(label).stem
    if stem in ("index", "registry", "theme", "ui", "lw-host") or "/kit/" in path:
        return -1000
    score = 0
    if stem.startswith(row["ftId"] + "-") or stem == row["ftId"]:
        score += 100
    if "/scenes/" in path or re.match(r"(S|Open|EP)\d", stem):
        score += 35
    if re.search(r"from\s+['\"]\.\./kit/(theme|ui)['\"]|from\s+['\"]\./kit/(theme|ui)['\"]", text):
        score += 30
    exports = _component_exports(text)
    if exports:
        score += 20
    if any(x["kind"] == "react-fc" for x in exports):
        score += 20
    if stem == "shared":
        score -= 60
    if "/components/" in path and not stem.startswith(row["ftId"]):
        score -= 5
    return score + min(len(text) // 20000, 5)


def _entry_missing_imports(row: dict, entry: dict) -> list[str]:
    """Resolve imports of the *actual* entry, not the inventory's fallback entry."""
    files = [f for f in row["source"]["files"] if f.get("cachePath")]
    entry_path = entry.get("path") or entry.get("label")
    entry_rel = src_relative(entry_path, entry.get("label", ""), "")
    available = {src_relative(f.get("path") or f.get("label"), f.get("label", ""), "") for f in files}
    missing = []
    for spec in L.import_specs(L.CACHE / entry["cachePath"]):
        if not spec.startswith("."):
            continue
        resolved = L.resolve_local_import(spec, entry_rel, available, "")
        if not resolved:
            missing.append(spec)
    return sorted(set(missing))


def auto_kit_profile(row: dict) -> dict:
    """Derive a kit-overlay profile from inventory + the fetched source tree."""
    if row["adaptation"]["strategy"] != "kit-overlay":
        raise ValueError(f"{row['lwId']} is {row['adaptation']['strategy']}, not kit-overlay")
    if row["dependencies"].get("missing"):
        raise ValueError(f"{row['lwId']} has unresolved imports: {row['dependencies']['missing'][:3]}")
    files = [f for f in row["source"]["files"] if f.get("cachePath")]
    labels = [Path(f.get("label") or f["path"]).name for f in files]
    if "theme.ts" not in labels or "ui.tsx" not in labels:
        raise ValueError(f"{row['lwId']} kit/theme.ts or kit/ui.tsx missing from declared sources")
    best = None
    best_score = -1000
    for f in files:
        text = _source_text(row, f)
        score = _entry_candidate_score(row, f, text)
        if score > best_score:
            best, best_score = f, score
    if not best or best_score < 0:
        raise ValueError(f"{row['lwId']} no component entry file found")
    missing = _entry_missing_imports(row, best)
    if missing:
        raise ValueError(f"{row['lwId']} entry {best['path']} imports unresolved: {missing[:4]}")
    entry_text = _source_text(row, best)
    symbol = _pick_component_symbol(entry_text, best.get("label") or best["path"], row["ftId"])
    if not symbol:
        raise ValueError(f"{row['lwId']} no exported component symbol in {best['path']}")
    defaults = row["params"].get("defaultsName")
    if not defaults:
        m = re.search(r"export\s+const\s+([A-Za-z0-9_]+Defaults)\s*", entry_text)
        defaults = m.group(1) if m else None
    entry_path = best.get("path") or best.get("label")
    entry_file = src_relative(entry_path, best.get("label", ""), "")
    return {
        "lwId": row["lwId"],
        "ftId": row["ftId"],
        "strategy": "kit-overlay",
        "entryFile": entry_file,
        "entryPath": entry_path,
        "entryExport": symbol,
        "defaultsExport": defaults,
        "accent": DEFAULT_ACCENT,
        "background": "#f5f3eb",
        "editableKeys": row["params"].get("keys", []),
        "sampleProps": {},
        "paramNotes": "自动生成：使用上游 defaults；参数键来自 inventory 静态分析。",
        "meta": {
            "id": row["lwId"],
            "ftId": row["ftId"],
            "category": row["category"],
            "nativeFrames": row["upstream"].get("nativeFrames") or 300,
            "fps": int(row["upstream"].get("fps") or 60),
            "upstreamRevision": L.REVISION,
        },
        "notes": "Auto-generated kit-overlay profile. Entry/symbol/defaults are selected from inventory + source exports.",
    }


DEFAULT_CATEGORY_MIX = {
    "project-expand": 2,
    "录屏聚焦": 6,
    "内容交接": 5,
    "录屏与视频入场": 5,
    "图片与作品": 2,
}


def _profile_for_row(row: dict, skipped: list[dict]) -> dict | None:
    if row["adaptation"]["strategy"] != "kit-overlay":
        return None
    if row["lwId"] in EXISTING_IDS:
        return None
    try:
        profile = auto_kit_profile(row)
        profile["category"] = row["category"]
        return profile
    except Exception as exc:
        skipped.append({"lwId": row["lwId"], "ftId": row["ftId"], "reason": str(exc)})
        return None


def select_auto_kit(rows: list[dict], limit: int | None = None, include_adapted: bool = False,
                   mix: dict[str, int] | None = None) -> tuple[list[dict], list[dict]]:
    """Select kit-overlay profiles, optionally with a deterministic category mix.

    ``mix`` keys are categories plus the pseudo-category ``project-expand``; the
    latter re-uses existing project-expand profiles from round1.json as a
    regression slice instead of hand-writing new profiles.
    """
    selected: list[dict] = []
    skipped: list[dict] = []
    seen: set[str] = set()

    def add(p: dict | None) -> None:
        if not p or p["lwId"] in seen:
            return
        selected.append(p)
        seen.add(p["lwId"])

    if mix:
        projects = [dict(p, category=p.get("category") or p.get("meta", {}).get("category")) for p in load_profiles() if p["strategy"] == "project-expand"]
        for _ in range(mix.get("project-expand", 0)):
            if projects:
                add(projects.pop(0))
        for category, quota in mix.items():
            if category == "project-expand":
                continue
            for row in sorted(rows, key=lambda r: r["lwId"]):
                if len([p for p in selected if p.get("category") == category]) >= quota:
                    break
                if row["category"] != category:
                    continue
                if not include_adapted and (ADAPTED / row["lwId"] / "provenance.json").exists():
                    continue
                add(_profile_for_row(row, skipped))
        if limit is not None and len(selected) >= limit:
            selected = selected[:limit]
            return selected, skipped

    for row in sorted(rows, key=lambda r: r["lwId"]):
        if limit is not None and len(selected) >= limit:
            break
        if row["lwId"] in seen:
            continue
        if mix and row["category"] in mix:
            have = len([p for p in selected if p.get("category") == row["category"]])
            if have >= mix[row["category"]]:
                continue
        if not include_adapted and (ADAPTED / row["lwId"] / "provenance.json").exists():
            continue
        add(_profile_for_row(row, skipped))
    if limit is not None:
        selected = selected[:limit]
    return selected, skipped


def run_auto_kit(limit: int | None, run_id: str | None, dry_run: bool, include_adapted: bool, mix: dict[str, int] | None = None) -> int:
    rows = L.load_json(L.BATCH / "inventory.json")
    profiles, skipped = select_auto_kit(rows, limit=limit, include_adapted=include_adapted, mix=mix)
    run_id = run_id or datetime.now(timezone.utc).strftime("auto-%Y%m%d-%H%M%S")
    run_dir = RUNS / run_id
    plan = {
        "runId": run_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "strategy": "mixed" if mix else "kit-overlay",
        "selection": ("category mix " + json.dumps(mix, ensure_ascii=False) + "; project-expand slice reuses verified round1 profiles") if mix else "inventory.adaptation.strategy == kit-overlay; kit/theme.ts + kit/ui.tsx present; entry export resolved",
        "count": len(profiles),
        "components": [
            {
                "lwId": p["lwId"], "ftId": p["ftId"], "category": p.get("category"),
                "strategy": p["strategy"], "entryFile": p["entryFile"],
                "entryExport": p["entryExport"], "defaultsExport": p["defaultsExport"],
                "editableKeys": p["editableKeys"],
            }
            for p in profiles
        ],
        "skipped": skipped,
    }
    L.dump_json(run_dir / "plan.json", plan)
    if profiles:
        L.dump_json(AUTO_PROFILES, {"generatedAt": plan["createdAt"], "profiles": profiles})
    print(f"run={run_id} selected={len(profiles)} skipped={len(skipped)}")
    for p in profiles:
        print(f"  {p['lwId']} {p['entryFile']} -> {p['entryExport']}")
    for s in skipped[:10]:
        print(f"  skip {s['lwId']}: {s['reason']}")
    if len(skipped) > 10:
        print(f"  ... {len(skipped) - 10} more skipped")
    if dry_run:
        print(f"dry-run plan -> {run_dir/'plan.json'}")
        return 0

    inv = {r["lwId"]: r for r in rows}
    # LW-FT-FULL-001: only ``build_project_expand`` reads the public tag tree;
    # ``build_kit_overlay`` works entirely from the SHA-verified source cache.
    # A network-forced clone here broke all-kit-overlay batches on hosts where
    # the GitHub schannel/partial-clone channel is unavailable (Windows). Only
    # clone when a project-expand profile is actually selected; otherwise use
    # an existing tag tree if present, else degrade to None (which kit-overlay
    # never dereferences).
    needs_tag_tree = any(p["strategy"] == "project-expand" for p in profiles)
    tag_root = L.default_tag_root()
    if needs_tag_tree:
        tag = L.ensure_tag_tree(tag_root)
    elif (tag_root / "components" / "projects").is_dir():
        tag = L.TagTree(tag_root)
    else:
        tag = None
        print("note: all-kit-overlay batch; public tag tree not required, using SHA source cache")
    results = []
    for p in profiles:
        row = inv[p["lwId"]]
        try:
            prov = build_project_expand(p, row, tag) if p["strategy"] == "project-expand" else build_kit_overlay(p, row, tag)
            print(f"adapted {p['lwId']} -> {len(prov['files'])} files; edits: {len(prov['hostEdits'])}")
            results.append({"lwId": p["lwId"], "status": "adapted", "files": len(prov["files"]), "error": None})
        except Exception as exc:
            message = f"{type(exc).__name__}: {exc}"
            print(f"FAIL {p['lwId']}: {message}")
            results.append({"lwId": p["lwId"], "status": "adapt-fail", "files": 0, "error": message})
    regenerate_registry()
    L.dump_json(run_dir / "adapt-status.json", {
        "runId": run_id, "selected": len(profiles), "adapted": sum(1 for r in results if r["status"] == "adapted"),
        "failed": sum(1 for r in results if r["status"] != "adapted"), "results": results, "skipped": skipped,
    })
    print(f"plan/status -> {run_dir}")
    return 0 if all(r["status"] == "adapted" for r in results) else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="LW ids or FredTalk labels")
    ap.add_argument("--all-kit", action="store_true", help="select kit-overlay components from inventory (batch mode)")
    ap.add_argument("--limit", type=int, default=None, help="max components for --all-kit")
    ap.add_argument("--dry-run", action="store_true", help="only write the auto plan, do not adapt")
    ap.add_argument("--include-adapted", action="store_true", help="re-adapt components that already have provenance")
    ap.add_argument("--run-id", default=None, help="run directory name for --all-kit")
    ap.add_argument("--mix", default=None, help="category mix JSON, e.g. {\"录屏聚焦\": 6}; implies --all-kit")
    args = ap.parse_args()

    mix = json.loads(args.mix) if args.mix else None
    if args.all_kit or mix:
        return run_auto_kit(args.limit, args.run_id, args.dry_run, args.include_adapted, mix=mix)

    inv = {r["lwId"]: r for r in L.load_json(L.BATCH / "inventory.json")}
    tag = L.ensure_tag_tree(L.default_tag_root())
    profiles = load_profiles()
    if args.only:
        profiles = [p for p in profiles if p["lwId"] in args.only or p["ftId"] in args.only]
        missing = [x for x in args.only if not any(p["lwId"] == x or p["ftId"] == x for p in profiles)]
        for mid in missing:
            row = inv.get(mid) or next((r for r in inv.values() if r["ftId"] == mid), None)
            if row and row["adaptation"]["strategy"] == "kit-overlay":
                profiles.append(auto_kit_profile(row))

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
        source_sha = p.get("sourceSha256")
        if not source_sha:
            source_sha = hashlib.sha256(
                json.dumps(
                    sorted(
                        [{"path": f.get("upstreamPath"), "sha256": f.get("sha256")} for f in p.get("files", [])],
                        key=lambda x: (x["path"] or "", x["sha256"] or ""),
                    ),
                    ensure_ascii=False,
                    sort_keys=True,
                ).encode("utf-8")
            ).hexdigest()
        entries.append({
            "id": p["lwId"], "ftId": p["ftId"], "name": p["name"], "category": p["category"],
            "strategy": p["strategy"], "nativeFrames": p.get("nativeFrames", pj.get("nativeFrames")),
            "fps": p.get("fps", 60), "width": 1280, "height": 720,
            "accent": pj.get("accent"), "background": pj.get("background"),
            "sampleProps": pj.get("defaultProps", {}),
            "editableKeys": pj.get("editableKeys", []),
            "sourceSha256": source_sha,
            "adapterSha256": p.get("adapterSha256") or L.sha256_file(adapter),
            "adapterVersion": p.get("adapterVersion") or ADAPTER_VERSION,
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
             "export type FredBatchEntry = {adapter: React.ComponentType<any>; defaultProps: Record<string, unknown>; meta: {id: string; ftId: string; category: string; strategy: string; nativeFrames: number; fps: number; upstreamRevision: string}; id: string; nativeFrames: number; fps: number; accent: string; background: string; sampleProps: Record<string, unknown>; editableKeys: string[]; sourceFrames: number; sourceSha256: string; adapterSha256: string; adapterVersion: string};"]
    for i, e in enumerate(entries):
        lines.append(f"import {{Adapter as A{i}, defaultProps as D{i}, adapterMeta as M{i}}} from '{e['importPath']}';")
    lines.append("")
    lines.append("export const fredBatch: FredBatchEntry[] = [")
    for i, e in enumerate(entries):
        lines.append("  {adapter:A%d, defaultProps:D%d, meta:M%d, id:%s, nativeFrames:%d, fps:%d, accent:%s, background:%s, sampleProps:%s, editableKeys:%s, sourceFrames:%d, sourceSha256:%s, adapterSha256:%s, adapterVersion:%s},"
                     % (i, i, i, json.dumps(e["id"]), e["nativeFrames"], e["fps"],
                        json.dumps(e["accent"]), json.dumps(e["background"]),
                        json.dumps(e["sampleProps"], ensure_ascii=False),
                        json.dumps(e["editableKeys"], ensure_ascii=False), e["nativeFrames"],
                        json.dumps(e["sourceSha256"]), json.dumps(e["adapterSha256"]), json.dumps(e["adapterVersion"])))
    lines.append("];")
    path = L.VS / "src" / "references" / "fredtalk-registry.generated.tsx"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    L.dump_json(L.VS / "src" / "references" / "fredtalk-registry.data.json", entries)
    print(f"registry: {len(entries)} adapted components")


if __name__ == "__main__":
    raise SystemExit(main())
