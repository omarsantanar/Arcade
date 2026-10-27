import {WORD_BANK,WORDS_BY_TOPIC,normalizeAnswer,type CrosswordTerm,type CrosswordTopic} from './bank';

export const SIZE=15;
export type CrosswordTheme=CrosswordTopic|'mixto';
export type Direction='across'|'down';
export interface PlacedWord extends CrosswordTerm {
  id:string;direction:Direction;row:number;col:number;number:number;
}
export interface CrosswordPuzzle {
  size:number;theme:CrosswordTheme;seed:number;grid:(string|null)[][];numbers:number[][];
  entries:PlacedWord[];
}
export interface CrosswordSaved {theme:CrosswordTheme;seed:number;elapsedMs:number;fill:string[][];hints:number}
export const CROSSWORD_SAVE_KEY='arcade:crossword:save-v1';
export const CROSSWORD_BEST_KEY='arcade:crossword:best-v1';
export function readCrosswordBest():number {
  try{
    const parsed=JSON.parse(window.localStorage.getItem(CROSSWORD_BEST_KEY)||'{}') as Record<string,number>;
    return Math.max(0,...Object.values(parsed).filter(n=>Number.isFinite(n)&&n>0));
  }catch{return 0;}
}
const blank=()=>Array.from({length:SIZE},()=>Array<string|null>(SIZE).fill(null));
const emptyMask=()=>Array.from({length:SIZE},()=>Array<number>(SIZE).fill(0));
export const seedRandom=(seed:number)=>{
  let x=seed>>>0;
  return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};
};
function shuffle<T>(items:readonly T[],rnd:()=>number):T[]{
  const a=[...items];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
const inBounds=(row:number,col:number)=>row>=0&&row<SIZE&&col>=0&&col<SIZE;
function canPlace(answer:string,dir:Direction,row:number,col:number,grid:(string|null)[][],mask:number[][],first=false):number{
  const dr=dir==='down'?1:0,dc=dir==='across'?1:0;
  const endR=row+dr*(answer.length-1),endC=col+dc*(answer.length-1);
  if(!inBounds(row,col)||!inBounds(endR,endC))return -1;
  if(inBounds(row-dr,col-dc)&&grid[row-dr][col-dc]!==null)return -1;
  if(inBounds(endR+dr,endC+dc)&&grid[endR+dr][endC+dc]!==null)return -1;
  let crossings=0;
  for(let i=0;i<answer.length;i++){
    const r=row+i*dr,c=col+i*dc,existing=grid[r][c];
    if(existing!==null){
      if(existing!==answer[i]||(mask[r][c]&(dir==='across'?1:2)))return -1;
      crossings++;
    }else{
      const neighbors=dir==='across'?[[r-1,c],[r+1,c]]:[[r,c-1],[r,c+1]];
      if(neighbors.some(([nr,nc])=>inBounds(nr,nc)&&grid[nr][nc]!==null))return -1;
    }
  }
  if(!first&&crossings===0)return -1;
  return crossings;
}
function put(word:CrosswordTerm,dir:Direction,row:number,col:number,grid:(string|null)[][],mask:number[][]):PlacedWord{
  for(let i=0;i<word.answer.length;i++){
    const r=row+(dir==='down'?i:0),c=col+(dir==='across'?i:0);
    grid[r][c]=word.answer[i];mask[r][c]|=dir==='across'?1:2;
  }
  return {...word,id:word.answer+'-'+dir+'-'+row+'-'+col,direction:dir,row,col,number:0};
}
function candidates(word:CrosswordTerm,grid:(string|null)[][],mask:number[][],rnd:()=>number){
  const result:{row:number;col:number;dir:Direction;value:number}[]=[];
  const dirs:Direction[]=['across','down'];
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const char=grid[r][c];if(char===null)continue;
    for(let index=0;index<word.answer.length;index++){
      if(word.answer[index]!==char)continue;
      for(const dir of dirs){
        if(mask[r][c]&(dir==='across'?1:2))continue;
        const row=r-(dir==='down'?index:0),col=c-(dir==='across'?index:0);
        const crossings=canPlace(word.answer,dir,row,col,grid,mask);
        if(crossings<1)continue;
        const centerPenalty=Math.abs(row+(dir==='down'?word.answer.length/2:0)-SIZE/2)
          +Math.abs(col+(dir==='across'?word.answer.length/2:0)-SIZE/2);
        result.push({row,col,dir,value:crossings*50+word.answer.length*.8-centerPenalty+rnd()*12});
      }
    }
  }
  return result;
}
function makeOnce(theme:CrosswordTheme,seed:number,rnd:()=>number):CrosswordPuzzle{
  const grid=blank(),mask=emptyMask();
  const topical=theme==='mixto'?shuffle(WORD_BANK,rnd):shuffle(WORDS_BY_TOPIC[theme],rnd);
  const pool=topical.filter(w=>w.answer.length>=3&&w.answer.length<=SIZE);
  const first=pool.find(w=>w.answer.length>=6&&w.answer.length<=11)??pool[0];
  if(!first)throw Error('Faltan palabras para la categoría '+theme);
  const row=Math.floor(SIZE/2),col=Math.floor((SIZE-first.answer.length)/2);
  const entries=[put(first,'across',row,col,grid,mask)];
  const used=new Set([first.answer]);
  const target=theme==='mixto'?13:11;
  for(let round=0;round<3 && entries.length<target;round++){
    for(const word of pool){
      if(used.has(word.answer)||entries.length>=target)continue;
      const options=candidates(word,grid,mask,rnd);
      if(!options.length)continue;
      options.sort((a,b)=>b.value-a.value);
      const choice=options[Math.floor(rnd()*Math.min(3,options.length))];
      entries.push(put(word,choice.dir,choice.row,choice.col,grid,mask));
      used.add(word.answer);
    }
  }
  const numbers=Array.from({length:SIZE},()=>Array<number>(SIZE).fill(0));
  let number=0;
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const atStart=entries.filter(e=>e.row===r&&e.col===c);
    if(atStart.length){
      number++;
      numbers[r][c]=number;
      for(const e of atStart)e.number=number;
    }
  }
  return {size:SIZE,theme,seed,grid,numbers,entries};
}
/** Deterministic for the same seed; all answers share real crossed letters. */
export function generateCrossword(theme:CrosswordTheme='mixto',seed=Math.floor(Math.random()*4294967295)):CrosswordPuzzle{
  const rnd=seedRandom(seed);
  let best=makeOnce(theme,seed,rnd);
  for(let pass=0;pass<3 && best.entries.length<10;pass++){
    const another=makeOnce(theme,seed,rnd);
    if(another.entries.length>best.entries.length)best=another;
  }
  return best;
}
export function entryCells(entry:PlacedWord):[number,number][]{
  return Array.from({length:entry.answer.length},(_,i)=>[
    entry.row+(entry.direction==='down'?i:0),entry.col+(entry.direction==='across'?i:0)]);
}
export function emptyFill(puzzle:CrosswordPuzzle):string[][]{
  return puzzle.grid.map(row=>row.map(()=>'')); // black cells ignored
}
export function filledProgress(puzzle:CrosswordPuzzle,fill:string[][]){
  let correct=0,total=0;
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
    const ch=puzzle.grid[r][c];
    if(ch!==null){total++;if(ch===fill[r]?.[c])correct++;}
  }
  return {correct,total,percent:total?Math.round(correct*100/total):0};
}
export function isCrosswordSolved(puzzle:CrosswordPuzzle,fill:string[][]):boolean{
  const {correct,total}=filledProgress(puzzle,fill);
  return total>0&&correct===total;
}
export function findEntryAt(puzzle:CrosswordPuzzle,row:number,col:number,dir?:Direction):PlacedWord|null{
  return puzzle.entries.find(e=>(dir===undefined||e.direction===dir)
    && entryCells(e).some(([r,c])=>r===row&&c===col))??null;
}
export function validateCrossword(puzzle:CrosswordPuzzle):boolean{
  if(puzzle.entries.length<4)return false;
  const seen=new Set<string>();
  for(const entry of puzzle.entries){
    if(seen.has(entry.answer)||entry.number<=0)return false;
    seen.add(entry.answer);
    const locations=entryCells(entry);
    if(locations.some(([r,c],i)=>!inBounds(r,c)||puzzle.grid[r][c]!==entry.answer[i]))return false;
    if(!locations.some(([r,c])=>puzzle.entries.some(other=>other.id!==entry.id
      && entryCells(other).some(([y,x])=>y===r&&x===c))))return false;
  }
  return true;
}
export function readableAnswer(word:string):string{return word;}
export function validSave(x:unknown):x is CrosswordSaved{
  if(!x||typeof x!=='object')return false;
  const d=x as Partial<CrosswordSaved>;
  return (d.theme==='mixto'||Object.keys(WORDS_BY_TOPIC).includes(String(d.theme)))
    &&Number.isInteger(d.seed)&&Number(d.seed)>=0&&Number(d.seed)<=4294967295
    &&typeof d.elapsedMs==='number'&&Number.isFinite(d.elapsedMs)&&d.elapsedMs>=0
    &&Number.isInteger(d.hints)&&Number(d.hints)>=0
    &&Array.isArray(d.fill)&&d.fill.length===SIZE
    &&d.fill.every(row=>Array.isArray(row)&&row.length===SIZE
      &&row.every(cell=>typeof cell==='string'&&(cell===''||normalizeAnswer(cell).length===1)));
}
