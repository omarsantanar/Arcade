# Bitácora de cambios

## 2026-10-26 — v0.2.0 — Neon Drift: escalada y dirección de arte
- **Objetivo:** escalar dificultad cada siete segundos sin oleadas matemáticamente imposibles y aplicar guía audiovisual 1.0 del usuario.
- **Archivos:** `src/games/neon-drift/{logic.ts,logic.test.ts,NeonDrift.ts,DESIGN.md}`, `src/components/GameView.tsx`, `src/styles.css`, documentación del repositorio.
- **Implementación:** niveles por tiempo activo (7 s), frecuencia y velocidad ascendentes con límites, tamaño variable de obstáculos, corredor siempre mayor que la nave, continuidad de una trayectoria realizable con margen de movimiento, paleta oficial cian/magenta/violeta, nave oscura triangular, estelas y estrellas en parallax.
- **Pruebas locales:** TypeScript transpilado sin errores de sintaxis; generador validado en 120 sesiones deterministas de 10 minutos (156.000 oleadas) sin violar la holgura, tiempo de llegada ni desplazamiento máximo. **Pendientes:** `npm run test`, `npm run build` y prueba en teléfonos; npm no pudo acceder a su registro desde el entorno local.
- **Resultado:** cambios preparados en la rama de revisión `feat/initial-web-portal`, PR #1 (CI y preview a verificar tras commit). No fusionar a main hasta validar.
- **Riesgos:** la trayectoria existe si el jugador reacciona a tiempo; no equivale a supervivencia automática. Faltan pruebas de latencia táctil, accesibilidad y fps móviles.


## 2026-10-26 — v0.1.0 — Portal inicial y preview

**Objetivo:** establecer plataforma modular y disponer de una primera versión jugable para revisión desde navegador y celulares.

**Archivos afectados:** `src/**`, `public/favicon.svg`, `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, `.gitignore`, `.env.example`, `.github/workflows/ci.yml` y documentación operativa.

**GitHub:** rama `feat/initial-web-portal`; commit `2a557aa8b48f8f84ad6b72fe3124f1d3cd11f2de`; PR https://github.com/omarsantanar/Arcade/pull/1.

**Pruebas:** GitHub Actions (ejecución 40365623114) ejecutó instalación de dependencias, Vitest y comprobación TypeScript más build Vite; check `test-and-build` finalizó correctamente. La revisión previa de sintaxis y estructura local también se completó. No se ha probado todavía el comportamiento en dispositivos físicos.

**Resultado:** código fuente del portal y Neon Drift sincronizado en GitHub. Vercel informó despliegue de preview listo: https://arcade-git-feat-initial-web-portal-omar-santanas-projects.vercel.app. No fusionado aún a `main` ni publicado como lanzamiento definitivo.

**Riesgos:** no se ha versionado `package-lock.json`; faltan pruebas reales Android/iOS, auditoría de accesibilidad, rendimiento y UX, además de validar que el preview sea accesible según permisos de Vercel.

## 2026-10-26 — Inicialización documental

Se añadieron README.md, ARCHITECTURE.md, CHANGELOG.md, CONTINUITY.md, ROADMAP.md y AGENTS.md al repositorio. Se adoptó React, TypeScript, Vite y Phaser 3 como base técnica.
