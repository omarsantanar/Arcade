# Roadmap — Arcade

Actualizado 2026-10-26. Los hitos describen progreso técnico, no aprobación de lanzamiento.

1. **Arquitectura y repositorio:** completada base documental; código subido en PR #1 y CI satisfactorio. Pendientes revisión PR, lockfile y cierre formal del hito.
2. **Portal responsive:** portada y catálogo listos en preview Vercel; pendientes pruebas reales Android/iOS, accesibilidad, rendimiento.
3. **Primer juego:** Neon Drift funciona en preview según build y despliegue; controles táctiles, teclado, pausa, reinicio y récord local programados; faltan pruebas manuales.
4. **Catálogo:** implementar más juegos originales como módulos independientes, con navegación y controles compartidos.
5. **Aplicación:** evaluar PWA y Capacitor para iOS/Android, reusando interfaz y lógica, luego validar límites de sonido, fullscreen y almacenamiento.

Preview: https://arcade-git-feat-initial-web-portal-omar-santanas-projects.vercel.app

Fuera de alcance hasta autorización: anuncios, cobros, registros, backend y multijugador.

### 2026-10-26 — Neon Drift v0.2.0 (en revisión)
- [x] Dificultad cada 7 segundos y corredores transitables con planificación independiente del motor.
- [x] Paleta oficial, nave triangular con glow, obstáculos variables y efectos de movimiento.
- [x] Simulación local de 156.000 oleadas.
- [ ] Validar Vitest/build con GitHub Actions y preview de Vercel.
- [ ] Balanceo en Safari iOS y Chrome Android; ajustes táctiles.
- [ ] Hyperdrift/Boost, música por capas y multiplicadores solo en versión posterior.

### 2026-10-26 — Neon Drift v0.3.0, más desafiante
- [x] Nivel inicial más rápido y frecuente; aberturas más estrechas.
- [x] Nuevas siluetas, campos de fragmentos y huecos señuelo (sin rutas falsas para el corredor testigo).
- [x] Pilares verticales programados en niveles 3, 6, 9… .
- [x] Simulación geométrica local de 131.200 oleadas sin violación de las restricciones.
- [ ] Aprobar tests Vitest/build del último commit y confirmar preview.
- [ ] Validar físicamente controles táctiles y percepción de justicia en móvil.


### 2026-10-26 — Neon Drift v0.4.0
- [x] Varias rutas posibles en niveles iniciales, aumentando la presión en niveles altos.
- [x] Orden/posición/forma de obstáculos y aparición temporal más aleatorios.
- [x] Comprobación conservadora de todas las rutas alcanzables y barreras verticales de cada tercer nivel.
- [ ] Revisión física en iOS/Android y balanceo por jugadores.


- [x] CI validado para v0.4.0, ejecución 40383943632: 11 pruebas y build satisfactorios.
- [ ] Validar en móvil rutas alternativas y equilibrio de niveles 1, 3, 6 y 10.


### Segundo título: Pulse Core · Prototipo de concepto (2026-10-26)
- [x] Concepto original documentado; mecánica central distinta de la eliminación de filas.
- [x] Módulo Phaser con lógica y tests separados; React reutiliza portal y controles; no se modifica Neon Drift.
- [x] Controles teclado y táctil, marcador, pausa/reinicio y persistencia local implementados en la rama de prototipo.
- [ ] CI GitHub / build Vite comprobado para la rama.
- [ ] Testeo de curva de aprendizaje en Android/iOS y tutorial interactivo.
- [ ] Revisión legal/marca y de similitud antes de anunciar un título comercial.
- [ ] Decidir si incorporar a la beta pública después de revisión.

- [x] Pulse Core: CI GitHub con 17/17 pruebas y build satisfactorio, ejecución 40386833411; Vercel Preview Ready en rama de propuesta.
- [ ] Pulse Core: probar mecánica y experiencia en móviles físicos y comprobar accesibilidad, tutorial y claridad de anillos.

### Pulse Core — Guía de aprendizaje (2026-10-26)
- [x] Crear tutorial de 3 pasos, visual y compatible con pantallas pequeñas.
- [x] Mostrar automáticamente la primera vez y ofrecer reapertura mediante «?».
- [x] Pausar y reanudar con respeto al estado previo.
- [ ] Confirmar CI/deploy para los nuevos cambios.
- [ ] Validar con usuarios nuevos la comprensión de radial vs. arco y el primer combo.
- [ ] Considerar misión opcional de práctica guiada si el tutorial explicativo no basta.

- [x] CI/deploy de la guía Pulse Core verificados: 19/19 tests, build y Vercel `success` (run 40403227040).
