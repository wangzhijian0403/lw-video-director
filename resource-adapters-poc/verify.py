"""Decode the actual MP4; verify visual motion, seek stability and SFX correlation."""
import hashlib,json,sys,wave
from pathlib import Path
import av,numpy as np
from PIL import Image
p=Path(sys.argv[1]);root=Path(__file__).parent
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
video=p/'resource-adapters-poc.mp4'
c=av.open(str(video));v=c.streams.video[0]
frames=[f.to_ndarray(format='rgb24') for f in c.decode(video=0)]
assert len(frames)==180 and (v.width,v.height)==(960,540) and v.average_rate==30
c=av.open(str(video));a=c.streams.audio[0];res=av.AudioResampler(format='fltp',layout='mono',rate=48000)
chunks=[]
for frame in c.decode(audio=0):
 for out in res.resample(frame):chunks.append(out.to_ndarray().reshape(-1))
for out in res.resample(None):chunks.append(out.to_ndarray().reshape(-1))
audio=np.concatenate(chunks)
assert a.codec_context.name=='aac' and v.codec_context.name=='h264'
assert max(abs(audio))<.99
events=[]
for name,start,seconds,volume in [('pulp-splash',1,1,.65),('paper-lift',3,1.2,.7)]:
 with wave.open(str(root/'public'/f'{name}.wav'),'rb') as w:reference=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768*volume
 clip=audio[round(start*48000):round(start*48000)+len(reference)]
 correlation=float(np.corrcoef(reference,clip)[0,1])
 # AAC discards part of the high-frequency rustle; compare 10 ms RMS envelopes too.
 n=len(clip)//480
 envelope=lambda x:np.sqrt(np.mean(x[:n*480].reshape(n,480)**2,axis=1))
 envelopeCorrelation=float(np.corrcoef(envelope(reference),envelope(clip))[0,1])
 assert correlation>.65 and envelopeCorrelation>.95,(name,correlation,envelopeCorrelation)
 events.append({'assetId':name,'startSeconds':start,'correlationWithSource':correlation,'rmsEnvelopeCorrelation':envelopeCorrelation,'rms':float(np.sqrt(np.mean(clip**2)))})
quiet=audio[round(.1*48000):round(.8*48000)];assert max(abs(quiet))<.001
seekStable=sha(p/'seek-1-30.png')==sha(p/'seek-6-30.png') and sha(p/'seek-2-60.png')==sha(p/'seek-5-60.png')
assert seekStable
# Isolate center Lottie region from icons/progress/mountains: the shape must move.
motion=float(np.abs(frames[30][180:400,350:610].astype(float)-frames[110][180:400,350:610]).mean());assert motion>1
report={'status':'technical-pass','video':{'sha256':sha(video),'codec':v.codec_context.name,'width':v.width,'height':v.height,'fps':30,'frames':len(frames),'durationSeconds':6},'audio':{'codec':a.codec_context.name,'sampleRate':48000,'peak':float(max(abs(audio))),'quietBeforeEvents':True,'events':events},'seekRepeatByteIdentical':seekStable,'lottieRegionMeanPixelChange':motion,'visualReview':'keyframes inspected; full-motion/user review pending','listeningReview':'not performed; waveform and source correlation measured'}
(p/'qa.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
