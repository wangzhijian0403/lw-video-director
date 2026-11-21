"""Shared helpers for the FredTalk batch adapter.

Two official, anonymous source channels are used:

1. ``asset-object`` – per-file objects served by fred-fu.com.  The catalog
   declares a SHA-256 for each file; the file is only accepted when the
   downloaded bytes hash to that value.
2. ``tag-tree`` – the public GitHub tag ``v2.5.0`` of njrhts2kvv-star/FredTalk.
   Older catalog rows point at ``/api/design-source/<id>`` endpoints that need
   a logged-in session; the same files are published in the tag tree.  We match
   them by declared path (or unique basename) inside the declared project folder.

No login, token, paywall or access-control bypass is performed.  Nothing is
written over the upstream files: downloads are kept byte-for-byte under
``external/fredtalk/.cache/sources/<LW-ID>/<original path>`` and the adapted
copy lives in a separate directory.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

VS = Path(__file__).resolve().parents[2]
EXT = VS / "external" / "fredtalk"
BATCH = EXT / "batch"
CACHE = EXT / ".cache"
SOURCE_CACHE = CACHE / "sources"
UPSTREAM_CATALOG = EXT / "library-catalog-v2.5.0.json"
LW_CATALOG = VS / "external" / "catalog.json"
REVISION = "59b9e9957957dc9f3fd94ab78f95cec33c29e915"
PUBLIC_TAG = "v2.5.0"
ASSET_CHANNELS = (
    "https://www.fred-fu.com/api/visual-library/assets/{sha}.txt",
    "https://www.fred-fu.com/visual-library-app/objects/{sha}.txt",
)
UA = "LW-FredTalk-Batch/1.0 (+https://github.com/wangzhijian0403/lw-video-director)"
TEXT_SUFFIXES = (".tsx", ".ts", ".jsx", ".js", ".mjs", ".json", ".md", ".css")


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def dump_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8", newline="\n") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    tmp.replace(path)


def upstream_items() -> list[dict]:
    return load_json(UPSTREAM_CATALOG)["items"]


_LW_CACHE: list[dict] | None = None


def lw_items() -> list[dict]:
    global _LW_CACHE
    if _LW_CACHE is None:
        _LW_CACHE = [x for x in load_json(LW_CATALOG) if x.get("provider") == "FredTalk"]
    return _LW_CACHE


_LW_MAP: dict[str, str] | None = None


def lw_id_for(ft_label: str) -> str | None:
    global _LW_MAP
    if _LW_MAP is None:
        _LW_MAP = {}
        for row in lw_items():
            m = re.match(r"FT-(.+)-(\d+)$", row["id"])
            if m:
                _LW_MAP[m.group(1)] = row["id"]
    return _LW_MAP.get(ft_label)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def http_get(url: str, timeout: int = 45, retries: int = 2) -> tuple[int, bytes]:
    last: tuple[int, bytes] = (0, b"")
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status, resp.read()
        except urllib.error.HTTPError as exc:
            body = exc.read() if hasattr(exc, "read") else b""
            last = (exc.code, body)
            if exc.code in (401, 403, 404, 410):
                return last
        except Exception:  # network reset, timeout
            last = (0, b"")
        time.sleep(1.0 + attempt)
    return last


_ASSET_MEMO: dict[str, tuple[str, bytes]] = {}


def fetch_asset(sha: str) -> tuple[str, bytes]:
    """Return (channel, bytes) for a declared SHA from the first working mirror."""
    if sha in _ASSET_MEMO:
        return _ASSET_MEMO[sha]
    result: tuple[str, bytes] = ("", b"")
    for channel in ASSET_CHANNELS:
        url = channel.format(sha=sha)
        status, body = http_get(url)
        if status == 200 and body and sha256_bytes(body) == sha:
            result = (channel.split("/")[3], body)
            break
        if status in (401, 403):
            result = ("", b"")
            break
    _ASSET_MEMO[sha] = result
    return result


# ---------------------------------------------------------------------------------
# Tag tree (public GitHub source archive)


class TagTree:
    """Index of the public FredTalk v2.5.0 tag checkout.

    The checkout is produced with a blob-filtered sparse clone so that only
    text sources are present (media is intentionally not vendored).
    """

    def __init__(self, root: Path):
        self.root = root
        self.files = [p for p in root.rglob("*") if p.is_file()]
        self._by_name: dict[str, list[Path]] = {}
        self._by_project: dict[str, list[Path]] = {}
        for p in self.files:
            self._by_name.setdefault(p.name, []).append(p)
            parts = p.as_posix().split("/components/projects/")
            if len(parts) == 2:
                pid = parts[1].split("/")[0]
                self._by_project.setdefault(pid, []).append(p)

    def find_exact(self, rel: str) -> Path | None:
        direct = self.root / rel
        if direct.is_file():
            return direct
        # the archive nests the project folder once more:
        # components/projects/<id>/<id>/src/...
        parts = Path(rel).parts
        if len(parts) >= 3 and parts[0] == "components" and parts[1] == "projects":
            nested = self.root / parts[0] / parts[1] / parts[2] / Path(*parts[3:])
            if nested.is_file():
                return nested
        return None

    def project_dirs(self, project: str) -> list[Path]:
        if not project.startswith("components/projects/"):
            return []
        pid = project.rstrip("/").split("/")[-1]
        dirs: list[Path] = []
        for hit in self._by_project.get(pid, []):
            rest = hit.as_posix().split(f"/components/projects/{pid}/", 1)[1]
            if rest.startswith(pid + "/"):
                base = self.root / "components" / "projects" / pid / pid
            else:
                base = self.root / "components" / "projects" / pid
            if base not in dirs:
                dirs.append(base)
        return dirs

    def find_in_project(self, project: str, declared: str | None, label: str) -> Path | None:
        if declared:
            exact = self.find_exact(declared)
            if exact:
                return exact
        base_name = (declared or label).split("/")[-1]
        for base in self.project_dirs(project):
            matches = [p for p in base.rglob(base_name) if p.is_file()]
            if matches:
                # prefer src/ paths and shallow ones
                matches.sort(key=lambda p: (("src/" not in p.as_posix()), len(p.parts)))
                return matches[0]
        # last resort: global unique basename
        matches = self._by_name.get(base_name, [])
        if len(matches) == 1:
            return matches[0]
        return None


def default_tag_root() -> Path:
    env = os.environ.get("FREDTALK_TAG_ROOT")
    if env:
        return Path(env)
    for cand in (CACHE / "upstream-v2.5.0", Path("/home/user/ft_up")):
        if (cand / "components" / "projects").is_dir():
            return cand
    return CACHE / "upstream-v2.5.0"


def ensure_tag_tree(root: Path) -> TagTree:
    if (root / "components" / "projects").is_dir():
        return TagTree(root)
    root.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "git", "clone", "--depth", "1", "--branch", PUBLIC_TAG, "--filter=blob:none",
            "--sparse", "https://github.com/njrhts2kvv-star/FredTalk.git", str(root),
        ],
        check=True,
    )
    subprocess.run(
        [
            "git", "sparse-checkout", "set", "--no-cone",
            "components/projects/**/*.tsx", "components/projects/**/*.ts",
            "components/projects/**/*.json", "library/**/*.json",
        ],
        cwd=root, check=True,
    )
    return TagTree(root)


# ---------------------------------------------------------------------------------
# Source resolution


@dataclass
class ResolvedSource:
    label: str
    declared_path: str | None
    declared_sha: str | None
    status: str                 # verified | hash-mismatch | missing | tag-verified
    channel: str | None
    url: str | None
    local: Path | None
    actual_sha: str | None
    bytes: int
    note: str = ""

    def as_dict(self) -> dict:
        return {
            "label": self.label,
            "path": self.declared_path,
            "declaredSha256": self.declared_sha,
            "actualSha256": self.actual_sha,
            "bytes": self.bytes,
            "status": self.status,
            "channel": self.channel,
            "url": self.url,
            "cachePath": str(self.local.relative_to(CACHE)) if self.local else None,
            "note": self.note,
        }


def resolve_item_sources(item: dict, tag: TagTree | None) -> list[ResolvedSource]:
    out: list[ResolvedSource] = []
    project = (item.get("implementation", {}).get("projects") or [""])[0]
    for src in item.get("sources", []):
        sha = src.get("sha256")
        label = src.get("label") or "source"
        path = src.get("path")
        got: ResolvedSource | None = None
        if sha:
            channel, body = fetch_asset(sha)
            if body:
                actual = sha256_bytes(body)
                got = ResolvedSource(label, path, sha, "verified", channel, ASSET_CHANNELS[0].format(sha=sha),
                                     _write_cache(item, path, label, body, sha), actual, len(body))
            else:
                got = ResolvedSource(label, path, sha, "missing", None, ASSET_CHANNELS[0].format(sha=sha),
                                     None, None, 0, note="HTTP 404/410 on both public mirrors")
        if got and got.status == "verified":
            out.append(got)
            continue
        if tag is not None:
            found = tag.find_in_project(project, path, label)
            if found:
                actual = sha256_file(found)
                body = found.read_bytes()
                local = _write_cache(item, path or f"__tag__/{found.name}", label, body, actual)
                out.append(ResolvedSource(label, path, sha, "tag-verified", "tag-tree", None, local, actual, len(body),
                                          note=f"public tag {PUBLIC_TAG}: {found.relative_to(tag.root)}"))
                continue
        if got:
            out.append(got)
        else:
            out.append(ResolvedSource(label, path, None, "missing", None, src.get("url"), None, None, 0,
                                      note="no anonymous object and no tag-tree match"))
    return out


def _write_cache(item: dict, declared_path: str | None, label: str, body: bytes, sha: str) -> Path:
    lw = lw_id_for(item["label"]) or item["label"]
    rel = declared_path or label
    rel = rel.replace("\\", "/").lstrip("/")
    # drop project prefixes so cache stays shallow and readable
    for prefix in ("components/projects/", ".artifacts/member-components/", "sources/"):
        if rel.startswith(prefix):
            rel = rel[len(prefix):]
    parts = [p for p in rel.split("/") if p and p not in (".", "..")]
    if not parts:
        parts = [label]
    target = SOURCE_CACHE / lw / Path(*parts)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if sha256_file(target) == sha:
            return target
        target = target.with_name(target.stem + "-" + sha[:8] + target.suffix)
    target.write_bytes(body)
    return target


# ---------------------------------------------------------------------------------
# Static analysis


IMPORT_RE = re.compile(r"(?:from\s+['\"]([^'\"]+)['\"]|import\s+['\"]([^'\"]+)['\"])")
STATIC_RE = re.compile(r"staticFile\(\s*['\"`]([^'\"`]+)['\"`]")
EXPORT_RE = re.compile(r"export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z0-9_]+)")


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def project_root_for(paths: Iterable[str]) -> str:
    roots = []
    for p in paths:
        posix = p.replace("\\", "/")
        if "/src/" in posix:
            roots.append(posix.split("/src/")[0])
        elif posix.startswith("src/"):
            roots.append("")
    if not roots:
        return ""
    # most common prefix
    counts: dict[str, int] = {}
    for r in roots:
        counts[r] = counts.get(r, 0) + 1
    return max(counts, key=counts.get)


def import_specs(path: Path) -> list[str]:
    txt = read_text(path)
    return [a or b for a, b in IMPORT_RE.findall(txt)]


def resolve_local_import(spec: str, importer: str, available: set[str], root: str) -> str | None:
    """Return the available relative path a local import resolves to."""
    if not spec.startswith("."):
        return None
    base = os.path.normpath(os.path.join(os.path.dirname(importer), spec)).replace("\\", "/")
    cands = [base]
    for suffix in TEXT_SUFFIXES:
        cands.append(base + suffix)
    for suffix in (".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"):
        cands.append(base + "/index" + suffix)
    for cand in cands:
        if cand in available:
            return cand
    # tolerate project-root prefixed keys
    prefixed = (root + "/" + cand).lstrip("/")
    if prefixed in available:
        return prefixed
    return None


def entry_candidates(item: dict, files: list[ResolvedSource]) -> list[ResolvedSource]:
    code = [f for f in files if f.local and f.local.suffix in (".tsx", ".ts", ".jsx", ".js")]
    comp_id = (item.get("implementation", {}).get("compositionId") or "").strip()
    symbols = set()
    if comp_id:
        symbols.add(comp_id)
        symbols.add(comp_id.split("-")[-1])
        symbols.add(comp_id.replace("-", ""))
        symbols.add(item.get("label", ""))
    out: list[ResolvedSource] = []
    for sym in symbols:
        if not sym:
            continue
        for f in code:
            names = set(EXPORT_RE.findall(read_text(f.local)))
            if sym in names:
                out.append(f)
    if out:
        return out
    label = item.get("label", "").lower().replace("-", "")
    for f in code:
        rel = (f.declared_path or f.local.name).lower().replace("-", "")
        if "components/" in rel and label and label in rel:
            out.append(f)
    if out:
        return out
    ranked = sorted(
        [f for f in code if f.local and "registry" not in (f.declared_path or f.local.name).lower()],
        key=lambda f: f.local.stat().st_size if f.local else 0,
        reverse=True,
    )
    return ranked[:1]


def extract_defaults_keys(path: Path) -> tuple[str | None, list[str]]:
    """Find ``export const xDefaults = {`` and return its top-level keys.

    This is deliberately a lexical reader, not an evaluator: upstream defaults
    may reference helpers, so only the structural keys are reported.  The
    generated adapter imports the real object at render time.
    """
    txt = read_text(path)
    m = re.search(r"export\s+const\s+([A-Za-z0-9_]+Defaults)\s*(?::[^=]+)?=\s*\{", txt)
    if not m:
        return None, []
    name = m.group(1)
    start = m.end() - 1
    depth = 0
    end = start
    in_str: str | None = None
    for i in range(start, len(txt)):
        ch = txt[i]
        if in_str:
            if ch == in_str and txt[i - 1] != "\\":
                in_str = None
            continue
        if ch in "'\"`":
            in_str = ch
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break
    body = txt[start + 1:end]
    keys: list[str] = []
    depth = 0
    in_str = None
    token = []
    i = 0
    while i < len(body):
        ch = body[i]
        if in_str:
            if ch == in_str and body[i - 1] != "\\":
                in_str = None
            i += 1
            continue
        if ch in "'\"`":
            in_str = ch
        elif ch in "{[(":
            depth += 1
        elif ch in "}])":
            depth -= 1
        elif depth == 0 and ch == ",":
            token = []
        elif depth == 0 and ch == ":":
            key = "".join(token).strip().strip("'\"")
            if re.match(r"^[A-Za-z_$][A-Za-z0-9_$]*$", key):
                keys.append(key)
            token = []
            i += 1
            # skip value to next top-level comma
            d2 = 0
            while i < len(body):
                c = body[i]
                if c in "'\"`":
                    q = c
                    i += 1
                    while i < len(body) and not (body[i] == q and body[i - 1] != "\\"):
                        i += 1
                elif c in "{[(":
                    d2 += 1
                elif c in "}])":
                    d2 -= 1
                elif c == "," and d2 == 0:
                    break
                i += 1
            token = []
            continue
        elif depth == 0 and not ch.isspace():
            token.append(ch)
        i += 1
    return name, keys


def media_refs(files: list[ResolvedSource]) -> list[str]:
    refs: list[str] = []
    for f in files:
        if not f.local or f.local.suffix not in (".tsx", ".ts"):
            continue
        for ref in STATIC_RE.findall(read_text(f.local)):
            if ref not in refs:
                refs.append(ref)
    return refs


def classify(item: dict, files: list[ResolvedSource], missing: list[str], entries: list[ResolvedSource]) -> tuple[str, str | None]:
    if not files:
        return "blocked-source", "no source file could be obtained from an official anonymous channel"
    if missing:
        return "blocked-dependency", "local imports unresolved: " + ", ".join(sorted(missing)[:6])
    if not entries:
        return "manual", "no exported component symbol could be identified"
    entry = entries[0]
    specs = import_specs(entry.local) if entry.local else []
    local = [s for s in specs if s.startswith(".")]
    if any(s.startswith("../kit") or s.startswith("./kit") for s in local):
        return "kit-overlay", None
    if any("/shared" in s or s in ("./shared", "../shared") for s in local):
        return "shared-kit", None
    if local:
        return "standalone-module", None
    return "standalone", None
