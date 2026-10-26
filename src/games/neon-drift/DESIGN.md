# Neon Drift — Identidad, balance y continuidad

Fuente: `Neon_Drift_Documentacion_Audiovisual.pptx`, guía audiovisual v1.0 facilitada el 2026-10-26. Esta especificación textual conserva las reglas visuales; el archivo PPTX original no está versionado en el repositorio.

## Dirección de arte implementada
- Fondo #0A0A12, acentos cian #00F0FF, magenta #FF00AA y violeta #A020F0.
- Nave triangular oscura con cabina cian brillante, bordes de neón y propulsión animada. Vista superior simplificada para el juego vertical; no usa sprites externos.
- Obstáculos geométricos con estilos alternos, paneles con grietas y bordes neón. Se dibujan por Phaser, no se incluye material de terceros.
- Estrellas en parallax ligero, líneas de velocidad a partir del nivel 3, chispas near-miss, flash de colisión.
- Marcadores de nivel, puntuación y cuenta regresiva al siguiente nivel, sin cubrir el centro de juego.
- Audio sintetizado breve al subir de nivel, en near-miss y colisión. Puede silenciarse en la barra del portal.

## Reglas de dificultad — implementación 0.2.0
- Cada siete segundos de **tiempo activo de juego** se avanza un nivel. La pausa detiene el reloj; reiniciar vuelve a nivel 1.
- La velocidad media de las barreras aumenta de 195 hasta un máximo de 470 unidades virtuales/segundo. Pequeñas variaciones individuales (+/- 6%).
- El intervalo entre barreras disminuye de 1100 ms hasta un mínimo de 430 ms.
- Los tamaños varían: altura entre 22-48 píxeles, y corredor libre variable de 68 a 130 píxeles (más ancho al inicio).
- Cada barrera es una pared con una abertura. El generador mantiene un **testigo de ruta viable**: para cada par de barreras, limita el desplazamiento horizontal del centro del corredor a menos del 72 % del recorrido disponible a velocidad normal de la nave, descontando sus ventanas de colisión y 70 ms de margen.
- La hitbox de la nave se modela como 32x34 píxeles y siempre dispone de al menos 9 píxeles de margen a cada lado de la abertura. La seguridad implica existencia de una trayectoria de juego con reacciones a tiempo, no que la nave pueda permanecer inmóvil ni inmunidad a errores del jugador.
- El planificador es puro y testeable; 120 sesiones simuladas de 10 minutos con semillas deterministas verificaron 156.000 barreras sin romper el corredor ni la velocidad de desplazamiento.

## Etapas posteriores indicadas por la guía
Pendientes de diseño de juego y UX (no simular como funciones activas): Hyperdrift/Boost, multiplicador de puntos/combo, HUD de distancia/ranking, música synthwave por capas y variedad de siluetas más elaboradas. Priorizar ajustes del control táctil y pruebas en dispositivos antes de agregarlos.

## Riesgos
- La validación matemática usa modelo discreto de barreras y testigo en el centro del corredor. Hacen falta pruebas reales para confirmar visibilidad, latencia, sensibilidad táctil, fps y niveles muy altos.
- La colisión utiliza una caja rectangular conservadora para la nave; efectos de propulsión no causan impacto.
