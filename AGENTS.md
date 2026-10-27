# Reglas para asistentes y colaboradores

Antes de trabajar: consultar README.md, ARCHITECTURE.md, CHANGELOG.md, CONTINUITY.md, ROADMAP.md y AGENTS.md desde GitHub. Confirmar estado real de commits, no solo del entorno local.

Trabajar en ramas `feat/*`, `fix/*` o `docs/*`, con Pull Requests hacia main cuando sea viable. Usar commits semánticos. No copiar activos protegidos, no guardar secretos, no monetizar sin autorización.

Los juegos son módulos en `src/games/<id>`; registrar cada juego en `registry.ts`. Preservar controles táctiles y de teclado y la posibilidad de cargar juegos por separado.

Cierre obligatorio: actualizar CHANGELOG y CONTINUITY con fecha, objetivo, archivos modificados, pruebas realizadas (o imposibles), resultado, riesgos y siguiente tarea. No afirmar pruebas no realizadas ni despliegues no confirmados.

## Reglas específicas de Sudoku (2026-10-27)
Mantener el título **Sudoku** solo como descripción genérica en la beta, sin reivindicar marca ni dar por confirmado el estado registral fuera de Japón. Nikoli registra Sudoku en Japón: revisar marcas antes de comercializar. No copiar puzzles, descripciones, tipografías distintivas o imágenes de terceros.
La lógica debe mantener tres lecciones 4×4, desde nivel 4 tableros 9×9 aleatorios de solución **única**, y valoración exclusiva por tiempo activo de resolución. Evitar introducir bonificaciones/penalizaciones por errores sin aprobación. `Sudoku.ts` adapta React a GameFactory, por diseño **no** necesita Phaser. No afectar Neon Drift ni Lumen Circuit. Antes de cerrar: tests, build, CI, docs, próximo paso y riesgos explícitos.

## Contrato del catálogo integrado — 2026-10-27
`src/games/registry.ts` es la única fuente de juegos mostrados: mantener actualmente exactamente `neon-drift`, `sudoku` y `lumen-circuit`, todos jugables. No volver a poner `nova-run` ni otros placeholders sin un concepto aprobado y módulo funcional. Cada juego conserva sus controles, sonido opcional, estado, guardado y carga dinámica; evitar acoplar lógica entre React y Phaser. La interfaz común diferencia cruceta horizontal de Neon Drift, teclado numérico de Sudoku y cruceta de 4 direcciones de Lumen Circuit. Registrar pruebas/CI/Vercel sobre SHA verificable y no confundir preview con producción. Antes de fusionar, ensayar los tres juegos en dispositivos reales y revisar documentación de continuidad.
