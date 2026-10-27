/** Original circuit-labyrinth rules. The maze and enemies do not depend on Phaser/DOM. */
export const COLS = 15;
export const ROWS = 19;
export const TERMINAL_COST = 2;
export type RandomSource = () => number;
export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';
export type Cell = { x: number; y: number };
export type Drone = { position: Cell; previous: Cell };
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
  return {walls,start,exit,player:start,terminals,activated:[false,false,false],shards,drones,
    energy:0,score:previousScore,lives:previousLives,level,world,steps:0,invulnerable:0,status:'playing'};
}
function strike(state:CircuitState):CircuitState {
  if(state.invulnerable>0)return state;
  const lives=state.lives-1;
  return {...state,lives,status:lives<=0?'gameover':'playing',
    player:lives<=0?state.player:state.start,invulnerable:lives<=0?0:5};
}
/** A player move can collect a shard, power a terminal or open the exit. */
export function moveExplorer(state:CircuitState,direction:Direction):CircuitState {
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
  const cleared=equals(next,state.exit)&&activated.every(Boolean);
  let result={...state,player:next,shards,energy,score,activated,
    steps:state.steps+1,invulnerable:Math.max(0,state.invulnerable-1),
    status:cleared?'cleared' as CircuitStatus:'playing' as CircuitStatus};
  if(!cleared && state.drones.some(d=>equals(d.position,next)))result=strike(result);
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
  if(drones.some(d=>equals(d.position,state.player)))next=strike(next);
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
