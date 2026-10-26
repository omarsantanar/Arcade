/** Collision / encounter calculations use virtual game pixels and game-time milliseconds. */
export const FIELD_WIDTH = 360;
export const PLAYER_Y = 525;
export const SHIP_WIDTH = 32;
export const SHIP_HEIGHT = 34;
export const SHIP_SPEED = 330; // pixels/second, excluding the optional drag control
export const PLAYER_MIN_X = 19;
export const PLAYER_MAX_X = FIELD_WIDTH - PLAYER_MIN_X;
export const SPAWN_Y = -54;
export const LEVEL_SECONDS = 7;
export const SAFETY_MARGIN = 9; // pixels on BOTH sides of the ship

export interface Hitbox { x: number; y: number; width: number; height: number }
export interface Difficulty {
  level: number;
  speed: number;
  interval: number; // milliseconds, never below 430
  minGap: number;
  maxGap: number;
  minHeight: number;
  maxHeight: number;
}
export interface WavePlan {
  center: number;
  gap: number;
  height: number;
  speed: number;
  arrivalAt: number;
  clearanceMs: number;
  left: number;
  right: number;
  style: number;
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
    speed: Math.min(470, 195 + step * 21),
    interval: Math.max(430, 1100 - step * 48),
    minGap: Math.max(68, 104 - step * 3),
    maxGap: Math.max(82, 130 - step * 3),
    minHeight: Math.min(32, 22 + step),
    maxHeight: Math.min(48, 32 + step * 2),
  };
}

/** Kept as the prior public helper, now measured in milliseconds and stepped every 7 s. */
export function spawnDelay(seconds: number): number {
  return difficultyAt(seconds).interval;
}

const roll = (random: () => number, min: number, max: number) => min + clamp(random(), 0, 0.999999) * (max - min);

/**
 * Each wave is a wall with one traversable corridor. Rather than merely leaving
 * a gap in each row, move the corridor no further than the ship can travel
 * BETWEEN the collision windows of consecutive rows. The center coordinates
 * are a constructive witness: following them is a legal path at SHIP_SPEED.
 *
 * The generator is independent of Phaser so its invariant is unit-testable.
 */
export function planWave(
  seconds: number,
  spawnAtMs: number,
  previous: WaveAnchor = { center: FIELD_WIDTH / 2, arrivalAt: 0, clearanceMs: 0 },
  random: () => number = Math.random,
): WavePlan {
  const difficulty = difficultyAt(seconds);
  const speed = difficulty.speed * roll(random, 0.94, 1.06);
  const gap = roll(random, difficulty.minGap, difficulty.maxGap);
  const height = roll(random, difficulty.minHeight, difficulty.maxHeight);
  const arrivalAt = spawnAtMs + ((PLAYER_Y - SPAWN_Y) / speed) * 1000;
  const clearanceMs = ((height + SHIP_HEIGHT) / speed) * 1000;

  // The 70 ms buffer also tolerates input/frame latency; the 0.72 factor
  // reserves an additional margin instead of assuming perfect play.
  const freeMs = Math.max(0, arrivalAt - previous.arrivalAt -
    (previous.clearanceMs + clearanceMs) / 2 - 70);
  const reachable = SHIP_SPEED * (freeMs / 1000) * 0.72;
  const laneMargin = SHIP_WIDTH / 2 + SAFETY_MARGIN;
  // A shared safe range across ALL difficulties prevents a suddenly wider
  // gap from forcing an unreachable horizontal jump.
  const widestGap = difficultyAt(0).maxGap;
  const minCenter = Math.max(PLAYER_MIN_X, widestGap / 2 + laneMargin);
  const maxCenter = Math.min(PLAYER_MAX_X, FIELD_WIDTH - widestGap / 2 - laneMargin);
  const desired = roll(random, minCenter, maxCenter);
  const center = clamp(
    clamp(desired, previous.center - reachable, previous.center + reachable),
    minCenter,
    maxCenter,
  );

  return {
    center, gap, height, speed, arrivalAt, clearanceMs,
    left: center - gap / 2, right: center + gap / 2,
    style: Math.floor(roll(random, 0, 5)),
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
