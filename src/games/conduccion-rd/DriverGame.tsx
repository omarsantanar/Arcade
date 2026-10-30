import {useEffect,useRef,useState,type PointerEvent} from 'react';
import type {GameCallbacks} from '../types';
import {drawCockpit} from './cockpit';
import {
  advanceDrive,checkMirrors,currentLimit,currentNode,distance,driveGrade,lightColor,
  makeDrivingState,nextTurn,npcTraffic,pedestrianCrossing,remainingTime,
  setIndicator,shiftGear,toggleBelt,ZERO_CONTROLS,
  type DrivingControls,type DrivingState,type Gear,
} from './logic';

export interface DriverController {pause:()=>void;resume:()=>void;restart:()=>void;setMuted:(value:boolean)=>void}
interface Props {callbacks:GameCallbacks;controller:DriverController}
const BEST_KEY='arcade:driving-rd:best-v1';
const formatSeconds=(t:number)=>{const value=Math.ceil(t);return Math.floor(value/60).toString().padStart(2,'0')+':'+(value%60).toString().padStart(2,'0')};
const scoreBest=()=>{try{return Math.max(0,Number(localStorage.getItem(BEST_KEY))||0)}catch{return 0}};
const writeBest=(n:number)=>{try{localStorage.setItem(BEST_KEY,String(Math.max(scoreBest(),n)))}catch{/* optional */}};
export default function DriverGame({callbacks,controller}:Props){
  const [view,setView]=useState<DrivingState>(()=>makeDrivingState());
  const [best,setBest]=useState(scoreBest);
  const engine=useRef(view),controls=useRef<DrivingControls>({...ZERO_CONTROLS});
  const canvas=useRef<HTMLCanvasElement>(null),paused=useRef(false),muted=useRef(false);
  const {destination,score,gear,speed,indicator,belt,mirrorChecked,finished,completed}=view;
  const act=(fn:(s:DrivingState)=>DrivingState)=>{
    engine.current=fn(engine.current);
    setView({...engine.current});callbacks.onScore(engine.current.score);
  };
  useEffect(()=>{
    controller.pause=()=>{paused.current=true;controls.current={...ZERO_CONTROLS};callbacks.onStatus('paused');};
    controller.resume=()=>{paused.current=false;callbacks.onStatus('playing');};
    controller.restart=()=>{
      engine.current=makeDrivingState();controls.current={...ZERO_CONTROLS};paused.current=false;
      setView({...engine.current});callbacks.onStatus('playing');callbacks.onScore(100);
    };
    controller.setMuted=value=>{muted.current=value;};
    return ()=>{controls.current={...ZERO_CONTROLS};};
  });
  useEffect(()=>{
    const down=(event:KeyboardEvent)=>{
      const k=event.key.toLowerCase();
      if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))event.preventDefault();
      if(paused.current||engine.current.finished)return;
      if(k==='w'||k==='arrowup')controls.current.throttle=true;
      if(k==='s'||k==='arrowdown')controls.current.brake=true;
      if(k==='a'||k==='arrowleft')controls.current.left=true;
      if(k==='d'||k==='arrowright')controls.current.right=true;
      if(event.repeat)return;
      if(k==='c')act(toggleBelt);
      if(k==='m')act(checkMirrors);
      if(k==='q')act(s=>setIndicator(s,'left'));
      if(k==='e')act(s=>setIndicator(s,'right'));
      if(k==='g')act(s=>shiftGear(s,'D',controls.current.brake));
      if(k==='p')act(s=>shiftGear(s,'P',controls.current.brake));
      if(k==='r')act(s=>shiftGear(s,'R',controls.current.brake));
      if(k==='n')act(s=>shiftGear(s,'N',controls.current.brake));
    };
    const up=(event:KeyboardEvent)=>{
      const k=event.key.toLowerCase();
      if(k==='w'||k==='arrowup')controls.current.throttle=false;
      if(k==='s'||k==='arrowdown')controls.current.brake=false;
      if(k==='a'||k==='arrowleft')controls.current.left=false;
      if(k==='d'||k==='arrowright')controls.current.right=false;
    };
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    const blur=()=>{controls.current={...ZERO_CONTROLS};};
    window.addEventListener('blur',blur);
    return ()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  },[]);
  useEffect(()=>{
    let frame=0,last=performance.now(),display=0;
    const loop=(now:number)=>{
      const dt=Math.min(.06,(now-last)/1000);last=now;
      if(!paused.current&&!engine.current.finished){
        const prev=engine.current;
        engine.current=advanceDrive(prev,controls.current,dt);
        const cur=engine.current;
        if(cur.score!==prev.score)callbacks.onScore(cur.score);
        if(cur.finished&&!prev.finished){
          writeBest(cur.score);setBest(scoreBest());
          callbacks.onScore(cur.score);callbacks.onStatus('gameover');
        }
      }
      const context=canvas.current?.getContext('2d');
      if(context)drawCockpit(context,engine.current,controls.current);
      if(now-display>140){setView({...engine.current});display=now;}
      frame=requestAnimationFrame(loop);
    };
    frame=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(frame);
  },[callbacks]);
  const press=(name:keyof DrivingControls)=>(event:PointerEvent<HTMLButtonElement>)=>{
    event.preventDefault();controls.current[name]=true;
    if(name==='brake')act(s=>({...s,brakeReady:true}));
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const release=(name:keyof DrivingControls)=>(event:PointerEvent<HTMLButtonElement>)=>{
    controls.current[name]=false;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const node=currentNode(view),turn=nextTurn(view);
  const meters=node?Math.max(0,Math.round(distance(view,node))):0;
  const light=node&&node.kind==='semaforo'?lightColor(view.elapsed,view.index):null;
  const ped=node&&node.kind==='peatones'?pedestrianCrossing(view.elapsed,view.index):false;
  const need=node?.kind==='semaforo'?'SEMÁFORO '+(light??''):
    node?.kind==='pare'?'SEÑAL DE PARE':node?.kind==='peatones'?
    (ped?'PASO PEATONAL OCUPADO':'CRUCE PEATONAL'):'TRÁNSITO PESADO';
  return <section className="driving-game" aria-label="Simulador educativo de conducción en República Dominicana">
    <div className="driving-top">
      <div><strong>MANEJO RD · VISTA DEL CONDUCTOR</strong>
        <span>Interior ilustrativo tipo sedán automático 2001 · Destino: {destination}</span></div>
      <div className="driving-time">{formatSeconds(remainingTime(view))}<small>restantes</small></div>
    </div>
    <div className="driving-map"><canvas width={760} height={520} ref={canvas} role="img"
      aria-label="Vista desde el asiento del conductor, parabrisas, calle en perspectiva, tráfico, retrovisores, volante, tablero y navegación"/></div>
    <div className="driving-dashboard">
      <div><small>VELOCIDAD</small><strong>{Math.round(speed*3.6)} <small>km/h</small></strong></div>
      <div><small>LÍMITE VÍA</small><strong>{currentLimit(view)} <small>km/h</small></strong></div>
      <div><small>CAMBIO</small><strong>{gear}</strong></div>
      <div><small>EVALUACIÓN</small><strong>{score}<small>/100</small></strong></div>
    </div>
    <div className="driving-guidance" role="status">
      <div><span>PRÓXIMA SITUACIÓN · {meters} m</span><b>{need||'DESTINO'} — {turn==='recto'?'SEGUIR RECTO':'GIRAR '+turn.toUpperCase()}</b></div>
      <p>{view.feedback}</p>
    </div>
    <div className="driving-safety">
      <button type="button" className={belt?'active':''} onClick={()=>act(toggleBelt)} aria-pressed={belt}>
        {belt?'✓ Cinturón':'Cinturón (C)'}</button>
      <button type="button" className={mirrorChecked?'active':''} onClick={()=>act(checkMirrors)} aria-pressed={mirrorChecked}>
        {mirrorChecked?'✓ Espejos':'Revisar espejos (M)'}</button>
      <button type="button" className={indicator==='left'?'active':''} onClick={()=>act(s=>setIndicator(s,'left'))} aria-pressed={indicator==='left'}>
        ◀ Izquierda (Q)</button>
      <button type="button" className={indicator==='right'?'active':''} onClick={()=>act(s=>setIndicator(s,'right'))} aria-pressed={indicator==='right'}>
        Derecha (E) ▶</button>
    </div>
    <div className="driving-controls">
      <div className="driving-gears"><span>TRANSMISIÓN</span>
        {(['P','R','N','D'] as Gear[]).map(value=><button type="button" key={value}
          onClick={()=>act(s=>shiftGear(s,value,controls.current.brake))}
          aria-pressed={gear===value} className={gear===value?'active':''}>{value}</button>)}
      </div>
      <div className="driving-pedals">
        {([['left','◀','Volante a la izquierda'],['right','▶','Volante a la derecha'],
          ['brake','FRENO','Mantener freno'],['throttle','ACELERADOR','Mantener acelerador']] as const)
          .map(([name,symbol,label])=><button key={name} type="button" className={'pedal pedal-'+name}
            onPointerDown={press(name)} onPointerUp={release(name)} onPointerCancel={release(name)}
            onLostPointerCapture={()=>{controls.current[name]=false;}}
            aria-label={label}>{symbol}</button>)}
      </div>
    </div>
    <div className="driving-bottom">
      <p><b>Flechas del teclado:</b> ↑ acelerar · ↓ frenar · ← girar a la izquierda · → girar a la derecha. También funcionan W/S/A/D. <b>Otras teclas:</b> C cinturón · M espejos · Q/E direccionales · G cambio D (con freno) · P aparcar. En celular puedes usar todos los mandos táctiles; mantén presionados pedales y dirección.</p>
      <details><summary>Registro de decisiones y normas</summary>
        <ol>{view.events.map((event,i)=><li key={i}>{event}</li>)}</ol>
        <p>Ley 63-17, artículos 133–138, 235, 241, 264 y 266. Simulador no certificado.</p>
      </details>
      <span>Mejor evaluación local: {best||'—'} /100 · Sin afiliación con Toyota.</span>
    </div>
    {finished&&<div className="driving-finish" role="dialog" aria-label="Evaluación de conducción">
      <strong>{completed?'LLEGASTE AL DESTINO':'SE AGOTARON LOS CINCO MINUTOS'}</strong>
      <h3>{driveGrade(view)}</h3>
      <p>Seguridad: <b>{score}/100</b> · Infracciones didácticas: {view.infractions}</p>
      <p>Distancia recorrida: {Math.round(view.odometer)} m · Tiempo: {formatSeconds(view.elapsed)}</p>
      <p>Un conductor novel debe practicar con un instructor autorizado antes de salir a la vía pública.</p>
      <button onClick={()=>controller.restart()} type="button">Nueva ruta aleatoria</button>
    </div>}
  </section>;
}
