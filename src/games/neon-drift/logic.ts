/** Pure, deterministic encounter geometry in virtual pixels and game-time milliseconds. */
export const FIELD_WIDTH = 360;
export const PLAYER_Y = 525;
export const SHIP_WIDTH = 32;
export const SHIP_HEIGHT = 34;
export const SHIP_SPEED = 370; // px/s, including touch-drag navigation
export const PLAYER_MIN_X = 19;
export const PLAYER_MAX_X = FIELD_WIDTH - PLAYER_MIN_X;
export const SPAWN_Y = -128; // Tall vertical pillars are fully outside the visible field on spawn.
export const LEVEL_SECONDS = 7;
export const SAFETY_MARGIN = 9; // extra pixels per side, beyond the ship hitbox
export const VERTICAL_LEVEL_STEP = 3;

export interface Hitbox { x: number; y: number; width: number; height: number }
export interface Interval { left: number; right: number }
export interface Difficulty {
  level: number;
  speed: number;
  interval: number;
  minGap: number;
  maxGap: number;
  minHeight: number;
  maxHeight: number;
}
export type WavePattern = 'gate' | 'scatter' | 'fragment-field' | 'islands' | 'vertical';
export type ObstacleShape = 'meteor' | 'crystal' | 'prism' | 'shard' | 'ring' | 'pillar';
export interface ObstaclePiece {
  x: number;
  y: number; // vertical offset from the center of the falling wave
  width: number;
  height: number;
  shape: ObstacleShape;
  style: number;
}
export interface WavePlan {
  center: number;
  gap: number;
  height: number; // full collision envelope, including vertically staggered pieces
  speed: number;
  arrivalAt: number;
  clearanceMs: number;
  left: number;
  right: number;
  style: number;
  pattern: WavePattern;
  openings: Interval[];
  reachable: Interval[];
  pieces: ObstaclePiece[];
}
export interface WaveAnchor { center: number; arrivalAt: number; clearanceMs: number; reachable?: Interval[] }

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function intersects(a: Hitbox, b: Hitbox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

export function levelAt(seconds: number): number {
  return 1 + Math.floor(Math.max(0, seconds) / LEVEL_SECONDS);
}

export function difficultyAt(seconds: number): Difficulty {
  const level = levelAt(seconds);
  const step = level - 1;
  return {
    level,
    // Challenging from level 1; speed and frequency still have bounded ceilings.
    speed: Math.min(555, 250 + step * 25),
    interval: Math.max(435, 900 - step * 38),
    minGap: Math.max(62, 79 - step * 2),
    maxGap: Math.max(74, 98 - step * 2),
    minHeight: Math.min(44, 27 + step),
    maxHeight: Math.min(64, 42 + step * 2),
  };
}

export function spawnDelay(seconds: number): number {
  return difficultyAt(seconds).interval;
}
/** Actual periods between encounters are irregular but bounded. */
export function randomSpawnDelay(seconds: number, random: () => number = Math.random): number {
  return Math.round(spawnDelay(seconds) * roll(random, 0.76, 1.33));
}

/** Exactly one extended vertical blockade on levels 3, 6, 9, ... */
export function shouldSpawnVertical(level: number): boolean {
  return Number.isInteger(level) && level > 0 && level % VERTICAL_LEVEL_STEP === 0;
}

const roll = (random: () => number, min: number, max: number) =>
  min + clamp(random(), 0, 0.999999) * (max - min);
const shapes: Exclude<ObstacleShape, 'pillar'>[] = ['meteor', 'crystal', 'prism', 'shard', 'ring'];

/** Build silhouettes with several imperfect/decoy gaps, but NEVER in the guaranteed corridor. */
function buildSide(
  start: number, end: number, envelope: number,
  pattern: WavePattern, random: () => number,
): ObstaclePiece[] {
  const width = end - start;
  if (width <= 1) return [];
  if (pattern === 'vertical') {
    // This is a *long physical wall*, not just an elongated decorative sprite.
    return [{ x: start, y: 0, width, height: envelope, shape: 'pillar', style: Math.floor(roll(random, 0, 5)) }];
  }
  const segments = pattern === 'gate' ? 1 : width > 115 ? 3 : width > 56 ? 2 : 1;
  const decoyGap = pattern === 'fragment-field' ? 13 : 7;
  const totalHoles = segments > 1 ? (segments - 1) * decoyGap : 0;
  const usable = Math.max(1, width - totalHoles);
  const weights = Array.from({ length: segments }, () => roll(random, 0.6, 1.4));
  const sum = weights.reduce((acc, n) => acc + n, 0);
  const pieces: ObstaclePiece[] = [];
  let cursor = start;
  for (let i = 0; i < segments; i++) {
    const pieceWidth = i === segments - 1 ? end - cursor : usable * weights[i] / sum;
    if (pieceWidth > 0) {
      const segmentHeight = pattern === 'gate' ? envelope : roll(random, 0.62, 0.90) * envelope;
      // Each stagger is entirely contained in the plan's vertical envelope.
      const y = pattern === 'gate' ? 0 : roll(random, -1, 1) * (envelope - segmentHeight) / 2;
      pieces.push({
        x: cursor, y, width: pieceWidth, height: segmentHeight,
        shape: shapes[Math.floor(roll(random, 0, shapes.length))],
        style: Math.floor(roll(random, 0, 5)),
      });
    }
    cursor += pieceWidth + (i === segments - 1 ? 0 : decoyGap);
  }
  return pieces;
}

/** Every fragment is inside one of the two forbidden side regions. */
export function pieceHitbox(piece: ObstaclePiece, waveY: number): Hitbox {
  return { x: piece.x, y: waveY + piece.y - piece.height / 2, width: piece.width, height: piece.height };
}

/**
 * Constructive viability proof: each wave contains a reserved lane, wide enough
 * for the ship + margins, at ALL vertical offsets. The reserved lane's center
 * can be reached from the previous one between their collision windows using
 * only a fraction of the ship's real movement speed. Therefore the entire set
 * of generated waves has at least one legal traversal (not necessarily easy).
 *
 * 'vertical' is intentionally scheduled by the scene only once on levels 3/6/9…
 */

/** Normalize all valid intervals; never throw away alternative routes. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  const ordered = intervals.filter(i => i.right > i.left).slice().sort((a, b) => a.left - b.left);
  const result: Interval[] = [];
  for (const interval of ordered) {
    const last = result[result.length - 1];
    if (last && interval.left <= last.right) last.right = Math.max(last.right, interval.right);
    else result.push({ ...interval });
  }
  return result;
}

function openingCount(level: number, pattern: WavePattern, random: () => number): number {
  const choices = pattern === 'vertical' ? [1, 1, 2] :
    level <= 2 ? [2, 2, 3, 3] :
    level <= 5 ? [1, 2, 2, 3] :
    level <= 8 ? [1, 1, 2, 2] : [1, 1, 1, 2];
  return choices[Math.floor(roll(random, 0, choices.length))];
}

/** Distribute several independent openings before checking their reachability. */
function randomOpenings(difficulty: Difficulty, pattern: WavePattern, random: () => number): Interval[] {
  const count = openingCount(difficulty.level, pattern, random);
  const widths = Array.from({ length: count }, () => roll(random, difficulty.minGap, difficulty.maxGap));
  const separators = Array.from({ length: count - 1 }, () => roll(random, 17, 31));
  let required = widths.reduce((a, b) => a + b, 0) + separators.reduce((a, b) => a + b, 0);
  if (required > FIELD_WIDTH - 12) {
    const excess = required - (FIELD_WIDTH - 12);
    const flexible = widths.reduce((sum, width) => sum + width - difficulty.minGap, 0);
    if (flexible > 0) for (let i = 0; i < count; i++) {
      widths[i] -= excess * (widths[i] - difficulty.minGap) / flexible;
    }
    required = widths.reduce((a, b) => a + b, 0) + separators.reduce((a, b) => a + b, 0);
  }
  const slack = Math.max(0, FIELD_WIDTH - required);
  const weights = Array.from({ length: count + 1 }, () => roll(random, 0.14, 2.1));
  const total = weights.reduce((a, b) => a + b, 0);
  const openings: Interval[] = [];
  let x = slack * weights[0] / total;
  for (let i = 0; i < count; i++) {
    openings.push({ left: x, right: x + widths[i] });
    x += widths[i] + (separators[i] ?? 0) +
      (i + 1 < count ? slack * weights[i + 1] / total : 0);
  }
  return openings;
}

function piecesAround(openings: Interval[], height: number, pattern: WavePattern,
  random: () => number): ObstaclePiece[] {
  let cursor = 0;
  const pieces: ObstaclePiece[] = [];
  for (const opening of openings) {
    pieces.push(...buildSide(cursor, opening.left, height, pattern, random));
    cursor = opening.right;
  }
  pieces.push(...buildSide(cursor, FIELD_WIDTH, height, pattern, random));
  return pieces;
}

/** Conservative clearance for the full ship throughout the wave envelope. */
export function safeCenters(openings: Interval[]): Interval[] {
  const margin = SHIP_WIDTH / 2 + SAFETY_MARGIN;
  return mergeIntervals(openings.map(o => ({
    left: Math.max(PLAYER_MIN_X, o.left + margin),
    right: Math.min(PLAYER_MAX_X, o.right - margin),
  })).filter(i => i.right - i.left > 0.001));
}

/** Propagate every feasible ship-center interval between collision windows. */
export function reachableCenters(openings: Interval[], previous: WaveAnchor,
  arrivalAt: number, clearanceMs: number): Interval[] {
  const freeMs = Math.max(0, arrivalAt - previous.arrivalAt -
    (previous.clearanceMs + clearanceMs) / 2 - 70);
  const travel = SHIP_SPEED * freeMs / 1000 * 0.76;
  const from = previous.reachable?.length ? previous.reachable :
    [{ left: previous.center, right: previous.center }];
  const available = mergeIntervals(from.map(i => ({
    left: Math.max(PLAYER_MIN_X, i.left - travel),
    right: Math.min(PLAYER_MAX_X, i.right + travel),
  })));
  const next: Interval[] = [];
  for (const safe of safeCenters(openings)) for (const possible of available) {
    const left = Math.max(safe.left, possible.left);
    const right = Math.min(safe.right, possible.right);
    if (right - left > 0.001) next.push({ left, right });
  }
  return mergeIntervals(next);
}

/**
 * Randomize geometry first and validate ALL its surviving routes afterwards.
 * Fallback adds a viable gap to random geometry, rather than prescribing one
 * opening from the outset. High-level rounds may still offer multiple exits.
 */
export function planWave(
  seconds: number,
  spawnAtMs: number,
  previous: WaveAnchor = { center: FIELD_WIDTH / 2, arrivalAt: 0, clearanceMs: 0 },
  random: () => number = Math.random,
  forcedPattern?: 'vertical',
): WavePlan {
  const difficulty = difficultyAt(seconds);
  const speed = difficulty.speed * roll(random, 0.90, 1.10);
  const patterns: WavePattern[] = ['gate', 'scatter', 'fragment-field', 'islands'];
  const pattern: WavePattern = forcedPattern ??
    patterns[Math.floor(roll(random, 0, patterns.length))];
  const height = pattern === 'vertical'
    ? roll(random, Math.min(210, 154 + difficulty.level * 3), Math.min(258, 191 + difficulty.level * 3))
    : roll(random, difficulty.minHeight, difficulty.maxHeight);
  const arrivalAt = spawnAtMs + ((PLAYER_Y - SPAWN_Y) / speed) * 1000;
  const clearanceMs = ((height + SHIP_HEIGHT) / speed) * 1000;
  let openings: Interval[] = [];
  let reachable: Interval[] = [];
  for (let attempt = 0; attempt < 36; attempt++) {
    openings = randomOpenings(difficulty, pattern, random);
    reachable = reachableCenters(openings, previous, arrivalAt, clearanceMs);
    if (reachable.length) break;
  }
  if (!reachable.length) {
    const choices = previous.reachable?.length ? previous.reachable :
      [{ left: previous.center, right: previous.center }];
    const choice = choices[Math.floor(roll(random, 0, choices.length))];
    const wanted = roll(random, choice.left, choice.right);
    const width = roll(random, difficulty.minGap, difficulty.maxGap);
    const left = clamp(wanted - width / 2, 0, FIELD_WIDTH - width);
    openings = mergeIntervals([...openings, { left, right: left + width }]);
    reachable = reachableCenters(openings, previous, arrivalAt, clearanceMs);
  }
  if (!reachable.length) throw new Error('Neon Drift: unreachable wave');
  const pieces = piecesAround(openings, height, pattern, random);
  const route = reachable[Math.floor(roll(random, 0, reachable.length))];
  const center = roll(random, route.left, route.right);
  const chosen = openings.find(o => center >= o.left && center <= o.right) ?? openings[0];
  return {
    center, gap: chosen.right - chosen.left, height, speed, arrivalAt, clearanceMs,
    left: chosen.left, right: chosen.right, style: Math.floor(roll(random, 0, 5)),
    pattern, openings, reachable, pieces,
  };
}

export function readBestScore(): number {
  try {
    const stored = Number(window.localStorage.getItem('arcade:neon-drift:best'));
    return Number.isFinite(stored) && stored >= 0 ? stored : 0;
  } catch { return 0; }
}

export function saveBestScore(score: number): void {
  try { window.localStorage.setItem('arcade:neon-drift:best', String(score)); }
  catch { /* Continue when storage is unavailable. */ }
}
