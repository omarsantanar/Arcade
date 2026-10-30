import {describe,it,expect} from 'vitest';
import {pedalForKey} from './input';
import {projectDriverPoint} from './cockpit';
import {makeDrivingState} from './logic';

describe('Driving controls: keyboard arrows and tactile parity',()=>{
  it('maps every primary arrow to the correct vehicle action',()=>{
    expect(pedalForKey('ArrowUp')).toBe('throttle');
    expect(pedalForKey('ArrowDown')).toBe('brake');
    expect(pedalForKey('ArrowLeft')).toBe('left');
    expect(pedalForKey('ArrowRight')).toBe('right');
  });
  it('keeps WASD available and does not treat transmission keys as pedals',()=>{
    expect(pedalForKey('w')).toBe('throttle');
    expect(pedalForKey('s')).toBe('brake');
    expect(pedalForKey('a')).toBe('left');
    expect(pedalForKey('d')).toBe('right');
    for(const key of ['g','p','r','n','q','e','c','m','Escape','Enter'])
      expect(pedalForKey(key)).toBeNull();
  });
  it('projects the road ahead into the driver windscreen, not an aerial map',()=>{
    const car=makeDrivingState(5);
    const ahead=projectDriverPoint(car,{x:car.x,y:car.y-35,z:0});
    const far=projectDriverPoint(car,{x:car.x,y:car.y-100,z:0});
    expect(ahead).not.toBeNull();expect(far).not.toBeNull();
    expect(ahead!.x).toBeCloseTo(380);
    expect(ahead!.y).toBeGreaterThan(far!.y);
    expect(far!.y).toBeGreaterThan(180);
  });
  it('shows right-hand obstacles to the right, left-hand obstacles to the left',()=>{
    const car=makeDrivingState(6);
    const right=projectDriverPoint(car,{x:car.x+6,y:car.y-75,z:0});
    const left=projectDriverPoint(car,{x:car.x-6,y:car.y-75,z:0});
    expect(right!.x).toBeGreaterThan(380);
    expect(left!.x).toBeLessThan(380);
  });
  it('clips objects behind the rear bumper and inside the camera near plane',()=>{
    const car=makeDrivingState(8);
    expect(projectDriverPoint(car,{x:car.x,y:car.y+12,z:0})).toBeNull();
    expect(projectDriverPoint(car,{x:car.x,y:car.y-1,z:0})).toBeNull();
  });
  it('updates visual road orientation as driver steers',()=>{
    const car=makeDrivingState(7);
    const target={x:car.x,y:car.y-85,z:0};
    const straight=projectDriverPoint(car,target)!;
    const turning=projectDriverPoint({...car,angle:car.angle+.20},target)!;
    expect(straight.x).not.toBeCloseTo(turning.x);
    expect(turning.y).toBeGreaterThan(180);
  });
});
