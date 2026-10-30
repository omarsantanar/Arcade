import {useEffect,useRef,useState,type PointerEvent} from 'react';
import type {GameCallbacks} from '../types';
import {
  advanceDrive,checkMirrors,currentLimit,currentNode,distance,driveGrade,lightColor,
  makeDrivingState,nextTurn,npcTraffic,pedestrianCrossing,record,remainingTime,
  setIndicator,shiftGear,toggleBelt,ZERO_CONTROLS,BLOCK_METERS,
  type DrivingControls,type DrivingState,type Gear,type Indicator,type Point,
} from './logic';

export interface DriverController {pause:()=>void;resume:()=>void;restart:()=>void;setMuted:(value:boolean)=>void}
interface Props {callbacks:GameCallbacks;controller:DriverController}
const BEST_KEY='arcade:driving-rd:best-v1';
const formatSeconds=(t:number)=>{const value=Math.ceil(t);return Math.floor(value/60).toString().padStart(2,'0')+':'+(value%60).toString().padStart(2,'0')};
const scoreBest=()=>{try{return Math.max(0,Number(localStorage.getItem(BEST_KEY))||0)}catch{return 0}};
const writeBest=(n:number)=>{try{localStorage.setItem(BEST_KEY,String(Math.max(scoreBest(),n)))}catch{/* optional */}};
function carShape(ctx:CanvasRenderingContext2D,x:number,y:number,angle:number,color:string,bus=false,indicator:'left'|'right'|'off'='off'){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);
  const width=bus?23:17,length=bus?55:35;
  ctx.fillStyle='#07111f';ctx.fillRect(-width/2-2,-length/2-2,width+4,length+4);
  ctx.fillStyle=color;ctx.fillRect(-width/2,-length/2,width,length);
  ctx.fillStyle=bus?'#1e536a':'#a2d8dd';ctx.fillRect(-width/2+2,-length/2+6,width-4,bus?10:8);
  ctx.fillRect(-width/2+2,length/2-11,width-4,6);
  ctx.fillStyle='#fcf3c3';ctx.fillRect(-width/2,-length/2,4,4);ctx.fillRect(width/2-4,-length/2,4,4);
  ctx.fillStyle='#f14d63';ctx.fillRect(-width/2,length/2-4,4,4);ctx.fillRect(width/2-4,length/2-4,4,4);
  if(indicator!=='off'){
    ctx.fillStyle='#ffd15a';
    if(indicator==='left'){ctx.fillRect(-width/2-3,-length/2,4,6);ctx.fillRect(-width/2-3,length/2-6,4,6);}
    else {ctx.fillRect(width/2-1,-length/2,4,6);ctx.fillRect(width/2-1,length/2-6,4,6);}
  }
  if(bus){ctx.fillStyle='#fff6e2';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('BUS',0,2);}
  ctx.restore();
}
function drawCity(ctx:CanvasRenderingContext2D,s:DrivingState){
  const W=760,H=520,scale=1.42;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#152e2d';ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(W/2-s.x*scale,H*.58-s.y*scale);ctx.scale(scale,scale);
  const left=s.x-430,right=s.x+430,top=s.y-370,bottom=s.y+370;
  const firstX=Math.floor(left/BLOCK_METERS)-1,lastX=Math.ceil(right/BLOCK_METERS)+1;
  const firstY=Math.floor(top/BLOCK_METERS)-1,lastY=Math.ceil(bottom/BLOCK_METERS)+1;
  // Sidewalks, roads, lane markings and invented buildings.
  ctx.fillStyle='#86958e';
  for(let ix=firstX;ix<=lastX;ix++)ctx.fillRect(ix*BLOCK_METERS-52,top-60,104,bottom-top+120);
  for(let iy=firstY;iy<=lastY;iy++)ctx.fillRect(left-60,iy*BLOCK_METERS-52,right-left+120,104);
  ctx.fillStyle='#38444c';
  for(let ix=firstX;ix<=lastX;ix++)ctx.fillRect(ix*BLOCK_METERS-43,top-60,86,bottom-top+120);
  for(let iy=firstY;iy<=lastY;iy++)ctx.fillRect(left-60,iy*BLOCK_METERS-43,right-left+120,86);
  ctx.strokeStyle='#c1c4c0';ctx.lineWidth=1;ctx.setLineDash([15,16]);
  for(let ix=firstX;ix<=lastX;ix++){
    ctx.beginPath();ctx.moveTo(ix*BLOCK_METERS,top-60);ctx.lineTo(ix*BLOCK_METERS,bottom+60);ctx.stroke();
  }
  for(let iy=firstY;iy<=lastY;iy++){
    ctx.beginPath();ctx.moveTo(left-60,iy*BLOCK_METERS);ctx.lineTo(right+60,iy*BLOCK_METERS);ctx.stroke();
  }
  ctx.setLineDash([]);
  for(let ix=firstX;ix<lastX;ix++)for(let iy=firstY;iy<lastY;iy++){
    const x=ix*BLOCK_METERS+57,y=iy*BLOCK_METERS+57;
    ctx.fillStyle=(ix+iy)%3===0?'#4c6262':'#55665c';
    ctx.fillRect(x,y,123,120);
    ctx.fillStyle='#2b3b3c';ctx.fillRect(x+11,y+12,56,36);ctx.fillRect(x+76,y+12,35,69);
    ctx.fillStyle='#abc49c';
    for(let a=0;a<4;a++)for(let b=0;b<3;b++)ctx.fillRect(x+17+a*11,y+18+b*10,5,4);
    ctx.fillStyle='#4d956e';
    for(let t=0;t<3;t++){ctx.beginPath();ctx.arc(x+16+t*45,y+104,8,0,Math.PI*2);ctx.fill();}
  }
  // Crosswalks and safe stop lines.
  for(let ix=firstX;ix<=lastX;ix++)for(let iy=firstY;iy<=lastY;iy++){
    const x=ix*BLOCK_METERS,y=iy*BLOCK_METERS;
    ctx.fillStyle='#d8d9cc';
    for(let i=-3;i<=3;i++)ctx.fillRect(x+i*8-3,y+48,5,11);
    ctx.fillRect(x-41,y+44,82,2);
  }
  // Scenario signs. Red-light right turns are prohibited by the simulated sign.
  s.route.forEach((p,i)=>{
    if(distance(s,p)>340)return;
    const x=p.x+61,y=p.y+46;
    ctx.fillStyle='#172632';ctx.strokeStyle='#dee5e7';ctx.lineWidth=2;
    if(p.kind==='semaforo'){
      ctx.fillRect(x-12,y-33,24,58);
      const light=lightColor(s.elapsed,i);
      for(const [j,key] of (['rojo','amarillo','verde'] as const).entries()){
        ctx.beginPath();ctx.arc(x,y-22+j*17,6,0,7);
        ctx.fillStyle=light===key?({rojo:'#ff5d61',amarillo:'#ffdc5b',verde:'#4cec9d'}[key]):'#172129';ctx.fill();
      }
      ctx.fillStyle='#f2f1e8';ctx.font='bold 8px sans-serif';ctx.textAlign='center';
      ctx.fillText('NO ROJO',x,y+36);
    }else if(p.kind==='pare'){
      ctx.fillStyle='#c43442';ctx.beginPath();
      for(let j=0;j<8;j++){const a=Math.PI/8+j*Math.PI/4;const xx=x+17*Math.cos(a),yy=y+17*Math.sin(a);if(j===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}
      ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.stroke();
      ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('PARE',x,y+4);
    }else if(p.kind==='peatones'){
      ctx.fillStyle='#174c67';ctx.fillRect(x-18,y-18,36,36);
      ctx.fillStyle='#f9f5ea';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('PEAT',x,y+5);
    }else {ctx.fillStyle='#e1a452';ctx.fillRect(x-22,y-13,44,26);ctx.fillStyle='#192b30';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('BUS',x,y+4);}
    if(i===4){ctx.fillStyle='#fae1a4';ctx.fillRect(x-19,y+47,42,22);ctx.fillStyle='#25343a';ctx.font='bold 10px sans-serif';ctx.fillText('20',x+2,y+62);}
  });
  // Road navigation (not real geographic map); light line helps the novice.
  ctx.strokeStyle='#8af5e3';ctx.lineWidth=3;ctx.globalAlpha=.74;ctx.setLineDash([8,9]);
  ctx.beginPath();ctx.moveTo(s.x,s.y);
  s.route.slice(s.index).forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  const node=currentNode(s);
  if(node){
    ctx.beginPath();ctx.arc(node.x,node.y,23,0,7);ctx.strokeStyle='#9bfde4';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#b5fff0';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText((s.index+1).toString(),node.x,node.y+4);
  }
  const end=s.route.at(-1);
  if(end){ctx.fillStyle='#ffd37a';ctx.beginPath();ctx.arc(end.x,end.y,10,0,7);ctx.fill();}
  for(const car of npcTraffic(s)){
    carShape(ctx,car.x,car.y,car.bus?0:Math.PI,car.bus?'#dba75c':'#6d9eb1',car.bus);
  }
  if(s.parked){ctx.strokeStyle='#fff6a8';ctx.lineWidth=2;ctx.strokeRect(8,154,26,52);}
  carShape(ctx,s.x,s.y,s.angle,'#e0e5dc',false,s.indicator);
  ctx.restore();
  // Fixed overlays
  ctx.fillStyle='#081723de';ctx.fillRect(10,10,280,42);
  ctx.fillStyle='#d1fbf2';ctx.textAlign='left';ctx.font='bold 15px sans-serif';
  ctx.fillText('CALLES SIMULADAS · RD',21,28);
  ctx.fillStyle='#93b7c3';ctx.font='11px sans-serif';ctx.fillText('Modelo didáctico; no mapa real ni vista a escala.',21,44);
  if(s.gear==='P'){
    ctx.fillStyle='#051b29da';ctx.fillRect(W/2-195,H-70,390,50);
    ctx.fillStyle='#ffe0a2';ctx.font='bold 15px sans-serif';ctx.textAlign='center';ctx.fillText('CINTURÓN → ESPEJOS → FRENO → D',W/2,H-42);
  }
}
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
    controller.pause=()=>{paused.current=true;callbacks.onStatus('paused');};
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
      if(context)drawCity(context,engine.current);
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
      <div><strong>MANEJO RD · SEDÁN 2001 AUTOMÁTICO</strong>
        <span>Trayecto didáctico · Destino: {destination}</span></div>
      <div className="driving-time">{formatSeconds(remainingTime(view))}<small>restantes</small></div>
    </div>
    <div className="driving-map"><canvas width={760} height={520} ref={canvas} role="img"
      aria-label="Vista superior de calles ficticias, automóvil, señales, ruta iluminada y tránsito"/></div>
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
      <p><b>Teclado:</b> W acelerar · S frenar · A/D volante · C cinturón · M espejos · Q/E direccionales · G cambio D (con freno) · P aparcar. En móvil, mantén presionados los pedales.</p>
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
