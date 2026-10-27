import { describe, it, expect } from 'vitest';
import { COLS, ROWS, TERMINAL_COST, buildLabyrinth, distanceMap, isOpen, newCircuit,
  moveExplorer, stepSentinels, equals, worldForLevel, blackoutDelay, WORLDS, choosePowerKind,
  tickPower, playerStepMs, enemyStepMs, POWER_DURATION_MS, POWER_COOLDOWN_MS,
  MAX_BLACKOUTS, isBonusLevel, BONUS_TIME_MS, baseBlackoutsAt, SMALLS_PER_LIFE,
  hasTunnel, type CircuitState, type Cell } from './logic';

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
    expect(moveExplorer({...base,activated:[true,true,true],powerCollected:1},near.dir).status).toBe('cleared');
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
    expect(newCircuit(50,seeded(2)).drones).toHaveLength(baseBlackoutsAt(50));
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
        expect(state.shards.length).toBeGreaterThanOrEqual(isBonusLevel(level)?4:TERMINAL_COST*3);
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
    expect(collision.score).toBeGreaterThanOrEqual(activated.score+120);
  });
  it('never makes ordinary blackouts harmless outside absorption',()=>{
    const s=newCircuit(1,seeded(3));
    const occupied={x:s.start.x+1,y:s.start.y};
    const contact=moveExplorer({...s,player:s.start,drones:[{position:occupied,previous:occupied}],
      powerNode:null,powerEffect:null,powerRemainingMs:0},'right');
    expect(contact.lives).toBe(s.lives-1);
  });
  it('expires permanently after collecting its required single large node',()=>{
    let state=visitNode(newCircuit(1,seeded(11)),()=>0);
    for(let i=0;i<28;i++)state=tickPower(state,250);
    expect(state.powerEffect).toBeNull();
    expect(state.powerCooldownMs).toBe(POWER_COOLDOWN_MS);
    expect(state.powerNode).toBeNull();
    for(let i=0;i<14;i++)state=tickPower(state,250,()=>.5);
    expect(state.powerNode).toBeNull();
    expect(state.powerCollected).toBe(1);
    expect(state.powerEffect).toBeNull();
  });
});

describe('Small, medium and mandatory large points', () => {
  it('grants a new life for every 200 small lights collected, across world boundaries', () => {
    let s=newCircuit(1,seeded(57),0,3,199);
    const target=s.smallPoints[0],move=around(s,target)!;
    expect(move).not.toBeNull();
    s=moveExplorer({...s,player:move.at,drones:[],shards:[],powerNode:null},move.dir);
    expect(s.lives).toBe(4);
    expect(s.smallCollected).toBe(SMALLS_PER_LIFE);
    expect(s.score).toBe(1);
    const next=newCircuit(2,seeded(81),s.score,s.lives,s.smallCollected);
    expect(next.lives).toBe(4);
    expect(next.smallCollected).toBe(200);
  });
  it('medium lights are worth ten points and large lights yield zero points',()=>{
    const s=newCircuit(1,seeded(12));
    const medium=s.shards[0],m=around(s,medium)!;
    const mid=moveExplorer({...s,player:m.at,drones:[],smallPoints:[],powerNode:null},m.dir);
    expect(mid.score).toBe(10);
    const large=s.powerNode!,p=around(s,large)!;
    const big=moveExplorer({...s,player:p.at,drones:[],shards:[],smallPoints:[]},p.dir,()=>0);
    expect(big.score).toBe(0);
    expect(big.powerCollected).toBe(1);
  });
  it('requires the large node as well as three powered generators before exiting',()=>{
    const s=newCircuit(1,seeded(80)),m=around(s,s.exit)!;
    const base={...s,player:m.at,drones:[],shards:[],smallPoints:[],activated:[true,true,true]};
    expect(moveExplorer({...base,powerCollected:0},m.dir).status).toBe('playing');
    expect(moveExplorer({...base,powerCollected:1},m.dir).status).toBe('cleared');
  });
});
describe('Timed easy bonus worlds',()=>{
  it('uses the explicitly requested stages, then continues every nine worlds',()=>{
    expect([3,9,15,21,27,36,45,54,63,72,81,90].every(isBonusLevel)).toBe(true);
    expect([1,2,4,8,10,28,35,64,71,73].every(l=>!isBonusLevel(l))).toBe(true);
  });
  it('builds a very open maze with no blackouts or generator obligations',()=>{
    for(const level of [3,9,15,21,27,36,45,54,63,72]){
      const s=newCircuit(level,seeded(level*31));
      expect(s.bonusLevel).toBe(true);
      expect(s.bonusRemainingMs).toBe(BONUS_TIME_MS);
      expect(s.drones).toHaveLength(0);
      expect(s.terminals).toHaveLength(0);
      expect(s.smallPoints.length).toBe(10);
      expect(s.shards.length).toBe(4);
      expect(s.powerNode).not.toBeNull();
      expect(s.walls.flat().filter(v=>!v).length).toBeGreaterThan(200);
    }
  });
  it('clears when and only when every small, medium and large light was consumed',()=>{
    const s=newCircuit(3,seeded(13));
    const last=s.smallPoints[0],move=around(s,last)!;
    const ready={...s,smallPoints:[last],shards:[],powerNode:null,powerCollected:1,player:move.at};
    expect(moveExplorer(ready,move.dir).status).toBe('cleared');
    expect(moveExplorer({...ready,powerCollected:0},move.dir).status).toBe('playing');
  });
  it('ends the bonus attempt when time expires and pauses countdown on zero dt',()=>{
    const s=newCircuit(3,seeded(19));
    expect(tickPower(s,0)).toBe(s);
    expect(tickPower({...s,bonusRemainingMs:100},100).status).toBe('gameover');
  });
});
describe('Pipe tunnels and level-based blackouts',()=>{
  it('puts an extra black hole at levels 4, 8, 12 and each following four levels',()=>{
    expect([1,3,4,7,8,11,12,16,20].map(baseBlackoutsAt))
      .toEqual([2,2,3,3,4,4,5,6,7]);
    for(const level of [1,4,8,12,16,20,40,63]){
      const s=newCircuit(level,seeded(level*17));
      expect(s.drones.length).toBe(isBonusLevel(level)?0:Math.min(MAX_BLACKOUTS,baseBlackoutsAt(level)));
    }
  });
  it('wraps Lumen through a marked left-right pipe but blocks unmarked boundaries',()=>{
    const s=newCircuit(2,seeded(2));
    expect(hasTunnel(2)).toBe(true);
    expect(s.tunnelRows).toEqual([9]);
    const wrapped=moveExplorer({...s,player:{x:0,y:9},drones:[],smallPoints:[],shards:[],powerNode:null},'left');
    expect(wrapped.player).toEqual({x:COLS-1,y:9});
    const reverse=moveExplorer({...wrapped,player:{x:COLS-1,y:9}},'right');
    expect(reverse.player).toEqual({x:0,y:9});
    const closed=newCircuit(1,seeded(2));
    expect(closed.tunnelRows).toEqual([]);
    expect(moveExplorer({...closed,player:{x:0,y:9}},'left').player).toEqual({x:0,y:9});
  });
  it('allows a black hole to pursue Lumen through the same connected pipe',()=>{
    const s=newCircuit(2,seeded(11));
    const from={x:0,y:9},to={x:COLS-1,y:9};
    const enemy={position:from,previous:{x:1,y:9}};
    const next=stepSentinels({...s,player:to,drones:[enemy]},()=>0);
    expect(next.drones[0].position).toEqual(to);
  });
});
