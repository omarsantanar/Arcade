import {describe,it,expect} from 'vitest';
import {advanceDrive,checkMirrors,currentLimit,driveGrade,lightColor,makeDrivingState,makeRoute,
  nextTurn,pedestrianCrossing,remainingTime,safeRoad,setIndicator,shiftGear,toggleBelt,
  ZERO_CONTROLS,SESSION_SECONDS,type DrivingState} from './logic';

describe('Driving simulator: five-minute, deterministic, coherent neighbourhood',()=>{
  it('builds several variable but connected paths with a random destination',()=>{
    const variants=new Set<string>(),destinations=new Set<string>();
    for(let seed=1;seed<=80;seed++){
      const {route,destination}=makeRoute(seed);
      expect(route.length).toBeGreaterThanOrEqual(8);
      expect(route[0]).toMatchObject({x:0,y:0,kind:'semaforo'});
      for(let index=1;index<route.length;index++){
        const a=route[index-1],b=route[index],d=Math.hypot(a.x-b.x,a.y-b.y);
        expect(d).toBe(240);
        expect(safeRoad(a.x,a.y)).toBe(true);
        expect(safeRoad(b.x,b.y)).toBe(true);
      }
      variants.add(JSON.stringify(route.map(x=>[x.x,x.y])));
      destinations.add(destination);
      expect(makeRoute(seed)).toEqual(makeRoute(seed));
    }
    expect(variants.size).toBeGreaterThanOrEqual(2);
    expect(destinations.size).toBeGreaterThanOrEqual(4);
  });
  it('starts parked with a safe transmission, no seatbelt and initial training',()=>{
    const s=makeDrivingState(11);
    expect(s.gear).toBe('P');
    expect(s.speed).toBe(0);
    expect(s.belt).toBe(false);
    expect(s.mirrorChecked).toBe(false);
    expect(s.score).toBe(100);
    expect(s.index).toBe(0);
    expect(nextTurn(s)).not.toBe('recto');
  });
  it('requires the brake to leave P, then belt and mirrors to move',()=>{
    let s=makeDrivingState(12);
    s=shiftGear(s,'D');
    expect(s.gear).toBe('P');
    s=advanceDrive(s,{...ZERO_CONTROLS,brake:true},.05);
    s=shiftGear(s,'D');
    expect(s.gear).toBe('D');
    for(let i=0;i<60;i++)s=advanceDrive(s,{...ZERO_CONTROLS,throttle:true},.05);
    expect(s.odometer).toBe(0);
    s=toggleBelt(s);s=checkMirrors(s);s=setIndicator(s,'left');
    for(let i=0;i<70;i++)s=advanceDrive(s,{...ZERO_CONTROLS,throttle:true},.05);
    expect(s.odometer).toBeGreaterThan(6);
    expect(s.parked).toBe(false);
    expect(s.gear).toBe('D');
  });
  it('permits reverse at low speed and blocks shifting while moving',()=>{
    let s=makeDrivingState(4);
    s=shiftGear(s,'R',true);
    expect(s.gear).toBe('R');
    s={...s,speed:6};
    const blocked=shiftGear(s,'P',true);
    expect(blocked.gear).toBe('R');
    expect(blocked.score).toBeLessThan(s.score);
  });
  it('models variable lights, signed school limits and pedestrian phases',()=>{
    expect(lightColor(0,0)).toBe('rojo');
    expect(lightColor(11,0)).toBe('amarillo');
    expect(lightColor(15,0)).toBe('verde');
    expect(pedestrianCrossing(0,0)).toBe(true);
    expect(pedestrianCrossing(8,0)).toBe(false);
    const s=makeDrivingState(2);
    s.index=4;s.x=s.route[4].x;s.y=s.route[4].y+60;
    expect(currentLimit(s)).toBe(20);
    s.x=15000;expect(currentLimit(s)).toBe(40);
  });
  it('awards elapsed-time-only completion at 300 seconds even without reaching destination',()=>{
    let s=makeDrivingState(7);
    s={...s,elapsed:299.99};
    s=advanceDrive(s,ZERO_CONTROLS,.1);
    expect(s.finished).toBe(true);
    expect(s.completed).toBe(false);
    expect(remainingTime(s)).toBe(0);
    expect(SESSION_SECONDS).toBe(300);
  });
  it('penalises unsafe PARE and red-light crossing, cites an article',()=>{
    let s=makeDrivingState(5);
    s={...s,gear:'D',belt:true,mirrorChecked:true,parked:false,
      x:0,y:30,angle:-Math.PI/2,speed:6,elapsed:0,lastDistance:31};
    s=advanceDrive(s,{...ZERO_CONTROLS,throttle:true},.06);
    expect(s.index).toBe(1);
    expect(s.infractions).toBeGreaterThan(0);
    expect(s.events.some(x=>x.includes('133'))).toBe(true);
    const n=s.route[1];
    s={...s,index:1,x:n.x+30,y:n.y,angle:Math.PI,speed:6,
      lastDistance:31,stopMet:false,elapsed:70};
    const before=s.infractions;
    s=advanceDrive(s,{...ZERO_CONTROLS,throttle:true},.06);
    expect(s.index).toBe(2);
    expect(s.infractions).toBeGreaterThan(before);
    expect(s.events.some(x=>x.includes('138'))).toBe(true);
  });
  it('uses simulated speed and steering, and rejects off-road manoeuvres',()=>{
    let s=makeDrivingState(3);
    s={...s,gear:'D',belt:true,mirrorChecked:true,parked:false,
      x:19,y:150,angle:-Math.PI/2,speed:6};
    const initial=s.angle;
    s=advanceDrive(s,{...ZERO_CONTROLS,right:true,throttle:true},.05);
    expect(s.angle).toBeGreaterThan(initial);
    expect(s.y).toBeLessThan(150);
    expect(safeRoad(80,80)).toBe(false);
    expect(safeRoad(0,80)).toBe(true);
    expect(driveGrade({...s,score:98})).toBe('EXCELENTE');
    expect(driveGrade({...s,score:30})).toBe('NECESITA REFUERZO');
  });
});
