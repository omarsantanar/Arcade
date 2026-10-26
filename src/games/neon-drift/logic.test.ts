import { describe, expect, it } from 'vitest';
import {
  FIELD_WIDTH, LEVEL_SECONDS, PLAYER_MAX_X, PLAYER_MIN_X, SHIP_HEIGHT,
  SHIP_SPEED, SHIP_WIDTH, SPAWN_Y, SAFETY_MARGIN, clamp, difficultyAt,
  intersects, levelAt, planWave, spawnDelay, type WaveAnchor,
} from './logic';
import { catalog, findGame } from '../registry';

describe('Neon Drift geometry and levels', () => {
  it('clamps horizontal movement and detects real rectangle intersections', () => {
    expect(clamp(-10, 0, 320)).toBe(0);
    expect(clamp(380, 0, 320)).toBe(320);
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 9, y: 9, width: 10, height: 10 })).toBe(true);
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(false);
  });

  it('advances at exactly seven-second boundaries, never between them', () => {
    expect(LEVEL_SECONDS).toBe(7);
    expect([0, 6.999, 7, 13.999, 14, 21].map(levelAt)).toEqual([1, 1, 2, 2, 3, 4]);
    for (let n = 0; n <= 40; n++) {
      expect(levelAt(n * 7 + 6.999)).toBe(n + 1);
    }
  });

  it('adds speed, frequency and varying sizes, with safe upper bounds', () => {
    for (let n = 1; n <= 70; n++) {
      const before = difficultyAt((n - 1) * 7);
      const after = difficultyAt(n * 7);
      expect(after.speed).toBeGreaterThanOrEqual(before.speed);
      expect(after.interval).toBeLessThanOrEqual(before.interval);
      expect(after.minGap).toBeLessThanOrEqual(before.minGap);
      expect(after.maxHeight).toBeGreaterThanOrEqual(before.maxHeight);
      expect(after.interval).toBeGreaterThanOrEqual(430);
      expect(after.minGap).toBeGreaterThan(SHIP_WIDTH + SAFETY_MARGIN * 2);
    }
    expect(spawnDelay(0)).toBe(1100);
    expect(spawnDelay(700)).toBe(430);
  });

  it('always creates a gap wide enough for the real ship hitbox', () => {
    for (let i = 0; i < 300; i++) {
      const w = planWave(i * 7, i * 1300, undefined, () => ((i * 23) % 97) / 97);
      expect(w.right - w.left).toBeGreaterThanOrEqual(SHIP_WIDTH + SAFETY_MARGIN * 2);
      expect(w.left + SHIP_WIDTH / 2 + SAFETY_MARGIN).toBeLessThanOrEqual(w.center + 0.001);
      expect(w.right - SHIP_WIDTH / 2 - SAFETY_MARGIN).toBeGreaterThanOrEqual(w.center - 0.001);
      expect(w.center).toBeGreaterThanOrEqual(PLAYER_MIN_X);
      expect(w.center).toBeLessThanOrEqual(PLAYER_MAX_X);
    }
  });

  it('constructs a reachable legal trajectory for long randomized sessions', () => {
    // 50 deterministic sessions of five minutes each, including max difficulty.
    for (let seed = 1; seed <= 50; seed++) {
      let state = seed >>> 0;
      const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
      let previous: WaveAnchor = { center: FIELD_WIDTH / 2, arrivalAt: 0, clearanceMs: 0 };
      let currentTimeMs = 0;
      while (currentTimeMs < 300_000) {
        const delay = spawnDelay(currentTimeMs / 1000);
        currentTimeMs += delay;
        const wave = planWave(currentTimeMs / 1000, currentTimeMs, previous, random);
        const freeSeconds = Math.max(0, wave.arrivalAt - previous.arrivalAt -
          (previous.clearanceMs + wave.clearanceMs) / 2) / 1000;
        expect(Math.abs(wave.center - previous.center)).toBeLessThanOrEqual(SHIP_SPEED * freeSeconds + 0.0001);
        expect(wave.center - SHIP_WIDTH / 2 - SAFETY_MARGIN).toBeGreaterThanOrEqual(wave.left - 0.0001);
        expect(wave.center + SHIP_WIDTH / 2 + SAFETY_MARGIN).toBeLessThanOrEqual(wave.right + 0.0001);
        const shipY = 525;
        const centerHitbox = { x: wave.center - SHIP_WIDTH / 2, y: shipY - SHIP_HEIGHT / 2, width: SHIP_WIDTH, height: SHIP_HEIGHT };
        expect(intersects(centerHitbox, { x: 0, y: shipY - wave.height / 2, width: wave.left, height: wave.height })).toBe(false);
        expect(intersects(centerHitbox, { x: wave.right, y: shipY - wave.height / 2, width: FIELD_WIDTH - wave.right, height: wave.height })).toBe(false);
        expect(wave.arrivalAt).toBeGreaterThan(currentTimeMs + (525 - SPAWN_Y) / 600 * 1000);
        previous = wave;
      }
    }
  });
});

describe('Arcade catalog', () => {
  it('has distinct IDs and exactly one initially playable game', () => {
    expect(new Set(catalog.map((game) => game.id)).size).toBe(catalog.length);
    expect(catalog.filter((game) => game.available)).toHaveLength(1);
    expect(findGame('neon-drift')?.title).toBe('Neon Drift');
  });
});
