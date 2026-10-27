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

### 2026-10-26 — Lumen Circuit, laberintos originales
- [x] Documentar límites de propiedad intelectual y diseño audiovisual original.
- [x] Crear lógica de laberintos conectados, objetivos energéticos, centinelas y controles de cuatro direcciones.
- [x] Integrar módulo independiente y tests en el catálogo del portal (rama `feat/lumen-circuit-beta`).
- [ ] Confirmar GitHub Actions y despliegue de preview.
- [ ] Probar iOS/Android: latencia, desplazamiento, señales de terminales, colisiones y balance.
- [ ] Revisar disponibilidad legal del nombre antes de lanzamiento.

- [x] Lumen Circuit validado por GitHub Actions 40411150897 (19/19 tests, build correcto), Vercel Preview Ready.

### Corrección de sincronización Vercel — 2026-10-26
- [x] Verificar diferencia entre ZIP local y GitHub/Vercel.
- [x] Subir al repositorio la identidad eléctrica de Lumen y los apagones, conservando concepto original.
- [x] Implementar cuatro mundos ficticios inspirados en regiones dominicanas con parámetros de dificultad diferentes.
- [x] Añadir pruebas de progresión por mundos y conectividad.
- [ ] Validar la última ejecución CI/Vercel y prueba humana en móvil.

### 2026-10-27 — Lumen Circuit: nodos de sobrecarga
- [x] Nodo especial grande y claramente distinto de generadoras y cristales.
- [x] Cuatro eventos aleatorios mutuamente excluyentes (turbo, nuevos apagones, aceleración de apagones, neutralización).
- [x] Siete segundos de efecto, 3,5 de espera, reaparición segura y límite de agujeros negros.
- [x] Pruebas automatizadas adicionales de efectos, tiempo, azar y colisiones.
- [ ] Confirmar CI/preview del código final y ajustar el balance tras partidas de prueba.

- [x] Validación CI inicial de nodos especiales: 30/30 pruebas y build; estado Vercel `success` (ejecución 40494565328).

### 2026-10-27 — Puntuación por tamaños, túneles y niveles especiales
- [x] 200 luces pequeñas recogidas entre mundos → +1 vida.
- [x] Puntos medios de 10 puntos y energía; gran punto sin puntuación pero obligatorio.
- [x] Bonificaciones indicadas: 3,9,15,21,27,36,45,54,63 y 72+ cada 9, sin enemigos, con 90 s para recogerlo todo.
- [x] Conexión por tubos horizontales en ciertos mapas para Lumen y perseguidores.
- [x] +1 agujero negro cada cuatro niveles desde el 4; excepción de mundos bonificación.
- [ ] Confirmar última CI/deploy, prueba en celulares y calibrar dificultad de mundos altos.
