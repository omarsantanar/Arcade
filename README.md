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

## Sudoku — beta de velocidad (2026-10-27)
Tercer concepto jugable y módulo independiente en `feat/sudoku-speed-challenge` (PR de revisión, sin fusionar). **Sudoku** utiliza tablero original generado localmente y una progresión en dos fases: 1–3 enseñan filas/columnas/bloques en cuadrículas 4×4, con explicaciones y candidatos; a partir del nivel 4 se juega un 9×9 aleatorio con solución única, menor número de pistas conforme avanza la campaña y sin ayuda introductoria.

La clasificación **Relámpago / Oro / Plata / Bronce / Completado** depende exclusivamente del tiempo de resolución relativo a la dificultad del nivel. Se guardan el progreso, mejor tiempo por nivel y mejor puntuación localmente. Móvil: tocar casilla y teclado numérico. Escritorio: mouse, números, flechas y Backspace. Para ejecutar: `npm install`, `npm run dev`; validación: `npm run test && npm run build`.

**Derechos:** la mecánica abstracta no está protegida como obra por copyright en los términos descritos por la U.S. Copyright Office, pero **Sudoku es marca registrada por Nikoli en Japón**. El nombre se utiliza aquí descriptivamente en beta; revisar el ámbito marcario antes de distribución comercial o promoción internacional. Diseño y fuentes: `src/games/sudoku/DESIGN.md`.


**Preview de Sudoku Beta publicada (27-oct-2026):** https://arcade-git-feat-sudoku-speed-challenge-omar-santanas-projects.vercel.app. Fuente y revisión: https://github.com/omarsantanar/Arcade/pull/5. El último código de jugabilidad aprobó 21/21 pruebas y build en GitHub Actions 40509409402, y Vercel confirmó `Ready`. Aún no se ha validado con jugadores reales ni se ha fusionado a `main`.

## Catálogo unificado — 27 de octubre de 2026
La vista previa de Arcade presenta **exactamente tres juegos jugables**: `Neon Drift` (reflejos), `Sudoku` (puzles) y `Lumen Circuit` (aventura/energía). **Nova Run** se retiró del catálogo hasta contar con un concepto definido; no es un juego disponible. Cada título se carga de manera independiente mediante `src/games/registry.ts`.

**Preview unificada:** https://arcade-git-feat-sudoku-speed-challenge-omar-santanas-projects.vercel.app (rama `feat/sudoku-speed-challenge`, PR #5). Ejecutar localmente con:
```bash
git switch feat/sudoku-speed-challenge
npm ci
npm run dev
npm run test
npm run build
```
El código actualizado de Lumen procede de `feat/lumen-circuit-beta` (PR #4), incorporando mundos regionales, apagones, bonificaciones, tubos, tres tamaños de puntos, nodos y protección frente a encerronas. Su fuente se encuentra en `src/games/lumen-circuit/`.

**Validación del commit funcional `c9bf05304f08171394a72588d5317978eff59135`:** GitHub Actions [40513226150](https://github.com/omarsantanar/Arcade/actions/runs/40513226150), 55 pruebas satisfactorias (3 suites), comprobación TypeScript y build Vite aprobados; Vercel devolvió `success` para esa revisión. Esta es una **preview de prueba**, no producción; aún faltan pruebas de interacción en móviles físicos.

## Crucigrama Dominicano — cuarto juego en beta (2026-10-27)
Arcade incorpora **Crucigrama Dominicano** como cuarta tarjeta jugable junto con **Neon Drift, Sudoku y Lumen Circuit**. Cruces de 15×15 autogenerados con pistas y respuestas de nuestro vocabulario, personajes históricos, lugares y regiones, música, gastronomía, deportes, naturaleza y cultura. Más de 140 entradas con pistas editoriales originales; ocho categorías y modo «Todo el país». Se puede seleccionar casilla o pista, alternar cruce horizontal/vertical, escribir A–Z y Ñ (tildes omitidas), revisar errores, usar ayuda, jugar contrarreloj y continuar la partida guardada en este dispositivo. Récord por tema.

**Desarrollo:** `src/games/crucigrama/{bank.ts,logic.ts,CrosswordGame.tsx,Crossword.ts,logic.test.ts,DESIGN.md}`. Rama `feat/crucigrama-dominicano`, [PR #6](https://github.com/omarsantanar/Arcade/pull/6), con base en el portal integrado de tres juegos (PR #5). [Preview Vercel](https://arcade-git-feat-crucigrama-dominicano-omar-santanas-projects.vercel.app). Ejecutar: `git switch feat/crucigrama-dominicano && npm ci && npm run dev`; pruebas: `npm run test && npm run build`.

**Fuentes y propiedad intelectual:** la referencia lexicográfica es el DED (Academia Dominicana de la Lengua / Igalex), complementado por entradas verificadas en ASALE y patrimonio UNESCO. **No se ha importado ni copiado el diccionario completo ni sus definiciones**. Las pistas fueron redactadas para el juego; el banco editorial debe ser revisado individualmente antes de una versión comercial. Consultar `src/games/crucigrama/DESIGN.md`.
**Validación funcional:** commit `f55daa15bebf6c815145354a8f7bf3cc7acb1c34`, [CI 40574497642](https://github.com/omarsantanar/Arcade/actions/runs/40574497642), 63/63 tests, TypeScript/Vite correctos y Vercel `success`/Ready para la preview. Falta prueba humana en dispositivos reales.

## Sopa de Letras Dominicana — quinto juego en beta (2026-10-27)
El catálogo de Arcade añade **Sopa de Letras Dominicana**, sobre la rama `feat/sopa-letras-dominicana` y [PR #7](https://github.com/omarsantanar/Arcade/pull/7), basada en el catálogo con cuatro juegos de la PR #6. Los cinco títulos se muestran como disponibles: Neon Drift, Sudoku, Lumen Circuit, Crucigrama Dominicano y Sopa de Letras Dominicana. Nova Run sigue excluido.

El nuevo juego comparte las 150 entradas de `src/games/crucigrama/bank.ts`, sin una segunda copia ni importación del Diccionario del español dominicano; temas: dominicanismos, historia, lugares, cultura, gastronomía, música, deportes y naturaleza, más modo mixto. Pistas propias y fuentes parciales DED/ASALE/UNESCO ya documentadas en la rama del crucigrama. No confundir voces de uso general con dominicanismos registrados.

Tres tamaños: Inicial 10×10 (7 palabras), Intermedio 13×13 (10) y Experto 15×15 (13); el generador combina ocho direcciones según nivel y reproduce tableros con semilla. Selección táctil por arrastre o dos toques, teclado/mouse, resaltado de hallazgos, lista con pistas culturales, cronómetro, ayudas, récords por tema/dificultad y almacenamiento local. El tutorial básico se describe en `src/games/sopa-letras/DESIGN.md`.

Para ejecutar:
```bash
git switch feat/sopa-letras-dominicana
npm ci
npm run dev
npm run test
npm run build
```

**Validación de código:** [GitHub Actions 40579915918](https://github.com/omarsantanar/Arcade/actions/runs/40579915918) aprobó 72/72 pruebas, TypeScript y Vite. **Publicación:** Vercel rechazó los commits de esta rama por límite del plan Hobby `api-deployments-free-per-day` (más de 100 despliegues en 24 horas). No confirmar una preview actualizada hasta que el estado del commit final sea `success/Ready`. No se ha fusionado a `main`.

## Juegos de palabras en español por país (2026-10-27)
**Crucigrama en Español** y **Sopa de Letras en Español** tienen modo «Todo el mundo hispanohablante» y filtros reales para República Dominicana, México, España, Argentina, Colombia, Perú, Chile, Venezuela, Cuba, Puerto Rico, Ecuador, Uruguay, Guatemala y Costa Rica. El banco compartido conserva las entradas dominicanas y añade **240 pistas originales** asociadas a 13 territorios adicionales (240 en total). Los temas se habilitan cuando disponen de suficiente material. Las partidas y récords son compatibles con las versiones anteriores; la ausencia del campo país en guardados antiguos se interpreta como RD.

El filtro de país indica **referencia cultural**, no exclusividad de una palabra: muchas voces cruzan fronteras. ASALE (https://www.asale.org/obras-academicas/diccionarios/diccionario-de-americanismos) permite consultar variantes regionales; el DED (https://ded.igalex.org/Consultas/Index) continúa como referencia dominicana. Ninguna definición de esas obras fue copiada. Las entradas nuevas requieren revisión editorial individual antes de uso comercial.

**Código:** PR #8, rama `feat/juegos-palabras-espanol-paises`. Ejecutar `git switch feat/juegos-palabras-espanol-paises && npm ci && npm run dev`; probar `npm run test && npm run build`. El último código pasó **78 pruebas**, TypeScript y Vite ([Actions 40583190074](https://github.com/omarsantanar/Arcade/actions/runs/40583190074)). Vercel todavía bloquea el despliegue por cuota, no se debe presentar como publicado.

## Manejo RD — simulador educativo de conducción (beta 2026-10-30)
Sexto juego jugable de Arcade. Usa como **referencia** el Toyota Corolla 2001 automático, con un sedán vectorial genérico creado para el juego (sin logos, imágenes ni modelo tridimensional de Toyota y sin afirmar fidelidad mecánica). Vías urbanas **ficticias** de RD, con recorrido de aproximadamente 2 km desde estacionamiento a un destino aleatorio y un **límite de cinco minutos de conducción activa**. Situaciones: cinturón, espejos, freno previo a D, incorporación, direccionales, giro, semáforo, señal PARE, paso peatonal, zona escolar y tráfico pesado. Velocidad/límites y evaluación de seguridad con registro pedagógico local.

**Controles:** C cinturón, M espejos, S freno, G poner D, W acelerar, A/D dirigir, Q/E direccionales; P estacionar y R marcha atrás cuando esté detenido. En móviles están disponibles botones táctiles de pedal/volante/transmisión y preparación del automóvil. Comenzar con freno, cinturón, espejos y D; el reloj comienza tras salir del estacionamiento. Pausa, reinicio, sonido general y pantalla completa desde la barra de Arcade. Récord local, sin cuentas.

**Código:** `src/games/conduccion-rd/{logic.ts,logic.test.ts,DriverGame.tsx,Driver.ts,score.ts,DESIGN.md}`. Rama `feat/simulador-conduccion-rd`; [PR #9](https://github.com/omarsantanar/Arcade/pull/9) basada en PR #8 sin alterar los cinco juegos existentes. Para correr:
```bash
git switch feat/simulador-conduccion-rd
npm ci
npm run dev
npm run test
npm run build
```

**Fuentes jurídicas:** Ley 63-17, texto oficial INTRANT https://intrant.gob.do/transparencia/marco-legal/leyes/ (arts. 133-138, 231, 235, 241, 264, 266). Reglas didácticas y limitaciones en `DESIGN.md`. **No es un simulador certificado, un examen ni un sustituto de clases reales o práctica supervisada.** Los límites del circuito son señalización particular ficticia, no límites generales atribuidos a todas las calles de RD. Para circulación con rojo hay excepciones legales bajo condiciones (art. 137): las intersecciones simuladas representan prohibición señalizada. Manual Corolla 2001 consultado para posiciones P/R/N/D; no se replican parámetros dinámicos exactos.

## Manejo RD — POV de conductor y flechas (2026-10-30)
**Vista nueva:** el juego ya no utiliza cámara superior. `src/games/conduccion-rd/cockpit.ts` presenta perspectiva desde el interior del sedán, con parabrisas, tablero analógico, volante, espejo lateral, retrovisor interior, calles y señales proyectadas hacia adelante, autobuses y minimapa incrustado en el tablero. Es una **cabina ilustrativa propia**, no una reproducción exacta ni licenciada del Corolla 2001.

**Teclado principal:** flecha ↑ acelerador, ↓ freno, ← izquierda y → derecha; WASD permanece como alternativa. C cinturón, M espejos, Q/E intermitentes izquierdo/derecho, G selector D con freno, P estacionar, R reversa y N neutral. Los cuatro mandos de conducción se mantienen presionados para actuar y se liberan al soltar; al pausar o desenfocar la ventana se detienen las pulsaciones.

**Celular:** cinturón, espejos, ambas direccionales, P/R/N/D y controles táctiles independientes de dirección, freno y acelerador. Puedes tocar primero FRENO y después D sin teclado. La pantalla conserva pausa, reinicio y pantalla completa. Para pantalla estrecha, el panel se desplaza verticalmente.

**Estado técnico:** código funcional en commit `fa2ecf36b03ba2442f8d5ae50e40a0221c927ac5`, [Actions 41123729799](https://github.com/omarsantanar/Arcade/actions/runs/41123729799): **92/92 tests** (8 suites), TypeScript/Vite aprobados; Vercel `success` para esa revisión. Vista previa de la rama: https://arcade-git-feat-simulador-conduccion-rd-omar-santanas-projects.vercel.app. Desarrollo en [PR #9](https://github.com/omarsantanar/Arcade/pull/9), sin fusionar en `main`. Quedan pendientes pruebas visuales y multitáctiles en dispositivos reales, conducción completa de 300 segundos y revisión de un instructor de tránsito. Para instrucciones detalladas, ver `src/games/conduccion-rd/DESIGN.md`.


## Manejo RD 0.3 — dirección por inclinación del móvil (2026-10-31)
La versión experimental incorpora **dirección proporcional por sensores del celular**, conservando las flechas ↑/↓/←/→ y WASD en computadoras. En móvil, sostener el dispositivo horizontal, pulsar **«Activar inclinación»**, autorizar el sensor si el navegador lo solicita y usar **«Centrar»** para establecer la posición neutra de las manos. Inclinar a izquierda/derecha para girar; el coche emplea una zona muerta de 3°, movimiento suavizado y amplitud progresiva. Se puede ajustar sensibilidad (0,6–2), invertir el eje y volver a **«Botones»** sin perder la partida. Los pedales táctiles de freno/acelerador, direccionales, cinturón, espejos y selector P/R/N/D siguen disponibles. Vista de conducción horizontal inmersiva en teléfonos con pantalla y controles superpuestos, sin scroll durante la partida. Modo vertical disponible con aviso para girar el dispositivo.

**Compatibilidad:** `DeviceOrientationEvent` requiere HTTPS y acceso al sensor; algunos navegadores, especialmente iOS, piden permiso a partir de un toque del usuario. La detección es progresiva y se conserva control por botones cuando no hay permiso/datos. **No se guarda, envía ni analiza información cruda de los sensores.** El bloqueo automático de pantalla horizontal no es universal: orientar el teléfono manualmente.

**Código:** `src/games/conduccion-rd/tilt.ts`, `tilt.test.ts`, `logic.ts`, `DriverGame.tsx`, `src/styles.css` y las instrucciones de `GameView.tsx`. Rama `feat/simulador-conduccion-rd`, PR #9. Primer commit: `734620838beed6d41ca275b5b4ecbd3c4238d1cb`; revisar comprobación de CI de la revisión final y confirmar **Vercel Ready del SHA exacto** antes de anunciar un enlace de juego actualizado. Las cinco experiencias restantes permanecen intactas.


**Validación posterior (31-oct-2026):** el commit de código `667d056c46672bf8b91bd41cd9786757186824a4` pasó **99/99 pruebas**, nueve suites, compilación `tsc --noEmit` y `vite build` ([GitHub Actions 41210626709](https://github.com/omarsantanar/Arcade/actions/runs/41210626709)). El estado de despliegue Vercel es **success** para ese mismo SHA, a pesar del fallo previo del primer commit. El enlace de la preview de rama sigue siendo https://arcade-git-feat-simulador-conduccion-rd-omar-santanas-projects.vercel.app. La jugabilidad y el sentido del sensor aún requieren pruebas humanas en iOS y Android. No se fusionó a producción.
