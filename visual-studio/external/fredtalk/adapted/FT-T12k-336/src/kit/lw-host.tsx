// LW host context for adapted FredTalk components. Not upstream code.
import {createContext, useContext} from 'react';
export type LWHostValue = {accent: string; accentDark: string; background: string; ink: string; speed: number; font: string};
export const FredHost = createContext<LWHostValue>({
  accent: '#8554E8', accentDark: '#D6BEFF', background: '#ffffff', ink: '#19191c', speed: 1, font: 'LW Fred SmileySans',
});
export const useHost = () => useContext(FredHost);
