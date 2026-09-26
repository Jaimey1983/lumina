# G-scale — escala virtual del slide (1280×720)

## Estado: **cerrado** (fix completo en `main`)

G-scale unifica el render del slide en **1280×720 virtual** bajo `<VirtualSlideSurface>` en editor, preview, present, viewer, autónomo y miniaturas del panel. Ya no se usa `isThumbnail` en viewers ni en `@lumina/charts`; el encuadre de imágenes en widgets tampoco bifurca por miniatura.

| Ficha | Estado | Descripción |
|-------|--------|-------------|
| **G-scale.0** | En `main` | `virtual-slide-scale.ts` — helpers puros |
| **G-scale.1** | En `main` | `<VirtualSlideSurface>` |
| **G-scale.1b** | En `main` | Editor (`canvas-area` + moveable) |
| **G-scale.2** | En `main` | Solo lectura en `SlideRenderer` |
| **G-scale.3** | En `main` (#39) | `vw`/`vh`/`cqi`/`cqmin` → px virtual (`virtual-viewport-units.ts`) |
| **G-scale.4** | En `main` (#40) | Neutralizador de escala para **grafico** / **diagrama** / **clip-group** + `g-scale-4-canvas-blocks.visual.spec.tsx` |
| **G-scale.5** | En `main` (#55) | Sin **`isThumbnail`** (familias, `SlideRenderer`, charts, `g-scale-multi-surface.visual.spec.tsx`) |
| **G-scale.6** | En `main` | `g-scale-6-slide-renderer.visual.spec.tsx` — `SlideRenderer` preview / `viewerFill` / editor |
| **G-scale.E2E** | En `main` | Cypress `07-g-scale-present-viewer.cy.ts`, `08-g-scale-editor-autonomo.cy.ts` + job CI `frontend-g-scale-e2e` |

## Regresión automatizada

| Capa | Comando | CI |
|------|---------|-----|
| Vitest visual (Chromium) | `cd lumina-frontend && pnpm test:visual` | job `frontend` |
| Cypress G-scale | `pnpm test:e2e:g-scale` (con `pnpm dev` en `:3001`) | job `frontend-g-scale-e2e` |
| Packages | `pnpm --filter @lumina/element-kit test` | job `packages` |

Specs visuales: `g-scale-3-widgets`, `g-scale-4-canvas-blocks`, `g-scale-multi-surface`, `g-scale-6-slide-renderer`, más `virtual-slide-surface.visual.spec.tsx`.

E2E cubre: **present**, **viewer**, **editor** (lienzo + miniatura), **autónomo** (join + viewer), navegación a slides con **timeline** y **diagrama**.

Fixture: `lumina-frontend/cypress/fixtures/g-scale.ts` — clase `e2e-g-scale-class`, sesión `e2e-g-scale-session`.

`data-testid` de regresión: `g-scale-slide-stage`, `g-scale-editor-surface`, `g-scale-slide-thumb`, `[data-virtual-slide-surface]`.

## Smoke manual (opcional, pre-release)

1. **Editor** — arrastre/resize de `grafico` o `timeline`; zoom del canvas.
2. **Panel slides** — miniaturas legibles, sin clic en el thumb.
3. **Present / viewer** — pantalla completa sin recortes en gráfico/diagrama.
4. **Autónomo** — un slide interactivo escala bien tras PIN.

## Nota historial Git

El commit `d1124f5` en `main` usa el mensaje «G-scale.2» pero corresponde a **widgets** (`WidgetFramedImageLayer` / Timeline), no a escala virtual. El G-scale.2 real entró con el merge del PR #37.

Las ramas `cursor/g-scale-*` y `cursor/virtual-slide-*-feb4` fueron eliminadas del remoto; el código vive en `main`.

## G-scale.5 — miniaturas

El panel lateral escala el slide con `VirtualSlideSurface` y bloquea interacción con `pointer-events-none` en el contenedor (`slides-panel`), no con `isThumbnail` en cada viewer.

## Imágenes en widgets

`use-widget-image-dimensions` y `widget-image-styles` usan un único camino de encuadre cover (sin flag ni umbral de miniatura).
