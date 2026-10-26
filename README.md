# Arcade

Plataforma original de videojuegos para navegador, diseñada primero para móviles. Segunda etapa: PWA y posible aplicación Android/iOS que reutilice código.

## Estado (2026-10-26)
**v0.1.0: preview disponible para revisión, todavía no producción.**

- Repositorio: https://github.com/omarsantanar/Arcade
- PR #1: https://github.com/omarsantanar/Arcade/pull/1
- Preview: https://arcade-git-feat-initial-web-portal-omar-santanas-projects.vercel.app
- GitHub Actions: instalación, tests Vitest y compilación TypeScript/Vite satisfactorios.
- Pendiente: lockfile versionado, pruebas reales en dispositivos y revisión de PR antes de fusionar.

## Instalación local
Requisitos: Node.js 22 y npm.

```bash
git clone https://github.com/omarsantanar/Arcade.git
cd Arcade
git checkout feat/initial-web-portal
npm install
npm run dev
```

La aplicación se abre normalmente en http://localhost:5173. Para validar:

```bash
npm run test
npm run build
npm run preview
```

## Estructura
- `src/App.tsx`: galería, filtros y selección del juego.
- `src/components/GameView.tsx`: ventana y controles comunes.
- `src/games/registry.ts`: catálogo y carga diferida.
- `src/games/types.ts`: contrato de módulo.
- `src/games/neon-drift/`: primer juego Phaser.
- `.github/workflows/ci.yml`: pruebas automáticas.

## Desarrollo y continuidad
Trabajar en ramas `feat/*`, `fix/*`, `docs/*` con PR. Leer y actualizar `ARCHITECTURE.md`, `CHANGELOG.md`, `CONTINUITY.md`, `ROADMAP.md` y `AGENTS.md`. Cada cambio debe registrar propósito, archivos, pruebas, resultado, riesgos y próximo paso.

No incorporar arte ajeno protegido ni monetización sin autorización. Sin backend, usuarios, analítica o anuncios en esta etapa.
