# Pulse Core — Design brief / beta de concepto

Fecha: 2026-10-26 · Estado: prototipo experimental, no juego final.

## Propuesta
Rompecabezas circular de presión ascendente. Su parentesco con los juegos clásicos de piezas que se acumulan es la necesidad de gestionar un espacio finito y reaccionar con rapidez; **no usa piezas de cuatro cuadrados, cuadrícula ortogonal, caída de tetrominós ni borrado de líneas**.

**Promesa:** «Gira. Conecta. Libera el reactor».

## Mecánica central
- Tres anillos concéntricos con ocho sectores cada uno. Cada sector admite una ficha de frecuencia (cian, magenta o violeta), reconocible también como círculo, rombo o triángulo.
- En cada pulso, las fichas avanzan un anillo hacia el núcleo si el hueco está libre. Aparece una nueva ficha en un hueco aleatorio del anillo exterior.
- El jugador selecciona un anillo tocándolo y lo gira mediante arrastre horizontal o botones; con teclado, ↑/↓ selecciona y ←/→ gira.
- Tres fichas iguales alineadas entre los tres anillos o en un arco de tres sectores contiguos se descargan, generan puntos y liberan espacio.
- Tres pulsos bloqueados por saturación del anillo exterior terminan la partida. Una descarga reduce un aviso de saturación.
- La velocidad de llegada aumenta cada 16 segundos, con variación moderada entre pulsos (evita un metrónomo rígido).
- Pausa, reinicio, marcador local y silencio siguen el contrato común de Arcade.

## Diferenciación deliberada
- Tablero circular; la acción primaria es girar anillos completos, no desplazar/rotar piezas que caen.
- Liberación por conexiones eléctricas radiales y arcos; jamás por completar filas.
- Movimiento progresivo de cada ficha hacia el centro, no gravedad de piezas tetrimino.
- Tres colores y tres símbolos redundantes para accesibilidad.
- Visual: núcleo pulsante y trazas de energía; identidad propia de sci-fi abstracto, sin copiar personajes, nomenclaturas, sonidos o assets comerciales.

## Validación de la beta
Medir: tiempo medio de la primera descarga, sesiones completadas, claridad de selección táctil, tasa de fallos por saturación, FPS de teléfonos de gama media y si el jugador comprende la regla en 15 segundos sin manual.

## Límites del prototipo
No hay tutorial interactivo, composición musical ni modos competitivos. El audio sintetizado está sujeto a permisos del navegador. No afirmar exclusividad legal del concepto; realizar revisión de similitud antes de marca o publicación comercial.

## Criterio de aceptación inicial
Se puede abrir desde el catálogo sin afectar Neon Drift, girar anillos con teclado y móvil, puntuar por descargas, subir velocidad, pausar, reiniciar y guardar récord. Vitest y Vite deben finalizar correctamente; luego pruebas reales iOS/Android.

## 2026-10-26 — Guía integrada de iniciación (versión 0.1.1)
La limitación «No hay tutorial interactivo» queda superada parcialmente: se añade un **tutorial visual guiado de tres pantallas**, no una simulación interactiva de práctica. Aparece automáticamente al abrir el título por primera vez, pausa el juego y puede consultarse de nuevo mediante el botón «?» sin reiniciar. Se guarda localmente el indicador de guía vista bajo `arcade:pulse-core:guide-v1`.

Pantalla 1: identificar anillo activo (contorno cian) y girarlo con arrastre/botones o teclado. Pantalla 2: comparar descarga **radial** (mismo sector a través de los tres anillos) y **arco** (tres sectores consecutivos en un mismo anillo), aclarando que cada frecuencia tiene un símbolo y color. Pantalla 3: explicar pulsos, desplazamiento hacia el centro, saturación y condición de fin de partida.

Criterios UX: lenguaje breve, botones grandes, alto contraste, lectura en móvil sin panel lateral, control mediante teclado y posibilidad de volver a abrir la ayuda. La apertura congela la partida cuando estaba activa; al cerrarla, reanuda solo si antes estaba jugando. Las reglas y la dificultad no cambian. Falta prueba manual con usuarios nuevos y en Safari iOS/Chrome Android.
