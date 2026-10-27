# Arcade

**Neon Drift v0.3.0 (rama de preview, 2026-10-26):** más velocidad y obstáculos desde nivel 1, cuatro patrones con geometrías variables y pilares verticales reales en los niveles 3, 6, 9…; se conserva al menos un trayecto físicamente viable. La prueba local de 131.200 oleadas no sustituye revisar el build de CI ni la jugabilidad móvil. Detalles en `src/games/neon-drift/DESIGN.md`.


Plataforma original de videojuegos para navegador, diseñada primero para móviles. Segunda etapa: PWA y posible aplicación Android/iOS que reutilice código.

## Estado (2026-10-26)
**v0.1.0: preview disponible para revisión, todavía no producción.**

- Repositorio: https://github.com/omarsantanar/Arcade
- PR #1: https://github.com/omarsantanar/Arcade/pull/1
- Preview: https://arcade-git-feat-initial-web-portal-omar-santanas-projects.vercel.app
- GitHub Actions: instalación, tests Vitest y compilación TypeScript/Vite satisfactorios.
- Pendiente: lockfile versionado, pruebas reales en dispositivos y revisión de PR antes de fusionar.

## Instalación local
Requisitos: Node.js 22 y npm.

```bash
git clone https://github.com/omarsantanar/Arcade.git
cd Arcade
git checkout feat/initial-web-portal
npm install
npm run dev
```

La aplicación se abre normalmente en http://localhost:5173. Para validar:

```bash
npm run test
npm run build
npm run preview
```

## Estructura
- `src/App.tsx`: galería, filtros y selección del juego.
- `src/components/GameView.tsx`: ventana y controles comunes.
- `src/games/registry.ts`: catálogo y carga diferida.
- `src/games/types.ts`: contrato de módulo.
- `src/games/neon-drift/`: primer juego Phaser.
- `.github/workflows/ci.yml`: pruebas automáticas.

## Desarrollo y continuidad
Trabajar en ramas `feat/*`, `fix/*`, `docs/*` con PR. Leer y actualizar `ARCHITECTURE.md`, `CHANGELOG.md`, `CONTINUITY.md`, `ROADMAP.md` y `AGENTS.md`. Cada cambio debe registrar propósito, archivos, pruebas, resultado, riesgos y próximo paso.

No incorporar arte ajeno protegido ni monetización sin autorización. Sin backend, usuarios, analítica o anuncios en esta etapa.

## Neon Drift v0.2.0 — en revisión

Verificación del código: GitHub Actions [40370131862](https://github.com/omarsantanar/Arcade/actions/runs/40370131862) aprobó tests y build del commit `ec0d60ad4be8`, y Vercel confirmó su preview. Falta validar controles físicos móviles antes de fusionar a `main`.
Los niveles aumentan cada 7 segundos de juego activo. La velocidad, frecuencia y dimensiones de los obstáculos se ajustan progresivamente; `planWave` garantiza la existencia de una ruta físicamente transitable siguiendo los centros seguros, aunque exige reaccionar. La estética de la guía audiovisual facilitada se implementa con geometría Phaser. Véase `src/games/neon-drift/DESIGN.md`. La validación matemática no sustituye probar el juego en un móvil real.


## Neon Drift v0.4.0
Los obstáculos se distribuyen al azar antes de evaluar la viabilidad temporal de sus rutas. Los niveles 1 y 2 suelen presentar varias salidas; los altos reducen opciones. Las oleadas aparecen con intervalos variables y los bloqueos verticales se mantienen cada tres niveles. Diseño y limitaciones: src/games/neon-drift/DESIGN.md.

## Sudoku — beta de velocidad (2026-10-27)
Tercer concepto jugable y módulo independiente en `feat/sudoku-speed-challenge` (PR de revisión, sin fusionar). **Sudoku** utiliza tablero original generado localmente y una progresión en dos fases: 1–3 enseñan filas/columnas/bloques en cuadrículas 4×4, con explicaciones y candidatos; a partir del nivel 4 se juega un 9×9 aleatorio con solución única, menor número de pistas conforme avanza la campaña y sin ayuda introductoria.

La clasificación **Relámpago / Oro / Plata / Bronce / Completado** depende exclusivamente del tiempo de resolución relativo a la dificultad del nivel. Se guardan el progreso, mejor tiempo por nivel y mejor puntuación localmente. Móvil: tocar casilla y teclado numérico. Escritorio: mouse, números, flechas y Backspace. Para ejecutar: `npm install`, `npm run dev`; validación: `npm run test && npm run build`.

**Derechos:** la mecánica abstracta no está protegida como obra por copyright en los términos descritos por la U.S. Copyright Office, pero **Sudoku es marca registrada por Nikoli en Japón**. El nombre se utiliza aquí descriptivamente en beta; revisar el ámbito marcario antes de distribución comercial o promoción internacional. Diseño y fuentes: `src/games/sudoku/DESIGN.md`.


**Preview de Sudoku Beta publicada (27-oct-2026):** https://arcade-git-feat-sudoku-speed-challenge-omar-santanas-projects.vercel.app. Fuente y revisión: https://github.com/omarsantanar/Arcade/pull/5. El último código de jugabilidad aprobó 21/21 pruebas y build en GitHub Actions 40509409402, y Vercel confirmó `Ready`. Aún no se ha validado con jugadores reales ni se ha fusionado a `main`.

## Catálogo unificado — 27 de octubre de 2026
La vista previa de Arcade presenta **exactamente tres juegos jugables**: `Neon Drift` (reflejos), `Sudoku` (puzles) y `Lumen Circuit` (aventura/energía). **Nova Run** se retiró del catálogo hasta contar con un concepto definido; no es un juego disponible. Cada título se carga de manera independiente mediante `src/games/registry.ts`.

**Preview unificada:** https://arcade-git-feat-sudoku-speed-challenge-omar-santanas-projects.vercel.app (rama `feat/sudoku-speed-challenge`, PR #5). Ejecutar localmente con:
```bash
git switch feat/sudoku-speed-challenge
npm ci
npm run dev
npm run test
npm run build
```
El código actualizado de Lumen procede de `feat/lumen-circuit-beta` (PR #4), incorporando mundos regionales, apagones, bonificaciones, tubos, tres tamaños de puntos, nodos y protección frente a encerronas. Su fuente se encuentra en `src/games/lumen-circuit/`.

**Validación del commit funcional `c9bf05304f08171394a72588d5317978eff59135`:** GitHub Actions [40513226150](https://github.com/omarsantanar/Arcade/actions/runs/40513226150), 55 pruebas satisfactorias (3 suites), comprobación TypeScript y build Vite aprobados; Vercel devolvió `success` para esa revisión. Esta es una **preview de prueba**, no producción; aún faltan pruebas de interacción en móviles físicos.
