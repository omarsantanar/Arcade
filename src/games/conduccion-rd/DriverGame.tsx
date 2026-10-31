import {useEffect,useRef,useState,type PointerEvent} from 'react';
import type {GameCallbacks} from '../types';
import {drawCockpit} from './cockpit';
import {pedalForKey} from './input';
import {tiltAxis,steeringFromTilt,smoothSteering,type TiltSample} from './tilt';
import {
  advanceDrive,checkMirrors,currentLimit,currentNode,distance,driveGrade,lightColor,
  makeDrivingState,nextTurn,pedestrianCrossing,remainingTime,
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
  const [tiltOn,setTiltOn]=useState(false);
  const [tiltState,setTiltState]=useState<'off'|'asking'|'waiting'|'ready'|'denied'|'unsupported'>('off');
  const [sensitivity,setSensitivity]=useState(1);
  const [invertTilt,setInvertTilt]=useState(false);
  const [tiltDisplay,setTiltDisplay]=useState(0);
  const tiltEnabled=useRef(false);
  const tiltStatus=useRef('off');
  const latest=useRef<{value:number;angle:number;time:number}|null>(null);
  const neutral=useRef<number|null>(null);
  const filtered=useRef(0);
  const startedAt=useRef(0);
  const sensitivityRef=useRef(sensitivity),invertRef=useRef(invertTilt);
  sensitivityRef.current=sensitivity;invertRef.current=invertTilt;
  const engine=useRef(view),controls=useRef<DrivingControls>({...ZERO_CONTROLS});
  const canvas=useRef<HTMLCanvasElement>(null),paused=useRef(false),muted=useRef(false);
  const {destination,score,gear,speed,indicator,belt,mirrorChecked,finished,completed}=view;
  const updateTiltStatus=(status:typeof tiltState)=>{
    if(tiltStatus.current!==status){tiltStatus.current=status;setTiltState(status);}
  };
  const disableTilt=()=>{
    tiltEnabled.current=false;setTiltOn(false);neutral.current=null;
    filtered.current=0;controls.current.steer=undefined;
    latest.current=null;setTiltDisplay(0);updateTiltStatus('off');
  };
  const enableTilt=async()=>{
    if(tiltEnabled.current)return;
    if(!window.isSecureContext||!('DeviceOrientationEvent' in window)){
      updateTiltStatus('unsupported');return;
    }
    updateTiltStatus('asking');
    // iOS needs permission in a direct click/tap handler (never on page load).
    const ctor=DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?:()=>Promise<'granted'|'denied'>};
    try{
      if(typeof ctor.requestPermission==='function'){
        const permission=await ctor.requestPermission();
        if(permission!=='granted'){updateTiltStatus('denied');return;}
      }
      latest.current=null;neutral.current=null;filtered.current=0;
      startedAt.current=performance.now();tiltEnabled.current=true;
      setTiltOn(true);updateTiltStatus('waiting');
    }catch{updateTiltStatus('denied');}
  };
  const centerTilt=()=>{
    if(latest.current){neutral.current=latest.current.value;filtered.current=0;
      controls.current.steer=0;setTiltDisplay(0);}
  };
  useEffect(()=>{
    if(!tiltOn)return;
    const onOrientation=(event:DeviceOrientationEvent)=>{
      const screenAngle=window.screen.orientation?.angle ??
        ((window as Window & {orientation?:number}).orientation ?? 0);
      const sample:TiltSample={beta:event.beta,gamma:event.gamma,screenAngle};
      const value=tiltAxis(sample);
      if(value===null)return;
      const angle=((Math.round(screenAngle/90)*90)%360+360)%360;
      if(latest.current?.angle!==angle){neutral.current=null;filtered.current=0;}
      latest.current={value,angle,time:performance.now()};
      if(neutral.current===null)neutral.current=value;
      if(tiltStatus.current!=='ready')updateTiltStatus('ready');
    };
    window.addEventListener('deviceorientation',onOrientation);
    return ()=>window.removeEventListener('deviceorientation',onOrientation);
  },[tiltOn]);
  const act=(fn:(s:DrivingState)=>DrivingState)=>{
    engine.current=fn(engine.current);
    setView({...engine.current});callbacks.onScore(engine.current.score);
  };
  useEffect(()=>{
    controller.pause=()=>{paused.current=true;controls.current={...ZERO_CONTROLS};callbacks.onStatus('paused');};
    controller.resume=()=>{paused.current=false;callbacks.onStatus('playing');};
    controller.restart=()=>{
      engine.current=makeDrivingState();controls.current={...ZERO_CONTROLS};paused.current=false;
      filtered.current=0;neutral.current=latest.current?.value??null;setTiltDisplay(0);
      setView({...engine.current});callbacks.onStatus('playing');callbacks.onScore(100);
    };
    controller.setMuted=value=>{muted.current=value;};
    return ()=>{controls.current={...ZERO_CONTROLS};};
  });
  useEffect(()=>{
    const down=(event:KeyboardEvent)=>{
      const k=event.key.toLowerCase();
      const pedal=pedalForKey(k);
      if(pedal||k===' ')event.preventDefault();
      if(paused.current||engine.current.finished)return;
      if(pedal)controls.current[pedal]=true;
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
      const pedal=pedalForKey(k);
      if(pedal)controls.current[pedal]=false;
    };
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    const blur=()=>{controls.current={...ZERO_CONTROLS};filtered.current=0;};
    window.addEventListener('blur',blur);
    return ()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  },[]);
  useEffect(()=>{
    let frame=0,last=performance.now(),display=0,lastPaint=0;
    const loop=(now:number)=>{
      const dt=Math.min(.06,(now-last)/1000);last=now;
      if(!paused.current&&!engine.current.finished){
        if(tiltEnabled.current){
          const sample=latest.current;
          const good=!!sample&&now-sample.time<1600&&neutral.current!==null;
          if(good&&sample){
            const next=steeringFromTilt(sample.value,neutral.current!,sensitivityRef.current,invertRef.current);
            filtered.current=smoothSteering(filtered.current,next,dt);
            controls.current.steer=filtered.current;
          }else{
            filtered.current=smoothSteering(filtered.current,0,dt);
            controls.current.steer=filtered.current;
            if(now-startedAt.current>3000&&tiltStatus.current!=='waiting')
              updateTiltStatus('waiting');
          }
        }else controls.current.steer=undefined;
        const prev=engine.current;
        engine.current=advanceDrive(prev,controls.current,dt);
        const cur=engine.current;
        if(cur.score!==prev.score)callbacks.onScore(cur.score);
        if(cur.finished&&!prev.finished){
          writeBest(cur.score);setBest(scoreBest());
          callbacks.onScore(cur.score);callbacks.onStatus('gameover');
        }
      }
      if(now-lastPaint>32){
        const context=canvas.current?.getContext('2d');
        if(context)drawCockpit(context,engine.current,controls.current);
        lastPaint=now;
      }
      if(now-display>140){
        setView({...engine.current});
        if(tiltEnabled.current)setTiltDisplay(Math.round(filtered.current*100));
        display=now;
      }
      frame=requestAnimationFrame(loop);
    };
    frame=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(frame);
  },[callbacks]);
  const press=(name:keyof DrivingControls)=>(event:PointerEvent<HTMLButtonElement>)=>{
    event.preventDefault();
    if(paused.current||engine.current.finished)return;
    controls.current[name]=true;
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
  return <section className="driving-game" data-steering={tiltOn?"tilt":"buttons"} aria-label="Simulador educativo de conducción en República Dominicana">
    <div className="driving-top">
      <div><strong>MANEJO RD · VISTA DEL CONDUCTOR</strong>
        <span>Interior ilustrativo tipo sedán automático 2001 · Destino: {destination}</span></div>
      <div className="driving-time">{formatSeconds(remainingTime(view))}<small>restantes</small></div>
    </div>
    <div className="driving-tilt-panel" aria-label="Controles de dirección del celular">
      {!tiltOn?
        <button type="button" onClick={enableTilt} disabled={tiltState==='asking'} className="driving-tilt-activate">
          {tiltState==='asking'?'Solicitando permiso…':'Activar inclinación'}</button>:
        <>
          <span className="driving-tilt-meter" aria-live="off">Giro {tiltDisplay>0?'+':''}{tiltDisplay}%</span>
          <button type="button" onClick={centerTilt} disabled={tiltState!=='ready'}>Centrar</button>
          <button type="button" onClick={()=>setInvertTilt(v=>!v)} aria-pressed={invertTilt}>Invertir</button>
          <button type="button" onClick={disableTilt}>Botones</button>
        </>}
      {tiltOn&&<label className="driving-tilt-sens">Sensibilidad
        <input type="range" min="0.6" max="2" step="0.2" value={sensitivity}
          onChange={e=>setSensitivity(Number(e.target.value))} aria-label="Sensibilidad de inclinación"/>
      </label>}
      <small role="status">{tiltState==='ready'?'Inclina el móvil para girar. Usa Centrar en tu posición cómoda.':
        tiltState==='waiting'?'Buscando sensor… Si no responde, usa Botones.':
        tiltState==='denied'?'Permiso denegado: activa sensores en los ajustes o usa los botones.':
        tiltState==='unsupported'?'Sin sensor o HTTPS. Conduce con botones o teclado.':
        tiltState==='asking'?'Confirma el permiso de movimiento del teléfono.':
        'Móvil: activa la inclinación. Los pedales siguen siendo táctiles.'}</small>
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
      <p><b>En móvil:</b> pulsa «Activar inclinación», mantén el teléfono cómodo y utiliza «Centrar». Inclínalo para girar; los botones Freno y Acelerador siguen disponibles con los pulgares. Si el navegador deniega el sensor, usa «Botones». El juego no conserva lecturas de orientación. <b>Flechas del teclado:</b> ↑ acelerar · ↓ frenar · ← girar a la izquierda · → girar a la derecha. También funcionan W/S/A/D. <b>Otras teclas:</b> C cinturón · M espejos · Q/E direccionales · G cambio D (con freno) · P aparcar. En celular puedes usar todos los mandos táctiles; mantén presionados pedales y dirección.</p>
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
