import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {searchAssets} from '../references/search';
import {MotionPromptAdapter} from '../references/MotionPromptAdapter';

type Motion = {
  id: string;
  provider: string;
  name: string;
  category: string;
  description: string;
  executable: boolean;
  adapter?: string | null;
  sourceAvailable?: boolean;
  previewUrl?: string;
  officialUrl?: string;
  license?: string;
  licenseUrl?: string;
  installStatus?: string;
  renderStatus?: string;
};

type Job = {id?: string; status: string; progress?: number; error?: string; url?: string};

const PAGE_SIZE = 30;

function usePolling(job: Job, setJob: (j: Job) => void) {
  useEffect(() => {
    if (!job.id || !['queued', 'rendering'].includes(job.status)) return;
    const timer = setInterval(async () => {
      try {
        const r = await fetch(`/api/jobs/${job.id}`);
        setJob(await r.json());
      } catch {
        setJob({status: 'failed', error: '本地渲染服务连接中断'});
      }
    }, 800);
    return () => clearInterval(timer);
  }, [job.id, job.status]);
}

function ReferenceStage({item}: {item: Motion}) {
  const [speed, setSpeed] = useState(1);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState('');
  const [download, setDownload] = useState('');
  const [job, setJob] = useState<Job>({status: 'idle'});
  const player = useRef<PlayerRef>(null);
  usePolling(job, setJob);
  const canRender = item.executable && ['fred-batch', 'fred-step-chain', 'motion-pop-in', 'motion-prompt-cell'].includes(String(item.adapter ?? ''));
  async function render() {
    setStatus('正在渲染…');
    try {
      const r = await fetch('/api/render-reference', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: item.id, speed, scale}),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setJob(j);
      let done = false;
      while (!done) {
        await new Promise(r => setTimeout(r, 800));
        const jobData = await (await fetch(`/api/jobs/${j.id}`)).json();
        setStatus(jobData.status === 'rendering' ? `渲染 ${Math.round((jobData.progress || 0) * 100)}%` : jobData.status);
        if (jobData.status === 'done') { setDownload(jobData.url); done = true; }
        if (jobData.status === 'failed') throw new Error(jobData.error);
      }
    } catch (e) {
      setStatus(String(e));
    }
  }
  return <article className="reference-detail">
    <div className="source-badge">{item.provider} · {item.id}</div>
    <h2>{item.name}</h2>
    <p>{item.description}</p>
    {canRender && <div className="local-ready-note">✓ 已装好本地源码并注册到工作台，点下方按钮即可渲染真实 MP4（官方预览受网络影响可能加载不出）。</div>}
    <div className="reference-preview">
      {item.adapter === 'motion-pop-in'
        ? <Player ref={player} component={MotionPromptAdapter} inputProps={{speed, scale}} durationInFrames={141} fps={30} compositionWidth={1280} compositionHeight={720} style={{width: '100%'}} controls loop/>
        : item.previewUrl
          ? <video key={item.id} src={item.previewUrl} controls preload="metadata" onError={() => setStatus('官方预览当前无法加载；这不影响本地渲染。')}/>
          : item.sourceAvailable
            ? <div className="online-reference"><p>本地源码已装好；官方动态预览受网络影响可能加载不出。直接点下方“本地渲染 MP4”即可。</p><a href={item.officialUrl} target="_blank" rel="noreferrer">打开官方动态图鉴</a></div>
            : <div className="online-reference"><p>该条目未安装源码。点击官方地址查看动态样例。</p><a href={item.officialUrl} target="_blank" rel="noreferrer">打开官方动态图鉴</a></div>}
    </div>
    <dl>
      <dt>来源</dt><dd>{item.provider}</dd>
      <dt>本地适配器</dt><dd>{item.adapter || '无'}</dd>
      <dt>本地状态</dt><dd>{item.installStatus || '—'}</dd>
      <dt>渲染验证</dt><dd>{item.renderStatus || '—'}</dd>
      <dt>制作候选</dt><dd>{item.executable ? '可按内容选用' : '否 — 源码/适配/验证尚未齐备'}</dd>
      <dt>许可证</dt><dd>{item.license || '—'}</dd>
    </dl>
    <div className="reference-links">
      {item.officialUrl && <a href={item.officialUrl} target="_blank" rel="noreferrer">官方地址</a>}
      {item.licenseUrl && <a href={item.licenseUrl} target="_blank" rel="noreferrer">许可与范围</a>}
    </div>
    {canRender && <div className="external-controls">
      <label>时间速度 {speed.toFixed(1)}×<input aria-label="动效速度" type="range" min=".5" max="2" step=".1" value={speed} onChange={e => setSpeed(Number(e.target.value))}/></label>
      <label>显示缩放 {scale.toFixed(1)}×<input aria-label="动效缩放" type="range" min=".8" max="1.2" step=".1" value={scale} onChange={e => setScale(Number(e.target.value))}/></label>
      <button className="export" onClick={render} disabled={['queued', 'rendering'].includes(job.status)}>{['queued', 'rendering'].includes(job.status) ? '渲染中…' : item.adapter === 'motion-pop-in' ? '渲染已适配外部组件' : '本地渲染 MP4'}</button>
    </div>}
    {(status || download) && <div className="render-state" role="status">
      {status && <span>{status}</span>}
      {download && <a href={download} download>下载 MP4</a>}
    </div>}
  </article>;
}

export function MotionLibrary({search}: {search: string}) {
  const [source, setSource] = useState('all');
  const [category, setCategory] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(() => new URLSearchParams(location.search).get('verified') !== '0');
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const all = useMemo<Motion[]>(() => searchAssets('', 'references').map(c => ({
    id: c.id,
    provider: String(c.provider ?? '引用'),
    name: String((c as {name?: string}).name ?? c.id),
    category: String((c as {category?: string}).category ?? '未分类'),
    description: String((c as {description?: string}).description ?? ''),
    executable: Boolean(c.executable), adapter: (c as {adapter?: string}).adapter ?? null,
    sourceAvailable: (c as {sourceAvailable?: boolean}).sourceAvailable,
    previewUrl: (c as {previewUrl?: string}).previewUrl,
    officialUrl: (c as {officialUrl?: string}).officialUrl,
    license: (c as {license?: string}).license,
    licenseUrl: (c as {licenseUrl?: string}).licenseUrl,
    installStatus: (c as {installStatus?: string}).installStatus,
    renderStatus: (c as {renderStatus?: string}).renderStatus,
  })), []);

  const filtered = useMemo(() => all.filter(m => {
    if (verifiedOnly && !m.executable) return false;
    if (source !== 'all' && m.provider !== source) return false;
    if (category !== 'all' && m.category !== category) return false;
    if (search.trim() && ![m.id, m.name, m.description, m.category, m.provider].join(' ').toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  }), [all, verifiedOnly, source, category, search]);

  const categories = useMemo(() => [...new Set(all.map(m => m.category))], [all]);
  const verifiedCount = all.filter(m => m.executable).length;
  const item = filtered.find(m => m.id === selected) ?? filtered[0];
  useEffect(() => setPage(0), [search, source, category, verifiedOnly]);

  return <section className="references-workspace motion-workspace">
    <div className="reference-heading">
      <div><small>LW VIDEO DIRECTOR / MOTION LIBRARY</small><h2>动效库</h2>
        <p>外部动效统一选型。默认只看已装好、可本地渲染的条目。</p></div>
      <span>当前 {filtered.length} 条 · 已装好可执行 <b>{verifiedCount}</b> 条</span>
    </div>
    <div className="reference-filters">
      <select aria-label="动效来源" value={source} onChange={e => { setSource(e.target.value); setPage(0); }}>
        <option value="all">全部来源</option>
        <option value="FredTalk">FredTalk</option>
        <option value="Motion Prompt">Motion Prompt</option>
      </select>
      <select aria-label="动效分类" value={category} onChange={e => { setCategory(e.target.value); setPage(0); }}>
        <option value="all">全部分类</option>
        {categories.map(c => <option key={c}>{c}</option>)}
      </select>
      <button type="button" aria-label="只看已装好可执行的动效" className={verifiedOnly ? 'verified-filter active' : 'verified-filter'} onClick={() => setVerifiedOnly(v => !v)}>
        {verifiedOnly ? '✓ ' : ''}只看已装好的 <b>{verifiedCount}</b> 条
      </button>
    </div>
    <div className="reference-layout">
      <div className="reference-list">
        <div className="reference-pages">
          <button disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}>上一页</button>
          <span>{page + 1} / {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}</span>
          <button disabled={(page + 1) * PAGE_SIZE >= filtered.length} onClick={() => setPage(p => p + 1)}>下一页</button>
        </div>
        {filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(m => <button key={m.id} className={item?.id === m.id ? 'active' : ''} onClick={() => setSelected(m.id)}>
          <small>{m.provider} / {m.id}</small>
          <strong>{m.name}</strong>
          <span>{m.category} · {m.executable ? '已验证可执行' : m.adapter ? '本地适配 / 待验证' : '仅引用 / 不可执行'}</span>
        </button>)}
        {filtered.length === 0 && <p>没有符合条件的动效。</p>}
      </div>
      {item && <ReferenceStage item={item}/>}
    </div>
  </section>;
}
