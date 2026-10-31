# Simulador Conducción RD — Godot 4.7.2

Prototipo educativo de examen de conducción en primera persona. No representa el examen oficial del INTRANT.

## Ejecutar
Abrir este directorio en Godot 4.7.2 y ejecutar la escena principal.

## Controles
Flechas: acelerar, frenar y girar. D/R/P para selector automático. Pantalla táctil: dirección, aceleración, freno y selector. INCLINAR y CALIBRAR requieren acceso a sensores compatible; en un navegador web la disponibilidad no está garantizada.

## Evaluador
Tiempo máximo cinco minutos. Semáforo en rojo, límite señalizado de 30 km/h, salida de calzada y colisión terminan la prueba al detectarse. Son criterios internos didácticos, no dictamen legal exhaustivo. No se muestra aviso previo a cada infracción.

## Exportación y despliegue
Vercel usa la carpeta del proyecto como rootDirectory, ejecuta `bash build-web.sh` y publica `web/`. El script obtiene Godot y plantillas oficiales desde las versiones 4.7.2. El compilado requiere WebAssembly y WebGL 2.

## Estado
Este proyecto se prepara para su primer despliegue y todavía requiere pruebas en navegador; no afirmamos que esté validado. La cabina, el automóvil y el circuito son provisionales.

## Próximos objetivos
Validar física e infracciones; añadir direccionales, peatones, tráfico autónomo; mejorar Corolla 2001 y calibración móvil.