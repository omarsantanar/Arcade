# Arquitectura — Arcade

**ADR-001 · 2026-10-26**

Objetivo: portal web mobile-first con videojuegos originales jugables en el navegador. Segunda etapa: aplicaciones móviles reutilizando código.

## Stack y razones
TypeScript, React y Vite para la interfaz; Phaser 3 para minijuegos 2D. Catálogo y escenas separados, carga diferida del motor para mejorar la portada. CSS propio y localStorage para guardar marcas sin cuentas ni backend.

## Contrato modular
- `src/App.tsx`: portada, categorías y selección.
- `src/games/registry.ts`: manifiestos y carga dinámica.
- `src/games/types.ts`: GameFactory y GameHandle (pause, resume, restart, mute, direction, destroy).
- `src/components/GameView.tsx`: interfaz compartida de juego.
- `src/games/<id>/`: escenas, lógica y tests independientes.

Alternativas consideradas: Canvas puro aumenta código propio; backend en primera etapa agrega complejidad sin necesidad. Antes de producción: auditorías móvil, accesibilidad, seguridad, rendimiento y licencias. No desplegar ni monetizar sin revisión.
