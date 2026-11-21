"""Actual 60fps MP4 + PNG checks for nested vector precomp profile."""
from pathlib import Path
import sys,json,hashlib
import av,numpy as np
from PIL import Image
p=Path(sys.argv[1]);video=p/'resource-compatibility.mp4'
c=av.open(str(video));stream=c.streams.video[0];frames=[f.to_ndarray(format='rgb24') for f in c.decode(video=0)]
assert len(frames)==240 and stream.average_rate==60 and (stream.width,stream.height)==(800,400)
def png(i,f):return np.asarray(Image.open(p/f'seek-{i}-{f}.png').convert('RGB'))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
assert sha(p/'seek-1-30.png')==sha(p/'seek-7-30.png')
assert sha(p/'seek-3-120.png')==sha(p/'seek-8-120.png')
left=lambda im:im[:,:400]
right=lambda im:im[:,400:]
assert np.array_equal(left(png(0,0)),left(png(3,120)))
assert np.array_equal(left(png(1,30)),left(png(4,150)))
assert np.array_equal(right(png(3,120)),right(png(6,239)))
motion=float(np.abs(left(png(0,0)).astype(float)-left(png(2,90))).mean());assert motion>1
# Validate the absolute nonzero in-point: at JSON frame 10 the paper center is y230.
# View is 320px high, vertically centered in 400px, so accent bounding box begins at 165.
im=left(png(0,0));mask=(im[:,:,1]>100)&(im[:,:,0]<100)&(im[:,:,2]>100)
ys,xs=np.where(mask);assert 163<=int(ys.min())<=167,(ys.min(),ys.max())
# Recursively applied theme must reach the grouped fill inside two precomps.
assert np.any(np.all(left(png(1,30))==[79,146,150],axis=2))
assert np.any(np.all(right(png(1,30))==[48,77,91],axis=2))
report={'status':'technical-pass','video':{'sha256':sha(video),'frames':240,'fps':60,'width':800,'height':400,'durationSeconds':4,'audio':'none; timing/visual compatibility test only'},'source':{'fps':30,'ip':10,'op':130,'precompDepth':2,'groupedShapes':True,'nullParent':True},'checks':{'repeatSeekByteIdentical':True,'loopRepeatsAfter120OutputFrames':True,'endHoldIdentical':True,'motionPixelDifference':motion,'nonzeroInPointBounds':{'minY':int(ys.min()),'maxY':int(ys.max())},'recursiveThemeColors':True},'review':'keyframes require inspection; no full-motion user approval'}
(p/'qa.json').write_bytes(json.dumps(report,indent=2).encode());print(json.dumps(report,indent=2))
