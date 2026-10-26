# Bitácora de cambios

## 2026-10-26 — v0.4.0 — Oleadas multirruta y aparición irregular
**Objetivo:** evitar soluciones únicas y patrones repetitivos, preservando al menos una salida viable.
**Archivos afectados:** logic.ts, logic.test.ts, NeonDrift.ts, DESIGN.md, ARCHITECTURE.md, CHANGELOG.md, CONTINUITY.md, ROADMAP.md, README.md, package.json.
**Cambios:** nuevas aberturas y familias de patrón, conservación de alternativas alcanzables, aparición con intervalos variables, figuras con siluetas más distinguibles y obstáculos altos cada tres niveles.
**Pruebas:** simulación local previa al commit: 188.344 oleadas en 150 partidas de diez minutos; 4.200 eventos verticales sin soluciones imposibles en modelo geométrico. **Pendiente** validar los cambios definitivos en CI GitHub y en un móvil físico.
**Riesgos:** patrones visibles todavía necesitan evaluación humana de dificultad; el modelo usa rectángulos conservadores. Cambios en rama de revisión, no en producción.
**Validación final de código:** commit `f6f030ce4e92e7c45c4af77ae198c81beb45e702`: GitHub Actions ejecución 40383943632 — 11/11 pruebas aprobadas y TypeScript/Vite compilados correctamente; Vercel informa preview Ready. Pruebas manuales en móviles pendientes.


## 2026-10-26 — v0.3.0 — Obstáculos imprevisibles y pilares verticales
**Objetivo:** aumentar la presión desde el nivel 1 y hacer menos evidentes las rutas, preservando al menos una solución basada en las dimensiones y la velocidad de la nave.
**Archivos afectados:** `src/games/neon-drift/logic.ts`, `logic.test.ts`, `NeonDrift.ts`, `DESIGN.md`, `package.json`, `ARCHITECTURE.md`, `README.md`, `CONTINUITY.md`, `ROADMAP.md` y esta bitácora.
**Cambios:** velocidad base 250, intervalo inicial 900 ms, corredores de 79–98 px, cuatro patrones (incluyendo pilar) y seis figuras; un bloqueo vertical real en niveles 3/6/9…; objetivos táctiles limitados a la velocidad de la nave.
**Pruebas:** simulación local con Node ejecutada: 100 sesiones de diez minutos, 131.200 oleadas y 2.800 bloqueos verticales, sin violaciones de hitboxes ni de la cota de movimiento. Pruebas automatizadas de Vitest y build en CI pendientes de comprobar para este commit.
**Resultado:** código subido a rama `feat/initial-web-portal` dentro de PR #1; pendiente confirmar que Vercel publique el último commit.
**Riesgos:** falta evaluación de justicia perceptiva y controles en teléfonos reales; la simulación garantiza existencia geométrica de una ruta, no que todas las personas puedan descubrirla con tiempo suficiente.


## 2026-10-26 — v0.2.0 — Neon Drift: escalada y dirección de arte
- **Objetivo:** escalar dificultad cada siete segundos sin oleadas matemáticamente imposibles y aplicar guía audiovisual 1.0 del usuario.
- **Archivos:** `src/games/neon-drift/{logic.ts,logic.test.ts,NeonDrift.ts,DESIGN.md}`, `src/components/GameView.tsx`, `src/styles.css`, documentación del repositorio.
- **Implementación:** niveles por tiempo activo (7 s), frecuencia y velocidad ascendentes con límites, tamaño variable de obstáculos, corredor siempre mayor que la nave, continuidad de una trayectoria realizable con margen de movimiento, paleta oficial cian/magenta/violeta, nave oscura triangular, estelas y estrellas en parallax.
- **Pruebas locales:** TypeScript transpilado sin errores de sintaxis; generador validado en 120 sesiones deterministas de 10 minutos (156.000 oleadas) sin violar la holgura, tiempo de llegada ni desplazamiento máximo. **Pendientes:** `npm run test`, `npm run build` y prueba en teléfonos; npm no pudo acceder a su registro desde el entorno local.
- **Resultado:** PR #1 en `feat/initial-web-portal`, implementación `ec0d60ad4be8` y corrección de TypeScript. GitHub Actions [40370131862](https://github.com/omarsantanar/Arcade/actions/runs/40370131862) con 6/6 pruebas y compilación correctas; Vercel desplegó preview satisfactoriamente. No fusionado a `main`.
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


### Validación de v0.3.0 (2026-10-26)
- Se corrigió el límite de tiempo de una prueba larga de Vitest (30 segundos) y una importación TypeScript no utilizada; sin modificaciones a la regla de dificultad.
- GitHub Actions [ejecución 40372684449](https://github.com/omarsantanar/Arcade/actions/runs/40372684449), commit de código `319428d180a495ac13b951068247b79cfa122d06`: **7/7 tests y build TypeScript/Vite correctos**.
- Estado del despliegue Vercel: **success**, comprobado para ese commit. La vista previa permanece en la rama de PR #1; no se considera producción.
- Queda pendiente comprobar dificultad, latencia, percepción de falsos huecos y controles en Safari iOS y Chrome Android.

## 2026-10-26 — Lumen Circuit, nueva beta de laberintos (sin integración a main)
**Objetivo:** construir juego original de persecución y circuitos sin reutilizar personajes, mapas, música o identidad de Pac-Man.
**Archivos:** `src/games/lumen-circuit/{logic.ts,logic.test.ts,LumenCircuit.ts,DESIGN.md}`, `src/games/types.ts`, `src/games/registry.ts`, `src/components/GameView.tsx`, `src/styles.css`, test de catálogo y documentación.
**Cambios:** mapas aleatorios conectados, cristales energéticos, tres terminales de carga, salida condicionada, tres vidas, centinelas angulares, cuatro direcciones táctiles/teclado, dificultad por nivel y récord local. Neon Drift sin cambios jugables.
**Pruebas:** suite de simulación y comprobaciones Vitest escritas; comprobación de CI/build en GitHub y preview pendientes del PR.
**Resultado:** rama de trabajo `feat/lumen-circuit-beta`, basada en la beta de Neon Drift, sin fusionar.
**Riesgos:** controles móviles no probados en dispositivos físicos; revisión de marca para el nombre y valoración jurídica de parecido final antes de distribución comercial. No garantizar ausencia absoluta de infracción.
