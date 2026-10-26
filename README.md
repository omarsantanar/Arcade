# Arcade

Plataforma web mobile-first de videojuegos originales para navegador, con módulos independientes y una interfaz compartida.

**Estado:** prototipo v0.1.0 en desarrollo. No desplegado a producción.

## Instalación
Requisitos: Node.js 22 y npm.

```bash
git clone https://github.com/omarsantanar/Arcade.git
cd Arcade
npm install
npm run dev
```

Ejecutar pruebas y compilación:

```bash
npm run test
npm run build
```

## Estructura
- `src/App.tsx`: portal y galería.
- `src/components/GameView.tsx`: controles comunes y ventana de juego.
- `src/games/registry.ts`: catálogo y carga diferida.
- `src/games/neon-drift/`: primer módulo Phaser.
- `.github/workflows/ci.yml`: validación con GitHub Actions.

Documentación operativa: `ARCHITECTURE.md`, `CHANGELOG.md`, `CONTINUITY.md`, `ROADMAP.md` y `AGENTS.md`.

**Pendiente:** generar `package-lock.json` con conexión al registro npm y validar CI antes de considerar una release estable. El sitio aún no tiene un despliegue configurado.

## Desarrollo
Ramas `feat/*`, `fix/*` y `docs/*`; commits semánticos; actualizar CHANGELOG y CONTINUITY tras cada cambio. No incorporar activos protegidos ni monetización sin autorización.