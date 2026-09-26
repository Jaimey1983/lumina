/**
 * G-scale.1 — validación en navegador real del wrapper `<VirtualSlideSurface>`.
 *
 * En jsdom no hay layout ni `ResizeObserver` reales, así que la escala virtual
 * (medir contenedor → `transform: scale`) solo se puede verificar en un
 * navegador de verdad (Playwright, 3 motores). Se comprueba:
 *   1. la superficie interna mide **1280×720 fijo** sin importar el contenedor,
 *   2. llena su contenedor 16:9 (escala = ancho/1280),
 *   3. **paridad**: el mismo contenido en px virtuales ocupa la misma fracción
 *      del contenedor en tamaños muy distintos (la "única forma para todo"),
 *   4. el `zoom` multiplica la escala.
 */
import type { ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { VirtualSlideSurface } from '@/components/editor/virtual-slide-surface';

const VW = 1280;
const VH = 720;

function Host({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <div style={{ width, height, position: 'relative', boxSizing: 'border-box' }}>
      {children}
    </div>
  );
}

async function settle(ms = 200): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
  );
}

function el(sel: string): HTMLElement {
  const node = document.querySelector(sel);
  if (!node) throw new Error(`no encontrado: ${sel}`);
  return node as HTMLElement;
}

describe('VirtualSlideSurface — escala virtual uniforme (navegador real)', () => {
  test('la superficie interna mide 1280×720 fijo y llena el contenedor 16:9', async () => {
    render(
      <Host width={1024} height={576}>
        <VirtualSlideSurface surfaceTestId="surface-fill">
          <div>contenido</div>
        </VirtualSlideSurface>
      </Host>,
    );
    await settle();

    const surface = el('[data-testid="surface-fill"]');
    // Caja de layout (sin transform): SIEMPRE el espacio virtual fijo.
    expect(surface.offsetWidth).toBe(VW);
    expect(surface.offsetHeight).toBe(VH);
    // Renderizada (con transform): llena el host de 1024 (contain, 16:9).
    const rect = surface.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(1000);
    expect(rect.width).toBeLessThanOrEqual(1026);
    // Escala ≈ 1024/1280 = 0.8.
    expect(rect.width / VW).toBeCloseTo(0.8, 1);
  });

  test('paridad: mismo px virtual → misma fracción del contenedor en tamaños distintos', async () => {
    render(
      <div>
        <Host width={1000} height={562.5}>
          <VirtualSlideSurface surfaceTestId="s-big">
            <div
              data-testid="child-big"
              style={{ position: 'absolute', top: 0, left: 0, width: 256, height: 144 }}
            />
          </VirtualSlideSurface>
        </Host>
        <Host width={320} height={180}>
          <VirtualSlideSurface surfaceTestId="s-small">
            <div
              data-testid="child-small"
              style={{ position: 'absolute', top: 0, left: 0, width: 256, height: 144 }}
            />
          </VirtualSlideSurface>
        </Host>
      </div>,
    );
    await settle();

    // El hijo mide 256 px virtuales fijos en ambos (caja de layout).
    expect(el('[data-testid="child-big"]').offsetWidth).toBe(256);
    expect(el('[data-testid="child-small"]').offsetWidth).toBe(256);

    const bigChild = el('[data-testid="child-big"]').getBoundingClientRect().width;
    const bigSurface = el('[data-testid="s-big"]').getBoundingClientRect().width;
    const smallChild = el('[data-testid="child-small"]').getBoundingClientRect().width;
    const smallSurface = el('[data-testid="s-small"]').getBoundingClientRect().width;

    // Renderizado en tamaños MUY distintos...
    expect(bigChild).toBeGreaterThan(smallChild * 2);
    // ...pero la MISMA fracción del slide (256/1280 = 0.2) en ambos → escala uniforme.
    const fractionBig = bigChild / bigSurface;
    const fractionSmall = smallChild / smallSurface;
    expect(fractionBig).toBeCloseTo(0.2, 2);
    expect(fractionSmall).toBeCloseTo(0.2, 2);
    expect(fractionBig).toBeCloseTo(fractionSmall, 2);
  });

  test('el zoom multiplica la escala renderizada', async () => {
    render(
      <div>
        <Host width={1024} height={576}>
          <VirtualSlideSurface surfaceTestId="z1" zoom={1}>
            <div>x</div>
          </VirtualSlideSurface>
        </Host>
        <Host width={1024} height={576}>
          <VirtualSlideSurface surfaceTestId="z2" zoom={2}>
            <div>x</div>
          </VirtualSlideSurface>
        </Host>
      </div>,
    );
    await settle();

    const w1 = el('[data-testid="z1"]').getBoundingClientRect().width;
    const w2 = el('[data-testid="z2"]').getBoundingClientRect().width;
    expect(w2 / w1).toBeCloseTo(2, 1);
  });
});
