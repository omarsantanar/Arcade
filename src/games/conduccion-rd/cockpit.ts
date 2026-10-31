import {BLOCK_METERS,currentNode,distance,lightColor,nextTurn,npcTraffic,
  type DrivingControls,type DrivingState} from './logic';

/** Fictional procedural streets rendered from eye height with ground-plane projection.
 * Pure Canvas 2.5D, not a licensed 3D Toyota model and not a calibrated camera.
 */
const W=760,H=520,CX=380,HORIZON=180,FOCAL=690,EYE=1.5,NEAR=2.5;
type Vertex={x:number;y:number;z:number}; // z=height above asphalt
type CameraVertex={side:number;ahead:number;height:number};
const camera=(s:DrivingState,p:Vertex):CameraVertex=>{
  const dx=p.x-s.x,dy=p.y-s.y,fx=Math.cos(s.angle),fy=Math.sin(s.angle);
  return {side:dx*-fy+dy*fx,ahead:dx*fx+dy*fy,height:p.z};
};
const screen=(p:CameraVertex)=>({
  x:CX+(p.side*FOCAL)/p.ahead,y:HORIZON+(EYE-p.height)*FOCAL/p.ahead,
});
/** Testable driver-eye projection; points behind the vehicle are not visible. */
export function projectDriverPoint(s:DrivingState,p:Vertex):{x:number;y:number}|null{
  const c=camera(s,p);
  return c.ahead>NEAR?screen(c):null;
}
const clipNear=(source:CameraVertex[]):CameraVertex[]=>{
  const out:CameraVertex[]=[];
  for(let i=0;i<source.length;i++){
    const a=source[i],b=source[(i+1)%source.length];
    const insideA=a.ahead>=NEAR,insideB=b.ahead>=NEAR;
    if(insideA)out.push(a);
    if(insideA!==insideB){
      const t=(NEAR-a.ahead)/(b.ahead-a.ahead);
      out.push({ahead:NEAR,side:a.side+(b.side-a.side)*t,height:a.height+(b.height-a.height)*t});
    }
  }
  return out;
};
function quad(ctx:CanvasRenderingContext2D,s:DrivingState,vertices:Vertex[],fill:string){
  const points=clipNear(vertices.map(p=>camera(s,p)));
  if(points.length<3)return;
  ctx.fillStyle=fill;ctx.beginPath();
  points.forEach((p,i)=>{const q=screen(p);if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});
  ctx.closePath();ctx.fill();
}
function rectGround(ctx:CanvasRenderingContext2D,s:DrivingState,
  x1:number,y1:number,x2:number,y2:number,color:string){
  quad(ctx,s,[{x:x1,y:y1,z:0},{x:x2,y:y1,z:0},{x:x2,y:y2,z:0},{x:x1,y:y2,z:0}],color);
}
function drawSky(ctx:CanvasRenderingContext2D,s:DrivingState){
  const sky=ctx.createLinearGradient(0,0,0,HORIZON+80);
  sky.addColorStop(0,'#6a9fbc');sky.addColorStop(.65,'#bcd8df');sky.addColorStop(1,'#d6dabf');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#93a58f';ctx.beginPath();ctx.moveTo(0,HORIZON+19);
  for(let x=0;x<=W;x+=25){
    const shifted=x*.013+s.angle*35;
    ctx.lineTo(x,HORIZON+3+13*Math.sin(shifted)+7*Math.cos(shifted*2.1));
  }
  ctx.lineTo(W,HORIZON+50);ctx.lineTo(0,HORIZON+50);ctx.fill();
  ctx.fillStyle='#597866';ctx.fillRect(0,HORIZON+37,W,H-HORIZON);
}
function drawStreets(ctx:CanvasRenderingContext2D,s:DrivingState){
  const range=560;
  const startX=Math.floor((s.x-range)/BLOCK_METERS);
  const endX=Math.ceil((s.x+range)/BLOCK_METERS);
  const startY=Math.floor((s.y-range)/BLOCK_METERS);
  const endY=Math.ceil((s.y+range)/BLOCK_METERS);
  // Blocks are a simple grid; sidewalks and asphalt become wider toward the windscreen.
  for(let xi=startX;xi<=endX;xi++){
    const x=xi*BLOCK_METERS;
    rectGround(ctx,s,x-52,s.y-range,x+52,s.y+range,'#939c95');
    rectGround(ctx,s,x-43,s.y-range,x+43,s.y+range,'#414950');
  }
  for(let yi=startY;yi<=endY;yi++){
    const y=yi*BLOCK_METERS;
    rectGround(ctx,s,s.x-range,y-52,s.x+range,y+52,'#939c95');
    rectGround(ctx,s,s.x-range,y-43,s.x+range,y+43,'#414950');
  }
  // Crosswalks, stop lines and short centre dashes.
  for(let xi=startX;xi<=endX;xi++){
    const x=xi*BLOCK_METERS;
    for(let y=Math.floor((s.y-range)/27)*27;y<s.y+range;y+=27)
      rectGround(ctx,s,x-1.2,y,x+1.2,y+10,'#c4c6be');
  }
  for(let yi=startY;yi<=endY;yi++){
    const y=yi*BLOCK_METERS;
    for(let x=Math.floor((s.x-range)/27)*27;x<s.x+range;x+=27)
      rectGround(ctx,s,x,y-1.2,x+10,y+1.2,'#c4c6be');
  }
  for(let xi=startX;xi<=endX;xi++)for(let yi=startY;yi<=endY;yi++){
    const x=xi*BLOCK_METERS,y=yi*BLOCK_METERS;
    if(distance({x,y},s)>370)continue;
    for(let i=-3;i<=3;i++)rectGround(ctx,s,x+i*11-4,y+53,x+i*11+3,y+57,'#e5e5d7');
    rectGround(ctx,s,x-40,y+44,x+40,y+46,'#f2e6cf');
  }
}
function buildings(ctx:CanvasRenderingContext2D,s:DrivingState){
  const range=530,rows=[] as {x:number;y:number;d:number;seed:number}[];
  for(let xi=Math.floor((s.x-range)/BLOCK_METERS);xi<=Math.ceil((s.x+range)/BLOCK_METERS);xi++)
    for(let yi=Math.floor((s.y-range)/BLOCK_METERS);yi<=Math.ceil((s.y+range)/BLOCK_METERS);yi++){
      for(const ix of [0,1])for(const iy of [0,1]){
        const x=xi*BLOCK_METERS+72+ix*56,y=yi*BLOCK_METERS+75+iy*53;
        const d=camera(s,{x,y,z:0}).ahead;
        if(d<4||d>450)continue;
        rows.push({x,y,d,seed:Math.abs(x*7+y*11)});
      }
    }
  rows.sort((a,b)=>b.d-a.d);
  for(const item of rows){
    const {x,y,seed}=item,width=37,depth=39,height=17+seed%10;
    const palette=['#c2bfae','#c9d0c6','#abbdc0','#d2bca8','#aab2b0'];
    const body=palette[seed%palette.length];
    // Rectilinear facades, no textures or borrowed building assets.
    quad(ctx,s,[{x,y,z:0},{x:x+width,y,z:0},{x:x+width,y,z:height},{x,y,z:height}],body);
    quad(ctx,s,[{x:x+width,y,z:0},{x:x+width,y:y+depth,z:0},
      {x:x+width,y:y+depth,z:height},{x:x+width,y,z:height}],'#758b8b');
    quad(ctx,s,[{x,y,z:height},{x:x+width,y,z:height},{x:x+width,y:y+depth,z:height},
      {x,y:y+depth,z:height}],'#e5e5d3');
    for(let windowNo=0;windowNo<3;windowNo++){
      const left=x+5+windowNo*11;
      quad(ctx,s,[{x:left,y:y-.15,z:8},{x:left+6,y:y-.15,z:8},
        {x:left+6,y:y-.15,z:14},{x:left,y:y-.15,z:14}], '#476e87');
    }
  }
}
function signScale(ahead:number){return Math.min(3.3,Math.max(.28,210/(ahead+12)));}
function drawTrafficSigns(ctx:CanvasRenderingContext2D,s:DrivingState){
  const signs=s.route.map((node,index)=>({node,index,cam:camera(s,{x:node.x+58,y:node.y+47,z:2.7})}))
    .filter(x=>x.cam.ahead>4&&x.cam.ahead<300)
    .sort((a,b)=>b.cam.ahead-a.cam.ahead);
  for(const {node,index,cam} of signs){
    const p=screen(cam),scale=signScale(cam.ahead);
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(scale,scale);
    ctx.strokeStyle='#405059';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(0,46);ctx.stroke();
    if(node.kind==='semaforo'){
      ctx.fillStyle='#17232d';ctx.beginPath();ctx.roundRect(-10,-39,20,45,5);ctx.fill();
      for(let i=0;i<3;i++){
        const color=(['rojo','amarillo','verde'] as const)[i];
        ctx.fillStyle=lightColor(s.elapsed,index)===color?
          {rojo:'#ff5559',amarillo:'#ffe375',verde:'#54f29e'}[color]:'#384953';
        ctx.beginPath();ctx.arc(0,-30+i*14,5,0,Math.PI*2);ctx.fill();
      }
      ctx.font='700 8px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe8df';ctx.fillText('NO GIRO',0,18);
    }else if(node.kind==='pare'){
      ctx.fillStyle='#b93442';ctx.beginPath();
      for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;
        const px=15*Math.cos(a),py=15*Math.sin(a);
        if(!i)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
      ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText('PARE',0,3);
    }else if(node.kind==='peatones'){
      ctx.fillStyle='#317d90';ctx.fillRect(-15,-15,30,30);
      ctx.fillStyle='#fff';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText('PEATÓN',0,2);
    }else{
      ctx.fillStyle='#f1ca65';ctx.fillRect(-18,-14,36,28);ctx.fillStyle='#26373c';
      ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('BUS',0,3);
    }
    if(index===4){ctx.fillStyle='#fcefc9';ctx.fillRect(-14,21,28,20);ctx.fillStyle='#25343a';ctx.font='bold 12px sans-serif';ctx.fillText('20',0,36);}
    ctx.restore();
  }
}
function traffic(ctx:CanvasRenderingContext2D,s:DrivingState){
  const cars=npcTraffic(s).map(car=>({...car,cam:camera(s,{x:car.x,y:car.y,z:0})}))
    .filter(car=>car.cam.ahead>3&&car.cam.ahead<230)
    .sort((a,b)=>b.cam.ahead-a.cam.ahead);
  for(const car of cars){
    const base=screen(car.cam),scale=Math.min(5,FOCAL/car.cam.ahead);
    const width=(car.bus?2.45:1.85)*scale,height=(car.bus?2.7:1.65)*scale;
    ctx.fillStyle=car.bus?'#d4a150':'#6a9ab2';
    ctx.fillRect(base.x-width/2,base.y-height,width,height);
    ctx.fillStyle='#233b47';ctx.fillRect(base.x-width*.42,base.y-height*.78,width*.84,height*.3);
    ctx.fillStyle='#fbe6be';
    ctx.fillRect(base.x-width*.42,base.y-height*.22,width*.2,Math.max(2,height*.07));
    ctx.fillRect(base.x+width*.22,base.y-height*.22,width*.2,Math.max(2,height*.07));
  }
}
function directionHUD(ctx:CanvasRenderingContext2D,s:DrivingState){
  const node=currentNode(s),turn=nextTurn(s);
  const meters=node?Math.round(distance(s,node)):0;
  ctx.fillStyle='#0e2837e6';ctx.beginPath();ctx.roundRect(14,16,236,63,10);ctx.fill();
  ctx.font='bold 12px sans-serif';ctx.fillStyle='#a8eedc';ctx.fillText('SIGUIENTE CRUCE',26,35);
  ctx.font='bold 22px sans-serif';ctx.fillStyle='#ffffff';
  ctx.fillText((turn==='izquierda'?'← ':turn==='derecha'?'→ ':'↑ ')+meters+' m',26,64);
  // A small navigation display, not a third-person camera.
  ctx.fillStyle='#122a37ed';ctx.beginPath();ctx.roundRect(W-132,16,117,92,10);ctx.fill();
  ctx.save();ctx.beginPath();ctx.rect(W-128,20,109,83);ctx.clip();
  ctx.translate(W-73,66);ctx.scale(.18,.18);ctx.rotate(-s.angle-Math.PI/2);
  ctx.translate(-s.x,-s.y);ctx.strokeStyle='#5a8592';ctx.lineWidth=18;
  for(let i=-6;i<=6;i++){
    const x=Math.round(s.x/BLOCK_METERS+i)*BLOCK_METERS;
    ctx.beginPath();ctx.moveTo(x,s.y-400);ctx.lineTo(x,s.y+400);ctx.stroke();
    const y=Math.round(s.y/BLOCK_METERS+i)*BLOCK_METERS;
    ctx.beginPath();ctx.moveTo(s.x-400,y);ctx.lineTo(s.x+400,y);ctx.stroke();
  }
  ctx.strokeStyle='#79f4da';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(s.x,s.y);
  s.route.slice(s.index).forEach(p=>ctx.lineTo(p.x,p.y));ctx.stroke();ctx.restore();
  ctx.fillStyle='#ffe5a5';ctx.beginPath();ctx.moveTo(W-73,54);ctx.lineTo(W-79,73);ctx.lineTo(W-67,73);ctx.fill();
}
function cockpit(ctx:CanvasRenderingContext2D,s:DrivingState,controls:DrivingControls){
  // Fictional early-2000s grey interior, no protected model trademarks or OEM dash assets.
  ctx.fillStyle='#233039';ctx.beginPath();
  ctx.moveTo(0,0);ctx.lineTo(0,340);ctx.lineTo(77,387);ctx.lineTo(77,65);ctx.lineTo(54,0);ctx.fill();
  ctx.beginPath();ctx.moveTo(W,0);ctx.lineTo(W,340);ctx.lineTo(W-77,387);ctx.lineTo(W-77,65);
  ctx.lineTo(W-54,0);ctx.fill();
  // Rear-view mirror with a stylized reflection of the road behind.
  ctx.strokeStyle='#212b32';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(CX,0);ctx.lineTo(CX,30);ctx.stroke();
  ctx.fillStyle='#121c23';ctx.beginPath();ctx.roundRect(CX-71,26,142,40,9);ctx.fill();
  const mirror=ctx.createLinearGradient(0,35,0,58);mirror.addColorStop(0,'#96bacb');mirror.addColorStop(1,'#465e67');
  ctx.fillStyle=mirror;ctx.fillRect(CX-61,33,122,26);
  ctx.strokeStyle='#e2d7bd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(CX,41);ctx.lineTo(CX-20,59);ctx.moveTo(CX,41);ctx.lineTo(CX+20,59);ctx.stroke();
  // Driver's side mirror, deliberately schematic.
  ctx.fillStyle='#253139';ctx.beginPath();ctx.roundRect(6,284,89,57,12);ctx.fill();
  ctx.fillStyle='#779ca9';ctx.fillRect(14,292,72,39);
  ctx.strokeStyle='#dce4dd';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(14,329);ctx.lineTo(80,299);ctx.stroke();
  // Dashboard should not obscure roadway before the base of the windscreen.
  const dash=ctx.createLinearGradient(0,382,0,H);
  dash.addColorStop(0,'#3c4851');dash.addColorStop(.35,'#222d36');dash.addColorStop(1,'#101a23');
  ctx.fillStyle=dash;ctx.beginPath();ctx.moveTo(0,403);
  ctx.bezierCurveTo(210,366,560,366,W,403);
  ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
  ctx.strokeStyle='#596770';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,406);
  ctx.bezierCurveTo(210,368,560,368,W,406);ctx.stroke();
  // Gauge cluster, analogue look.
  ctx.fillStyle='#111b22';ctx.beginPath();ctx.roundRect(103,391,320,115,18);ctx.fill();
  ctx.strokeStyle='#778b8e';ctx.lineWidth=2;ctx.stroke();
  for(const [x,display,value] of [[185,'KM/H',Math.round(s.speed*3.6)],[335,'CAMBIO',s.gear]] as const){
    ctx.fillStyle='#192b35';ctx.beginPath();ctx.arc(x,449,40,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#799598';ctx.lineWidth=3;ctx.stroke();
    ctx.textAlign='center';ctx.fillStyle='#c4e5dc';ctx.font='bold 11px sans-serif';ctx.fillText(display,x,442);
    ctx.fillStyle='#fff9d9';ctx.font='bold 21px sans-serif';ctx.fillText(String(value),x,467);
  }
  ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#d9e7e5';
  ctx.fillText(s.belt?'● CINTURÓN':'◉ CINTURÓN',270,495);
  if(s.indicator!=='off'&&Math.floor(s.elapsed*3)%2===0){
    ctx.fillStyle='#ffdc73';ctx.font='bold 23px sans-serif';ctx.fillText(s.indicator==='left'?'◀':'▶',271,428);
  }
  // Simple steering wheel in driver's position; wheel tilts toward the held arrows.
  ctx.save();ctx.translate(244,491);ctx.rotate(((controls.left||controls.right)?Number(controls.right)-Number(controls.left):
    (controls.steer??0))*.38);
  ctx.strokeStyle='#11171d';ctx.lineWidth=20;ctx.beginPath();ctx.arc(0,0,75,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#4b5d64';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,76,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#202d35';
  for(const a of [-2.55,-.6,1.57]){
    ctx.save();ctx.rotate(a);ctx.fillRect(0,-12,65,24);ctx.restore();
  }
  ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.fillStyle='#18242d';ctx.beginPath();ctx.roundRect(530,407,200,86,9);ctx.fill();
  ctx.fillStyle='#719295';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
  ctx.fillText('AUTO',630,428);
  ctx.font='bold 18px sans-serif';ctx.fillStyle='#ffe4ac';ctx.fillText(s.gear+'  ·  '+Math.round(s.speed*3.6)+' km/h',630,455);
  ctx.fillStyle='#b2cbd0';ctx.font='10px sans-serif';ctx.fillText('INTERIOR ILUSTRATIVO',630,480);
}
export function drawCockpit(ctx:CanvasRenderingContext2D,s:DrivingState,controls:DrivingControls){
  ctx.clearRect(0,0,W,H);
  drawSky(ctx,s);
  drawStreets(ctx,s);
  buildings(ctx,s);
  drawTrafficSigns(ctx,s);
  traffic(ctx,s);
  directionHUD(ctx,s);
  cockpit(ctx,s,controls);
}
