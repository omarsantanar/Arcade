import { useCallback, useMemo, useState } from 'react';
import GameView from './components/GameView';
import { catalog, findGame } from './games/registry';
import type { GameCategory } from './games/types';

type CategoryFilter = 'todos' | GameCategory;
const filters: { id: CategoryFilter; label: string }[] = [
  { id: 'todos', label: 'Todos los juegos' },
  { id: 'reflejos', label: 'Reflejos' },
  { id: 'puzles', label: 'Puzles' },
  { id: 'aventura', label: 'Aventura' },
];

export default function App() {
  const [filter, setFilter] = useState<CategoryFilter>('todos');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const games = useMemo(() => catalog.filter((game) => filter === 'todos' || game.category === filter), [filter]);
  const activeGame = activeGameId ? findGame(activeGameId) : undefined;
  const closeGame = useCallback(() => setActiveGameId(null), []);

  return (
    <>
      <div className="site-shell">
        <header className="site-header">
          <a className="brand" href="#inicio" aria-label="Arcade, volver al inicio"><span className="brand-mark">A<span>•</span></span><span>ARCADE<span className="brand-ext">.PLAY</span></span></a>
          <nav className="desktop-nav" aria-label="Navegación principal"><a href="#juegos">Explorar juegos</a><a href="#acerca">Acerca de Arcade</a></nav>
          <a className="header-cta" href="#juegos">Explorar <span aria-hidden="true">↗</span></a>
        </header>
        <main id="inicio">
          <section className="hero" aria-label="Presentación">
            <div className="hero-content">
              <div className="eyebrow"><span className="live-dot" /> TU ESPACIO DE JUEGO, SIN DESCARGAS</div>
              <h1>La diversión<br />no tiene <em>pausa.</em></h1>
              <p>La esencia de los arcades de siempre. Juegos originales, partidas rápidas y toda la emoción directamente en tu navegador.</p>
              <div className="hero-buttons"><button className="primary-button" onClick={() => setActiveGameId('neon-drift')}>Jugar ahora <span aria-hidden="true">↗</span></button><a className="secondary-button" href="#juegos">Ver juegos ↓</a></div>
              <div className="hero-meta"><span>✧ Sin instalaciones</span><span>▣ En móvil y PC</span><span>∞ Juega gratis</span></div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="visual-glow" /><div className="visual-ring ring-1" /><div className="visual-ring ring-2" /><div className="visual-ring ring-3" /><div className="orbit-symbol">◢</div><div className="visual-label">PRESS START<br /><small>NEW HIGH SCORE</small></div>
              <span className="visual-spark spark-one">✦</span><span className="visual-spark spark-two">+</span>
            </div>
          </section>
          <section className="catalog-section" id="juegos">
            <div className="section-top"><div><div className="section-kicker">01 / EL CATÁLOGO</div><h2>Elige tu próxima <span>aventura.</span></h2><p>Cuatro juegos para explorar: Neon Drift, Sudoku, Lumen Circuit y Crucigrama Dominicano, con palabras, historia y cultura del país.</p></div><div className="catalog-count">{catalog.length.toString().padStart(2, '0')} <span>JUEGOS EN CATÁLOGO</span></div></div>
            <div className="filter-row" role="group" aria-label="Filtrar juegos por categoría">{filters.map(({ id, label }) => <button key={id} className={`filter-chip ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)} aria-pressed={filter === id}>{label}</button>)}</div>
            <div className="games-grid">{games.map((game) => <article className={`game-card accent-${game.accent}`} key={game.id}>
              <div className="card-art"><div className="card-art-grid" /><span className="card-big-symbol" aria-hidden="true">{game.symbol}</span><span className={`card-tag ${game.available ? 'tag-ready' : 'tag-soon'}`}>{game.available ? '● JUGABLE' : 'PRÓXIMAMENTE'}</span></div>
              <div className="card-body"><div className="card-overline">{game.category.toUpperCase()} · {game.orientation === 'portrait' ? 'VERTICAL' : 'HORIZONTAL'}</div><h3>{game.title}</h3><p>{game.tagline}</p><button className="game-action" disabled={!game.available} onClick={() => setActiveGameId(game.id)}>{game.available ? 'Jugar ahora' : 'En desarrollo'}<span aria-hidden="true">{game.available ? '↗' : '–'}</span></button></div>
            </article>)}</div>
            {games.length === 0 && <p>No hay juegos en esta categoría.</p>}
          </section>
          <section className="about-strip" id="acerca"><div className="about-icon">✳</div><div><h2>Hecho para jugar en cualquier lugar.</h2><p>Arcade nace como una colección de experiencias originales, rápidas y adaptadas a tu pantalla. Sin cuentas obligatorias ni descargas.</p></div><a href="#juegos">Explorar juegos ↗</a></section>
        </main>
        <footer className="site-footer"><span className="footer-brand">ARCADE<span>.PLAY</span></span><span>© {new Date().getFullYear()} Arcade. Juegos originales, diversión sin límites.</span><a href="#inicio">Volver arriba ↑</a></footer>
      </div>
      {activeGame?.available && <GameView manifest={activeGame} onClose={closeGame} />}
    </>
  );
}
