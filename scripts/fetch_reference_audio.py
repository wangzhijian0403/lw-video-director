"""Fetch one pinned public CC0 preview into a project. No login-only original download."""
import argparse,hashlib,json,urllib.request,urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(b):return hashlib.sha256(b).hexdigest()
def fetch(asset_id,output):
    entry=next((a for a in json.loads((ROOT/'resources/audio-examples.json').read_text(encoding='utf8'))['assets'] if a['assetId']==asset_id),None)
    if not entry:raise ValueError('Unknown reviewed audio example')
    p=Path(output)
    if p.exists():raise ValueError('Output exists; use a new project directory')
    # Both hosts and concrete URLs come from the reviewed example manifest, not arbitrary user URLs.
    for key,host in [('sourceUrl','freesound.org'),('downloadUrl','cdn.freesound.org')]:
        u=urllib.parse.urlparse(entry[key])
        if u.scheme!='https' or u.hostname!=host:raise ValueError('Unreviewed source host')
    with urllib.request.urlopen(entry['sourceUrl'],timeout=25) as r:page=r.read(2*1024*1024+1)
    if len(page)>2*1024*1024:raise ValueError('Source page too large')
    text=page.decode('utf8')
    if 'creativecommons.org/publicdomain/zero/1.0' not in text or entry['downloadUrl'] not in text or entry['author'] not in text:raise ValueError('Current source no longer matches reviewed CC0 preview')
    with urllib.request.urlopen(entry['downloadUrl'],timeout=25) as r:audio=r.read(10*1024*1024+1)
    if len(audio)>10*1024*1024 or sha(audio)!=entry['sha256']:raise ValueError('Audio changed or size limit exceeded; review again')
    import av
    p.parent.mkdir(parents=True,exist_ok=True);p.mkdir()
    (p/'source-page.html').write_bytes(page);(p/'source.mp3').write_bytes(audio)
    # Decode/resample the acquired compressed preview; never relabel it as the original FLAC.
    src=av.open(str(p/'source.mp3'));res=av.AudioResampler(format='s16',layout='mono',rate=48000)
    import wave
    with wave.open(str(p/'audio.wav'),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(48000)
        for frame in src.decode(audio=0):
            for f in res.resample(frame):w.writeframes(f.to_ndarray().reshape(-1).tobytes())
        for f in res.resample(None):w.writeframes(f.to_ndarray().reshape(-1).tobytes())
    receipt={**entry,'status':'downloaded-and-decoded','sourcePageSha256':sha(page),'downloadSha256':sha(audio),'wavSha256':sha((p/'audio.wav').read_bytes()),'rightsScopes':{'reference':True,'download':True,'adapt':True,'render':True,'redistribute':True},'renderStatus':'not-run','productionApproved':False}
    (p/'receipt.json').write_bytes(json.dumps(receipt,ensure_ascii=False,indent=2).encode());return receipt
if __name__=='__main__':
    a=argparse.ArgumentParser(description=__doc__);a.add_argument('asset_id');a.add_argument('--output',required=True);v=a.parse_args()
    try:print(json.dumps(fetch(v.asset_id,v.output),ensure_ascii=False,indent=2))
    except Exception as e:print(json.dumps({'status':'blocked','reason':str(e),'productionApproved':False}));raise SystemExit(2)
