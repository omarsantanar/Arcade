import { useEffect, useRef, useState } from 'react';
import { loadGame } from '../games/registry';
import type { ControlDirection, GameHandle, GameManifest, GameStatus } from '../games/types';
import { readBestScore } from '../games/neon-drift/logic';
import { readSudokuBestScore } from '../games/sudoku/logic';

interface Props { manifest: GameManifest; onClose: () => void }

export default function GameView({ manifest, onClose }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => manifest.id === 'sudoku' ? readSudokuBestScore() : readBestScore());
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
          onScore: (value) => { setScore(value); if (manifest.id === 'sudoku') setBest(current => Math.max(current,value)); },
          onStatus: (nextStatus) => {
            setStatus(nextStatus);
            if (nextStatus === 'gameover') setBest(manifest.id === 'sudoku' ? readSudokuBestScore() : readBestScore());
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
              {manifest.id === 'sudoku' ? <>
                <p><strong>Niveles 1–3:</strong> descubre las filas, columnas y bloques con ejemplos 4×4, teclado y opciones de ayuda.</p>
                <p><strong>Desde el 4:</strong> tableros 9×9 aleatorios de solución única; desaparece la ayuda y se reducen las cifras iniciales. Cada nivel exige más concentración.</p>
                <p>Selecciona una casilla y escribe del 1 al 9. En escritorio usa las flechas y los números. <strong>La calidad se mide únicamente por el tiempo de solución.</strong> Puedes detener el cronómetro con Pausa.</p>
              </> : <>
                <p>Esquiva obstáculos geométricos de neón. Cada 7 segundos aumenta el nivel: caen más rápido, aparecen con más frecuencia y cambian de tamaño. Siempre queda un corredor viable, pero deberás alcanzarlo a tiempo.</p>
                <p><kbd>←</kbd> <kbd>→</kbd> o <kbd>A</kbd> <kbd>D</kbd> para moverte. En móviles, toca los botones o desliza el dedo sobre el juego.</p>
              </>}
            </div>
            {manifest.id !== 'sudoku' && <div className="touch-controls" aria-label="Controles táctiles">
              <button type="button" aria-label="Mover a la izquierda" onPointerDown={(e) => { e.preventDefault(); setDirection(-1); }} onPointerUp={() => setDirection(0)} onPointerLeave={() => setDirection(0)} onPointerCancel={() => setDirection(0)}>←</button>
              <button type="button" aria-label="Mover a la derecha" onPointerDown={(e) => { e.preventDefault(); setDirection(1); }} onPointerUp={() => setDirection(0)} onPointerLeave={() => setDirection(0)} onPointerCancel={() => setDirection(0)}>→</button>
            </div>}
            <span className="game-footnote">Tus récords se guardan en este dispositivo.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
