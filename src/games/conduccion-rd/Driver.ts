import {createElement} from 'react';
import {createRoot} from 'react-dom/client';
import type {GameCallbacks,GameHandle} from '../types';
import DriverGame,{type DriverController} from './DriverGame';

export function createDrivingRD(mount:HTMLElement,callbacks:GameCallbacks):GameHandle{
  const root=createRoot(mount);
  const controller:DriverController={pause:()=>{},resume:()=>{},restart:()=>{},setMuted:()=>{}};
  root.render(createElement(DriverGame,{callbacks,controller}));
  return {
    pause:()=>controller.pause(),resume:()=>controller.resume(),restart:()=>controller.restart(),
    setDirection:()=>{},setMuted:(muted)=>controller.setMuted(muted),
    destroy:()=>root.unmount(),
  };
}
