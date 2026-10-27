/** Pure Sudoku model and original procedural puzzle generation. No external puzzle data. */
export type Grid = number[][];
export type RandomSource = () => number;
export interface SudokuPuzzle { level:number; size:4|9; box:2|3; puzzle:Grid; solution:Grid; clues:number; intro:string|null }
export interface SudokuQuality {label:string; stars:number; points:number; targetMs:number}
export const SUDOKU_SAVE_KEY = 'arcade:sudoku:save-v1';
export const SUDOKU_RECORDS_KEY = 'arcade:sudoku:records-v1';
export const SUDOKU_LEVEL_KEY = 'arcade:sudoku:level-v1';
export const INTRO_TIPS = [
  'PASO 1 · FILAS: coloca del 1 al 4 sin repetir números en una misma fila.',
  'PASO 2 · COLUMNAS: ahora revisa también que cada columna tenga números distintos.',
  'PASO 3 · BLOQUES: cada cuadro de 2×2 debe contener 1, 2, 3 y 4 una sola vez.',
] as const;
const clampRandom=(rnd:RandomSource)=>Math.max(0,Math.min(.999999999,rnd()));
export const copyGrid=(grid:Grid):Grid=>grid.map(row=>[...row]);
export const boardSize=(level:number):4|9=>level<=3?4:9;
export const boxSize=(size:number)=>Math.sqrt(size);
export const blankCount=(grid:Grid)=>grid.flat().filter(n=>n===0).length;
export function shuffle<T>(values:readonly T[],rnd:RandomSource):T[]{
  const result=[...values];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(clampRandom(rnd)*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
export function isValidPlacement(grid:Grid,row:number,col:number,value:number):boolean {
  const size=grid.length, box=Math.sqrt(size);
  if(value<1||value>size||!Number.isInteger(value))return false;
  for(let index=0;index<size;index++){
    if(index!==col&&grid[row][index]===value)return false;
    if(index!==row&&grid[index][col]===value)return false;
  }
  const r0=Math.floor(row/box)*box,c0=Math.floor(col/box)*box;
  for(let r=r0;r<r0+box;r++)for(let c=c0;c<c0+box;c++)
    if((r!==row||c!==col)&&grid[r][c]===value)return false;
  return true;
}
export function isSolved(grid:Grid):boolean {
  const size=grid.length;
  return [4,9].includes(size)&&grid.every(row=>row.length===size)&&
    grid.every((row,r)=>row.every((n,c)=>n!==0&&isValidPlacement(grid,r,c,n)));
}
/** MRV solver. A search budget is conservative: any truncated search is treated as non-unique. */
export function countSolutions(input:Grid,limit=2,budget=80000):number {
  const grid=copyGrid(input),size=grid.length;
  let nodes=0,found=0,truncated=false;
  const search=()=>{
    if(found>=limit||truncated)return;
    if(++nodes>budget){truncated=true;return;}
    let bestR=-1,bestC=-1;
    let best:number[]=[];
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(grid[r][c]===0){
      const valid:number[]=[];
      for(let n=1;n<=size;n++)if(isValidPlacement(grid,r,c,n))valid.push(n);
      if(!valid.length)return;
      if(bestR<0||valid.length<best.length){bestR=r;bestC=c;best=valid;}
    }
    if(bestR<0){found++;return;}
    for(const n of best){
      grid[bestR][bestC]=n;
      search();
      grid[bestR][bestC]=0;
      if(found>=limit||truncated)break;
    }
  };
  search();
  return truncated?limit:found;
}
export function fullGrid(size:4|9,rnd:RandomSource=Math.random):Grid {
  const box=boxSize(size);
  const groups=shuffle(Array.from({length:box},(_,i)=>i),rnd);
  const rows=groups.flatMap(g=>shuffle(Array.from({length:box},(_,i)=>g*box+i),rnd));
  const columnGroups=shuffle(Array.from({length:box},(_,i)=>i),rnd);
  const cols=columnGroups.flatMap(g=>shuffle(Array.from({length:box},(_,i)=>g*box+i),rnd));
  const digits=shuffle(Array.from({length:size},(_,i)=>i+1),rnd);
  return rows.map(r=>cols.map(c=>digits[(box*(r%box)+Math.floor(r/box)+c)%size]));
}
export function targetClues(level:number):number {
  if(level<=3)return [0,12,10,8][Math.max(1,level)];
  return [40,35,30,27,25,23,22][Math.min(6,Math.max(0,level-4))];
}
export function generateSudoku(level:number,rnd:RandomSource=Math.random):SudokuPuzzle {
  const lvl=Math.max(1,Math.floor(level)),size=boardSize(lvl);
  const solution=fullGrid(size,rnd),puzzle=copyGrid(solution);
  const order=shuffle(Array.from({length:size*size},(_,i)=>i),rnd);
  const minClues=targetClues(lvl);
  let remaining=size*size;
  for(const idx of order){
    if(remaining<=minClues)break;
    const r=Math.floor(idx/size),c=idx%size,old=puzzle[r][c];
    puzzle[r][c]=0;
    if(countSolutions(puzzle)!==1)puzzle[r][c]=old;
    else remaining--;
  }
  return {level:lvl,size,box:boxSize(size) as 2|3,puzzle,solution,
    clues:remaining,intro:lvl<=3?INTRO_TIPS[lvl-1]:null};
}
export function conflictCells(grid:Grid):Set<number> {
  const bad=new Set<number>(),size=grid.length;
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const n=grid[r][c];
    if(n!==0&&!isValidPlacement(grid,r,c,n))bad.add(r*size+c);
  }
  return bad;
}
export function targetTimeMs(level:number):number {
  if(level<=3)return [0,45000,65000,90000][Math.max(1,level)];
  return Math.round(Math.min(18,8+(level-4)*1.3)*60000);
}
/** A time-only measure. No error, hint or move penalties contribute to these values. */
export function qualityFor(level:number,elapsedMs:number):SudokuQuality {
  const targetMs=targetTimeMs(level);
  const relative=Math.max(1000,elapsedMs)/targetMs;
  const stars=relative<=.65?5:relative<=1?4:relative<=1.5?3:relative<=2.25?2:1;
  const label=['','COMPLETADO','BRONCE','PLATA','ORO','RELÁMPAGO'][stars];
  const points=Math.max(100,Math.round(1000/Math.max(.5,relative)*(1+Math.max(0,level-3)*.1)));
  return {label,stars,points,targetMs};
}
export function safeStoredLevel(raw:string|null):number {
  const parsed=Number(raw);
  return Number.isInteger(parsed)&&parsed>=1&&parsed<=999?parsed:1;
}
export interface SudokuSave {
  level:number; puzzle:Grid; solution:Grid; entered:Grid; elapsedMs:number;
}
export function validSavedGame(x:unknown):x is SudokuSave {
  if(!x||typeof x!=='object')return false;
  const item=x as Partial<SudokuSave>;
  const size=boardSize(Number(item.level));
  if(!Number.isInteger(item.level)||!item.level||item.level<1||item.level>999
    ||typeof item.elapsedMs!=='number'||item.elapsedMs<0||!Number.isFinite(item.elapsedMs))return false;
  const boards=[item.puzzle,item.solution,item.entered];
  if(boards.some(board=>!Array.isArray(board)||board.length!==size||
    board.some(row=>!Array.isArray(row)||row.length!==size||
    row.some(n=>!Number.isInteger(n)||n<0||n>size))))return false;
  return isSolved(item.solution!)&&
    item.puzzle!.every((row,r)=>row.every((n,c)=>n===0||n===item.solution![r][c]))&&
    item.entered!.every((row,r)=>row.every((n,c)=>!item.puzzle![r][c]||n===item.puzzle![r][c]));
}
