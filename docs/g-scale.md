# G-scale — escala virtual del slide (1280×720)

| Ficha | Estado | Descripción |
|-------|--------|-------------|
| **G-scale.0** | En `main` | `virtual-slide-scale.ts` — helpers puros |
| **G-scale.1** | En `main` | `<VirtualSlideSurface>` |
| **G-scale.1b** | En `main` | Editor (`canvas-area` + moveable) |
| **G-scale.2** | En `main` | Solo lectura en `SlideRenderer` |
| **G-scale.3** | En `main` (#39) | `vw`/`vh`/`cqi`/`cqmin` → px virtual (`virtual-viewport-units.ts`) |
| **G-scale.4** | En `main` (#40) | Neutralizador de escala para **grafico** / **diagrama** / **clip-group** + `g-scale-4-canvas-blocks.visual.spec.tsx` + CI `test:visual` |
| **G-scale.5** | En `main` (#55) | Sin **`isThumbnail`** (familias #41–#52, `SlideRenderer`, `@lumina/charts` #53, `g-scale-multi-surface.visual.spec.tsx` #54) |
| **G-scale.6** | En `main` | `g-scale-6-slide-renderer.visual.spec.tsx` — `SlideRenderer` en preview / `viewerFill` / editor + `VirtualSlideSurface` |

**Prueba transversal:** `g-scale-multi-surface.visual.spec.tsx` (viewers aislados), **G-scale.6** (`SlideRenderer`) y **Cypress** `07-g-scale-present-viewer.cy.ts` (rutas `/present` y `/viewer` con API mockeada).

## Nota historial Git

El commit `d1124f5` en `main` usa el mensaje «G-scale.2» pero corresponde a **widgets** (`WidgetFramedImageLayer` / Timeline), no a escala virtual. El G-scale.2 real entró con el merge del PR #37 (`VirtualSlideSurface` en `SlideRenderer`).

## Ramas feb4

Las ramas `cursor/virtual-slide-*-feb4` y `cursor/editor-virtual-surface-feb4` (pila #34–#36) fueron eliminadas del remoto; el código vive en `main`.

## Tests visuales

```bash
cd lumina-frontend && pnpm test:visual
```

Proyecto `visual` usa solo **Chromium**. En CI: `playwright install chromium --with-deps` + `pnpm test:visual`.

Specs G-scale: `g-scale-3-widgets.visual.spec.tsx` (widgets), `g-scale-4-canvas-blocks.visual.spec.tsx` (grafico/diagrama), `g-scale-multi-surface.visual.spec.tsx` (paridad viewer / present / miniatura), `g-scale-6-slide-renderer.visual.spec.tsx` (ensamblado app).

## Smoke manual (post-merge G-scale.5)

Tras cambios en escala o miniaturas, revisar en local (`pnpm dev` en `lumina-frontend`):

1. **Editor** — lienzo 16:9, arrastre/resize de un bloque `grafico` o `timeline`; zoom del canvas si aplica.
2. **Panel slides** — miniaturas legibles (títulos de widgets/charts), sin interacción en el thumb.
3. **Present / viewer** — mismo slide a pantalla completa; gráfico y diagrama sin recortes raros.
4. **Autónomo** (si hay sesión de prueba) — un slide con widget interactivo escala bien.

Automatizado en CI: `pnpm test:visual` (incluye G-scale.3–6).

## E2E Cypress (present / viewer)

Con el frontend en `http://localhost:3001` (`pnpm dev`):

```bash
cd lumina-frontend && pnpm test:e2e:g-scale
```

Fixture: `cypress/fixtures/g-scale.ts` — clase `e2e-g-scale-class` con bloque `grafico` «Notas del período». `seedGScaleSession()` intercepta `GET /auth/me` y `GET /classes/:id`.

## Deuda imagen widgets (G-scale.5)

`use-widget-image-dimensions` y `widget-image-styles` ya no exponen `isThumbnail` ni heurística de miniatura (&lt;50px): el encuadre cover usa siempre el mismo camino bajo `VirtualSlideSurface`.

## G-scale.5 — miniaturas

El panel lateral escala el slide con `VirtualSlideSurface` y bloquea interacción con `pointer-events-none` en el contenedor (`slides-panel`), no con `isThumbnail` en cada viewer.
