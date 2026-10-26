import { describe, expect, it } from 'vitest';
import { clamp, intersects, spawnDelay } from './logic';
import { catalog, findGame } from '../registry';

describe('Neon Drift logic', () => {
  it('limits the ship to the play area', () => {
    expect(clamp(-10, 0, 320)).toBe(0);
    expect(clamp(380, 0, 320)).toBe(320);
  });
  it('detects overlap without treating shared edges as collisions', () => {
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 9, y: 9, width: 10, height: 10 })).toBe(true);
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(false);
  });
  it('increases difficulty with a lower bound on spawn interval', () => {
    expect(spawnDelay(0)).toBe(930);
    expect(spawnDelay(1000)).toBe(360);
  });
});

describe('catalog', () => {
  it('has distinct IDs and exactly one initially playable game', () => {
    expect(new Set(catalog.map((game) => game.id)).size).toBe(catalog.length);
    expect(catalog.filter((game) => game.available)).toHaveLength(1);
    expect(findGame('neon-drift')?.title).toBe('Neon Drift');
  });
});
