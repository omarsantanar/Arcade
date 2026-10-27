import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { GameCallbacks, GameHandle } from '../types';
import SudokuGame, { type SudokuController } from './SudokuGame';

/** A React-rendered puzzle module using Arcade's existing GameFactory contract. */
export function createSudoku(element:HTMLElement,callbacks:GameCallbacks):GameHandle {
  const root=createRoot(element);
  const controller:SudokuController={pause:()=>{},resume:()=>{},restart:()=>{}};
  root.render(createElement(SudokuGame,{callbacks,controller}));
  return {
    pause(){controller.pause();},
    resume(){controller.resume();},
    restart(){controller.restart();},
    setDirection(){/* Arrow navigation is handled inside SudokuGame. */},
    setMuted(){/* The puzzle is intentionally silent; no sound assets required. */},
    destroy(){root.unmount();},
  };
}
