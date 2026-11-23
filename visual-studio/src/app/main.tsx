import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionLibrary} from './MotionLibrary';
import {ResourceGallery} from './ResourceGallery';
import './studio.css';

type Library = 'motion' | 'assets';

function initialLibrary(): Library {
  const v = new URLSearchParams(location.search).get('view');
  if (v === 'assets' || v === '素材') return 'assets';
  return 'motion';
}

function App() {
  const [library, setLibrary] = useState<Library>(initialLibrary);
  const [search, setSearch] = useState('');

  return <div className={`studio ${library === 'assets' ? 'studio-resources' : ''}`}>
    <header>
      <div className="brand">
        <b className="logo">LW</b>
        <div><strong>Visual Studio</strong><small>LW VIDEO DIRECTOR / MOTION LIBRARY</small></div>
        <span className="badge">MVP 0.2</span>
      </div>
      <div className="header-right"><span className="local">LOCAL WORKSPACE</span></div>
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
    {library === 'motion' ? <MotionLibrary search={search}/> : <ResourceGallery search={search}/>}
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
