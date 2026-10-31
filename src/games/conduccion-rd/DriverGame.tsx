import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {screenRoll,tiltToSteer,smoothSteer,isSensorRecent,TILT_DEFAULTS,
  type TiltSettings} from './tilt';
import type {GameCallbacks} from '../types';
import {drawCockpit} from './cockpit';
import {pedalForKey} from './input';
import {
  advanceDrive,checkMirrors,currentLimit,currentNode,distance,driveGrade,lightColor,
  makeDrivingState,nextTurn,pedestrianCrossing,remainingTime,
  setIndicator,shiftGear,toggleBelt,ZERO_CONTROLS,
  type DrivingControls,type DrivingState,type Gear,
} from './logic';

export interface DriverController {pause:()=>void;resume:()=>void;restart:()=>void;setMuted:(value:boolean)=>void}
interface Props {callbacks:GameCallbacks;controller:DriverController}
const BEST_KEY='arcade:driving-rd:best-v1';
const TILT_SETTINGS_KEY='arcade:driving-rd:tilt-settings-v1';
type TiltStatus='off'|'awaiting'|'calibrate'|'active'|'denied'|'unavailable'|'stale';
type TiltDeviceState={enabled:boolean;neutral:number|null;lastRoll:number|null;lastSampleAt:number;
  angle:number;steer:number;startedAt:number;};
const readTiltSettings=():TiltSettings=>{
  try{
    const raw=JSON.parse(localStorage.getItem(TILT_SETTINGS_KEY)||'null') as Partial<TiltSettings>|null;
    return {sensitivity:Math.max(12,Math.min(45,Number(raw?.sensitivity)||TILT_DEFAULTS.sensitivity)),
      inverted:raw?.inverted===true};
  }catch{return {...TILT_DEFAULTS};}
};
const formatSeconds=(t:number)=>{const value=Math.ceil(t);return Math.floor(value/60).toString().padStart(2,'0')+':'+(value%60).toString().padStart(2,'0')};
const scoreBest=()=>{try{return Math.max(0,Number(localStorage.getItem(BEST_KEY))||0)}catch{return 0}};
const writeBest=(n:number)=>{try{localStorage.setItem(BEST_KEY,String(Math.max(scoreBest(),n)))}catch{/* optional */}};
export default function DriverGame({callbacks,controller}:Props){
  const [view,setView]=useState<DrivingState>(()=>makeDrivingState());
  const [best,setBest]=useState(scoreBest);
  const [tiltStatus,setTiltStatus]=useState<TiltStatus>('off');
  const [tiltSettings,setTiltSettings]=useState<TiltSettings>(readTiltSettings);
  const tiltConfig=useRef(tiltSettings);
  tiltConfig.current=tiltSettings;
  const [tiltMeter,setTiltMeter]=useState(0);
  const tilt=useRef<TiltDeviceState>({enabled:false,neutral:null,lastRoll:null,
    lastSampleAt:0,angle:0,steer:0,startedAt:0});
  const engine=useRef(view),controls=useRef<DrivingControls>({...ZERO_CONTROLS});
  const canvas=useRef<HTMLCanvasElement>(null),paused=useRef(false),muted=useRef(false);
  const {destination,score,gear,speed,indicator,belt,mirrorChecked,finished,completed}=view;
  const disableTilt=()=>{
    tilt.current.enabled=false;tilt.current.neutral=null;tilt.current.steer=0;
    controls.current.steer=0;setTiltStatus('off');setTiltMeter(0);
  };
  const enableTilt=async()=>{
    if(!window.isSecureContext||!('DeviceOrientationEvent' in window)){
      setTiltStatus('unavailable');return;
    }
    try{
      // Must be called directly from this user-gesture handler on iOS Safari.
      const ctor=window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?:()=>Promise<'granted'|'denied'>};
      const permission=typeof ctor.requestPermission==='function'?
        await ctor.requestPermission(): 'granted';
      if(permission!=='granted'){
        disableTilt();setTiltStatus('denied');return;
      }
      const sensor=tilt.current;
      sensor.enabled=true;sensor.neutral=null;sensor.lastRoll=null;sensor.steer=0;
      sensor.lastSampleAt=0;sensor.startedAt=performance.now();
      sensor.angle=screen.orientation?.angle??0;
      controls.current.steer=0;
      setTiltMeter(0);setTiltStatus('awaiting');
    }catch{
      disableTilt();setTiltStatus('denied');
    }
  };
  const calibrateTilt=()=>{
    const sensor=tilt.current;
    if(!sensor.enabled||sensor.lastRoll===null){setTiltStatus('awaiting');return;}
    sensor.neutral=sensor.lastRoll;sensor.steer=0;
    controls.current.steer=0;
    setTiltMeter(0);setTiltStatus('active');
  };
  const updateTiltSettings=(next:TiltSettings)=>{
    tiltConfig.current=next;setTiltSettings(next);
    try{localStorage.setItem(TILT_SETTINGS_KEY,JSON.stringify(next));}catch{/* optional */}
  };
  const act=(fn:(s:DrivingState)=>DrivingState)=>{
    engine.current=fn(engine.current);
    setView({...engine.current});callbacks.onScore(engine.current.score);
  };
  useEffect(()=>{
    const orientation=(event:DeviceOrientationEvent)=>{
      const current=tilt.current;
      if(!current.enabled)return;
      const angle=screen.orientation?.angle??0;
      if(angle!==current.angle){
        current.angle=angle;current.neutral=null;current.steer=0;
        controls.current.steer=0;setTiltStatus('calibrate');
      }
      const roll=screenRoll({beta:event.beta,gamma:event.gamma},angle);
      if(roll===null)return;
      current.lastRoll=roll;current.lastSampleAt=performance.now();
      if(current.neutral===null)return;
      setTiltStatus(status=>status==='stale'?'active':status);
    };
    const orientationChange=()=>{
      if(tilt.current.enabled){
        tilt.current.neutral=null;tilt.current.steer=0;controls.current.steer=0;
        tilt.current.angle=screen.orientation?.angle??0;
        setTiltStatus('calibrate');
      }
    };
    window.addEventListener('deviceorientation',orientation);
    screen.orientation?.addEventListener?.('change',orientationChange);
    return ()=>{
      window.removeEventListener('deviceorientation',orientation);
      screen.orientation?.removeEventListener?.('change',orientationChange);
      tilt.current.enabled=false;
      controls.current.steer=0;
    };
  },[]);
  useEffect(()=>{
    controller.pause=()=>{paused.current=true;controls.current={...ZERO_CONTROLS};callbacks.onStatus('paused');};
    controller.resume=()=>{paused.current=false;callbacks.onStatus('playing');};
    controller.restart=()=>{
      engine.current=makeDrivingState();controls.current={...ZERO_CONTROLS};paused.current=false;
      tilt.current.steer=0;
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
    const blur=()=>{controls.current={...ZERO_CONTROLS};};
    window.addEventListener('blur',blur);
    return ()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  },[]);
  useEffect(()=>{
    let frame=0,last=performance.now(),display=0,lastPaint=0;
    const loop=(now:number)=>{
      const dt=Math.min(.06,(now-last)/1000);last=now;
      if(!paused.current&&!engine.current.finished){
        const sensor=tilt.current,nowMs=performance.now();
        if(sensor.enabled){
          if(sensor.neutral!==null&&sensor.lastRoll!==null&&
            isSensorRecent(sensor.lastSampleAt,nowMs)){
            const requested=tiltToSteer(sensor.lastRoll,sensor.neutral,tiltConfig.current);
            sensor.steer=smoothSteer(sensor.steer,requested,dt);
          }else{
            sensor.steer=smoothSteer(sensor.steer,0,dt);
            if(sensor.neutral!==null&&nowMs-sensor.lastSampleAt>1250)
              setTiltStatus(current=>current==='stale'?current:'stale');
            if(sensor.neutral===null&&sensor.lastSampleAt===0&&
              nowMs-sensor.startedAt>3200){
              sensor.enabled=false;setTiltStatus('unavailable');
            }
          }
          controls.current.steer=sensor.steer;
        }else controls.current.steer=0;
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
        setTiltMeter(tilt.current.steer);
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
  return <section className="driving-game" aria-label="Simulador educativo de conducción en República Dominicana">
    <div className="driving-top">
      <div><strong>MANEJO RD · VISTA DEL CONDUCTOR</strong>
        <span>Interior ilustrativo tipo sedán automático 2001 · Destino: {destination}</span></div>
      <div className="driving-time">{formatSeconds(remainingTime(view))}<small>restantes</small></div>
    </div>
    <div className="driving-map"><canvas width={760} height={520} ref={canvas} role="img"
      aria-label="Vista desde el asiento del conductor, parabrisas, calle en perspectiva, tráfico, retrovisores, volante, tablero y navegación"/>
      <div className="driving-road-controls" aria-label="Mandos de conducción en pantalla horizontal">
        <div className="driving-road-top">
          <span>{Math.round(speed*3.6)} km/h · {formatSeconds(remainingTime(view))}</span>
          <button type="button" onClick={tilt.current.enabled?disableTilt:()=>void enableTilt()}>
            {tilt.current.enabled?'Desactivar inclinación':'Activar inclinación'}
          </button>
          {tilt.current.enabled&&<button type="button" onClick={calibrateTilt}>Centrar</button>}
          {view.parked&&<><button type="button" onClick={()=>act(toggleBelt)}>
            {belt?'✓ Cinturón':'Cinturón'}</button>
            <button type="button" onClick={()=>act(checkMirrors)}>
              {mirrorChecked?'✓ Espejos':'Espejos'}</button></>}
        </div>
        <div className="driving-road-bottom">
          <div className="driving-road-left">
            <div className="driving-touch-dual">
              {(['left','right'] as const).map(side=><button key={side}
                type="button" className="road-turn" aria-label={'Girar '+side}
                onPointerDown={press(side)} onPointerUp={release(side)}
                onPointerCancel={release(side)}
                onLostPointerCapture={()=>{controls.current[side]=false;}}>
                {side==='left'?'◀':'▶'}</button>)}
            </div>
            <div className="driving-touch-dual">
              <button type="button" onClick={()=>act(s=>setIndicator(s,'left'))}
                aria-label="Intermitente izquierdo">⇦</button>
              <button type="button" onClick={()=>act(s=>setIndicator(s,'right'))}
                aria-label="Intermitente derecho">⇨</button>
            </div>
            <div className="driving-mini-gears">
              {(['P','R','N','D'] as Gear[]).map(value=><button key={value} type="button"
                className={gear===value?'active':''} aria-pressed={gear===value}
                onClick={()=>act(s=>shiftGear(s,value,controls.current.brake))}>{value}</button>)}
            </div>
          </div>
          <div className="driving-road-right">
            {([['brake','FRENO'],['throttle','GAS']] as const).map(([name,label])=>
              <button key={name} type="button" className={'road-pedal road-'+name}
                aria-label={label} onPointerDown={press(name)} onPointerUp={release(name)}
                onPointerCancel={release(name)}
                onLostPointerCapture={()=>{controls.current[name]=false;}}>{label}</button>)}
          </div>
        </div>
      </div>
    </div>
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
    <div className="driving-tilt" aria-label="Configuración de giro por inclinación">
      <div className="driving-tilt-heading"><strong>Conducción por inclinación</strong>
        <span aria-live="polite">{tiltStatus==='active'?'Activo · inclina suavemente el móvil':
          tiltStatus==='awaiting'?'Mantén el móvil centrado y pulsa Calibrar':
          tiltStatus==='calibrate'?'Se giró la pantalla: vuelve a calibrar':
          tiltStatus==='denied'?'Permiso rechazado · usa flechas táctiles':
          tiltStatus==='unavailable'?'Sensor no disponible · usa flechas táctiles':
          tiltStatus==='stale'?'Sin datos recientes · dirección táctil disponible':
          'Opcional · disponible en celulares con sensor'}</span></div>
      <button type="button" onClick={tilt.current.enabled?disableTilt:()=>void enableTilt()}>
        {tilt.current.enabled?'Desactivar':'Activar inclinación'}</button>
      {tilt.current.enabled&&<button type="button" onClick={calibrateTilt}>Calibrar centro</button>}
      <label htmlFor="driving-tilt-sensitivity">Sensibilidad
        <input id="driving-tilt-sensitivity" type="range" min="12" max="45" step="1"
          value={tiltSettings.sensitivity}
          onChange={event=>updateTiltSettings({...tiltSettings,sensitivity:Number(event.target.value)})}/>
      </label>
      <button type="button" aria-pressed={tiltSettings.inverted}
        onClick={()=>updateTiltSettings({...tiltSettings,inverted:!tiltSettings.inverted})}>
        {tiltSettings.inverted?'Dirección invertida':'Invertir dirección'}
      </button>
      <div className="driving-tilt-meter" aria-label={'Dirección '+Math.round(tiltMeter*100)+' por ciento'}>
        <i style={{left:(50+tiltMeter*45)+'%'}}/></div>
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
