import { describe, it, expect } from 'vitest';
import { COLS, ROWS, TERMINAL_COST, buildLabyrinth, distanceMap, isOpen, newCircuit,
  moveExplorer, stepSentinels, equals, worldForLevel, blackoutDelay, WORLDS, choosePowerKind,
  tickPower, playerStepMs, enemyStepMs, POWER_DURATION_MS, POWER_COOLDOWN_MS,
  MAX_BLACKOUTS, type CircuitState, type Cell } from './logic';

const seeded=(initial:number)=>{
  let seed=initial>>>0;
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
};
const around=(state:CircuitState,p:Cell):{at:Cell;dir:'up'|'down'|'left'|'right'}|null=>{
  const opts=[
    {at:{x:p.x,y:p.y+1},dir:'up' as const},
    {at:{x:p.x,y:p.y-1},dir:'down' as const},
    {at:{x:p.x+1,y:p.y},dir:'left' as const},
    {at:{x:p.x-1,y:p.y},dir:'right' as const},
  ];
  return opts.find(o=>isOpen(state.walls,o.at))??null;
};
describe('Lumen Circuit original labyrinth',()=>{
  it('creates connected randomized passages with three reachable terminals and exit',()=>{
    for(let seed=1;seed<=70;seed++){
      const s=newCircuit(1,seeded(seed));
      expect(s.walls).toHaveLength(ROWS);
      expect(s.walls.every(row=>row.length===COLS)).toBe(true);
      const reachable=distanceMap(s.walls,s.start);
      const floors=s.walls.flat().filter(v=>!v).length;
      expect(reachable.size).toBe(floors);
      expect(s.terminals).toHaveLength(3);
      expect(s.activated).toEqual([false,false,false]);
      const goals=[...s.terminals,...s.shards,s.exit,...s.drones.map(d=>d.position)];
      expect(goals.every(p=>isOpen(s.walls,p))).toBe(true);
      expect(goals.every(p=>reachable.has(p.y*COLS+p.x))).toBe(true);
      expect(new Set(goals.map(p=>p.y*COLS+p.x)).size).toBe(goals.length);
      expect(s.shards.length).toBeGreaterThanOrEqual(TERMINAL_COST*3);
    }
  });
  it('produces distinct maze layouts for distinct deterministic seeds',()=>{
    const samples=Array.from({length:10},(_,i)=>
      JSON.stringify(buildLabyrinth(seeded(100+i))));
    expect(new Set(samples).size).toBeGreaterThanOrEqual(9);
  });
  it('never moves through a wall or beyond the board',()=>{
    const s=newCircuit(1,seeded(4));
    const next=moveExplorer(s,'up');
    expect(equals(next.player,s.player)).toBe(true);
    expect(next.score).toBe(s.score);
  });
  it('collects energy and activates a visited terminal only when charged',()=>{
    let s=newCircuit(1,seeded(12));
    const terminal=s.terminals[0];
    const route=around(s,terminal);
    expect(route).not.toBeNull();
    const base={...s,player:route!.at,drones:[],shards:[],energy:1};
    s=moveExplorer(base,route!.dir);
    expect(s.activated[0]).toBe(false);
    const charged=moveExplorer({...base,energy:2},route!.dir);
    expect(charged.activated[0]).toBe(true);
    expect(charged.energy).toBe(0);
    expect(charged.score).toBe(200);
  });
  it('locks the exit until all 3 nodes are enabled',()=>{
    const s=newCircuit(1,seeded(20)),near=around(s,s.exit)!;
    const base={...s,player:near.at,drones:[],shards:[],energy:0};
    expect(moveExplorer(base,near.dir).status).toBe('playing');
    expect(moveExplorer({...base,activated:[true,true,true]},near.dir).status).toBe('cleared');
  });
  it('gives the explorer three lives and guards against instant repeated hits',()=>{
    const s=newCircuit(1,seeded(6));
    const next={x:s.start.x+1,y:s.start.y};
    expect(isOpen(s.walls,next)).toBe(true);
    const drone={position:next,previous:next};
    const hit=moveExplorer({...s,drones:[drone]},'right');
    expect(hit.lives).toBe(2);
    expect(hit.invulnerable).toBeGreaterThan(0);
    const guard=moveExplorer({...hit,player:s.start},'right');
    expect(guard.lives).toBe(2);
    const fatal=moveExplorer({...s,lives:1,drones:[drone]},'right');
    expect(fatal.status).toBe('gameover');
  });
  it('moves sentinels only to adjacent accessible tiles',()=>{
    for(let seed=1;seed<=25;seed++){
      let s=newCircuit(5,seeded(seed));
      const rand=seeded(seed*5);
      for(let turn=0;turn<40;turn++){
        const prev=s;
        s=stepSentinels(s,rand);
        for(let i=0;i<s.drones.length;i++){
          const before=prev.drones[i].position,after=s.drones[i].position;
          expect(isOpen(s.walls,after)).toBe(true);
          expect(Math.abs(after.x-before.x)+Math.abs(after.y-before.y)).toBeLessThanOrEqual(1);
        }
        if(s.status==='gameover')break;
      }
    }
  });
  it('increases drone population with later levels while keeping limits',()=>{
    expect(newCircuit(1,seeded(2)).drones).toHaveLength(2);
    expect(newCircuit(4,seeded(2)).drones).toHaveLength(3);
    expect(newCircuit(50,seeded(2)).drones).toHaveLength(4);
  });
});

describe('Dominican power worlds', () => {
  it('uses four fictional generator worlds in order, then cycles with new layouts', () => {
    expect(WORLDS.map(w => w.id)).toEqual(['hydro', 'solar', 'wind', 'thermal']);
    expect([1, 2, 3, 4, 5].map(level => worldForLevel(level).id))
      .toEqual(['hydro', 'solar', 'wind', 'thermal', 'hydro']);
    expect(new Set(WORLDS.map(w => w.name)).size).toBe(4);
  });
  it('changes obstacle rhythm and maze linkage for distinct worlds', () => {
    expect(blackoutDelay(4)).toBeLessThan(blackoutDelay(1));
    expect(blackoutDelay(100)).toBeGreaterThanOrEqual(worldForLevel(100).minBlackoutInterval);
    expect(new Set(WORLDS.map(w => w.crossLinks)).size).toBeGreaterThan(1);
  });
  it('keeps every generator and energy shard reachable in every world', () => {
    for (let level=1; level<=8; level++) {
      for (let seed=1; seed<=24; seed++) {
        const state=newCircuit(level,seeded(seed*13+level));
        const reachable=distanceMap(state.walls,state.start);
        expect(state.world.id).toBe(worldForLevel(level).id);
        expect([...state.terminals,state.exit,...state.shards]
          .every(p=>reachable.has(p.y*COLS+p.x))).toBe(true);
        expect(state.shards.length).toBeGreaterThanOrEqual(TERMINAL_COST*3);
      }
    }
  });
});

describe('Large random power node', () => {
  function visitNode(state:CircuitState,random:()=>number):CircuitState {
    expect(state.powerNode).not.toBeNull();
    const route=around(state,state.powerNode!);
    expect(route).not.toBeNull();
    return moveExplorer({...state,player:route!.at,drones:[]},route!.dir,random);
  }
  it('is reachable and never overlaps a shard, generator, enemy, start or portal',()=>{
    for(let level=1;level<=8;level++){
      for(let seed=1;seed<=30;seed++){
        const state=newCircuit(level,seeded(seed*93+level));
        expect(state.powerNode).not.toBeNull();
        const node=state.powerNode!;
        expect(distanceMap(state.walls,state.start).has(node.y*COLS+node.x)).toBe(true);
        const occupied=[state.start,state.exit,...state.shards,...state.terminals,...state.drones.map(d=>d.position)];
        expect(occupied.some(p=>equals(node,p))).toBe(false);
      }
    }
  });
  it('selects exactly one of four outcomes, including both benefits and risks',()=>{
    expect([0,.26,.51,.76].map(v=>choosePowerKind(()=>v)))
      .toEqual(['turbo','spawn','haste','absorb']);
  });
  it('grants acceleration, removes the node and never stacks effects',()=>{
    const first=visitNode(newCircuit(1,seeded(7)),()=>0);
    expect(first.powerEffect).toBe('turbo');
    expect(first.powerNode).toBeNull();
    expect(first.powerRemainingMs).toBe(POWER_DURATION_MS);
    expect(playerStepMs(first)).toBeLessThan(playerStepMs({...first,powerEffect:null}));
    const stillActive=tickPower(first,125,()=>0.77);
    expect(stillActive.powerEffect).toBe('turbo');
    expect(stillActive.powerNode).toBeNull();
  });
  it('can add only temporary blackouts without spawning on the player',()=>{
    const initial=newCircuit(5,seeded(8));
    const s=visitNode(initial,()=>.3);
    expect(s.powerEffect).toBe('spawn');
    expect(s.drones.length).toBeGreaterThan(0);
    expect(s.drones.length).toBeLessThanOrEqual(MAX_BLACKOUTS);
    expect(s.drones.every(d=>!equals(d.position,s.player))).toBe(true);
    expect(s.drones.some(d=>d.temporary)).toBe(true);
    let end=s;
    for(let i=0;i<28;i++)end=tickPower(end,250);
    expect(end.powerEffect).toBeNull();
    expect(end.drones.every(d=>!d.temporary)).toBe(true);
  });
  it('can speed up the blackouts, with the effect timed and bounded',()=>{
    const initial=newCircuit(1,seeded(17));
    const boosted=visitNode(initial,()=>.52);
    expect(boosted.powerEffect).toBe('haste');
    expect(enemyStepMs(boosted)).toBeLessThan(enemyStepMs(initial));
    expect(enemyStepMs(boosted)).toBeGreaterThanOrEqual(110);
  });
  it('enables contact absorption, awarding points without damaging Lumen',()=>{
    const s=newCircuit(1,seeded(4));
    const activated=visitNode(s,()=>.88);
    expect(activated.powerEffect).toBe('absorb');
    const occupied={x:s.start.x+1,y:s.start.y};
    const collision=moveExplorer({
      ...activated,player:s.start,drones:[{position:occupied,previous:occupied}],
      shards:[],powerNode:null
    },'right',()=>.1);
    expect(collision.lives).toBe(activated.lives);
    expect(collision.drones).toHaveLength(0);
    expect(collision.score).toBe(activated.score+120);
  });
  it('never makes ordinary blackouts harmless outside absorption',()=>{
    const s=newCircuit(1,seeded(3));
    const occupied={x:s.start.x+1,y:s.start.y};
    const contact=moveExplorer({...s,player:s.start,drones:[{position:occupied,previous:occupied}],
      powerNode:null,powerEffect:null,powerRemainingMs:0},'right');
    expect(contact.lives).toBe(s.lives-1);
  });
  it('expires before respawning the next single special node',()=>{
    let state=visitNode(newCircuit(1,seeded(11)),()=>0);
    for(let i=0;i<28;i++)state=tickPower(state,250);
    expect(state.powerEffect).toBeNull();
    expect(state.powerCooldownMs).toBe(POWER_COOLDOWN_MS);
    expect(state.powerNode).toBeNull();
    for(let i=0;i<14;i++)state=tickPower(state,250,()=>.5);
    expect(state.powerNode).not.toBeNull();
    expect(state.powerEffect).toBeNull();
  });
});
