"""
gen-full-project.py — 用 vo-plan.json 的段落时间生成《造纸术》完整版工程

输入：build/audio/vo-plan.json（段落区间 + 句级 cues）
输出：projects/papermaking-full/project.json（11 镜、绝对时间音效、显式字幕）
      projects/papermaking-full/subtitles-full.srt（交付字幕，与工程内字幕同源）

约定：
- 画面起点 = 段落起点；每镜时长把「下一镜的转场重叠」吃进来，重叠期间两镜同时在，
  因此画面切换点与口播段落边界对齐，不会把句尾切掉；
- 音效用绝对时间 at，不跟镜头锚点，母版口播换版本时只改这里的时间表；
- 字幕把 build 阶段已排好行的文本原样传进工程（timeline 见 \\n 直接用），
  保证烧进画面和交付的 SRT 是同一份断行。
"""
import json
import os
import sys

FPS = 30

SCENES = [
    # (id, component, 段落 id, 转场类型, 转场秒, params 覆盖)
    ('s01', 'PAPER-001', 'hook', 'cut', 0.0,
     {'title': '两千年前，一张纸', 'subtitle': '东汉 · 蔡伦之后，纸才便宜', 'entrance': 0.5, 'hold': 3.4, 'exit': 0.6}),
    ('s02', 'PROCESS-001', 'intro', 'wipe', 0.55,
     {'title': '四道工序，一步都不能省', 'subtitle': '泡 · 捣 · 抄 · 晒', 'entrance': 0.4, 'hold': 8.0, 'exit': 0.6}),
    ('s03', 'MATERIAL-001', 'material', 'fade', 0.45,
     {'title': '原料就四样', 'subtitle': '树皮 · 麻头 · 破布 · 渔网', 'entrance': 0.5, 'hold': 3.9, 'exit': 0.5}),
    ('s04', 'SOAK-001', 'soak', 'wipe', 0.6,
     {'title': '第一道，泡', 'subtitle': '泡到一撕就碎', 'entrance': 0.5, 'hold': 3.4, 'exit': 0.5}),
    ('s05', 'POUND-001', 'pound', 'wipe', 0.6,
     {'title': '第二道，捣', 'subtitle': '捣得越细，纸越平', 'entrance': 0.4, 'hold': 4.2, 'exit': 0.5, 'hits': 6}),
    ('s06', 'SCOOP-001', 'scoop', 'wipe', 0.6,
     {'title': '第三道，抄', 'subtitle': '竹帘入水，荡匀成膜', 'entrance': 0.5, 'hold': 6.0, 'exit': 0.5}),
    ('s07', 'DRY-001', 'dry', 'fade', 0.5,
     {'title': '第四道，晒', 'subtitle': '贴墙阴干，揭下是纸', 'entrance': 0.35, 'hold': 2.1, 'exit': 0.4}),
    ('s08', 'TIMELINE-001', 'cailun', 'slide', 0.55,
     {'title': '蔡伦，把纸做便宜', 'subtitle': '公元 105 年，东汉', 'mode': 'origin', 'entrance': 0.5, 'hold': 9.4, 'exit': 0.5}),
    ('s09', 'BAMBOO-001', 'bamboo', 'wipe', 0.65,
     {'title': '竹简退场', 'subtitle': '同样的字，换个载体就便宜了', 'entrance': 0.5, 'hold': 7.9, 'exit': 0.5}),
    ('s10', 'TIMELINE-001', 'spread', 'zoom', 0.55,
     {'title': '纸，一路往西', 'subtitle': '751 → 阿拉伯 → 12 世纪欧洲', 'mode': 'spread', 'entrance': 0.5, 'hold': 9.9, 'exit': 0.5}),
    ('s11', 'PAPER-001', 'ending', 'fade', 0.7,
     {'title': '两千年，四道工序', 'subtitle': '有需要的评论区留言', 'entrance': 0.5, 'hold': 9.6, 'exit': 0.7}),
]

MATERIALS = [
    {'src': 'materials/bark.png', 'label': '树皮', 'note': '构树 · 去外皮'},
    {'src': 'materials/hemp.png', 'label': '麻头', 'note': '旧麻 · 打散'},
    {'src': 'materials/rag.png', 'label': '破布', 'note': '敝布 · 洗净'},
    {'src': 'materials/net.png', 'label': '渔网', 'note': '鱼网 · 拆绳'},
]

BRIDGES = [
    {'to': 's03', 'kind': 'toMaterials', 'duration': 0.7},
    {'to': 's04', 'kind': 'intoVat', 'duration': 0.6},
    {'to': 's05', 'kind': 'intoMortar', 'duration': 0.6},
    {'to': 's06', 'kind': 'intoScoop', 'duration': 0.65},
]


def sfx_for(scenes):
    """音效表：按各镜内部动画相位换算绝对秒。
    原则：瞬态（hit/splash/dip）落在动作接触点；持续音只做底，说话时会被混音脚本再压。"""
    by = {s['id']: s for s in scenes}
    ev = []

    def add(name, sid, local, vol):
        sc = by[sid]
        ev.append({'name': name, 'at': round(sc['start'] + local, 3), 'volume': vol})

    # s01 纸纤维成纸
    add('fiber_rustle', 's01', 0.25, 0.5)
    add('paper_form', 's01', 2.1, 0.55)
    add('shimmer', 's01', 3.6, 0.3)

    # s02 四张工序卡依次亮起（卡片激活点在 25% / 50% / 75%）
    for i, frac in enumerate((0.25, 0.5, 0.75)):
        add('tick', 's02', by['s02']['span'] * frac, 0.22 + 0.02 * i)
    add('cloth_swish', 's02', 0.5, 0.28)

    # s03 原料标本：四件依次聚焦
    for i, local in enumerate((1.4, 2.1, 2.8, 3.5)):
        add('material_tap', 's03', local, 0.26)
    add('cloth_swish', 's03', 0.6, 0.26)

    # s04 泡：落水 + 水底持续
    add('splash_in', 's04', 0.35, 0.5)
    add('water_bed', 's04', 0.1, 0.16)
    add('bubbles_loop', 's04', 0.4, 0.14)

    # s05 捣：六次杵头触浆（组件 beat = seg(p,0.1,0.9)*hits）
    span = by['s05']['span']
    hits = 6
    for k in range(1, hits + 1):
        prog = 0.1 + 0.8 * k / hits
        add('mortar_hit', 's05', span * prog, 0.5 - 0.02 * (k - 1))
    add('fiber_settle', 's05', span * 0.86, 0.26)

    # s06 抄：入水 → 荡帘 → 提帘 → 滴水 → 成膜
    span = by['s06']['span']
    add('water_bed', 's06', 0.2, 0.14)
    add('screen_dip', 's06', span * 0.2, 0.46)      # 帘面触水
    add('splash_in', 's06', span * 0.24, 0.34)
    add('drip_water', 's06', span * 0.66, 0.36)     # 提帘开始滴水
    add('drip_water', 's06', span * 0.76, 0.28)
    add('paper_form', 's06', span * 0.9, 0.42)

    # s07 晒：揭纸
    span = by['s07']['span']
    add('whoosh_short', 's07', span * 0.68, 0.3)
    add('fiber_rustle', 's07', span * 0.74, 0.22)

    # s08 时间轴节点逐个亮（0.34/0.43/0.52/0.61）
    span = by['s08']['span']
    for i, prog in enumerate((0.36, 0.45, 0.54, 0.63)):
        add('tick', 's08', span * prog, 0.2)

    # s09 竹简抬走 → 纸册落下
    span = by['s09']['span']
    add('whoosh_down', 's09', span * 0.45, 0.3)
    add('paper_form', 's09', span * 0.72, 0.4)
    add('fiber_settle', 's09', span * 0.8, 0.2)

    # s10 传播路线节点
    span = by['s10']['span']
    for prog in (0.36, 0.52, 0.68):
        add('tick', 's10', span * prog, 0.2)

    # s11 收尾：纸面重现
    add('fiber_rustle', 's11', 1.0, 0.34)
    add('paper_form', 's11', 3.4, 0.4)
    add('whoosh_short', 's11', by['s11']['span'] - 0.7, 0.26)
    return ev


def main():
    plan_path = sys.argv[1] if len(sys.argv) > 1 else 'build/audio/vo-plan.json'
    out_dir = sys.argv[2] if len(sys.argv) > 2 else 'projects/papermaking-full'
    plan = json.load(open(plan_path, encoding='utf-8'))
    spans = {s['id']: s for s in plan['scenes']}

    scenes = []
    for i, (sid, comp, para, ttype, tsec, params) in enumerate(SCENES):
        seg = spans[para]
        nxt = SCENES[i + 1] if i + 1 < len(SCENES) else None
        overlap_next = nxt[4] if nxt else 0.0
        if nxt:
            nxt_para = spans[SCENES[i + 1][2]]
            end = nxt_para['start'] + overlap_next
        else:
            end = seg['end'] + 0.18
        span = round(end - seg['start'], 3)
        p = dict(params)
        p['span'] = span
        # 组件内部进度别跟着长镜头一起拉长：开场/收尾的纸面标题要在 3.5s 内立住，之后保持定格
        if comp == 'PAPER-001':
            p['span'] = 6.8 if sid == 's01' else 6.6
        if comp == 'MATERIAL-001':
            p['materials'] = MATERIALS
        scenes.append({
            'id': sid,
            'component': comp,
            'duration': span,
            'narrationText': seg['text'],
            'transition': {'type': ttype, 'duration': tsec},
            'params': p,
        })

    # 字幕：沿用 build 阶段已断行的 cues，原样进工程（lines 直接给渲染用，不做二次断行）
    cues = [{'start': c['from'], 'end': c['to'], 'text': '\n'.join(c['lines']), 'lines': c['lines']}
            for c in plan['cues']]

    project = {
        'meta': {
            'title': '造纸术 · 完整成片（11 段口播 83.7s）',
            'slug': 'papermaking-full',
            'width': 1920,
            'height': 1080,
            'fps': FPS,
            'theme': 'mist-blue-paper',
            'backdrop': 'mist-mountains',
            'backdropParallax': 1,
            'backdropHaze': 1,
            'audioPreMuxed': True,
            'scriptFile': 'approved-script.json',
            'scriptSource': 'projects/papermaking-full/approved-script.md（用户 2026-11-21 定稿，11 段）',
            'voSource': 'assets/vo-full-source.mp3（母版口播 83.664s）',
        },
        'audio': {'vo': {'src': 'audio/papermaking-full-mix.wav', 'volume': 1, 'fadeIn': 0, 'fadeOut': 0}},
        'subtitles': {'enabled': True, 'maxCharsPerLine': 12, 'safeBottom': 0.044, 'cues': cues},
        'scenes': scenes,
        'bridges': BRIDGES,
        'sfx': sfx_for([{'id': s['id'], 'start': spans[SCENES[i][2]]['start'], 'span': s['params']['span']}
                        for i, s in enumerate(scenes)]),
    }

    raw = json.dumps(project, ensure_ascii=False, indent=2)
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'project.json'), 'w', encoding='utf-8') as f:
        f.write(raw + '\n')

    with open(os.path.join(out_dir, 'subtitles-full.srt'), 'w', encoding='utf-8') as f:
        for i, c in enumerate(plan['cues'], 1):
            def ts(t):
                h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
                return f'{h:02d}:{m:02d}:{s:06.3f}'.replace('.', ',')
            f.write(f"{i}\n{ts(c['from'])} --> {ts(c['to'])}\n" + '\n'.join(c['lines']) + '\n\n')

    total = sum(s['params']['span'] for s in scenes) - sum(
        SCENES[i + 1][4] for i in range(len(SCENES) - 1))
    print(json.dumps({'scenes': [(s['id'], s['params']['span']) for s in scenes],
                      'plannedSeconds': round(total, 3), 'sfx': len(project['sfx']),
                      'cues': len(cues)}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
