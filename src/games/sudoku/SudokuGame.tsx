import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameCallbacks } from '../types';
import {
  SUDOKU_LEVEL_KEY,SUDOKU_RECORDS_KEY,SUDOKU_SAVE_KEY,copyGrid,generateSudoku,
  INTRO_TIPS,
  saveSudokuBestScore,
  qualityFor,safeStoredLevel,isSolved,isValidPlacement,conflictCells,validSavedGame,
  type SudokuPuzzle,type SudokuQuality,type SudokuSave,
} from './logic';

export interface SudokuController {
  pause:()=>void;resume:()=>void;restart:()=>void;
}
interface Props {callbacks:GameCallbacks;controller:SudokuController}
interface Session {puzzle:SudokuPuzzle;entered:number[][];elapsedMs:number}
function localGet(key:string):string|null{try{return window.localStorage.getItem(key);}catch{return null;}}
function localSet(key:string,value:string){try{window.localStorage.setItem(key,value);}catch{/* optional */}}
function loadSession():Session{
  try{
    const stored=JSON.parse(localGet(SUDOKU_SAVE_KEY)||'null') as unknown;
    if(validSavedGame(stored)){
      const restored=stored as SudokuSave;
      const size=restored.puzzle.length as 4|9;
      return {puzzle:{level:restored.level,size,box:(size===4?2:3) as 2|3,
        puzzle:restored.puzzle,solution:restored.solution,
        clues:restored.puzzle.flat().filter(Boolean).length,
        intro:restored.level<=3?INTRO_TIPS[restored.level-1]:null},
        entered:restored.entered,elapsedMs:restored.elapsedMs};
    }
  }catch{/* unreadable old storage */}
  const level=safeStoredLevel(localGet(SUDOKU_LEVEL_KEY));
  const puzzle=generateSudoku(level);
  return {puzzle,entered:copyGrid(puzzle.puzzle),elapsedMs:0};
}
function persist(session:Session){
  const data:SudokuSave={level:session.puzzle.level,puzzle:session.puzzle.puzzle,
    solution:session.puzzle.solution,entered:session.entered,elapsedMs:session.elapsedMs};
  localSet(SUDOKU_SAVE_KEY,JSON.stringify(data));
}
function seconds(ms:number){const s=Math.floor(ms/1000);return Math.floor(s/60).toString().padStart(2,'0')+':'+(s%60).toString().padStart(2,'0');}
function readLevelBest(level:number):number|null{
  try{
    const records=JSON.parse(localGet(SUDOKU_RECORDS_KEY)||'{}') as Record<string,number>;
    const time=Number(records[String(level)]);
    return Number.isFinite(time)&&time>0?time:null;
  }catch{return null;}
}
function saveLevelBest(level:number,elapsedMs:number){
  try{
    const records=JSON.parse(localGet(SUDOKU_RECORDS_KEY)||'{}') as Record<string,number>;
    const before=Number(records[String(level)])||Infinity;
    records[String(level)]=Math.min(before,elapsedMs);
    localSet(SUDOKU_RECORDS_KEY,JSON.stringify(records));
  }catch{/* optional */}
}
function nextEmpty(grid:number[][],initialRow:number,initialCol:number):[number,number]{
  const size=grid.length,from=initialRow*size+initialCol;
  for(let offset=1;offset<=size*size;offset++){
    const index=(from+offset)%(size*size),r=Math.floor(index/size),c=index%size;
    if(!grid[r][c])return [r,c];
  }
  return [initialRow,initialCol];
}
export default function SudokuGame({callbacks,controller}:Props){
  const [session,setSession]=useState<Session>(loadSession);
  const [selected,setSelected]=useState<[number,number]>([0,0]);
  const [paused,setPaused]=useState(false);
  const [finish,setFinish]=useState<SudokuQuality|null>(null);
  const [candidateHelp,setCandidateHelp]=useState(false);
  const {puzzle,entered,elapsedMs}=session;
  const conflicts=useMemo(()=>conflictCells(entered),[entered]);
  const completed=isSolved(entered);
  const row=selected[0],col=selected[1],fixed=puzzle.puzzle[row][col]!==0;
  const levelBest=readLevelBest(puzzle.level);
  const digits=Array.from({length:puzzle.size},(_,i)=>i+1);
  const options=digits.filter(n=>isValidPlacement(entered,row,col,n));
  const difficulty=puzzle.level<=3?'APRENDIZAJE':puzzle.level<=5?'EXIGENTE':puzzle.level<=7?'AVANZADO':'EXTREMO';

  useEffect(()=>{
    controller.pause=()=>{setPaused(true);callbacks.onStatus('paused');};
    controller.resume=()=>{setPaused(false);callbacks.onStatus('playing');};
    controller.restart=()=>{
      setSession(old=>({...old,entered:copyGrid(old.puzzle.puzzle),elapsedMs:0}));
      setFinish(null);setCandidateHelp(false);setPaused(false);callbacks.onScore(0);
      callbacks.onStatus('playing');
    };
  },[controller,callbacks]);

  useEffect(()=>{
    if(paused||finish||completed)return;
    let last=performance.now();
    const timer=window.setInterval(()=>{
      const now=performance.now(),delta=now-last;last=now;
      if(document.visibilityState==='visible')setSession(old=>({...old,elapsedMs:old.elapsedMs+Math.max(0,Math.min(300,delta))}));
    },200);
    return ()=>window.clearInterval(timer);
  },[paused,finish,completed]);

  useEffect(()=>{
    if(!finish&&!completed)persist(session);
  },[session,finish,completed]);

  useEffect(()=>{
    if(!completed||finish)return;
    const quality=qualityFor(puzzle.level,elapsedMs);
    setFinish(quality);
    saveLevelBest(puzzle.level,elapsedMs);
    localSet(SUDOKU_LEVEL_KEY,String(puzzle.level+1));
    try{window.localStorage.removeItem(SUDOKU_SAVE_KEY);}catch{/* optional */}
    saveSudokuBestScore(quality.points);
    callbacks.onScore(quality.points);
  },[completed,finish,elapsedMs,puzzle.level,callbacks]);

  const enter=useCallback((value:number)=>{
    if(paused||finish||fixed)return;
    setSession(old=>{
      const updated=copyGrid(old.entered);
      updated[row][col]=value;
      return {...old,entered:updated};
    });
    setCandidateHelp(false);
    if(value>0)setSelected(old=>nextEmpty(entered,old[0],old[1]));
  },[row,col,paused,finish,fixed,entered]);

  useEffect(()=>{
    const handleKey=(event:KeyboardEvent)=>{
      if(paused||finish)return;
      const k=event.key;
      if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(k)){
        event.preventDefault();
        setSelected(([r,c])=>{
          const size=puzzle.size;
          return k==='ArrowUp'?[(r+size-1)%size,c]:k==='ArrowDown'?[(r+1)%size,c]:
            k==='ArrowLeft'?[r,(c+size-1)%size]:[r,(c+1)%size];
        });
        setCandidateHelp(false);
      }else if((k==='Backspace'||k==='Delete'||k==='0')){event.preventDefault();enter(0);}
      else if(/^[1-9]$/.test(k)&&Number(k)<=puzzle.size){event.preventDefault();enter(Number(k));}
    };
    window.addEventListener('keydown',handleKey);
    return ()=>window.removeEventListener('keydown',handleKey);
  },[paused,finish,puzzle.size,enter]);

  const advance=()=>{
    const level=puzzle.level+1;
    const next=generateSudoku(level);
    localSet(SUDOKU_LEVEL_KEY,String(level));
    setSession({puzzle:next,entered:copyGrid(next.puzzle),elapsedMs:0});
    setSelected([0,0]);setFinish(null);setCandidateHelp(false);
    callbacks.onScore(0);callbacks.onStatus('playing');
  };
  const saveTime=seconds(elapsedMs);
  return <section className="sudoku-game" aria-label="Sudoku de velocidad">
    <header className="sudoku-top">
      <span className="sudoku-kicker">SUDOKU / NIVEL {puzzle.level.toString().padStart(2,'0')}</span>
      <strong className="sudoku-clock" aria-label={'Tiempo transcurrido '+saveTime}>{saveTime}</strong>
    </header>
    <div className="sudoku-level-row"><strong>{difficulty}</strong>
      <span>{puzzle.size} × {puzzle.size} · {puzzle.clues} cifras dadas</span></div>
    <p className="sudoku-instruction">{puzzle.intro||'Sin pistas. Resuelve el tablero lo más rápido posible: filas, columnas y cuadros sin repetir.'}</p>
    <div className={'sudoku-board '+(puzzle.size===4?'sudoku-four':'sudoku-nine')}
       role="grid" aria-label={'Tablero de sudoku '+puzzle.size+' por '+puzzle.size}
       style={{gridTemplateColumns:'repeat('+puzzle.size+',1fr)'}}>
      {entered.map((values,r)=>values.map((n,c)=>{
        const original=puzzle.puzzle[r][c]!==0;
        const box=Math.floor(r/puzzle.box)===Math.floor(row/puzzle.box)&&
          Math.floor(c/puzzle.box)===Math.floor(col/puzzle.box);
        const active=row===r&&col===c;
        const wrong=conflicts.has(r*puzzle.size+c);
        const related=!active&&(r===row||c===col||box);
        const same=n!==0&&n===entered[row][col];
        const classes=['sudoku-cell',original?'given':'editable',active?'selected':'',
          related?'related':'',wrong?'conflict':'',same?'same':'',
          (c+1)%puzzle.box===0&&c!==puzzle.size-1?'box-right':'',
          (r+1)%puzzle.box===0&&r!==puzzle.size-1?'box-bottom':''].filter(Boolean).join(' ');
        return <button type="button" role="gridcell" aria-selected={active} key={r+'-'+c}
          className={classes} onClick={()=>{setSelected([r,c]);setCandidateHelp(false);}}
          disabled={paused||!!finish} aria-label={'Fila '+(r+1)+', columna '+(c+1)+', '+(n||'vacía')+(original?', pista fija':'')}
          tabIndex={active?0:-1}>{n||''}</button>;
      }))}
    </div>
    <div className="sudoku-help-line" aria-live="polite">
      {puzzle.level<=3?(candidateHelp?'En esta casilla caben: '+(options.join(', ')||'ninguno; revisa otras cifras'):
       'Aprende las reglas en el tablero · toca «Ver opciones»'):(
       conflicts.size?'Hay números repetidos. Comprueba las casillas resaltadas.':
       'Cada acierto depende de tu lógica. El cronómetro determina tu clasificación.')}
    </div>
    <div className={'sudoku-numpad '+(puzzle.size===4?'intro':'')} aria-label="Teclado numérico">
      {digits.map(n=><button key={n} type="button" onClick={()=>enter(n)} disabled={paused||!!finish||fixed}
          aria-label={'Escribir '+n}>{n}</button>)}
    </div>
    <div className="sudoku-actions">
      <button type="button" disabled={paused||!!finish||fixed} onClick={()=>enter(0)}>Borrar celda</button>
      {puzzle.level<=3&&<button type="button" disabled={paused||!!finish} onClick={()=>setCandidateHelp(v=>!v)}>
        {candidateHelp?'Ocultar opciones':'Ver opciones'}</button>}
      <span className="sudoku-best">Mejor nivel: {levelBest===null?'—':seconds(levelBest)}</span>
    </div>
    {paused&&<div className="sudoku-internal-overlay" role="status">PARTIDA EN PAUSA</div>}
    {finish&&<div className="sudoku-finish" role="dialog" aria-label="Sudoku completado">
      <span className="sudoku-kicker">TABLERO COMPLETADO</span>
      <h3>{finish.label}</h3>
      <div className="sudoku-stars" aria-label={finish.stars+' de 5 estrellas'}>{'★'.repeat(finish.stars)+'☆'.repeat(5-finish.stars)}</div>
      <p>Tu tiempo: <strong>{saveTime}</strong></p>
      <p>Referencia de este nivel: {seconds(finish.targetMs)}</p>
      <p>Índice de velocidad: <strong>{finish.points} puntos</strong></p>
      <button type="button" onClick={advance} className="sudoku-next">
        {puzzle.level===3?'Comenzar desafío 9×9':'Siguiente nivel aleatorio'} →
      </button>
    </div>}
  </section>;
}
