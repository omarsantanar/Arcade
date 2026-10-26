export interface Hitbox { x: number; y: number; width: number; height: number }

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function intersects(a: Hitbox, b: Hitbox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

export function spawnDelay(seconds: number): number {
  return Math.max(360, 930 - Math.floor(seconds) * 14);
}

export function readBestScore(): number {
  try {
    const stored = Number(window.localStorage.getItem('arcade:neon-drift:best'));
    return Number.isFinite(stored) && stored >= 0 ? stored : 0;
  } catch { return 0; }
}

export function saveBestScore(score: number): void {
  try { window.localStorage.setItem('arcade:neon-drift:best', String(score)); }
  catch { /* private browsing or denied storage: continue without persistence */ }
}
