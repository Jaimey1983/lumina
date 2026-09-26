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

  test('un bloque %-posicionado renderiza con el MISMO rect que en una caja fluida (react-moveable intacto) y su contenido px escala', async () => {
    // Hipótesis de seguridad de G-scale.1b: como la caja del bloque es
    // %-posicionada y la superficie virtual escalada llena exactamente el host,
    // el rect renderizado del bloque es idéntico al del modelo fluido actual
    // (react-moveable / guías miden ese rect → sin regresión). Lo único que
    // cambia es el contenido en px virtuales, que ahora escala con el slide.
    // Dos hosts 16:9 del MISMO tamaño, apilados (sin flex, para no distorsionar).
    render(
      <div>
        {/* Referencia: caja fluida 16:9 (modelo actual). */}
        <div style={{ width: 800, height: 450, position: 'relative' }}>
          <div
            data-testid="block-fluid"
            style={{ position: 'absolute', left: '20%', top: '10%', width: '30%', height: '40%' }}
          >
            <span data-testid="font-fluid" style={{ fontSize: 40, lineHeight: 1 }}>
              Aa
            </span>
          </div>
        </div>
        {/* Virtual: mismo tamaño de host; el bloque vive en la superficie 1280×720
            escalada. El wrapper `absolute inset-0 h-full w-full` reproduce la raíz
            de `SlideRenderer` en el editor. */}
        <div style={{ width: 800, height: 450, position: 'relative' }}>
          <VirtualSlideSurface>
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <div
                data-testid="block-virtual"
                style={{ position: 'absolute', left: '20%', top: '10%', width: '30%', height: '40%' }}
              >
                <span data-testid="font-virtual" style={{ fontSize: 40, lineHeight: 1 }}>
                  Aa
                </span>
              </div>
            </div>
          </VirtualSlideSurface>
        </div>
      </div>,
    );
    await settle();

    const rf = el('[data-testid="block-fluid"]').getBoundingClientRect();
    const rv = el('[data-testid="block-virtual"]').getBoundingClientRect();
    // Caja del bloque: MISMO tamaño renderizado (±1 px) → react-moveable ve lo mismo.
    expect(rv.width).toBeCloseTo(rf.width, 0);
    expect(rv.height).toBeCloseTo(rf.height, 0);

    // Contenido px: en la virtual escala (900/1280 ≈ 0.703) → claramente más chico.
    const ff = el('[data-testid="font-fluid"]').getBoundingClientRect().height;
    const fv = el('[data-testid="font-virtual"]').getBoundingClientRect().height;
    expect(fv).toBeGreaterThan(0);
    expect(fv).toBeLessThan(ff * 0.85);
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
