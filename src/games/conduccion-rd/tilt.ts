/** DeviceOrientation input with screen rotation compensation. Pure functions so sensor
 * calibration and direction can be checked without a physical phone.
 * beta/gamma are browser-reported angles; no readings are persisted or transmitted.
 */
export type TiltSample={beta:number|null;gamma:number|null;screenAngle:number};
export const normalizeAngle=(a:number)=>((Math.round(a/90)*90)%360+360)%360;
/** Landscape-primary uses beta; landscape-secondary reverses its sign. */
export function tiltAxis(sample:TiltSample):number|null{
  const angle=normalizeAngle(sample.screenAngle);
  const value=(angle===90||angle===270)?sample.beta:sample.gamma;
  if(value===null||!Number.isFinite(value))return null;
  return (angle===180||angle===270)?-value:value;
}
/** Wrap beta's 180-degree discontinuity, keeping turns continuous near the boundary. */
export const angleDifference=(value:number,zero:number)=>((value-zero+540)%360)-180;
export function steeringFromTilt(value:number,neutral:number,sensitivity=1,inverted=false):number{
  const delta=angleDifference(value,neutral);
  const degrees=Math.abs(delta);
  const deadZone=3;
  const fullSteer=26;
  if(degrees<=deadZone)return 0;
  const magnitude=Math.min(1,(degrees-deadZone)/(fullSteer-deadZone));
  const shaped=Math.pow(magnitude,.92)*Math.max(.6,Math.min(2,sensitivity));
  return Math.max(-1,Math.min(1,(delta<0?-1:1)*(inverted?-shaped:shaped)));
}
export function smoothSteering(previous:number,target:number,dtSeconds:number):number{
  if(dtSeconds<=0)return previous;
  const alpha=1-Math.exp(-Math.min(dtSeconds,.15)/.13);
  return Math.max(-1,Math.min(1,previous+(target-previous)*alpha));
}
