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
export interface Difficulty {
  level: number;
  speed: number;
  interval: number;
  minGap: number;
  maxGap: number;
  minHeight: number;
  maxHeight: number;
}
export type WavePattern = 'gate' | 'scatter' | 'fragment-field' | 'vertical';
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
  pieces: ObstaclePiece[];
}
export interface WaveAnchor { center: number; arrivalAt: number; clearanceMs: number }

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
export function planWave(
  seconds: number,
  spawnAtMs: number,
  previous: WaveAnchor = { center: FIELD_WIDTH / 2, arrivalAt: 0, clearanceMs: 0 },
  random: () => number = Math.random,
  forcedPattern?: 'vertical',
): WavePlan {
  const difficulty = difficultyAt(seconds);
  const speed = difficulty.speed * roll(random, 0.94, 1.06);
  const gap = roll(random, difficulty.minGap, difficulty.maxGap);
  const variant = roll(random, 0, 1);
  const pattern: WavePattern = forcedPattern ??
    (variant < 0.18 ? 'gate' : variant < 0.59 ? 'scatter' : 'fragment-field');
  const height = pattern === 'vertical'
    ? roll(random, Math.min(210, 154 + difficulty.level * 3), Math.min(258, 191 + difficulty.level * 3))
    : roll(random, difficulty.minHeight, difficulty.maxHeight);
  const arrivalAt = spawnAtMs + ((PLAYER_Y - SPAWN_Y) / speed) * 1000;
  const clearanceMs = ((height + SHIP_HEIGHT) / speed) * 1000;
  const freeMs = Math.max(0, arrivalAt - previous.arrivalAt -
    (previous.clearanceMs + clearanceMs) / 2 - 70);
  const reachable = SHIP_SPEED * (freeMs / 1000) * 0.76;

  // Use a *fixed* globally safe center range, even when different waves have
  // different widths: zero travel time still means sharing a safe location.
  const widestGap = difficultyAt(0).maxGap;
  const edge = widestGap / 2 + SHIP_WIDTH / 2 + SAFETY_MARGIN;
  const minCenter = Math.max(PLAYER_MIN_X, edge);
  const maxCenter = Math.min(PLAYER_MAX_X, FIELD_WIDTH - edge);
  // Bias toward the sides, interspersed with middle positions. Most encounters
  // require planning a movement; no permanent middle-lane solution exists.
  const choice = roll(random, 0, 1);
  const desired = choice < 0.43
    ? roll(random, minCenter, minCenter + 39)
    : choice < 0.86
      ? roll(random, maxCenter - 39, maxCenter)
      : roll(random, minCenter, maxCenter);
  const center = clamp(clamp(desired, previous.center - reachable, previous.center + reachable), minCenter, maxCenter);
  const left = center - gap / 2;
  const right = center + gap / 2;
  const pieces = [
    ...buildSide(0, left, height, pattern, random),
    ...buildSide(right, FIELD_WIDTH, height, pattern, random),
  ];

  return {
    center, gap, height, speed, arrivalAt, clearanceMs, left, right,
    style: Math.floor(roll(random, 0, 5)), pattern, pieces,
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
