"""Check the actual external CC0 preview at its scheduled audio event in the MP4."""
import sys,json,hashlib,wave
from pathlib import Path
import av,numpy as np
p=Path(sys.argv[1]);acquired=Path(sys.argv[2]);video=p/'external-audio-poc.mp4'
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
source=json.loads((acquired/'receipt.json').read_text(encoding='utf8'))
assert sha(acquired/'source.mp3')==source['downloadSha256'] and sha(acquired/'audio.wav')==source['wavSha256']
c=av.open(str(video));v=c.streams.video[0];frames=sum(1 for _ in c.decode(video=0));assert frames==180 and v.average_rate==30 and (v.width,v.height)==(960,540)
c=av.open(str(video));a=c.streams.audio[0];res=av.AudioResampler(format='fltp',layout='mono',rate=48000);chunks=[]
for frame in c.decode(audio=0):
 for f in res.resample(frame):chunks.append(f.to_ndarray().reshape(-1))
for f in res.resample(None):chunks.append(f.to_ndarray().reshape(-1))
audio=np.concatenate(chunks)
with wave.open(str(acquired/'audio.wav'),'rb') as w:ref=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768*.6
clip=audio[48000:48000+len(ref)];corr=float(np.corrcoef(ref,clip)[0,1]);assert corr>.85,corr
assert max(abs(audio))<.99 and max(abs(audio[4800:38400]))<.001 and max(abs(audio[216000:264000]))<.001
report={'status':'technical-pass','video':{'sha256':sha(video),'width':960,'height':540,'frames':frames,'fps':30,'seconds':6,'videoCodec':v.codec_context.name,'audioCodec':a.codec_context.name},'event':{'assetId':source['assetId'],'startFrame':30,'startSeconds':1,'gain':.6,'correlationWithAcquiredWav':corr,'sourceVariant':source['downloadVariant'],'downloadSha256':source['downloadSha256'],'wavSha256':source['wavSha256']},'audioPeak':float(max(abs(audio))),'silenceBeforeAndAfter':True,'rights':{'license':'CC0-1.0','author':'qubodup','sourceUrl':source['sourceUrl']},'listeningReview':'pending; measured source correlation, not subjective listening','visualReview':'pending-user','productionApproved':False}
(p/'qa.json').write_bytes(json.dumps(report,indent=2).encode());print(json.dumps(report,indent=2))
