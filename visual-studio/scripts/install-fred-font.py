"""Install the exact unmodified OFL font used by the FredTalk adapter; keep its license."""
from pathlib import Path
import urllib.request,hashlib
ROOT=Path(__file__).resolve().parents[1]
url='https://raw.githubusercontent.com/njrhts2kvv-star/FredTalk/59b9e9957957dc9f3fd94ab78f95cec33c29e915/library/fonts/SmileySans-Oblique.ttf'
expected='b447d7e781f08bc95c4c9f23ba71ed2b8ebb639aa7184485c71c4ca5afcd25c4'
p=ROOT/'public/fredtalk/SmileySans-Oblique.ttf'
if p.exists():
    if hashlib.sha256(p.read_bytes()).hexdigest()!=expected:raise SystemExit('Existing font differs; preserved, inspect manually')
else:
    with urllib.request.urlopen(url,timeout=30) as r:b=r.read(4*1024*1024)
    if hashlib.sha256(b).hexdigest()!=expected:raise SystemExit('Font hash mismatch')
    p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
print('Verified OFL SmileySans font; license: external/fredtalk/t03e/SmileySans-LICENSE.txt')
