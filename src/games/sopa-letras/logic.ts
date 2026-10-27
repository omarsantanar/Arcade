import {WORDS_BY_TOPIC, TOPIC_LABELS, type CrosswordTerm, type CrosswordTopic} from '../crucigrama/bank';

/** A word-search puzzle using the shared, independently authored Dominican editorial bank. */
export type WordSearchTheme=CrosswordTopic|'mixto';
export type WordSearchDifficulty='inicial'|'intermedio'|'experto';
export interface Cell {row:number;col:number}
export interface SearchWord extends CrosswordTerm {id:string;cells:Cell[]}
export interface WordSearchPuzzle {
  theme:WordSearchTheme; difficulty:WordSearchDifficulty; seed:number;
  size:number;grid:string[][];words:SearchWord[];
}
export interface WordSearchSave {
  theme:WordSearchTheme;difficulty:WordSearchDifficulty;seed:number;
  found:string[];elapsedMs:number;hints:number;mistakes:number;
}
export const SEARCH_SAVE_KEY='arcade:sopa-letras:save-v1';
export const SEARCH_BEST_KEY='arcade:sopa-letras:best-v1';
export const DIFFICULTIES:Record<WordSearchDifficulty,{size:number;count:number;maxLength:number;directions:number}>={
  inicial:{size:10,count:7,maxLength:9,directions:4},
  intermedio:{size:13,count:10,maxLength:12,directions:6},
  experto:{size:15,count:13,maxLength:15,directions:8},
};
const VECTORS:readonly Cell[]=[
  {row:0,col:1},{row:1,col:0},{row:1,col:1},{row:1,col:-1},
  {row:0,col:-1},{row:-1,col:0},{row:-1,col:-1},{row:-1,col:1},
];
const LETTERS=[...'AAAAAEEEEIIIOOOOUUUBBCCDDFFGGHHJJKKLLLMMMNNNNÑPPRRRRSSSSTTTTVVYYZZ'];
export const seedRandom=(seed:number)=>{
  let value=seed>>>0;
  return ()=>{value=(Math.imul(1664525,value)+1013904223)>>>0;return value/4294967296;};
};
function shuffle<T>(input:readonly T[],rnd:()=>number):T[]{
  const list=[...input];
  for(let index=list.length-1;index>0;index--){
    const swap=Math.floor(rnd()*(index+1));
    [list[index],list[swap]]=[list[swap],list[index]];
  }
  return list;
}
const inBounds=(c:Cell,size:number)=>c.row>=0&&c.col>=0&&c.row<size&&c.col<size;
function route(start:Cell,vector:Cell,length:number,size:number):Cell[]|null{
  const cells=Array.from({length},(_,i)=>({row:start.row+i*vector.row,col:start.col+i*vector.col}));
  return cells.every(c=>inBounds(c,size))?cells:null;
}
function optionsFor(theme:WordSearchTheme,maxLength:number,rnd:()=>number):CrosswordTerm[]{
  if(theme!=='mixto')return shuffle(WORDS_BY_TOPIC[theme],rnd).filter(w=>w.answer.length>=4&&w.answer.length<=maxLength);
  // Round robin by topic so "Todo el país" never devolves into a single subject.
  const keys=shuffle(Object.keys(TOPIC_LABELS) as CrosswordTopic[],rnd);
  const stacks=keys.map(topic=>shuffle(WORDS_BY_TOPIC[topic],rnd).filter(w=>w.answer.length>=4&&w.answer.length<=maxLength));
  const result:CrosswordTerm[]=[];
  while(stacks.some(group=>group.length)){
    for(const group of stacks){const word=group.shift();if(word)result.push(word);}
  }
  return result;
}
function overlaps(grid:(string|null)[][],answer:string,cells:Cell[]):number{
  let shared=0;
  for(let i=0;i<answer.length;i++){
    const before=grid[cells[i].row][cells[i].col];
    if(before!==null&&before!==answer[i])return -1;
    if(before===answer[i])shared++;
  }
  return shared;
}
function place(word:CrosswordTerm,grid:(string|null)[][],rnd:()=>number,vectors:readonly Cell[]):Cell[]|null{
  const size=grid.length,tries=160;
  let best:Cell[]|null=null,bestScore=-Infinity;
  for(let n=0;n<tries;n++){
    const vector=vectors[Math.floor(rnd()*vectors.length)];
    const start={row:Math.floor(rnd()*size),col:Math.floor(rnd()*size)};
    const cells=route(start,vector,word.answer.length,size);
    if(!cells)continue;
    const shared=overlaps(grid,word.answer,cells);
    if(shared<0)continue;
    const score=shared*3+rnd();
    if(score>bestScore){best=cells;bestScore=score;}
  }
  if(!best)return null;
  best.forEach((c,i)=>{grid[c.row][c.col]=word.answer[i];});
  return best;
}
function occurrences(grid:string[][],answer:string):Cell[][]{
  const size=grid.length,out:Cell[][]=[];
  for(let r=0;r<size;r++)for(let c=0;c<size;c++)for(const vector of VECTORS){
    const cells=route({row:r,col:c},vector,answer.length,size);
    if(cells&&cells.every((p,i)=>grid[p.row][p.col]===answer[i]))out.push(cells);
  }
  return out;
}
function createOnce(theme:WordSearchTheme,difficulty:WordSearchDifficulty,seed:number,rnd:()=>number):WordSearchPuzzle{
  const cfg=DIFFICULTIES[difficulty],grid=Array.from({length:cfg.size},()=>Array<string|null>(cfg.size).fill(null));
  const chosen:SearchWord[]=[];
  const selected=new Set<string>();
  const pool=optionsFor(theme,cfg.maxLength,rnd);
  for(const word of pool){
    if(chosen.length>=cfg.count)break;
    if(selected.has(word.answer)||[...selected].some(w=>w.includes(word.answer)||word.answer.includes(w)))continue;
    const cells=place(word,grid,rnd,VECTORS.slice(0,cfg.directions));
    if(cells){selected.add(word.answer);chosen.push({...word,id:word.answer,cells});}
  }
  // Choose filler, avoiding unintended extra occurrences of the selected answers.
  let filled:string[][]=[];
  for(let attempt=0;attempt<28;attempt++){
    filled=grid.map(line=>line.map(letter=>letter??LETTERS[Math.floor(rnd()*LETTERS.length)]));
    if(chosen.every(word=>occurrences(filled,word.answer).length===1))break;
  }
  return {theme,difficulty,seed,size:cfg.size,grid:filled,words:chosen};
}
export function generateWordSearch(theme:WordSearchTheme='mixto',difficulty:WordSearchDifficulty='inicial',
  seed=Math.floor(Math.random()*4294967295)):WordSearchPuzzle{
  const rnd=seedRandom(seed);
  let best=createOnce(theme,difficulty,seed,rnd);
  const target=DIFFICULTIES[difficulty].count;
  for(let retry=0;retry<5&&best.words.length<target;retry++){
    const candidate=createOnce(theme,difficulty,seed,rnd);
    if(candidate.words.length>best.words.length)best=candidate;
  }
  return best;
}
export const sameCell=(a:Cell,b:Cell)=>a.row===b.row&&a.col===b.col;
export function cellsAlong(start:Cell,end:Cell,size:number):Cell[]|null{
  if(!inBounds(start,size)||!inBounds(end,size))return null;
  const dx=end.col-start.col,dy=end.row-start.row;
  if(dx!==0&&dy!==0&&Math.abs(dx)!==Math.abs(dy))return null;
  const length=Math.max(Math.abs(dx),Math.abs(dy))+1;
  return route(start,{row:Math.sign(dy),col:Math.sign(dx)},length,size);
}
export function matchSelection(puzzle:WordSearchPuzzle,start:Cell,end:Cell,
  found:readonly string[]=[]):SearchWord|null{
  const picked=cellsAlong(start,end,puzzle.size);
  if(!picked)return null;
  return puzzle.words.find(word=>!found.includes(word.id)&&word.cells.length===picked.length&&
    (word.cells.every((cell,i)=>sameCell(cell,picked[i]))||
    word.cells.every((cell,i)=>sameCell(cell,picked[picked.length-1-i]))))??null;
}
export function isComplete(puzzle:WordSearchPuzzle,found:readonly string[]):boolean{
  return puzzle.words.length>0&&puzzle.words.every(w=>found.includes(w.id));
}
export function searchScore(puzzle:WordSearchPuzzle,elapsedMs:number,hints:number,mistakes:number):number{
  const factor=puzzle.difficulty==='inicial'?1:puzzle.difficulty==='intermedio'?1.6:2.4;
  const base=500+puzzle.words.length*105;
  return Math.max(100,Math.round((base*factor)-(Math.max(0,elapsedMs)/900)-hints*180-mistakes*20));
}
export function readSearchBest():number{
  try{
    const v=JSON.parse(window.localStorage.getItem(SEARCH_BEST_KEY)||'{}') as Record<string,number>;
    return Math.max(0,...Object.values(v).filter(n=>Number.isFinite(n)&&n>0));
  }catch{return 0;}
}
export function validWordSearchSave(data:unknown):data is WordSearchSave{
  if(!data||typeof data!=='object')return false;
  const d=data as Partial<WordSearchSave>;
  return (d.theme==='mixto'||Object.hasOwn(WORDS_BY_TOPIC,String(d.theme)))
    &&(d.difficulty==='inicial'||d.difficulty==='intermedio'||d.difficulty==='experto')
    &&Number.isInteger(d.seed)&&Number(d.seed)>=0&&Number(d.seed)<=4294967295
    &&Array.isArray(d.found)&&d.found.length<=DIFFICULTIES[d.difficulty].count
    &&d.found.every(w=>typeof w==='string'&&/^[A-ZÑ]{4,15}$/.test(w))
    &&new Set(d.found).size===d.found.length
    &&typeof d.elapsedMs==='number'&&Number.isFinite(d.elapsedMs)&&d.elapsedMs>=0
    &&Number.isInteger(d.hints)&&Number(d.hints)>=0
    &&Number.isInteger(d.mistakes)&&Number(d.mistakes)>=0;
}
