"""Verify a standalone audited asset export. Technical pass never means production approval."""
from pathlib import Path
import sys,json,hashlib
import av,numpy as np
from PIL import Image
p=Path(sys.argv[1])
def verify():
    r=json.loads((p/'receipt.json').read_text());s=r['settings']
    sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
    assert r['renderStatus']=='rendered-unverified' and r['productionApproved'] is False
    for file,expected in r['files'].items():
     assert Path(file).name==file,'Unsafe artifact path'
     assert sha(p/file)==expected,('Artifact hash mismatch',file)
    root=Path(__file__).parent
    for file,expected in r['rendererHashes'].items():
     resolved=(root/file).resolve();assert resolved.is_relative_to(root.resolve()),'Unsafe renderer path'
     assert sha(resolved)==expected,('Renderer changed since run',file)
    c=av.open(str(p/'asset.mp4'));v=c.streams.video[0]
    assert (v.width,v.height)==(s['width'],s['height']) and v.average_rate==s['fps'] and v.codec_context.name=='h264'
    assert len(c.streams.audio)==0,'Lottie-only asset clip should not acquire audio'
    bg=np.array([int(s['background'][i:i+2],16) for i in [1,3,5]])
    count=0;visible=0;changed=0;previous=None
    for f in c.decode(video=0):
     im=f.to_ndarray(format='rgb24').astype(np.int16);visible=max(visible,float(np.mean(np.max(abs(im-bg),axis=2)>20)))
     if previous is not None and float(np.abs(im-previous).mean())>.01:changed+=1
     previous=im;count+=1
    assert count==s['durationFrames'] and visible>.0001,('Frame count or blank video',count,visible)
    frames=r['frames'];assert sha(p/f'frame-1-{frames[1]}.png')==sha(p/f'frame-4-{frames[4]}.png'),'Unstable seek'
    qa={'status':'technical-pass','assetId':r['source']['assetId'],'video':{'sha256':sha(p/'asset.mp4'),'width':v.width,'height':v.height,'frames':count,'fps':s['fps'],'durationSeconds':count/s['fps'],'audio':'none'},'checks':{'receiptSha256':sha(p/'receipt.json'),'allArtifactHashesMatch':True,'rendererHashesMatch':True,'repeatSeekByteIdentical':True,'maxVisiblePixelFraction':visible,'changedFramePairs':changed},'visualReview':'pending','rights':'human declaration validated, not automatic legal verification','productionApproved':False}
    (p/'qa.json').write_bytes(json.dumps(qa,indent=2).encode());print(json.dumps(qa,indent=2))

try:
    verify()
except Exception as error:
    failed={'status':'blocked','reason':str(error),'productionApproved':False}
    if p.is_dir(): (p/'qa.json').write_bytes(json.dumps(failed,indent=2).encode())
    print(json.dumps(failed),file=sys.stderr)
    sys.exit(2)
