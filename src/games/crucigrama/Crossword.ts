import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import type {GameCallbacks,GameHandle} from '../types';
import CrosswordGame,{type CrosswordController} from './CrosswordGame';

/** Separate React game module, compatible with Arcade's shared toolbar. */
export function createDominicanCrossword(element:HTMLElement,callbacks:GameCallbacks):GameHandle{
  const root=createRoot(element);
  const controller:CrosswordController={pause:()=>{},resume:()=>{},restart:()=>{}};
  root.render(createElement(CrosswordGame,{callbacks,controller}));
  return {
    pause(){controller.pause();},
    resume(){controller.resume();},
    restart(){controller.restart();},
    setDirection(){/* Letter navigation is owned by CrosswordGame. */},
    setMuted(){/* The crossword uses no background audio. */},
    destroy(){root.unmount();},
  };
}
