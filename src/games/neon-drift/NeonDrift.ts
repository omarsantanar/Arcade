import Phaser from 'phaser';
import type { ControlDirection, GameCallbacks, GameHandle } from '../types';
import { clamp, intersects, readBestScore, saveBestScore, spawnDelay } from './logic';

interface Obstacle { rect: Phaser.GameObjects.Rectangle; speed: number }

export function createNeonDrift(element: HTMLElement, callbacks: GameCallbacks): GameHandle {
  let direction: ControlDirection = 0;
  let muted = false;
  let gameOver = false;
  let score = 0;
  let elapsed = 0;
  let lastSpawn = 0;
  let obstacles: Obstacle[] = [];
  let player: Phaser.GameObjects.Triangle;
  let scoreLabel: Phaser.GameObjects.Text;
  let keys: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  let left: Phaser.Input.Keyboard.Key | undefined;
  let right: Phaser.Input.Keyboard.Key | undefined;

  const ping = (frequency: number) => {
    if (muted || typeof window.AudioContext === 'undefined') return;
    try {
      const context = new window.AudioContext();
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(0.035, context.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.13);
      oscillator.connect(volume).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.14);
      oscillator.onended = () => { void context.close(); };
    } catch { /* audio is optional on restricted devices */ }
  };

  class DriftScene extends Phaser.Scene {
    constructor() { super('drift'); }

    create() {
      obstacles = [];
      elapsed = 0;
      lastSpawn = 0;
      score = 0;
      gameOver = false;
      callbacks.onScore(0);
      callbacks.onStatus('playing');

      this.cameras.main.setBackgroundColor('#0a1023');
      const graphic = this.add.graphics();
      graphic.lineStyle(1, 0x223252, 0.5);
      for (let x = 24; x < 360; x += 48) graphic.lineBetween(x, 0, x, 600);
      for (let y = 0; y < 600; y += 48) graphic.lineBetween(0, y, 360, y);
      graphic.fillStyle(0xa9e7ff, 0.6);
      for (let i = 0; i < 42; i++) graphic.fillCircle((i * 137) % 354 + 3, (i * 239) % 588 + 6, i % 4 === 0 ? 1.5 : 0.75);
      this.add.rectangle(180, 560, 360, 80, 0x12203b, 0.5);
      player = this.add.triangle(180, 530, 0, 34, 16, 0, 32, 34, 0x8cf7f3).setStrokeStyle(2, 0xffffff, 0.7);
      this.add.text(18, 18, 'NEON DRIFT', { font: 'bold 13px monospace', color: '#9eacc6' });
      scoreLabel = this.add.text(342, 17, '0000', { font: 'bold 22px monospace', color: '#e8fbff' }).setOrigin(1, 0);
      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown && !gameOver) player.x = clamp(pointer.x, 20, 340);
      });
      keys = this.input.keyboard?.createCursorKeys();
      left = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      right = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    update(_time: number, delta: number) {
      if (gameOver) return;
      const dt = Math.min(delta, 50);
      elapsed += dt;
      const moveLeft = direction === -1 || keys?.left?.isDown || left?.isDown;
      const moveRight = direction === 1 || keys?.right?.isDown || right?.isDown;
      if (moveLeft !== moveRight) player.x = clamp(player.x + (moveLeft ? -1 : 1) * dt * 0.33, 20, 340);
      if (elapsed - lastSpawn >= spawnDelay(elapsed / 1000)) {
        lastSpawn = elapsed;
        const width = Phaser.Math.Between(38, 84);
        const x = Phaser.Math.Between(12 + width / 2, 348 - width / 2);
        const rect = this.add.rectangle(x, -32, width, 22, 0xff739c).setStrokeStyle(2, 0xffcbdb, 0.9);
        obstacles.push({ rect, speed: 180 + elapsed / 300 + Phaser.Math.Between(0, 65) });
      }
      const nextScore = Math.floor(elapsed / 110);
      if (nextScore !== score) {
        score = nextScore;
        scoreLabel.setText(String(score).padStart(4, '0'));
        callbacks.onScore(score);
      }
      const hitbox = { x: player.x - 12, y: player.y - 11, width: 24, height: 27 };
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.rect.y += obstacle.speed * dt / 1000;
        if (intersects(hitbox, {
          x: obstacle.rect.x - obstacle.rect.width / 2,
          y: obstacle.rect.y - obstacle.rect.height / 2,
          width: obstacle.rect.width,
          height: obstacle.rect.height,
        })) {
          gameOver = true;
          if (score > readBestScore()) saveBestScore(score);
          ping(185);
          callbacks.onStatus('gameover');
          break;
        }
        if (obstacle.rect.y > 640) {
          obstacle.rect.destroy();
          obstacles.splice(i, 1);
        }
      }
    }
  }

  const phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: element,
    width: 360,
    height: 600,
    backgroundColor: '#0a1023',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { pixelArt: false, antialias: true },
    scene: [DriftScene],
  });

  const scene = () => phaserGame.scene.getScene('drift');
  return {
    pause() {
      if (!gameOver && scene().scene.isActive()) { scene().scene.pause(); callbacks.onStatus('paused'); }
    },
    resume() {
      if (!gameOver && scene().scene.isPaused()) { scene().scene.resume(); callbacks.onStatus('playing'); }
    },
    restart() { direction = 0; scene().scene.start(); },
    setDirection(nextDirection) { direction = nextDirection; },
    setMuted(value) { muted = value; },
    destroy() { phaserGame.destroy(true); },
  };
}
