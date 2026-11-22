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


def start_server():
    env = dict(os.environ, LW_PORT=str(PORT), LW_BROWSER=os.environ.get("LW_BROWSER", "/usr/local/bin/chromium"))
    p = subprocess.Popen(["node", "server.mjs"], cwd=VS, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    deadline = time.time() + 30
    while time.time() < deadline:
        line = p.stdout.readline()
        if "127.0.0.1" in line:
            return p
        if p.poll() is not None:
            raise RuntimeError("server exited: " + (line or ""))
    raise RuntimeError("server did not become ready")


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
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height,nb_frames,avg_frame_rate", "-show_entries", "format=duration,size",
                        "-of", "json", str(path)], capture_output=True, text=True)
    if r.returncode:
        return {"error": r.stderr.strip()}
    d = json.loads(r.stdout)
    s = (d.get("streams") or [{}])[0]
    return {"width": s.get("width"), "height": s.get("height"), "frames": int(s.get("nb_frames") or 0),
            "fps": s.get("avg_frame_rate"), "duration": float(d.get("format", {}).get("duration") or 0),
            "bytes": int(d.get("format", {}).get("size") or 0)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", nargs="+", required=True)
    ap.add_argument("--run-id", default="batch-20")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    out_dir = pathlib.Path(args.out) if args.out else VS / "external" / "fredtalk" / "batch" / "runs" / args.run_id / "workbench-export"
    out_dir.mkdir(parents=True, exist_ok=True)
    summary_file = out_dir / "workbench-export.json"
    results = (load_json(summary_file).get("results") if summary_file.exists() else {}) or {}
    server = start_server()
    try:
        for cid in args.ids:
            props_file = ADAPTED / cid / "props.json"
            props = load_json(props_file).get("defaultProps") or {}
            # props.json may be empty for auto profiles; read the generated adapter default via a one-off node import
            if not props:
                tmp = VS / f".tmp-{cid}.cjs"
                r = subprocess.run(["npx", "esbuild", f"external/fredtalk/adapted/{cid}/src/adapter.tsx",
                                    "--bundle", "--platform=node", "--format=cjs",
                                    "--external:react", "--external:react-dom", "--external:remotion",
                                    "--outfile=" + str(tmp)], cwd=VS, capture_output=True, text=True)
                if r.returncode == 0:
                    rr = subprocess.run(["node", "-e", f"const m=require('./{tmp.name}');console.log(JSON.stringify(m.defaultProps))"],
                                        cwd=VS, capture_output=True, text=True)
                    if rr.returncode == 0 and rr.stdout.strip():
                        props = json.loads(rr.stdout.strip().splitlines()[-1])
                tmp.unlink(missing_ok=True)
            hit = edit_first_string(props)
            if not hit:
                results[cid] = {"status": "fail", "error": "no editable string prop found", "defaultProps": props}
                continue
            key, old, new = hit
            edited = set_path(props, key, new)
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
                        results[cid] = {"status": "pass", "editedKey": key, "old": old, "new": new,
                                        "jobId": jid, "url": job["url"], "file": str(dst.relative_to(VS)),
                                        "sha256": hashlib.sha256(mp4).hexdigest(), "bytes": len(mp4), "probe": info}
                        break
                    if job["status"] == "failed":
                        raise RuntimeError(job.get("error"))
                else:
                    raise RuntimeError("timeout waiting for job")
            except Exception as e:
                results[cid] = {"status": "fail", "editedKey": key, "old": old, "new": new, "error": str(e)}
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
