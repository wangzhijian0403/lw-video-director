"""Compile indexed assets and render a narrated, captioned multi-shot review film.

This adapter is separate from the v0.2 Player. It uses trusted Remotion MG adapters,
PyAV/Pillow frame composition and FFmpeg audio mixing. No imported code is run.
"""
from __future__ import annotations
import argparse, json, math, re, subprocess, sys, textwrap
from pathlib import Path
import av, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from lw_assets import AssetIndex, ROOT, digest, read, rights_ok, write

def parse_srt(text):
    result=[];previous=-1
    def timestamp(raw):
        match=re.fullmatch(r'(\d{2,}):(\d{2}):(\d{2})[,.](\d{3})',raw)
        if not match:raise ValueError('invalid SRT timestamp')
        h,m,s,ms=map(int,match.groups())
        if m>=60 or s>=60:raise ValueError('invalid SRT clock')
        return h*3600+m*60+s+ms/1000
    for block in re.split(r'\n\s*\n',text.strip().replace('\r','')):
        lines=block.splitlines()
        if len(lines)<3 or '-->' not in lines[1]:raise ValueError('invalid SRT block')
        a,b=map(str.strip,lines[1].split('-->'));start,end=timestamp(a),timestamp(b)
        if start<previous or end<=start:raise ValueError('SRT overlaps/out of order')
        result.append({'start':start,'end':end,'text':'\n'.join(lines[2:])});previous=end
    return result

def compile_project(project, manifest):
    index = AssetIndex(project); used = {}; disclosures = []
    try:
        o = manifest['output']; w,h,fps,total = (o[k] for k in ('width','height','fps','totalFrames'))
        if any(type(v) is not int or v<=0 for v in (w,h,fps,total)) or w%2 or h%2 or fps>60 or w>3840 or h>3840:
            raise ValueError('invalid/eccessive output dimensions or frames')
        scope=manifest.get('scope','project'); cursor=0;seen=set()
        subtitle_source=None
        if manifest.get('subtitles',{}).get('filePath'):
            subtitle=manifest['subtitles']
            if not rights_ok(subtitle,'render',scope):raise ValueError('subtitle source needs scoped rights/source/author')
            file=(Path(project)/subtitle['filePath']).resolve();captions=parse_srt(file.read_text(encoding='utf-8-sig'))
            if captions[-1]['end']>total/fps+.02:raise ValueError('SRT exceeds episode')
            subtitle_source={**subtitle,'sha256':digest(file),'cueCount':len(captions)}
            for scene in manifest['scenes']:
                start,end=scene['startFrame']/fps,(scene['startFrame']+scene['durationFrames'])/fps
                scene['captions']=[{'start':max(c['start'],start)-start,'end':min(c['end'],end)-start,'text':c['text']} for c in captions if c['start']<end and c['end']>start]
        for scene in manifest['scenes']:
            if scene['id'] in seen or scene['startFrame']!=cursor or type(scene['durationFrames']) is not int or scene['durationFrames']<=0:
                raise ValueError('non-contiguous or duplicate shot timeline')
            seen.add(scene['id']);cursor+=scene['durationFrames']
            ids=[scene['visualAssetId'],scene['narrationAssetId']]+scene.get('overlayAssetIds',[])
            if scene.get('sfxAssetId'):ids.append(scene['sfxAssetId'])
            for aid in ids:
                asset=index.require(aid,scope);used[aid]=asset
                if asset['rights'].get('attributionRequired') and not asset['rights'].get('attribution'):
                    raise ValueError('required attribution is missing')
            visual=used[scene['visualAssetId']];voice=used[scene['narrationAssetId']]
            if visual['kind'] not in ('image','video','screen-recording','mg') or voice['kind'] not in ('audio',):raise ValueError('incorrect visual or narration media type')
            seconds=scene['durationFrames']/fps
            voice_start=scene.get('narrationTrimStart',0);voice_end=scene.get('narrationTrimEnd',voice['media'].get('duration',0))
            if not (0<=voice_start<voice_end<=voice['media'].get('duration',0)+.02) or voice_end-voice_start>seconds+.05:
                raise ValueError('narration trim bounds invalid or exceed shot; cannot silently trim voice')
            if visual['kind']=='mg' and visual['media'].get('componentId')=='MP-001' and seconds>4.7 and scene.get('endPolicy')!='freeze':
                raise ValueError('MP-001 is 4.7s; explicit freeze required for a longer shot')
            if visual['kind'] in ('video','screen-recording') and visual['media'].get('duration',0)<scene.get('trimStart',0)+seconds and scene.get('endPolicy')!='freeze':
                raise ValueError('visual too short; explicit freeze policy required')
            if scene.get('fit','contain') not in ('contain','cover'):raise ValueError('invalid image fit')
            if scene.get('fit')=='cover' and not scene.get('cropApproved'):raise ValueError('cover requires explicit crop approval')
            if not scene.get('narrationText') or not scene.get('purpose'):raise ValueError('shot semantics required')
            if not isinstance(scene.get('captions'),list) or not scene['captions']:raise ValueError('actual timed captions required')
            for caption in scene['captions']:
                if not (0<=caption['start']<caption['end']<=seconds+.02) or not caption['text']:raise ValueError('caption exceeds actual shot')
            if scene.get('fallback'):disclosures.append({'scene':scene['id'],'reason':scene['fallback'],'replacement':visual['assetId'],'library':visual['library']})
        if cursor!=total:raise ValueError('timeline total mismatch')
        for role in ('fontAssetId','musicAssetId'):
            if manifest.get(role):
                asset=index.require(manifest[role],scope);used[asset['assetId']]=asset
                if asset['kind']!=('font' if role=='fontAssetId' else 'music'):raise ValueError('incorrect global asset kind')
        if not manifest.get('fontAssetId'):raise ValueError('explicit licensed font is required')
        return {'scope':scope,'assets':used,'disclosures':disclosures,'status':'validated-inputs','totalFrames':total,'subtitleSource':subtitle_source}
    finally:index.close()

def font_wrap(text, font, max_width):
    rows=[];line=''
    for c in text:
        if c=='\n' or font.getlength(line+c)>max_width:
            if line:rows.append(line)
            line='' if c=='\n' else c
        else:line+=c
    if line:rows.append(line)
    return rows

class VisualReader:
    def __init__(self,path):
        self.container=av.open(str(path));self.iterator=self.container.decode(video=0);self.last=None;self.next=next(self.iterator,None)
    def frame(self,seconds):
        while self.next is not None and (float(self.next.pts*self.next.time_base) if self.next.pts is not None else 0)<=seconds+1e-6:
            self.last=self.next;self.next=next(self.iterator,None)
        chosen=self.last or self.next
        if chosen is None:raise ValueError('no decoded visual frame')
        return chosen.to_image().convert('RGB')
    def close(self):self.container.close()

def render_project(project, episode_path):
    import imageio_ffmpeg
    project=Path(project).resolve();episode_path=Path(episode_path).resolve();manifest=read(episode_path)
    compiled=compile_project(project,manifest);index=AssetIndex(project);out=project/'renders';out.mkdir(exist_ok=True)
    final=out/'final.mp4'
    if final.exists():raise ValueError('refusing to overwrite final video; use a new project/output')
    write(project/'metadata/compiled-assets.json',compiled)
    output=manifest['output'];w,h,fps,total=(output[k] for k in ('width','height','fps','totalFrames'))
    fontpath=index.path(compiled['assets'][manifest['fontAssetId']]);scale=w/1080
    fonts={k:ImageFont.truetype(str(fontpath),max(12,int(size*scale))) for k,size in [('title',64),('body',42),('small',26),('caption',44)]}
    cache=project/'cache';cache.mkdir(exist_ok=True);visual_paths={}
    for scene in manifest['scenes']:
        for aid in [scene['visualAssetId']]+scene.get('overlayAssetIds',[]):
            a=compiled['assets'][aid];path=index.path(a)
            if a['kind']=='mg':
                key=aid+'-'+str(scene['durationFrames']);target=cache/(key+'.mp4')
                if not target.exists():
                    subprocess.run(['node',str(ROOT/'scripts/render_indexed_mg.mjs'),str(path),str(target),str(scene['durationFrames']/fps)],cwd=ROOT,check=True)
                path=target
            visual_paths[(scene['id'],aid)]=path
    silent=cache/'picture.mp4';ff=imageio_ffmpeg.get_ffmpeg_exe()
    cmd=[ff,'-nostdin','-v','warning','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-y',str(silent)]
    stderr=(out/'video-encode.log').open('w',encoding='utf8');proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=stderr)
    safe_boxes=[];caption_records=[];last_picture=None;global_frame=0
    try:
        for shotno,scene in enumerate(manifest['scenes'],1):
            aid=scene['visualAssetId'];a=compiled['assets'][aid];path=visual_paths[(scene['id'],aid)]
            reader=None if a['kind']=='image' else VisualReader(path)
            overlays={x:VisualReader(visual_paths[(scene['id'],x)]) for x in scene.get('overlayAssetIds',[])}
            print('Rendering indexed shot',scene['id'],a['kind'],scene['purpose'],flush=True)
            try:
                for local in range(scene['durationFrames']):
                    t=local/fps;picture=Image.new('RGB',(w,h),'#151515');draw=ImageDraw.Draw(picture)
                    margin=int(w*.075);draw.text((margin,int(h*.06)),f'LW / ASSET ENGINE     {shotno:02d} / {len(manifest["scenes"]):02d}',font=fonts['small'],fill='#f2bc93')
                    y=int(h*.12)
                    for line in font_wrap(scene.get('title',scene['purpose']),fonts['title'],w-2*margin):
                        draw.text((margin,y),line,font=fonts['title'],fill='#f3f0ea');y+=int(84*scale)
                    top=int(h*.30);box=(w-2*margin,int(h*.34))
                    image=Image.open(path).convert('RGB') if reader is None else reader.frame(t+scene.get('trimStart',0))
                    fitted=ImageOps.fit(image,box) if scene.get('fit')=='cover' else ImageOps.contain(image,box)
                    x=(w-fitted.width)//2;yy=top+(box[1]-fitted.height)//2
                    # A small, frame-driven reveal; no source stretching.
                    reveal=min(1,(local+1)/(fps*.45));picture.paste(fitted,(x,yy+int((1-reveal)*32*scale)))
                    draw=ImageDraw.Draw(picture);line_y=int(h*.68)
                    for line in font_wrap(scene.get('explanation',''),fonts['body'],int(w*.50) if overlays else w-2*margin)[:4]:
                        draw.text((margin,line_y),line,font=fonts['body'],fill='#bdb7b1');line_y+=int(58*scale)
                    for overlay_aid,overlay in overlays.items():
                        im=ImageOps.contain(overlay.frame(t),(int(w*.34),int(h*.15)));picture.paste(im,(w-margin-im.width,int(h*.64)))
                    draw=ImageDraw.Draw(picture);draw.line((margin,int(h*.845),w-margin,int(h*.845)),fill='#4d4238',width=max(1,int(scale*2)))
                    active=[c for c in scene['captions'] if c['start']<=t<c['end']]
                    if active:
                        lines=font_wrap(active[0]['text'],fonts['caption'],w-2*margin)
                        if len(lines)>2:raise ValueError('caption too long; split actual timed caption before rendering')
                        cy=int(h*.87)
                        for line in lines:
                            tw=fonts['caption'].getlength(line);bbox=draw.textbbox(((w-tw)/2,cy),line,font=fonts['caption']);safe_boxes.append(list(bbox))
                            draw.text(((w-tw)/2,cy),line,font=fonts['caption'],fill='#fff1e5');cy+=int(60*scale)
                    draw.rectangle((margin,int(h*.96),margin+int((w-2*margin)*(global_frame+1)/total),int(h*.963)),fill='#f2b88a')
                    # Cross-shot visual blend is inside each shot: it does not shorten voice/subtitle timing.
                    if last_picture is not None and local<round(fps*.22):picture=Image.blend(last_picture,picture,(local+1)/round(fps*.22))
                    proc.stdin.write(picture.tobytes());global_frame+=1
                last_picture=picture.copy()
            finally:
                if reader:reader.close()
                for v in overlays.values():v.close()
            for c in scene['captions']:caption_records.append({'start':scene['startFrame']/fps+c['start'],'end':scene['startFrame']/fps+c['end'],'text':c['text']})
        proc.stdin.close();code=proc.wait()
        if code:raise ValueError('frame encoding failed; see video-encode.log')
    except BaseException:
        proc.kill();proc.wait();raise
    finally:stderr.close()
    # Real sentence audio, BGM and SFX share the same frame timeline.
    cmd=[ff,'-nostdin','-v','warning','-i',str(silent)];tracks=[];inputno=1
    for scene in manifest['scenes']:
        for role,gain in [('narrationAssetId',1),('sfxAssetId',scene.get('sfxGain',.15))]:
            if not scene.get(role):continue
            cmd+=['-i',str(index.path(compiled['assets'][scene[role]]))]
            trim=f'atrim=start={scene.get("narrationTrimStart",0)}:end={scene.get("narrationTrimEnd",compiled["assets"][scene[role]]["media"].get("duration"))},asetpts=PTS-STARTPTS,' if role=='narrationAssetId' else ''
            delay=round(scene['startFrame']/fps*1000);tracks.append(f'[{inputno}:a]{trim}aresample=48000,volume={gain},adelay={delay}|{delay}[a{inputno}]');inputno+=1
    if manifest.get('musicAssetId'):
        cmd+=['-stream_loop','-1','-i',str(index.path(compiled['assets'][manifest['musicAssetId']]))]
        tracks.append(f'[{inputno}:a]aresample=48000,volume=0.08[a{inputno}]');inputno+=1
    mix=''.join(f'[a{i}]' for i in range(1,inputno));tracks.append(f'{mix}amix=inputs={inputno-1}:normalize=0,alimiter=limit=0.95,apad,atrim=duration={total/fps}[audio]')
    cmd+=['-filter_complex',';'.join(tracks),'-map','0:v','-map','[audio]','-c:v','copy','-c:a','aac','-b:a','192k','-t',str(total/fps),'-movflags','+faststart',str(final)]
    with (out/'audio-mix.log').open('w',encoding='utf8') as log:subprocess.run(cmd,stderr=log,check=True)
    def srt_time(t):
        ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    (project/'subtitles.srt').write_text('\n\n'.join(f'{i}\n{srt_time(c["start"])} --> {srt_time(c["end"])}\n{c["text"]}' for i,c in enumerate(caption_records,1))+'\n',encoding='utf8')
    count=0;previous_pts=None;max_gap=0;black=[];first_size=None
    with av.open(str(final)) as media:
        for f in media.decode(video=0):
            if first_size is None:first_size=(f.width,f.height)
            stamp=float(f.pts*f.time_base)
            if previous_pts is not None:max_gap=max(max_gap,stamp-previous_pts)
            previous_pts=stamp
            if np.asarray(f.reformat(width=108,height=192,format='gray').to_ndarray()).mean()<2:black.append(count)
            if count%(fps*5)==0:f.to_image().save(out/f'frame-{count:04}.jpg')
            count+=1
    video_info={'width':first_size[0],'height':first_size[1],'decodedFrames':count,'maxPtsGap':max_gap,'blackFrames':black}
    with av.open(str(final)) as media:
        audio=list(media.decode(audio=0));peak=max(float(np.max(np.abs(f.to_ndarray()))) for f in audio);audio_end=max(float(f.pts*f.time_base)+f.samples/f.sample_rate for f in audio)
    safety=all(x1>=0 and y1>=0 and x2<=w and y2<=h*.96 for x1,y1,x2,y2 in safe_boxes)
    qa={'status':'technical-pass' if count==total and not black and safety and peak<1 and abs(audio_end-total/fps)<.12 else 'failed',
        'video':video_info,'audio':{'codec':'aac','peak':peak,'endSeconds':audio_end,'avDurationDifference':abs(audio_end-total/fps)},
        'captions':{'burnedIn':True,'actualSafeBoxesChecked':len(safe_boxes),'safe':safety,'timingSource':manifest.get('alignmentMethod')},
        'visualReview':'pending-director','licenseScope':compiled['scope'],'notACommercialPublicationClearance':True,'finalSha256':digest(final)}
    write(project/'qa.json',qa)
    if qa['status']=='technical-pass':write(project/'metadata/runtime-evidence.json',{'adapter':'asset-timeline-ffmpeg','rendererSha256':digest(Path(__file__)),'qaSha256':digest(project/'qa.json'),'finalSha256':digest(final),'output':output,'scope':compiled['scope']})
    usage=[]
    if qa['status']=='technical-pass':
        for scene in manifest['scenes']:
            ids=[scene['visualAssetId'],scene['narrationAssetId']]+scene.get('overlayAssetIds',[])+([scene['sfxAssetId']] if scene.get('sfxAssetId') else [])
            index.used(ids,manifest['projectId'],scene['id'],final)
        for role in ('fontAssetId','musicAssetId'):
            if manifest.get(role):index.used([manifest[role]],manifest['projectId'],'GLOBAL',final)
    for aid,a in compiled['assets'].items():usage.append({**a,'usageHistory':index.history(aid)})
    write(project/'assets-used.json',usage);write(project/'copyright-report.json',{'status':'cleared-for-'+compiled['scope'],
          'assets':[{k:a.get(k) for k in ('assetId','library','source','author','rights','sha256')} for a in usage],
          'fallbackDisclosures':compiled['disclosures'],'publishEligible':all(rights_ok(a,'render','publish') and rights_ok(a,'adapt','publish') for a in usage),
          'note':'Evidence/declared permissions checked by scope; no automated legal ownership guarantee'})
    index.close();print(json.dumps(qa,ensure_ascii=False,indent=2));return qa

def main():
    sys.stdout.reconfigure(encoding='utf8');p=argparse.ArgumentParser(description=__doc__);p.add_argument('episode',type=Path);p.add_argument('--project',required=True,type=Path);p.add_argument('--check',action='store_true');args=p.parse_args()
    try:
        result=compile_project(args.project,read(args.episode)) if args.check else render_project(args.project,args.episode)
        if args.check:print(json.dumps(result,ensure_ascii=False,indent=2))
        return 0 if result['status']!='failed' else 2
    except (ValueError,OSError,KeyError,TypeError,subprocess.CalledProcessError) as exc:
        print(json.dumps({'status':'blocked','error':str(exc)},ensure_ascii=False));return 2
if __name__=='__main__':raise SystemExit(main())
