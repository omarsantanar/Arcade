# Manejo RD — simulador educativo urbano, beta 0.1 (2026-10-30)

## Visión
**Manejo RD** es el sexto título de Arcade y el primer prototipo de simulación de conducción. Busca enseñar a un conductor que comienza a practicar a reconocer situaciones viales de República Dominicana mediante decisiones que tienen consecuencias visibles, sin convertir el juego en una evaluación oficial ni sustituir escuela, instructor o entrenamiento supervisado.

**Vehículo de referencia:** Toyota Corolla del año 2001, caja automática. El motor visual es un **sedán geométrico genérico** que evoca la forma de un automóvil compacto de principios de los años 2000. No se han usado logotipos, fotografías, diseños tridimensionales, planos ni activos de Toyota. **No se simulan curvas de potencia, distancias reales de frenada, radio exacto de giro, visibilidad del habitáculo ni geometría exacta del Corolla.** Para un simulador de vehículo real la segunda fase exige ficha técnica del mercado, medidas verificadas, pruebas de física y posiblemente licencias de marca para visuales. El manual Corolla 2001 muestra posiciones de transmisión P, R, N, D y bloqueo de salida de P con freno: https://manualzz.com/doc/53683127/toyota-2001-corolla-owner-s-manual .

## Recorrido jugable
- Duración máxima de **cinco minutos de conducción activa**, medidos a partir de la salida del puesto de estacionamiento, con trayecto completo de unos 2 km de longitud simulada.
- Escenario 2D **ficticio**, sin pretensión de representar una calle real de Santo Domingo ni rutas de cartografía oficial. Mapa reticular de calles interconectadas, manzanas con edificios y árboles, líneas de carril, paso peatonal, semáforos y tráfico de autobuses y automóviles.
- Destino seleccionado aleatoriamente entre biblioteca, mercado vecinal, parque, centro comunitario y otros servicios; recorridos alternativos conectados determinados por semilla.
- Inicio detenido, transmisión en P, cinturón desabrochado y espejos sin comprobar. El usuario abrocha el cinturón (C), revisa espejos (M), pisa el freno (S) y coloca D con G o la tecla táctil; señaliza salida a la izquierda, acelera W, gira A/D y frena S. R y N también están disponibles para ejercicios auxiliares, sin necesidad de pasar marchas manuales.
- En cada cruce hay una situación explicada y un registro de decisiones con penalizaciones educativas; se analiza el semáforo, señal PARE, paso peatonal, tráfico denso, escuela señalizada a 20 km/h y giro anunciado con al menos 50 m. Límite simulado general por señal de 40 km/h, no una afirmación de límite urbano universal.
- No hay tráfico real ni localización GPS, no se registran datos de terceros. La mejor nota de seguridad se guarda en localStorage; la misión puede terminar por llegada o tiempo. Los cinco títulos anteriores conservan su código y funcionamiento.

## Matriz jurídica — Ley 63-17 (consultada el 30 de octubre de 2026)
**Fuente oficial primaria:** INTRANT https://intrant.gob.do/transparencia/marco-legal/leyes/ y PDF https://intrant.gob.do/phocadownload/SobreNosotros/MarcoLegal/Leyes/MARCO%20LEGAL-LEY%2063-17%20SOBRE%20TRANSITO%2C%20TRANSPORTE%2C%20Y%20SEGURIDAD%20VIAL.pdf . Versión accesible por artículos para contraste: https://ley.do/leyes/2017/ley-063-2017/ (fuente de lectura no oficial).

| Artículo | Regla relevante | Decisión del simulador |
| --- | --- | --- |
| 133 y 134 | Acatar semáforos, detenerse en rojo y procurar no entrar con amarillo. | Se compara la fase del semáforo al entrar en la intersección; se descuenta por rojo/amarillo de alta velocidad. |
| 135 y 136 | Respetar señalización y prioridad del peatón. | Un cruce presenta peatones y permite esperar a que termine su fase. |
| 137, párrafos I–II | Bajo condiciones específicas, pueden permitirse ciertos giros con rojo, siempre cediendo paso y sin señal que lo prohíba. | Para simplificar, los semáforos del circuito **presentan prohibición expresa de virar con luz roja**, evitando enseñar que todo giro rojo está prohibido. No se codifican todas las excepciones; esto se explica al usuario. |
| 138 | Señal PARE implica detenerse completamente y continuar solo si es seguro. | Se exige parada sostenida de al menos 0,65 s como comprobación del motor didáctico, no como tiempo legal exigido. |
| 231, núm. 1 | Prohibición de conducir sin cinturón de seguridad. | La misión no permite iniciar marcha sin cinturón. |
| 235 | Señal de giro con 50 m de anticipación, reducción gradual y posición de carril pertinente. | Se exige activación de direccional correcta durante al menos 50 m recorridos antes del cruce; evalúa velocidad de giro. **No se comprueba todavía la posición exacta del carril.** |
| 241 | Inicio desde detención/estacionamiento únicamente con seguridad y revisión del entorno. | Comprobación de espejos y señalizar incorporación; los puntos ciegos no se reproducen físicamente. |
| 264 y 266 | Velocidad según señales y reducción en intersecciones o condiciones de riesgo. | Zonas simuladas con señales de 40 o 20 km/h, advertencia en cruces densos. |

**Nota normativa:** Los puntos del videojuego **no equivalen a multas, puntos reales de la licencia ni normas oficiales de evaluación**. Una regla física de juego (0,65 segundos parado) no debe confundirse con un requisito legal. Antes de comercializar un material de formación vial, exigir revisión por especialista legal, instructor acreditado y contraste con reglamentos vigentes, además de la propia ley.

## Diseño técnico y UX
- `logic.ts`: tipos para estado de coche, caja automática, cinturón/espejos/direccionales, ruta reproducible, física simplificada, 300 s, estados de luces, tránsito y puntaje; funciones puras testables.
- `DriverGame.tsx`: representación Canvas 2D de calles y autos, panel de velocidad/límite/selector, retroalimentación, teclado/táctil, pausa/reinicio, informe de infracciones.
- `Driver.ts`: adaptador al GameFactory común.
- `score.ts`: récord local.
- `logic.test.ts`: invariantes de ruta, intersecciones, fases semafóricas, maniobras, seguridad, transmisión, tiempo y puntuación.

## Lo que aún NO hace esta beta
No utiliza mapas reales ni modelos 3D, volante de dirección de grado simulación, sensores de espejo o ángulo muerto, peatones animados, IA vial completa, direccional automática real ni comportamiento preciso de tráfico dominicano. Los coches NPC siguen trayectorias esquemáticas. No se debe presentar como práctica suficiente para circular, prueba oficial, certificación o simulación de un Corolla real.

## Fases siguientes
1. Validar técnicamente CI y despliegue; jugar manualmente en Chrome móvil/Safari iOS/escritorio y comprobar maniobras, especialmente cambios de sentido al girar.
2. Construir circuito pedagógico por unidades: arrancar, carril y esquina, semáforo, PARE, prioridad y tránsito pesado. Feedback claro antes de penalización, telemetría local de maniobras.
3. Volante con ángulo y curva de dirección calibrable; caja automática funcional realista en D/R y marcha atrás de salida; distancia/frenada validadas y vehículo con dimensiones de ficha técnica.
4. Intersecciones de dos carriles y tráfico bidireccional, paso peatonal animado, vehículos pesados, lluvia y circulación mixta de motocicletas; comprobar juridicidad de cada situación.
5. Si se desea cartografía de RD, verificar licencias y condiciones de fuentes de datos antes de usarlas. Revisar también denominación e identidad visual con Toyota para distribución comercial.

## Riesgos
Señales simplificadas, modelado del rojo con limitaciones, posible comportamiento contraintuitivo de giro, dificultad de 2 km en cinco minutos, ausencia de comprobación física móvil y falta de aprobación de un instructor de tránsito. **No desplegar como contenido formativo validado sin ese proceso.**

## 2026-10-30 — Sustitución de la cámara aérea por vista desde la cabina
**Requisito del producto:** el juego debe verse desde el interior de un sedán de conducción a la izquierda (carreteras de RD circulan por la derecha), no desde una cámara superior. Las **flechas del teclado son los mandos principales**, y en teléfono se necesitan controles táctiles funcionales para cambio automático, direccionales, pedales y preparación de seguridad.

**Decisión implementada:** `cockpit.ts` dibuja en el Canvas 2D la perspectiva aproximada desde los ojos del conductor. La posición y orientación verdaderas del vehículo siguen almacenadas en `logic.ts` como coordenadas del plano, pero se transforman en el render mediante una **proyección de suelo 2.5D** (`projectDriverPoint`). La vista muestra parabrisas, pilares, espejo interior y lateral ilustrativos, calles con carriles y cruces vistos hacia adelante, edificios esquemáticos, tráfico en perspectiva, señales, mapa de ruta pequeño dentro del vehículo y un tablero con reloj de velocidad y selector. Un volante dibujado gira al sostener dirección. **No es una foto ni réplica fiel del interior de Corolla 2001**; es arte geométrico original.

**Mandos en computadora:** ↑ acelera, ↓ frena, ← gira izquierda, → gira derecha; WASD se conserva como alternativa. C cinturón, M espejos, Q/E direccionales, G para seleccionar D con freno, P para P, R para reversa, N para neutral. El manejador escucha keydown/keyup y pone a cero los mandos retenidos si se pausa o se pierde el foco para evitar que el carro siga acelerando.

**Mandos en celular:** botones visibles de cinturón, espejos, indicadores izquierdo/derecho, transmisión P/R/N/D, dirección a ambos lados, freno y acelerador. El freno deja una autorización para seleccionar marcha después de tocarlo, de forma que la persona pueda efectuar la maniobra sin teclado externo; se admite presión simultánea por multitouch. La pantalla permite desplazar el panel cuando la altura del teléfono es limitada. Los controles generales de pausa, reinicio y pantalla completa siguen en el shell común Arcade.

**Rendimiento:** la física se actualiza por tiempo transcurrido y la cabina se pinta a un máximo cercano a 30 fps; los tramos alejados del circuito se descartan antes de pintarse. Se elige este punto medio entre una escena 3D completa (más pesada y costosa de calibrar) y la cámara cenital anterior (no muestra lo que un conductor novel debe observar).

**Pruebas nuevas:** `cockpit.test.ts` comprueba proyección delantera, culling de obstáculos detrás, perspectiva izquierda/derecha, giro de cámara y mapeo de flechas/WASD. Requiere prueba visual real de la perspectiva, legibilidad de señales con distintos tamaños de pantalla, multitouch de dirección/freno y continuidad del recorrido de cinco minutos; los tests matemáticos no sustituyen esa validación.

## 2026-10-31 — Control mediante inclinación
Para el móvil, el jugador puede usar la inclinación lateral del aparato, imitando la acción de sostener un volante. La Web API `DeviceOrientationEvent` obtiene la orientación física con permiso explícito cuando corresponde; requiere HTTPS. En pantalla vertical se interpreta `gamma`; en horizontal, `beta` con ajuste del signo según el ángulo. Al pulsar «Activar inclinación», se solicita permiso si lo exige el navegador; después se pulsa «Centrar» sosteniendo el celular cómodamente. Se omiten movimientos de menos de 2°, y a partir de ese umbral el giro se amplía progresivamente hasta 100 % alrededor de 25° (ajustable). Opciones de invertir dirección, ajustar sensibilidad o desactivar. Al girar el teléfono se pierde la calibración y se detiene la dirección hasta centrar otra vez. Ante pérdida de datos del sensor >1,25 s la dirección vuelve gradualmente a centro; los botones táctiles nunca desaparecen y anulan temporalmente el sensor cuando se utilizan.
En landscape móvil aparece un panel de conducción sobre el parabrisas que permite simultáneamente inclinar, acelerar o frenar con pulgar, elegir P/R/N/D, señalizar y, antes de iniciar, colocarse cinturón/comprobar espejos. El botón físico de orientación puede no conseguir bloqueo horizontal (depende navegador/fullscreen); el diseño también dispone de modo portrait y teclado.
No es equivalente a un volante físico de automóvil. Los ángulos, zona muerta, escalado y sentido de la señal requieren validación con teléfonos reales y personas novatas. No se graban ni transmiten muestras del sensor; solo las preferencias de sensibilidad/inversión en almacenamiento local. MDN: https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation y https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock. Se conserva el renderer Canvas 2.5D, sin migrar a Babylon ni motor nativo por ahora.

**Ajuste UX:** también en landscape se dispone de «Invertir» y mensajes de sensor no disponible, esperando calibración o interrumpido. Los controles alternativos izquierda/derecha permanecen visibles mientras se conduce. El botón de activación no pretende bloquear la orientación física; se recomienda rotar el teléfono antes de calibrar. Estado de infraestructura pendiente: CI no reportada en PR #10, Vercel failure en commit funcional; no prometer preview actualizada.
