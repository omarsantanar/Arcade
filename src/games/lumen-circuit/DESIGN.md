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
