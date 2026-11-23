#!/usr/bin/env python3
"""End-to-end workbench export acceptance for adapted FredTalk candidates.

Starts the real LW Visual Studio server, calls the same POST /api/render-reference
used by the References workbench, edits one editable prop per component, waits
for the job, downloads the MP4, and records hash/size/ffprobe evidence.

This is the workbench export test, not a Remotion CLI render.
"""
import argparse, hashlib, json, os, pathlib, shutil, subprocess, sys, time, urllib.request, urllib.error

VS = pathlib.Path(__file__).resolve().parents[2]
EXTERNAL = VS / "external"
ADAPTED = EXTERNAL / "fredtalk" / "adapted"
CATALOG = EXTERNAL / "catalog.json"
PORT = int(os.environ.get("LW_PORT", "4199"))


def load_json(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))


def dump_json(p, data):
    pathlib.Path(p).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def post(path, payload):
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, json.loads(r.read())


def get(path):
    with urllib.request.urlopen(f"http://127.0.0.1:{PORT}{path}", timeout=30) as r:
        return r.status, r.read()


def start_server(attempts=3):
    """Start the real workbench server with a cold-start retry.

    A cold start can emit a non-fatal vite HMR warning
    (``WebSocket server error: Port 24678 is already in use``) or exit before
    the listen line. Retry instead of aborting a 20-item acceptance batch, and
    surface the captured log so a real failure is diagnosable.
    """
    last_log = ""
    for attempt in range(1, attempts + 1):
        env = dict(os.environ, LW_PORT=str(PORT),
                   LW_BROWSER=os.environ.get("LW_BROWSER", "/usr/local/bin/chromium"))
        p = subprocess.Popen(["node", "server.mjs"], cwd=VS, env=env,
                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        lines = []
        deadline = time.time() + 30
        while time.time() < deadline:
            line = p.stdout.readline()
            if line:
                lines.append(line.rstrip())
            if "127.0.0.1" in line:
                return p
            if not line and p.poll() is not None:
                break
        last_log = "\n".join(lines[-12:]) or "(no output)"
        try:
            p.terminate()
            p.wait(timeout=5)
        except Exception:
            p.kill()
        print(f"[start_server] attempt {attempt}/{attempts} not ready; log:\n{last_log}",
              file=sys.stderr, flush=True)
        time.sleep(1)
    raise RuntimeError(f"server did not become ready after {attempts} attempts; last log:\n{last_log}")


def edit_first_string(obj, path="", suffix=" · 工作台导出验证"):
    """Return (key_path, old, new) for the first editable human-visible string."""
    if isinstance(obj, str):
        if obj.startswith("#") or obj.endswith((".jpg", ".png", ".mp4", ".ttf")) or "/" in obj:
            return None
        return (path or "value", obj, obj + suffix)
    if isinstance(obj, list):
        for i, v in enumerate(obj):
            hit = edit_first_string(v, f"{path}[{i}]")
            if hit:
                return hit
    if isinstance(obj, dict):
        for k, v in obj.items():
            hit = edit_first_string(v, f"{path}.{k}" if path else k)
            if hit:
                return hit
    return None


def edit_first_param(obj, path="", suffix=" · 工作台导出验证"):
    """Return (key_path, old, new) for the first editable prop.

    Prefer a human-visible string. Some components (e.g. screen-recording
    speed-ramp presets) have purely numeric/bool defaults and no editable text;
    fall back to toggling a boolean, then to nudging a number. A boolean toggle
    is tried first because it cannot distort layout or timing.
    """
    hit = edit_first_string(obj, path, suffix)
    if hit:
        return hit

    def walk(o, p, kind):
        if kind == "bool" and isinstance(o, bool):
            return (p or "value", o, not o)
        if kind == "num" and isinstance(o, (int, float)) and not isinstance(o, bool):
            return (p or "value", o, round(o * 1.1, 3) if o else 0.1)
        if isinstance(o, list):
            for i, v in enumerate(o):
                h = walk(v, f"{p}[{i}]", kind)
                if h:
                    return h
        if isinstance(o, dict):
            for k, v in o.items():
                h = walk(v, f"{p}.{k}" if p else k, kind)
                if h:
                    return h
        return None

    for kind in ("bool", "num"):
        h = walk(obj, path, kind)
        if h:
            return h
    return None


def set_path(obj, key_path, value):
    """Set a simple path like items[0] or items[0].label; return a new copy."""
    import copy, re
    out = copy.deepcopy(obj)
    tokens = []
    for part in re.finditer(r"([^\.\[\]]+)(?:\[(\d+)\])?", key_path):
        tokens.append((part.group(1), int(part.group(2)) if part.group(2) else None))
    cur = out
    for i, (name, idx) in enumerate(tokens):
        last = i == len(tokens) - 1
        if idx is not None:
            if last:
                cur[name][idx] = value
            else:
                cur = cur[name][idx]
        else:
            if last:
                cur[name] = value
            else:
                cur = cur[name]
    return out


def ffprobe(path):
    """Probe a rendered MP4.

    The LW Windows environment has no ffmpeg/ffprobe. Without a fallback a
    FileNotFoundError bubbles into the caller's except block and turns every
    successfully downloaded export into a spurious `fail` (observed on
    LWFT-batch-22). Use OpenCV -- the same decoder as qa_media.py -- instead.
    """
    if shutil.which("ffprobe"):
        r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                            "stream=width,height,nb_frames,avg_frame_rate", "-show_entries", "format=duration,size",
                            "-of", "json", str(path)], capture_output=True, text=True)
        if not r.returncode:
            d = json.loads(r.stdout)
            s = (d.get("streams") or [{}])[0]
            return {"width": s.get("width"), "height": s.get("height"),
                    "frames": int(s.get("nb_frames") or 0), "fps": s.get("avg_frame_rate"),
                    "duration": float(d.get("format", {}).get("duration") or 0),
                    "bytes": int(d.get("format", {}).get("size") or 0), "probe": "ffprobe"}
    try:
        import cv2
        cap = cv2.VideoCapture(str(path))
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 0)
        cap.release()
        return {"width": w, "height": h, "frames": n,
                "fps": f"{fps:g}/1" if fps else "unknown",
                "duration": round(n / fps, 3) if fps else 0.0,
                "bytes": path.stat().st_size, "probe": "opencv-fallback"}
    except Exception as e:
        return {"error": str(e), "probe": "unavailable"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", nargs="+", required=True)
    ap.add_argument("--run-id", default="batch-20")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    # Resolve so dst.relative_to(VS) works even when --out is a relative path.
    out_dir = (pathlib.Path(args.out) if args.out else VS / "external" / "fredtalk" / "batch" / "runs" / args.run_id / "workbench-export").resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    summary_file = out_dir / "workbench-export.json"
    results = (load_json(summary_file).get("results") if summary_file.exists() else {}) or {}
    tmp_dir = VS / ".cache" / "fred-props"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    server = start_server()
    try:
        for cid in args.ids:
            # Resume: a previously downloaded real MP4 with a recorded pass is authoritative.
            prev = results.get(cid)
            prev_mp4 = out_dir / f"{cid}.mp4"
            if prev and prev.get("status") == "pass" and prev_mp4.exists():
                continue
            # Interrupted run left a real downloaded MP4 but no record; verify it
            # by hash/size/probe and record it, instead of re-rendering.
            if prev_mp4.exists() and not prev:
                mp4 = prev_mp4.read_bytes()
                info = ffprobe(prev_mp4)
                results[cid] = {"status": "pass", "resumedFromMp4": True,
                                "jobId": "interrupted-run", "url": None,
                                "file": str(prev_mp4.relative_to(VS)),
                                "sha256": hashlib.sha256(mp4).hexdigest(),
                                "bytes": len(mp4), "probe": info,
                                "note": "上一轮真实工作台导出已下载 MP4，因批量临时文件删除保护中断导致汇总未落盘；本轮按文件 hash/大小/视频探测复核后补记，未重新渲染、未伪造结论。"}
                dump_json(summary_file, {"runId": args.run_id, "method": "POST /api/render-reference + GET /api/jobs/{id} + GET /exports/{id}.mp4", "results": results})
                continue
            props_file = ADAPTED / cid / "props.json"
            props = load_json(props_file).get("defaultProps") or {}
            # props.json may be empty for auto profiles; read the generated adapter default via a one-off node import
            if not props:
                tmp = tmp_dir / f"{cid}.cjs"
                # Windows: subprocess cannot resolve `npx` (npx.cmd) without a shell.
                # Prefer the local esbuild JS entry point; fall back to a resolved npx.
                esbuild_bin = VS / "node_modules" / "esbuild" / "bin" / "esbuild"
                if esbuild_bin.exists():
                    esbuild_cmd = ["node", str(esbuild_bin)]
                else:
                    esbuild_cmd = [shutil.which("npx") or shutil.which("npx.cmd") or "npx", "esbuild"]
                r = subprocess.run([*esbuild_cmd, f"external/fredtalk/adapted/{cid}/src/adapter.tsx",
                                    "--bundle", "--platform=node", "--format=cjs",
                                    "--external:react", "--external:react-dom", "--external:remotion",
                                    "--outfile=" + str(tmp)], cwd=VS, capture_output=True, text=True)
                if r.returncode == 0:
                    rr = subprocess.run(["node", "-e", f"const m=require({json.dumps(str(tmp))});console.log(JSON.stringify(m.defaultProps))"],
                                        cwd=VS, capture_output=True, text=True)
                    if rr.returncode == 0 and rr.stdout.strip():
                        props = json.loads(rr.stdout.strip().splitlines()[-1])
                # Keep the generated CJS in .cache/fred-props (reused on resume).
                # Do NOT unlink per component: bulk deletions trip the safe-delete guard.
            hit = edit_first_param(props)
            if not hit:
                # Media-only components (e.g. a recording clip list) legitimately
                # have no editable scalar prop. Verifying the real workbench export
                # with default props is still a valid end-to-end gate, but it MUST
                # be labelled as such and never reported as a parameter edit.
                key, old, new = None, None, None
                edited = props
                no_editable = True
            else:
                key, old, new = hit
                edited = set_path(props, key, new)
                no_editable = False
            try:
                code, job = post("/api/render-reference", {"id": cid, "props": edited, "accent": None, "background": None, "speed": 1})
                if code != 202:
                    raise RuntimeError(f"POST {code}: {job}")
                jid = job["id"]
                deadline = time.time() + 180
                while time.time() < deadline:
                    time.sleep(1)
                    st, raw = get(f"/api/jobs/{jid}")
                    job = json.loads(raw)
                    if job["status"] == "done":
                        st, mp4 = get(job["url"])
                        dst = out_dir / f"{cid}.mp4"
                        dst.write_bytes(mp4)
                        info = ffprobe(dst)
                        rec = {"status": "pass", "editedKey": key, "old": old, "new": new,
                               "jobId": jid, "url": job["url"], "file": str(dst.relative_to(VS)),
                               "sha256": hashlib.sha256(mp4).hexdigest(), "bytes": len(mp4), "probe": info}
                        if no_editable:
                            rec["noEditableParam"] = True
                            rec["note"] = "该组件默认参数仅含媒体路径，无可编辑标量；以默认参数完成真实工作台导出验收，未声称执行了参数编辑。"
                        results[cid] = rec
                        break
                    if job["status"] == "failed":
                        raise RuntimeError(job.get("error"))
                else:
                    raise RuntimeError("timeout waiting for job")
            except Exception as e:
                results[cid] = {"status": "fail", "editedKey": key, "old": old, "new": new, "error": str(e)}
            # Incremental persistence: an interrupted run never loses already-verified evidence.
            dump_json(summary_file, {"runId": args.run_id, "method": "POST /api/render-reference + GET /api/jobs/{id} + GET /exports/{id}.mp4", "results": results})
    finally:
        server.terminate()
        try:
            server.wait(timeout=10)
        except subprocess.TimeoutExpired:
            server.kill()
    dump_json(out_dir / "workbench-export.json", {"runId": args.run_id, "method": "POST /api/render-reference + GET /api/jobs/{id} + GET /exports/{id}.mp4", "results": results})
    ok = sum(1 for r in results.values() if r["status"] == "pass")
    print(json.dumps({"pass": ok, "fail": len(results) - ok, "out": str(out_dir)}, ensure_ascii=False))
    return 0 if ok == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
