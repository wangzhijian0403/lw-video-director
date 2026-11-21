"""Offline provider discovery and existing LW References search; never claims auto semantic retrieval."""
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def search(query='',kind=None,items=False):
    providers=json.loads((ROOT/'resources/providers.json').read_text(encoding='utf-8'))['providers']
    if items:
        source=json.loads((ROOT/'visual-studio/external/catalog.json').read_text(encoding='utf-8'))
        records=[{'id':x['id'],'name':x.get('name'),'provider':x.get('provider'),'kind':'animation','sourceUrl':x.get('officialUrl'),'license':x.get('license'),'installStatus':x.get('installStatus'),'renderStatus':x.get('renderStatus'),'executable':x.get('executable',False),'notes':'Existing item state, not promoted by provider inclusion'} for x in source]
    else:records=providers
    words=query.casefold().split()
    return [x for x in records if (not kind or x.get('kind')==kind) and all(w in json.dumps(x,ensure_ascii=False).casefold() for w in words)]
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--query',default='');p.add_argument('--kind',choices=['style','workflow','index','animation','icon','audio','framework','tool']);p.add_argument('--items',action='store_true');p.add_argument('--limit',type=int,default=20);a=p.parse_args()
    if not 1<=a.limit<=100:p.error('limit must be 1..100')
    results=search(a.query,a.kind,a.items)
    print(json.dumps({'mode':'literal-metadata-search','total':len(results),'results':results[:a.limit],'note':'Discovery is not asset authorization or render approval; acquire per-project without first adding to a library.'},ensure_ascii=False,indent=2))
