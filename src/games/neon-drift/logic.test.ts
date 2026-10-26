import { describe, expect, it } from 'vitest';
import {
  FIELD_WIDTH, LEVEL_SECONDS, PLAYER_Y, SHIP_HEIGHT, SHIP_WIDTH,
  SAFETY_MARGIN, clamp, difficultyAt, intersects, levelAt, pieceHitbox,
  planWave, randomSpawnDelay, reachableCenters, shouldSpawnVertical, spawnDelay, type WaveAnchor,
} from './logic';
import { catalog, findGame } from '../registry';

const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
};

describe('Neon Drift: harder but fair', () => {
  it('keeps rectangle intersections and clamping correct', () => {
    expect(clamp(-10, 0, 320)).toBe(0);
    expect(clamp(380, 0, 320)).toBe(320);
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 9, y: 9, width: 10, height: 10 })).toBe(true);
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(false);
  });

  it('raises the level at exactly seven-second boundaries', () => {
    expect(LEVEL_SECONDS).toBe(7);
    expect([0, 6.999, 7, 13.999, 14, 21].map(levelAt)).toEqual([1, 1, 2, 2, 3, 4]);
  });

  it('starts more aggressively without exceeding the safe minimum gap', () => {
    expect(difficultyAt(0).speed).toBeGreaterThanOrEqual(245);
    expect(spawnDelay(0)).toBeLessThanOrEqual(900);
    expect(difficultyAt(0).maxGap).toBeLessThan(100);
    for (let level = 1; level < 70; level++) {
      const before = difficultyAt((level - 1) * 7);
      const after = difficultyAt(level * 7);
      expect(after.speed).toBeGreaterThanOrEqual(before.speed);
      expect(after.interval).toBeLessThanOrEqual(before.interval);
      expect(after.minGap).toBeGreaterThanOrEqual(SHIP_WIDTH + 2 * SAFETY_MARGIN);
      expect(after.interval).toBeGreaterThanOrEqual(435);
    }
  });

  it('schedules the exceptional vertical blockade at levels 3, 6, 9 etc.', () => {
    expect(Array.from({ length: 15 }, (_, i) => i + 1).filter(shouldSpawnVertical)).toEqual([3, 6, 9, 12, 15]);
    expect(shouldSpawnVertical(0)).toBe(false);
    expect(shouldSpawnVertical(3.2)).toBe(false);
  });

  it('mixes different shapes, decoy slots and physically tall pillars', () => {
    const random = seeded(19);
    const shapes = new Set<string>();
    const patterns = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const plan = planWave(i * 0.25, i * 700, undefined, random);
      patterns.add(plan.pattern);
      plan.pieces.forEach(piece => shapes.add(piece.shape));
    }
    expect(patterns.size).toBe(4);
    expect(shapes.size).toBeGreaterThanOrEqual(4);
    for (const lv of [3, 6, 9, 12]) {
      const p = planWave((lv - 1) * 7, lv * 1000, undefined, seeded(lv), 'vertical');
      expect(p.pattern).toBe('vertical');
      expect(p.height).toBeGreaterThanOrEqual(160);
      expect(p.pieces.length).toBeGreaterThan(0);
      expect(p.pieces.every(piece => piece.shape === 'pillar' && piece.height === p.height)).toBe(true);
    }
  });

  it('guarantees a collision-free reachable witness through long sessions with pillars', () => {
    for (let seed = 1; seed <= 75; seed++) {
      const random = seeded(seed);
      let previous: WaveAnchor = { center: FIELD_WIDTH / 2, arrivalAt: 0, clearanceMs: 0 };
      let time = 0;
      let lastVerticalLevel = 0;
      let examined = 0;
      while (time < 600_000) {
        time += spawnDelay(time / 1000);
        const level = levelAt(time / 1000);
        const vertical = shouldSpawnVertical(level) && level !== lastVerticalLevel;
        const wave = planWave(time / 1000, time, previous, random, vertical ? 'vertical' : undefined);
        if (vertical) lastVerticalLevel = level;
        const availableTravelSeconds = Math.max(0, wave.arrivalAt - previous.arrivalAt -
          (previous.clearanceMs + wave.clearanceMs) / 2) / 1000;
        expect(wave.reachable.length).toBeGreaterThan(0);
        expect(wave.reachable).toEqual(reachableCenters(wave.openings, previous, wave.arrivalAt, wave.clearanceMs));
        expect(availableTravelSeconds).toBeGreaterThanOrEqual(0);
        expect(wave.gap).toBeGreaterThan(SHIP_WIDTH + 2 * SAFETY_MARGIN - 0.001);
        const ship = { x: wave.center - SHIP_WIDTH / 2, y: PLAYER_Y - SHIP_HEIGHT / 2, width: SHIP_WIDTH, height: SHIP_HEIGHT };
        for (const piece of wave.pieces) {
          expect(piece.x).toBeGreaterThanOrEqual(-0.001);
          expect(piece.x + piece.width).toBeLessThanOrEqual(FIELD_WIDTH + 0.001);
          expect(piece.height / 2 + Math.abs(piece.y)).toBeLessThanOrEqual(wave.height / 2 + 0.001);
          expect(intersects(ship, pieceHitbox(piece, PLAYER_Y))).toBe(false);
        }
        examined++;
        previous = wave;
      }
      expect(examined).toBeGreaterThan(850);
    }
  }, 30_000);
});


describe('Neon Drift: multiple valid exits and irregular encounters', () => {
  it('offers more than one honest opening in early levels, with varied placement', () => {
    const random = seeded(490);
    const variants = new Set<string>();
    for (let i = 0; i < 160; i++) {
      const wave = planWave(0, i * 1400, undefined, random);
      expect(wave.openings.length).toBeGreaterThanOrEqual(2);
      expect(wave.reachable.length).toBeGreaterThan(0);
      variants.add(wave.pattern + ':' + wave.openings.length + ':' + Math.round(wave.openings[0].left / 10));
    }
    expect(variants.size).toBeGreaterThan(40);
  });

  it('keeps multiple reachable, not merely visible, exits in most opening levels', () => {
    let total = 0;
    let alternatives = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const random = seeded(seed);
      let time = 0;
      let prior: WaveAnchor = { center: FIELD_WIDTH / 2, arrivalAt: 0, clearanceMs: 0 };
      while (time < 14000) {
        time += randomSpawnDelay(time / 1000, random);
        if (time >= 14000) break;
        const wave = planWave(time / 1000, time, prior, random);
        total++;
        if (wave.reachable.length >= 2) alternatives++;
        prior = wave;
      }
    }
    expect(total).toBeGreaterThan(300);
    expect(alternatives / total).toBeGreaterThan(0.85);
  });

  it('randomizes intervals between spawns within controlled bounds', () => {
    const random = seeded(12);
    const values = Array.from({ length: 100 }, () => randomSpawnDelay(0, random));
    expect(new Set(values).size).toBeGreaterThan(20);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(spawnDelay(0) * 0.76 - 1);
    expect(Math.max(...values)).toBeLessThanOrEqual(spawnDelay(0) * 1.33 + 1);
  });

  it('keeps safe options viable for long randomized sequences and vertical blockades', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const random = seeded(seed);
      let time = 0;
      let prev: WaveAnchor = { center: FIELD_WIDTH / 2, arrivalAt: 0, clearanceMs: 0 };
      let lastWall = 0;
      while (time < 300000) {
        time += randomSpawnDelay(time / 1000, random);
        const level = levelAt(time / 1000);
        const wall = shouldSpawnVertical(level) && level !== lastWall;
        if (wall) lastWall = level;
        const wave = planWave(time / 1000, time, prev, random, wall ? 'vertical' : undefined);
        expect(wave.reachable.length).toBeGreaterThan(0);
        expect(wave.reachable).toEqual(reachableCenters(wave.openings, prev, wave.arrivalAt, wave.clearanceMs));
        for (const lane of wave.reachable) {
          const ship = { x: (lane.left + lane.right) / 2 - SHIP_WIDTH / 2, y: PLAYER_Y - SHIP_HEIGHT / 2, width: SHIP_WIDTH, height: SHIP_HEIGHT };
          expect(wave.pieces.every(piece => !intersects(ship, pieceHitbox(piece, PLAYER_Y)))).toBe(true);
        }
        prev = wave;
      }
    }
  });
});

describe('Arcade catalog', () => {
  it('preserves independently registered game modules', () => {
    expect(new Set(catalog.map(game => game.id)).size).toBe(catalog.length);
    expect(catalog.filter(game => game.available)).toHaveLength(2);
    expect(findGame('neon-drift')?.title).toBe('Neon Drift');
  });
});
