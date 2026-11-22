"""Create a private, real whole-film integration test using indexed media and local voice.

No user recordings, fonts, downloaded photos or rendered test films enter Git.
An already primary-reviewed external image can be used; otherwise an original
MG replacement is explicitly recorded. This is not a generic topic-to-script model.
"""
from __future__ import annotations
import argparse, json, math, subprocess, sys, wave
from pathlib import Path
import av, numpy as np
from PIL import Image, ImageDraw, ImageFont
from lw_assets import AssetIndex, ROOT, read, write, select_for_shot

TEXTS=[
 '为什么画面已经动起来了，观众还是看不懂你要说什么？',
 '先给每个镜头分工，让它回答一个问题，而不是随机切换。',
 '解释复杂概念时，把信息分成层次，让观众知道先看哪里。',
 '安静的风景适合停留，情绪转折则需要动作和声音来引导。',
 '摄像机的运动应该引导视线，空间变化始终服务于内容。',
 '两个画面共享一条线索，转场才会成为叙事的一部分。',
 '把真实声音、字幕和镜头放在同一时间轴，才能保持同步。',
 '好的人工智能视频，先有清晰的表达，再有漂亮的动效。']

def metadata(concepts,purposes,kind=None,library='lw-originals',author='LW original integration test'):
    return {'library':library,'provider':'LW' if library=='lw-originals' else 'user test','author':author,
            'source':'authored locally for the LW Asset Engine integration test',**({'kind':kind} if kind else {}),
            'rights':{'license':'original/private technical test','evidence':'author-created test content; no third-party media',
                      'reviewer':'LW test author','download':True,'adapt':True,'render':True,'scopes':['private-test']},
            'semantics':{'concepts':concepts,'purposes':purposes,'emotions':['calm'],'styles':['swiss'],
                         'relations':['cause-effect'],'entities':[],'evidence':'director-authored illustration or verified component descriptor'}}

def make_video(path,mode,font):
    if path.exists():raise ValueError('fixture exists')
    with av.open(str(path),'w') as container:
        stream=container.add_stream('libx264',rate=30);stream.width=960;stream.height=540;stream.pix_fmt='yuv420p'
        for frame in range(240):
            im=Image.new('RGB',(960,540),'#25211e');d=ImageDraw.Draw(im);t=frame/30
            if mode=='storyboard':
                for i,label in enumerate(['钩子','问题','解释','停留','运镜','交接','同步','结论']):
                    x=40+(i%4)*230;y=75+(i//4)*225;active=int(t)%8==i
                    d.rounded_rectangle((x,y,x+200,y+170),radius=12,fill='#e8b489' if active else '#3c3530',outline='#b49c84',width=2)
                    d.text((x+18,y+62),f'{i+1:02}  {label}',font=font,fill='#1a1715' if active else '#eee5da')
            else:
                for i,label in enumerate(['口播','字幕','镜头']):
                    y=100+i*130;d.text((30,y),label,font=font,fill='#e8b489');d.rounded_rectangle((150,y-5,910,y+70),radius=8,fill='#3c3530')
                    for j in range(6):d.rectangle((165+j*120,y+15,255+j*120,y+45),fill=['#c59773','#817264','#d4c4ae'][i])
                x=160+int((t%4)/4*730);d.line((x,60,x,495),fill='#fff0df',width=4)
            vf=av.VideoFrame.from_image(im)
            for packet in stream.encode(vf):container.mux(packet)
        for packet in stream.encode():container.mux(packet)

def setup(project,external_asset=None):
    project=Path(project).resolve();fixtures=project/'source-fixtures';fixtures.mkdir(parents=True,exist_ok=True)
    if (project/'episode.json').exists():raise ValueError('use a project without an existing episode')
    index=AssetIndex(project)
    try:
        fontfile=Path('C:/Windows/Fonts/msyh.ttc')
        if not fontfile.is_file():raise ValueError('Windows Chinese font missing; configure test font rather than silently substituting')
        fmeta=metadata(['typography'],['captions'],'font','user-local','installed Microsoft font, not LW-owned')
        fmeta['source']='local Windows font installation';fmeta['rights'].update(license='installed-font render-only private test',evidence='use installed font for local raster rendering only; no font redistribution',download=False)
        font=index.import_file(fontfile,fmeta);small=ImageFont.truetype(str(fontfile),30)
        script=fixtures/'script.json';write(script,TEXTS)
        subprocess.run(['powershell.exe','-NoProfile','-File',str(ROOT/'scripts/windows_narration.ps1'),'-ScriptFile',str(script),'-OutputDirectory',str(fixtures/'speech')],check=True)
        voices=[]
        for record in read(fixtures/'speech/synthesis.json'):
            vmeta=metadata(['narration'],['narration'],'audio','user-local',record['voice']+' local synthesized test')
            vmeta['source']='installed Windows System.Speech local synthesis'
            vmeta['rights'].update(license='system voice private test; public distribution rights not verified',evidence='locally generated actual sentence audio, not user recording; private integration verification only')
            voices.append(index.import_file(record['file'],vmeta))
        assets={}
        for key,mode,concept in [('board','storyboard','storyboard'),('sync','sync','narration')]:
            file=fixtures/(key+'.mp4');make_video(file,mode,small)
            assets[key]=index.import_file(file,metadata([concept],['explain' if key=='board' else 'synchronize'],'video'))
        diagram=Image.new('RGB',(960,540),'#eee8df');d=ImageDraw.Draw(diagram)
        for x,label in [(70,'前镜头：提出问题'),(540,'后镜头：回答问题')]:
            d.rounded_rectangle((x,145,x+350,340),radius=18,outline='#8d633e',width=4);d.text((x+25,215),label,font=small,fill='#352a21')
        d.line((420,245,535,245),fill='#b5723f',width=8);d.polygon([(535,245),(510,230),(510,260)],fill='#b5723f')
        file=fixtures/'continuity.png';diagram.save(file);assets['continuity']=index.import_file(file,metadata(['continuity'],['transition'],'image'))
        specs=[('hook','TYPE-001',['communication'],['hook'],{'title':'动起来，不等于讲清楚','subtitle':'从素材到镜头职责 / LW ASSET ENGINE'}),
               ('info','INFO-001',['explanation'],['explain'],{'title':'给信息分层','chartData':[{'label':'问题','value':1},{'label':'说明','value':2},{'label':'结论','value':3}],'unit':'结构示意','dataSource':'概念示意，不是统计数据'}),
               ('camera','CAM-001',['camera'],['guide'],{'rotation':90,'radius':7,'title':'运动服务内容'}),
               ('light','LIGHT-001',['continuity'],['transition'],{'title':'共同的线索'}),
               ('ending','TYPE-001',['communication'],['conclusion'],{'title':'先有表达，再有动效','subtitle':'素材、声音、镜头，共用一条时间轴'})]
        for key,cid,concepts,purposes,props in specs:
            file=fixtures/(key+'.lwmg.json');write(file,{'componentId':cid,'library':'lw-originals','theme':'swiss','props':props})
            assets[key]=index.import_file(file,metadata(concepts,purposes,'mg'))
        # Real generated audio: original music bed plus a short cue, not a silent placeholder.
        for key,seconds,kind in [('music',8,'music'),('cue',.35,'sound-effect')]:
            rate=48000;t=np.arange(round(rate*seconds))/rate
            audio=(np.sin(2*np.pi*220*t)*.09+np.sin(2*np.pi*330*t)*.05)*np.minimum(1,t/.08)*np.minimum(1,(seconds-t)/.12)
            file=fixtures/(key+'.wav')
            with wave.open(str(file),'wb') as wav:wav.setparams((1,2,rate,0,'NONE','not compressed'));wav.writeframes((audio*32767).astype('<i2').tobytes())
            assets[key]=index.import_file(file,metadata(['motion'],['transition' if key=='cue' else 'ambience'],kind))
        photo=None
        if external_asset:
            photo=index.require(external_asset,'private-test')
            # Actual image inspected by the director: title mentions cameras, content is a quiet landscape.
            photo['semantics']={'concepts':['scene-setting'],'purposes':['pause'],'emotions':['calm'],'styles':['swiss'],
                                'entities':['lake','landscape'],'evidence':'direct visual inspection: still lake and trees, not a camera; title describes the camera used',
                                'reviewedAgainstSha256':photo['sha256']};index.save(photo)
        roles=[('communication','hook',['mg'],'不是随机运动'),('storyboard','explain',['video'],'每个镜头，只回答一个问题'),
               ('explanation','explain',['mg'],'层次是理解的顺序'),('scene-setting','pause',['image'],'停留，让情绪被看见'),
               ('camera','guide',['mg'],'运动，给视线一个方向'),('continuity','transition',['image'],'相同线索，串起两个画面'),
               ('narration','synchronize',['video'],'声、画、字幕，一条时间轴'),('communication','conclusion',['mg'],'先有表达，再有动效')]
        if not photo:
            assets['hook']['semantics']['concepts'].append('scene-setting');assets['hook']['semantics']['purposes'].append('pause');index.save(assets['hook'])
        scenes=[];cursor=0;decisions=[]
        for i,(concept,purpose,kinds,title) in enumerate(roles):
            intent={'concepts':[concept],'purpose':purpose,'emotion':'calm','style':'swiss','preferredKinds':kinds,
                    'analysisEvidence':'director analyzed the sentence meaning and visual role, not lexical photo-title matching',
                    'relations':['cause-effect'],'requiredEntities':['lake'] if i==3 and photo else []}
            decision=select_for_shot(index,intent,'private-test');decisions.append(decision)
            voice=voices[i];audio_seconds=voice['media']['duration'];frames=math.ceil(max(6,audio_seconds+.20)*30)
            scene={'id':f'S{i+1:02}','startFrame':cursor,'durationFrames':frames,'title':title,'purpose':purpose,'narrationText':TEXTS[i],
                   'visualAssetId':decision['selectedAssetId'],'narrationAssetId':voice['assetId'],'fit':'contain','endPolicy':'freeze',
                   'captions':[{'start':0,'end':audio_seconds,'text':TEXTS[i]}],
                   'explanation':['从语义出发，再选择画面。','钩子、解释、停留、交接。','结构示意，不是调查数据。',
                                  '实景照片保留原比例与作者来源。','真实 3D 摄像机，不是 CSS 变换。','旧画面的结束，是新画面的线索。',
                                  '字幕绑定真实语音文件的时间。','素材缺失时，明确采用原创 MG。'][i]}
            if i==5:scene.update(overlayAssetIds=[assets['light']['assetId']],sfxAssetId=assets['cue']['assetId'])
            if decision['fallback']:scene['fallback']=decision['fallback']
            scenes.append(scene);cursor+=frames
        episode={'schemaVersion':'asset-engine/1','assetEngine':{'project':'.'},'projectId':'lw-assets-storyboard-private-validation',
                 'title':'为什么视频制作需要分镜与素材职责？','scope':'private-test','output':{'width':1080,'height':1920,'fps':30,'totalFrames':cursor},
                 'fontAssetId':font['assetId'],'musicAssetId':assets['music']['assetId'],'scenes':scenes,
                 'audioPolicy':{'musicLoop':True,'musicGain':.08,'sfxGain':.15},'alignmentMethod':'actual separately synthesized sentence WAV boundaries; captions equal exact sentence, no ASR/word alignment claim'}
        write(project/'episode.json',episode);write(project/'metadata/selection-decisions.json',decisions)
        write(project/'metadata/narration-alignment.json',[{'scene':s['id'],'start':s['startFrame']/30,'audioDuration':v['media']['duration'],'text':s['narrationText'],'sourceSha256':v['sha256']} for s,v in zip(scenes,voices)])
        print('REAL TIMELINE READY',len(scenes),'shots',cursor/30,'seconds',flush=True)
        return project/'episode.json'
    finally:index.close()

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf8');p=argparse.ArgumentParser(description=__doc__);p.add_argument('--project',type=Path,required=True);p.add_argument('--external-asset');args=p.parse_args()
    episode=setup(args.project,args.external_asset)
    from asset_timeline import render_project
    qa=render_project(args.project,episode);raise SystemExit(0 if qa['status']=='technical-pass' else 2)
