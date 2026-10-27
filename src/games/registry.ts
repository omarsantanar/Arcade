import type { GameFactory, GameManifest } from './types';

export const catalog: readonly GameManifest[] = [
  {
    id: 'neon-drift', title: 'Neon Drift', tagline: 'Esquiva el caos. Supera tu récord.',
    category: 'reflejos', available: true, accent: 'cyan', symbol: '◢', orientation: 'portrait',
  },
  {
    id: 'sudoku', title: 'Sudoku', tagline: 'Aprende las reglas. Supera tu tiempo.',
    category: 'puzles', available: true, accent: 'violet', symbol: '▦', orientation: 'portrait',
  },
  {
    id: 'lumen-circuit', title: 'Lumen Circuit', tagline: 'Enciende generadoras. Huye de los apagones.',
    category: 'aventura', available: true, accent: 'coral', symbol: '⚡', orientation: 'portrait',
  },
  {
    id: 'crucigrama-dominicano', title: 'Crucigrama Dominicano',
    tagline: 'De la guagua al merengue: descubre nuestras palabras e historias.',
    category: 'puzles', available: true, accent: 'cyan', symbol: '✎', orientation: 'portrait',
  },
  {
    id: 'sopa-letras-dominicana', title: 'Sopa de Letras Dominicana',
    tagline: 'Encuentra nuestras voces, figuras y lugares escondidos.',
    category: 'puzles', available: true, accent: 'violet', symbol: '▤', orientation: 'portrait',
  },
];

export function findGame(id: string): GameManifest | undefined {
  return catalog.find((game) => game.id === id);
}

export async function loadGame(id: string): Promise<GameFactory> {
  if (id === 'neon-drift') {
    const module = await import('./neon-drift/NeonDrift');
    return module.createNeonDrift;
  }
  if (id === 'sudoku') {
    const module = await import('./sudoku/Sudoku');
    return module.createSudoku;
  }
  if (id === 'lumen-circuit') {
    const module = await import('./lumen-circuit/LumenCircuit');
    return module.createLumenCircuit;
  }
  if (id === 'crucigrama-dominicano') {
    const module = await import('./crucigrama/Crossword');
    return module.createDominicanCrossword;
  }
  if (id === 'sopa-letras-dominicana') {
    const module = await import('./sopa-letras/WordSearch');
    return module.createDominicanWordSearch;
  }
  throw new Error(`Juego no disponible: ${id}`);
}
