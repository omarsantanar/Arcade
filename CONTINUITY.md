# Continuidad operativa

## Estado inmediato — 2026-10-26 — v0.3.0
- Rama de desarrollo: `feat/initial-web-portal`; PR #1 abierta, no fusionada a `main`.
- Se ha subido un generador de oleadas más agresivo, obstáculos con seis siluetas y barreras verticales una vez en niveles 3/6/9…; la dificultad sigue subiendo cada 7 segundos.
- Simulación geométrica local completada: 131.200 oleadas y 2.800 barreras especiales sin pérdida de corredor viable. **Pendiente** revisar Vitest/build en GitHub y desplegado Vercel de este commit.
- **Pendientes:** probar los niveles 1–6 en Safari iOS y Chrome Android, comprobar legibilidad de fragmentos y la sensación real de dificultad, y conseguir un `package-lock.json` reproducible.
- **Siguiente acción:** comprobar CI de v0.3.0 y estado de Vercel, corregir cualquier error de compilación; después revisar equilibrio en celular. No fusionar a producción antes.
- **Riesgo:** las aberturas engañosas pueden parecer injustas si no quedan claramente delimitadas; no equivale a ausencia de rutas geométricas.
 de Arcade

**Actualizado:** 2026-10-26  
**Versión:** 0.1.0 (prototipo de evaluación; no producción)

## Estado comprobado
- [x] Repositorio `omarsantanar/Arcade` inicializado y documentación operativa versionada.
- [x] Código de 17 archivos de aplicación/configuración subido a rama `feat/initial-web-portal`.
- [x] Pull Request #1 abierto: https://github.com/omarsantanar/Arcade/pull/1.
- [x] GitHub Actions `test-and-build` exitoso: ejecución 40365623114.
- [x] Preview Vercel informado como Ready: https://arcade-git-feat-initial-web-portal-omar-santanas-projects.vercel.app.
- [ ] Validación manual del preview desde Safari iOS y Chrome Android (controles, sonidos, orientación).
- [ ] Generar y versionar `package-lock.json`; reemplazar `npm install` por `npm ci` en CI.
- [ ] Fusionar la PR tras revisión y decidir si se habilita un dominio de producción.
- [ ] Auditar accesibilidad, rendimiento, privacidad y licencias.

## Próximo paso exacto
Abrir el preview desde un teléfono y comprobar: galería visible de inmediato, botón Jugar, controles táctiles, pausa, reinicio y guardado local. Recoger los defectos. Después completar lockfile y revisión de la PR #1 antes de fusionar.

## Riesgos
La preview puede requerir acceso según ajustes del proyecto Vercel. Éxito de CI no equivale a pruebas de usuario o aprobación para producción.

## Protocolo
Al iniciar leer seis documentos operativos desde GitHub; al terminar consignar objetivo, archivos, pruebas, resultado, riesgos y próxima acción.

## 2026-10-26 — Actualización Neon Drift v0.2.0
- **Objetivo:** dificultad escalonada cada 7 s + identidad visual según la guía del usuario.
- **Archivos:** lógica, escena y pruebas Neon Drift, GameView, estilos y DESIGN.md.
- **Pruebas:** 156.000 oleadas simuladas sin violar la trayectoria viable; parseo TypeScript correcto. npm inaccesible localmente; esperar CI.
- **Resultado:** cambio en PR #1 `feat/initial-web-portal`, pendiente de ejecución CI y despliegue Vercel.
- **Riesgos:** falta comprobación Safari iOS/Chrome Android; falta lockfile.
- **Siguiente acción:** verificar estado de Actions y preview, ensayar niveles 1-5 en celular, probar controles/tamaño del corredor, recoger incidencias. No fusionar antes.

### Verificación CI — 2026-10-26
- Commit de código corregido `ec0d60ad4be8e956176ce62fc7763281ba1148d1`: 6/6 pruebas Vitest y compilación TypeScript/Vite correctas en ejecución 40370131862.
- Vercel informó estado **success** para el mismo commit; preview: https://arcade-git-feat-initial-web-portal-omar-santanas-projects.vercel.app.
- Se sincroniza versión a `0.2.0`. La versión sigue **en revisión en PR #1**, no lanzada en producción. Validación manual en móviles pendiente.


### Comprobación posterior al cambio v0.3.0 — 2026-10-26
- GitHub Actions [40372684449](https://github.com/omarsantanar/Arcade/actions/runs/40372684449) pasó las siete pruebas de Vitest y `npm run build` en el commit `319428d180a495ac13b951068247b79cfa122d06`.
- Vercel reportó **success** para ese mismo commit; la preview permanece asociada a `feat/initial-web-portal`.
- Próximo paso: ensayar niveles 1, 3 y 6 en móvil real, incluido control por arrastre, claridad de hitboxes y reacciones humanas; ajustar balance si corresponde. No fusionar a `main` sin revisar.


### Sesión 2026-10-26 — v0.4.0
Objetivo: corregir rutinas predecibles al permitir múltiples escapes y aleatorizar oleadas/obstáculos.
Archivos: lógica, escena, pruebas, guía de diseño, documentación y paquete.
Pruebas: simulaciones de múltiples semillas y rutas completadas; ejecución CI de nueva rama pendiente de comprobación tras el commit.
Resultado: diseño multirruta preparado en PR #1; no fusionar a main antes de CI y pruebas manuales.
Riesgos: respuesta táctil y dificultad percibida no validadas por jugadores.
Próximo paso: verificar Vitest, compilación Vite y preview de Vercel para la revisión visual de niveles 1, 3, 6 y 10.


#### Comprobación de integración v0.4.0
- Commit de código verificado: f6f030ce4e92e7c45c4af77ae198c81beb45e702.
- CI GitHub Actions: ejecución 40383943632, 11 pruebas satisfactorias y build Vite/TypeScript exitoso.
- Preview Vercel: estado Ready en la rama feat/initial-web-portal.
- Falta validar con usuarios y dispositivos físicos que las distintas soluciones sean perceptibles y el control responda adecuadamente.

## Estado — 2026-10-27 — Sudoku de velocidad
**Solicitud:** confirmar situación de copyright de Sudoku y crear título «Sudoku» con tres niveles de aprendizaje, dificultad que sube vertiginosamente desde el cuarto, tableros aleatorios y medición de calidad según tiempo.
**Investigación:** las reglas/métodos abstractos del Sudoku no están sujetos al copyright conforme a la U.S. Copyright Office; Nikoli declara propiedad marcaria de «Sudoku» en Japón y exige precaución en el uso comercial. No se ha hecho búsqueda exhaustiva de ONAPI; título descriptivo para prueba, no para reivindicar exclusividad.
**Desarrollo:** nueva rama `feat/sudoku-speed-challenge`, base `feat/initial-web-portal` que mantiene Neon Drift independiente. Sudoku de 4×4 en niveles 1–3 (fila/columna/bloque), 9×9 desde el cuarto con puzzles generados y verificación única, clasificación por velocidad (sin penalizaciones adicionales), controles táctiles y teclado, guardado y mejor tiempo por nivel.
**Archivos:** `src/games/sudoku/`, registry, GameView, styles.css, test de catálogo y documentación. No se ha fusionado.
**Pruebas:** nuevos tests implementados; CI/build y Vercel pendientes de confirmar.
**Riesgos:** escalabilidad del generador en móviles, comprensión del salto 4×4→9×9, revisión de marca según jurisdicción.
**Siguiente:** verificar CI/Vercel; jugar tres introducciones más cinco niveles aleatorios en Android/iOS, medir tiempo y latencia; no fusionar sin evaluación.

**Resultado verificado:** GitHub Actions 40503888212 completó 21/21 tests y compilación satisfactoria. Vercel rechazó el commit `06a6517bb054e0e45af87dcc94eed1b392b85796` por límite de builds (enlace de estado `upgradeToPro=build-rate-limit`), no por un error del código. Rama y PR #5 continúan disponibles pero la preview no se puede afirmar jugable en este momento. **Último ajuste:** la restauración local del tablero conserva los datos guardados sin generar un puzzle nuevo; pendiente validar este cambio con CI.
**Siguiente paso:** tras restablecerse la cuota de Vercel, ejecutar `Redeploy` del último commit desde el proyecto Vercel y comprobar estado Ready; probar manualmente cronómetro, pausas, tutorial y entrada táctil antes de fusionar.

## Seguimiento inmediato 2026-10-27 — Sudoku / Vercel
- Comprobada PR #5 `feat/sudoku-speed-challenge` con CI anterior 21/21 exitoso; Vercel bot rechazó despliegue: `Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")`.
- Hecho: optimizar UX de Sudoku para pantallas pequeñas y facilitar entrada a la primera casilla; destacar por separado la regla enseñada en los tres niveles.
- Pruebas: comprobar último CI tras commit, y volver a verificar despliegue cuando Vercel acepte nuevos builds.
- Riesgo: no se ha observado partida física; nunca etiquetar Preview Ready sin evidencia del SHA exacto.
- Próximo paso: abrir https://vercel.com/omar-santanas-projects/arcade y hacer Redeploy del último commit cuando se restablezca la cuota, después ensayar cuatro niveles y tomar datos reales de tiempo/errores de comprensión.


## Resultado comprobado — Sudoku Beta, 2026-10-27
- **Código:** `feat/sudoku-speed-challenge`, PR #5, commit funcional `61213fe3753b97414dba0a5d75410b42ece9814b`; selección automática de primera casilla libre, enfoque didáctico por fila/columna/bloque en etapas 1–3 y tablero móvil con scroll y espacio para teclado.
- **Pruebas:** [GitHub Actions 40509409402](https://github.com/omarsantanar/Arcade/actions/runs/40509409402) completó **21/21** tests, TypeScript y Vite sin errores.
- **Vercel:** la limitación `api-deployments-free-per-day` impedía desplegar pero el estado del último commit cambió a `success`; el bot de Vercel confirmó **Ready** con preview https://arcade-git-feat-sudoku-speed-challenge-omar-santanas-projects.vercel.app.
- **Pendiente:** verificación manual de teclado numérico y de pausa/continuación en móvil real, accesibilidad por lector de pantalla y comprensión de los primeros tres niveles. No se afirma que se haya completado una prueba física.
- **Siguiente tarea:** abrir la preview y completar los niveles 1–4 en teléfono, medir facilidad de tutorial y tiempo de carga de 9×9; no fusionar a producción hasta aprobación.

## Estado del portal — 2026-10-27: tres juegos disponibles
**Solicitud:** retirar Nova Run del portal por tratarse de un concepto indefinido, añadir Lumen Circuit a la preview donde ya estaban Neon Drift y Sudoku y mostrar los tres títulos desarrollados.
**Implementación:** rama `feat/sudoku-speed-challenge`, PR #5; `registry.ts` presenta solo `neon-drift`, `sudoku`, `lumen-circuit` como disponibles. Importación dinámica por juego. Se copiaron los cuatro archivos de Lumen Circuit (lógica, escena, tests, guía) de la PR #4, y se actualizaron la UI, el contrato opcional `setMove`, controles táctiles, estilos, portada, el test del catálogo y documentación.
**Verificación:** GitHub Actions [40513226150](https://github.com/omarsantanar/Arcade/actions/runs/40513226150), sobre commit de código `c9bf05304f08171394a72588d5317978eff59135`: 55/55 pruebas, TypeScript y Vite aprobados. Estado Vercel `success` para ese commit. Enlace compartido de preview: https://arcade-git-feat-sudoku-speed-challenge-omar-santanas-projects.vercel.app.
**Riesgos pendientes:** falta juego manual real de los tres módulos desde galería en móvil y escritorio; Sudoku conserva riesgos de nombre en mercados donde sea marca; aún no fusionar a producción.
**Próximo paso:** abrir la preview en móvil y PC, lanzar los tres títulos consecutivamente, comprobar montaje/desmontaje, cruceta, teclado, pausa, registros y pantalla completa, y después considerar fusión mediante PR revisada.

## Estado inmediato — 2026-10-27 — Crucigrama Dominicano
**Solicitud:** crear cuarta plataforma de crucigramas basada culturalmente en el español dominicano, incluyendo palabras locales, personajes históricos, lugares, gastronomía, música, deportes, naturaleza y tradiciones.
**Investigación:** referencia al `Diccionario del español dominicano` (Academia Dominicana de la Lengua / Igalex, edición en línea 2024 actualizada trimestralmente y DED.2.2026.3 en octubre), ASALE guagua/concho/chinola/yipeta/concón y UNESCO sobre merengue/bachata/cocolo/casabe. Pistas propias, **no copia del DED**; no atribuir verificación individual a todos los vocablos.
**Archivos de código:** `src/games/crucigrama/{bank.ts,logic.ts,logic.test.ts,CrosswordGame.tsx,Crossword.ts,DESIGN.md}` y catálogo, GameView, App, estilos y test de catálogo. **Estado:** cuarta tarjeta disponible en rama `feat/crucigrama-dominicano`, PR #6 contra `feat/sudoku-speed-challenge`; Neon Drift, Sudoku, Lumen Circuit siguen disponibles.
**Verificación confirmada:** commit `f55daa15bebf6c815145354a8f7bf3cc7acb1c34` en [CI 40574497642](https://github.com/omarsantanar/Arcade/actions/runs/40574497642): 63/63 pruebas, TypeScript y Vite build OK, estado Vercel `success` y bot Ready. Preview: https://arcade-git-feat-crucigrama-dominicano-omar-santanas-projects.vercel.app.
**Pendientes/riesgos:** prueba visual/táctil en Safari iOS y Chrome Android, densidad de pistas por categoría y comprobación editorial de los 150 términos; algunas voces y pistas necesitan consulta individual. Sin publicar diccionario completo, sin monetización ni merge automático.
**Próximo paso:** evaluar en móviles que tablero y teclado no requieran zoom, jugar categorías léxico/historia/mixto, revisar ambigüedades y crear un proceso editorial de alta de palabras con fuente validada.

## 2026-10-27 — Quinto título: Sopa de Letras Dominicana
**Solicitud:** desarrollar sopa de letras dominicanas con la misma cobertura y criterio documental del anterior Crucigrama Dominicano.
**Estado del código:** PR #7 `feat/sopa-letras-dominicana`, basada en PR #6, integra quinto juego junto con Neon Drift, Sudoku, Lumen Circuit y Crucigrama Dominicano. Comparte 150 entradas editoriales de `src/games/crucigrama/bank.ts`; no se extrajo contenido del DED ni se atribuye verificación individual total. Nuevos archivos: `src/games/sopa-letras/{logic.ts,logic.test.ts,WordSearchGame.tsx,WordSearch.ts,DESIGN.md}`; cambio en registro, GameView, portada, CSS y test existente.
**Mecánica:** ocho categorías y modo mixto, tres dificultades de 10×10, 13×13 y 15×15; selección por trazado recto arrastrando o por dos toques, ambas orientaciones, Ñ preservada; pistas al desplegar términos, contador, pausa, ayudas, récord por tema/dificultad y guardado del progreso.
**Verificación:** CI 40579915918 (72 pruebas aprobadas, build TypeScript/Vite correcto). Despliegue Vercel bloqueado por `api-deployments-free-per-day`, más de 100 deployments/24h. **No afirmar que la URL de la rama sirve el código nuevo hasta recibir estado success/Ready del último commit**.
**Riesgos:** test de gestos reales móvil pendiente, contraste/tamaño 15×15 en pantallas pequeñas, chequeo editorial de todas las respuestas y detección de coincidencias accidentales del relleno.
**Siguiente paso:** redeploy de último commit cuando se restablezca la cuota; abrir la preview y completar cada dificultad en Android y iOS; probar arrastre diagonal, dos toques, acentuación y Ñ, pistas y persistencia. Ajustar UX antes de proponer merge.

**Cierre funcional 2026-10-27:** commit `e875d6d46c63543f6a19119aeedbdd5dcdd12e66` comprobado: 72/72 tests en 5 suites, TypeScript y Vite OK ([CI 40580465036](https://github.com/omarsantanar/Arcade/actions/runs/40580465036)). Añadida navegación con flechas y confirmación de extremos con Enter/Espacio desde teclado físico. Vercel no publicó el cambio por límite de 100 despliegues/24 horas: último estado `failure`. PR #7 continúa experimental contra rama del Crucigrama. Próximo paso: desplegar cuando se recupere la cuota y probar gestos reales y accesibilidad con móvil; no fusionar a main sin aceptación.

## Estado al 27-10-2026 — Crucigrama y Sopa en Español por país
**Solicitud:** reformular los últimos dos juegos para español general con opciones nacionales. **Código:** rama `feat/juegos-palabras-espanol-paises`, PR #8 contra `feat/sopa-letras-dominicana`. Titulares visibles «Crucigrama en Español» y «Sopa de Letras en Español»; conservados IDs internos. `countries.ts` añade 240 entradas a la base compartida original. Países/territorios: DO, MX, ES, AR, CO, PE, CL, VE, CU, PR, EC, UY, GT, CR y modo `todos`. Filtros de país reales, temas disponibles por cantidad de entradas, récords separados, guardados antiguos reconstruidos como RD.
**Pruebas:** 78/78 tests y build TypeScript/Vite en commit funcional `5e7d10d88f448b8b2a7a7f2e40dbbb027aef9127`, [CI 40583190074](https://github.com/omarsantanar/Arcade/actions/runs/40583190074). Vercel falló por `build-rate-limit`, sin preview actualizada confirmada.
**Riesgos:** fuente y asociación cultural de 240 propuestas requieren edición; móvil sin test físico. No atribuir exclusividad de una voz al país de la pista, ni reproducir definiciones protegidas. **Próximo:** redeploy al liberarse cuota, recorrer filtros en ambos juegos, validar UX y contenido antes de merge.
