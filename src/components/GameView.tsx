import { useEffect, useRef, useState } from 'react';
import { loadGame } from '../games/registry';
import type { ControlDirection, GameHandle, GameManifest, GameStatus } from '../games/types';
import { readBestScore } from '../games/neon-drift/logic';
import { readLumenBest } from '../games/lumen-circuit/logic';

interface Props { manifest: GameManifest; onClose: () => void }

export default function GameView({ manifest, onClose }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [score, setScore] = useState(0);
  const readBest = manifest.id === 'lumen-circuit' ? readLumenBest : readBestScore;
  const [best, setBest] = useState(readBest);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const mount = mountRef.current;
    if (!mount) return;
    setLoading(true);
    loadGame(manifest.id)
      .then((factory) => {
        if (cancelled) return;
        const game = factory(mount, {
          onScore: setScore,
          onStatus: (nextStatus) => {
            setStatus(nextStatus);
            if (nextStatus === 'gameover') setBest(readBest());
          },
        });
        gameRef.current = game;
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setError('No pudimos iniciar el juego. Intenta abrirlo de nuevo.'); setLoading(false); } });
    return () => {
      cancelled = true;
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [manifest.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const setDirection = (next: ControlDirection) => gameRef.current?.setDirection(next);
  const setMove = (next: 'up'|'down'|'left'|'right'|'none') => gameRef.current?.setMove?.(next);
  const togglePause = () => status === 'paused' ? gameRef.current?.resume() : gameRef.current?.pause();
  const toggleAudio = () => {
    const next = !muted;
    setMuted(next);
    gameRef.current?.setMuted(next);
  };
  const toggleFullscreen = async () => {
    const container = document.getElementById('game-dialog');
    if (!container) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (container.requestFullscreen) await container.requestFullscreen();
    } catch { /* iOS and embedded browsers may not support fullscreen */ }
  };

  return (
    <div className="dialog-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="game-dialog" id="game-dialog" role="dialog" aria-modal="true" aria-label={`Jugar ${manifest.title}`}>
        <div className="game-bar">
          <button className="icon-button" onClick={onClose} aria-label="Cerrar juego">←</button>
          <div className="game-bar-title"><strong>{manifest.title}</strong><span>ARCADE / EN PARTIDA</span></div>
          <div className="game-toolbar">
            <button className="icon-button" disabled={loading || status === 'gameover'} onClick={togglePause} aria-label={status === 'paused' ? 'Reanudar' : 'Pausar'} title={status === 'paused' ? 'Reanudar' : 'Pausar'}>{status === 'paused' ? '▶' : 'Ⅱ'}</button>
            <button className="icon-button" onClick={() => gameRef.current?.restart()} disabled={loading} aria-label="Reiniciar juego" title="Reiniciar">↻</button>
            <button className="icon-button" onClick={toggleAudio} aria-label={muted ? 'Activar sonido' : 'Silenciar'} title="Sonido">{muted ? '♪̸' : '♫'}</button>
            <button className="icon-button" onClick={() => void toggleFullscreen()} aria-label="Pantalla completa" title="Pantalla completa">⛶</button>
          </div>
        </div>
        <div className="game-layout">
          <div className="game-stage-wrap">
            <div className="game-stage" ref={mountRef} aria-label="Área de juego" />
            {loading && <div className="game-overlay"><span>Cargando juego…</span></div>}
            {error && <div className="game-overlay error-message">{error}</div>}
            {status === 'paused' && !loading && <div className="game-overlay"><strong>EN PAUSA</strong><button className="primary-button" onClick={() => gameRef.current?.resume()}>Continuar</button></div>}
            {status === 'gameover' && !loading && <div className="game-overlay"><span>FIN DE PARTIDA</span><strong>{score} PUNTOS</strong><button className="primary-button" onClick={() => gameRef.current?.restart()}>Jugar otra vez ↗</button></div>}
          </div>
          <div className="game-aside">
            <div className="game-metrics"><div><span>PUNTUACIÓN</span><strong>{score.toString().padStart(4, '0')}</strong></div><div><span>MEJOR MARCA</span><strong>{best.toString().padStart(4, '0')}</strong></div></div>
            <div className="instructions"><h3>Cómo jugar</h3>
              {manifest.id === 'lumen-circuit' ? <>
                <p><strong>Pequeños:</strong> +1 punto; cada 200 recogidos recibes otra vida. <strong>Medianos:</strong> +10 puntos y energía para encender las tres generadoras. <strong>Grande:</strong> activa un efecto aleatorio, no suma puntos, pero es obligatorio para abrir la salida.</p>
                <p><strong>Bonos contrarreloj:</strong> en los mundos especiales recoge todos los puntos antes de 90 segundos; no hay apagones ni generadoras. En ciertos laberintos, las tuberías conectan los extremos: ¡también las usan los apagones! Aparece uno más en los niveles 4, 8, 12…</p>
                <p>Controles: <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> o <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>. En móvil usa la cruceta o desliza sobre el mapa.</p>
              </> : <>
                <p>Esquiva obstáculos geométricos de neón. Cada 7 segundos aumenta el nivel: caen más rápido, aparecen con más frecuencia y cambian de tamaño. Siempre queda un corredor viable, pero deberás alcanzarlo a tiempo.</p>
                <p><kbd>←</kbd> <kbd>→</kbd> o <kbd>A</kbd> <kbd>D</kbd> para moverte. En móviles, toca los botones o desliza el dedo sobre el juego.</p>
              </>}
            </div>
            {manifest.id === 'lumen-circuit' ? (
              <div className="touch-controls maze-touch" aria-label="Cruceta táctil de cuatro direcciones">
                {(['up','left','down','right'] as const).map((direction) =>
                  <button key={direction} type="button" className={`maze-${direction}`}
                    aria-label={`Mover hacia ${({up:'arriba',down:'abajo',left:'izquierda',right:'derecha'} as const)[direction]}`}
                    onPointerDown={(event) => { event.preventDefault(); setMove(direction); }}
                    onPointerUp={() => setMove('none')}
                    onPointerLeave={() => setMove('none')}
                    onPointerCancel={() => setMove('none')}>
                    {({up:'↑',down:'↓',left:'←',right:'→'} as const)[direction]}
                  </button>
                )}
              </div>
            ) : (
            <div className="touch-controls" aria-label="Controles táctiles">
              <button type="button" aria-label="Mover a la izquierda" onPointerDown={(e) => { e.preventDefault(); setDirection(-1); }} onPointerUp={() => setDirection(0)} onPointerLeave={() => setDirection(0)} onPointerCancel={() => setDirection(0)}>←</button>
              <button type="button" aria-label="Mover a la derecha" onPointerDown={(e) => { e.preventDefault(); setDirection(1); }} onPointerUp={() => setDirection(0)} onPointerLeave={() => setDirection(0)} onPointerCancel={() => setDirection(0)}>→</button>
            </div>
            )}
            <span className="game-footnote">Tus récords se guardan en este dispositivo.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
