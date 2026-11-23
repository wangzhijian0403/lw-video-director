#!/usr/bin/env python3
"""LW Asset Engine command line. All indices and imported files remain project-local."""
import argparse, json, sys
from pathlib import Path
from lw_assets import (AssetIndex, read, recommend, search_openverse, write, review_flickr_cc,
                        select_for_shot, seed_workbench_assets, select_for_copy)

def main():
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('--project', required=True, type=Path)
    sub = p.add_subparsers(dest='command', required=True)
    sub.add_parser('list')
    imp = sub.add_parser('import'); imp.add_argument('file', type=Path); imp.add_argument('--metadata', type=Path, required=True)
    search = sub.add_parser('search-online'); search.add_argument('query'); search.add_argument('--media', choices=['images','audio'], default='images')
    candidate = sub.add_parser('candidate'); candidate.add_argument('metadata', type=Path)
    approve = sub.add_parser('approve'); approve.add_argument('asset_id'); approve.add_argument('--proof', type=Path, required=True)
    download = sub.add_parser('download'); download.add_argument('asset_id'); download.add_argument('--scope', default='project')
    rec = sub.add_parser('recommend'); rec.add_argument('--intent', type=Path, required=True); rec.add_argument('--scope', default='project')
    rev = sub.add_parser('review-flickr'); rev.add_argument('asset_id'); rev.add_argument('--scope', choices=['private-test','project','publish'],default='private-test')
    select = sub.add_parser('select'); select.add_argument('--intent', type=Path, required=True);select.add_argument('--scope',default='project')
    seed = sub.add_parser('seed'); seed.add_argument('--scope', default='project')
    seed.add_argument('--no-motion-prompt', action='store_true'); seed.add_argument('--no-originals', action='store_true')
    copy = sub.add_parser('from-copy'); copy.add_argument('--text'); copy.add_argument('--file', type=Path)
    copy.add_argument('--scope', default='project'); copy.add_argument('--libraries')
    copy.add_argument('--max-shots', type=int, default=12); copy.add_argument('--seed', action='store_true')
    args = p.parse_args(); index = AssetIndex(args.project)
    try:
        if args.command == 'list': result = index.all()
        elif args.command == 'import': result = index.import_file(args.file, read(args.metadata))
        elif args.command == 'search-online': result = search_openverse(index, args.query, args.media)
        elif args.command == 'candidate': result = index.register_candidate(read(args.metadata))
        elif args.command == 'approve': result = index.approve(args.asset_id, read(args.proof))
        elif args.command == 'download': result = index.download(args.asset_id, args.scope)
        elif args.command == 'review-flickr': result = review_flickr_cc(index,args.asset_id,args.scope)
        elif args.command == 'select': result = select_for_shot(index,read(args.intent),args.scope)
        elif args.command == 'seed': result = seed_workbench_assets(index, args.scope,
                    include_motion_prompt=not args.no_motion_prompt, include_originals=not args.no_originals)
        elif args.command == 'from-copy':
            text = args.text
            if not text and args.file:
                raw = Path(args.file).read_text(encoding='utf-8-sig')
                try:
                    parsed = json.loads(raw)
                    text = '\n'.join(parsed) if isinstance(parsed, list) else (parsed.get('copy') or parsed.get('text') if isinstance(parsed, dict) else parsed)
                except json.JSONDecodeError: text = raw
            if args.seed: seed_workbench_assets(index, args.scope)
            result = select_for_copy(index, text, args.scope,
                    libraries=[x.strip() for x in args.libraries.split(',') if x.strip()] if args.libraries else None,
                    max_shots=args.max_shots)
        else: result = recommend(index, read(args.intent), args.scope)
        print(json.dumps(result, ensure_ascii=False, indent=2)); return 0
    except (ValueError, OSError, KeyError, TypeError) as exc:
        print(json.dumps({'status':'blocked','error':str(exc)}, ensure_ascii=False)); return 2
    finally: index.close()

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8'); raise SystemExit(main())
