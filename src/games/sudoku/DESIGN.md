# Sudoku — diseño de beta (2026-10-27)

## Estado
Módulo experimental en `feat/sudoku-speed-challenge`; título visible: **Sudoku** (denominación descriptiva, no reivindicamos exclusividad). Código propio y tableros procedurales. No fusionar sin pruebas humanas y revisión de marcas para mercados de destino.

## Reglas y enseñanza
Sudoku 4×4 introductorio en tres niveles: nivel 1 enseña filas, 2 enseña columnas, 3 enseña bloques 2×2. Cada uno dispone de explicación dentro de la partida y botón **Ver opciones** para observar números candidatos válidos. Se mantienen 12, 10 y 8 pistas objetivo, respectivamente, con solución única.

Desde el nivel 4 se convierte de golpe en Sudoku clásico 9×9, con filas, columnas y bloques 3×3, sin botón de ayuda. Objetivos de pistas progresivos: nivel 4 = 40; 5 = 35; 6 = 30; 7 = 27; 8 = 25; 9 = 23; 10+ = 22. El número final puede ser **mayor** si reducirlo generaría más de una solución. Los tableros se regeneran localmente mediante permutaciones legales de una solución base y eliminación aleatoria con verificación por un solver MRV; no usan puzzles de editoriales o paquetes externos.

## Evaluación por velocidad
El tiempo se cuenta solo mientras se juega; la pausa detiene el contador. La **calidad no penaliza errores, pistas utilizadas ni cantidad de movimientos**: depende únicamente del tiempo activo para terminar el tablero, normalizado por un tiempo de referencia de ese nivel. Clasificación: RELÁMPAGO (5 estrellas, <= 65 % del objetivo), ORO (4, <=100 %), PLATA (3, <=150 %), BRONCE (2, <=225 %) y COMPLETADO (1). Puntos por velocidad calculados desde tiempo relativo, con factor nivel; récord de tiempo por nivel y mejor puntuación total separados localmente. El jugador progresa cuando llena correctamente toda la cuadrícula.

## Experiencia móvil/teclado
Tablero responsive, pistas fijas distinguibles, números editables, fila/columna/bloque resaltados, números repetidos señalados sin revelar solución, teclado 1–9 o 1–4 según fase, borrado y flechas del teclado. Controles comunes Arcade de Pausa, Reiniciar, Sonido (puzzle silencioso) y Pantalla completa. Guardado automático local de partida actual, tiempo y mejores marcas, sujeto a disponibilidad de localStorage.

## Propiedad intelectual: análisis preliminar
Las ideas y métodos de un videojuego, incluido llenar Sudoku con cifras únicas por filas, columnas y bloques, no están sujetos al copyright de la misma forma que el código, gráficos o texto expresivo. U.S. Copyright Office: https://www.copyright.gov/register/tx-games.html
La editora Nikoli explica que el pasatiempo provino de **Number Place** y que **Sudoku es marca registrada de Nikoli en Japón**: https://www.nikoli.co.jp/en/puzzles/sudoku/ ; registro japonés por categorías: https://www.nikoli.co.jp/ja/copyright/
En República Dominicana la ONAPI distingue marcas y nombres comerciales: https://onapi.gob.do/index.php/signos-distintivos/marcas-y-nombres

**Conclusión acotada:** se puede desarrollar un juego original sobre el método general, pero no garantizar el uso internacional del nombre o una marca exclusiva «Sudoku». Mantener título descriptivo en beta y revisar disponibilidad de marca, clase y territorio (especialmente Japón) antes de difusión comercial. No copiar ilustraciones, descripciones ni tableros de Nikoli u otros editores.

## Riesgos / próximos pasos
- Resolver manualmente niveles 1–5 con jugadores nuevos y comprobar que las instrucciones sean claras.
- Medir generación de puzzles en dispositivos de gama media; la unicidad tiene un límite conservador de búsqueda.
- Confirmar que el salto a nivel 4 resulte retador pero no desalentador.
- Validar ergonomía, contraste de cuadrículas y rendimiento del cronómetro en iOS/Android.
- Comprobar viabilidad marcaria fuera de la beta; sin monetización por ahora.
