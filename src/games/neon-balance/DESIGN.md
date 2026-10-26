# Neon Balance — Concepto experimental, no aprobado

**Fecha:** 2026-10-26. **Estado:** prototipo jugable para evaluación, sin integración en producción.

## Propuesta
Un puzzle arcade de bloques descendentes inspirado en la presión de gestionar espacio y ritmo, **no en la regla de completar filas**. La meta se entiende visualmente en segundos: **colocar pesos sobre una plataforma suspendida sin volcarla**.

## Cómo jugar
1. El siguiente bloque indica su masa mediante su tamaño visual/pequeñas marcas (de 1 a 4).
2. Toca la columna elegida para soltarlo inmediatamente. También se puede seleccionar con flechas izquierda/derecha y soltar con Espacio; si no se elige, el bloque llega al terminar la cuenta atrás.
3. Los bloques más pesados y lejanos del centro inclinan más la plataforma. La barra superior representa la inclinación. Mantén la balanza cerca del centro para ganar bonificaciones.
4. Puedes recuperar una situación de peligro con el siguiente bloque. Dos colocaciones consecutivas fuera de la zona segura terminan la partida. Llenar una columna y tratar de colocar otra ficha allí también la termina.
5. Cada 18 segundos aumenta el nivel y el tiempo de decisión se reduce progresivamente hasta un límite. Surgen pesos más altos.

## Controles
- **Móvil:** tocar la columna objetivo (acción en un gesto); flechas táctiles secundarias para mover la selección.
- **PC:** ratón/pantalla; flechas/A/D para cambiar columna, Espacio/Intro para colocar.
- **Comunes:** pausa, reinicio, sonido y récord local.

## Diferenciación
Sin cuadrícula de filas para borrar, sin tetrominós, sin piezas rotatorias, sin mecánica de coincidencia cromática. El jugador controla **par de torsión y estabilidad** en una balanza física estilizada: una regla observable directamente en la pantalla.

## Criterios de prueba
- Comprensión en 5–10 segundos sin tutorial obligatorio.
- Primera acción en menos de 4 segundos, usando un único toque.
- Barra de inclinación legible, efecto de masa visible y causa de derrota evidente.
- Comparar resultados en móvil real y desktop.
- Neon Drift no debe modificarse.
- Construir como módulo Phaser independiente, con lógica pura y tests Vitest.

## Riesgos pendientes
El prototipo simula estabilidad mediante un índice de torsión, no física real; se requiere calibración visual de la inclinación y la sensibilidad del umbral. La ausencia de combos espaciales puede resultar repetitiva; validar diversión antes de añadir poderes. No hacer declaraciones de exclusividad legal sin una revisión.
