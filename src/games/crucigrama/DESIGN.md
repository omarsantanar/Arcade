# Crucigrama Dominicano — diseño editorial y técnico
Fecha de inicio: 2026-10-27. Estado: prototipo original en rama `feat/crucigrama-dominicano`, PR #6, basado en catálogo integrado de Arcade.

## Idea y alcance
Juego de crucigramas de **15 × 15 casillas**, generado proceduralmente con palabras cruzadas reales y numeración horizontal/vertical. El jugador elige entre un tablero de **todo el país** o una de ocho áreas: dominicanismos, historia y figuras, geografía y regiones, cultura y tradiciones, gastronomía, música, deportes y naturaleza. La primera base tiene alrededor de **150 entradas** con pistas redactadas expresamente para el juego. Un tablero emplea un subconjunto cruzable, no intenta exhibir todas las palabras a la vez.

## Fuentes y metodología
**Referencia lexical primaria:** `Diccionario del español dominicano` (segunda edición, 2024, Academia Dominicana de la Lengua e Igalex), con edición en línea y actualizaciones trimestrales, incluidas las anunciadas en octubre de 2026: https://ded.igalex.org/Consultas/Index y https://fundeu.do/el-igalex-anuncia-una-nueva-actualizacion-del-diccionario-del-espanol-dominicano/

**Vocablos comprobados individualmente** en el Diccionario de americanismos (ASALE): guagua, concho, chinola, yipeta, concón. Enlace de cada entrada en `src/games/crucigrama/bank.ts`. El DED es un marco de referencia editorial, **no** se atribuye a esa obra la validación individual de cada término del banco.

**Patrimonio cultural comprobado:** UNESCO para merengue (2016), bachata (2019), tradición cocola/Guloyas, Congos de Villa Mella y casabe (2024). Fuentes: https://ich.unesco.org/es/estado/republica-DOminicana-DO?info=elementos-en-las-listas , https://ich.unesco.org/es/RL/la-msica-y-el-baile-del-merengue-en-la-repblica-dominicana-01162 , https://ich.unesco.org/es/RL/musica-y-baile-de-la-bachata-dominicana-01514 , https://ich.unesco.org/es/RL/cocolo-dance-drama-tradition-00104

**Resto del banco:** selección cultural y geográfica editorial, pendiente de una ronda de comprobación individual contra fuentes especializadas. No se debe anunciar como «todas las palabras proceden del DED». Las pistas son formulaciones originales, no reproducciones ni transcripciones de entradas protegidas. Para ampliaciones masivas mediante contenido del DED/ASALE, solicitar permiso o licencia antes de importar corpus, definiciones, ejemplos y metadatos; citar no concede derecho a replicar el diccionario.

## Reglas
Cada partida genera combinaciones de palabras entrecruzadas, con casillas negras para separar huecos y numeración coincidente entre dos orientaciones que comparten punto de inicio. Al elegir pista o casilla, la palabra se resalta; si una casilla participa en dos respuestas, un segundo toque permite cambiar la orientación. La entrada acepta letras A–Z y Ñ; tildes se omiten para simplificar el tablero, pero **Ñ nunca se sustituye por N**. Teclado táctil completo con borrado y apoyo de teclado físico (flechas para cambiar de casilla).

El botón «Revisar letras» señala errores sin revelar respuestas; «Revelar una letra» descubre una letra y cuenta como ayuda. Cronómetro de partida activa, pausa y reinicio desde la barra de Arcade. Puntuación orientativa: base por cantidad de palabras, descuento por tiempo y ayuda; la victoria exige completar todas las intersecciones. Se guarda la partida y la mejor puntuación de cada tema en localStorage, sin login ni servidor.

## Arquitectura
- `bank.ts`: banco estructurado, áreas temáticas, fuentes individuales y normalización en español.
- `logic.ts`: RNG reproducible, selección por tema, inserción únicamente en cruces válidos con límites de adyacencia, asignación de números y verificación de solución.
- `CrosswordGame.tsx`: React, navegación, teclado virtual, pistas, temporizador y guardado.
- `Crossword.ts`: adaptador a `GameFactory`; evita inicializar Phaser para un rompecabezas de letras.
- `logic.test.ts`: riqueza y originalidad de pistas, categorías, Ñ, generador de cruces, semillas, solución y partida guardada.

## Riesgos y siguiente iteración
1. **Integridad editorial:** comprobar manualmente cada pista y su matiz regional antes de comercializar. Evitar voces ofensivas, sesgos, datos ambiguos y pistas que incluyan respuesta.
2. **Cobertura:** ampliar por curaduría documentada hasta varios centenares o miles de pistas; mantener historial de aprobación de cada fuente.
3. **Variedad/dificultad:** medir densidad, número de palabras y calidad de tableros por categoría; introducir niveles y crucigrama diario con semilla estable si los usuarios lo solicitan.
4. **Interfaz:** evaluar lectura de 15 × 15 casillas en teléfonos pequeños, especialmente iOS, lectores de pantalla y teclado nativo.
5. **Derechos:** no automatizar copiado de lexicones sin comprobar condiciones de reutilización y autorización.

## 2026-10-27 — Nueva edición en español para varios países
Este juego deja de llevar «Dominicano/a» en su título público. Conserva su identidad técnica e historial de desarrollo (ruta/ID internos) para que los usuarios mantengan sus partidas antiguas. La pantalla ofrece **Todo el mundo hispanohablante** o uno de 14 países/territorios (incluido Puerto Rico). Al elegir uno, los tableros contienen solo palabras **asociadas editorialmente al país** seleccionado; la asociación no implica uso exclusivo de esa palabra. La elección de tema aparece solo cuando hay vocabulario suficiente para un buen reto.

La colección compartida se amplía mediante `src/games/crucigrama/countries.ts` con 240 términos culturales originales, además del material inicial de RD. El contenido incluye historia, léxico, ciudades, tradiciones, gastronomía, música, deportes y naturaleza. Las partidas siguen siendo reproducibles por semilla, y los récords usan una clave diferenciada por país. Los guardados antiguos sin código de país se restauran como «República Dominicana».

**Control editorial:** contrastar cada propuesta contra fuentes fidedignas del territorio antes del lanzamiento comercial. Para español de América, ASALE (https://www.asale.org/obras-academicas/diccionarios/diccionario-de-americanismos) explica distribución regional del léxico; para RD, DED permanece como referencia. No copiar definiciones ni presentar automáticamente las nuevas 240 pistas como verificadas por academias. El código superó 78/78 pruebas en CI 40583190074; Vercel sigue bloqueado por cuota; requiere prueba táctil real y revisión de vocabulario antes de merge.
