import copy, json, sys, tempfile, unittest, wave
from pathlib import Path
from unittest.mock import patch
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from lw_assets import AssetIndex, recommend, rights_ok, digest, public_https, select_for_shot, review_flickr_cc

def meta(**changes):
    m={'library':'user-local','author':'test author','source':'user-provided test fixture',
       'rights':{'license':'original test','evidence':'explicit test-only author declaration','reviewer':'fixture author',
                 'download':True,'adapt':True,'render':True,'scopes':['private-test']},
       'semantics':{'concepts':['continuity'],'purposes':['explain'],'emotions':['calm'],'styles':['swiss'],
                    'relations':['cause-effect'],'evidence':'director description of generated fixture'}}
    m.update(changes);return m

class AssetTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.index=AssetIndex(self.root/'project')
        self.image=self.root/'中文 原片.png';Image.new('RGB',(320,180),'orange').save(self.image)
    def tearDown(self):self.index.close();self.tmp.cleanup()
    def test_import_preserves_source_and_deduplicates_same_metadata(self):
        before=digest(self.image);a=self.index.import_file(self.image,meta());b=self.index.import_file(self.image,meta())
        self.assertEqual(a['assetId'],b['assetId']);self.assertEqual(digest(self.image),before)
        self.assertEqual(self.index.path(a).read_bytes(),self.image.read_bytes());self.assertEqual(a['media']['width'],320)
    def test_same_bytes_do_not_inherit_other_licenses(self):
        a=self.index.import_file(self.image,meta());m=meta();m['rights']={'license':'unknown','scopes':[]}
        b=self.index.import_file(self.image,m);self.assertNotEqual(a['assetId'],b['assetId'])
        with self.assertRaises(ValueError):self.index.require(b['assetId'],'private-test')
    def test_hash_change_and_path_escape_rejected(self):
        a=self.index.import_file(self.image,meta());self.index.path(a).write_bytes(b'changed')
        with self.assertRaises(ValueError):self.index.require(a['assetId'],'private-test')
        a['path']='../secret.png'
        with self.assertRaises(ValueError):self.index.path(a)
    def test_scope_cannot_escalate_private_test_to_publication(self):
        a=self.index.import_file(self.image,meta());self.index.require(a['assetId'],'private-test')
        with self.assertRaises(ValueError):self.index.require(a['assetId'],'publish')
    def test_download_permission_does_not_imply_adaptation(self):
        m=meta();m['rights']['adapt']=False;a=self.index.import_file(self.image,m)
        self.assertTrue(rights_ok(a,'download','private-test'))
        with self.assertRaises(ValueError):self.index.require(a['assetId'],'private-test')
    def test_online_candidates_never_download_on_registration(self):
        with patch('lw_assets.fetch_bytes') as fetch:
            a=self.index.register_candidate({'title':'candidate','source':'https://example.org/source','provider':'test','licenseClaim':'unknown'})
            self.assertFalse(rights_ok(a,'download','private-test'))
            with self.assertRaises(ValueError):self.index.download(a['assetId'],'private-test')
            fetch.assert_not_called()
    def test_proof_must_match_candidate_and_download_url(self):
        a=self.index.register_candidate({'title':'candidate','source':'https://example.org/source','provider':'test','licenseClaim':'by','downloadUrl':'https://example.org/a.png'})
        proof={**meta()['rights'],'source':'https://example.org/wrong','author':'author'}
        with self.assertRaises(ValueError):self.index.approve(a['assetId'],proof)
    def test_unverified_mg_is_indexed_but_not_executable(self):
        d=self.root/'test.lwmg.json';d.write_text(json.dumps({'componentId':'FT-T05q-250','library':'lw-references'}))
        a=self.index.import_file(d,meta(library='lw-references'))
        self.assertFalse(a['media']['adapterVerified'])
        with self.assertRaises(ValueError):self.index.require(a['assetId'],'private-test')
    def test_semantics_use_director_intent_not_narration_lexical_overlap(self):
        a=self.index.import_file(self.image,meta())
        intent={'concepts':['storyboard'],'purpose':'explain','emotion':'calm','style':'swiss',
                'relations':['cause-effect'],'analysisEvidence':'director: shots must connect, not a literal filename match'}
        first=recommend(self.index,{**intent,'narration':'镜头之间接不上'},'private-test')
        second=recommend(self.index,{**intent,'narration':'故事需要连贯的视觉关系'},'private-test')
        self.assertEqual(first,second);self.assertEqual(first[0]['assetId'],a['assetId']);self.assertGreater(first[0]['reasons']['meaning'],0)
        self.assertEqual(recommend(self.index,{**intent,'concepts':['unrelated-domain']},'private-test'),[])
    def test_semantic_search_requires_analysis_and_material_evidence(self):
        with self.assertRaises(ValueError):recommend(self.index,{'concepts':['continuity']})
    def test_audio_classification_music_and_sfx_are_declared(self):
        file=self.root/'tone.wav'
        with wave.open(str(file),'wb') as f:f.setparams((1,2,48000,0,'NONE','not compressed'));f.writeframes(b'\0\0'*4800)
        for kind in ['audio','music','sound-effect']:
            a=self.index.import_file(file,meta(kind=kind));self.assertEqual(a['kind'],kind);self.assertAlmostEqual(a['media']['duration'],.1,places=2)
    def test_history_written_once_only_for_verified_output(self):
        a=self.index.import_file(self.image,meta());out=self.root/'output.mp4';out.write_bytes(b'fixture')
        self.index.used([a['assetId']],'p','S1',out);self.index.used([a['assetId']],'p','S1',out)
        self.assertEqual(len(self.index.history(a['assetId'])),1)
    def test_unsafe_network_urls_rejected_before_fetch(self):
        for url in ['file:///secret','http://example.org/a','https://user:secret@example.org/a','https://127.0.0.1/a']:
            with self.assertRaises((ValueError,OSError)):public_https(url)
    def test_video_and_declared_screen_recording_decode_real_frames(self):
        import av
        file=self.root/'clip.mp4'
        with av.open(str(file),'w') as media:
            stream=media.add_stream('libx264',rate=10);stream.width=160;stream.height=90;stream.pix_fmt='yuv420p'
            for i in range(10):
                for packet in stream.encode(av.VideoFrame.from_image(Image.new('RGB',(160,90),(i*20,40,60)))):media.mux(packet)
            for packet in stream.encode():media.mux(packet)
        for kind in ['video','screen-recording']:
            a=self.index.import_file(file,meta(kind=kind));self.assertEqual(a['kind'],kind);self.assertGreater(a['media']['duration'],.9)
        # This is a declared synthetic screen-recording fixture, not evidence that screen capture was performed.
    def test_missing_requested_media_selects_disclosed_original_mg(self):
        descriptor=self.root/'fallback.lwmg.json';descriptor.write_text(json.dumps({'componentId':'TYPE-001','library':'lw-originals'}))
        a=self.index.import_file(descriptor,meta(library='lw-originals',provider='LW'))
        intent={'concepts':['continuity'],'purpose':'explain','preferredKinds':['video'],'analysisEvidence':'director analyzed continuity'}
        selected=select_for_shot(self.index,intent,'private-test')
        self.assertEqual(selected['selectedAssetId'],a['assetId']);self.assertIsNotNone(selected['fallback'])
        intent['concepts']=['unrelated']
        with self.assertRaises(ValueError):select_for_shot(self.index,intent,'private-test')
    def test_automatic_cc_review_cannot_grant_publication_clearance(self):
        with patch('lw_assets.fetch_bytes') as fetch:
            with self.assertRaises(ValueError):review_flickr_cc(self.index,'does-not-matter','publish')
            fetch.assert_not_called()
    def test_manual_review_text_evidence_survives_authorized_import(self):
        candidate=self.index.register_candidate({'title':'owned test','source':'https://example.org/source','provider':'test',
                                                'licenseClaim':'by','downloadUrl':'https://example.org/a.png'})
        proof={**meta()['rights'],'license':'by','source':candidate['source'],'author':'test author','downloadUrl':candidate['downloadUrl']}
        self.index.approve(candidate['assetId'],proof)
        with patch('lw_assets.fetch_bytes',return_value=self.image.read_bytes()):asset=self.index.download(candidate['assetId'],'private-test')
        self.index.require(asset['assetId'],'private-test')

if __name__=='__main__':unittest.main()
