# Reglas para asistentes y colaboradores

Antes de trabajar: consultar README.md, ARCHITECTURE.md, CHANGELOG.md, CONTINUITY.md, ROADMAP.md y AGENTS.md desde GitHub. Confirmar estado real de commits, no solo del entorno local.

Trabajar en ramas `feat/*`, `fix/*` o `docs/*`, con Pull Requests hacia main cuando sea viable. Usar commits semánticos. No copiar activos protegidos, no guardar secretos, no monetizar sin autorización.

Los juegos son módulos en `src/games/<id>`; registrar cada juego en `registry.ts`. Preservar controles táctiles y de teclado y la posibilidad de cargar juegos por separado.

Cierre obligatorio: actualizar CHANGELOG y CONTINUITY con fecha, objetivo, archivos modificados, pruebas realizadas (o imposibles), resultado, riesgos y siguiente tarea. No afirmar pruebas no realizadas ni despliegues no confirmados.
