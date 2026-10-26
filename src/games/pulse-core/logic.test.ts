import { describe, expect, it } from 'vitest';
import { advanceBeat, beatIntervalMs, createReactor, emptyBoard, energizedCells,
  getLevel, occupiedCells, rotateRing, selectRing, SECTORS, RINGS } from './logic';

const seeded = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

describe('Pulse Core reactor logic', () => {
  it('initializes a seeded asymmetric board without a resolved pulse', () => {
    const first = createReactor(seeded(9));
    expect(first.board).toHaveLength(RINGS);
    expect(first.board.every(row => row.length === SECTORS)).toBe(true);
    expect(first.board).toEqual(createReactor(seeded(9)).board);
    expect(occupiedCells(first.board)).toBe(8);
  });
  it('scales rhythm without losing time jitter', () => {
    expect(getLevel(0)).toBe(1);
    expect(getLevel(16000)).toBe(2);
    expect(beatIntervalMs(8, () => 0.5)).toBeLessThan(beatIntervalMs(1, () => 0.5));
    expect(beatIntervalMs(1, () => 0)).not.toEqual(beatIntervalMs(1, () => 0.9));
    expect(beatIntervalMs(100, () => 0.5)).toBeGreaterThanOrEqual(620);
  });
  it('clears only connected radial or arc energy, never full rows', () => {
    const board = emptyBoard();
    board[0][2] = board[1][2] = board[2][2] = 1;
    board[2][5] = board[2][6] = board[2][7] = 0;
    expect(energizedCells(board)).toHaveLength(6);
    board[1][2] = 2;
    expect(energizedCells(board)).toHaveLength(3);
  });
  it('rotates a selected ring and fires an energized radial path', () => {
    const state = createReactor(() => 0.5);
    state.board = emptyBoard();
    state.board[0][1] = 0;
    state.board[1][0] = 0;
    state.board[2][1] = 0;
    const result = rotateRing(selectRing(state, 1), 1);
    expect(result.lastCleared).toBe(3);
    expect(result.score).toBe(300);
    expect(occupiedCells(result.board)).toBe(0);
  });
  it('keeps every cell valid across many random actions', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const rng = seeded(seed);
      let state = createReactor(rng);
      for (let action = 0; action < 450; action++) {
        state = selectRing(state, Math.floor(rng() * RINGS));
        if (rng() < 0.7) state = rotateRing(state, rng() < 0.5 ? -1 : 1);
        state = advanceBeat(state, rng);
        expect(occupiedCells(state.board)).toBeLessThanOrEqual(RINGS * SECTORS);
        expect(state.board.every(row => row.every(v => v === null || [0, 1, 2].includes(v)))).toBe(true);
        if (state.status === 'gameover') break;
      }
    }
  });
  it('ends only after three clogged outer-rim beats', () => {
    let state = createReactor(() => 0);
    state.board = Array.from({length: RINGS}, (_, ring) =>
      Array.from({length: SECTORS}, (_, sector) => ((ring + sector) % 3) as 0 | 1 | 2));
    state = advanceBeat(state);
    expect(state.status).toBe('playing');
    state = advanceBeat(state);
    expect(state.status).toBe('playing');
    state = advanceBeat(state);
    expect(state.status).toBe('gameover');
  });
});
