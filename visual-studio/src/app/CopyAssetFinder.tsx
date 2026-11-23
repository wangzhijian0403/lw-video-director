import React, {useEffect, useState} from 'react';
import {mediaToLibraries, type WizardConfig} from './ProductionWizard';

type Asset = {
  assetId: string; name: string; library: string; kind: string;
  rights: {license?: string; scopes?: string[]};
  semantics: {concepts?: string[]; purposes?: string[]; evidence?: string};
};
type Decision = {selectedAssetId: string | null; fallback?: string | null; error?: string;
  intent: {concepts: string[]; purpose: string; analysisEvidence: string};
  recommendations: {assetId: string; score: number; usable: boolean; reasons: Record<string, number>}[]};
type Shot = {shot: number; text: string; derivation: string; decision: Decision; asset: Asset | null};
type Result = {engine: string; scope: string; shotCount: number; reviewRequired: boolean; shots: Shot[]};
type EngineStatus = {available: boolean; indexedAssets: number; libraries: string[]; error?: string};
type CatalogHit = {id: string; name: string; provider: string; description: string; executable: boolean};

type Props = {
  config: WizardConfig | null;
  initialCopy?: string;
  compact?: boolean;
};

export function CopyAssetFinder({config, initialCopy, compact}: Props) {
  const [copy, setCopy] = useState(initialCopy ?? config?.copy ?? '');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [hits, setHits] = useState<CatalogHit[] | null>(null);
  const [engine, setEngine] = useState<EngineStatus | null>(null);

  useEffect(() => {
    fetch('/api/asset-engine/status').then(r => r.json()).then(setEngine).catch(() => setEngine({available: false, indexedAssets: 0, libraries: []}));
  }, []);

  async function find() {
    setResult(null); setHits(null); setStatus('');
    if (!copy.trim()) { setStatus('先写一段文案，再来找素材。'); return; }
    if (config?.selection === 'manual') { setStatus('你选了「我自己挑」，请直接到动效库 / 素材库挑选。'); return; }
    setStatus('正在按文案找素材…');
    try {
      if (config?.selection === 'keyword') {
        const q = copy.split(/[。！？!?；;\n]/).map(x => x.trim()).find(Boolean) ?? copy;
        const r = await fetch(`/api/catalog?q=${encodeURIComponent(q)}`);
        const data = await r.json() as CatalogHit[];
        setHits(data.slice(0, 20)); setStatus(`关键词检索完成：目录里命中 ${data.length} 条。`);
        return;
      }
      const r = await fetch('/api/assets/from-copy', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({copy, scope: config?.scope ?? 'private-test',
          libraries: config ? mediaToLibraries(config) : undefined, maxShots: 12}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || '素材引擎调用失败');
      setResult(data as Result);
      setStatus(`已生成 ${(data as Result).shotCount} 个镜头意图草案。`);
    } catch (e) { setStatus(String(e)); }
  }

  return <div className={`copy-finder ${compact ? 'compact' : ''}`}>
    <div className="copy-finder-head">
      <div><small>LW ASSET ENGINE / COPY → MATERIALS</small><h3>文案自动找素材</h3></div>
      <span className="copy-engine-badge">{engine ? (engine.available ? `素材引擎已接入 · ${engine.indexedAssets} 条已登记` : '素材引擎暂不可用') : '正在检查素材引擎…'}</span>
    </div>
    <textarea aria-label="粘贴文案" placeholder="把你的脚本文案粘进来，例如：为什么画面动了还是讲不清？先把信息分层…"
      value={copy} onChange={e => setCopy(e.target.value)} rows={compact ? 3 : 5}/>
    <div className="copy-finder-actions">
      <button type="button" onClick={find}>按文案找素材</button>
      <span>走现有素材引擎；规则映射结果需人工确认，不会自动写进成片。</span>
    </div>
    {status && <p className="copy-status" role="status">{status}</p>}
    {result && <div className="copy-shots">
      {result.shots.map(shot => <article key={shot.shot} className="copy-shot">
        <div className="copy-shot-top"><b>镜头 {String(shot.shot).padStart(2, '0')}</b>
          <span>{shot.derivation === 'rule-cue' ? '规则线索' : '位置默认'}</span></div>
        <p className="copy-shot-text">{shot.text}</p>
        <p className="copy-shot-intent">意图：{shot.decision.intent.concepts.join(' / ')} → {shot.decision.intent.purpose}</p>
        {shot.asset ? <div className="copy-shot-asset">
          <b>{shot.asset.name}</b>
          <span>{shot.asset.library} · {shot.asset.kind} · {shot.asset.assetId}</span>
          <span>许可：{shot.asset.rights.license ?? '未标注'} · 范围：{(shot.asset.rights.scopes ?? []).join(',') || '未标注'}</span>
          <small>{shot.asset.semantics.evidence}</small>
          {shot.decision.fallback && <small className="copy-fallback">{shot.decision.fallback}</small>}
        </div> : <div className="copy-shot-empty">没有找到可用且权利过关的素材：{shot.decision.error}</div>}
        <details><summary>打分依据（{shot.decision.recommendations.length} 条候选）</summary>
          <ul>{shot.decision.recommendations.slice(0, 5).map(r => <li key={r.assetId}>
            {r.assetId} · {r.score} · {r.usable ? '可用' : '不可用'} · {JSON.stringify(r.reasons)}
          </li>)}</ul>
        </details>
      </article>)}
    </div>}
    {hits && <div className="copy-hits">
      {hits.length === 0 ? <p>目录里没有命中，换个词试试。</p> : hits.map(h => <div key={h.id}>
        <b>{h.name}</b><span>{h.provider} · {h.id} · {h.executable ? '可本地渲染' : '仅参考'}</span>
      </div>)}
    </div>}
  </div>;
}
