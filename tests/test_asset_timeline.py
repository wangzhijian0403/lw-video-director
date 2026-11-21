import copy, json, sys, tempfile, unittest, wave
from pathlib import Path
from PIL import Image, ImageFont
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from lw_assets import AssetIndex
from asset_timeline import compile_project, parse_srt
from test_asset_engine import meta

class TimelineTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.index=AssetIndex(self.root)
        image=self.root/'source.png';Image.new('RGB',(320,180),'orange').save(image);self.visual=self.index.import_file(image,meta())
        voice=self.root/'voice.wav'
        with wave.open(str(voice),'wb') as f:f.setparams((1,2,48000,0,'NONE','not compressed'));f.writeframes(b'\0\0'*48000)
        self.voice=self.index.import_file(voice,meta(kind='audio'))
        try:fontpath=Path(ImageFont.truetype('DejaVuSans.ttf',16).path)
        except OSError:fontpath=Path('C:/Windows/Fonts/msyh.ttc')
        if not fontpath.is_file():self.skipTest('no installed test font')
        font=self.index.import_file(fontpath,meta(kind='font'))
        self.manifest={'projectId':'test','scope':'private-test','fontAssetId':font['assetId'],
                       'output':{'width':1080,'height':1920,'fps':30,'totalFrames':60},'scenes':[
                           {'id':'S1','startFrame':0,'durationFrames':60,'purpose':'explain','narrationText':'actual test audio',
                            'visualAssetId':self.visual['assetId'],'narrationAssetId':self.voice['assetId'],
                            'captions':[{'start':0,'end':1,'text':'caption'}]}]}
    def tearDown(self):self.index.close();self.temp.cleanup()
    def test_compiler_checks_rights_for_entire_timeline(self):
        compiled=compile_project(self.root,self.manifest);self.assertEqual(len(compiled['assets']),3)
        self.manifest['scope']='publish'
        with self.assertRaises(ValueError):compile_project(self.root,self.manifest)
    def test_missing_changed_asset_blocks_compile(self):
        self.index.path(self.visual).write_bytes(b'corrupt')
        with self.assertRaises(ValueError):compile_project(self.root,self.manifest)
    def test_gaps_caption_overflow_and_unapproved_crop_block(self):
        for patch in [{'startFrame':1},{'fit':'cover'},{'captions':[{'start':0,'end':3,'text':'too late'}]}]:
            m=copy.deepcopy(self.manifest);m['scenes'][0].update(patch)
            with self.assertRaises(ValueError):compile_project(self.root,m)
    def test_explicit_voice_trim_must_remain_inside_real_audio(self):
        self.manifest['scenes'][0].update(narrationTrimStart=.2,narrationTrimEnd=.8)
        compile_project(self.root,self.manifest)
        self.manifest['scenes'][0]['narrationTrimEnd']=2
        with self.assertRaises(ValueError):compile_project(self.root,self.manifest)
    def test_srt_input_uses_actual_times_and_hashes_the_sidecar(self):
        srt=self.root/'input.srt';srt.write_text('1\n00:00:00,200 --> 00:00:00,800\n字幕\n',encoding='utf8')
        self.manifest['subtitles']={'filePath':'input.srt','source':'user test','author':'test','rights':meta()['rights']}
        c=compile_project(self.root,self.manifest);self.assertEqual(c['subtitleSource']['cueCount'],1)
        self.assertEqual(self.manifest['scenes'][0]['captions'][0]['start'],.2)
    def test_srt_rejects_overlap_and_malformed_clocks(self):
        for s in ['1\n00:60:00,000 --> 00:61:00,000\nx','1\n00:00:01,000 --> 00:00:00,000\nx','not srt']:
            with self.assertRaises(ValueError):parse_srt(s)

if __name__=='__main__':unittest.main()
