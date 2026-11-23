"""Project-owned asset index. Never executes imported source code or assumes local == licensed."""
from __future__ import annotations
import hashlib, ipaddress, json, os, re, shutil, socket, sqlite3, tempfile, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[1]
_local = SKILL_ROOT / 'asset-runtime.local.json'
ROOT = Path(os.environ.get('LW_DIRECTOR_REPO') or (json.loads(_local.read_text(encoding='utf8'))['repoPath'] if _local.is_file() else SKILL_ROOT)).resolve()
KINDS = {'video', 'image', 'screen-recording', 'audio', 'music', 'sound-effect', 'font', 'mg'}
LIBRARIES = {'user-local', 'lw-originals', 'lw-references'}
SCOPES = {'private-test', 'project', 'publish'}
PARENTS = {'continuity': 'storytelling', 'editing': 'storytelling', 'storyboard': 'storytelling',
           'narration': 'communication', 'subtitles': 'communication', 'storytelling': 'communication',
           'camera': 'motion', 'scan': 'motion', 'transition': 'motion', 'chart': 'explanation',
           'comparison': 'explanation', 'evidence': 'explanation', 'workflow': 'explanation'}

def now(): return datetime.now(timezone.utc).isoformat()
def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''): h.update(chunk)
    return h.hexdigest()
def read(path): return json.loads(Path(path).read_text(encoding='utf-8-sig'))
def write(path, data):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def rights_ok(asset, action, scope='project'):
    r = asset.get('rights', {})
    return (r.get(action) is True and bool(r.get('evidence')) and bool(r.get('license'))
            and bool(r.get('reviewer')) and scope in r.get('scopes', [])
            and bool(asset.get('author')) and bool(asset.get('source')))

def validate_rights(rights):
    if not isinstance(rights, dict): raise ValueError('rights must be an object')
    if any(type(rights.get(k, False)) is not bool for k in ('download', 'adapt', 'render')):
        raise ValueError('permission flags must be booleans')
    if any(rights.get(k) for k in ('download', 'adapt', 'render')):
        if not all(rights.get(k) for k in ('license', 'evidence', 'reviewer', 'scopes')):
            raise ValueError('permissions need license/evidence/reviewer/scopes; local ownership is not inferred')
    if not isinstance(rights.get('scopes', []), list) or not set(rights.get('scopes', [])) <= SCOPES:
        raise ValueError('invalid rights scopes')

def probe(path, hint=None):
    from PIL import Image, ImageFont
    import av
    path = Path(path)
    if path.suffix.lower() in ('.ttf', '.otf', '.ttc', '.woff', '.woff2'):
        signatures = (b'\x00\x01\x00\x00', b'OTTO', b'ttcf', b'wOFF', b'wOF2')
        with path.open('rb') as f:
            if f.read(4) not in signatures: raise ValueError('invalid font signature')
        face=ImageFont.truetype(str(path),16)
        return 'font', {'bytes': path.stat().st_size, 'fontFormat': path.suffix.lower(), 'family':face.getname()}
    if path.name.endswith('.lwmg.json'):
        d = read(path); cid = d.get('componentId'); lib = d.get('library')
        if lib == 'lw-originals':
            registry = read(ROOT / 'visual-studio/src/catalog/manifest.json')['components']
            status = read(ROOT / 'visual-studio/src/catalog/quality.json').get(cid, {})
            valid = any(c['id'] == cid for c in registry) and status.get('renderStatus') == 'passed'
        elif lib == 'lw-references':
            valid = any(c['id'] == cid and c.get('executable') is True and c.get('renderStatus') == 'passed'
                        for c in read(ROOT / 'visual-studio/external/catalog.json'))
        else: valid = False
        return 'mg', {'componentId': cid, 'library': lib, 'adapterVerified': valid,
                      'descriptorOnly': True, 'arbitrarySourceExecution': False}
    try:
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im: return 'image', {'width': im.width, 'height': im.height, 'format': im.format}
    except (OSError, ValueError): pass
    with av.open(str(path)) as media:
        streams = []
        for s in media.streams:
            c = s.codec_context; info = {'type': s.type, 'codec': c.name}
            if s.type == 'video': info.update(width=c.width, height=c.height, fps=float(s.average_rate or 0))
            if s.type == 'audio': info.update(sampleRate=c.sample_rate, channels=c.channels)
            streams.append(info)
        if media.streams.video:
            next(media.decode(video=0))
            kind = 'screen-recording' if hint == 'screen-recording' else 'video'
        elif media.streams.audio:
            next(media.decode(audio=0))
            kind = hint if hint in ('music', 'sound-effect') else 'audio'
        else: raise ValueError('no decodable audio or video stream')
        return kind, {'duration': media.duration / av.time_base if media.duration else None, 'streams': streams,
                      'classificationBasis': 'decoded streams; music/screen/SFX roles are declared, not inferred'}

def public_https(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('only public HTTPS without embedded credentials is allowed')
    # The fixed metadata provider is trusted by identity; the proxy may synthesize IPv6 routes.
    if parsed.hostname == 'api.openverse.org': return url
    for item in socket.getaddrinfo(parsed.hostname, parsed.port or 443, family=socket.AF_INET, type=socket.SOCK_STREAM):
        if not ipaddress.ip_address(item[4][0]).is_global: raise ValueError('non-public destination blocked')
    return url

class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_https(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch_bytes(url, limit=4 * 1024 * 1024):
    public_https(url)
    req = urllib.request.Request(url, headers={'User-Agent': 'LW-Asset-Engine/0.1 (local media licensing research)'})
    with urllib.request.build_opener(SafeRedirect()).open(req, timeout=20) as response:
        public_https(response.url); data = response.read(limit + 1)
        if len(data) > limit: raise ValueError('response exceeds size limit')
        return data

class AssetIndex:
    def __init__(self, project):
        self.project = Path(project).resolve(); self.root = self.project / 'assets'
        self.root.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.root / 'index.sqlite')
        self.db.execute('CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY, record TEXT NOT NULL)')
        self.db.execute('CREATE TABLE IF NOT EXISTS usages(id TEXT, project TEXT, scene TEXT, output_hash TEXT, at TEXT, UNIQUE(id,project,scene,output_hash))')
        self.db.commit()
    def close(self): self.db.close()
    def all(self): return [json.loads(r[0]) for r in self.db.execute('SELECT record FROM assets ORDER BY id')]
    def get(self, aid):
        row = self.db.execute('SELECT record FROM assets WHERE id=?', (aid,)).fetchone()
        if not row: raise ValueError('unknown asset ID: ' + str(aid))
        return json.loads(row[0])
    def save(self, data):
        self.db.execute('INSERT OR REPLACE INTO assets VALUES(?,?)', (data['assetId'], json.dumps(data, ensure_ascii=False)))
        self.db.commit(); return data
    def path(self, asset):
        raw = asset.get('path')
        if not raw: raise ValueError('asset is metadata-only')
        path = (self.project / raw).resolve()
        if not path.is_relative_to(self.root): raise ValueError('asset path escaped project assets')
        if not path.is_file() or digest(path) != asset.get('sha256'): raise ValueError('asset missing or hash changed')
        return path
    def import_file(self, file, metadata, scope='project'):
        file = Path(file).resolve(strict=True); m = dict(metadata)
        if m.get('library') not in LIBRARIES or not m.get('source') or not m.get('author'):
            raise ValueError('library, source and author required')
        validate_rights(m.get('rights'))
        kind, media = probe(file, m.get('kind'))
        if m.get('kind') and m['kind'] != kind: raise ValueError('declared kind does not match decoded media')
        if m['library'] == 'lw-originals' and m.get('provider') not in ('LW', None): raise ValueError('foreign provider cannot be LW Originals')
        if kind == 'mg' and m['library'] != media['library']: raise ValueError('MG descriptor ownership mismatch')
        sha = digest(file)
        # Same bytes do not merge unrelated licenses or author claims.
        identity = sha + json.dumps(m, sort_keys=True, ensure_ascii=False)
        aid = 'A-' + hashlib.sha256(identity.encode()).hexdigest()[:24]
        suffix = '.lwmg.json' if kind == 'mg' else file.suffix.lower()
        destination = self.root / m['library'] / (aid + suffix); destination.parent.mkdir(exist_ok=True)
        if not destination.exists(): shutil.copyfile(file, destination)
        if digest(destination) != sha: raise ValueError('managed copy hash mismatch')
        record = {**m, 'assetId': aid, 'kind': kind, 'sha256': sha, 'originalPath': str(file),
                  'path': destination.relative_to(self.project).as_posix(), 'media': media, 'indexedAt': now(),
                  'executionStatus': 'adapter-verified' if kind == 'mg' and media['adapterVerified'] else 'probed',
                  'scopeAtImport': scope}
        return self.save(record)
    def register_candidate(self, candidate):
        if not all(candidate.get(k) for k in ('source', 'provider', 'title')): raise ValueError('candidate provenance missing')
        aid = 'R-' + hashlib.sha256((candidate['provider'] + candidate['source']).encode()).hexdigest()[:24]
        return self.save({**candidate, 'assetId': aid, 'library': 'lw-references', 'path': None, 'sha256': None,
                          'rights': {'reference': True, 'download': False, 'adapt': False, 'render': False,
                                     'license': candidate.get('licenseClaim', 'unknown'), 'scopes': []},
                          'executionStatus': 'metadata-only', 'indexedAt': now()})
    def approve(self, aid, proof):
        asset = self.get(aid); validate_rights(proof)
        if proof.get('source') != asset['source'] or not proof.get('author'):
            raise ValueError('review proof must match original source and identify author')
        if proof.get('license') != asset.get('licenseClaim'):
            raise ValueError('license mismatch; reconcile primary source metadata first')
        evidence = self.root / 'rights' / (aid + '.json'); write(evidence, proof)
        asset.update(author=proof['author'], rights={**proof, 'evidenceSha256': digest(evidence),
                     'evidencePath': evidence.relative_to(self.project).as_posix(), 'reviewedAt': now()})
        return self.save(asset)
    def download(self, aid, scope='project'):
        asset = self.get(aid)
        if not rights_ok(asset, 'download', scope): raise ValueError('no reviewed download permission for scope')
        rights_file = self.project / asset['rights']['evidencePath']
        if digest(rights_file) != asset['rights']['evidenceSha256']: raise ValueError('rights evidence changed')
        # The source-license review must bind the exact downloadable URL.
        url = asset.get('downloadUrl')
        if asset['rights'].get('downloadUrl') != url: raise ValueError('download URL not covered by review')
        suffix = Path(urllib.parse.urlsplit(url).path).suffix.lower()
        if suffix not in ('.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.wav', '.mp3', '.ogg'):
            raise ValueError('unsupported downloadable media; no arbitrary remote source execution')
        data = fetch_bytes(url, 100 * 1024 * 1024)
        with tempfile.TemporaryDirectory() as temp:
            f = Path(temp) / ('media' + suffix); f.write_bytes(data)
            record = self.import_file(f, {k: asset[k] for k in ('library', 'source', 'author', 'provider', 'rights', 'title')}, scope)
        record['candidateId'] = aid; record['originalPath'] = url
        return self.save(record)
    def require(self, aid, scope='project', adapt=True):
        asset = self.get(aid)
        if not rights_ok(asset, 'render', scope) or adapt and not rights_ok(asset, 'adapt', scope):
            raise ValueError('asset not licensed for requested render/adaptation/scope: ' + aid)
        if asset['kind'] == 'mg' and asset['executionStatus'] != 'adapter-verified':
            raise ValueError('MG has no verified executable adapter')
        if asset['rights'].get('evidencePath'):
            evidence=(self.project/asset['rights']['evidencePath']).resolve()
            if not evidence.is_relative_to(self.root) or digest(evidence)!=asset['rights']['evidenceSha256']:
                raise ValueError('rights evidence missing or changed')
            evidence_detail=asset['rights'].get('evidence',{})
            snapshots=evidence_detail.get('snapshots',[]) if isinstance(evidence_detail,dict) else []
            for snapshot in snapshots:
                file=(self.project/snapshot['path']).resolve()
                if not file.is_relative_to(self.root) or digest(file)!=snapshot['sha256']:raise ValueError('primary license snapshot changed')
        self.path(asset); return asset
    def used(self, assets, project, scene, output):
        for aid in assets:
            self.db.execute('INSERT OR IGNORE INTO usages VALUES(?,?,?,?,?)', (aid, project, scene, digest(output), now()))
        self.db.commit()
    def history(self, aid): return [dict(zip(('project', 'scene', 'outputHash', 'at'), row)) for row in self.db.execute('SELECT project,scene,output_hash,at FROM usages WHERE id=?', (aid,))]

def ancestors(concept):
    values = {concept}; current = concept
    while current in PARENTS:
        current = PARENTS[current]; values.add(current)
    return values

def recommend(index, intent, scope='project'):
    if not intent.get('concepts') or not intent.get('purpose') or not intent.get('analysisEvidence'):
        raise ValueError('director semantic concepts, purpose and analysisEvidence required; not raw keyword matching')
    recommendations = []
    for asset in index.all():
        sem = asset.get('semantics', {})
        if not sem.get('evidence') or not sem.get('concepts'): continue
        wanted = set(intent['concepts']); got = set(sem['concepts'])
        concept = sum(max((1 if a == b else .45 if ancestors(a) & ancestors(b) else 0) for b in got) for a in wanted) / len(wanted)
        if not concept: continue
        axes = {'meaning': round(concept * 45, 3), 'purpose': 22 if intent['purpose'] in sem.get('purposes', []) else 0,
                'emotion': 10 if intent.get('emotion') in sem.get('emotions', []) else 0,
                'style': 10 if intent.get('style') in sem.get('styles', []) else 0,
                'relations': 8 if set(intent.get('relations', [])) & set(sem.get('relations', [])) else 0,
                'requiredEntities': 5 if set(intent.get('requiredEntities', [])) <= set(sem.get('entities', [])) else -25,
                'reuse': -min(15, len(index.history(asset['assetId'])) * 3)}
        try:index.require(asset['assetId'],scope);usable=True
        except (ValueError,KeyError,OSError):usable=False
        if not set(intent.get('requiredEntities',[]))<=set(sem.get('entities',[])):usable=False
        recommendations.append({'assetId': asset['assetId'], 'library': asset['library'], 'score': round(sum(axes.values()), 3),
                                'reasons': axes, 'usable': bool(usable), 'semanticEvidence': sem['evidence']})
    return sorted(recommendations, key=lambda x: (x['usable'], x['score']), reverse=True)

def search_openverse(index, query, media='images', limit=5):
    if media not in ('images', 'audio') or not 1 <= limit <= 20: raise ValueError('unsupported search')
    url = 'https://api.openverse.org/v1/' + media + '/?' + urllib.parse.urlencode({'q': query, 'page_size': limit, 'license': 'cc0,by'})
    raw = fetch_bytes(url); response = json.loads(raw); saved = []
    evidence_sha = hashlib.sha256(raw).hexdigest()
    (index.root / 'search').mkdir(exist_ok=True); (index.root / 'search' / (evidence_sha + '.json')).write_bytes(raw)
    for item in response.get('results', []):
        saved.append(index.register_candidate({'title': item['title'] or item['id'], 'provider': 'Openverse/' + item['provider'],
                    'source': item['foreign_landing_url'], 'author': item.get('creator') or 'unknown',
                    'downloadUrl': item['url'], 'previewUrl': item.get('thumbnail'), 'licenseClaim': item['license'],
                    'licenseUrl': item['license_url'], 'providerMetadataSha256': evidence_sha,
                    'notice': 'Openverse does not verify licenses; original-source review required before download'}))
    return saved

def review_flickr_cc(index, aid, scope='private-test'):
    """Narrow original-page verifier, not a generic license/ownership oracle.

    Checks the photo's own structured data, exact media URL, creator and CC deed.
    Other sites/licenses stay reference-only. Does not waive trademarks/personality rights.
    """
    if scope not in ('private-test','project'):raise ValueError('automatic CC review cannot clear publication/personality/trademark rights; explicit review required')
    asset=index.get(aid)
    source=urllib.parse.urlsplit(asset['source'])
    if source.hostname!='www.flickr.com' or not re.fullmatch(r'/photos/[^/]+/\d+/?',source.path):
        raise ValueError('this verifier only supports public Flickr photo pages')
    raw=fetch_bytes(asset['source']);page=raw.decode('utf8');objects=[]
    for value in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',page,re.S):
        try:obj=json.loads(value)
        except json.JSONDecodeError:continue
        objects.extend(obj if isinstance(obj,list) else obj.get('@graph',[obj]))
    photo=next((o for o in objects if o.get('@type')=='ImageObject' and o.get('contentUrl')==asset['downloadUrl']),None)
    if not photo:raise ValueError('photo primary metadata did not confirm exact media URL')
    allowed={'https://creativecommons.org/licenses/by/2.0/':'by','https://creativecommons.org/licenses/by/4.0/':'by',
             'https://creativecommons.org/publicdomain/zero/1.0/':'cc0'}
    license_url=photo.get('license');author=photo.get('author',{}).get('name')
    if allowed.get(license_url)!=asset.get('licenseClaim') or not author or author.casefold()!=asset['author'].casefold():
        raise ValueError('primary creator/license disagrees with provider; manual reconciliation required')
    deed=fetch_bytes(license_url)
    snapshots=[]
    for name,content in [('source.html',raw),('license.html',deed)]:
        dest=index.root/'rights'/(aid+'-'+name);dest.parent.mkdir(exist_ok=True);dest.write_bytes(content)
        snapshots.append({'path':dest.relative_to(index.project).as_posix(),'sha256':digest(dest)})
    proof={'source':asset['source'],'author':author,'license':asset['licenseClaim'],'licenseUrl':license_url,
           'reviewer':'LW primary-page CC verifier v1','scopes':[scope], 'download':True,'adapt':True,'render':True,
           'downloadUrl':asset['downloadUrl'],'attributionRequired':asset['licenseClaim']=='by',
           'attribution':f'{asset["title"]} — {author}; {asset["source"]}; {license_url}; resized/letterboxed for film',
           'evidence':{'method':'exact primary ImageObject + license deed; no ownership guarantee','snapshots':snapshots},
           'restrictions':'other rights not waived; no endorsement; scope is not automatically expanded'}
    return index.approve(aid,proof)

def select_for_shot(index, intent, scope='project'):
    candidates=recommend(index,intent,scope)
    allowed=intent.get('libraries')
    if allowed:candidates=[x for x in candidates if x.get('library') in allowed]
    preferred=intent.get('preferredKinds',['video','image','screen-recording','mg'])
    eligible=[x for x in candidates if x['usable'] and index.get(x['assetId'])['kind'] in preferred]
    fallback=None
    if not eligible and (not allowed or 'lw-originals' in allowed):
        eligible=[x for x in candidates if x['usable'] and index.get(x['assetId'])['kind']=='mg' and x['library']=='lw-originals']
        fallback='No eligible preferred media; an explicitly disclosed, semantically matched LW Originals MG replaces it'
    if not eligible:raise ValueError('no semantically suitable authorized asset or original MG; do not insert placeholder')
    return {'selectedAssetId':eligible[0]['assetId'],'fallback':fallback,'intent':intent,'recommendations':candidates}


# ---------------------------------------------------------------------------
# Copy-to-asset bridge.
# Raw copy is deliberately NOT a valid intent for recommend(): the engine must
# not silently turn narration wording into a material claim. These helpers only
# DRAFT a structured intent from copy using auditable rule cues, then hand it to
# the SAME recommend()/select_for_shot() pipeline with all rights gates intact.
# Rule mapping is not language understanding; every proposal carries
# reviewRequired=True and the exact cue that produced it.
# ---------------------------------------------------------------------------
COPY_CUES = (
    {'patterns':('为什么','如何','怎么','什么','吗？','why','how','what'),
     'concepts':('communication',),'purpose':'hook',
     'note':'疑问/开场线索 → 沟通职责 + 钩子'},
    {'patterns':('分层','结构','顺序','步骤','首先','其次','层次','复杂','解释','解读','framework','structure'),
     'concepts':('explanation','chart'),'purpose':'explain',
     'note':'结构线索 → 解释 + 图示 / 说明'},
    {'patterns':('连贯','接不上','线索','转场','衔接','串联','continuity','transition'),
     'concepts':('continuity',),'purpose':'transition',
     'note':'连贯线索 → 连续性 / 转场'},
    {'patterns':('镜头','运镜','推','拉','摇','视线','视角','运动','camera','motion'),
     'concepts':('camera','motion'),'purpose':'guide',
     'note':'运镜线索 → 摄像机 + 运动 / 引导'},
    {'patterns':('安静','停留','风景','情绪','氛围','停一下','landscape','calm'),
     'concepts':('scene-setting',),'purpose':'pause',
     'note':'停留线索 → 场景铺垫 / 停顿'},
    {'patterns':('声音','字幕','同步','时间轴','配音','音频','caption','sync','audio'),
     'concepts':('narration','subtitles'),'purpose':'synchronize',
     'note':'同步线索 → 旁白 + 字幕 / 声画同步'},
    {'patterns':('对比','相比','区别','versus','vs.','comparison'),
     'concepts':('comparison',),'purpose':'explain',
     'note':'对比线索 → 对照 / 说明'},
    {'patterns':('证据','数据','证明','调查','统计','evidence','data'),
     'concepts':('evidence',),'purpose':'explain',
     'note':'证据线索 → 论证 / 说明'},
    {'patterns':('流程','工作流','界面','面板','workflow','process','interface'),
     'concepts':('workflow','interface'),'purpose':'explain',
     'note':'流程/界面线索 → 工作流 / 界面'},
    {'patterns':('总结','结论','最后','总之','一句话','conclusion','finally'),
     'concepts':('communication',),'purpose':'conclusion',
     'note':'收束线索 → 沟通职责 / 结论'},
)

MP_CATEGORY_SEMANTICS = {
    'motion':  {'concepts':['motion'],'purposes':['transition','guide'],'emotions':['calm'],'styles':['swiss']},
    'motion2': {'concepts':['motion'],'purposes':['transition','guide'],'emotions':['calm'],'styles':['swiss']},
    'camera':  {'concepts':['camera','motion'],'purposes':['guide'],'emotions':['calm'],'styles':['swiss']},
    'camera2': {'concepts':['camera','motion'],'purposes':['guide'],'emotions':['calm'],'styles':['swiss']},
    'ui':      {'concepts':['interface','workflow'],'purposes':['explain'],'emotions':['calm'],'styles':['swiss']},
    'lp':      {'concepts':['interface','workflow'],'purposes':['explain'],'emotions':['calm'],'styles':['swiss']},
    'lp2':     {'concepts':['interface','workflow'],'purposes':['explain'],'emotions':['calm'],'styles':['swiss']},
    'photo':   {'concepts':['scene-setting'],'purposes':['pause'],'emotions':['calm'],'styles':['swiss']},
    'artstyle':{'concepts':['scene-setting','style'],'purposes':['pause'],'emotions':['calm'],'styles':['swiss']},
    'diagram': {'concepts':['explanation','chart','evidence','comparison'],'purposes':['explain'],'emotions':['calm'],'styles':['swiss']},
}
ORIGINAL_CATEGORY_SEMANTICS = {
    '文字动画':{'concepts':['communication','typography','subtitles'],'purposes':['hook','explain','conclusion','synchronize'],'emotions':['calm'],'styles':['swiss']},
    '转场效果':{'concepts':['continuity','transition'],'purposes':['transition'],'emotions':['calm'],'styles':['swiss']},
    '3D运镜':  {'concepts':['camera','motion'],'purposes':['guide'],'emotions':['calm'],'styles':['swiss']},
    '信息图':  {'concepts':['explanation','chart','evidence'],'purposes':['explain'],'emotions':['calm'],'styles':['swiss']},
    '信息图表':{'concepts':['explanation','chart','evidence'],'purposes':['explain'],'emotions':['calm'],'styles':['swiss']},
    '灯光':    {'concepts':['continuity','scene-setting'],'purposes':['transition','pause'],'emotions':['calm'],'styles':['swiss']},
    '科技光影':{'concepts':['continuity','scene-setting'],'purposes':['transition','pause'],'emotions':['calm'],'styles':['swiss']},
}
DEFAULT_SEMANTICS = {'concepts':['communication'],'purposes':['explain'],'emotions':['calm'],'styles':['swiss']}


def seed_workbench_assets(index, scope='project', include_motion_prompt=True, include_originals=True):
    """Register ALREADY-VERIFIED workbench components into this project's asset index.

    Only components with a real renderStatus=passed record and traceable provenance
    are registered. Descriptor-only MG assets go through the same probe()/require()
    gate as any other asset; nothing is asserted executable by this helper.
    """
    seed = index.root / 'seed'; seed.mkdir(exist_ok=True)
    registered = []
    if include_originals:
        manifest = read(ROOT / 'visual-studio/src/catalog/manifest.json')
        quality = read(ROOT / 'visual-studio/src/catalog/quality.json')
        for comp in manifest.get('components', []):
            cid = comp['id']
            if quality.get(cid, {}).get('renderStatus') != 'passed': continue
            sem = ORIGINAL_CATEGORY_SEMANTICS.get(comp.get('category'), DEFAULT_SEMANTICS)
            descriptor = seed / 'lw-originals' / (cid + '.lwmg.json')
            write(descriptor, {'componentId': cid, 'library': 'lw-originals', 'theme': 'swiss', 'props': comp.get('defaults', {})})
            meta = {'library':'lw-originals','provider':'LW','author':'LW','title':comp.get('name') or cid,
                    'source':'workspace: ' + str(comp.get('source')),
                    'rights':{'license':'LW original component',
                              'evidence':'locally authored; renderStatus=passed in visual-studio/src/catalog/quality.json',
                              'reviewer':'LW build verification','download':True,'adapt':True,'render':True,
                              'scopes':['private-test','project']},
                    'semantics':{**sem,'evidence':'verified component manifest: ' + str(comp.get('description'))}}
            registered.append(index.import_file(descriptor, meta, scope))
    if include_motion_prompt:
        for item in read(ROOT / 'visual-studio/external/catalog.json'):
            if item.get('provider') != 'Motion Prompt' or not item.get('executable') or item.get('renderStatus') != 'passed': continue
            sem = MP_CATEGORY_SEMANTICS.get(item.get('category'), DEFAULT_SEMANTICS)
            descriptor = seed / 'lw-references' / (item['id'] + '.lwmg.json')
            write(descriptor, {'componentId': item['id'], 'library': 'lw-references', 'adapter': item.get('adapter')})
            meta = {'library':'lw-references','provider':'Motion Prompt','author':'Shohei Ohtaki (upstream author)',
                    'title':item.get('name') or item['id'],
                    'source':item.get('officialUrl') or item.get('licenseUrl') or 'Motion Prompt fixed source revision',
                    'rights':{'license':item.get('license'),
                              'evidence':'source-adapted-verified; revision ' + str(item.get('sourceRevision')) + '; see references/motion-prompt-library-status.md',
                              'reviewer':'LW Motion Prompt source verification','download':True,'adapt':True,'render':True,
                              'scopes':['private-test','project']},
                    'semantics':{**sem,'evidence':'verified catalog: ' + str(item.get('description')) + ' / ' + str(item.get('category'))}}
            registered.append(index.import_file(descriptor, meta, scope))
    return {'status':'seeded','count':len(registered),'libraries':sorted({a['library'] for a in registered}),'scope':scope}


def intents_from_copy(text, max_shots=12):
    """Draft reviewable shot intents from copy. Not semantic understanding."""
    if not isinstance(text, str) or not text.strip(): raise ValueError('文案不能为空，无法自动选材')
    if not isinstance(max_shots, int) or not 1 <= max_shots <= 40: raise ValueError('maxShots 必须在 1..40 之间')
    sentences = [s.strip() for s in re.split(r'[\n。！？!?；;]+', text) if s.strip()]
    if not sentences: raise ValueError('文案不能为空，无法自动选材')
    intents = []
    for position, sentence in enumerate(sentences[:max_shots]):
        lowered = sentence.casefold(); concepts = []; purpose = None; notes = []
        for rule in COPY_CUES:
            if any(str(p).casefold() in lowered for p in rule['patterns']):
                notes.append(rule['note'])
                for concept in rule['concepts']:
                    if concept not in concepts: concepts.append(concept)
                if purpose is None: purpose = rule['purpose']
        derivation = 'rule-cue'
        if not concepts or not purpose:
            if position == 0: concepts, purpose = ['communication'], 'hook'; notes.append('位置默认：开场（非语义确认）')
            elif position == len(sentences) - 1: concepts, purpose = ['communication'], 'conclusion'; notes.append('位置默认：收束（非语义确认）')
            else: concepts, purpose = ['explanation'], 'explain'; notes.append('位置默认：主体说明（非语义确认）')
            derivation = 'position-default'
        evidence = '文案自动选材（规则线索映射，非语义理解）：' + '；'.join(notes) + '。原句：' + sentence[:80]
        intents.append({'concepts':concepts[:4],'purpose':purpose,'emotion':'calm','style':'swiss',
                        'preferredKinds':['mg','image','video'],'analysisEvidence':evidence,
                        'sourceText':sentence,'derivation':derivation,'reviewRequired':True})
    return intents


def select_for_copy(index, text, scope='project', libraries=None, max_shots=12):
    """Copy -> drafted intents -> the existing recommend/select_for_shot pipeline."""
    if libraries is not None and (not isinstance(libraries, (list, tuple)) or not set(libraries) <= LIBRARIES):
        raise ValueError('invalid libraries filter')
    shots = []
    for i, intent in enumerate(intents_from_copy(text, max_shots), 1):
        effective = dict(intent)
        if libraries is not None: effective['libraries'] = list(libraries)
        try: decision = select_for_shot(index, effective, scope)
        except ValueError as exc:
            decision = {'selectedAssetId':None,'fallback':None,'intent':effective,'recommendations':[],'error':str(exc)}
        selected = index.get(decision['selectedAssetId']) if decision.get('selectedAssetId') else None
        readable = ((selected.get('title') or selected.get('description') or
                     str((selected.get('semantics') or {}).get('evidence') or '')[:60] or selected['assetId'])
                    if selected else None)
        shot = {'shot':i,'text':intent['sourceText'],'derivation':intent['derivation'],'decision':decision,
                'asset': ({'assetId':selected['assetId'],'name':readable,
                           'library':selected['library'],'kind':selected['kind'],'rights':selected.get('rights',{}),
                           'semantics':selected.get('semantics',{})} if selected else None)}
        shots.append(shot)
    return {'engine':'lw_assets.select_for_copy','scope':scope,'libraries':list(libraries) if libraries is not None else sorted(LIBRARIES),
            'derivation':'rule-based-cue-mapping','reviewRequired':True,'shotCount':len(shots),'shots':shots}
