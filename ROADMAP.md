# Roadmap — Arcade

Actualizado 2026-10-26. Los hitos describen progreso técnico, no aprobación de lanzamiento.

1. **Arquitectura y repositorio:** completada base documental; código subido en PR #1 y CI satisfactorio. Pendientes revisión PR, lockfile y cierre formal del hito.
2. **Portal responsive:** portada y catálogo listos en preview Vercel; pendientes pruebas reales Android/iOS, accesibilidad, rendimiento.
3. **Primer juego:** Neon Drift funciona en preview según build y despliegue; controles táctiles, teclado, pausa, reinicio y récord local programados; faltan pruebas manuales.
4. **Catálogo:** implementar más juegos originales como módulos independientes, con navegación y controles compartidos.
5. **Aplicación:** evaluar PWA y Capacitor para iOS/Android, reusando interfaz y lógica, luego validar límites de sonido, fullscreen y almacenamiento.

Preview: https://arcade-git-feat-initial-web-portal-omar-santanas-projects.vercel.app

Fuera de alcance hasta autorización: anuncios, cobros, registros, backend y multijugador.

### 2026-10-26 — Neon Drift v0.2.0 (en revisión)
- [x] Dificultad cada 7 segundos y corredores transitables con planificación independiente del motor.
- [x] Paleta oficial, nave triangular con glow, obstáculos variables y efectos de movimiento.
- [x] Simulación local de 156.000 oleadas.
- [ ] Validar Vitest/build con GitHub Actions y preview de Vercel.
- [ ] Balanceo en Safari iOS y Chrome Android; ajustes táctiles.
- [ ] Hyperdrift/Boost, música por capas y multiplicadores solo en versión posterior.

### 2026-10-26 — Neon Drift v0.3.0, más desafiante
- [x] Nivel inicial más rápido y frecuente; aberturas más estrechas.
- [x] Nuevas siluetas, campos de fragmentos y huecos señuelo (sin rutas falsas para el corredor testigo).
- [x] Pilares verticales programados en niveles 3, 6, 9… .
- [x] Simulación geométrica local de 131.200 oleadas sin violación de las restricciones.
- [ ] Aprobar tests Vitest/build del último commit y confirmar preview.
- [ ] Validar físicamente controles táctiles y percepción de justicia en móvil.


### 2026-10-26 — Neon Drift v0.4.0
- [x] Varias rutas posibles en niveles iniciales, aumentando la presión en niveles altos.
- [x] Orden/posición/forma de obstáculos y aparición temporal más aleatorios.
- [x] Comprobación conservadora de todas las rutas alcanzables y barreras verticales de cada tercer nivel.
- [ ] Revisión física en iOS/Android y balanceo por jugadores.


- [x] CI validado para v0.4.0, ejecución 40383943632: 11 pruebas y build satisfactorios.
- [ ] Validar en móvil rutas alternativas y equilibrio de niveles 1, 3, 6 y 10.

### 2026-10-27 — Sudoku (tercer juego original de Arcade)
- [x] Revisar copyright de mecánica y riesgo de marca territorial para «Sudoku» (Nikoli/Japón y ONAPI/RD).
- [x] Prototipo Sudoku 4×4 guiado (niveles 1–3) y 9×9 procedimental desde nivel 4.
- [x] Generación de tablero con única solución, dificultad escalonada y clasificación temporal en cinco categorías.
- [x] Teclado móvil/PC, guardado local del progreso y récord de tiempo por nivel.
- [ ] Comprobar GitHub Actions, TypeScript, Vitest y Vercel de rama experimental.
- [ ] Evaluar aprendizaje de 3 niveles, dificultad 4+, legibilidad y rendimiento del solver en móviles.
- [ ] Revisar oficialmente marcas por territorio antes de lanzamiento comercial, especialmente Japón.

- [x] CI inicial Sudoku: 21/21 tests, TypeScript y build aprobados en run 40503888212.
- [ ] Vercel bloqueado por build-rate-limit, sin preview nueva confirmada; redeploy cuando exista cuota.
- [x] Evitar generación innecesaria de puzzles al recuperar partida local (optimización del último commit).

- [x] 2026-10-27: diagnóstico del bloqueo real en Vercel: `api-deployments-free-per-day` (100 despliegues en 24 horas).
- [x] 2026-10-27: selección de primera celda editable, resaltado educativo por fila/columna/bloque y layout adaptable.
- [ ] Esperar recuperación de cuota, redeploy del último SHA de la rama y confirmar estado Ready.
- [ ] Prueba visual/táctil manual iOS/Android y revisión de comprensión del tutorial.


- [x] 2026-10-27: bloqueo de Vercel levantado para Sudoku Beta; Vercel Ready confirmado para commit `61213fe3`.
- [x] 2026-10-27: últimas 21/21 pruebas automatizadas, TypeScript y Vite aprobados ([Actions 40509409402](https://github.com/omarsantanar/Arcade/actions/runs/40509409402)).
- [ ] PENDIENTE: prueba humana y visual de tutorial, navegación, cronómetro y scroll móvil en iOS/Android antes de merge.

### Catálogo integrado — 2026-10-27
- [x] Portada con Neon Drift, Sudoku y Lumen Circuit listados como disponibles.
- [x] Nova Run eliminado del catálogo sin crear nuevas mecánicas.
- [x] Lumen Circuit importado con lógica, tests, assets geométricos y controles táctiles; módulos independientes conservados.
- [x] Integración verificada con 55/55 pruebas y build TypeScript/Vite (Actions 40513226150), estado Vercel `success`.
- [ ] Validar apertura consecutiva de los tres juegos en Chrome móvil y Safari iOS y confirmar accesibilidad del menú.
- [ ] Revisar y fusionar PR #5 al flujo de producción después de aceptación funcional; no se modifica `main` por ahora.

### 2026-10-27 — Crucigrama Dominicano
- [x] Confirmar fuente de referencia DED (Academia Dominicana de la Lengua e Igalex), fuentes ASALE y UNESCO y política de pistas propias.
- [x] Crear banco inicial de 150 respuestas originales con ocho áreas dominicanas y modalidad mixta.
- [x] Generar cuadrículas cruzadas 15×15 y numeración, comprobar cruces reales, seleccionar pistas horizontales/verticales, conservar Ñ, teclado de letras, ayuda, reloj y guardado local.
- [x] Integrar Crucigrama Dominicano como cuarto título, conservando los tres anteriores.
- [x] CI 40574497642 verificada (63/63 tests y build), Vercel Preview Ready para commit funcional.
- [ ] Revisión editorial una por una para uso comercial, ampliación de vocabulario regional y nombres propios; consultar permisos si se pretendiera importar definiciones de DED.
- [ ] Pruebas humanas en iOS/Android y ajuste de tamaño del tablero y variabilidad del generador.
- [ ] Revisar y fusionar la PR de la beta solo tras aceptación de UX y revisión de fuentes.

### 2026-10-27 — Sopa de Letras Dominicana
- [x] Banco cultural compartido de 150 palabras/pistas originales y referencias DED/ASALE/UNESCO de Crucigrama.
- [x] Ocho categorías, modalidad mixta equilibrada y niveles Inicial 10×10 / Intermedio 13×13 / Experto 15×15.
- [x] Generador reproducible con verticales, diagonales, invertidas progresivas y comprobación de palabras encontradas.
- [x] Interacción por arrastre de dedo/mouse y toque de extremos, lista de palabras, pistas, ayudas, tiempo y récord local.
- [x] Integrado como quinto juego de la galería; otros cuatro conservados, Nova Run no incluido.
- [x] 72/72 pruebas automáticas y compilación TypeScript/Vite: Actions 40579915918.
- [ ] Vercel Preview pendiente: cuenta alcanzó el límite `api-deployments-free-per-day`. Redeploy cuando vuelva la cuota y confirmar Ready.
- [ ] Pruebas físicas iOS/Android; chequear selección diagonal, legibilidad de 15×15, almacenamiento local y accesibilidad.
- [ ] Progresar a banco de cientos de voces auditadas y control de fuentes por palabra, sin scraping de diccionarios protegidos.

### 2026-10-27 — Crucigrama y Sopa: edición panhispánica
- [x] Renombrar títulos visibles a «Crucigrama en Español» y «Sopa de Letras en Español».
- [x] Añadir «Todo el mundo hispanohablante» y 14 opciones nacionales/territoriales.
- [x] Crear 240 entradas culturales nuevas con países explícitos y pistas propias; conservar las voces dominicanas.
- [x] Aplicar filtro por país a los dos motores y habilitar tema solo con vocabulario suficiente.
- [x] Separar récords por país y migrar guardados anteriores sin perder progreso.
- [x] CI 40583190074: 78/78 pruebas y build correcto.
- [ ] Vercel pendiente por límite de builds; confirmar Ready del commit final.
- [ ] Revisar 240 pistas editorialmente por región y probar UX móvil de todos los países.
- [ ] Ampliar a otros territorios de habla española tras la curaduría de los primeros 14.
