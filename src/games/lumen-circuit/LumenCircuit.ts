import Phaser from 'phaser';
import type { ControlDirection, GameCallbacks, GameHandle } from '../types';
import {
  COLS, ROWS, newCircuit, moveExplorer, saveLumenBest,
  stepSentinels, type CircuitState, type Direction, type Cell
} from './logic';

const W = 360, H = 600, CELL = 22, LEFT = (W - COLS * CELL) / 2, TOP = 97;
const POS = (p: Cell) => ({ x: LEFT + (p.x + 0.5) * CELL, y: TOP + (p.y + 0.5) * CELL });
const COLORS = [0x41ebce, 0xe498ff, 0xffb56d] as const;

class CircuitScene extends Phaser.Scene {
  private model: CircuitState = newCircuit();
  private board!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private footer!: Phaser.GameObjects.Text;
  private keyMap: Record<string, Phaser.Input.Keyboard.Key> = {};
  private touchDirection: Direction = 'none';
  private elapsed = 0;
  private moveTimer = 0;
  private droneTimer = 0;
  private callbacks: GameCallbacks;
  private muted = false;
  private audio?: AudioContext;
  private lastPointer: { x: number; y: number } | null = null;

  constructor(callbacks: GameCallbacks) { super('LumenCircuit'); this.callbacks = callbacks; }

  create(): void {
    this.cameras.main.setBackgroundColor('#07121D');
    const bg=this.add.graphics();
    let seed=2467;
    for(let i=0;i<60;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const x=(seed%W), y=(seed>>>9)%H;
      bg.fillStyle(i%3===0?0x4ad7d2:0x4671a2,0.22);
      bg.fillCircle(x,y,0.5+(i%3)*0.25);
    }
    this.board=this.add.graphics();
    this.add.text(16,14,'LUMEN CIRCUIT',{fontFamily:'monospace',fontSize:'22px',fontStyle:'bold',color:'#79ffe1'});
    this.add.text(16,44,'RECOGE ENERGÍA · ACTIVA 3 NODOS · ESCAPA',
      {fontFamily:'monospace',fontSize:'9px',color:'#b7cbe3'});
    this.hud=this.add.text(16,66,'',{fontFamily:'monospace',fontSize:'12px',color:'#fafcff'});
    this.hint=this.add.text(W/2,535,'',{fontFamily:'monospace',fontSize:'10px',color:'#86f6e8'}).setOrigin(0.5);
    this.footer=this.add.text(W/2,558,'',{fontFamily:'monospace',fontSize:'9px',color:'#aac0d9'}).setOrigin(0.5);
    this.add.text(W/2,580,'DESLIZA O USA LAS FLECHAS · W A S D',
      {fontFamily:'monospace',fontSize:'9px',color:'#7895b8'}).setOrigin(0.5);

    this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      this.lastPointer={x:pointer.x,y:pointer.y};
      this.handleTouch(pointer.x,pointer.y);
    });
    this.input.on('pointermove',(pointer:Phaser.Input.Pointer)=>{
      if(!pointer.isDown || !this.lastPointer)return;
      const dx=pointer.x-this.lastPointer.x,dy=pointer.y-this.lastPointer.y;
      if(Math.hypot(dx,dy)<13)return;
      this.lastPointer={x:pointer.x,y:pointer.y};
      this.touchDirection=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
      this.tryMove(this.touchDirection);
    });
    this.input.on('pointerup',()=>{this.lastPointer=null;this.touchDirection='none';});
    if(this.input.keyboard){
      for(const key of ['UP','DOWN','LEFT','RIGHT','W','A','S','D']){
        this.keyMap[key]=this.input.keyboard.addKey(key);
      }
      this.input.keyboard.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    }
    this.reset();
  }

  private reset() {
    this.model=newCircuit();
    this.elapsed=0;this.moveTimer=0;this.droneTimer=0;this.touchDirection='none';
    this.callbacks.onScore(0);this.callbacks.onStatus('playing');
    this.drawBoard();
  }

  private handleTouch(x:number,y:number) {
    if(y<TOP || y>=TOP+ROWS*CELL)return;
    const p=POS(this.model.player),dx=x-p.x,dy=y-p.y;
    if(Math.abs(dx)<CELL/2 && Math.abs(dy)<CELL/2)return;
    this.touchDirection=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
    this.tryMove(this.touchDirection);
  }

  private beep(frequency:number):void {
    if(this.muted)return;
    try {
      this.audio ??= new window.AudioContext();
      if(this.audio.state!=='running'){void this.audio.resume();return;}
      const osc=this.audio.createOscillator(), gain=this.audio.createGain();
      osc.type='triangle';
      osc.frequency.setValueAtTime(frequency,this.audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency*1.25,this.audio.currentTime+0.1);
      gain.gain.setValueAtTime(0.028,this.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001,this.audio.currentTime+0.11);
      osc.connect(gain).connect(this.audio.destination);osc.start();osc.stop(this.audio.currentTime+0.12);
    } catch { /* Some browsers restrict audio contexts. */ }
  }

  private tryMove(direction:Direction) {
    if(this.model.status!=='playing' || !this.scene.isActive())return;
    const old=this.model;
    this.model=moveExplorer(this.model,direction);
    if(this.model===old)return;
    this.moveTimer=0;
    if(this.model.score!==old.score){
      saveLumenBest(this.model.score);
      this.callbacks.onScore(this.model.score);
      this.beep(this.model.activated.filter(Boolean).length>old.activated.filter(Boolean).length?740:480);
    }
    if(this.model.lives<old.lives)this.cameras.main.flash(150,255,90,90);
    if(this.model.status==='cleared'){
      const nextLevel=this.model.level+1;
      const bonus=350+nextLevel*50;
      const score=this.model.score+bonus;
      this.model=newCircuit(nextLevel,Math.random,score,this.model.lives);
      this.callbacks.onScore(score);
      saveLumenBest(score);
      this.cameras.main.flash(240,20,240,170);
    } else if(this.model.status==='gameover') {
      this.callbacks.onStatus('gameover');
      this.scene.pause();
    }
    this.drawBoard();
  }

  private drawBoard() {
    const g=this.board;
    if(!g)return;
    g.clear();
    const state=this.model;
    g.fillStyle(0x0b192b,1);
    g.fillRoundedRect(LEFT-4,TOP-4,COLS*CELL+8,ROWS*CELL+8,6);
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const xx=LEFT+x*CELL, yy=TOP+y*CELL;
      if(state.walls[y][x]){
        g.fillStyle(0x1e3351,1);g.fillRoundedRect(xx+1,yy+1,CELL-2,CELL-2,3);
        g.lineStyle(0.8,0x326078,0.44);g.strokeRoundedRect(xx+1.5,yy+1.5,CELL-3,CELL-3,3);
      }else{
        g.fillStyle((x+y)%2?0x0c192b:0x0e2133,0.9);g.fillRect(xx+1,yy+1,CELL-2,CELL-2);
      }
    }
    // Energy fragments are angular sparks instead of food-like circles.
    for(const p of state.shards){
      const {x,y}=POS(p);
      g.lineStyle(2,0xffd37e,0.88);
      g.lineBetween(x-4,y,x+4,y);
      g.lineBetween(x,y-4,x,y+4);
      g.fillStyle(0xffe5a8,0.9);g.fillRect(x-2,y-2,4,4);
    }
    for(let i=0;i<state.terminals.length;i++){
      const p=POS(state.terminals[i]),active=state.activated[i],color=active?0x49f5ce:COLORS[i];
      g.fillStyle(active?0x0a4244:0x2e1f44,0.86);
      g.fillRoundedRect(p.x-9,p.y-9,18,18,3);
      g.lineStyle(2.4,color,1);g.strokeRoundedRect(p.x-9,p.y-9,18,18,3);
      g.fillStyle(color,1);g.fillTriangle(p.x,p.y-5,p.x+5,p.y+4,p.x-5,p.y+4);
    }
    // Exit has its own gate glyph and only opens after all three terminals.
    const exit=POS(state.exit),open=state.activated.every(Boolean);
    g.lineStyle(3,open?0x70f5ad:0x7387a6,0.96);
    g.strokeRect(exit.x-8,exit.y-8,16,16);
    g.lineBetween(exit.x-4,exit.y,exit.x+5,exit.y);
    g.lineBetween(exit.x+1,exit.y-4,exit.x+5,exit.y);
    g.lineBetween(exit.x+1,exit.y+4,exit.x+5,exit.y);
    for(let i=0;i<state.drones.length;i++){
      const pos=POS(state.drones[i].position);
      const color=i%2?0xff6587:0xee8d6b;
      g.fillStyle(color,0.12);g.fillCircle(pos.x,pos.y,11);
      g.fillStyle(color,0.9);
      // Four-corner electrical sentinels, visually unlike any ghost-like character.
      g.fillPoints([{x:pos.x-8,y:pos.y},{x:pos.x,y:pos.y-8},{x:pos.x+8,y:pos.y},{x:pos.x,y:pos.y+8}],true);
      g.fillStyle(0x09111e,1);g.fillRect(pos.x-3,pos.y-2,6,4);
    }
    const player=POS(state.player);
    if(state.invulnerable===0 || Math.floor(state.invulnerable/2)%2===0){
      g.fillStyle(0x2df9df,0.11);g.fillCircle(player.x,player.y,13);
      g.fillStyle(0x73ffe9,1);
      g.fillPoints([{x:player.x,y:player.y-9},{x:player.x+8,y:player.y},
        {x:player.x,y:player.y+9},{x:player.x-8,y:player.y}],true);
      g.fillStyle(0x0c2b38,1);g.fillCircle(player.x,player.y,2.5);
    }
    const active=state.activated.filter(Boolean).length;
    this.hud.setText('NIVEL '+state.level+'  ·  NODOS '+active+'/3  ·  VIDAS '+state.lives);
    this.hint.setText(active===3?'SALIDA ABIERTA: BUSCA EL PORTAL →':
      'CRISTALES '+state.energy+'/2  ·  NODOS '+active+'/3');
    this.footer.setText('PUNTOS '+state.score+' · '+Math.floor(this.elapsed/1000)+'s · '+(state.invulnerable?'ESCUDO':'EVITA CENTINELAS'));
  }

  update(_time:number,delta:number):void {
    if(this.model.status!=='playing')return;
    const dt=Math.min(100,delta),keys=this.keyMap;
    this.elapsed+=dt;this.moveTimer+=dt;this.droneTimer+=dt;
    if(this.moveTimer>124){
      let dir:Direction=this.touchDirection;
      if(keys.UP?.isDown || keys.W?.isDown)dir='up';
      else if(keys.DOWN?.isDown || keys.S?.isDown)dir='down';
      else if(keys.LEFT?.isDown || keys.A?.isDown)dir='left';
      else if(keys.RIGHT?.isDown || keys.D?.isDown)dir='right';
      if(dir!=='none')this.tryMove(dir);
    }
    const interval=Math.max(180,425-(this.model.level-1)*28);
    if(this.droneTimer>=interval){
      this.droneTimer=0;
      const before=this.model;
      this.model=stepSentinels(before);
      if(this.model.lives<before.lives)this.cameras.main.flash(140,255,60,85);
      if(this.model.status==='gameover'){
        saveLumenBest(this.model.score);
        this.callbacks.onStatus('gameover');this.scene.pause();
      }
      this.drawBoard();
    }
  }
  public setMove(direction:Direction){if(direction!=='none'&&direction!==this.touchDirection)this.tryMove(direction);this.touchDirection=direction;this.moveTimer=125;}
  public setMuted(muted:boolean){this.muted=muted;}
  public restartGame(){this.scene.resume();this.reset();}
  public stopAudio(){void this.audio?.close();}
}
export function createLumenCircuit(container:HTMLElement,callbacks:GameCallbacks):GameHandle {
  const scene=new CircuitScene(callbacks);
  const game=new Phaser.Game({type:Phaser.AUTO,parent:container,width:W,height:H,
    backgroundColor:'#07121D',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    render:{antialias:true},input:{activePointers:2},scene:[scene]});
  return {
    pause(){if(scene.scene.isActive()){scene.scene.pause();callbacks.onStatus('paused');}},
    resume(){if(scene.scene.isPaused()){scene.scene.resume();callbacks.onStatus('playing');}},
    restart(){scene.restartGame();},
    setDirection(v:ControlDirection){scene.setMove(v<0?'left':v>0?'right':'none');},
    setMove(direction){scene.setMove(direction);},
    setMuted(muted){scene.setMuted(muted);},
    destroy(){scene.stopAudio();game.destroy(true);},
  };
}
