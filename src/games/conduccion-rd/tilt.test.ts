import {describe,it,expect} from 'vitest';
import {tiltAxis,angleDifference,steeringFromTilt,smoothSteering,normalizeAngle} from './tilt';
import {advanceDrive,makeDrivingState,ZERO_CONTROLS} from './logic';

describe('Sensor steering mobile (orientation data stays in memory)',()=>{
 it('reads portrait roll from gamma and landscape roll from beta',()=>{
   expect(tiltAxis({gamma:12,beta:55,screenAngle:0})).toBe(12);
   expect(tiltAxis({gamma:12,beta:55,screenAngle:90})).toBe(55);
   expect(tiltAxis({gamma:12,beta:55,screenAngle:270})).toBe(-55);
   expect(tiltAxis({gamma:12,beta:55,screenAngle:180})).toBe(-12);
   expect(normalizeAngle(-90)).toBe(270);
 });
 it('rejects missing or invalid sensor readings rather than turning randomly',()=>{
   expect(tiltAxis({beta:null,gamma:4,screenAngle:90})).toBeNull();
   expect(tiltAxis({beta:NaN,gamma:4,screenAngle:90})).toBeNull();
   expect(tiltAxis({beta:12,gamma:null,screenAngle:0})).toBeNull();
 });
 it('calibrates an arbitrary neutral, a quiet dead zone, and symmetric turns',()=>{
   expect(steeringFromTilt(60,60)).toBe(0);
   expect(steeringFromTilt(62,60)).toBe(0);
   expect(steeringFromTilt(72,60)).toBeGreaterThan(0);
   expect(steeringFromTilt(48,60)).toBeLessThan(0);
   expect(steeringFromTilt(86,60)).toBeCloseTo(1);
   expect(steeringFromTilt(34,60)).toBeCloseTo(-1);
 });
 it('handles beta roll wrapping near +180/-180 degrees',()=>{
   expect(angleDifference(-178,178)).toBe(4);
   expect(angleDifference(178,-178)).toBe(-4);
   expect(steeringFromTilt(-173,174)).toBeGreaterThan(0);
 });
 it('supports inverted controls and sensitivity without overshooting',()=>{
   const normal=steeringFromTilt(15,0,1,false);
   expect(steeringFromTilt(15,0,1,true)).toBeCloseTo(-normal);
   expect(steeringFromTilt(15,0,2)).toBeGreaterThan(normal);
   expect(steeringFromTilt(60,0,2)).toBe(1);
 });
 it('filters jitter without overshoot and returns smoothly to center',()=>{
   const a=smoothSteering(0,1,.05);
   expect(a).toBeGreaterThan(0);expect(a).toBeLessThan(1);
   const b=smoothSteering(a,0,.05);
   expect(b).toBeLessThan(a);expect(b).toBeGreaterThanOrEqual(0);
   expect(smoothSteering(.4,-1,0)).toBe(.4);
 });
 it('analog sensor steering works in the original vehicle engine, keyboard wins when held',()=>{
   const start={...makeDrivingState(23),parked:false,gear:'D' as const,speed:5,belt:true,mirrorChecked:true};
   const right=advanceDrive(start,{...ZERO_CONTROLS,steer:.65},.05);
   const left=advanceDrive(start,{...ZERO_CONTROLS,steer:-.65},.05);
   expect(right.angle).toBeGreaterThan(start.angle);
   expect(left.angle).toBeLessThan(start.angle);
   const keyOverride=advanceDrive(start,{...ZERO_CONTROLS,left:true,steer:1},.05);
   expect(keyOverride.angle).toBeLessThan(start.angle);
 });
});
