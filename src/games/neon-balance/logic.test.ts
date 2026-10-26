import { describe, expect, it } from 'vitest';
import { LANES, TORQUE_LIMIT, MAX_HEIGHT, chooseLane, intervalAt, levelAt, measureTorque,
  newBalance, nextWeightAt, placeWeight } from './logic';

describe('Neon Balance mechanics', () => {
  it('initializes an empty level playing at the center', () => {
    const s = newBalance(() => 0);
    expect(s.stacks).toHaveLength(LANES);
    expect(s.stacks.every(stack => stack.length === 0)).toBe(true);
    expect(s.lane).toBe(3);
    expect(s.nextWeight).toBe(1);
  });
  it('scores placements and calculates torque symmetrically', () => {
    let s = newBalance(() => 0);
    s = placeWeight(chooseLane(s, 0), 1, () => 0);
    expect(s.torque).toBe(-3);
    s = placeWeight(chooseLane(s, 6), 1, () => 0);
    expect(s.torque).toBe(0);
    expect(s.score).toBeGreaterThan(0);
    expect(s.combo).toBeGreaterThan(0);
    expect(measureTorque(s.stacks)).toBe(0);
  });
  it('is visible and recoverable: one unsafe placement does not end play', () => {
    let s = newBalance(() => 0.999);
    for (let i = 0; i < 4; i++) s = placeWeight(chooseLane(s, 0), 1, () => 0.999);
    expect(s.torque).toBeLessThan(-TORQUE_LIMIT);
    expect(s.danger).toBe(1);
    expect(s.status).toBe('playing');
    s = placeWeight(chooseLane(s, 6), 1, () => 0.999);
    expect(s.status).toBe('playing');
    expect(s.danger).toBe(0);
  });
  it('ends after two consecutive overloaded placements', () => {
    let s = newBalance(() => 0.999);
    for (let i = 0; i < 5; i++) s = placeWeight(chooseLane(s, 0), 1, () => 0.999);
    expect(s.status).toBe('gameover');
    expect(s.danger).toBe(2);
  });
  it('ends if a single stack reaches the height limit and another weight is placed there', () => {
    let s = newBalance(() => 0);
    for (let i = 0; i < MAX_HEIGHT; i++) s = placeWeight(chooseLane(s, 3), 1, () => 0);
    expect(s.status).toBe('playing');
    expect(placeWeight(s, 1, () => 0).status).toBe('gameover');
  });
  it('increases pace and introduces new weights as levels advance', () => {
    expect(levelAt(0)).toBe(1);
    expect(levelAt(18000)).toBe(2);
    expect(intervalAt(10)).toBeLessThan(intervalAt(1));
    expect(intervalAt(100)).toBeGreaterThanOrEqual(970);
    expect(nextWeightAt(1, () => 0.99)).toBe(2);
    expect(nextWeightAt(10, () => 0.99)).toBe(4);
  });
  it('clamps selection and preserves finished states', () => {
    let s = newBalance(() => 0);
    expect(chooseLane(s, -99).lane).toBe(0);
    expect(chooseLane(s, 99).lane).toBe(6);
    for (let i=0;i<5;i++) s=placeWeight(chooseLane(s,0),1,()=>0.99);
    expect(chooseLane(s,3)).toBe(s);
  });
});
