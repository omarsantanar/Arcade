import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import type {GameCallbacks,GameHandle} from '../types';
import WordSearchGame,{type WordSearchController} from './WordSearchGame';

export function createDominicanWordSearch(element:HTMLElement,callbacks:GameCallbacks):GameHandle{
  const root=createRoot(element);
  const controller:WordSearchController={pause:()=>{},resume:()=>{},restart:()=>{}};
  root.render(createElement(WordSearchGame,{callbacks,controller}));
  return {
    pause(){controller.pause();},resume(){controller.resume();},restart(){controller.restart();},
    setDirection(){/* selection is owned by React */},
    setMuted(){/* quiet by design */},
    destroy(){root.unmount();},
  };
}
