# Arcade

Plataforma de videojuegos originales para jugar directamente en el navegador, con diseño adaptado a celulares y segunda etapa de app móvil.

## Estado (2026-10-26)
**Hito 1 iniciado.** Este repositorio contiene la documentación operativa. **El código del prototipo v0.1.0 está preparado en un ZIP entregado en la conversación, pero todavía NO está sincronizado aquí.** No existe despliegue público, tests completos ni build verificados.

## Prototipo preparado
Portal React/TypeScript/Vite con catálogo y carga diferida de Phaser, primer juego de obstáculos Neon Drift, controles táctiles/teclado, pausa, reinicio, sonido, pantalla completa compatible y récord en almacenamiento local.

## Instalación (después de subir el código del ZIP)
Requiere Node.js 22 y conexión a npm.

```bash
npm install
npm run dev
npm run test
npm run build
```

Generar y versionar `package-lock.json`; luego actualizar CI para `npm ci`.

## Continuidad
Leer `ARCHITECTURE.md`, `CHANGELOG.md`, `CONTINUITY.md`, `ROADMAP.md` y `AGENTS.md` antes de cada sesión. Actualizar bitácora y continuidad después de cada cambio.

## Próximo paso
Subir los archivos del ZIP al repositorio y ejecutar CI, seguido de pruebas en navegadores móviles.
