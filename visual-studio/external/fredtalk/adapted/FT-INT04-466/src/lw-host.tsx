import {createContext, useContext} from 'react';
export type LWHostValue = {accent: string; accentDark: string; background: string; ink: string; speed: number; font: string};
export const FredHost = createContext<LWHostValue>({accent:'#8554E8',accentDark:'#D6BEFF',background:'#fff',ink:'#19191c',speed:1,font:'sans-serif'});
export const useHost = () => useContext(FredHost);
