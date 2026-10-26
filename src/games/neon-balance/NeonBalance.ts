import Phaser from 'phaser';
import type { ControlDirection, GameCallbacks, GameHandle } from '../types';
import { chooseLane, intervalAt, LANES, levelAt, MAX_HEIGHT, newBalance, placeWeight,
  saveBalanceBest, TORQUE_LIMIT, type BalanceState } from './logic';

const W = 360;
const H = 600;
const CENTER_X = 180;
const BEAM_Y = 420;
const LANE_SPACING = 46;
const LANE_START = CENTER_X - 3 * LANE_SPACING;
const WEIGHT_COLORS = [0x66eddd, 0x6dd4ff, 0xffbd69, 0xff6b91] as const;
const xFor = (lane: number) => LANE_START + lane * LANE_SPACING;

function rotatePoint(x: number, y: number, radians: number) {
  const dx = x - CENTER_X, dy = y - BEAM_Y;
  return { x: CENTER_X + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: BEAM_Y + dx * Math.sin(radians) + dy * Math.cos(radians) };
}

class BalanceScene extends Phaser.Scene {
  private model: BalanceState = newBalance();
  private graphics!: Phaser.GameObjects.Graphics;
  private info!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private countdown!: Phaser.GameObjects.Text;
  private elapsed = 0;
  private untilNext = 3100;
  private direction: ControlDirection = 0;
  private readonly callbacks: GameCallbacks;
  private muted = false;
  private audio?: AudioContext;
  private lock = false;
  private readonly keys: { [key: string]: Phaser.Input.Keyboard.Key } = {};

  constructor(callbacks: GameCallbacks) { super('NeonBalance'); this.callbacks = callbacks; }

  create() {
    this.cameras.main.setBackgroundColor('#080d19');
    const stars = this.add.graphics();
    let seed = 1235;
    for (let i = 0; i < 48; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const x = seed % W;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const y = 155 + seed % 375;
      stars.fillStyle(i % 3 === 0 ? 0x75a8ef : 0x6c738e, 0.27);
      stars.fillCircle(x, y, 0.65 + (i % 3) * 0.2);
    }
    this.graphics = this.add.graphics();
    this.add.text(16, 20, 'NEON BALANCE', { fontFamily:'monospace', fontSize:'24px', color:'#66eddd', fontStyle:'bold' });
    this.add.text(17, 55, 'COLOCA BLOQUES SIN VOLCAR LA PLATAFORMA', { fontFamily:'monospace', fontSize:'9px', color:'#c4d4e9' });
    this.scoreText = this.add.text(17, 82, '', { fontFamily:'monospace', fontSize:'13px', color:'#e9f5ff' });
    this.info = this.add.text(17, 115, '', { fontFamily:'monospace', fontSize:'11px', color:'#ffcc75' });
    this.countdown = this.add.text(17, 138, '', { fontFamily:'monospace', fontSize:'10px', color:'#9cb7d8' });
    this.stateText = this.add.text(CENTER_X, 520, '', { fontFamily:'monospace', fontSize:'12px', color:'#88fff0' }).setOrigin(0.5);
    this.add.text(CENTER_X, 545, 'TOCA UNA COLUMNA PARA SOLTAR EL BLOQUE', { fontFamily:'monospace', fontSize:'9px', color:'#b5c4de' }).setOrigin(0.5);
    this.add.text(CENTER_X, 568, '← → ELEGIR · ESPACIO = SOLTAR', { fontFamily:'monospace', fontSize:'10px', color:'#8a9fbf' }).setOrigin(0.5);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 165 || pointer.y > 512) return;
      const lane = Math.max(0, Math.min(LANES - 1, Math.round((pointer.x - LANE_START) / LANE_SPACING)));
      this.model = chooseLane(this.model, lane);
      this.drop();
    });
    if (this.input.keyboard) {
      for (const [name, key] of Object.entries({left:'LEFT',right:'RIGHT',a:'A',d:'D',drop:'SPACE',enter:'ENTER'})) {
        this.keys[name] = this.input.keyboard.addKey(key);
      }
      this.input.keyboard.addCapture(['LEFT','RIGHT','SPACE','ENTER']);
    }
    this.restartNow();
  }

  private restartNow() {
    this.model = newBalance();
    this.elapsed = 0;
    this.untilNext = intervalAt(1);
    this.lock = false;
    this.direction = 0;
    this.callbacks.onScore(0);
    this.callbacks.onStatus('playing');
    this.draw();
  }

  private playTone() {
    if (this.muted) return;
    try {
      this.audio ??= new window.AudioContext();
      if (this.audio.state !== 'running') return;
      const oscillator = this.audio.createOscillator();
      const gain = this.audio.createGain();
      oscillator.frequency.setValueAtTime(200 + this.model.nextWeight * 100, this.audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(110, this.audio.currentTime + 0.1);
      gain.gain.setValueAtTime(0.045, this.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + 0.12);
      oscillator.connect(gain).connect(this.audio.destination);
      oscillator.start();
      oscillator.stop(this.audio.currentTime + 0.12);
    } catch { /* Optional game sound. */ }
  }

  private drop() {
    if (this.lock || this.model.status !== 'playing' || !this.scene.isActive()) return;
    this.lock = true;
    const previousDanger = this.model.danger;
    this.model = placeWeight(this.model, levelAt(this.elapsed));
    this.untilNext = intervalAt(levelAt(this.elapsed));
    this.callbacks.onScore(this.model.score);
    saveBalanceBest(this.model.score);
    if (previousDanger && !this.model.danger) this.cameras.main.flash(120, 30, 190, 140);
    if (this.model.danger) this.cameras.main.shake(90, 0.002);
    this.playTone();
    this.draw();
    if (this.model.status === 'gameover') {
      this.callbacks.onStatus('gameover');
      this.scene.pause();
    }
    this.lock = false;
  }

  private draw() {
    if (!this.graphics) return;
    const g = this.graphics;
    g.clear();
    const level = levelAt(this.elapsed);
    const t = this.model.torque;
    const tilt = Phaser.Math.Clamp(t / TORQUE_LIMIT * 0.24, -0.36, 0.36);
    const at = (x:number,y:number) => rotatePoint(x,y,tilt);
    g.lineStyle(1,0x34536e,0.55);
    for (let lane=0;lane<LANES;lane++) {
      const x=xFor(lane);
      g.lineBetween(x,184,x,487);
    }

    // Balance meter: center is safe, edges are dangerous.
    g.fillStyle(0x1b2840,1); g.fillRoundedRect(38,172,284,14,7);
    g.fillStyle(0xff708e,0.8);g.fillRoundedRect(40,174,72,10,4);
    g.fillStyle(0x67e4cc,0.9);g.fillRoundedRect(112,174,136,10,4);
    g.fillStyle(0xff708e,0.8);g.fillRoundedRect(248,174,72,10,4);
    const meterX=180+Phaser.Math.Clamp(t/TORQUE_LIMIT,-1,1)*134;
    g.fillStyle(0xffffff,1);g.fillCircle(meterX,179,7);
    g.lineStyle(2,0x152a4f,1);g.strokeCircle(meterX,179,7);

    // The next weight is always shown directly above its target column.
    const previewX=xFor(this.model.lane);
    g.lineStyle(3,0xf0f6ff,0.8);
    g.lineBetween(previewX,218,previewX,BEAM_Y-13);
    g.fillStyle(WEIGHT_COLORS[this.model.nextWeight-1],0.96);
    g.fillRoundedRect(previewX-20,201,40,28,5);
    g.fillStyle(0x101a2a,1);
    for(let d=0;d<this.model.nextWeight;d++)g.fillCircle(previewX-12+d*8,215,2.7);

    // Platform and pivot transform around the center according to mass imbalance.
    const left=at(20,BEAM_Y),right=at(340,BEAM_Y);
    g.lineStyle(13,0x375b71,1);g.lineBetween(left.x,left.y,right.x,right.y);
    g.lineStyle(5,0x7cf2e3,1);g.lineBetween(left.x,left.y-2,right.x,right.y-2);
    g.fillStyle(0x182b44,1);g.fillTriangle(180,428,153,494,207,494);
    g.fillStyle(0xe3eaff,1);g.fillCircle(180,BEAM_Y,8);

    for(let lane=0;lane<LANES;lane++) {
      this.model.stacks[lane].forEach((mass,index)=>{
        const x=xFor(lane), y=BEAM_Y-17-index*29;
        const v=[at(x-19,y-12),at(x+19,y-12),at(x+19,y+12),at(x-19,y+12)];
        g.fillStyle(WEIGHT_COLORS[mass-1],0.91);g.fillPoints(v,true);
        g.lineStyle(2,0xefffff,0.54);g.strokePoints(v,true);
        for(let dot=0;dot<mass;dot++){
          const p=at(x-10+dot*7,y);
          g.fillStyle(0x0d1831,0.9);g.fillCircle(p.x,p.y,2.2);
        }
      });
    }

    this.scoreText.setText('PUNTOS '+this.model.score+'  ·  NIVEL '+level);
    this.info.setText('SIGUIENTE: PESO '+this.model.nextWeight+'    ·    BLOQUES '+this.model.moves);
    this.countdown.setText('NUEVA PIEZA EN '+(this.untilNext/1000).toFixed(1)+' s');
    const full=this.model.stacks[this.model.lane].length>=MAX_HEIGHT;
    this.stateText.setColor(this.model.danger ? '#ff728e' : '#8affdf');
    this.stateText.setText(this.model.danger ? '¡PELIGRO! EQUILIBRA EN EL PRÓXIMO BLOQUE' :
      full ? 'COLUMNA LLENA: ELIGE OTRA' : 'MANTÉN LA PLATAFORMA NIVELADA');
  }

  update(_time:number,delta:number) {
    if (this.model.status!=='playing') return;
    const wasPressed=(a:string,b:string)=>Phaser.Input.Keyboard.JustDown(this.keys[a])||Phaser.Input.Keyboard.JustDown(this.keys[b]);
    if (wasPressed('left','a')) this.model=chooseLane(this.model,this.model.lane-1);
    if (wasPressed('right','d')) this.model=chooseLane(this.model,this.model.lane+1);
    if (wasPressed('drop','enter')) this.drop();
    const dt=Math.min(100,delta);
    this.elapsed+=dt;this.untilNext-=dt;
    if(this.untilNext<=0)this.drop();
    this.draw();
  }
  public steer(direction:ControlDirection) {
    if(direction!==0 && direction!==this.direction) {
      this.model=chooseLane(this.model,this.model.lane+direction);
      this.draw();
    }
    this.direction=direction;
  }
  public setMute(muted:boolean) {this.muted=muted;}
  public reset(){this.scene.resume();this.restartNow();}
  public dispose(){void this.audio?.close();}
}

export function createNeonBalance(parent:HTMLElement,callbacks:GameCallbacks):GameHandle {
  const scene=new BalanceScene(callbacks);
  const game=new Phaser.Game({type:Phaser.AUTO,parent,width:W,height:H,
    backgroundColor:'#080d19',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    render:{antialias:true},input:{activePointers:2},scene:[scene]});
  return {
    pause(){if(scene.scene.isActive()){scene.scene.pause();callbacks.onStatus('paused');}},
    resume(){if(scene.scene.isPaused()){scene.scene.resume();callbacks.onStatus('playing');}},
    restart(){scene.reset();},
    setDirection(v){scene.steer(v);},
    setMuted(v){scene.setMute(v);},
    destroy(){scene.dispose();game.destroy(true);},
  };
}
