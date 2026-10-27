# Lumen Circuit — Documento de juego (beta original)

**Fecha:** 2026-10-26. **Estado:** prototipo original de evaluación; nombre provisional sujeto a revisión de marcas.

## Premisa
Explorador de energía de forma romboidal en circuitos electrónicos. El objetivo se entiende en tres acciones: **recoge cristales, alimenta tres nodos, busca la salida**. Los nodos se iluminan al activar, la salida se abre únicamente al encender los tres. Los mapas se generan mediante profundidad aleatorizada y conexiones adicionales: no se reproduce ningún tablero de otra franquicia.

## Mecánica
- Tablero de 15 × 19 celdas, corredores conectados y variación de laberintos por semilla; cada mapa incluye una salida, tres terminales separados, al menos seis fragmentos de energía y dos o más centinelas eléctricos.
- Cada cristal recogido suma 15 puntos y una carga portátil. Se activan terminales triangulares al llegar con al menos dos cargas, consumiéndolas y ganando 200 puntos; la salida solo funciona con los tres terminales activos.
- Superar un circuito agrega puntos y crea un mapa distinto con más peligro. Empieza con tres vidas. Las colisiones con centinelas quitan una vida y hay invulnerabilidad temporal para permitir escapar.
- Centinelas abstractos angulares realizan patrullas locales y persiguen cuando están próximos. A partir de ciertos niveles hay más drones (máximo cuatro) y se acelera su cadencia.
- Puntuación máxima guardada localmente. La pausa, reinicio y sonido reutilizan el contrato del portal.

## Controles
- Móviles: cruceta visible en cuatro direcciones. También tocar/deslizar dentro del tablero para desplazarse en la dirección del gesto.
- Computadoras: flechas o WASD.
- Accesibilidad: fichas romboidales, cristales en cruz, terminales cuadrados con triángulo, salida como puerta, centinelas geométricos; contraste independiente del color. Las pruebas con lector de pantalla siguen pendientes.

## Diferenciación respecto de Pac-Man
No existe personaje circular con boca, fantasmas ni sus siluetas, mapa clásico, pastillas circulares, súper pastillas, reproducción de sonidos/música, nombres, logos, colores de personajes o secuencia de recogida completa para ganar. La progresión es por **objetivos de energía y escape**, con rutas y ubicaciones procedimentales.

La mecánica abstracta de navegar un laberinto mientras se esquivan adversarios puede inspirar juegos originales; esta propuesta **no implica garantía legal de ausencia de infracción**. Antes de comercializar:
1. Verificar y registrar el nombre elegido; `Lumen Circuit` es provisional.
2. Revisar globalmente parecidos de expresión audiovisual/trade dress, mapas, personajes y efectos.
3. Asegurar titularidad/licencias de assets y música (la beta usa gráficos procedurales y sonido sintetizado).
4. Obtener asesoría local de propiedad intelectual si se lanzará comercialmente.

**Fuentes consultadas (2026-10-26):**
- U.S. Copyright Office: https://www.copyright.gov/register/tx-games.html — distinción entre reglas de juego y expresión artística.
- Bandai Namco: https://bandainamcomobile.com/copyright/ — derechos reivindicados sobre franquicia Pac-Man.
- República Dominicana: Ley 424-06, art. 36 (modifica Ley 65-00, arts. 21 y 25): https://www.senado.gov.do/masterlex/MLX/docs/1C/2/11/18/799.htm.

## Pruebas / pendientes
- Vitest: generación conectada, objetivos alcanzables, esquivas, colisiones, drones válidos, aleatoriedad.
- GitHub CI: TypeScript, test, compilación Vite; se comprueba tras abrir PR.
- Pendiente: navegador real Safari iOS/Chrome Android, control táctil sostenido, tiempos de reacción, velocidad, legibilidad y UX en dispositivos físicos.

## Riesgos
El comportamiento de centinelas puede producir emboscadas y el escalado debe ajustarse con pruebas humanas. Navegación táctil por gesto y D-pad requieren verificación en pantallas pequeñas. El nombre es provisional y no está autorizado como marca registrada.

## 2026-10-27 — Mecánica de alta tensión: nodo mayor aleatorio
Esta sección sustituye cualquier descripción antigua del protagonista romboidal y de los centinelas. **Lumen es un rayo**, los adversarios son **apagones como agujeros negros** y los objetivos son las tres generadoras de cada mundo. El **nodo especial** es un gran círculo dorado con un rayo central; es distinto de los cristales pequeños y de las instalaciones eléctricas que se deben encender.

Al tocar el nodo especial, **se sortea exactamente un efecto**, que dura siete segundos de partida activa (la pausa congela el reloj). Cada aparición tiene cuatro resultados con probabilidad uniforme: (1) Turbo eléctrico: Lumen se desplaza más rápido; (2) Invasión: aparece uno o dos apagones extra según el nivel, con máximo global de seis perseguidores; (3) Apagones acelerados: los enemigos se mueven más rápido; (4) Campo de absorción: al entrar en contacto con un agujero negro, este queda neutralizado y el jugador obtiene 120 puntos, sin perder una vida. No se pueden acumular dos poderes a la vez. Tras expirar, hay una espera de 3,5 segundos antes de que aparezca el siguiente nodo en una casilla transitable libre, separada de objetivos y perseguidores. Los apagones adicionales desaparecen al finalizar la invasión.

Se prioriza la claridad gráfica: círculo especial con rayo y brillo, estado textual del efecto en el HUD y cuenta atrás visible. En los niveles avanzados se mantienen los mundos temáticos con topologías/velocidades de persecución distintas; el nodo no desbloquea la salida ni sustituye encender las tres generadoras.

**Diferenciación jurídica:** esta es una mecánica aleatoria propia de electricidad, con beneficios y penalizaciones, no una reproducción de las reglas ni la expresión audiovisual de ninguna franquicia. Evitar personajes o sonidos licenciados. La aparición de absorción no cambia al personaje en una boca animada ni transforma a los agujeros negros en fantasmas.

**Pruebas automáticas:** aparición alcanzable y sin solapamientos, reparto de cuatro clases mediante RNG controlable, un efecto por vez, expiración y reaparición, límites de aparición, aceleración y absorción. **Pendiente:** prueba manual del contraste y legibilidad en celular, ritmo de sorpresa, equilibrio en mundos avanzados y revisión de propiedad intelectual antes de comercializar.

## 2026-10-27 — Sistema de tres tamaños y niveles de respiro
**Puntos pequeños:** luces blancas diminutas de un punto de marcador. Se contabilizan entre mundos en `smallCollected`; cada 200 recogidas suma una vida adicional, incluso si se cruza el umbral después de cambiar de mundo. **Puntos medios:** chispas de tamaño intermedio que dan 10 puntos y una carga eléctrica para encender generadoras (dos por generadora). **Puntos grandes:** un nodo dorado de alta tensión que activa exactamente un buff/debuff aleatorio durante siete segundos, **sin conceder puntos por recogerlo**. Debe recogerse antes de abrir el portal del nivel normal, además de activar las tres generadoras. A diferencia de la primera beta, una vez obtenido **no reaparece en ese nivel**, porque es un objetivo obligatorio ya cumplido.

**Mundos bonificación contrarreloj:** niveles 3, 9, 15, 21, 27, 36, 45, 54, 63 y luego 72, 81, 90… (cada nueve después de 63); son tableros despejados sin agujeros negros, con 90 segundos para recolectar **todos** los puntos (diez pequeños, cuatro medianos y un grande). Al recolectar el último se avanza directamente, sin necesidad de activar las tres generadoras ni atravesar un portal. El punto grande del bono concede Turbo (beneficio seguro), para mantener el mundo fácil. Si vence el reloj, termina la partida de esa sesión.

**Tuberías laterales:** en algunos laberintos (nivel 2, 5, 8, 11… salvo bonificaciones), hay una fila con una abertura visible a cada lado. Salir por la izquierda conduce al borde derecho, y viceversa. El movimiento de apagones reconoce el mismo atajo; su IA calcula distancias reales por pasillos y tuberías para evitar ignorar estos enlaces.

**Escalado de agujeros negros:** comienza con dos; niveles 4–7 tienen tres; niveles 8–11, cuatro; niveles 12–15, cinco; niveles 16–19, seis… La función `baseBlackoutsAt` añade uno cada cuatro niveles ordinarios. Los niveles contrarreloj carecen de enemigos por decisión de dificultad. Los refuerzos temporales de los nodos grandes respetan un límite técnico de 24 enemigos simultáneos para preservar rendimiento móvil; los niveles avanzados requieren balance humano.

**Validación:** tests de vida extra acumulada, conteo, puntos medios, nodo obligatorio, contrarreloj, recorridos abiertos, túneles para jugador/IA y aparición escalonada. Pendiente validar en móviles los contrastes de tres tamaños, cronómetro y niveles con más de diez enemigos.
