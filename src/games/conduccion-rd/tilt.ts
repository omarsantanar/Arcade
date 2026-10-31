/** Web device-orientation steering. Relative roll, not a compass heading.
 * Calibration per screen angle avoids assuming all phones share a neutral pose.
 */
export interface TiltSample {beta:number|null;gamma:number|null}
export type TiltSettings={sensitivity:number;inverted:boolean};
export const TILT_DEFAULTS:TiltSettings={sensitivity:25,inverted:false};
export const TILT_DEAD_ZONE_DEGREES=2;
export const TILT_STALE_MS=1250;
export const TILT_MAX_AGE_MS=10000;
export const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
/** Screen Orientation angle is 0, 90, 180 or 270° on ordinary handsets. */
export function screenRoll(sample:TiltSample,angle:number):number|null{
  const rotation=((Math.round(angle/90)*90)%360+360)%360;
  const axis=(rotation===90||rotation===270)?sample.beta:sample.gamma;
  if(axis===null||!Number.isFinite(axis))return null;
  const direction=rotation===90||rotation===180?-1:1;
  return axis*direction;
}
/** Normalize wraparound when beta crosses +180/-180 degrees. */
export function angularDifference(sample:number,neutral:number):number{
  return ((sample-neutral+540)%360+360)%360-180;
}
export function tiltToSteer(roll:number,neutral:number,settings:TiltSettings):number{
  const raw=angularDifference(roll,neutral)*(settings.inverted?-1:1);
  const delta=Math.abs(raw);
  if(delta<=TILT_DEAD_ZONE_DEGREES)return 0;
  return clamp(Math.sign(raw)*(delta-TILT_DEAD_ZONE_DEGREES)/
    Math.max(5,settings.sensitivity-TILT_DEAD_ZONE_DEGREES),-1,1);
}
/** Smooth response and rate-limit sudden sensor jumps. Independent of frame rate. */
export function smoothSteer(previous:number,target:number,dt:number):number{
  const step=clamp(dt,0,.1);
  const lowpass=previous+(clamp(target,-1,1)-previous)*(1-Math.exp(-step*7));
  return clamp(lowpass,previous-step*3,previous+step*3);
}
export function isSensorRecent(lastTime:number,now:number):boolean{
  return lastTime>0&&now>=lastTime&&now-lastTime<=TILT_STALE_MS;
}
