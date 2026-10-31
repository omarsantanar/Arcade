import {describe,it,expect} from 'vitest';
import {screenRoll,tiltToSteer,smoothSteer,isSensorRecent,
  TILT_DEFAULTS,TILT_STALE_MS,angularDifference} from './tilt';
import {advanceDrive,makeDrivingState,ZERO_CONTROLS} from './logic';

describe('Steering with phone inclination',()=>{
  it('selects appropriate orientation axis in portrait and landscape',()=>{
    const sample={beta:16,gamma:12};
    expect(screenRoll(sample,0)).toBe(12);
    expect(screenRoll(sample,90)).toBe(-16);
    expect(screenRoll(sample,180)).toBe(-12);
    expect(screenRoll(sample,270)).toBe(16);
    expect(screenRoll(sample,-90)).toBe(16);
    expect(screenRoll({beta:null,gamma:4},90)).toBeNull();
    expect(screenRoll({beta:7,gamma:null},0)).toBeNull();
    expect(screenRoll({beta:Infinity,gamma:0},90)).toBeNull();
  });
  it('calibrates neutral to whatever pose user considers straight',()=>{
    expect(tiltToSteer(22,22,TILT_DEFAULTS)).toBe(0);
    expect(tiltToSteer(23,22,TILT_DEFAULTS)).toBe(0);
    expect(tiltToSteer(30,22,TILT_DEFAULTS)).toBeGreaterThan(0);
    expect(tiltToSteer(14,22,TILT_DEFAULTS)).toBeLessThan(0);
  });
  it('clamps at ±100% and can invert direction for sensor differences',()=>{
    expect(tiltToSteer(90,0,TILT_DEFAULTS)).toBe(1);
    expect(tiltToSteer(-90,0,TILT_DEFAULTS)).toBe(-1);
    expect(tiltToSteer(30,0,{sensitivity:25,inverted:true})).toBe(-1);
    expect(tiltToSteer(-30,0,{sensitivity:25,inverted:true})).toBe(1);
  });
  it('handles beta wraparound without a sudden full-circle steering command',()=>{
    expect(angularDifference(-179,179)).toBe(2);
    expect(angularDifference(179,-179)).toBe(-2);
    expect(tiltToSteer(-175,179,TILT_DEFAULTS)).toBeGreaterThan(0);
    expect(tiltToSteer(-175,179,TILT_DEFAULTS)).toBeLessThan(.5);
  });
  it('smoothes sudden movements and stops cleanly on loss of data',()=>{
    const first=smoothSteer(0,1,.016);
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(.1);
    const braking=smoothSteer(first,0,.1);
    expect(braking).toBeLessThan(first);
    expect(smoothSteer(0,1,0)).toBe(0);
    expect(smoothSteer(.5,-1,.1)).toBeGreaterThanOrEqual(.2);
  });
  it('drops outdated samples so manual steering remains safe',()=>{
    expect(isSensorRecent(1000,1000)).toBe(true);
    expect(isSensorRecent(1000,1000+TILT_STALE_MS)).toBe(true);
    expect(isSensorRecent(1000,1000+TILT_STALE_MS+1)).toBe(false);
    expect(isSensorRecent(0,1000)).toBe(false);
  });
  it('uses analog steering while maintaining arrow-key precedence',()=>{
    const prepared={...makeDrivingState(4),gear:'D' as const,belt:true,mirrorChecked:true,
      parked:false,angle:-Math.PI/2,speed:5,x:16,y:100};
    const analog=advanceDrive(prepared,{...ZERO_CONTROLS,steer:.6},.05);
    expect(analog.angle).toBeGreaterThan(prepared.angle);
    const left=advanceDrive(prepared,{...ZERO_CONTROLS,steer:.6,left:true},.05);
    expect(left.angle).toBeLessThan(prepared.angle);
    const stopped=advanceDrive(prepared,{...ZERO_CONTROLS,steer:0},.05);
    expect(stopped.angle).toBe(prepared.angle);
    expect(prepared.angle).toBe(-Math.PI/2);
  });
});
