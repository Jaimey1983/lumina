# G-scale — escala virtual del slide (1280×720)

| Ficha | Estado | Descripción |
|-------|--------|-------------|
| **G-scale.0** | En `main` | `virtual-slide-scale.ts` — helpers puros |
| **G-scale.1** | En `main` | `<VirtualSlideSurface>` |
| **G-scale.1b** | En `main` | Editor (`canvas-area` + moveable) |
| **G-scale.2** | En `main` | Solo lectura en `SlideRenderer` |
| **G-scale.3** | En `main` (#39) | `vw`/`vh`/`cqi`/`cqmin` → px virtual (`virtual-viewport-units.ts`) |
| **G-scale.4** | En curso | Neutralizador de escala para **grafico** / **diagrama** / **clip-group** + visual multi-superficie + CI `test:visual` |
| **G-scale.5** | En curso | Retirar **`isThumbnail`**; **1 familia/PR** — ✅ grafico (#41), ✅ diagrama (#42), ✅ timeline (#43), ✅ click-reveal (#44) |

**Prueba transversal (todas las fichas):** paridad **multi-superficie** en Playwright (editor, preview, present, viewer, autónomo, miniatura) — debe atravesar G-scale.4 y G-scale.5.

## Nota historial Git

El commit `d1124f5` en `main` usa el mensaje «G-scale.2» pero corresponde a **widgets** (`WidgetFramedImageLayer` / Timeline), no a escala virtual. El G-scale.2 real entró con el merge del PR #37 (`VirtualSlideSurface` en `SlideRenderer`).

## Ramas feb4

Las ramas `cursor/virtual-slide-*-feb4` y `cursor/editor-virtual-surface-feb4` (pila #34–#36) fueron eliminadas del remoto; el código vive en `main`.

## Tests visuales

```bash
cd lumina-frontend && pnpm test:visual
```

Proyecto `visual` usa solo **Chromium**. En CI: `playwright install chromium --with-deps` + `pnpm test:visual`.

Specs G-scale: `g-scale-3-widgets.visual.spec.tsx` (widgets), `g-scale-4-canvas-blocks.visual.spec.tsx` (grafico/diagrama).
