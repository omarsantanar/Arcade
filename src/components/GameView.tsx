import { useEffect, useRef, useState } from 'react';
import { loadGame } from '../games/registry';
import type { ControlDirection, GameHandle, GameManifest, GameStatus } from '../games/types';
import { readBestScore } from '../games/neon-drift/logic';
import { readSudokuBestScore } from '../games/sudoku/logic';
import { readLumenBest } from '../games/lumen-circuit/logic';
import { readCrosswordBest } from '../games/crucigrama/logic';
import { readSearchBest } from '../games/sopa-letras/logic';
import { readDriveBest } from '../games/conduccion-rd/score';

interface Props { manifest: GameManifest; onClose: () => void }

export default function GameView({ manifest, onClose }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => manifest.id === 'sudoku' ? readSudokuBestScore() :
    manifest.id === 'lumen-circuit' ? readLumenBest() :
    manifest.id === 'crucigrama-dominicano' ? readCrosswordBest() :
    manifest.id === 'sopa-letras-dominicana' ? readSearchBest() :
    manifest.id === 'manejo-rd' ? readDriveBest() : readBestScore());
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
          onScore: (value) => {
            setScore(value);
            if (manifest.id === 'sudoku' || manifest.id === 'lumen-circuit' ||
                manifest.id === 'crucigrama-dominicano' || manifest.id === 'sopa-letras-dominicana' ||
                manifest.id === 'manejo-rd')
              setBest(current => Math.max(current,value));
          },
          onStatus: (nextStatus) => {
            setStatus(nextStatus);
            if (nextStatus === 'gameover') setBest(manifest.id === 'sudoku' ? readSudokuBestScore() :
              manifest.id === 'lumen-circuit' ? readLumenBest() :
              manifest.id === 'crucigrama-dominicano' ? readCrosswordBest() :
              manifest.id === 'sopa-letras-dominicana' ? readSearchBest() :
              manifest.id === 'manejo-rd' ? readDriveBest() : readBestScore());
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
  const setMove = (next: 'up' | 'down' | 'left' | 'right' | 'none') => gameRef.current?.setMove?.(next);
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
            {status === 'gameover' && manifest.id !== 'manejo-rd' && !loading && <div className="game-overlay"><span>FIN DE PARTIDA</span><strong>{score} PUNTOS</strong><button className="primary-button" onClick={() => gameRef.current?.restart()}>Jugar otra vez ↗</button></div>}
          </div>
          <div className="game-aside">
            <div className="game-metrics"><div><span>PUNTUACIÓN</span><strong>{score.toString().padStart(4, '0')}</strong></div><div><span>MEJOR MARCA</span><strong>{best.toString().padStart(4, '0')}</strong></div></div>
            <div className="instructions"><h3>Cómo jugar</h3>
              {manifest.id === 'manejo-rd' ? <>
                <p><strong>Vista desde el conductor:</strong> observa el parabrisas, la carretera, el tráfico, el tablero, el volante, las señales y el retrovisor. Las calles son ficticias y la cabina es ilustrativa.</p>
                <p><strong>Flechas:</strong> <kbd>↑</kbd> acelerar, <kbd>↓</kbd> frenar, <kbd>←</kbd> girar izquierda, <kbd>→</kbd> girar derecha. También funciona WASD.</p>
                <p><strong>Antes de salir:</strong> cinturón C, espejos M, mantén freno ↓ y selecciona D con G o con el botón táctil. Q/E encienden direccionales. En celular utiliza cinturón, espejos, selector P/R/N/D, direccionales, pedal de freno y acelerador y giro, todos en pantalla.</p>
                <p>Practica las decisiones de la Ley 63-17; avisa antes de girar y respeta PARE, semáforos, peatones y autobuses. No es un simulador certificado ni reproduce las medidas o la física exacta del Corolla 2001.</p>
              </> : manifest.id === 'sudoku' ? <>
                <p><strong>Niveles 1–3:</strong> descubre las filas, columnas y bloques con ejemplos 4×4, teclado y opciones de ayuda.</p>
                <p><strong>Desde el 4:</strong> tableros 9×9 aleatorios de solución única; desaparece la ayuda y se reducen las cifras iniciales. Cada nivel exige más concentración.</p>
                <p>Selecciona una casilla y escribe del 1 al 9. En escritorio usa las flechas y los números. <strong>La calidad se mide únicamente por el tiempo de solución.</strong> Puedes detener el cronómetro con Pausa.</p>
              </> : manifest.id === 'sopa-letras-dominicana' ? <>
                <p>Encuentra palabras de <strong>países hispanohablantes</strong>: expresiones, personajes históricos, lugares, gastronomía, música, deportes y tradiciones. Cambia entre un país concreto y el mundo hispanohablante.</p>
                <p>En celular, desliza el dedo desde la primera hasta la última letra; también puedes tocar ambas. En computadora, arrastra con el mouse. Se admiten horizontal, vertical y diagonal, también al revés en niveles avanzados.</p>
                <p>Hay tres dificultades, cronómetro, récords por país, pistas y guardado local. Abre una palabra de la lista para leer su pista cultural original. No se usan tildes en el tablero, pero se conserva la Ñ.</p>
              </> : manifest.id === 'crucigrama-dominicano' ? <>
                <p>Conecta palabras de <strong>distintos países hispanohablantes</strong>: léxico, historia, lugares, gastronomía, música y tradiciones. Elige país o «Todo el mundo hispanohablante» y busca pistas horizontales o verticales.</p>
                <p>Selecciona una casilla o pista. Si dos palabras se cruzan, toca la casilla dos veces para alternar. Escribe con el teclado físico o los botones de letras. Las respuestas van sin tildes, pero mantienen la Ñ.</p>
                <p>Elige un país y, cuando haya suficientes palabras, un tema. Guarda progreso local, revisa errores y usa ayudas. Las pistas son originales; algunas expresiones también se emplean en otros países.</p>
              </> : manifest.id === 'lumen-circuit' ? <>
                <p><strong>Objetivo:</strong> enciende las tres generadoras y recoge el nodo grande para abrir la salida. Las luces pequeñas suman 1 punto; cada 200 dan una vida extra. Los cristales medianos suman 10 puntos y aportan energía.</p>
                <p><strong>Persecución:</strong> esquiva apagones. El nodo grande activa un efecto aleatorio; ciertos laberintos tienen tuberías de extremo a extremo. En los mundos de bonificación, recoge todos los puntos antes de 90 segundos.</p>
                <p><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> o <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>. En móvil usa la cruceta o desliza sobre el mapa.</p>
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
            ) : manifest.id === 'neon-drift' && <div className="touch-controls" aria-label="Controles táctiles">
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
