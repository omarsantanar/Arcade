# Sopa de Letras Dominicana — diseño editorial y reglas
Fecha: 2026-10-27. Quinto juego independiente de Arcade. Rama: `feat/sopa-letras-dominicana`.

## Propuesta
Encontrar palabras del español dominicano, personajes de la historia, localidades, tradiciones, deportes, naturaleza, géneros musicales y gastronomía en cuadrículas aleatorias. Reutiliza **el mismo banco original de 150 entradas de Crucigrama Dominicano**, con un único archivo fuente: `../crucigrama/bank.ts`. No se duplica ni extrae automáticamente la obra lexicográfica de terceros.

## Referencias y cuidado editorial
El **Diccionario del español dominicano** de Academia Dominicana de la Lengua / Igalex sirve de referencia lexicográfica (https://ded.igalex.org/Consultas/Index). Se complementa con entradas individuales del **Diccionario de americanismos** de ASALE y publicaciones de UNESCO sobre patrimonio musical/cultural, enlazadas por término en `bank.ts`. La base combina voces locales con nombres propios y referencias generales de RD; **no se afirma que las 150 entradas figuren en el diccionario**. Las pistas para orientar al jugador son redactadas originalmente, no copiadas de definiciones protegidas. Para crecer mediante importaciones de corpus ajenos, revisar licencias y autorización primero.

## Modos y juego
Ocho áreas: dominicanismos, historia y personajes, geografía, cultura, gastronomía, música, deportes y naturaleza. Modo «Todo el país» distribuye palabras rotando categorías. Cada partida usa semilla aleatoria, cuadrícula y palabras generadas en el navegador:
- **Inicial**: 10×10, siete respuestas, orientación derecha/abajo y dos diagonales hacia abajo.
- **Intermedio**: 13×13, diez respuestas, incorpora dos direcciones inversas.
- **Experto**: 15×15, trece respuestas, cualquiera de las ocho direcciones, incluidas reversas y diagonales ascendentes.
Se permite compartir letras iguales entre palabras; se descartan palabras duplicadas o contenidas unas en otras. El jugador encuentra una palabra mediante arrastre con mouse o dedo **o tocando sus extremos**; se acepta en ambas orientaciones. La Ñ es letra distinta de N y las tildes se omiten solo para ingresar los tableros.

## Experiencia
Lista de respuestas agrupada por tema, opción para expandir cada palabra y leer su pista cultural; resaltado al encontrar, seis colores, contador y barra de progreso. La ayuda localiza la primera letra de una respuesta aún pendiente. El reloj cuenta tiempo de juego activo y se congela en pausa; la puntuación aumenta por número de respuestas/dificultad y se reduce con tiempo, ayudas y errores. Guardado versionado de tema, nivel, semilla, palabras encontradas, tiempo, ayudas y errores, más mejor puntuación por combinación tema+dificultad en `localStorage`. No se requiere cuenta ni servidor.

## Implementación
- `logic.ts`: semilla de PRNG reproducible, elección equilibrada en mixto, inserción de rutas, relleno, detección de coincidencia, cómputo de resultados, puntuación y validación de guardados.
- `WordSearchGame.tsx`: interfaz React accesible, tablero responsive con eventos pointer/touch, ayudas, progreso, tiempo y puntuación.
- `WordSearch.ts`: adaptador GameFactory que no requiere Phaser.
- `logic.test.ts`: pruebas de generaciones, tamaños, materias, controles geométricos, inversión, soluciones, guardado y puntuación.

## Riesgos y aceptación
Generación y algoritmo testados automáticamente, pero se requiere sesión en teléfonos físicos para verificar arrastre diagonal y gestos rápidos; pruebas de teclado/lector de pantalla y una revisión editorial de las 150 pistas. El relleno pseudoaleatorio evita la mayoría de apariciones no previstas, pero puede producir coincidencias alternativas en situaciones excepcionales; mejorar el detector si usuarios lo reportan. No atribuir a DED verificación total ni copiar sus definiciones. No fusionar a producción hasta prueba UX.

## Mejora de accesibilidad implementada
El tablero se maneja también desde teclado físico: Tab para enfocar casillas, flechas para mover el foco, Enter o Espacio para marcar el inicio y el final. La guía inicial debe explicar también el modo de arrastre y la selección por dos toques. El código pasó 72/72 pruebas y compilación en CI 40580465036, aunque la interacción no ha sido probada con un lector de pantalla ni en móvil físico.
