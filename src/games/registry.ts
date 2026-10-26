import type { GameFactory, GameManifest } from './types';

export const catalog: readonly GameManifest[] = [
  {
    id: 'neon-drift', title: 'Neon Drift', tagline: 'Esquiva el caos. Supera tu récord.',
    category: 'reflejos', available: true, accent: 'cyan', symbol: '◢', orientation: 'portrait',
  },
  {
    id: 'pulse-core', title: 'Pulse Core', tagline: 'Gira. Conecta. Libera el reactor.',
    category: 'puzles', available: true, accent: 'violet', symbol: '◎', orientation: 'portrait',
  },
  {
    id: 'nova-run', title: 'Nova Run', tagline: 'Un viaje más allá del borde.',
    category: 'aventura', available: false, accent: 'coral', symbol: '✦', orientation: 'landscape',
  },
];

export function findGame(id: string): GameManifest | undefined {
  return catalog.find((game) => game.id === id);
}

export async function loadGame(id: string): Promise<GameFactory> {
  if (id === 'pulse-core') {
    const module = await import('./pulse-core/PulseCore');
    return module.createPulseCore;
  }
  if (id === 'neon-drift') {
    const module = await import('./neon-drift/NeonDrift');
    return module.createNeonDrift;
  }
  throw new Error(`Juego no disponible: ${id}`);
}
