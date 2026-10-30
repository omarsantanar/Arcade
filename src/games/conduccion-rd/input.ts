import type {DrivingControls} from './logic';
/** Primary controls: keyboard arrows; WASD remains an optional compatibility shortcut. */
export function pedalForKey(key:string):keyof DrivingControls|null{
  const normalized=key.toLowerCase();
  if(normalized==='arrowup'||normalized==='w')return 'throttle';
  if(normalized==='arrowdown'||normalized==='s')return 'brake';
  if(normalized==='arrowleft'||normalized==='a')return 'left';
  if(normalized==='arrowright'||normalized==='d')return 'right';
  return null;
}
