import {useCallback,useEffect,useMemo,useState} from 'react';
import type {GameCallbacks} from '../types';
import {TOPIC_LABELS,normalizeAnswer,WORD_BANK,type CrosswordTopic} from './bank';
import {generateCrossword,seedRandom,emptyFill,entryCells,filledProgress,isCrosswordSolved,
  findEntryAt,validSave,CROSSWORD_SAVE_KEY,CROSSWORD_BEST_KEY,
  type CrosswordTheme,type CrosswordSaved,type CrosswordPuzzle,type PlacedWord} from './logic';

export interface CrosswordController {pause:()=>void;resume:()=>void;restart:()=>void;}
interface Props {callbacks:GameCallbacks;controller:CrosswordController;}
interface Session {puzzle:CrosswordPuzzle;fill:string[][];elapsedMs:number;hints:number;}
const getLocal=(key:string)=>{try{return window.localStorage.getItem(key);}catch{return null;}};
const setLocal=(key:string,value:string)=>{try{window.localStorage.setItem(key,value);}catch{/* optional */}};
const newSeed=()=>Math.floor(Math.random()*4294967295);
const createSession=(theme:CrosswordTheme='mixto'):Session=>{
  const puzzle=generateCrossword(theme,newSeed());
  return {puzzle,fill:emptyFill(puzzle),elapsedMs:0,hints:0};
};
function loadSession():Session{
  try{
    const raw=JSON.parse(getLocal(CROSSWORD_SAVE_KEY)||'null') as unknown;
    if(validSave(raw)){
      const puzzle=generateCrossword(raw.theme,raw.seed);
      return {puzzle,fill:raw.fill,elapsedMs:raw.elapsedMs,hints:raw.hints};
    }
  }catch{/* corrupt or unavailable */ }
  return createSession();
}
function clock(ms:number){const n=Math.floor(ms/1000);return Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0');}
const alphabet=[...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];
const choices=[{value:'mixto',label:'Todo el país'},...Object.entries(TOPIC_LABELS).map(([value,label])=>({value,label}))];
function readBest(theme:CrosswordTheme):number{
  try{const d=JSON.parse(getLocal(CROSSWORD_BEST_KEY)||'{}') as Record<string,number>;
    const n=Number(d[theme]);return Number.isFinite(n)&&n>0?n:0;}catch{return 0;}
}
function saveBest(theme:CrosswordTheme,score:number){
  try{const d=JSON.parse(getLocal(CROSSWORD_BEST_KEY)||'{}') as Record<string,number>;
    d[theme]=Math.max(Number(d[theme])||0,score);setLocal(CROSSWORD_BEST_KEY,JSON.stringify(d));}catch{/* optional */ }
}
export default function CrosswordGame({callbacks,controller}:Props){
  const [session,setSession]=useState<Session>(loadSession);
  const [selection,setSelection]=useState<{row:number;col:number;id:string|null}>(()=>({
    row:0,col:0,id:null}));
  const [paused,setPaused]=useState(false);
  const [finished,setFinished]=useState(false);
  const [showReview,setShowReview]=useState(false);
  const {puzzle,fill,elapsedMs,hints}=session;
  const ordered=useMemo(()=>[...puzzle.entries].sort((a,b)=>a.number-b.number||
    (a.direction==='across'?-1:1)),[puzzle]);
  const entry=ordered.find(w=>w.id===selection.id)??ordered[0];
  const selectionCells=entry?entryCells(entry):[];
  const hasCrossing=selectionCells.some(([r,c])=>r===selection.row&&c===selection.col);
  const activeRow=hasCrossing?selection.row:entry?.row??0;
  const activeCol=hasCrossing?selection.col:entry?.col??0;
  const target=entry?entryCells(entry):[];
  const progress=filledProgress(puzzle,fill);
  const complete=isCrosswordSolved(puzzle,fill);
  const [score,setScore]=useState(0);
  const [best,setBest]=useState(()=>readBest(puzzle.theme));

  const reset=(theme:CrosswordTheme=puzzle.theme)=>{
    const next=createSession(theme);
    setSession(next);setSelection({row:0,col:0,id:null});
    setPaused(false);setFinished(false);setShowReview(false);setScore(0);
    setBest(readBest(theme));
    callbacks.onScore(0);callbacks.onStatus('playing');
    setLocal(CROSSWORD_SAVE_KEY,JSON.stringify({theme:next.puzzle.theme,seed:next.puzzle.seed,
      elapsedMs:0,fill:next.fill,hints:0} satisfies CrosswordSaved));
  };
  useEffect(()=>{
    controller.pause=()=>{setPaused(true);callbacks.onStatus('paused');};
    controller.resume=()=>{setPaused(false);callbacks.onStatus('playing');};
    controller.restart=()=>reset();
    // The controller belongs to this mounted game instance, not a singleton.
  });

  useEffect(()=>{
    if(paused||finished||complete)return;
    let last=performance.now();
    const interval=window.setInterval(()=>{
      const now=performance.now(),delta=now-last;last=now;
      if(document.visibilityState==='visible')setSession(prev=>({...prev,elapsedMs:prev.elapsedMs+Math.max(0,Math.min(350,delta))}));
    },250);
    return ()=>window.clearInterval(interval);
  },[paused,finished,complete]);

  useEffect(()=>{
    if(finished||complete)return;
    setLocal(CROSSWORD_SAVE_KEY,JSON.stringify({theme:puzzle.theme,seed:puzzle.seed,fill,
      elapsedMs,hints} satisfies CrosswordSaved));
  },[puzzle,fill,elapsedMs,hints,finished,complete]);

  useEffect(()=>{
    if(!complete||finished)return;
    const result=Math.max(100,Math.round(1000+puzzle.entries.length*110-
      elapsedMs/1200-hints*150));
    setScore(result);setFinished(true);setPaused(true);
    saveBest(puzzle.theme,result);
    setBest(current=>Math.max(current,result));
    callbacks.onScore(result);
    try{window.localStorage.removeItem(CROSSWORD_SAVE_KEY);}catch{/* optional */}
  },[complete,finished,elapsedMs,hints,puzzle,callbacks]);

  const chooseCell=(row:number,col:number)=>{
    const matching=puzzle.entries.filter(e=>entryCells(e).some(([r,c])=>r===row&&c===col));
    if(!matching.length)return;
    const alternate=matching.find(e=>e.id!==entry?.id);
    const choice=matching.find(e=>e.id===entry?.id)??matching[0];
    const targetEntry=activeRow===row&&activeCol===col&&alternate?alternate:choice;
    setSelection({row,col,id:targetEntry.id});setShowReview(false);
  };
  const chooseEntry=(e:PlacedWord)=>{
    const cells=entryCells(e);
    const free=cells.find(([r,c])=>fill[r][c]==='')??cells[0];
    setSelection({row:free[0],col:free[1],id:e.id});setShowReview(false);
  };
  const typeLetter=useCallback((value:string)=>{
    if(paused||finished||!entry)return;
    const normalized=normalizeAnswer(value);
    if(value!==''&&(normalized.length!==1||!alphabet.includes(normalized)))return;
    const cells=entryCells(entry);
    const selectedIndex=Math.max(0,cells.findIndex(([r,c])=>r===activeRow&&c===activeCol));
    const [r,c]=cells[selectedIndex];
    setSession(old=>{
      const newFill=old.fill.map(line=>[...line]);
      newFill[r][c]=normalized;return {...old,fill:newFill};
    });
    setShowReview(false);
    if(normalized!==''&&selectedIndex<cells.length-1){
      const [nextR,nextC]=cells[selectedIndex+1];
      setSelection({row:nextR,col:nextC,id:entry.id});
    }else if(normalized===''&&selectedIndex>0){
      const [prevR,prevC]=cells[selectedIndex-1];
      setSelection({row:prevR,col:prevC,id:entry.id});
    }
  },[paused,finished,entry,activeRow,activeCol]);

  useEffect(()=>{
    const handleKey=(ev:KeyboardEvent)=>{
      if(paused||finished)return;
      if(ev.key==='Backspace'||ev.key==='Delete'){ev.preventDefault();typeLetter('');return;}
      if(ev.key==='Tab')return;
      if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'||ev.key==='ArrowUp'||ev.key==='ArrowDown'){
        ev.preventDefault();
        const delta=ev.key==='ArrowLeft'?[0,-1]:ev.key==='ArrowRight'?[0,1]:
          ev.key==='ArrowUp'?[-1,0]:[1,0];
        const row=activeRow+delta[0],col=activeCol+delta[1];
        const found=findEntryAt(puzzle,row,col);
        if(found)setSelection({row,col,id:found.id});
        return;
      }
      if(ev.key.length===1&&normalizeAnswer(ev.key).length===1
        &&alphabet.includes(normalizeAnswer(ev.key))){ev.preventDefault();typeLetter(ev.key);}
    };
    window.addEventListener('keydown',handleKey);
    return ()=>window.removeEventListener('keydown',handleKey);
  },[paused,finished,puzzle,activeRow,activeCol,typeLetter]);

  const hint=()=>{
    if(paused||finished||!entry)return;
    const location=entryCells(entry).find(([r,c])=>fill[r][c]!==puzzle.grid[r][c]);
    if(!location)return;
    const [row,col]=location;
    setSession(old=>{
      const updated=old.fill.map(line=>[...line]);
      updated[row][col]=puzzle.grid[row][col]??'';
      return {...old,fill:updated,hints:old.hints+1};
    });
    setSelection({row,col,id:entry.id});
  };
  const counts={across:ordered.filter(e=>e.direction==='across'),
    down:ordered.filter(e=>e.direction==='down')};
  const reviewErrors=useMemo(()=>{
    const incorrect=new Set<string>();
    if(!showReview)return incorrect;
    for(let r=0;r<puzzle.size;r++)for(let c=0;c<puzzle.size;c++)
      if(puzzle.grid[r][c]!==null&&fill[r][c]!==''&&puzzle.grid[r][c]!==fill[r][c])
        incorrect.add(r+'-'+c);
    return incorrect;
  },[showReview,puzzle,fill]);

  return <section className="cruci-game" aria-label="Crucigrama dominicano">
    <header className="cruci-head">
      <div><strong>CRUCIGRAMA DOMINICANO</strong><small>{WORD_BANK.length} voces, sitios y referencias culturales</small></div>
      <div className="cruci-timer" aria-label={'Tiempo '+clock(elapsedMs)}>{clock(elapsedMs)}</div>
    </header>
    <div className="cruci-options">
      <label htmlFor="cruci-theme">Tema</label>
      <select id="cruci-theme" value={puzzle.theme} onChange={e=>reset(e.target.value as CrosswordTheme)}>
        {choices.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <button type="button" onClick={()=>reset()} title="Crear otro crucigrama">Nuevo</button>
    </div>
    <div className="cruci-board" role="grid" aria-label={'Tablero de palabras cruzadas, '+puzzle.entries.length+' pistas'}>
      {puzzle.grid.map((line,r)=>line.map((answer,c)=>{
        if(answer===null)return <span className="cruci-block" key={r+'-'+c} aria-hidden="true"/>;
        const selectedWord=target.some(([rr,cc])=>rr===r&&cc===c);
        const focus=activeRow===r&&activeCol===c;
        const wrong=reviewErrors.has(r+'-'+c);
        const solvedLetter=fill[r][c]===answer;
        return <button type="button" className={'cruci-cell'+(selectedWord?' cruci-word':'')+
          (focus?' cruci-focus':'')+(wrong?' cruci-wrong':'')+
          (solvedLetter&&showReview?' cruci-checked':'')}
          role="gridcell" aria-selected={focus} key={r+'-'+c}
          aria-label={'Fila '+(r+1)+', columna '+(c+1)+', '+(fill[r][c]||'vacía')}
          onClick={()=>chooseCell(r,c)} disabled={paused||finished}>
          {puzzle.numbers[r][c]>0&&<span className="cruci-number">{puzzle.numbers[r][c]}</span>}
          <span>{fill[r][c]}</span>
        </button>;
      }))}
    </div>
    <div className="cruci-progress"><span>{progress.correct}/{progress.total} letras correctas</span>
      <span>{puzzle.entries.length} palabras · {hints} ayudas</span></div>
    <div className="cruci-current" aria-live="polite">
      <b>{entry?.number}{entry?.direction==='across'?' HORIZONTAL':' VERTICAL'} ({entry?.answer.length})</b>
      <span>{entry?.clue}</span>
    </div>
    <div className="cruci-keyboard" aria-label="Teclado de letras">
      {alphabet.map(letter=><button type="button" key={letter} onClick={()=>typeLetter(letter)}
        disabled={paused||finished} aria-label={'Escribir '+letter}>{letter}</button>)}
      <button type="button" className="cruci-delete" onClick={()=>typeLetter('')} disabled={paused||finished}>⌫</button>
    </div>
    <div className="cruci-actions">
      <button type="button" onClick={()=>setShowReview(prev=>!prev)} disabled={paused||finished}>
        {showReview?'Ocultar errores':'Revisar letras'}</button>
      <button type="button" onClick={hint} disabled={paused||finished}>Revelar una letra</button>
      <span>Récord: {best||'—'}</span>
    </div>
    <div className="cruci-lists">
      {(['across','down'] as const).map(direction=><div key={direction}>
        <h4>{direction==='across'?'Horizontales':'Verticales'}</h4>
        {counts[direction].map(e=>{
          const cells=entryCells(e),solved=cells.every(([r,c],i)=>fill[r][c]===e.answer[i]);
          return <button key={e.id} type="button" onClick={()=>chooseEntry(e)}
            className={(entry?.id===e.id?'active ':'')+(solved?'solved':'')}>
            <b>{e.number}.</b> {e.clue} <small>{e.answer.length} letras {solved?'✓':''}</small>
          </button>;
        })}
      </div>)}
    </div>
    {finished&&<div className="cruci-finish" role="dialog" aria-label="Crucigrama completado">
      <strong>¡CRUCIGRAMA RESUELTO!</strong>
      <p>{clock(elapsedMs)} · {score} puntos · {hints} pistas usadas</p>
      <button type="button" onClick={()=>reset()}>Otro crucigrama dominicano</button>
    </div>}
  </section>;
}
