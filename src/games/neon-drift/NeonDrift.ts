import Phaser from 'phaser';
import type { ControlDirection, GameCallbacks, GameHandle } from '../types';
import {
  FIELD_WIDTH, PLAYER_MAX_X, PLAYER_MIN_X, PLAYER_Y, SHIP_HEIGHT, SHIP_SPEED,
  SHIP_WIDTH, SPAWN_Y, clamp, difficultyAt, intersects, levelAt,
  planWave, readBestScore, saveBestScore, spawnDelay, type WaveAnchor, type WavePlan,
} from './logic';

const COLORS = { bg: 0x0a0a12, cyan: 0x00f0ff, pink: 0xff00aa, violet: 0xa020f0 };
interface FallingWave { graphics: Phaser.GameObjects.Graphics; plan: WavePlan; y: number; nearMiss: boolean }
interface Star { x: number; y: number; speed: number; radius: number; alpha: number }

export function createNeonDrift(element: HTMLElement, callbacks: GameCallbacks): GameHandle {
  let direction: ControlDirection = 0;
  let muted = false;
  let gameOver = false;
  let score = 0;
  let elapsed = 0;
  let lastSpawn = 0;
  let level = 1;
  let waves: FallingWave[] = [];
  let player: Phaser.GameObjects.Container;
  let shipGlow: Phaser.GameObjects.Graphics;
  let stars: Star[] = [];
  let starfield: Phaser.GameObjects.Graphics;
  let scoreLabel: Phaser.GameObjects.Text;
  let levelLabel: Phaser.GameObjects.Text;
  let nextLabel: Phaser.GameObjects.Text;
  let keys: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  let left: Phaser.Input.Keyboard.Key | undefined;
  let right: Phaser.Input.Keyboard.Key | undefined;
  let previous: WaveAnchor = { center: FIELD_WIDTH / 2, arrivalAt: 0, clearanceMs: 0 };

  const ping = (frequency: number, duration = 0.12) => {
    if (muted || typeof window.AudioContext === 'undefined') return;
    try {
      const context = new window.AudioContext();
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.22, context.currentTime + duration);
      volume.gain.setValueAtTime(0.026, context.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(volume).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
      oscillator.onended = () => { void context.close(); };
    } catch { /* Audio must never interrupt play. */ }
  };

  class DriftScene extends Phaser.Scene {
    constructor() { super('drift'); }

    drawShip() {
      const exhaust = this.add.graphics();
      const body = this.add.graphics();
      const cockpit = this.add.graphics();
      // All geometry centered on the same point as the physical hitbox.
      exhaust.fillStyle(COLORS.cyan, 0.2).fillTriangle(-8, 16, -4, 34, 0, 18);
      exhaust.fillStyle(COLORS.pink, 0.2).fillTriangle(0, 18, 4, 34, 8, 16);
      exhaust.fillStyle(COLORS.cyan, 0.95).fillTriangle(-5, 14, -2, 25, 0, 15);
      exhaust.fillStyle(COLORS.pink, 0.95).fillTriangle(0, 15, 2, 25, 5, 14);
      body.lineStyle(7, COLORS.cyan, 0.11).strokeTriangle(0, -17, -15, 16, 15, 16);
      body.fillStyle(0x11192c, 1).fillTriangle(0, -17, -15, 16, 15, 16);
      body.lineStyle(2, COLORS.cyan, 1).strokeTriangle(0, -17, -15, 16, 15, 16);
      body.lineStyle(1, COLORS.pink, 1).lineBetween(0, -17, 15, 16);
      cockpit.fillStyle(0x00f0ff, 0.22).fillEllipse(0, 2, 12, 17);
      cockpit.fillStyle(0x00f0ff).fillCircle(0, 1, 4);
      cockpit.lineStyle(1, 0xffffff, 0.9).strokeCircle(0, 1, 4);
      player = this.add.container(180, PLAYER_Y, [exhaust, body, cockpit]);
      shipGlow = exhaust;
      return player;
    }

    drawBlock(graphics: Phaser.GameObjects.Graphics, x: number, width: number, height: number, style: number) {
      if (width <= 0) return;
      // A continuous physical barrier, with visual panels of different sizes.
      const color = [COLORS.pink, COLORS.violet, COLORS.cyan, COLORS.pink, COLORS.violet][style];
      graphics.fillStyle(0x130c24, 0.96).fillRect(x, -height / 2, width, height);
      graphics.lineStyle(7, color, 0.09).strokeRect(x + 1, -height / 2 + 1, Math.max(1, width - 2), Math.max(1, height - 2));
      graphics.lineStyle(2, color, 0.94).strokeRect(x + 1, -height / 2 + 1, Math.max(1, width - 2), Math.max(1, height - 2));
      const panels = Math.max(1, Math.ceil(width / (29 + style * 6)));
      for (let i = 1; i < panels; i++) {
        const xx = x + i * width / panels;
        graphics.lineStyle(1, color, 0.6).lineBetween(xx, -height / 2 + 4, xx + (style % 2 === 0 ? 8 : -6), height / 2 - 4);
      }
      const cx = x + width / 2;
      if (width > 25) {
        if (style === 0 || style === 3) {
          graphics.lineStyle(2, color, 0.8).strokeCircle(cx, 0, Math.min(height * 0.29, width * 0.23));
          graphics.lineStyle(1, 0xffffff, 0.55).lineBetween(cx - 7, -3, cx + 5, 5);
        } else if (style === 1 || style === 4) {
          graphics.lineStyle(1, color, 0.9).strokeTriangle(cx, -height * 0.3, cx - 12, height * 0.25, cx + 12, height * 0.25);
        } else {
          graphics.lineStyle(2, color, 0.82).strokeRect(cx - 9, -height * 0.24, 18, height * 0.48);
        }
      }
    }

    spawnWave() {
      const plan = planWave(elapsed / 1000, elapsed, previous);
      previous = plan;
      const graphics = this.add.graphics();
      this.drawBlock(graphics, 0, plan.left, plan.height, plan.style);
      this.drawBlock(graphics, plan.right, FIELD_WIDTH - plan.right, plan.height, (plan.style + 2) % 5);
      graphics.setPosition(0, SPAWN_Y);
      waves.push({ graphics, plan, y: SPAWN_Y, nearMiss: false });
    }

    create() {
      elapsed = 0;
      lastSpawn = 0;
      level = 1;
      score = 0;
      gameOver = false;
      direction = 0;
      waves = [];
      previous = { center: FIELD_WIDTH / 2, arrivalAt: 0, clearanceMs: 0 };
      callbacks.onScore(0);
      callbacks.onStatus('playing');
      this.cameras.main.setBackgroundColor('#0A0A12');
      const grid = this.add.graphics();
      grid.lineStyle(1, 0x421f5b, 0.25);
      for (let x = 24; x < FIELD_WIDTH; x += 48) grid.lineBetween(x, 0, x, 600);
      for (let y = 0; y < 600; y += 48) grid.lineBetween(0, y, FIELD_WIDTH, y);
      stars = Array.from({ length: 55 }, (_, i) => ({
        x: (i * 127.4 + 39) % FIELD_WIDTH,
        y: (i * 237.7 + 71) % 600,
        speed: 15 + (i % 6) * 12,
        radius: (i % 5 === 0 ? 1.5 : 0.75),
        alpha: 0.23 + (i % 5) * 0.14,
      }));
      starfield = this.add.graphics();
      this.add.rectangle(180, 566, 360, 68, 0x170c2c, 0.35);
      this.drawShip();
      this.add.text(15, 12, 'NEON DRIFT', { font: 'bold 14px monospace', color: '#00F0FF' }).setShadow(0, 0, '#00F0FF', 5);
      levelLabel = this.add.text(15, 32, 'NIVEL 01', { font: 'bold 12px monospace', color: '#FF00AA' });
      nextLabel = this.add.text(15, 49, 'SIGUIENTE NIVEL 7s', { font: '10px monospace', color: '#9E80C0' });
      scoreLabel = this.add.text(344, 12, '0000', { font: 'bold 21px monospace', color: '#E8FBFF' }).setOrigin(1, 0);
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown && !gameOver) player.x = clamp(pointer.x, PLAYER_MIN_X, PLAYER_MAX_X);
      });
      keys = this.input.keyboard?.createCursorKeys();
      left = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      right = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    nearMiss(x: number, y: number) {
      ping(620, 0.1);
      for (let i = 0; i < 7; i++) {
        const spark = this.add.circle(x, y, i % 2 ? 1 : 2, i % 2 ? COLORS.pink : COLORS.cyan);
        this.tweens.add({ targets: spark, x: x + Phaser.Math.Between(-18, 18), y: y + Phaser.Math.Between(-22, 22), alpha: 0, duration: 290, onComplete: () => spark.destroy() });
      }
    }

    update(_time: number, delta: number) {
      if (gameOver) return;
      const dt = Math.min(delta, 50);
      elapsed += dt;
      const currentDifficulty = difficultyAt(elapsed / 1000);
      if (currentDifficulty.level !== level) {
        level = currentDifficulty.level;
        levelLabel.setText(`NIVEL ${String(level).padStart(2, '0')}`);
        levelLabel.setColor(level % 2 ? '#FF00AA' : '#00F0FF');
        ping(370 + level * 12, 0.18);
        const alert = this.add.text(180, 190, `NIVEL ${level}`, { font: 'bold 28px monospace', color: '#00F0FF' }).setOrigin(0.5).setShadow(0, 0, '#FF00AA', 12);
        this.tweens.add({ targets: alert, alpha: 0, y: 157, duration: 850, onComplete: () => alert.destroy() });
      }
      nextLabel.setText(`SIGUIENTE NIVEL ${Math.max(0, Math.ceil(7 - (elapsed / 1000) % 7))}s`);

      const moveLeft = direction === -1 || keys?.left?.isDown || left?.isDown;
      const moveRight = direction === 1 || keys?.right?.isDown || right?.isDown;
      if (moveLeft !== moveRight) player.x = clamp(player.x + (moveLeft ? -1 : 1) * dt * SHIP_SPEED / 1000, PLAYER_MIN_X, PLAYER_MAX_X);
      player.rotation += ((moveLeft ? -0.15 : moveRight ? 0.15 : 0) - player.rotation) * Math.min(1, dt / 90);
      shipGlow.alpha = 0.72 + Math.sin(elapsed / 60) * 0.23;
      starfield.clear();
      const starSpeed = 0.65 + currentDifficulty.speed / 370;
      for (const s of stars) {
        s.y = (s.y + s.speed * starSpeed * dt / 1000) % 600;
        starfield.fillStyle(0xb6ddff, s.alpha).fillCircle(s.x, s.y, s.radius);
        if (level >= 3) starfield.lineStyle(1, s.x % 2 ? COLORS.violet : COLORS.cyan, s.alpha * 0.35).lineBetween(s.x, s.y - level * 1.5, s.x, s.y);
      }
      if (elapsed - lastSpawn >= spawnDelay(elapsed / 1000)) {
        lastSpawn = elapsed;
        this.spawnWave();
      }
      const nextScore = Math.floor(elapsed / 110);
      if (nextScore !== score) {
        score = nextScore;
        scoreLabel.setText(String(score).padStart(4, '0'));
        callbacks.onScore(score);
      }
      const hitbox = { x: player.x - SHIP_WIDTH / 2, y: PLAYER_Y - SHIP_HEIGHT / 2, width: SHIP_WIDTH, height: SHIP_HEIGHT };
      for (let i = waves.length - 1; i >= 0; i--) {
        const wave = waves[i];
        wave.y += wave.plan.speed * dt / 1000;
        wave.graphics.y = wave.y;
        const top = wave.y - wave.plan.height / 2;
        const leftBox = { x: 0, y: top, width: wave.plan.left, height: wave.plan.height };
        const rightBox = { x: wave.plan.right, y: top, width: FIELD_WIDTH - wave.plan.right, height: wave.plan.height };
        if (intersects(hitbox, leftBox) || intersects(hitbox, rightBox)) {
          gameOver = true;
          if (score > readBestScore()) saveBestScore(score);
          this.cameras.main.flash(180, 255, 0, 170);
          ping(145, 0.3);
          callbacks.onStatus('gameover');
          break;
        }
        if (!wave.nearMiss && wave.y > PLAYER_Y + SHIP_HEIGHT / 2 + wave.plan.height / 2) {
          wave.nearMiss = true;
          if (Math.min(Math.abs(player.x - wave.plan.left), Math.abs(wave.plan.right - player.x)) < SHIP_WIDTH / 2 + 30) this.nearMiss(player.x, PLAYER_Y - 10);
        }
        if (wave.y > 660) {
          wave.graphics.destroy();
          waves.splice(i, 1);
        }
      }
    }
  }

  const phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: element,
    width: FIELD_WIDTH,
    height: 600,
    backgroundColor: '#0A0A12',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { pixelArt: false, antialias: true },
    scene: [DriftScene],
  });

  const scene = () => phaserGame.scene.getScene('drift');
  return {
    pause() { if (!gameOver && scene().scene.isActive()) { scene().scene.pause(); callbacks.onStatus('paused'); } },
    resume() { if (!gameOver && scene().scene.isPaused()) { scene().scene.resume(); callbacks.onStatus('playing'); } },
    restart() { direction = 0; scene().scene.start(); },
    setDirection(nextDirection) { direction = nextDirection; },
    setMuted(value) { muted = value; },
    destroy() { phaserGame.destroy(true); },
  };
}
