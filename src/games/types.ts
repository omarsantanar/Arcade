export type GameCategory = 'reflejos' | 'puzles' | 'aventura';
export type GameStatus = 'playing' | 'paused' | 'gameover';
export type ControlDirection = -1 | 0 | 1;

export interface GameManifest {
  id: string;
  title: string;
  tagline: string;
  category: GameCategory;
  available: boolean;
  accent: string;
  symbol: string;
  orientation: 'portrait' | 'landscape' | 'any';
}

export interface GameCallbacks {
  onScore: (score: number) => void;
  onStatus: (status: GameStatus) => void;
}

export interface GameHandle {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  setDirection: (direction: ControlDirection) => void;
  setMuted: (muted: boolean) => void;
  destroy: () => void;
}

export type GameFactory = (element: HTMLElement, callbacks: GameCallbacks) => GameHandle;
