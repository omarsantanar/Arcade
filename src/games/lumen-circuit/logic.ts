/** Original circuit-labyrinth rules. The maze and enemies do not depend on Phaser/DOM. */
export const COLS = 15;
export const ROWS = 19;
export const TERMINAL_COST = 2;
export type RandomSource = () => number;
export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';
export type Cell = { x: number; y: number };
export type Drone = { position: Cell; previous: Cell; temporary?: boolean };
export type PowerKind = 'turbo' | 'spawn' | 'haste' | 'absorb';
export const POWER_DURATION_MS = 7000;
export const POWER_COOLDOWN_MS = 3500;
export const MAX_BLACKOUTS = 6;
export const POWER_LABELS: Record<PowerKind, string> = {
  turbo: 'TURBO ELÉCTRICO',
  spawn: 'INVASIÓN DE APAGONES',
  haste: 'APAGONES ACELERADOS',
  absorb: 'CAMPO DE ABSORCIÓN',
};
export const POWER_DESCRIPTIONS: Record<PowerKind,string> = {
  turbo: 'Lumen se mueve más rápido durante 7 segundos.',
  spawn: 'Surgen apagones adicionales durante 7 segundos.',
  haste: 'Los apagones se desplazan más rápido durante 7 segundos.',
  absorb: 'Lumen neutraliza agujeros negros al tocarlos durante 7 segundos.',
};
/** Different geometric animation is used for each outcome, not a copy of another game's power-up. */
export function choosePowerKind(random: RandomSource = Math.random):PowerKind {
  return (['turbo','spawn','haste','absorb'] as const)[Math.min(3,Math.floor(Math.max(0,Math.min(0.999999,random()))*4))];
}

export type CircuitStatus = 'playing' | 'cleared' | 'gameover';
export type WorldId = 'hydro' | 'solar' | 'wind' | 'thermal';
export interface PowerWorld {
  id: WorldId;
  name: string;
  region: string;
  tagline: string;
  crossLinks: number;
  blackoutInterval: number;
  minBlackoutInterval: number;
  energyFragments: number;
}
/** Fictional generator settings inspired by Dominican landscapes, not real installations. */
export const WORLDS: readonly PowerWorld[] = [
  { id:'hydro', name:'Yaque Hídrica', region:'Cibao', tagline:'ENCIENDE LA ENERGÍA DEL CIBAO',
    crossLinks:0.10, blackoutInterval:455, minBlackoutInterval:225, energyFragments:20 },
  { id:'solar', name:'Sol Caribe', region:'Región Sur', tagline:'ATRAVIESA LOS CAMPOS SOLARES',
    crossLinks:0.19, blackoutInterval:395, minBlackoutInterval:200, energyFragments:20 },
  { id:'wind', name:'Brisa del Este', region:'Región Este', tagline:'REACTIVA EL CORREDOR EÓLICO',
    crossLinks:0.13, blackoutInterval:355, minBlackoutInterval:180, energyFragments:18 },
  { id:'thermal', name:'Ozama Térmica', region:'Gran Santo Domingo', tagline:'SALVA LA RED MÁS EXIGENTE',
    crossLinks:0.16, blackoutInterval:325, minBlackoutInterval:165, energyFragments:18 },
];
export const worldForLevel = (level:number):PowerWorld => WORLDS[(Math.max(1,level)-1)%WORLDS.length];
export const blackoutDelay = (level:number,world:PowerWorld=worldForLevel(level)):number =>
  Math.max(world.minBlackoutInterval,world.blackoutInterval-Math.max(0,level-1)*15);
export interface CircuitState {
  walls: boolean[][];
  start: Cell;
  exit: Cell;
  player: Cell;
  terminals: Cell[];
  activated: boolean[];
  shards: Cell[];
  drones: Drone[];
  energy: number;
  score: number;
  lives: number;
  level: number;
  world: PowerWorld;
  steps: number;
  invulnerable: number;
  powerNode: Cell | null;
  powerEffect: PowerKind | null;
  powerRemainingMs: number;
  powerCooldownMs: number;
  status: CircuitStatus;
}
export const vector: Record<Exclude<Direction, 'none'>, Cell> = {
  up: {x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0}
};
const index = (p: Cell) => p.y * COLS + p.x;
export const equals = (a: Cell,b:Cell) => a.x === b.x && a.y === b.y;
export function isOpen(walls: readonly (readonly boolean[])[], p:Cell) {
  return p.y >= 0 && p.y < ROWS && p.x >= 0 && p.x < COLS && !walls[p.y][p.x];
}
export const adjacent = (walls: boolean[][],cell:Cell) => Object.values(vector)
  .map(v=>({x:cell.x+v.x,y:cell.y+v.y})).filter(p=>isOpen(walls,p));
const randomIndex = (size:number,random:RandomSource) => Math.min(size-1,Math.floor(Math.max(0,random())*size));

/** Depth-first randomized passages with extra links. Every open cell is connected. */
export function buildLabyrinth(random: RandomSource = Math.random, crossLinks = 0.14): boolean[][] {
  const walls = Array.from({length:ROWS},()=>Array.from({length:COLS},()=>true));
  const start = {x:1,y:1};
  const stack:Cell[]=[start];
  walls[start.y][start.x]=false;
  while(stack.length) {
    const current=stack[stack.length-1];
    const candidates=[{x:2,y:0},{x:-2,y:0},{x:0,y:2},{x:0,y:-2}]
      .map(d=>({x:current.x+d.x,y:current.y+d.y}))
      .filter(p=>p.x>0 && p.x<COLS-1 && p.y>0 && p.y<ROWS-1 && walls[p.y][p.x]);
    if(!candidates.length){stack.pop();continue;}
    const next=candidates[randomIndex(candidates.length,random)];
    walls[(current.y+next.y)/2][(current.x+next.x)/2]=false;
    walls[next.y][next.x]=false;
    stack.push(next);
  }
  // Optional cross-connections keep the levels from feeling like one long corridor.
  for(let y=2;y<ROWS-2;y++){
    for(let x=2;x<COLS-2;x++){
      if(!walls[y][x] || random()>=crossLinks)continue;
      const horizontal=!walls[y][x-1] && !walls[y][x+1];
      const vertical=!walls[y-1][x] && !walls[y+1][x];
      if(horizontal || vertical) walls[y][x]=false;
    }
  }
  return walls;
}
export function distanceMap(walls:boolean[][],start:Cell):Map<number,number> {
  const distances=new Map<number,number>([[index(start),0]]);
  const queue:Cell[]=[start];
  for(let i=0;i<queue.length;i++){
    const cell=queue[i],d=distances.get(index(cell))!;
    for(const next of adjacent(walls,cell)){
      if(distances.has(index(next)))continue;
      distances.set(index(next),d+1);
      queue.push(next);
    }
  }
  return distances;
}
const pick = (pool:Cell[],random:RandomSource):Cell => pool.splice(randomIndex(pool.length,random),1)[0];
const away = (a:Cell,b:Cell) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

/** Build a solvable field: 3 connected terminals, enough shards, and a reachable exit. */
export function newCircuit(level=1,random:RandomSource=Math.random,previousScore=0,previousLives=3):CircuitState {
  const world=worldForLevel(level);
  const walls=buildLabyrinth(random,world.crossLinks);
  const start={x:1,y:1};
  const distances=distanceMap(walls,start);
  const pool=[...distances.keys()].filter(i=>i!==index(start))
    .map(i=>({x:i%COLS,y:Math.floor(i/COLS)}));
  const far=pool.filter(p=>(distances.get(index(p))??0)>=12)
    .sort((a,b)=>(distances.get(index(b))??0)-(distances.get(index(a))??0));
  const exit=far.length?far[0]:pool[pool.length-1];
  const reserved=new Set<number>([index(start),index(exit)]);
  const chooseSeparated=(minimumDistance:number):Cell => {
    let candidates=pool.filter(p=>!reserved.has(index(p)) && (distances.get(index(p))??0)>minimumDistance
      && [...reserved].every(i=>away(p,{x:i%COLS,y:Math.floor(i/COLS)})>=3));
    if(!candidates.length) candidates=pool.filter(p=>!reserved.has(index(p)));
    const p=candidates[randomIndex(candidates.length,random)];
    reserved.add(index(p));
    return p;
  };
  const terminals=Array.from({length:3},()=>chooseSeparated(7));
  const drones=Array.from({length:Math.min(4,2+Math.floor((level-1)/3))},()=>{
    const position=chooseSeparated(12);
    return {position,previous:position};
  });
  const shardPool=pool.filter(p=>!reserved.has(index(p)));
  const shardCount=Math.min(world.energyFragments,shardPool.length);
  const shards=Array.from({length:shardCount},()=>pick(shardPool,random));
  const powerPool=shardPool.filter(cell=>away(cell,start)>=4);
  const powerNode=powerPool.length?powerPool[randomIndex(powerPool.length,random)]:null;
  return {walls,start,exit,player:start,terminals,activated:[false,false,false],shards,drones,
    energy:0,score:previousScore,lives:previousLives,level,world,steps:0,invulnerable:0,
    powerNode,powerEffect:null,powerRemainingMs:0,powerCooldownMs:0,status:'playing'};
}
function strike(state:CircuitState):CircuitState {
  if(state.invulnerable>0)return state;
  const lives=state.lives-1;
  return {...state,lives,status:lives<=0?'gameover':'playing',
    player:lives<=0?state.player:state.start,invulnerable:lives<=0?0:5};
}

function findPowerSpot(state:CircuitState, random:RandomSource):Cell|null {
  const blocked=new Set<number>([
    index(state.start),index(state.exit),index(state.player),
    ...state.terminals.map(index),...state.shards.map(index),...state.drones.map(d=>index(d.position)),
  ]);
  const possible=[...distanceMap(state.walls,state.player).keys()]
    .filter(i=>!blocked.has(i))
    .map(i=>({x:i%COLS,y:Math.floor(i/COLS)}))
    .filter(p=>away(p,state.player)>=4);
  return possible.length?possible[randomIndex(possible.length,random)]:null;
}

/** Effect countdown advances only while Phaser gameplay updates, never during pause. */
export function tickPower(state:CircuitState,dtMs:number,random:RandomSource=Math.random):CircuitState {
  if(state.status!=='playing'||dtMs<=0)return state;
  const dt=Math.max(0,Math.min(250,dtMs));
  if(state.powerEffect!==null) {
    const nextRemaining=Math.max(0,state.powerRemainingMs-dt);
    if(nextRemaining>0)return {...state,powerRemainingMs:nextRemaining};
    return {...state,powerEffect:null,powerRemainingMs:0,powerCooldownMs:POWER_COOLDOWN_MS,
      drones:state.drones.filter(d=>!d.temporary)};
  }
  if(state.powerNode!==null)return state;
  const time=Math.max(0,state.powerCooldownMs-dt);
  if(time>0)return {...state,powerCooldownMs:time};
  return {...state,powerCooldownMs:0,powerNode:findPowerSpot(state,random)};
}

function extraBlackouts(state:CircuitState,random:RandomSource):Drone[] {
  const occupied=new Set<number>([index(state.player),index(state.start),index(state.exit),
    ...state.drones.map(d=>index(d.position)),...state.terminals.map(index)]);
  const pool=[...distanceMap(state.walls,state.player).keys()]
    .filter(i=>!occupied.has(i))
    .map(i=>({x:i%COLS,y:Math.floor(i/COLS)}))
    .filter(p=>away(p,state.player)>=5);
  const added:Drone[]=[];
  const count=Math.min(Math.max(0,MAX_BLACKOUTS-state.drones.length),state.level>=5?2:1,pool.length);
  for(let i=0;i<count;i++){
    const pos=pick(pool,random);
    added.push({position:pos,previous:pos,temporary:true});
  }
  return added;
}

/** Collisions with holes are neutralized only while Lumen's absorption field is active. */
function resolveBlackoutContact(state:CircuitState):CircuitState {
  const overlapping=state.drones.filter(d=>equals(d.position,state.player));
  if(!overlapping.length)return state;
  if(state.powerEffect==='absorb' && state.powerRemainingMs>0) {
    const gained=overlapping.length*120;
    return {...state,score:state.score+gained,
      drones:state.drones.filter(d=>!equals(d.position,state.player))};
  }
  return strike(state);
}

export function playerStepMs(state:CircuitState):number {
  return state.powerEffect==='turbo'&&state.powerRemainingMs>0?73:125;
}
export function enemyStepMs(state:CircuitState):number {
  const base=blackoutDelay(state.level,state.world);
  return state.powerEffect==='haste'&&state.powerRemainingMs>0?Math.max(110,Math.round(base*0.58)):base;
}

/** A player move can collect a shard, power a terminal or open the exit. */
export function moveExplorer(state:CircuitState,direction:Direction,random:RandomSource=Math.random):CircuitState {
  if(state.status!=='playing'||direction==='none')return state;
  const v=vector[direction],next={x:state.player.x+v.x,y:state.player.y+v.y};
  if(!isOpen(state.walls,next))return state;
  const shards=state.shards.filter(p=>!equals(p,next));
  const gained=shards.length===state.shards.length?0:1;
  let energy=state.energy+gained;
  let score=state.score+gained*15;
  const activated=[...state.activated];
  for(let i=0;i<state.terminals.length;i++){
    if(!activated[i]&&equals(next,state.terminals[i])&&energy>=TERMINAL_COST){
      activated[i]=true;energy-=TERMINAL_COST;score+=200;
    }
  }
  let powerNode=state.powerNode;
  let powerEffect=state.powerEffect;
  let powerRemainingMs=state.powerRemainingMs;
  let drones=state.drones;
  if(powerNode!==null && equals(next,powerNode) && powerEffect===null){
    powerEffect=choosePowerKind(random);
    powerRemainingMs=POWER_DURATION_MS;
    powerNode=null;
    score+=55;
    if(powerEffect==='spawn')drones=[...drones,...extraBlackouts(state,random)];
  }
  const cleared=equals(next,state.exit)&&activated.every(Boolean);
  let result:CircuitState={...state,player:next,shards,energy,score,activated,
    powerNode,powerEffect,powerRemainingMs,drones,steps:state.steps+1,invulnerable:Math.max(0,state.invulnerable-1),
    status:cleared?'cleared' as CircuitStatus:'playing' as CircuitStatus};
  if(!cleared)result=resolveBlackoutContact(result);
  return result;
}
const manhattan=away;
/** Independent geometric sentinels, with brief pursuit and longer random patrols. */
export function stepSentinels(state:CircuitState,random:RandomSource=Math.random):CircuitState {
  if(state.status!=='playing')return state;
  const drones=state.drones.map(drone=>{
    const candidates=adjacent(state.walls,drone.position);
    if(!candidates.length)return drone;
    const near=manhattan(drone.position,state.player)<=5;
    let options=candidates.filter(p=>!equals(p,drone.previous));
    if(!options.length)options=candidates;
    if(near){
      const best=Math.min(...options.map(p=>manhattan(p,state.player)));
      if(random()<0.8)options=options.filter(p=>manhattan(p,state.player)===best);
    }
    const next=options[randomIndex(options.length,random)];
    return {position:next,previous:drone.position};
  });
  let next={...state,drones,invulnerable:Math.max(0,state.invulnerable-1)};
  next=resolveBlackoutContact(next);
  return next;
}
export const LUMEN_BEST_KEY='arcade:lumen-circuit:best';
export function readLumenBest():number {
  try {const n=Number(window.localStorage.getItem(LUMEN_BEST_KEY));return Number.isFinite(n)&&n>0?n:0;}
  catch{return 0;}
}
export function saveLumenBest(score:number):void {
  try {if(score>readLumenBest())window.localStorage.setItem(LUMEN_BEST_KEY,String(score));}
  catch{/* Works without local storage. */}
}
