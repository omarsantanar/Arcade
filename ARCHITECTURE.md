# Arquitectura — Arcade

**ADR-001 · 2026-10-26**

Objetivo: portal web mobile-first con videojuegos originales jugables en el navegador. Segunda etapa: aplicaciones móviles reutilizando código.

## Stack y razones
TypeScript, React y Vite para la interfaz; Phaser 3 para minijuegos 2D. Catálogo y escenas separados, carga diferida del motor para mejorar la portada. CSS propio y localStorage para guardar marcas sin cuentas ni backend.

## Contrato modular
- `src/App.tsx`: portada, categorías y selección.
- `src/games/registry.ts`: manifiestos y carga dinámica.
- `src/games/types.ts`: GameFactory y GameHandle (pause, resume, restart, mute, direction, destroy).
- `src/components/GameView.tsx`: interfaz compartida de juego.
- `src/games/<id>/`: escenas, lógica y tests independientes.

Alternativas consideradas: Canvas puro aumenta código propio; backend en primera etapa agrega complejidad sin necesidad. Antes de producción: auditorías móvil, accesibilidad, seguridad, rendimiento y licencias. No desplegar ni monetizar sin revisión.

## ADR-002 — Generador de oleadas comprobablemente viable (2026-10-26)
Se sustituye la dispersión aleatoria independiente por barreras con corredor. `planWave` es puro y acota la distancia entre centros de corredores consecutivos por la velocidad normal de la nave y el tiempo libre entre ventanas de colisión, descontando 70 ms y usando solo el 72 % del desplazamiento disponible. Se evita cambiar violentamente de corredor a medida que suben velocidad, frecuencia y tamaño. La visualización Phaser es independiente de la planificación. Fuente artística: `src/games/neon-drift/DESIGN.md`. Como contrapartida el diseño evita barreras completamente independientes; posteriores patrones necesitarán demostrar de nuevo la accesibilidad temporal.


## ADR-003 — Patrones heterogéneos y barreras verticales (2026-10-26)
**Objetivo:** elevar la dificultad de entrada y reducir la obviedad de las rutas sin crear situaciones sin solución. Se conservan Phaser, el contrato modular y el generador puro existente en vez de introducir física externa.
**Decisión:** el planificador produce piezas con hitboxes explícitas (no solo dibujos); admite puertas, fragmentos, obstáculos geométricos y una barrera vertical una vez por cada nivel divisible entre 3. Los obstáculos nunca ocupan el corredor reservado. La ruta testigo usa separación entre ventanas de colisión y velocidad horizontal de 370 px/s con reserva temporal; el movimiento táctil respeta ese límite.
**Alternativas:** obstáculos libres sin restricciones (mayor variedad pero posibilidad de partidas matemáticamente imposibles); patrones prediseñados (fáciles de probar pero previsibles). Se elige generación aleatoria acotada, comprobable por pruebas deterministas.
**Riesgos:** un corredor viable en simulación puede ser perceptualmente injusto. Se requieren pruebas reales en Safari iOS y Chrome Android y telemetría voluntaria de fracasos antes de ajustar más.


## ADR-003 — Opciones múltiples y generación sin corredor prescrito (2026-10-26)
El planificador ahora muestrea un conjunto de aberturas antes de calcular su viabilidad. Mantiene intervalos de posiciones horizontalmente seguras y propagación temporal de **todos** los intervalos alcanzables desde la oleada anterior. Se evita que una ruta fija dicte la ubicación del resto de los obstáculos. La cantidad de opciones se reduce estadísticamente al subir el nivel, sin forzar una única opción. La aparición recibe variación acotada para evitar ritmo de metrónomo. Los sprites muestran siluetas diferenciadas; conservan una caja de colisión visible y conservadora. Riesgo: la viabilidad matemática no prueba jugabilidad humana ni móvil.

## ADR-007 — Lumen Circuit: juego original de laberintos con objetivos (2026-10-26)
**Objetivo:** crear un tercer concepto arcade de exploración y persecución evitando copiar la expresión protegida de Pac-Man. **Decisión:** módulo separado en `src/games/lumen-circuit/`, con lógica pura (generación aleatoria por DFS+atajos, conectividad garantizada, terminales y cristales alcanzables, centinelas geométricos) y escena Phaser 3. Se amplía opcionalmente el contrato GameHandle con `setMove` de cuatro direcciones; Neon Drift conserva el contrato anterior. La página usa cruceta táctil específica del módulo y mantiene pausa/reinicio/sonido/récord.
**Alternativas consideradas:** clon de pasillos y puntos (descartado por similitud audiovisual y pobre diferenciación); motor físico top-down (innecesario para celdas); mapa artesanal único (menos rejugabilidad). **Riesgos:** IA de centinelas y ergonomía móvil aún sin validación humana; la originalidad visual requiere revisión legal antes de comercialización. Nombre provisional.

## ADR-008 — Temas regionales y sincronización de despliegue (2026-10-26)
**Problema:** una entrega en ZIP local no provocó despliegue y Vercel mantuvo la versión anterior. **Decisión:** GitHub sigue siendo la fuente de verdad: los cambios de Lumen Circuit se implementaron directamente en `feat/lumen-circuit-beta` y la preview de Vercel se construye desde ese commit. No usar un archivo local como señal de publicación.
**Diseño:** tipo `PowerWorld` en lógica pura contiene identificador, nombre ficticio de generadora, región, conexión extra de laberinto, cadencia mínima/inicial de apagones y número de fragmentos. El renderer asigna paletas claras y distingue rayo eléctrico, generadoras y pozos oscuros mediante formas, no solo colores. `worldForLevel` rota cuatro ambientes; `blackoutDelay` acota velocidad.
**Alternativas:** assets fotográficos de centrales reales (rechazados por sobrecarga y derechos); físicas 3D de agujeros negros (innecesarias para rendimiento móvil).
**Riesgos:** la conexión entre tema visual y dificultad está parametrizada, pero el balance y la percepción no están comprobados con jugadores; topónimos son referencias creativas, no identificación de instalaciones.

## ADR-009 — Nodo de sobrecarga aleatoria (2026-10-27)
**Objetivo:** dar consecuencias significativas y variadas al gran nodo eléctrico sin alterar el propósito principal de activar tres generadoras. **Decisión:** aislar reglas puras en `lumen-circuit/logic.ts`: `choosePowerKind`, `moveExplorer`, `tickPower`, `playerStepMs` y `enemyStepMs`; Phaser dibuja el gran nodo, el efecto activo y su contador. Se permiten cuatro eventos mutuamente excluyentes: turbo, invasión temporal de apagones, aceleración de enemigos y neutralización al contacto. Efectos de 7 segundos con enfriamiento de 3,5 segundos; Phaser pausado congela la simulación. Los refuerzos están limitados a un total de seis agujeros negros y no aparecen sobre Lumen.
**Alternativas:** poderes acumulables (descartado por opacidad y desbalance), mejoras permanentes (pueden romper el reto progresivo), transformaciones de personaje/enemigo derivadas de otros juegos (descartadas por riesgo de semejanza). **Riesgos:** los resultados perjudiciales requieren claridad inmediata y ajustes por jugadores; sincronización de puntos por colisión enemiga requiere prueba real.

## ADR-010 — Coleccionables, bonificaciones temporizadas y tubos compartidos (2026-10-27)
**Decisión:** separar `smallPoints` (1 punto y vida por 200 acumulados), `shards` (medios, 10 puntos y carga), y `powerNode` (grande, cero puntos, requisito para completar cada mundo normal). `powerCollected` limita a una recogida obligatoria por mundo; antes se regeneraba sin fin y por ello no podía ser un objetivo de finalización. El progreso de pequeños se transfiere a `newCircuit` al avanzar de nivel.
**Bonificaciones:** tabla explícita `BONUS_LEVELS` para la serie solicitada 3/9/15/21/27/36/45/54/63, prolongada cada nueve mundos después de 63. Laberinto de interior abierto, sin apagones, 90 s de tiempo activo, terminar al recoger todas las luces; gran nodo con Turbo garantizado para no introducir penalizaciones en el nivel de respiro.
**Túneles:** se tallan dos extremos de una fila en mundos alternos, `adjacent` y `distanceMap` aceptan `tunnelRows`. El jugador y los agujeros negros atraviesan idénticos enlaces; IA de persecución usa la distancia real por grafo, no la distancia Manhattan que falla al envolver los bordes.
**Dificultad:** enemigos fijos `2 + floor(level/4)` en mundos normales y cero en bonificaciones, con tope técnico de 24. El extra temporal se contabiliza dentro del mismo tope. El número puede afectar rendimiento y justicia en mundos muy altos y debe ser medido antes de publicación.
**Alternativas descartadas:** dar vidas según puntuación total habría permitido obtenerlas con combinaciones/absorción y no recompensaría las luces pequeñas; hacer todos los niveles contrarreloj frustraría; envolver automáticamente todos los bordes ocultaría la señal visual del túnel.

## ADR-011 — Generación sin encierros y fuga condicionada al peligro (2026-10-27)
**Objetivo:** eliminar encerronas imposibles sin facilitar las persecuciones ni transformar el juego en un campo abierto.
**Decisión:** incorporar `blindAlleys` y `repairBlindAlleys` a `src/games/lumen-circuit/logic.ts`. Tras tallar el laberinto y los tubos, se conectan **paredes candidatas adyacentes a dos pasillos**, solo cuando una casilla transitable tiene menos de dos vecinos accesibles. Este cierre local de bucles preserva la estructura y garantiza grado de salida mínimo 2; la verificación de conectividad sigue usando BFS sobre el grafo con tubos.
En mundos normales desde el nivel 4, una emboscada ocasional sitúa un apagón directamente frente al inicio de esquina. Si ocurre, `openCornerEscape` añade un enlace **de izquierda a derecha en la fila del inicio** y mantiene salida hacia el interior. La distancia de los perseguidores usa el mismo grafo; no se reduce el daño, número de enemigos ni velocidad. `ambushStart` permite avisar sin una guía intrusiva.
**Alternativas:** eliminar perseguidores iniciales (rechazado por facilitar el reto), regenerar todo mapa aleatorio sin callejón (coste variable), abrir toda la cuadrícula (destruiría el laberinto), teletransporte exclusivo del jugador (injusto para la IA). **Riesgos:** quitar todos los callejones puede reducir tácticas de esconderse; validar diversión con jugadores. La ausencia de grado 1 no garantiza que toda decisión bajo persecución sea salvable: es una propiedad topológica, no predictiva del movimiento dinámico.
