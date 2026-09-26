/**
 * G-scale.3 — QA visual en navegador real: timeline (proyecto) y click-reveal.
 *
 * Verifica que tipografía/padding en px virtual se mantienen en el layout 1280×720
 * y que la fracción renderizada (getBoundingClientRect) es estable entre
 * contenedores 16:9 de distinto tamaño (misma idea que G-scale.1 paridad).
 */
import type { ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import {
  CLICK_REVEAL_TRIGGER_LABEL_FONT_PX,
  TIMELINE_PROYECTO_NUM_FONT_PX,
} from '@lumina/editor-shared/virtual-viewport-units';
import { clickRevealDefinition, timelineDefinition } from '@lumina/element-kit';

import { VirtualSlideSurface } from '@/components/editor/virtual-slide-surface';

function Host({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  return (
    <div style={{ width, height, position: 'relative', boxSizing: 'border-box' }}>
      {children}
    </div>
  );
}

async function settle(ms = 300): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
  );
}

function parsePx(value: string): number {
  return Number.parseFloat(value);
}

function proyectoTimelineFixture() {
  const block = timelineDefinition.crearPorDefecto();
  return {
    ...block,
    configuracion: { ...block.configuracion, variante: 'proyecto' as const },
    nodos: block.nodos.map((nodo, index) => ({
      ...nodo,
      mostrarNumeroPaso: true,
      numeroPaso: String(index + 1),
    })),
  };
}

async function mountOnSurface(
  width: number,
  height: number,
  surfaceTestId: string,
  body: ReactNode,
) {
  const view = await render(
    <Host width={width} height={height}>
      <VirtualSlideSurface surfaceTestId={surfaceTestId} className="h-full w-full">
        <div data-testid="widget-host" style={{ position: 'absolute', inset: 0 }}>
          {body}
        </div>
      </VirtualSlideSurface>
    </Host>,
  );
  await settle();
  return view;
}

describe('G-scale.3 — timeline y click-reveal en superficie virtual', () => {
  test('timeline proyecto: número en px virtual de layout', async () => {
    const Viewer = timelineDefinition.Viewer;
    const view = await mountOnSurface(
      960,
      540,
      'tl-surface',
      <Viewer estado={proyectoTimelineFixture()} config={{ isThumbnail: false }} />,
    );

    const num = view.container.querySelector('[class*="tlProyectoNum"]') as HTMLElement | null;
    expect(num, 'debe renderizar variante proyecto con número').toBeTruthy();
    if (!num) return;

    const layoutSize = parsePx(getComputedStyle(num).fontSize);
    expect(layoutSize).toBeCloseTo(TIMELINE_PROYECTO_NUM_FONT_PX, 0);

    await view.unmount();
  });

  test('click-reveal: etiqueta del trigger en px virtual de layout', async () => {
    const Viewer = clickRevealDefinition.Viewer;
    const block = clickRevealDefinition.crearPorDefecto();
    const view = await mountOnSurface(
      960,
      540,
      'cr-surface',
      <Viewer estado={block} config={{ isThumbnail: false }} />,
    );

    const label = view.container.querySelector('[class*="revealTriggerLabel"]') as HTMLElement | null;
    expect(label, 'trigger con etiqueta visible').toBeTruthy();
    if (!label) return;

    const layoutSize = parsePx(getComputedStyle(label).fontSize);
    expect(layoutSize).toBeCloseTo(CLICK_REVEAL_TRIGGER_LABEL_FONT_PX, 0);

    await view.unmount();
  });

  test('paridad: misma fracción renderizada del número timeline en dos tamaños', async () => {
    const Viewer = timelineDefinition.Viewer;
    const estado = proyectoTimelineFixture();

    const big = await mountOnSurface(
      1000,
      562.5,
      'tl-big',
      <Viewer estado={estado} config={{ isThumbnail: false }} />,
    );
    const small = await mountOnSurface(
      400,
      225,
      'tl-small',
      <Viewer estado={estado} config={{ isThumbnail: false }} />,
    );

    const numBig = big.container.querySelector('[class*="tlProyectoNum"]') as HTMLElement;
    const numSmall = small.container.querySelector('[class*="tlProyectoNum"]') as HTMLElement;
    expect(numBig && numSmall).toBeTruthy();

    const rectBig = numBig.getBoundingClientRect();
    const rectSmall = numSmall.getBoundingClientRect();
    const hostBig = big.container.querySelector('[data-testid="tl-big"]')?.parentElement;
    const hostSmall = small.container.querySelector('[data-testid="tl-small"]')?.parentElement;
    const surfaceBig = hostBig?.querySelector('[data-virtual-slide-surface]') as HTMLElement;
    const surfaceSmall = hostSmall?.querySelector('[data-virtual-slide-surface]') as HTMLElement;
    expect(surfaceBig && surfaceSmall).toBeTruthy();

    const fracBig = rectBig.height / surfaceBig!.getBoundingClientRect().height;
    const fracSmall = rectSmall.height / surfaceSmall!.getBoundingClientRect().height;
    expect(fracSmall).toBeCloseTo(fracBig, 2);

    await big.unmount();
    await small.unmount();
  });
});
