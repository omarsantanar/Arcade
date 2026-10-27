# Reglas para asistentes y colaboradores

Antes de trabajar: consultar README.md, ARCHITECTURE.md, CHANGELOG.md, CONTINUITY.md, ROADMAP.md y AGENTS.md desde GitHub. Confirmar estado real de commits, no solo del entorno local.

Trabajar en ramas `feat/*`, `fix/*` o `docs/*`, con Pull Requests hacia main cuando sea viable. Usar commits semánticos. No copiar activos protegidos, no guardar secretos, no monetizar sin autorización.

Los juegos son módulos en `src/games/<id>`; registrar cada juego en `registry.ts`. Preservar controles táctiles y de teclado y la posibilidad de cargar juegos por separado.

Cierre obligatorio: actualizar CHANGELOG y CONTINUITY con fecha, objetivo, archivos modificados, pruebas realizadas (o imposibles), resultado, riesgos y siguiente tarea. No afirmar pruebas no realizadas ni despliegues no confirmados.

## Contrato Lumen Circuit a partir de 2026-10-27
Antes de modificar su lógica, conservar la separación entre: pequeño 1 punto/vida cada 200 recogidas, mediano 10 puntos/carga, grande 0 puntos/buff o debuff/obligatorio para completar el mundo. En niveles de bonificación 3/9/15/21/27/36/45/54/63 y cada nueve después, recoger todos antes de 90 s, sin perseguidores y sin generadoras. En mundos con túneles, la IA y el jugador deben usar el mismo sistema de vecindad. La densidad de enemigos normales aumenta en los niveles 4,8,12… con tope de seguridad explícito. Exigir tests de balance/recorrido y checks de GitHub Actions antes de afirmar despliegue.
