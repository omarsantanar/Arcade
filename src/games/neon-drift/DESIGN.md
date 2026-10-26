# Neon Drift — Identidad, balance y continuidad

## Reglas v0.3.0 — desafío desde el inicio
- El tiempo activo sigue escalando niveles cada 7 segundos (pausa no cuenta).
- Nivel 1: velocidad base 250 px/s, intervalos 900 ms y abertura de 79–98 px; a partir de allí escala con límites superiores. Nave 32×34 y velocidad horizontal real 370 px/s.
- Las oleadas alternan puertas continuas, campos de fragmentos y patrones dispersos. Los fragmentos usan cinco motivos visuales (meteoritos, cristales, prismas, astillas y anillos) y pequeñas aberturas engañosas; sus cajas de colisión son visibles y conservadoras.
- En el nivel 3 y cada tercer nivel posterior (6, 9, 12…) se genera exactamente una oleada especial de **pilares verticales**, con altura real aproximada 160–258 px, que bloquean una zona durante más tiempo.
- Todas las figuras quedan fuera de un corredor reservado al jugador. El planificador limita la distancia entre centros según las ventanas de colisión, descontando 70 ms y utilizando solo el 76 % del desplazamiento físico disponible. El corredor no tiene por qué estar en el centro ni ser obvio, pero sí es realizable.
- El arrastre táctil ahora se mueve como la nave de teclado, limitado a 370 px/s; no teletransporta la nave hasta el punto tocado.
- Simulación local con Node: 100 partidas de 10 min, 131.200 oleadas, 2.800 barreras verticales, sin contradicciones geométricas ni saltos imposibles para los centros de corredor.
- Pendientes: test Vitest/build de GitHub Actions, experiencia real en móvil, ajuste de percepción de dificultad y falsos huecos. La prueba geométrica no demuestra una reacción humana suficiente.


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


## v0.4.0 — Generación multirruta y variación de encuentros (2026-10-26)
- La dificultad sigue subiendo cada 7 segundos, pero ya no se genera una sola salida obligatoria.
- Niveles 1 y 2: dos o tres aberturas por oleada; niveles 3 a 5: entre una y tres; niveles 6 a 8: una o dos; niveles 9+: mayormente una, ocasionalmente dos.
- Se generan primero posiciones, anchuras y familias de obstáculos al azar; después se calculan **todas** las soluciones físicamente alcanzables. Si una propuesta no tiene solución, se reintenta; al agotar intentos se abre un paso de seguridad y se verifica de nuevo.
- Apariciones separadas por 76-133% del tiempo base, con seis siluetas (pilar en niveles especiales).
- Patrones: gate, scatter, fragment-field, islands y vertical. Bloqueo vertical excepcional en niveles 3, 6, 9, etc.
- No equivale a promesa de reacción humana: verificar legibilidad y control móvil con jugadores reales.
