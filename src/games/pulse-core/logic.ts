/** Puzzle engine for Pulse Core. No Phaser/DOM dependencies, deterministic under a seeded RNG. */
export const RINGS = 3;
export const SECTORS = 8;
export const FREQUENCIES = 3;
export type Frequency = 0 | 1 | 2;
export type Node = Frequency | null;
export type Board = Node[][];
export type ReactorStatus = 'playing' | 'gameover';
export interface ReactorState {
  board: Board;
  score: number;
  combo: number;
  moves: number;
  beats: number;
  jams: number;
  selectedRing: number;
  status: ReactorStatus;
  lastCleared: number;
}
export type RandomSource = () => number;
const rnd = (random: RandomSource) => Math.max(0, Math.min(0.99999999, random()));
const choose = (random: RandomSource, n: number) => Math.floor(rnd(random) * n);
export const emptyBoard = (): Board => Array.from({length: RINGS}, () => Array<Node>(SECTORS).fill(null));

export function createReactor(random: RandomSource = Math.random): ReactorState {
  const board = emptyBoard();
  // Asymmetric starter: movement matters, but no pre-filled straight row or tetromino shape.
  for (const [ring, count] of [[0, 2], [1, 3], [2, 3]] as const) {
    const sectors = Array.from({length: SECTORS}, (_, i) => i);
    for (let i = 0; i < count; i++) {
      const choice = choose(random, sectors.length);
      board[ring][sectors.splice(choice, 1)[0]] = choose(random, FREQUENCIES) as Frequency;
    }
  }
  return { board, score: 0, combo: 0, moves: 0, beats: 0, jams: 0,
    selectedRing: 1, status: 'playing', lastCleared: 0 };
}

export function getLevel(elapsedMs: number): number {
  return Math.max(1, Math.floor(Math.max(0, elapsedMs) / 16000) + 1);
}
export function beatIntervalMs(level: number, random: RandomSource = Math.random): number {
  const base = Math.max(620, 1950 - Math.max(0, level - 1) * 125);
  return Math.round(base * (0.87 + rnd(random) * 0.26));
}
export function occupiedCells(board: Board): number {
  return board.reduce((sum, row) => sum + row.filter(node => node !== null).length, 0);
}

/** Detect radial three-node links and circular arcs of 3+ adjacent matching frequencies. */
export function energizedCells(board: Board): { ring: number; sector: number }[] {
  const ids = new Set<number>();
  const add = (r: number, s: number) => ids.add(r * SECTORS + s);
  for (let sector = 0; sector < SECTORS; sector++) {
    const frequency = board[0][sector];
    if (frequency !== null && board[1][sector] === frequency && board[2][sector] === frequency) {
      for (let ring = 0; ring < RINGS; ring++) add(ring, sector);
    }
  }
  for (let ring = 0; ring < RINGS; ring++) {
    for (let sector = 0; sector < SECTORS; sector++) {
      const frequency = board[ring][sector];
      if (frequency !== null && board[ring][(sector + 1) % SECTORS] === frequency &&
          board[ring][(sector + 2) % SECTORS] === frequency) {
        for (let step = 0; step < 3; step++) add(ring, (sector + step) % SECTORS);
      }
    }
  }
  return [...ids].map(id => ({ ring: Math.floor(id / SECTORS), sector: id % SECTORS }));
}

function discharge(state: ReactorState): ReactorState {
  const found = energizedCells(state.board);
  if (found.length === 0) return { ...state, lastCleared: 0 };
  const board = state.board.map(row => [...row]);
  for (const {ring, sector} of found) board[ring][sector] = null;
  const combo = Math.min(5, state.combo + 1);
  return { ...state, board, combo, score: state.score + found.length * 100 * combo,
    lastCleared: found.length, jams: Math.max(0, state.jams - 1) };
}

export function selectRing(state: ReactorState, ring: number): ReactorState {
  if (state.status !== 'playing') return state;
  return { ...state, selectedRing: Math.max(0, Math.min(RINGS - 1, Math.round(ring))) };
}

/** Change an entire ring's angular position, not individual falling tetrominoes. */
export function rotateRing(state: ReactorState, delta: -1 | 1): ReactorState {
  if (state.status !== 'playing') return state;
  const board = state.board.map(row => [...row]);
  const ring = state.selectedRing;
  const previous = [...board[ring]];
  for (let i = 0; i < SECTORS; i++) board[ring][(i + delta + SECTORS) % SECTORS] = previous[i];
  return discharge({ ...state, board, moves: state.moves + 1 });
}

/** Every beat pulls motes one ring inwards and introduces another at the rim. */
export function advanceBeat(state: ReactorState, random: RandomSource = Math.random): ReactorState {
  if (state.status !== 'playing') return state;
  const board = state.board.map(row => [...row]);
  for (let ring = 1; ring < RINGS; ring++) {
    for (let sector = 0; sector < SECTORS; sector++) {
      if (board[ring - 1][sector] === null && board[ring][sector] !== null) {
        board[ring - 1][sector] = board[ring][sector];
        board[ring][sector] = null;
      }
    }
  }
  const vacancies = board[RINGS - 1].flatMap((node, index) => node === null ? [index] : []);
  let jams = state.jams;
  if (vacancies.length) {
    const position = vacancies[choose(random, vacancies.length)];
    board[RINGS - 1][position] = choose(random, FREQUENCIES) as Frequency;
    jams = Math.max(0, jams - 1);
  } else {
    jams++;
  }
  const updated = discharge({ ...state, board, beats: state.beats + 1, jams, combo: 0 });
  return { ...updated, status: updated.jams >= 3 ? 'gameover' : 'playing' };
}

export const PULSE_BEST_KEY = 'arcade:pulse-core:best';
export function readPulseBestScore(): number {
  try { const n = Number(window.localStorage.getItem(PULSE_BEST_KEY)); return Number.isFinite(n) && n > 0 ? n : 0; }
  catch { return 0; }
}
export function savePulseBestScore(score: number): void {
  try { if (score > readPulseBestScore()) window.localStorage.setItem(PULSE_BEST_KEY, String(score)); }
  catch { /* Work without storage on restricted browsers. */ }
}
