/**
 * G-scale.4 — grafico / diagrama bajo `<VirtualSlideSurface>` (multi-tamaño).
 *
 * Complementa E5.7 (host fijo sin surface): aquí el bloque vive en el lienzo
 * virtual 1280×720 escalado y verificamos que la geometría sigue montando y
 * que la fracción renderizada del chart es estable entre superficies.
 */
import type { CSSProperties, ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { graficoDefinition, diagramaDefinition } from '@lumina/element-kit';

import { VirtualSlideSurface } from '@/components/editor/virtual-slide-surface';
import {
  CANVAS_HOST_BG,
  grafoFixture,
  graficoFixture,
} from './canvas-blocks-fixture';

function BlockHost({
  blockStyle,
  children,
}: {
  blockStyle: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div style={{ position: 'absolute', boxSizing: 'border-box', ...blockStyle }}>
      {children}
    </div>
  );
}

function SurfaceHost({
  width,
  height,
  testId,
  children,
}: {
  width: number;
  height: number;
  testId: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        boxSizing: 'border-box',
        background: CANVAS_HOST_BG,
      }}
    >
      <VirtualSlideSurface surfaceTestId={testId} className="h-full w-full">
        <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      </VirtualSlideSurface>
    </div>
  );
}

async function settle(ms = 400): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
}

describe('G-scale.4 — canvas blocks en superficie virtual', () => {
  test('grafico: ApexCharts monta dentro de VirtualSlideSurface', async () => {
    const Viewer = graficoDefinition.Viewer;
    const block = graficoFixture();
    const view = await render(
      <SurfaceHost width={960} height={540} testId="g4-chart">
        <BlockHost blockStyle={{ left: '15%', top: '15%', width: '70%', height: '65%' }}>
          <Viewer estado={block} config={{}} />
        </BlockHost>
      </SurfaceHost>,
    );
    await settle(1200);

    const canvas = view.container.querySelector('.apexcharts-canvas');
    expect(canvas, 'ApexCharts canvas presente').toBeTruthy();

    await view.unmount();
  });

  test('diagrama grafo: nodos xyflow montan en superficie virtual', async () => {
    const Viewer = diagramaDefinition.Viewer;
    const block = grafoFixture();
    const view = await render(
      <SurfaceHost width={960} height={540} testId="g4-diag">
        <BlockHost blockStyle={{ left: '10%', top: '10%', width: '80%', height: '75%' }}>
          <Viewer estado={block} config={{}} />
        </BlockHost>
      </SurfaceHost>,
    );
    await settle(600);

    const nodes = view.container.querySelectorAll('.react-flow__node');
    expect(nodes.length, 'nodos xyflow').toBeGreaterThan(0);

    await view.unmount();
  });

  test('paridad multi-superficie: fracción renderizada del chart estable', async () => {
    const Viewer = graficoDefinition.Viewer;
    const block = graficoFixture();
    const blockChild = (
      <BlockHost blockStyle={{ left: '15%', top: '15%', width: '70%', height: '65%' }}>
        <Viewer estado={block} config={{}} />
      </BlockHost>
    );

    const big = await render(
      <SurfaceHost width={1000} height={562.5} testId="g4-big">
        {blockChild}
      </SurfaceHost>,
    );
    const small = await render(
      <SurfaceHost width={400} height={225} testId="g4-small">
        {blockChild}
      </SurfaceHost>,
    );
    await settle(1200);

    const chartBig = big.container.querySelector('.apexcharts-canvas') as HTMLElement;
    const chartSmall = small.container.querySelector('.apexcharts-canvas') as HTMLElement;
    const surfBig = big.container.querySelector('[data-testid="g4-big"]') as HTMLElement;
    const surfSmall = small.container.querySelector('[data-testid="g4-small"]') as HTMLElement;
    expect(chartBig && chartSmall && surfBig && surfSmall).toBeTruthy();

    const fracBig =
      chartBig.getBoundingClientRect().height /
      surfBig.getBoundingClientRect().height;
    const fracSmall =
      chartSmall.getBoundingClientRect().height /
      surfSmall.getBoundingClientRect().height;
    expect(fracSmall).toBeCloseTo(fracBig, 2);

    await big.unmount();
    await small.unmount();
  });
});
