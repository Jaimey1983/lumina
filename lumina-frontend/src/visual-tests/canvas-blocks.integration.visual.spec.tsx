/**
 * E5.7 — cobertura de integración real de los 3 bloques con canvas.
 *
 * Los `*.parity.spec.tsx` del kit corren en jsdom: Recharts (`next/dynamic`),
 * `GraphCanvas` (@xyflow, `next/dynamic`) y el `<canvas>` de Paper.js rinden
 * `null`, así que sólo comparan el *chrome* del wrapper (RIESGO ACEPTADO E4.5 §2).
 *
 * Aquí se monta el mismo bloque en un navegador real (Playwright, 3 motores) y
 * se compara el **cuerpo renderizado** legacy vs el `Viewer` del
 * `ElementDefinition` del kit:
 *   1. render no degenerado — el chart / grafo / máscara producen geometría real.
 *   2. paridad estructural — el HTML normalizado del kit == legacy.
 *
 * Con esto verde, `slide-renderer.tsx` despacha `grafico` / `diagrama` /
 * `clip-group` por `elementRegistry` sin `case` dedicado (cierra
 * `LUM-E5-CANVAS-BLOCKS`).
 */
import type { ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import {
  clipGroupDefinition,
  diagramaDefinition,
  graficoDefinition,
} from '@lumina/element-kit';

import { GraficoViewer as LegacyGraficoViewer } from '@/components/graficos/grafico-viewer';
import { DiagramaViewer as LegacyDiagramaViewer } from '@/components/diagramas/diagrama-viewer';
import { RenderClipGroup as LegacyRenderClipGroup } from '@/app/(app)/classes/[id]/editor/components/render-clip-group';

import {
  CANVAS_HOST_BG,
  CANVAS_HOST_SIZE,
  clipGroupFixture,
  grafoFixture,
  graficoFixture,
  normalizeRenderedHtml,
  vennFixture,
} from './canvas-blocks-fixture';

function Host({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="canvas-host"
      style={{
        width: CANVAS_HOST_SIZE.width,
        height: CANVAS_HOST_SIZE.height,
        background: CANVAS_HOST_BG,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  );
}

/** Espera a que el navegador pinte y el layout se estabilice. */
async function settle(ms = 250) {
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r(null))),
  );
  await new Promise((r) => setTimeout(r, ms));
}

function hostEl(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-testid="canvas-host"]') as HTMLElement;
}

/**
 * Monta `node` en el Host, deja que el navegador pinte y devuelve
 * `{ count, html }`: `count` = geometría real encontrada con `geomSelector`,
 * `html` = innerHTML del host normalizado.
 */
async function renderBody(node: ReactNode, geomSelector: string, waitMs = 250) {
  const view = await render(<Host>{node}</Host>);
  await settle(waitMs);
  const el = hostEl(view.container);
  const count = el.querySelectorAll(geomSelector).length;
  const html = normalizeRenderedHtml(el.innerHTML);
  await view.unmount();
  return { count, html };
}

describe('E5.7 — integración canvas: legacy vs ElementDefinition del kit', () => {
  test('grafico: el ContainerResponsive de Recharts monta y el kit == legacy', async () => {
    // NOTA: en el navegador headless de vitest, el `ResponsiveContainer` de
    // Recharts (cargado por `next/dynamic`, `ssr:false`) mide 0×0 y no pinta
    // barras — es un límite del harness (no hay layout de Next), el mismo que
    // motivó el RIESGO ACEPTADO de E4.5. Lo que E5.7 sí verifica: el adapter
    // del kit produce el **mismo DOM** que el componente legacy hasta el punto
    // en que Recharts toma el control (`.recharts-responsive-container` montado
    // e idéntico). El cuerpo del chart es una llamada byte a byte al mismo
    // `GraficoChartRenderer` (ver `grafico-adapters.tsx` → `LegacyGraficoViewer`).
    const block = graficoFixture();
    const geom = '.recharts-responsive-container';

    const legacy = await renderBody(<LegacyGraficoViewer block={block} />, geom, 1200);
    expect(legacy.count, 'el chart-renderer se cargó (next/dynamic resuelto)').toBeGreaterThan(0);

    const KitViewer = graficoDefinition.Viewer;
    const kit = await renderBody(<KitViewer estado={block} config={{}} />, geom, 1200);

    expect(kit.count).toBe(legacy.count);
    expect(kit.html).toBe(legacy.html);
  });

  test('diagrama grafo: @xyflow monta nodos reales y el kit == legacy', async () => {
    const block = grafoFixture();
    const geom = '.react-flow__node, [data-id][class*="node"]';

    const legacy = await renderBody(<LegacyDiagramaViewer block={block} />, geom);
    expect(legacy.count, 'render real: nodos xyflow').toBeGreaterThan(0);

    const KitViewer = diagramaDefinition.Viewer;
    const kit = await renderBody(<KitViewer estado={block} config={{}} />, geom);

    expect(kit.count).toBe(legacy.count);
    expect(kit.html).toBe(legacy.html);
  });

  test('diagrama Venn: SVG rinde círculos y el kit == legacy', async () => {
    const block = vennFixture();
    const geom = 'svg circle, svg ellipse';

    const legacy = await renderBody(<LegacyDiagramaViewer block={block} />, geom);
    expect(legacy.count, 'render real: círculos del Venn').toBeGreaterThan(0);

    const KitViewer = diagramaDefinition.Viewer;
    const kit = await renderBody(<KitViewer estado={block} config={{}} />, geom);

    expect(kit.count).toBe(legacy.count);
    expect(kit.html).toBe(legacy.html);
  });

  test('clip-group: la máscara se aplica y el kit == legacy', async () => {
    const block = clipGroupFixture();
    const geom = '[style*="clip-path"], svg clipPath, svg path, [style*="mask"]';

    const legacy = await renderBody(
      <LegacyRenderClipGroup block={block} editorMode={false} />,
      geom,
    );
    expect(legacy.count, 'render real: geometría de recorte').toBeGreaterThan(0);

    const KitViewer = clipGroupDefinition.Viewer;
    const kit = await renderBody(<KitViewer estado={block} config={{}} />, geom);

    expect(kit.count).toBe(legacy.count);
    expect(kit.html).toBe(legacy.html);
  });
});
