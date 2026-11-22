/**
 * Approved FredTalk candidates in LW Project Composition.
 * Only the 15 entries independently visually initial-reviewed in batch-20.
 * Source and provenance are copied unmodified from PR #8 (MIT first-party code).
 * NO bundled third-party images/audio/fonts. Actual integrated E2E video QA pending.
 */
import React from 'react';
import {Adapter as Adapter0, defaultProps as Defaults0} from '../../external/fredtalk/adapted/FT-T01b-431/src/adapter';
import {Adapter as Adapter1, defaultProps as Defaults1} from '../../external/fredtalk/adapted/FT-T01c-432/src/adapter';
import {Adapter as Adapter2, defaultProps as Defaults2} from '../../external/fredtalk/adapted/FT-T01e-410/src/adapter';
import {Adapter as Adapter3, defaultProps as Defaults3} from '../../external/fredtalk/adapted/FT-T01f-409/src/adapter';
import {Adapter as Adapter4, defaultProps as Defaults4} from '../../external/fredtalk/adapted/FT-T01g-411/src/adapter';
import {Adapter as Adapter5, defaultProps as Defaults5} from '../../external/fredtalk/adapted/FT-T01h-396/src/adapter';
import {Adapter as Adapter6, defaultProps as Defaults6} from '../../external/fredtalk/adapted/FT-T02e-412/src/adapter';
import {Adapter as Adapter7, defaultProps as Defaults7} from '../../external/fredtalk/adapted/FT-T02f-413/src/adapter';
import {Adapter as Adapter8, defaultProps as Defaults8} from '../../external/fredtalk/adapted/FT-T02g-360/src/adapter';
import {Adapter as Adapter9, defaultProps as Defaults9} from '../../external/fredtalk/adapted/FT-T02h-371/src/adapter';
import {Adapter as Adapter10, defaultProps as Defaults10} from '../../external/fredtalk/adapted/FT-T03c-416/src/adapter';
import {Adapter as Adapter11, defaultProps as Defaults11} from '../../external/fredtalk/adapted/FT-T03d-435/src/adapter';
import {Adapter as Adapter12, defaultProps as Defaults12} from '../../external/fredtalk/adapted/FT-T04b-434/src/adapter';
import {Adapter as Adapter13, defaultProps as Defaults13} from '../../external/fredtalk/adapted/FT-T04d-415/src/adapter';
import {Adapter as Adapter14, defaultProps as Defaults14} from '../../external/fredtalk/adapted/FT-T04f-369/src/adapter';

type AdapterProps = {props?: Record<string, unknown>; accent?: string; background?: string; ink?: string; speed?: number};
type Component = React.ComponentType<AdapterProps>;
const entries: Record<string, {component: Component; defaults: Record<string, unknown>}> = {
  'FT-T01b-431': {component: Adapter0, defaults: Defaults0},
  'FT-T01c-432': {component: Adapter1, defaults: Defaults1},
  'FT-T01e-410': {component: Adapter2, defaults: Defaults2},
  'FT-T01f-409': {component: Adapter3, defaults: Defaults3},
  'FT-T01g-411': {component: Adapter4, defaults: Defaults4},
  'FT-T01h-396': {component: Adapter5, defaults: Defaults5},
  'FT-T02e-412': {component: Adapter6, defaults: Defaults6},
  'FT-T02f-413': {component: Adapter7, defaults: Defaults7},
  'FT-T02g-360': {component: Adapter8, defaults: Defaults8},
  'FT-T02h-371': {component: Adapter9, defaults: Defaults9},
  'FT-T03c-416': {component: Adapter10, defaults: Defaults10},
  'FT-T03d-435': {component: Adapter11, defaults: Defaults11},
  'FT-T04b-434': {component: Adapter12, defaults: Defaults12},
  'FT-T04d-415': {component: Adapter13, defaults: Defaults13},
  'FT-T04f-369': {component: Adapter14, defaults: Defaults14},
};
export const approvedFredTalkIds = Object.keys(entries);

export function FredTalkApprovedScene({id, sceneProps = {}, accent = '#537B87',
  background = '#F8F7F2', ink = '#193447', speed = 1}: {
    id: string;
    sceneProps?: Record<string, unknown>;
    accent?: string;
    background?: string;
    ink?: string;
    speed?: number;
  }) {
  const entry = entries[id];
  if (!entry) throw new Error('FredTalk component is not approved for production preview: ' + id);
  const ComponentView = entry.component;
  const props = {...entry.defaults, ...sceneProps};
  return <ComponentView props={props} accent={accent} background={background}
    ink={ink} speed={Number.isFinite(speed) && speed > 0 ? speed : 1} />;
}
