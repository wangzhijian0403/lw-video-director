import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionLibrary} from './MotionLibrary';
import {ResourceGallery} from './ResourceGallery';
import {CopyAssetFinder} from './CopyAssetFinder';
import {CONFIG_KEY, DEFAULT_CONFIG, ProductionWizard, configFromParams, loadSaved, shouldOpenWizard, type WizardConfig} from './ProductionWizard';
import './studio.css';

type Library = 'motion' | 'assets';

function initialLibrary(): Library {
  const v = new URLSearchParams(location.search).get('view');
  if (v === 'assets' || v === '素材') return 'assets';
  return 'motion';
}

function App() {
  const params = useMemo(() => configFromParams(location.search), []);
  const saved = useMemo(() => loadSaved(), []);
  const [config, setConfig] = useState<WizardConfig | null>(saved);
  const [wizardOpen, setWizardOpen] = useState(() => shouldOpenWizard(location.search, saved));
  const [finderOpen, setFinderOpen] = useState(false);
  const [library, setLibrary] = useState<Library>(initialLibrary);
  const [search, setSearch] = useState('');

  function finishWizard(next: WizardConfig) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    setConfig(next); setWizardOpen(false);
  }

  const activeConfig: WizardConfig = config ?? {...DEFAULT_CONFIG, ...params, completedAt: ''};
  const providers = activeConfig.motionSources?.length ? activeConfig.motionSources : undefined;

  return <div className={`studio ${library === 'assets' ? 'studio-resources' : ''}`}>
    <header>
      <div className="brand">
        <b className="logo">LW</b>
        <div><strong>Visual Studio</strong><small>LW VIDEO DIRECTOR / MOTION LIBRARY</small></div>
        <span className="badge">MVP 0.2</span>
      </div>
      <div className="header-right">
        <button type="button" className="header-tool" onClick={() => setFinderOpen(true)}>文案找素材</button>
        <button type="button" className="header-tool" onClick={() => setWizardOpen(true)}>制作向导</button>
        <span className="local">LOCAL WORKSPACE</span>
      </div>
    </header>
    <aside className="library" data-library={library}>
      <div className="library-tabs">
        <button className={library === 'motion' ? 'active' : ''} onClick={() => setLibrary('motion')}>动效库</button>
        <button className={library === 'assets' ? 'active' : ''} onClick={() => setLibrary('assets')}>素材库</button>
      </div>
      <div className="section-heading">{library === 'motion' ? '动效' : '素材'} <span>{library === 'motion' ? '353' : '3 类'}</span></div>
      <input className="search" aria-label="搜索组件" placeholder={library === 'motion' ? '搜索动效、编号或描述…' : '搜索场景、图标、角色…'} value={search} onChange={e => setSearch(e.target.value)}/>
      <div className="library-footer">
        {library === 'motion'
          ? <>外部动效统一选型<br/><span>默认只看已装好、可本地渲染的条目（240 条 Motion Prompt + 113 条 FredTalk）。</span></>
          : <>插画场景 · SVG 图标 · 本地角色<br/><span>动效请到「动效库」栏目查看。</span></>}
      </div>
    </aside>
    {library === 'motion' ? <MotionLibrary search={search} providers={providers}/> : <ResourceGallery search={search}/>}

    {wizardOpen && <ProductionWizard known={params} onFinish={finishWizard} onClose={saved ? () => setWizardOpen(false) : undefined}>
      <CopyAssetFinder config={activeConfig} initialCopy={params.copy ?? config?.copy ?? ''} compact/>
    </ProductionWizard>}
    {finderOpen && <div className="finder-backdrop" role="dialog" aria-modal="true" aria-label="文案找素材">
      <div className="finder-panel">
        <button type="button" className="wizard-close" onClick={() => setFinderOpen(false)} aria-label="关闭">×</button>
        <CopyAssetFinder config={config} initialCopy={config?.copy ?? ''}/>
      </div>
    </div>}
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
