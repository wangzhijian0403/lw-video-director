"""Original procedural foley. Not field recordings, not library samples. MIT.
Seeded noise + damped resonances; 48 kHz mono PCM16; no external inputs.
"""
import math, random, struct, wave
from pathlib import Path
root=Path(__file__).parent/'public'
root.mkdir(exist_ok=True)
for name,seconds,seed in [('pulp-splash',1,417),('paper-lift',1.2,418)]:
    rng=random.Random(seed); samples=[]; low=0; prev=0
    for i in range(round(48000*seconds)):
        t=i/48000; noise=rng.uniform(-1,1); low=.92*low+.08*noise
        if name=='pulp-splash':
            env=(1-math.exp(-90*t))*math.exp(-6*t)
            s=env*(.75*low+.18*noise+.18*math.sin(2*math.pi*(350*t-90*t*t))*math.exp(-4*t))
        else:
            env=math.sin(math.pi*t/seconds)**1.5
            s=env*(noise-prev)*(.08+.12*math.sin(2*math.pi*13*t)**2)
        prev=noise;samples.append(s)
    scale=.55/max(abs(x) for x in samples)
    with wave.open(str(root/f'{name}.wav'),'wb') as out:
        out.setparams((1,2,48000,0,'NONE','not compressed'))
        out.writeframes(b''.join(struct.pack('<h',round(x*scale*32767)) for x in samples))
