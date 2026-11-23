import React, {useMemo, useState} from 'react';

export type WizardConfig = {
  motionSources: string[];
  mediaSources: string[];
  selection: 'semantic' | 'keyword' | 'manual';
  scope: 'private-test' | 'project';
  copy: string;
  completedAt: string;
};

export const CONFIG_KEY = 'lw-video-director.wizard.v1';

export const DEFAULT_CONFIG: Omit<WizardConfig, 'completedAt'> = {
  motionSources: ['motion-prompt', 'fredtalk'],
  mediaSources: ['user-local', 'lw-originals', 'lw-references'],
  selection: 'semantic',
  scope: 'private-test',
  copy: '',
};

const MOTION_OPTIONS = [
  {value: 'motion-prompt', label: 'Motion Prompt', detail: '240 条 · MIT · 已验证可本地渲染'},
  {value: 'fredtalk', label: 'FredTalk', detail: '113 条 · 已验证可执行 · 素材权利需逐项确认'},
];
const MEDIA_OPTIONS = [
  {value: 'user-local', label: '你本地的图片 / 视频', detail: '需要先导入到项目素材库并核对权利'},
  {value: 'lw-originals', label: 'LW 原创素材', detail: '工作台自带、来源清晰的原创组件与场景'},
  {value: 'lw-references', label: '在线授权素材', detail: 'Openverse 等 CC0/BY 候选，需人工复核后才能使用'},
];
const SELECT_OPTIONS = [
  {value: 'semantic', label: '按文案自动选材（推荐）', detail: '文案 → 镜头意图草案 → 现有素材引擎打分，结果需人工确认'},
  {value: 'keyword', label: '关键词检索', detail: '直接在动效库目录里按词查找，不做语义意图推导'},
  {value: 'manual', label: '我自己挑', detail: '跳过自动选材，直接进入动效库 / 素材库'},
];

export function configFromParams(search: string): Partial<WizardConfig> {
  const p = new URLSearchParams(search);
  const list = (key: string) => {
    const raw = p.get(key);
    return raw ? raw.split(',').map(x => x.trim()).filter(Boolean) : undefined;
  };
  const selection = p.get('select');
  const scope = p.get('scope');
  return {
    ...(list('motion') ? {motionSources: list('motion')} : {}),
    ...(list('media') ? {mediaSources: list('media')} : {}),
    ...(selection && ['semantic', 'keyword', 'manual'].includes(selection) ? {selection: selection as WizardConfig['selection']} : {}),
    ...(scope && ['private-test', 'project'].includes(scope) ? {scope: scope as WizardConfig['scope']} : {}),
    ...(p.get('copy') ? {copy: p.get('copy') as string} : {}),
  };
}

export function loadSaved(): WizardConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as WizardConfig;
    return cfg && cfg.completedAt ? cfg : null;
  } catch { return null; }
}

export function shouldOpenWizard(search: string, saved: WizardConfig | null): boolean {
  const flag = new URLSearchParams(search).get('wizard');
  if (flag === '0') return false;
  if (flag === '1') return true;
  return !saved;
}

export function mediaToLibraries(config: WizardConfig): string[] {
  const map: Record<string, string> = {
    'user-local': 'user-local', 'lw-originals': 'lw-originals', 'lw-references': 'lw-references',
  };
  const values = config.mediaSources.map(x => map[x]).filter(Boolean);
  return values.length ? [...new Set(values)] : ['user-local', 'lw-originals', 'lw-references'];
}

type Props = {
  known: Partial<WizardConfig>;
  onFinish: (config: WizardConfig) => void;
  onClose?: () => void;
  children?: React.ReactNode;
};

export function ProductionWizard({known, onFinish, onClose, children}: Props) {
  const initial = useMemo<WizardConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...known,
    motionSources: known.motionSources?.length ? known.motionSources : DEFAULT_CONFIG.motionSources,
    mediaSources: known.mediaSources?.length ? known.mediaSources : DEFAULT_CONFIG.mediaSources,
    completedAt: '',
  }), [known]);
  const [draft, setDraft] = useState<WizardConfig>(initial);
  const [editing, setEditing] = useState<Set<string>>(new Set());

  const isKnown = (key: keyof WizardConfig) => {
    const v = known[key];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  };
  const open = (key: string) => setEditing(prev => new Set(prev).add(key));
  const toggle = <K extends 'motionSources' | 'mediaSources'>(key: K, value: string) => {
    setDraft(prev => {
      const list = prev[key];
      const next = list.includes(value) ? list.filter(x => x !== value) : [...list, value];
      return {...prev, [key]: next};
    });
  };
  const finish = () => onFinish({...draft, completedAt: new Date().toISOString()});
  const applyDefault = () => onFinish({...DEFAULT_CONFIG, copy: draft.copy, completedAt: new Date().toISOString()});

  const motionSummary = draft.motionSources.map(v => MOTION_OPTIONS.find(o => o.value === v)?.label ?? v).join(' + ');
  const mediaSummary = draft.mediaSources.map(v => MEDIA_OPTIONS.find(o => o.value === v)?.label ?? v).join(' + ');
  const selectSummary = SELECT_OPTIONS.find(o => o.value === draft.selection)?.label ?? draft.selection;

  const section = (key: string, title: string, summary: string, body: React.ReactNode) => {
    const knownBefore = isKnown(key as keyof WizardConfig);
    const expanded = !knownBefore || editing.has(key);
    return <section className={`wizard-section ${expanded ? 'open' : 'recap'}`}>
      <div className="wizard-section-head">
        <div><h3>{title}</h3>{!expanded && <p>已按你之前给的条件沿用：{summary}</p>}</div>
        {knownBefore && <button type="button" className="wizard-edit" onClick={() => open(key)}>{editing.has(key) ? '正在修改' : '改一下'}</button>}
      </div>
      {expanded && <div className="wizard-section-body">{body}</div>}
    </section>;
  };

  return <div className="wizard-backdrop" role="dialog" aria-modal="true" aria-label="制作向导">
    <div className="wizard">
      <div className="wizard-top">
        <div><small>LW VIDEO DIRECTOR / 制作向导</small><h2>开始一条新视频</h2></div>
        {onClose && <button type="button" className="wizard-close" onClick={onClose} aria-label="关闭向导">×</button>}
      </div>

      <section className="wizard-intro">
        <h3>先说清楚，它能做什么</h3>
        <div className="wizard-capabilities">
          <div><b>01</b><span>把动效库里已装好的动效，本地渲染成真实 MP4。</span></div>
          <div><b>02</b><span>按镜头职责从素材引擎里挑可用素材，并保留打分依据。</span></div>
          <div><b>03</b><span>把你写的文案拆成镜头意图草案，接同一套素材引擎找画面。</span></div>
          <div><b>04</b><span>把素材、字幕、声音放进同一条时间轴，导出成片。</span></div>
        </div>
        <p className="wizard-limit">边界先讲明白：文案找素材是<strong>规则线索映射</strong>，不是语义理解；结果只作为草案，需要你确认。权利不过关的素材不会被自动选用。任意题材全自动成片仍未验证。</p>
        <button type="button" className="wizard-default" onClick={applyDefault}>⚡ 一键按默认方案制作</button>
        <p className="wizard-default-note">默认：Motion Prompt + FredTalk 动效 · 本地/原创/在线授权素材 · 按文案自动选材 · 仅内部测试范围</p>
      </section>

      <div className="wizard-questions">
        <p className="wizard-hint">下面几项，你已经交代过的我不再问，直接沿用；想改再点「改一下」。</p>
        {section('motionSources', '1. 动效库用哪些来源', motionSummary,
          <div className="wizard-options">{MOTION_OPTIONS.map(o => <label key={o.value} className={draft.motionSources.includes(o.value) ? 'chosen' : ''}>
            <input type="checkbox" checked={draft.motionSources.includes(o.value)} onChange={() => toggle('motionSources', o.value)}/>
            <span><b>{o.label}</b><small>{o.detail}</small></span>
          </label>)}</div>)}
        {section('mediaSources', '2. 图片 / 视频素材从哪来', mediaSummary,
          <div className="wizard-options">{MEDIA_OPTIONS.map(o => <label key={o.value} className={draft.mediaSources.includes(o.value) ? 'chosen' : ''}>
            <input type="checkbox" checked={draft.mediaSources.includes(o.value)} onChange={() => toggle('mediaSources', o.value)}/>
            <span><b>{o.label}</b><small>{o.detail}</small></span>
          </label>)}</div>)}
        {section('selection', '3. 自动选材方式', selectSummary,
          <div className="wizard-options">{SELECT_OPTIONS.map(o => <label key={o.value} className={draft.selection === o.value ? 'chosen' : ''}>
            <input type="radio" name="lw-selection" checked={draft.selection === o.value} onChange={() => setDraft(prev => ({...prev, selection: o.value as WizardConfig['selection']}))}/>
            <span><b>{o.label}</b><small>{o.detail}</small></span>
          </label>)}</div>)}
        <section className="wizard-section open">
          <div className="wizard-section-head"><div><h3>4. 使用范围</h3><p>决定素材许可范围，不会自动升级到公开发布。</p></div></div>
          <div className="wizard-scope">
            <label><input type="radio" name="lw-scope" checked={draft.scope === 'private-test'} onChange={() => setDraft(prev => ({...prev, scope: 'private-test'}))}/> 仅内部测试 / 项目内</label>
            <label><input type="radio" name="lw-scope" checked={draft.scope === 'project'} onChange={() => setDraft(prev => ({...prev, scope: 'project'}))}/> 项目交付（仍需逐项权利复核）</label>
          </div>
        </section>
      </div>

      {children && <div className="wizard-copy">{children}</div>}

      <div className="wizard-actions">
        <button type="button" className="wizard-finish" onClick={finish}>保存设置并开始</button>
        <span>下次进入不再重复问；可在顶部「制作向导」重新修改。</span>
      </div>
    </div>
  </div>;
}
