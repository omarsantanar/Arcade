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

## 2026-10-27 — Nuevo título Sudoku, beta de aprendizaje y velocidad
- **Objetivo:** investigar copyright/marca de Sudoku y crear puzzle integrado en Arcade con tres niveles guiados y dificultad aleatoria ascendente desde el cuarto, medido por tiempo.
- **Archivos:** `src/games/sudoku/{logic.ts,Sudoku.ts,SudokuGame.tsx,logic.test.ts,DESIGN.md}`, `src/games/registry.ts`, `src/games/neon-drift/logic.test.ts`, `src/components/GameView.tsx`, `src/styles.css` y documentos raíz.
- **Implementación:** tableros 4×4 de introducción filas/columnas/bloques con candidatos, cambio abrupto a 9×9 en nivel 4, generador aleatorio con verificación de solución única y pistas objetivo descendentes, cronómetro de tiempo activo, cinco categorías de calidad basadas únicamente en tiempo normalizado al nivel, progreso parcial y récords por nivel guardados localmente.
- **Investigación jurídica:** U.S. Copyright Office distingue método de juego frente a expresión protegida; Nikoli reivindica marca Sudoku en Japón (categorías 9, 28, 41, entre otras); ONAPI explica protección marcaria dominicana. Se usará el nombre únicamente en sentido descriptivo durante beta, con revisión territorial antes de comercializar.
- **Pruebas:** Vitest de unicidad, variación, enseñanza, calidad temporal y validez de partidas guardadas; CI y Vercel por confirmar tras PR.
- **Resultado:** rama `feat/sudoku-speed-challenge` sobre `feat/initial-web-portal` sin modificar Neon Drift ni Lumen Circuit.
- **Riesgos:** usabilidad en móvil, costo de generación de puzzles duros, nombre en jurisdicciones restringidas; sin monetización.

**Verificación posterior:** GitHub Actions [40503888212](https://github.com/omarsantanar/Arcade/actions/runs/40503888212) aprobó las **21 pruebas** (10 Sudoku + 11 Neon Drift) y `tsc --noEmit` / `vite build` en `06a6517bb054e0e45af87dcc94eed1b392b85796`. La primera compilación falló por una coma en el catálogo, corregida antes de la ejecución exitosa.
**Bloqueo de publicación:** el estado Vercel del mismo commit es `failure` y apunta explícitamente a `upgradeToPro=build-rate-limit`, límite de compilaciones de la cuenta, no fallo de TypeScript. Se optimizó además la recuperación de partidas guardadas para evitar generar otro sudoku innecesariamente al abrir la página; ejecutar CI nuevamente para el commit final. La preview no se debe presentar como actualizada hasta confirmación de Vercel.

## 2026-10-27 — Revisión de publicación y ergonomía Sudoku
- **Objetivo:** ejecutar la revisión previa al despliegue y asegurar que el tablero sea utilizable en dispositivos pequeños.
- **Archivos:** `src/games/sudoku/SudokuGame.tsx`, `src/styles.css`, CHANGELOG, CONTINUITY y ROADMAP.
- **Cambios:** el foco lógico inicial y después del avance señala directamente la primera casilla editable; en los tres niveles iniciales se resalta exactamente la fila, columna o bloque enseñado; ancho del tablero acotado a 400 px; el contenedor permite desplazamiento vertical en pantallas cortas y elimina el panel lateral móvil para reservar espacio al teclado numérico.
- **Pruebas:** resultado pendiente de CI sobre el último commit. Se mantiene la suite de 21 tests y revisión manual aún pendiente.
- **Bloqueador externo:** Vercel indicó expresamente `api-deployments-free-per-day`, más de 100 despliegues en 24 h, por lo que no se afirma que la preview esté actualizada. No se forzó una cuota ni se modificaron planes/credenciales.
- **Riesgos:** aún se necesita prueba visual en teléfonos; interfaz no evaluada con usuarios nuevos.


**Resultado de cierre de la revisión del 27-oct-2026:** el commit de jugabilidad `61213fe3753b97414dba0a5d75410b42ece9814b` aprobó 21/21 pruebas y `tsc --noEmit && vite build` en [Actions 40509409402](https://github.com/omarsantanar/Arcade/actions/runs/40509409402). Vercel volvió a aceptar despliegues: estado **success** y comentario del bot **Ready** para el mismo commit, con [preview Sudoku](https://arcade-git-feat-sudoku-speed-challenge-omar-santanas-projects.vercel.app). El límite previo de 100 despliegues en 24 horas quedó superado para esta publicación. **No se pudo ejecutar una comprobación visual interactiva remota desde este entorno**; pendiente probar iOS/Android reales y recorrido completo de niveles 1–4. La PR #5 continúa como borrador sin fusionar.

## 2026-10-27 — Catálogo Arcade unificado con los tres títulos terminados
**Objetivo:** mostrar en la misma plataforma y galería Neon Drift, Sudoku y Lumen Circuit, retirando el concepto no definido Nova Run.
**Archivos afectados:** `src/games/registry.ts`, `src/games/types.ts`, `src/components/GameView.tsx`, `src/games/neon-drift/logic.test.ts`, `src/games/lumen-circuit/{logic.ts,logic.test.ts,LumenCircuit.ts,DESIGN.md}`, `src/styles.css`, `src/App.tsx`; documentación README/ARCHITECTURE/CHANGELOG/CONTINUITY/ROADMAP/AGENTS.
**Cambios:** Lumen Circuit copiado de su rama experimental más reciente con toda su lógica y pruebas; Nova Run retirado; los tres juegos listados como disponibles; carga diferida independiente; GameView con explicaciones y controles por juego; récords independientes; portada explicita los tres títulos.
**Pruebas:** [CI 40513226150](https://github.com/omarsantanar/Arcade/actions/runs/40513226150), revisión de código `c9bf05304f08171394a72588d5317978eff59135`: **55/55 pruebas aprobadas**, TypeScript y Vite sin errores. Vercel marcó `success` para el mismo commit. Cambios documentales posteriores no modifican lógica.
**Resultado:** preview unificada en `feat/sudoku-speed-challenge` y PR #5, sin fusionar automáticamente con `main`. **Riesgos:** sin ensayo físico de los tres juegos, interacción multi-dispositivo y contraste accesible pendientes.

## 2026-10-27 — Cuarto juego: Crucigrama Dominicano
**Objetivo:** crear un juego rico en léxico dominicano, figuras históricas, provincias, naturaleza, cultura, deportes, gastronomía y música sobre la edición digital del Diccionario del español dominicano como referencia editorial.
**Archivos afectados:** `src/games/crucigrama/{bank.ts,logic.ts,logic.test.ts,CrosswordGame.tsx,Crossword.ts,DESIGN.md}`; `src/games/registry.ts`, `src/games/neon-drift/logic.test.ts`, `src/components/GameView.tsx`, `src/styles.css`, `src/App.tsx` y seis documentos de raíz.
**Cambios:** banco inicial de 150 respuestas en ocho categorías, pistas originales y enlaces directos solo para términos comprobados; crucigramas aleatorios de 15×15 con numeración, entrada táctil/teclado Ñ, pistas por orientación, cambio de palabra en cruce, revisión, ayuda, cronómetro, guardado y récords. Catálogo de cuatro títulos jugables; otros tres módulos preservados.
**Fuentes:** Academia Dominicana de la Lengua / Igalex DED.2.2026.3, ASALE por palabra, UNESCO para manifestaciones culturales. No copiar definiciones, ejemplos ni base de datos protegidos.
**Pruebas:** primer intento detectó filtración involuntaria de respuesta en pista `CIGUA`, corregida; segundo detectó importación TypeScript sin uso y firma temática de test, corregidos. Commit funcional `f55daa15bebf6c815145354a8f7bf3cc7acb1c34`: [GitHub Actions 40574497642](https://github.com/omarsantanar/Arcade/actions/runs/40574497642) **63/63 tests aprobados**, `tsc --noEmit` y Vite build; Vercel `success` Ready.
**Resultado:** preview independiente [Crucigrama Dominicano](https://arcade-git-feat-crucigrama-dominicano-omar-santanas-projects.vercel.app) en PR #6; no merge a main. **Riesgos:** validación individual de pistas/datos en curso; legibilidad de una cuadrícula 15×15 y control táctil sin verificación física; derechos editoriales si algún día se incorpora contenido DED licenciado.

## 2026-10-27 — Sopa de Letras Dominicana, quinto título jugable
- **Objetivo:** ofrecer juego cultural dominicano bajo criterios editoriales del crucigrama, compartiendo sus entradas y fuentes.
- **Archivos modificados/nuevos:** `src/games/sopa-letras/{logic.ts,logic.test.ts,WordSearchGame.tsx,WordSearch.ts,DESIGN.md}`, `src/games/registry.ts`, `src/games/neon-drift/logic.test.ts`, `src/components/GameView.tsx`, `src/App.tsx`, `src/styles.css`, README/ARCHITECTURE/CHANGELOG/CONTINUITY/ROADMAP/AGENTS.
- **Cambios:** generador sembrado de palabras ocultas con ocho materias, modos 10×10/13×13/15×15, selección bidireccional táctil o por toques, ayudas, pistas desplegables, temporizador y récord local; sigue el banco editorial de 150 respuestas de Crucigrama Dominicano, sin duplicar definiciones; galería con cinco juegos y sin Nova Run.
- **Pruebas:** [CI 40579915918](https://github.com/omarsantanar/Arcade/actions/runs/40579915918): 72/72 tests, TypeScript y Vite aprobados. Primero hubo fallo de estricta comprobación por variables importadas/no usadas en el nuevo juego; se corrigieron. Se mantiene aislamiento de los cuatro títulos anteriores.
- **Publicación:** Vercel bot rechazó el commit final funcional `e617569d13ee67e306c63ffae6e88e33bfdf7cb3` por cuota `api-deployments-free-per-day`, más de 100 despliegues/24 horas. Se necesita redeploy cuando vuelva la cuota, y comprobar Ready para el SHA actualizado.
- **Riesgos:** sin ensayo en teléfonos físicos, edición documental no 100 % verificada por entrada, posible palabra accidental por relleno; no se hace merge ni se inicia monetización.

**Última revisión de accesibilidad (2026-10-27):** `WordSearchGame.tsx` admite además de arrastre y dos toques táctiles, navegación con flechas y selección de extremos con Enter/Espacio en el teclado físico; sin cambios en otros juegos. Commit funcional `e875d6d46c63543f6a19119aeedbdd5dcdd12e66`: [Actions 40580465036](https://github.com/omarsantanar/Arcade/actions/runs/40580465036) completó 72/72 pruebas (5 suites), typecheck y build de Vite. Vercel mantiene error `upgradeToPro=build-rate-limit` para ese commit; sin preview Ready.

## 2026-10-27 — Crucigrama y Sopa de Letras pasan a español general
**Objetivo:** eliminar enfoque exclusivo de RD en ambos títulos y permitir tableros generales o específicos por país.
**Archivos:** `crucigrama/{bank.ts,countries.ts,countries.test.ts,logic.ts,CrosswordGame.tsx}`, `sopa-letras/{logic.ts,WordSearchGame.tsx}`, `registry.ts`, `GameView.tsx`, `App.tsx`, `styles.css` y seis documentos raíz.
**Resultado:** nombres visibles en Español, 14 selecciones territoriales más modo general, 240 pistas nuevas sobre el banco existente, filtros reales, récords segmentados, restauración de guardados antiguos como DO. Sin cambios a Neon Drift, Sudoku ni Lumen Circuit.
**Pruebas:** el primer test detectó que una pista venezolana contenía la respuesta CUATRO; corregido. El commit funcional `5e7d10d88f448b8b2a7a7f2e40dbbb027aef9127` completó **78/78 tests**, TypeScript y Vite ([GitHub Actions 40583190074](https://github.com/omarsantanar/Arcade/actions/runs/40583190074)).
**Riesgos:** revisión lingüística/territorial de las 240 entradas, pruebas reales móvil, cobertura limitada en ciertos temas. Vercel `failure` por cuota diaria; PR #8 abierta sin merge.

**Ajuste final de UX:** en modo general, Crucigrama indica el país asociado a la pista activa, y Sopa de Letras lo muestra junto a las palabras de la lista. No atribuye exclusividad lingüística. Último commit de juego `80ee6125a4ebedb5e51280847e802e5f8c4fe2b7`: 78/78 pruebas y compilación correctas en [CI 40584052314](https://github.com/omarsantanar/Arcade/actions/runs/40584052314). Estado Vercel `failure` únicamente por cuota de builds.
