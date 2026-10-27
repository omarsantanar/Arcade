import { describe,expect,it } from 'vitest';
import {
  generateSudoku,fullGrid,isSolved,isValidPlacement,conflictCells,copyGrid,countSolutions,
  qualityFor,targetTimeMs,targetClues,boardSize,safeStoredLevel,validSavedGame,
  INTRO_TIPS,blankCount,shuffle,
} from './logic';
function seeded(initial:number){
  let state=initial>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
describe('Sudoku original rules and learning curve',()=>{
  it('teaches one rule per 4×4 starter level and switches immediately to 9×9',()=>{
    expect(INTRO_TIPS).toHaveLength(3);
    expect(INTRO_TIPS.map(s=>s.split(':')[0])).toEqual([
      'PASO 1 · FILAS','PASO 2 · COLUMNAS','PASO 3 · BLOQUES'
    ]);
    expect([1,2,3,4,5,6].map(boardSize)).toEqual([4,4,4,9,9,9]);
    expect([1,2,3,4,5,6,7,8,9,20].map(targetClues))
      .toEqual([12,10,8,40,35,30,27,25,23,22]);
  });
  it('creates valid randomized complete grids in both sizes',()=>{
    for(const size of [4,9] as const){
      const unique=new Set<string>();
      for(let seed=1;seed<=10;seed++){
        const grid=fullGrid(size,seeded(seed));
        expect(isSolved(grid)).toBe(true);
        unique.add(JSON.stringify(grid));
      }
      expect(unique.size).toBeGreaterThanOrEqual(9);
    }
  });
  it('creates uniquely solvable puzzles at every tutorial step',()=>{
    for(let level=1;level<=3;level++)for(let seed=1;seed<=8;seed++){
      const puzzle=generateSudoku(level,seeded(100*level+seed));
      expect(puzzle.size).toBe(4);
      expect(puzzle.intro).toBe(INTRO_TIPS[level-1]);
      expect(blankCount(puzzle.puzzle)).toBeGreaterThan(0);
      expect(countSolutions(puzzle.puzzle)).toBe(1);
      expect(isSolved(puzzle.solution)).toBe(true);
      expect(puzzle.puzzle.flat().every((n,i)=>n===0||n===puzzle.solution.flat()[i])).toBe(true);
    }
  });
  it('generates random 9×9 puzzles with exactly one solution, never copied boards',()=>{
    const layouts=new Set<string>();
    for(const level of [4,5,6,7,8,10]){
      for(let seed=1;seed<=3;seed++){
        const puzzle=generateSudoku(level,seeded(level*101+seed));
        expect(puzzle.size).toBe(9);
        expect(puzzle.intro).toBeNull();
        expect(isSolved(puzzle.solution)).toBe(true);
        expect(countSolutions(puzzle.puzzle)).toBe(1);
        expect(puzzle.clues).toBeGreaterThanOrEqual(targetClues(level));
        expect(puzzle.clues).toBeLessThan(62);
        layouts.add(JSON.stringify(puzzle.puzzle));
      }
    }
    expect(layouts.size).toBe(18);
  },45000);
  it('allows no duplicate row, column or block number',()=>{
    const puzzle=generateSudoku(2,seeded(11));
    const valid=copyGrid(puzzle.solution);
    expect(isValidPlacement(valid,0,0,valid[0][0])).toBe(true);
    const duplicated=copyGrid(valid);
    duplicated[0][0]=duplicated[0][1];
    expect(isSolved(duplicated)).toBe(false);
    expect(conflictCells(duplicated).size).toBeGreaterThan(0);
  });
  it('does not misclassify an invalid or unfinished grid as solved',()=>{
    const puzzle=generateSudoku(4,seeded(49));
    expect(isSolved(puzzle.puzzle)).toBe(false);
    expect(isSolved(Array.from({length:9},()=>Array(9).fill(1)))).toBe(false);
  });
});
describe('Elapsed-time-only quality and local progress',()=>{
  it('rates the same level higher when solved faster, independently of mistakes',()=>{
    const fast=qualityFor(8,2*60000);
    const slow=qualityFor(8,22*60000);
    expect(fast.stars).toBeGreaterThan(slow.stars);
    expect(fast.points).toBeGreaterThan(slow.points);
    expect(fast.label).toBe('RELÁMPAGO');
    expect(targetTimeMs(8)).toBeGreaterThan(targetTimeMs(4));
  });
  it('ensures all qualities remain finite including near-zero time',()=>{
    for(const t of [0,1000,90000,50000000]){
      const outcome=qualityFor(4,t);
      expect(outcome.stars).toBeGreaterThanOrEqual(1);
      expect(outcome.stars).toBeLessThanOrEqual(5);
      expect(Number.isFinite(outcome.points)).toBe(true);
    }
  });
  it('rejects invalid or forged local saves and accepts well-formed progress',()=>{
    const puzzle=generateSudoku(1,seeded(10));
    const good={level:1,puzzle:puzzle.puzzle,solution:puzzle.solution,
      entered:copyGrid(puzzle.puzzle),elapsedMs:14200};
    expect(validSavedGame(good)).toBe(true);
    expect(validSavedGame({...good,entered:[[9]]})).toBe(false);
    expect(validSavedGame({...good,elapsedMs:-2})).toBe(false);
    expect(safeStoredLevel('10')).toBe(10);
    expect(safeStoredLevel('0')).toBe(1);
    expect(safeStoredLevel('Infinity')).toBe(1);
  });
  it('does not mutate grids during uniqueness counting',()=>{
    const puzzle=generateSudoku(1,seeded(15));
    const saved=JSON.stringify(puzzle.puzzle);
    expect(countSolutions(puzzle.puzzle)).toBe(1);
    expect(JSON.stringify(puzzle.puzzle)).toBe(saved);
    expect(shuffle([1,2,3,4],seeded(2)).sort()).toEqual([1,2,3,4]);
  });
});
