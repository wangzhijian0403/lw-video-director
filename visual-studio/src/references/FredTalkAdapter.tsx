import {StepChain} from '../../external/fredtalk/t03e/src/components/T03e-StepChain';
import {FredHost} from '../../external/fredtalk/t03e/src/kit/ui';
import {fredDefaults,validateFredProps} from './fred-props.mjs';
export type FredProps=typeof fredDefaults;
export function FredTalkAdapter(input:FredProps){const p=validateFredProps(input);return <FredHost.Provider value={{accent:p.accent,background:p.background,speed:p.speed}}><StepChain steps={p.steps} title={p.title} highlight={p.highlight}/></FredHost.Provider>;}
