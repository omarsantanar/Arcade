/** Neon Balance game rules. Pure TypeScript; easy to test without a renderer. */
export const LANES = 7;
export const MAX_HEIGHT = 8;
export const TORQUE_LIMIT = 17;
export type RandomSource = () => number;
export type BalanceStatus = 'playing' | 'gameover';
export interface BalanceState {
  stacks: number[][];
  lane: number;
  nextWeight: number;
  score: number;
  moves: number;
  combo: number;
  danger: number;
  torque: number;
  status: BalanceStatus;
}
const bounded = (random: RandomSource) => Math.max(0, Math.min(0.999999999, random()));
export const levelAt = (elapsedMs: number) => Math.floor(Math.max(0, elapsedMs) / 18000) + 1;
export const intervalAt = (level: number) => Math.max(970, 3100 - (Math.max(1, level) - 1) * 170);
export const nextWeightAt = (level: number, random: RandomSource = Math.random) =>
  1 + Math.floor(bounded(random) * Math.min(4, 2 + Math.floor((Math.max(1, level) - 1) / 3)));

export function measureTorque(stacks: readonly (readonly number[])[]): number {
  return stacks.reduce((total, stack, lane) => total + (lane - 3) * stack.reduce((s, w) => s + w, 0), 0);
}
export function newBalance(random: RandomSource = Math.random): BalanceState {
  return { stacks: Array.from({length: LANES}, () => []), lane: 3, nextWeight: nextWeightAt(1, random),
    score: 0, moves: 0, combo: 0, danger: 0, torque: 0, status: 'playing' };
}
export function chooseLane(state: BalanceState, lane: number): BalanceState {
  if (state.status !== 'playing') return state;
  return { ...state, lane: Math.max(0, Math.min(LANES - 1, Math.round(lane))) };
}

/** Player places one falling weight. Two successive overloaded placements or a full stack end the run. */
export function placeWeight(state: BalanceState, level: number, random: RandomSource = Math.random): BalanceState {
  if (state.status !== 'playing') return state;
  if (state.stacks[state.lane].length >= MAX_HEIGHT) return { ...state, status: 'gameover' };
  const stacks = state.stacks.map(stack => [...stack]);
  stacks[state.lane].push(state.nextWeight);
  const torque = measureTorque(stacks);
  const overloaded = Math.abs(torque) > TORQUE_LIMIT;
  const danger = overloaded ? state.danger + 1 : 0;
  const stable = Math.abs(torque) <= 4;
  const combo = stable ? Math.min(5, state.combo + 1) : 0;
  const points = 10 + state.nextWeight * 8 + (stable ? 20 * combo : 0);
  return {
    ...state, stacks, torque, danger, combo, moves: state.moves + 1,
    score: state.score + points, nextWeight: nextWeightAt(level, random),
    status: danger >= 2 || stacks.every(stack => stack.length >= MAX_HEIGHT) ? 'gameover' : 'playing',
  };
}
export const BALANCE_BEST_KEY = 'arcade:neon-balance:best';
export function readBalanceBest(): number {
  try { const val = Number(window.localStorage.getItem(BALANCE_BEST_KEY)); return Number.isFinite(val) && val > 0 ? val : 0; } catch { return 0; }
}
export function saveBalanceBest(score: number): void {
  try { if (score > readBalanceBest()) window.localStorage.setItem(BALANCE_BEST_KEY, String(score)); } catch { /* Optional storage. */ }
}
