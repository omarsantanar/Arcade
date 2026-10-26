import Phaser from 'phaser';
import type { ControlDirection, GameCallbacks, GameHandle } from '../types';
import { advanceBeat, beatIntervalMs, createReactor, getLevel, occupiedCells,
  rotateRing, RINGS, SECTORS, savePulseBestScore,
  selectRing, type Frequency, type ReactorState } from './logic';

const WIDTH = 360;
const HEIGHT = 600;
const CX = WIDTH / 2;
const CY = 304;
const RADII = [58, 101, 144] as const;
const COLORS = [0x00f0ff, 0xff00aa, 0xa020f0] as const;
const SHAPES = ['circle', 'diamond', 'triangle'] as const;
const twoPi = Math.PI * 2;
const point = (ring: number, sector: number) => ({
  x: CX + RADII[ring] * Math.cos(-Math.PI / 2 + sector * twoPi / SECTORS),
  y: CY + RADII[ring] * Math.sin(-Math.PI / 2 + sector * twoPi / SECTORS),
});

class ReactorScene extends Phaser.Scene {
  private state: ReactorState = createReactor();
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private warningText!: Phaser.GameObjects.Text;
  private elapsed = 0;
  private untilNextBeat = 1900;
  private direction: ControlDirection = 0;
  private callbacks: GameCallbacks;
  private muted = false;
  private audio?: AudioContext;
  private pointerStart: { x: number; ring: number } | null = null;
  private readonly keyboardDirections: { [key: string]: Phaser.Input.Keyboard.Key } = {};

  constructor(callbacks: GameCallbacks) { super('PulseCore'); this.callbacks = callbacks; }

  create() {
    this.cameras.main.setBackgroundColor('#0A0A12');
    this.boardGraphics = this.add.graphics();
    this.drawStars();
    const heading = {fontFamily: 'monospace', color: '#ebebff', fontSize: '22px', fontStyle: 'bold'};
    this.add.text(18, 24, 'PULSE CORE', heading);
    this.add.text(19, 57, 'ALINEA LAS FRECUENCIAS · LIBERA EL REACTOR', {
      fontFamily: 'monospace', fontSize: '9px', color: '#a9a7d5',
    });
    this.scoreText = this.add.text(18, 90, 'ENERGÍA 0000', {fontFamily: 'monospace', fontSize: '14px', color: '#00f0ff'});
    this.levelText = this.add.text(240, 90, 'PULSO 01', {fontFamily: 'monospace', fontSize: '13px', color: '#c792f5'});
    this.warningText = this.add.text(WIDTH / 2, 496, '', {fontFamily: 'monospace', fontSize: '12px', color: '#ff759d'}).setOrigin(0.5);
    this.add.text(WIDTH / 2, 526, 'TOCA UN ANILLO · DESLIZA PARA GIRAR', {fontFamily: 'monospace', fontSize: '10px', color: '#b8bbd5'}).setOrigin(0.5);
    this.add.text(WIDTH / 2, 548, 'CONECTA 3 DEL MISMO SÍMBOLO', {fontFamily: 'monospace', fontSize: '10px', color: '#8d95bb'}).setOrigin(0.5);
    this.add.text(WIDTH / 2, 572, '← → GIRAR  ·  ↑ ↓ CAMBIAR ANILLO', {fontFamily: 'monospace', fontSize: '10px', color: '#7280a6'}).setOrigin(0.5);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const distance = Math.hypot(p.x - CX, p.y - CY);
      if (distance < 32 || distance > 166) { this.pointerStart = null; return; }
      const ring = RADII.reduce((nearest, radius, index) =>
        Math.abs(radius - distance) < Math.abs(RADII[nearest] - distance) ? index : nearest, 0);
      this.state = selectRing(this.state, ring);
      this.pointerStart = { x: p.x, ring };
      this.renderBoard();
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.pointerStart) return;
      const dx = p.x - this.pointerStart.x;
      if (Math.abs(dx) > 14) this.spin(dx > 0 ? 1 : -1);
      this.pointerStart = null;
    });
    if (this.input.keyboard) {
      for (const [name, key] of Object.entries({left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN',
        a: 'A', d: 'D', w: 'W', s: 'S'})) {
        this.keyboardDirections[name] = this.input.keyboard.addKey(key);
      }
      this.input.keyboard.addCapture(['LEFT', 'RIGHT', 'UP', 'DOWN', 'SPACE']);
    }
    this.reset();
  }

  private drawStars(): void {
    const stars = this.add.graphics();
    // Seeded visual background: static and independent of puzzle randomness.
    let seed = 81;
    const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    for (let i = 0; i < 68; i++) {
      stars.fillStyle(i % 3 === 0 ? 0x685fa8 : 0x65768a, 0.15 + rand() * 0.37);
      stars.fillCircle(rand() * WIDTH, 120 + rand() * 368, 0.7 + rand() * 1.1);
    }
  }

  private reset(): void {
    this.state = createReactor();
    this.elapsed = 0;
    this.untilNextBeat = beatIntervalMs(1);
    this.direction = 0;
    this.callbacks.onScore(0);
    this.callbacks.onStatus('playing');
    this.renderBoard();
  }

  private renderBoard(): void {
    const g = this.boardGraphics;
    if (!g) return;
    g.clear();
    const selection = this.state.selectedRing;
    for (let ring = RINGS - 1; ring >= 0; ring--) {
      g.lineStyle(ring === selection ? 3 : 1, ring === selection ? 0x00f0ff : 0x61628c, ring === selection ? 0.7 : 0.24);
      g.strokeCircle(CX, CY, RADII[ring]);
      g.lineStyle(1, 0x44456d, 0.28);
      for (let sector = 0; sector < SECTORS; sector++) {
        const p = point(ring, sector);
        g.strokeCircle(p.x, p.y, 16);
      }
    }
    for (let sector = 0; sector < SECTORS; sector++) {
      const radians = -Math.PI / 2 + sector * twoPi / SECTORS;
      g.lineStyle(1, 0x49425c, 0.20);
      g.lineBetween(CX + 30 * Math.cos(radians), CY + 30 * Math.sin(radians),
        CX + 155 * Math.cos(radians), CY + 155 * Math.sin(radians));
    }
    for (let ring = 0; ring < RINGS; ring++) {
      for (let sector = 0; sector < SECTORS; sector++) {
        const frequency = this.state.board[ring][sector];
        if (frequency === null) continue;
        const p = point(ring, sector);
        this.drawNode(g, p.x, p.y, frequency);
      }
    }
    g.fillStyle(0x15162e, 1);
    g.fillCircle(CX, CY, 29);
    g.lineStyle(2, 0xbba9ed, 0.8);
    g.strokeCircle(CX, CY, 26);
    g.fillStyle(0x00f0ff, 0.2);
    g.fillCircle(CX, CY, 19);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(CX, CY, 6);
    this.scoreText.setText(`ENERGÍA ${this.state.score.toString().padStart(4, '0')}`);
    this.levelText.setText(`PULSO ${getLevel(this.elapsed).toString().padStart(2, '0')}`);
    const load = Math.round(occupiedCells(this.state.board) / (RINGS * SECTORS) * 100);
    this.warningText.setText(this.state.jams ? `¡SATURACIÓN ${this.state.jams}/3! · CARGA ${load}%` : `CARGA DEL REACTOR ${load}%`);
  }

  private drawNode(g: Phaser.GameObjects.Graphics, x: number, y: number, frequency: Frequency): void {
    const color = COLORS[frequency];
    g.fillStyle(color, 0.07);
    g.fillCircle(x, y, 23);
    g.fillStyle(0x10172d, 1);
    g.fillCircle(x, y, 15);
    g.lineStyle(2.6, color, 1);
    g.strokeCircle(x, y, 15);
    g.fillStyle(color, 0.9);
    if (SHAPES[frequency] === 'circle') g.fillCircle(x, y, 6);
    else if (SHAPES[frequency] === 'diamond') g.fillPoints([{x, y: y - 8}, {x:x + 8,y}, {x, y:y + 8}, {x:x-8,y}], true);
    else g.fillTriangle(x, y - 9, x + 8, y + 7, x - 8, y + 7);
  }

  private spin(delta: -1 | 1): void {
    if (this.state.status !== 'playing' || !this.scene.isActive()) return;
    const previousScore = this.state.score;
    this.state = rotateRing(this.state, delta);
    this.emitScore(previousScore);
    this.renderBoard();
  }

  private playDischargeSound(): void {
    if (this.muted) return;
    try {
      this.audio ??= new window.AudioContext();
      if (this.audio.state !== 'running') return;
      const osc = this.audio.createOscillator();
      const volume = this.audio.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, this.audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1020, this.audio.currentTime + 0.13);
      volume.gain.setValueAtTime(0.08, this.audio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + 0.16);
      osc.connect(volume).connect(this.audio.destination);
      osc.start();
      osc.stop(this.audio.currentTime + 0.17);
    } catch { /* Audio is optional and may be disabled by browser policy. */ }
  }

  private emitScore(previous: number): void {
    if (this.state.score <= previous) return;
    this.callbacks.onScore(this.state.score);
    savePulseBestScore(this.state.score);
    this.playDischargeSound();
    this.cameras.main.flash(75, 0, 240, 255, false);
  }

  update(_time: number, deltaMs: number): void {
    if (this.state.status !== 'playing') return;
    const keys = this.keyboardDirections;
    const pressed = (a: string, b: string) =>
      (keys[a] && Phaser.Input.Keyboard.JustDown(keys[a])) || (keys[b] && Phaser.Input.Keyboard.JustDown(keys[b]));
    if (pressed('up', 'w')) this.state = selectRing(this.state, this.state.selectedRing - 1);
    if (pressed('down', 's')) this.state = selectRing(this.state, this.state.selectedRing + 1);
    if (pressed('left', 'a')) this.spin(-1);
    if (pressed('right', 'd')) this.spin(1);
    this.elapsed += Math.min(deltaMs, 100);
    this.untilNextBeat -= Math.min(deltaMs, 100);
    if (this.untilNextBeat <= 0) {
      const previous = this.state.score;
      this.state = advanceBeat(this.state);
      this.emitScore(previous);
      this.untilNextBeat += beatIntervalMs(getLevel(this.elapsed));
      if (this.state.status === 'gameover') {
        savePulseBestScore(this.state.score);
        this.callbacks.onStatus('gameover');
        this.scene.pause();
      }
    }
    this.renderBoard();
  }

  public setDirection(next: ControlDirection): void {
    if (next !== 0 && next !== this.direction) this.spin(next);
    this.direction = next;
  }
  public setMuted(next: boolean): void { this.muted = next; }
  public startOver(): void { this.scene.resume(); this.reset(); }
  public shutdown(): void { void this.audio?.close(); }
}

export function createPulseCore(container: HTMLElement, callbacks: GameCallbacks): GameHandle {
  const scene = new ReactorScene(callbacks);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#0A0A12',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true },
    input: { activePointers: 2 },
    scene: [scene],
  });
  return {
    pause() { if (scene.scene.isActive()) { scene.scene.pause(); callbacks.onStatus('paused'); } },
    resume() { if (scene.scene.isPaused()) { scene.scene.resume(); callbacks.onStatus('playing'); } },
    restart() { scene.startOver(); },
    setDirection(next) { scene.setDirection(next); },
    setMuted(next) { scene.setMuted(next); },
    destroy() { scene.shutdown(); game.destroy(true); },
  };
}
