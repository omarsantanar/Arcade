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


## Segundo juego — Pulse Core (prototipo experimental)
Rama `feat/pulse-core-prototype`, aún no fusionada. Un rompecabezas de reactor circular: gira tres anillos con teclas o gestos, conecta tríos de frecuencias en líneas radiales o arcos y libera espacio antes de saturarte. No se completan filas ni se usan piezas de cuatro bloques.

Para probar esta rama: `git checkout feat/pulse-core-prototype && npm install && npm run dev`. Abre el catálogo y pulsa «Jugar» en Pulse Core. La especificación está en `src/games/pulse-core/DESIGN.md`. Falta validar el despliegue y controles en móviles físicos.

### Cómo entender Pulse Core (guía 0.1.1)
En la primera apertura se muestra una guía de tres pasos: girar anillos completos, formar tríos **radiales** o **arcos** de símbolos iguales, y liberar espacio antes de la saturación. Usa «?» dentro del juego para verla de nuevo sin perder la partida. La primera guía vista se recuerda localmente; si el almacenamiento está bloqueado puede mostrarse otra vez. Rama `feat/pulse-core-prototype`, aún experimental. Ver `src/games/pulse-core/DESIGN.md`.
