/** Driving school: intentionally simplified physics and fictional urban layout.
 * Legal references and limits for each scenario live in DESIGN.md.
 * Distances are simulated metres; this is not a certified vehicle dynamics model.
 */
export type Gear='P'|'R'|'N'|'D';
export type Indicator='off'|'left'|'right';
export type Turn='recto'|'izquierda'|'derecha';
export type NodeKind='semaforo'|'pare'|'peatones'|'trafico';
export interface Point {x:number;y:number}
export interface RouteNode extends Point {kind:NodeKind;name:string}
export interface DrivingControls {throttle:boolean;brake:boolean;left:boolean;right:boolean;steer?:number}
export interface DrivingState {
  route:RouteNode[];destination:string;seed:number;
  x:number;y:number;angle:number;speed:number;elapsed:number;odometer:number;
  gear:Gear;indicator:Indicator;indicatorAt:number;mirrorChecked:boolean;belt:boolean;brakeReady:boolean;
  index:number;parked:boolean;stopSeconds:number;stopMet:boolean;lastDistance:number;
  score:number;infractions:number;feedback:string;events:string[];lastIncident:number;
  offRoadTime:number;safeX:number;safeY:number;collisionCooldown:number;
  completed:boolean;finished:boolean;
}
export const SESSION_SECONDS=300;
export const BLOCK_METERS=240;
export const STREET_LIMIT_KMH=40;
export const SCHOOL_LIMIT_KMH=20;
export const ZERO_CONTROLS:DrivingControls={throttle:false,brake:false,left:false,right:false};
export const DISTRICTS=['Centro cultural','Biblioteca del barrio','Parque municipal','Centro de salud comunitario','Oficina de servicios','Mercado vecinal'];
export const randomSeed=()=>Math.floor(Math.random()*4294967295);
const rng=(seed:number)=>{let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
const TYPES:NodeKind[]=['semaforo','pare','peatones','trafico'];
export function makeRoute(seed:number):{route:RouteNode[];destination:string}{
  const rand=rng(seed),side=rand()<.5?-1:1,far=rand()<.5?-1:1;
  // Streets at multiples of 240 metres. Both versions form connected routes.
  const points:Point[]=[
    {x:0,y:0},{x:side*240,y:0},{x:side*240,y:-240},
    {x:side*480,y:-240},{x:side*480,y:-480},
    {x:side*240,y:-480},{x:side*240,y:-720},
    {x:side*(far===1?480:0),y:-720},{x:side*(far===1?480:0),y:-960},
  ];
  return {route:points.map((p,i)=>({...p,kind:TYPES[i%4],
    name:['Av. Los Almendros','Calle Las Palmas','Av. Independencia','Calle del Mercado','Zona escolar','Calle del Parque','Avenida Central','Calle Los Pinos','Destino'][i]})),
    destination:DISTRICTS[Math.floor(rand()*DISTRICTS.length)]};
}
export function makeDrivingState(seed=randomSeed()):DrivingState{
  const {route,destination}=makeRoute(seed);
  return {route,destination,seed,x:19,y:175,angle:-Math.PI/2,speed:0,elapsed:0,odometer:0,
    gear:'P',indicator:'off',indicatorAt:-Infinity,mirrorChecked:false,belt:false,brakeReady:false,
    index:0,parked:true,stopSeconds:0,stopMet:false,lastDistance:175,
    score:100,infractions:0,feedback:'Antes de salir: cinturón (C), espejos (M), freno (S) y posición D.',
    events:['Estás estacionado. Revisa cinturón y espejos antes de salir.'],
    lastIncident:-100,offRoadTime:0,safeX:19,safeY:175,collisionCooldown:0,completed:false,finished:false};
}
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const positiveMod=(a:number,b:number)=>((a%b)+b)%b;
export const currentNode=(state:DrivingState):RouteNode|null=>state.route[state.index]??null;
export function nextTurn(state:DrivingState):Turn{
  if(state.index>=state.route.length-1)return 'recto';
  const previous=state.index===0?{x:0,y:175}:state.route[state.index-1];
  const curr=state.route[state.index],next=state.route[state.index+1];
  const a=Math.atan2(curr.y-previous.y,curr.x-previous.x);
  const b=Math.atan2(next.y-curr.y,next.x-curr.x);
  let delta=Math.atan2(Math.sin(b-a),Math.cos(b-a));
  if(Math.abs(delta)<.1)return 'recto';
  return delta<0?'izquierda':'derecha'; // Canvas angles increase clockwise because Y grows down.
}
export function lightColor(seconds:number,index:number):'rojo'|'amarillo'|'verde'{
  const phase=positiveMod(seconds+index*6,29);
  return phase<11?'rojo':phase<15?'amarillo':'verde';
}
export const pedestrianCrossing=(seconds:number,index:number)=>positiveMod(seconds+index*4,24)<7;
export const currentLimit=(s:DrivingState)=>{
  const n=currentNode(s);
  return n&&s.index===4&&distance(s,n)<95?SCHOOL_LIMIT_KMH:STREET_LIMIT_KMH;
};
export function record(s:DrivingState,message:string,penalty=0,article?:string){
  s.feedback=message+(article?' · Ley 63-17, art. '+article:'');
  s.events=[s.feedback,...s.events].slice(0,7);
  if(penalty>0){s.score=Math.max(0,s.score-penalty);s.infractions++;}
}
export function toggleBelt(s:DrivingState):DrivingState{
  if(s.speed>1)return s;
  const n={...s,events:[...s.events]};n.belt=!n.belt;
  record(n,n.belt?'Cinturón colocado.':'Cinturón retirado; colócalo antes de avanzar.');
  return n;
}
export function checkMirrors(s:DrivingState):DrivingState{
  const n={...s,events:[...s.events]};n.mirrorChecked=true;
  record(n,'Espejos comprobados; verifica también el punto ciego.');
  return n;
}
export function setIndicator(s:DrivingState,value:Indicator):DrivingState{
  const n={...s,events:[...s.events]};
  n.indicator=n.indicator===value?'off':value;
  n.indicatorAt=n.indicator==='off'?-Infinity:n.odometer;
  record(n,n.indicator==='off'?'Direccional apagada.':
    'Direccional '+(n.indicator==='left'?'izquierda':'derecha')+' encendida.');
  return n;
}
export function shiftGear(s:DrivingState,gear:Gear,brakeHeld=false):DrivingState{
  const n={...s,events:[...s.events]};
  if(n.speed>1){record(n,'Detén el vehículo antes de cambiar el selector.',4);return n;}
  if(gear!=='P'&&!brakeHeld&&!n.brakeReady){record(n,'Pisa el freno primero y después selecciona '+gear+'.');return n;}
  n.gear=gear;n.brakeReady=false;
  record(n,'Selector automático en '+gear+'.'+(gear==='D'?' Acelera suavemente al iniciar la marcha.':''));
  return n;
}
export function safeRoad(x:number,y:number):boolean{
  const dx=Math.abs(x-Math.round(x/BLOCK_METERS)*BLOCK_METERS);
  const dy=Math.abs(y-Math.round(y/BLOCK_METERS)*BLOCK_METERS);
  return dx<=46||dy<=46;
}
export function npcTraffic(s:DrivingState):{x:number;y:number;bus:boolean}[]{
  const node=currentNode(s);if(!node)return [];
  const visible=[node,...(s.index>0?[s.route[s.index-1]]:[])];
  return visible.flatMap((p,i)=>{
    const phase=s.elapsed*9+(s.index+i*4)*97;
    return [
      {x:p.x-120+positiveMod(phase,240),y:p.y+17,bus:true},
      {x:p.x+120-positiveMod(phase*.8+64,240),y:p.y-17,bus:false},
    ];
  });
}
export function advanceDrive(current:DrivingState,controls:DrivingControls,dt:number):DrivingState{
  if(current.finished||dt<=0)return current;
  const s:DrivingState={...current,events:[...current.events]};
  const step=Math.min(.06,dt);
  // The five-minute assessment starts only after leaving the parked position.
  if(!current.parked)s.elapsed=Math.min(SESSION_SECONDS,s.elapsed+step);
  s.collisionCooldown=Math.max(0,s.collisionCooldown-step);
  if(controls.brake&&s.speed<.4)s.brakeReady=true;
  const target=currentNode(s);
  const near=target?distance(s,target):Infinity;
  if(target&&near>=26&&near<=67&&s.speed<.35){
    s.stopSeconds+=step;
    if(s.stopSeconds>=.65)s.stopMet=true;
  }
  if(s.gear==='D'||s.gear==='R'){
    const direction=s.gear==='D'?1:-1;
    if(s.parked&&(!s.belt||!s.mirrorChecked)){
      if(controls.throttle&&s.elapsed-s.lastIncident>2){
        record(s,'Antes de salir, ponte el cinturón y comprueba los espejos.');s.lastIncident=s.elapsed;
      }
    }else{
      const acceleration=controls.throttle?2.6:0;
      const braking=controls.brake?5.8:0;
      s.speed=Math.max(0,Math.min(14.2,s.speed+(acceleration-braking-.65)*step));
      if(s.gear==='R')s.speed=Math.min(s.speed,2.3);
      const keys=Number(controls.right)-Number(controls.left);
      const steer=keys!==0?keys:Math.max(-1,Math.min(1,controls.steer??0));
      // Illustrative bicycle-like steering: turning becomes difficult at a standstill.
      s.angle+=steer*direction*Math.min(1.4,s.speed*.22)*step;
      const traveled=s.speed*step*direction;
      s.x+=Math.cos(s.angle)*traveled;
      s.y+=Math.sin(s.angle)*traveled;
      s.odometer+=Math.abs(traveled);
      if(s.parked&&s.odometer>6){
        s.parked=false;
        if(s.indicator!=='left')record(s,'Incorporación sin señal previa. Señaliza y cede el paso.',9,'241');
        else record(s,'Buena salida: espejos, cinturón y direccional comprobados.');
        s.indicator='off';s.indicatorAt=-Infinity;
      }
    }
  }else s.speed=Math.max(0,s.speed-4*step);
  if(!safeRoad(s.x,s.y)){
    s.offRoadTime+=step;
    if(s.offRoadTime>.55&&s.elapsed-s.lastIncident>1.5){
      record(s,'Te saliste de la calzada. Regresa al carril con suavidad.',12,'264');
      s.x=s.safeX;s.y=s.safeY;s.speed=0;s.offRoadTime=0;s.lastIncident=s.elapsed;
    }
  }else{s.offRoadTime=0;s.safeX=s.x;s.safeY=s.y;}
  const limit=currentLimit(s);
  if(s.speed*3.6>limit+3&&s.elapsed-s.lastIncident>6){
    record(s,'Exceso de velocidad. Límite de esta calle: '+limit+' km/h.',6,'264');
    s.lastIncident=s.elapsed;
  }
  if(s.collisionCooldown<=0){
    for(const car of npcTraffic(s)){
      if(Math.hypot(car.x-s.x,car.y-s.y)<15){
        record(s,car.bus?'Colisión simulada con vehículo pesado. Mantén distancia.':'Contacto con otro vehículo. Observa la circulación.',18,'241');
        s.collisionCooldown=7;s.speed=0;s.lastIncident=s.elapsed;break;
      }
    }
  }
  const node=currentNode(s);
  if(node){
    const d=distance(s,node);
    if(d<29&&current.lastDistance>=29){
      if(node.kind==='semaforo'){
        const light=lightColor(s.elapsed,s.index);
        if(light==='rojo')record(s,'Cruzaste el semáforo en rojo; debiste detenerte.',22,'133–134');
        else if(light==='amarillo'&&s.speed*3.6>20)
          record(s,'Entraste rápido con luz amarilla; procura detenerte.',9,'134');
        else record(s,'Cruce de semáforo realizado. Mantén atención a los peatones.');
      }else if(node.kind==='pare'){
        if(!s.stopMet)record(s,'Omitiste la parada completa ante PARE.',17,'138');
        else record(s,'Alto completo y cruce prudente: correcto.');
      }else if(node.kind==='peatones'){
        if(pedestrianCrossing(s.elapsed,s.index))
          record(s,'Cruzaste cuando los peatones tenían prioridad.',21,'135–136');
        else record(s,'Paso peatonal libre; continúa con precaución.');
      }else if(node.kind==='trafico'&&s.speed*3.6>25){
        record(s,'Velocidad elevada al entrar en tránsito pesado.',8,'266');
      }else record(s,'Incorporación al cruce con tránsito denso: mantén distancia.');
      const turn=nextTurn(s);
      if(turn!=='recto'){
        const expected=turn==='izquierda'?'left':'right';
        const advance=s.odometer-s.indicatorAt;
        if(s.indicator!==expected||advance<50)
          record(s,'Giro '+turn+': anuncia la maniobra con 50 m de anticipación.',12,'235');
        else if(s.speed*3.6>24)
          record(s,'Reduce gradualmente la velocidad antes de girar.',7,'235');
        else record(s,'Giro señalizado correctamente: sigue la vía indicada.');
        s.indicator='off';s.indicatorAt=-Infinity;
      }
      s.index++;s.stopSeconds=0;s.stopMet=false;
      if(s.index>=s.route.length){
        s.completed=true;s.finished=true;s.speed=0;
        record(s,'Llegaste a '+s.destination+'. Evaluación completada.');
      }
    }
    s.lastDistance=currentNode(s)?distance(s,currentNode(s)!):Infinity;
  }
  if(s.elapsed>=SESSION_SECONDS&&!s.finished){
    s.finished=true;s.speed=0;
    record(s,'Terminó el recorrido de cinco minutos. Revisa tu evaluación.');
  }
  return s;
}
export function driveGrade(s:DrivingState){
  return s.score>=90?'EXCELENTE':s.score>=75?'BUEN CRITERIO':s.score>=55?'EN PRÁCTICA':'NECESITA REFUERZO';
}
export const remainingTime=(s:DrivingState)=>Math.max(0,SESSION_SECONDS-s.elapsed);
