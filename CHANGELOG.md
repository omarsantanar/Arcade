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

**Validación inicial confirmada:** GitHub Actions [40411150897](https://github.com/omarsantanar/Arcade/actions/runs/40411150897) verificó el commit de código `c3956040f0162b8b7cd1b6abdfb255dadff2e3b2`: **19/19 pruebas** (8 Lumen Circuit, 11 Neon Drift) y compilación TypeScript/Vite satisfactoria. Vercel informó estado `success` y preview Ready: https://arcade-git-feat-lumen-circuit-beta-omar-santanas-projects.vercel.app. Las pruebas automatizadas no sustituyen un test en teléfonos físicos ni una autorización jurídica.

**Ajuste táctil:** se corrigió un doble desplazamiento que podía ocurrir al presionar por primera vez la cruceta; el primer toque desplaza una celda y la repetición solo comienza tras el intervalo de movimiento. Archivo: `src/games/lumen-circuit/LumenCircuit.ts`. Requiere revisión final de CI y prueba en dispositivo.

## 2026-10-26 — Lumen Circuit: sincronización efectiva de Vercel y temática eléctrica dominicana
- **Problema reportado:** la preview Vercel mostraba aún un protagonista romboidal y centinelas geométricos; los cambios prometidos estaban solo en un ZIP local sin sincronización con GitHub.
- **Objetivo:** publicar en la rama `feat/lumen-circuit-beta` la identidad visual correcta sin fusionar a `main`.
- **Archivos afectados:** `src/games/lumen-circuit/{logic.ts,LumenCircuit.ts,logic.test.ts}`, `src/components/GameView.tsx`, `src/games/registry.ts`, `src/App.tsx`, documentación.
- **Resultado:** Lumen ahora se dibuja como rayo eléctrico luminoso; los perseguidores, como agujeros negros; los suelos y muros son más luminosos; cuatro mundos basados en paisajes dominicanos alteran conexiones del laberinto, energía dispersa y tiempo entre movimientos de apagones. Generadoras funcionales: tres terminales deben encenderse para activar la salida.
- **Pruebas:** añadidas comprobaciones de secuencia temática, diferencias de dificultad y accesibilidad de los objetivos. Ver ejecución de CI de la PR #4 correspondiente al commit final.
- **Riesgos:** los nombres de centrales son ficticios e inspirados en regiones del país, no afirmaciones sobre plantas existentes. Faltan pruebas táctiles y visuales en teléfonos reales; el nombre debe revisarse antes de comercializar.

## 2026-10-27 — Lumen Circuit: alta tensión y eventos aleatorios
**Objetivo:** dar consecuencias claras al recoger el nodo grande y variar la partida.
**Archivos afectados:** `src/games/lumen-circuit/logic.ts`, `logic.test.ts`, `LumenCircuit.ts`, `DESIGN.md` y documentos de arquitectura/continuidad/roadmap/README.
**Implementación:** nodo dorado sobredimensionado, único por oleada de poder; cuatro efectos exclusivos: Turbo eléctrico (movimiento acelerado), Invasión de apagones (aparición temporal acotada), Apagones acelerados (movimiento enemigo más rápido) y Campo de absorción (neutralización con recompensa de 120 puntos). Cada efecto dura siete segundos activos; luego 3,5 segundos de espera y nuevo nodo en casilla libre alcanzable. Se muestra nombre y cuenta atrás; sin cambios en Neon Drift.
**Pruebas:** suite determinista ampliada para los cuatro efectos, límites, expiración, aparición y colisiones. Resultado de CI/Vercel por confirmar para commit final.
**Riesgos:** algunos resultados castigan al jugador; revisar comprensión de ese riesgo y justicia perceptiva en teléfonos reales.

**Validación del sistema de nodos especiales (2026-10-27):** GitHub Actions [40494565328](https://github.com/omarsantanar/Arcade/actions/runs/40494565328) pasó 30/30 pruebas y compilación TypeScript/Vite sobre `f458617262804e9feae08d7c6924e9581f381c11`. Vercel informó despliegue `success` del preview de la rama. Queda pendiente prueba de legibilidad y balance en iOS/Android.

## 2026-10-27 — Lumen Circuit: tres tipos de puntos, bonificación, túneles y más apagones
- **Objetivo:** vincular supervivencia a puntos pequeños; puntuar chispas medianas a 10; convertir el gran nodo sin puntos en requisito del mundo; ofrecer niveles de respiro contrarreloj y túneles horizontales.
- **Código:** `src/games/lumen-circuit/logic.ts`, `LumenCircuit.ts`, `logic.test.ts`; documentación en `DESIGN.md`, README, ARCHITECTURE, CONTINUITY, ROADMAP y AGENTS.
- **Implementación:** cada 200 puntos pequeños (+1 por recogida) recibes una vida nueva, acumulada entre mundos; medianos aportan 10 y energía; grande activa un único efecto pero 0 puntos y es necesario para abrir portal normal. Bonificaciones 3,9,15,21,27,36,45,54,63 y cada nueve después: 90 s, sin apagones, interior despejado y todos los puntos obligatorios; sin generadoras. En algunos mundos, tubería de extremo a extremo para jugador y agujeros negros. Desde nivel 4, se añade un agujero negro permanente cada 4 niveles; bonificaciones excluidas.
- **Tests:** extendidos para umbral de 200, cambio de mundo, valor de cada tamaño, gran nodo obligatorio, reloj, secuencia de niveles, enlace lateral y IA en túnel, escalado cada cuatro niveles. Revisar estado final de CI/Vercel en la PR #4.
- **Riesgos:** mundos muy altos con muchos apagones y 90 s de bonificación deben comprobarse con usuarios, especialmente controles táctiles. La interpretación de «etc.» se documenta como +9 después del 63; es modificable.
