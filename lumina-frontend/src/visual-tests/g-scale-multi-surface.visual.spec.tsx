/**
 * G-scale — paridad **multi-superficie** (Chromium / `vitest-browser`).
 *
 * Simula contenedores típicos tras G-scale.2–5:
 * - **viewer** grande (960×540)
 * - **present** 16:9 (1280×720 en host escalado)
 * - **miniatura** panel lateral (~200×112.5) con `pointer-events-none` (slides-panel)
 *
 * Sin `isThumbnail`: el mismo viewer escala bajo `<VirtualSlideSurface>`.
 */
import type { CSSProperties, ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { graficoDefinition, timelineDefinition } from '@lumina/element-kit';

import { VirtualSlideSurface } from '@/components/editor/virtual-slide-surface';
import { graficoFixture } from './canvas-blocks-fixture';

const SURFACES = {
  viewer: { width: 960, height: 540, id: 'ms-viewer' },
  present: { width: 1280, height: 720, id: 'ms-present' },
  thumb: { width: 200, height: 112.5, id: 'ms-thumb' },
} as const;

function SurfaceCase({
  width,
  height,
  surfaceTestId,
  thumbnailChrome = false,
  children,
}: {
  width: number;
  height: number;
  surfaceTestId: string;
  /** Replica `slides-panel`: mismo slide, interacción bloqueada en el wrapper. */
  thumbnailChrome?: boolean;
  children: ReactNode;
}) {
  const inner = (
    <VirtualSlideSurface surfaceTestId={surfaceTestId} className="h-full w-full">
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </VirtualSlideSurface>
  );

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        boxSizing: 'border-box',
        background: '#e2e8f0',
      }}
    >
      {thumbnailChrome ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">{inner}</div>
      ) : (
        inner
      )}
    </div>
  );
}

function BlockFrame({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        left: '8%',
        top: '10%',
        width: '84%',
        height: '78%',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

async function settle(ms = 400): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
}

describe('G-scale — paridad multi-superficie', () => {
  test('grafico: título visible en viewer, present y miniatura (sin isThumbnail)', async () => {
    const Viewer = graficoDefinition.Viewer;
    const block = graficoFixture();

    for (const [label, cfg] of Object.entries(SURFACES)) {
      const view = await render(
        <SurfaceCase
          width={cfg.width}
          height={cfg.height}
          surfaceTestId={cfg.id}
          thumbnailChrome={label === 'thumb'}
        >
          <BlockFrame>
            <Viewer estado={block} config={{}} />
          </BlockFrame>
        </SurfaceCase>,
      );
      await settle(label === 'viewer' ? 1200 : 800);

      expect(
        view.container.textContent,
        `título en superficie ${label}`,
      ).toContain('Notas del período');

      await view.unmount();
    }
  });

  test('grafico: fracción del canvas Apex estable entre viewer y miniatura', async () => {
    const Viewer = graficoDefinition.Viewer;
    const block = graficoFixture();
    const body = (
      <BlockFrame>
        <Viewer estado={block} config={{}} />
      </BlockFrame>
    );

    const big = await render(
      <SurfaceCase
        width={SURFACES.viewer.width}
        height={SURFACES.viewer.height}
        surfaceTestId="ms-frac-big"
      >
        {body}
      </SurfaceCase>,
    );
    const small = await render(
      <SurfaceCase
        width={SURFACES.thumb.width}
        height={SURFACES.thumb.height}
        surfaceTestId="ms-frac-small"
        thumbnailChrome
      >
        {body}
      </SurfaceCase>,
    );
    await settle(1200);

    const chartBig = big.container.querySelector('.apexcharts-canvas') as HTMLElement;
    const chartSmall = small.container.querySelector('.apexcharts-canvas') as HTMLElement;
    const surfBig = big.container.querySelector('[data-virtual-slide-surface]') as HTMLElement;
    const surfSmall = small.container.querySelector('[data-virtual-slide-surface]') as HTMLElement;
    expect(chartBig && chartSmall && surfBig && surfSmall).toBeTruthy();

    const fracBig = chartBig.getBoundingClientRect().height / surfBig.getBoundingClientRect().height;
    const fracSmall =
      chartSmall.getBoundingClientRect().height / surfSmall.getBoundingClientRect().height;
    expect(fracSmall).toBeCloseTo(fracBig, 2);

    await big.unmount();
    await small.unmount();
  });

  test('timeline: título del widget en miniatura con chrome de panel', async () => {
    const Viewer = timelineDefinition.Viewer;
    const estado = timelineDefinition.crearPorDefecto();
    estado.tituloWidget = 'Línea de tiempo demo';

    const view = await render(
      <SurfaceCase
        width={SURFACES.thumb.width}
        height={SURFACES.thumb.height}
        surfaceTestId="ms-tl-thumb"
        thumbnailChrome
      >
        <BlockFrame>
          <Viewer estado={estado} config={{}} />
        </BlockFrame>
      </SurfaceCase>,
    );
    await settle();

    expect(view.container.textContent).toContain('Línea de tiempo demo');
    await view.unmount();
  });
});
