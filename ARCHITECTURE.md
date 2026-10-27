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
