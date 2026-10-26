import { describe, it, expect } from 'vitest';
import { COLS, ROWS, TERMINAL_COST, buildLabyrinth, distanceMap, isOpen, newCircuit,
  moveExplorer, stepSentinels, equals, type CircuitState, type Cell } from './logic';

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
