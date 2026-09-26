import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'g-scale-visual-class' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/hooks/api/use-classes', () => ({
  useUpdateSlide: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(async () => ({})),
    isPending: false,
  }),
}));

/**
 * G-scale.6 — paridad vía **`SlideRenderer`** (ruta real de app), no solo viewers aislados.
 *
 * Cubre el mismo contrato que `g-scale-multi-surface.visual.spec.tsx` pero con el
 * ensamblado de producción: preview (miniatura / slides-panel), viewer con
 * `viewerFill` (present / viewer / autónomo) y editor bajo `<VirtualSlideSurface>`
 * (como `canvas-area`).
 */
import type { ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import type { Slide } from '@lumina/types/slide';

import { VirtualSlideSurface } from '@/components/editor/virtual-slide-surface';
import { SlideRenderer } from '@/app/(app)/classes/[id]/editor/components/slide-renderer';
import { graficoFixture } from './canvas-blocks-fixture';

const SURFACES = {
  viewer: { width: 960, height: 540 },
  present: { width: 1280, height: 720 },
  thumb: { width: 200, height: 112.5 },
  editor: { width: 1024, height: 576 },
} as const;

function Host({
  width,
  height,
  thumbnailChrome = false,
  children,
}: {
  width: number;
  height: number;
  thumbnailChrome?: boolean;
  children: ReactNode;
}) {
  const inner = (
    <div className="relative h-full w-full overflow-hidden" style={{ background: '#e2e8f0' }}>
      {children}
    </div>
  );
  return (
    <div style={{ width, height, position: 'relative', boxSizing: 'border-box' }}>
      {thumbnailChrome ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">{inner}</div>
      ) : (
        inner
      )}
    </div>
  );
}

function graficoSlide(): Slide {
  return {
    id: 'g6-grafico-slide',
    order: 1,
    type: 'CONTENT',
    title: 'G-scale.6',
    bloques: [graficoFixture()],
    fondo: { tipo: 'color', valor: '#ffffff' },
  };
}

async function settle(ms = 400): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
}

describe('G-scale.6 — SlideRenderer multi-superficie', () => {
  test('preview (slides-panel): título del gráfico en viewer y miniatura', async () => {
    const slide = graficoSlide();

    for (const [label, cfg] of Object.entries(SURFACES)) {
      if (label === 'editor') continue;
      const view = await render(
        <Host width={cfg.width} height={cfg.height} thumbnailChrome={label === 'thumb'}>
          <SlideRenderer
            slide={slide}
            modo="preview"
            className="absolute inset-0 h-full w-full"
          />
        </Host>,
      );
      await settle(label === 'viewer' ? 1200 : 800);

      expect(view.container.textContent, `preview ${label}`).toContain('Notas del período');
      expect(
        view.container.querySelector('[data-virtual-slide-surface]'),
        `superficie virtual en ${label}`,
      ).toBeTruthy();

      await view.unmount();
    }
  });

  test('viewerFill: gráfico legible en superficie present (1280×720)', async () => {
    const slide = graficoSlide();
    const view = await render(
      <Host width={SURFACES.present.width} height={SURFACES.present.height}>
        <SlideRenderer
          slide={slide}
          modo="viewer"
          viewerFill
          className="absolute inset-0 h-full w-full"
        />
      </Host>,
    );
    await settle(1200);

    expect(view.container.textContent).toContain('Notas del período');
    expect(view.container.querySelector('.apexcharts-canvas')).toBeTruthy();
    expect(view.container.querySelector('[data-virtual-slide-surface]')).toBeTruthy();

    await view.unmount();
  });

  test('editor: bloque posicionado bajo VirtualSlideSurface (contrato canvas-area)', async () => {
    const slide = graficoSlide();
    const view = await render(
      <Host width={SURFACES.editor.width} height={SURFACES.editor.height}>
        <VirtualSlideSurface className="h-full w-full">
          <SlideRenderer
            slide={slide}
            modo="editor"
            suppressCanvasHandles
            className="absolute inset-0 h-full w-full min-h-0 min-w-0"
          />
        </VirtualSlideSurface>
      </Host>,
    );
    await settle(1200);

    const surface = view.container.querySelector('[data-virtual-slide-surface]') as HTMLElement;
    const block = view.container.querySelector('[data-block-id="0"]') as HTMLElement;
    expect(surface && block).toBeTruthy();
    expect(surface.offsetWidth).toBe(1280);
    expect(surface.offsetHeight).toBe(720);
    expect(view.container.textContent).toContain('Notas del período');

    const blockRect = block.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    expect(blockRect.width / surfaceRect.width).toBeGreaterThan(0.5);
    expect(blockRect.height / surfaceRect.height).toBeGreaterThan(0.5);

    await view.unmount();
  });
});
