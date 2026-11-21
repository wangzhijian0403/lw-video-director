import {useEffect, useMemo, useState} from 'react';
import {Player} from '@remotion/player';
import {MotionPromptAdapter} from './MotionPromptAdapter';
import {FredTalkAdapter} from './FredTalkAdapter';
import {fredDefaults, validateFredProps} from './fred-props.mjs';
import {fredBatch} from './fredtalk-registry.generated';
import {searchAssets} from './search';

type BatchEntry = (typeof fredBatch)[number];

export function ReferencesPanel({search}: {search: string}) {
  const [provider, setProvider] = useState('all');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(new URLSearchParams(window.location.search).get('reference') || 'MP-001');
  const [speed, setSpeed] = useState(1);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState('');
  const [download, setDownload] = useState('');
  const [page, setPage] = useState(0);
  const [fred, setFred] = useState(fredDefaults);
  const [batchProps, setBatchProps] = useState('{}');
  const [batchAccent, setBatchAccent] = useState('#8554E8');
  const [batchBackground, setBatchBackground] = useState('#f5f3eb');
  const [batchSpeed, setBatchSpeed] = useState(1);
  const [batchError, setBatchError] = useState('');

  const results = useMemo(() => searchAssets(search, 'references', provider, category), [search, provider, category]);
  useEffect(() => setPage(0), [search]);
  const categories = [...new Set(searchAssets('', 'references', provider).map((c) => c.category))];
  const item = results.find((c) => c.id === selected) || results[0];

  const batchEntry: BatchEntry | undefined = item ? fredBatch.find((e) => e.id === item.id) : undefined;

  useEffect(() => {
    if (!batchEntry) return;
    setBatchProps(JSON.stringify(batchEntry.sampleProps, null, 2));
    setBatchAccent(batchEntry.accent || '#8554E8');
    setBatchBackground(batchEntry.background || '#f5f3eb');
    setBatchSpeed(1);
    setBatchError('');
  }, [batchEntry?.id]);

  let fredError = '';
  try {
    validateFredProps(fred);
  } catch (e) {
    fredError = String(e);
  }

  function parsedBatchProps(): Record<string, unknown> | null {
    try {
      const v = JSON.parse(batchProps);
      if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('props 必须是 JSON 对象');
      setBatchError('');
      return v;
    } catch (e) {
      setBatchError(String(e));
      return null;
    }
  }

  async function render() {
    setStatus('正在渲染…');
    try {
      let payload: Record<string, unknown>;
      if (item.adapter === 'fred-step-chain') payload = {id: item.id, props: validateFredProps(fred)};
      else if (item.adapter === 'fred-batch') {
        const props = parsedBatchProps();
        if (!props) throw new Error(batchError || '参数 JSON 无效');
        payload = {id: item.id, props, accent: batchAccent, background: batchBackground, speed: batchSpeed};
      } else payload = {id: item.id, speed, scale};
      const r = await fetch('/api/render-reference', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      let done = false;
      while (!done) {
        await new Promise((res) => setTimeout(res, 800));
        const job = await (await fetch(`/api/jobs/${j.id}`)).json();
        setStatus(job.status === 'rendering' ? `渲染 ${Math.round(job.progress * 100)}%` : job.status);
        if (job.status === 'done') {
          setDownload(job.url);
          done = true;
        }
        if (job.status === 'failed') throw new Error(job.error);
      }
    } catch (e) {
      setStatus(String(e));
    }
  }

  return (
    <section className="references-workspace">
      <div className="reference-heading">
        <div>
          <small>LW REFERENCES / EXTERNAL ASSETS</small>
          <h2>外部引用库</h2>
          <p>来源、授权、安装与渲染验证独立记录。在线可看 ≠ 本地可执行。</p>
        </div>
        <span>{results.length} 条检索结果</span>
      </div>
      <div className="reference-filters">
        <select aria-label="引用来源" value={provider} onChange={(e) => { setProvider(e.target.value); setCategory('all'); setPage(0); }}>
          <option value="all">全部来源</option>
          <option>Motion Prompt</option>
          <option>FredTalk</option>
        </select>
        <select aria-label="引用分类" value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }}>
          <option value="all">全部分类</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="reference-layout">
        <div className="reference-list">
          <div className="reference-pages">
            <button disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}>上一页</button>
            <span>{page + 1} / {Math.max(1, Math.ceil(results.length / 30))}</span>
            <button disabled={(page + 1) * 30 >= results.length} onClick={() => setPage(page + 1)}>下一页</button>
          </div>
          {results.slice(page * 30, page * 30 + 30).map((c) => (
            <button key={c.id} className={item?.id === c.id ? 'active' : ''} onClick={() => { setSelected(c.id); setDownload(''); setStatus(''); }}>
              <small>{c.provider} / {c.id}</small>
              <strong>{c.name}</strong>
              <span>{c.category} · {c.executable ? '已接入 · 可编辑导出' : c.adapter ? '本地适配 · 待验证' : c.previewUrl ? '可预览 · 待接入' : '查看官方来源'}</span>
            </button>
          ))}
          {results.length === 0 && <p>无匹配结果</p>}
        </div>
        {item && (
          <article className="reference-detail">
            <div className="source-badge">{item.provider} · {item.id}</div>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <div className="reference-preview">
              {item.adapter === 'fred-step-chain' ? (
                fredError ? <p role="alert">{fredError}</p> : (
                  <Player component={FredTalkAdapter} inputProps={fred} durationInFrames={Math.ceil(420 / fred.speed)} fps={60} compositionWidth={1280} compositionHeight={720} style={{width: '100%'}} controls loop />
                )
              ) : item.adapter === 'fred-batch' && batchEntry ? (
                batchError ? <p role="alert">{batchError}</p> : (
                  <Player
                    key={batchEntry.id}
                    component={batchEntry.adapter}
                    inputProps={{props: JSON.parse(batchProps), accent: batchAccent, background: batchBackground, speed: batchSpeed}}
                    durationInFrames={Math.ceil(batchEntry.sourceFrames / batchSpeed)}
                    fps={batchEntry.fps}
                    compositionWidth={1280}
                    compositionHeight={720}
                    style={{width: '100%'}}
                    controls
                    loop
                  />
                )
              ) : item.adapter === 'motion-pop-in' ? (
                <Player component={MotionPromptAdapter} inputProps={{speed, scale}} durationInFrames={141} fps={30} compositionWidth={1280} compositionHeight={720} style={{width: '100%'}} controls loop />
              ) : item.previewUrl ? (
                <video key={item.id} src={item.previewUrl} controls preload="metadata" onError={() => setStatus('官方预览暂未加载，请打开官方地址。')} />
              ) : (
                <div className="online-reference">
                  <p>该条目尚未接入LW。可打开官方来源获取公开源码。</p>
                  <a href={item.officialUrl} target="_blank" rel="noreferrer">打开官方动态图鉴</a>
                </div>
              )}
            </div>
            <dl>
              <dt>本地状态</dt><dd>{item.installStatus}</dd>
              <dt>渲染验证</dt><dd>{item.renderStatus}</dd>
              <dt>制作候选</dt><dd>{item.executable ? '可编辑并导出' : '可预览 · 尚未完成本地接入'}</dd>
              <dt>许可证</dt><dd>{item.license}</dd>
            </dl>
            <div className="reference-links">
              <a href={item.officialUrl} target="_blank" rel="noreferrer">官方地址</a>
              <a href={item.licenseUrl} target="_blank" rel="noreferrer">许可与范围</a>
            </div>
            {item.adapter === 'fred-step-chain' && (
              <div className="external-controls">
                <label>标题<input aria-label="FredTalk标题" value={fred.title} maxLength={30} onChange={(e) => setFred({...fred, title: e.target.value})} /></label>
                <label>步骤（每行一条，3–9条）
                  <textarea aria-label="FredTalk步骤" rows={7} style={{width: '100%'}} value={fred.steps.join('\n')} onChange={(e) => setFred({...fred, steps: e.target.value.split('\n'), highlight: Math.min(fred.highlight, e.target.value.split('\n').length - 1)})} />
                </label>
                <label>强调色<input aria-label="FredTalk强调色" type="color" value={fred.accent} onChange={(e) => setFred({...fred, accent: e.target.value})} /></label>
                <label>高亮步骤<select aria-label="FredTalk高亮步骤" value={fred.highlight} onChange={(e) => setFred({...fred, highlight: Number(e.target.value)})}>{fred.steps.map((s, i) => <option key={i} value={i}>{i + 1} · {s}</option>)}</select></label>
                <label>速度 {fred.speed.toFixed(1)}×<input aria-label="FredTalk速度" type="range" min=".5" max="2" step=".1" value={fred.speed} onChange={(e) => setFred({...fred, speed: Number(e.target.value)})} /></label>
                <p>FredTalk T03e 源码适配 · OFL 得意黑字体 · 无原品牌角标与音效</p>
                <button className="export" disabled={!item.executable || !!fredError} onClick={render}>导出此 FredTalk 组件 MP4</button>
              </div>
            )}
            {item.adapter === 'fred-batch' && batchEntry && (
              <div className="external-controls">
                <p>{batchEntry.meta.category} · {batchEntry.meta.ftId} · 原生 {batchEntry.sourceFrames}f @ {batchEntry.fps}fps · 策略 {batchEntry.meta.strategy}</p>
                <label>可编辑参数：{batchEntry.editableKeys.join('、')}</label>
                <label>参数 JSON
                  <textarea aria-label="FredTalk批量参数" rows={8} style={{width: '100%', fontFamily: 'monospace'}} value={batchProps} onChange={(e) => { setBatchProps(e.target.value); parsedBatchProps(); }} />
                </label>
                <label>主题色<input aria-label="FredTalk主题色" type="color" value={batchAccent} onChange={(e) => setBatchAccent(e.target.value)} /></label>
                <label>背景色<input aria-label="FredTalk背景色" type="color" value={batchBackground} onChange={(e) => setBatchBackground(e.target.value)} /></label>
                <label>时长速度 {batchSpeed.toFixed(1)}×<input aria-label="FredTalk时长速度" type="range" min=".5" max="2" step=".1" value={batchSpeed} onChange={(e) => setBatchSpeed(Number(e.target.value))} /></label>
                <p>FredTalk 源码 MIT · 媒体不入库，使用 LW 自有占位素材 · 保留上游来源，不标为 LW 原创</p>
                <button className="export" disabled={!item.executable || !!batchError} onClick={render}>导出此 FredTalk 组件 MP4</button>
              </div>
            )}
            {item.adapter === 'motion-pop-in' && (
              <div className="external-controls">
                <label>时间速度 {speed.toFixed(1)}×<input aria-label="外部组件速度" type="range" min=".5" max="2" step=".1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} /></label>
                <label>显示缩放 {scale.toFixed(1)}×<input aria-label="外部组件缩放" type="range" min=".8" max="1.2" step=".1" value={scale} onChange={(e) => setScale(Number(e.target.value))} /></label>
                <button className="export" onClick={render}>渲染已适配外部组件</button>
              </div>
            )}
            <p role="status">{status}</p>
            {download && <a href={download} download>下载外部组件 MP4</a>}
          </article>
        )}
      </div>
    </section>
  );
}
