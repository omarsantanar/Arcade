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

## Lumen Circuit — tercer prototipo original (rama de revisión)
`feat/lumen-circuit-beta`: laberinto de circuitos con tres objetivos de energía, adversarios geométricos y salida desbloqueada. Para jugar, recoge dos cristales, activa cada terminal triangular y luego busca el portal; evita centinelas. Móvil: cruceta táctil y gestos; PC: flechas/WASD. El progreso del récord se guarda localmente. Es un juego original, **no una réplica ni un producto afiliado a Pac-Man/Bandai Namco**. Se deben verificar la marca `Lumen Circuit` y los posibles parecidos audiovisuales antes del lanzamiento comercial. Documento de diseño: `src/games/lumen-circuit/DESIGN.md`.

**Preview de Lumen Circuit:** https://arcade-git-feat-lumen-circuit-beta-omar-santanas-projects.vercel.app. **Código:** [PR #4](https://github.com/omarsantanar/Arcade/pull/4). GitHub Actions [40411150897](https://github.com/omarsantanar/Arcade/actions/runs/40411150897) pasó 19/19 pruebas y build en el commit de aplicación. La preview es experimental; no supone autorización para publicación comercial.

### Actualización publicada en rama de prueba: Lumen Circuit, red eléctrica dominicana
El protagonista es un **rayo eléctrico luminoso** y sus perseguidores son **apagones visualizados como agujeros negros**. Enciende tres generadoras ficticias por mundo para activar el portal. Cuatro regiones originales inspiran dificultades y paletas: Yaque Hídrica (Cibao), Sol Caribe (Sur), Brisa del Este (Este) y Ozama Térmica (Gran Santo Domingo). Las rutas, fragmentos y frecuencias enemigas cambian entre mundos. La experiencia se abre desde [Vercel Preview](https://arcade-git-feat-lumen-circuit-beta-omar-santanas-projects.vercel.app) y el código actualizado está en [PR #4](https://github.com/omarsantanar/Arcade/pull/4). No es un juego oficial ni usa marca, personajes o música de otras franquicias.
