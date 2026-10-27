import {useEffect,useMemo,useRef,useState,type PointerEvent} from 'react';
import type {GameCallbacks} from '../types';
import {WORD_BANK,TOPIC_LABELS} from '../crucigrama/bank';
import {generateWordSearch,matchSelection,cellsAlong,sameCell,isComplete,searchScore,
  readSearchBest,validWordSearchSave,SEARCH_SAVE_KEY,SEARCH_BEST_KEY,DIFFICULTIES,
  type Cell,type WordSearchTheme,type WordSearchDifficulty,type WordSearchPuzzle,
  type WordSearchSave,type SearchWord} from './logic';

export interface WordSearchController {pause:()=>void;resume:()=>void;restart:()=>void}
interface Props {callbacks:GameCallbacks;controller:WordSearchController}
interface Session {puzzle:WordSearchPuzzle;found:string[];elapsedMs:number;hints:number;mistakes:number}
interface Drag {start:Cell;end:Cell;moved:boolean}
const themes=[{value:'mixto',label:'Todo el país'},...Object.entries(TOPIC_LABELS).map(([value,label])=>({value,label}))];
const difficulties=[{value:'inicial',label:'Inicial · 10×10'},{value:'intermedio',label:'Intermedio · 13×13'},
  {value:'experto',label:'Experto · 15×15'}];
const makeSeed=()=>Math.floor(Math.random()*4294967295);
function loadLocal(key:string){try{return window.localStorage.getItem(key);}catch{return null;}}
function saveLocal(key:string,value:string){try{window.localStorage.setItem(key,value);}catch{/* optional */}}
function newSession(theme:WordSearchTheme='mixto',difficulty:WordSearchDifficulty='inicial'):Session{
  return {puzzle:generateWordSearch(theme,difficulty,makeSeed()),found:[],elapsedMs:0,hints:0,mistakes:0};
}
function initialSession():Session{
  try{
    const data=JSON.parse(loadLocal(SEARCH_SAVE_KEY)||'null') as unknown;
    if(validWordSearchSave(data)){
      const puzzle=generateWordSearch(data.theme,data.difficulty,data.seed);
      const allowed=new Set(puzzle.words.map(w=>w.id));
      return {puzzle,found:data.found.filter(id=>allowed.has(id)),elapsedMs:data.elapsedMs,
        hints:data.hints,mistakes:data.mistakes};
    }
  }catch{/* corrupt storage */ }
  return newSession();
}
const formatTime=(milliseconds:number)=>{const s=Math.floor(milliseconds/1000);
  return Math.floor(s/60).toString().padStart(2,'0')+':'+(s%60).toString().padStart(2,'0');};
function bestFor(theme:WordSearchTheme,difficulty:WordSearchDifficulty):number{
  try{
    const parsed=JSON.parse(loadLocal(SEARCH_BEST_KEY)||'{}') as Record<string,number>;
    const n=Number(parsed[theme+':'+difficulty]);return Number.isFinite(n)&&n>0?n:0;
  }catch{return 0;}
}
function recordBest(theme:WordSearchTheme,difficulty:WordSearchDifficulty,score:number){
  try{
    const parsed=JSON.parse(loadLocal(SEARCH_BEST_KEY)||'{}') as Record<string,number>;
    const key=theme+':'+difficulty;
    parsed[key]=Math.max(Number(parsed[key])||0,score);
    saveLocal(SEARCH_BEST_KEY,JSON.stringify(parsed));
  }catch{/* optional */}
}
function positionFromPointer(event:PointerEvent<HTMLElement>,size:number):Cell|null{
  const target=document.elementFromPoint(event.clientX,event.clientY) as HTMLElement|null;
  const item=target?.closest<HTMLElement>('[data-ws-row][data-ws-col]');
  if(!item||!event.currentTarget.contains(item))return null;
  const row=Number(item.dataset.wsRow),col=Number(item.dataset.wsCol);
  return Number.isInteger(row)&&Number.isInteger(col)&&row>=0&&col>=0&&row<size&&col<size?{row,col}:null;
}
export default function WordSearchGame({callbacks,controller}:Props){
  const [session,setSession]=useState<Session>(initialSession);
  const [paused,setPaused]=useState(false);
  const [finished,setFinished]=useState(false);
  const [pending,setPending]=useState<Cell|null>(null);
  const [preview,setPreview]=useState<Cell[]>([]);
  const [hintId,setHintId]=useState<string|null>(null);
  const [message,setMessage]=useState('Desliza una palabra o toca la primera y última letra.');
  const [best,setBest]=useState(()=>readSearchBest());
  const [score,setScore]=useState(0);
  const drag=useRef<Drag|null>(null);
  const {puzzle,found,elapsedMs,hints,mistakes}=session;
  const completed=isComplete(puzzle,found);
  const foundCells=useMemo(()=>{
    const cells=new Map<string,number>();
    puzzle.words.forEach((w,index)=>{
      if(found.includes(w.id))w.cells.forEach(c=>cells.set(c.row+':'+c.col,index%6));
    });
    return cells;
  },[puzzle,found]);
  const previewCells=new Set(preview.map(c=>c.row+':'+c.col));
  const wordsByTopic=useMemo(()=>puzzle.words.reduce((acc,w)=>{
    const group=TOPIC_LABELS[w.topic];
    (acc[group]??=[]).push(w);
    return acc;
  },{} as Record<string,SearchWord[]>),[puzzle]);

  const reset=(theme:WordSearchTheme=puzzle.theme,difficulty:WordSearchDifficulty=puzzle.difficulty)=>{
    const next=newSession(theme,difficulty);
    setSession(next);setPaused(false);setFinished(false);setPending(null);setPreview([]);setHintId(null);
    setMessage('Desliza una palabra o toca la primera y última letra.');
    setScore(0);setBest(readSearchBest());
    callbacks.onScore(0);callbacks.onStatus('playing');
    saveLocal(SEARCH_SAVE_KEY,JSON.stringify({theme:next.puzzle.theme,difficulty:next.puzzle.difficulty,
      seed:next.puzzle.seed,found:[],elapsedMs:0,hints:0,mistakes:0} satisfies WordSearchSave));
  };
  useEffect(()=>{
    controller.pause=()=>{setPaused(true);callbacks.onStatus('paused');};
    controller.resume=()=>{setPaused(false);callbacks.onStatus('playing');};
    controller.restart=()=>reset();
  });

  useEffect(()=>{
    if(paused||finished||completed)return;
    let last=performance.now();
    const interval=window.setInterval(()=>{
      const now=performance.now(),delta=now-last;last=now;
      if(document.visibilityState==='visible')setSession(old=>({...old,elapsedMs:old.elapsedMs+
        Math.max(0,Math.min(delta,350))}));
    },250);
    return ()=>window.clearInterval(interval);
  },[paused,finished,completed]);

  useEffect(()=>{
    if(finished||completed)return;
    saveLocal(SEARCH_SAVE_KEY,JSON.stringify({
      theme:puzzle.theme,difficulty:puzzle.difficulty,seed:puzzle.seed,found,elapsedMs,hints,mistakes,
    } satisfies WordSearchSave));
  },[puzzle,found,elapsedMs,hints,mistakes,finished,completed]);

  useEffect(()=>{
    if(!completed||finished)return;
    const result=searchScore(puzzle,elapsedMs,hints,mistakes);
    setScore(result);setFinished(true);setPaused(true);
    recordBest(puzzle.theme,puzzle.difficulty,result);
    setBest(old=>Math.max(old,result));
    callbacks.onScore(result);
    try{window.localStorage.removeItem(SEARCH_SAVE_KEY);}catch{/* optional */}
  },[completed,finished,puzzle,elapsedMs,hints,mistakes,callbacks]);

  const commitSelection=(start:Cell,end:Cell)=>{
    if(paused||finished||completed)return;
    const word=matchSelection(puzzle,start,end,found);
    if(word){
      setSession(old=>({...old,found:[...old.found,word.id]}));
      setMessage('Encontraste «'+word.answer+'». '+word.clue);
      setHintId(null);
    }else{
      const traced=cellsAlong(start,end,puzzle.size);
      if(traced&&traced.length>=4){
        setSession(old=>({...old,mistakes:old.mistakes+1}));
        setMessage('Esa secuencia no está en la lista. Intenta otra dirección.');
      }
    }
    setPreview([]);setPending(null);
  };
  const onDown=(event:PointerEvent<HTMLDivElement>)=>{
    if(paused||finished)return;
    const cell=positionFromPointer(event,puzzle.size);
    if(!cell)return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current={start:cell,end:cell,moved:false};
    setPreview([cell]);
  };
  const onMove=(event:PointerEvent<HTMLDivElement>)=>{
    if(!drag.current)return;
    const cell=positionFromPointer(event,puzzle.size);
    if(!cell)return;
    if(!sameCell(drag.current.start,cell))drag.current.moved=true;
    drag.current.end=cell;
    setPreview(cellsAlong(drag.current.start,cell,puzzle.size)??[drag.current.start]);
  };
  const onUp=(event:PointerEvent<HTMLDivElement>)=>{
    if(!drag.current)return;
    const d=drag.current;drag.current=null;
    const destination=positionFromPointer(event,puzzle.size)??d.end;
    if(d.moved||!sameCell(d.start,destination)){
      commitSelection(d.start,destination);
    }else if(pending&&!sameCell(pending,d.start)){
      commitSelection(pending,d.start);
    }else{
      setPending(d.start);setPreview([d.start]);
      setMessage('Selecciona la última letra de la palabra o desliza hasta ella.');
    }
    if(event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const cancel=()=>{drag.current=null;setPreview(pending?[pending]:[]);};
  const help=()=>{
    if(paused||finished)return;
    const word=puzzle.words.find(w=>!found.includes(w.id));
    if(!word)return;
    setSession(old=>({...old,hints:old.hints+1}));
    setHintId(word.id);
    setPending(word.cells[0]);setPreview([word.cells[0]]);
    setMessage('Pista: «'+word.answer+'» empieza en la casilla iluminada. '+word.clue);
  };
  const showHintCells=new Set(puzzle.words.find(w=>w.id===hintId)?.cells.slice(0,1)
    .map(c=>c.row+':'+c.col)??[]);

  return <section className="ws-game" aria-label="Sopa de Letras Dominicana">
    <header className="ws-head"><div><strong>SOPA DE LETRAS DOMINICANA</strong>
      <small>{WORD_BANK.length} entradas culturales en ocho categorías</small></div>
      <span className="ws-clock" aria-label={'Tiempo '+formatTime(elapsedMs)}>{formatTime(elapsedMs)}</span>
    </header>
    <div className="ws-controls">
      <label htmlFor="ws-theme">Tema</label>
      <select id="ws-theme" value={puzzle.theme}
        onChange={e=>reset(e.target.value as WordSearchTheme,puzzle.difficulty)}>
        {themes.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <label htmlFor="ws-difficulty">Nivel</label>
      <select id="ws-difficulty" value={puzzle.difficulty}
        onChange={e=>reset(puzzle.theme,e.target.value as WordSearchDifficulty)}>
        {difficulties.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
      </select>
      <button type="button" onClick={()=>reset()}>Nuevo</button>
    </div>
    <div className="ws-board" role="grid" aria-label={'Sopa de letras de '+puzzle.size+' por '+puzzle.size+
      ' casillas'} style={{gridTemplateColumns:'repeat('+puzzle.size+',minmax(0,1fr))'}}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
      onPointerCancel={cancel} onLostPointerCapture={cancel}>
      {puzzle.grid.map((row,r)=>row.map((letter,c)=>{
        const id=r+':'+c,foundIndex=foundCells.get(id);
        const selected=previewCells.has(id),start=pending&&pending.row===r&&pending.col===c;
        const hint=showHintCells.has(id);
        return <button key={id} type="button" data-ws-row={r} data-ws-col={c}
          role="gridcell" aria-label={'Fila '+(r+1)+' columna '+(c+1)+': '+letter}
          aria-selected={selected||!!start} disabled={paused||finished}
          className={'ws-cell'+(foundIndex!==undefined?' ws-found ws-color-'+foundIndex:'')+
            (selected?' ws-selected':'')+(start?' ws-start':'')+(hint?' ws-hint':'')}>
          {letter}
        </button>;
      }))}
    </div>
    <div className="ws-stats"><span>{found.length}/{puzzle.words.length} palabras encontradas</span>
      <span>{hints} ayudas · {mistakes} intentos fallidos</span></div>
    <div className="ws-meter"><div style={{width:(found.length/puzzle.words.length)*100+'%'}}/></div>
    <p className="ws-message" role="status">{message}</p>
    <div className="ws-actions">
      <button type="button" onClick={help} disabled={paused||finished}>Mostrar comienzo (ayuda)</button>
      <span>Mejor marca: {best||'—'}</span>
    </div>
    <div className="ws-words" aria-label="Lista de palabras">
      {Object.entries(wordsByTopic).map(([topic,words])=><div key={topic} className="ws-topic">
        <h4>{topic}</h4>
        <div className="ws-word-list">
          {words.map(word=><details key={word.id} className={found.includes(word.id)?'found':''}>
            <summary><span>{found.includes(word.id)?'✓ ':''}{word.answer}</span>
              <small>{word.answer.length} letras</small></summary>
            <p>{word.clue}</p>
          </details>)}
        </div>
      </div>)}
    </div>
    {finished&&<div className="ws-finish" role="dialog" aria-label="Sopa de letras completada">
      <strong>¡COMPLETASTE EL RETO!</strong>
      <p>{puzzle.words.length} palabras · {formatTime(elapsedMs)} · {score} puntos</p>
      <button type="button" onClick={()=>reset()}>Otra sopa de letras</button>
    </div>}
  </section>;
}
