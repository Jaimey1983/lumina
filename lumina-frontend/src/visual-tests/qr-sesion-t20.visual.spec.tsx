/**
 * T20 — el QR de sesión en un navegador real: la librería (carga diferida) dibuja un SVG cuadrado y
 * dentro del bloque, con el código en letra grande. Se fija el origen (no el del navegador de
 * pruebas, que cambia de puerto) para que la captura sea estable.
 */
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { elementRegistry } from '@/lib/element-registry-bootstrap';
import { WidgetVisualHost } from './widgets-fixture';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'clase-1' }),
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => '/classes/clase-1/editor',
  useSearchParams: () => new URLSearchParams(),
}));

async function montar(configuracion: Record<string, unknown>) {
  const def = elementRegistry.obtener('qr-sesion');
  if (!def) throw new Error('sin qr-sesion en el registry');
  const Viewer = def.Viewer;
  const base = def.crearPorDefecto() as { configuracion: Record<string, unknown> };
  const estado = {
    ...base,
    configuracion: { ...base.configuracion, origen: 'personalizado', origenPersonalizado: 'https://lumina.test', ...configuracion },
  };
  const view = await render(
    <WidgetVisualHost>
      <Viewer estado={estado} config={{}} />
    </WidgetVisualHost>,
  );
  return view.getByTestId('widget-visual-host');
}

describe('QR de sesión en Chromium', () => {
  test('dibuja un QR cuadrado dentro del bloque, con el código en texto grande', async () => {
    const host = await montar({ codigo: 'AB12CD' });
    await expect.element(host).toBeVisible();
    const el = host.element() as HTMLElement;
    await vi.waitFor(() => expect(el.querySelector('[role="img"] svg path')).not.toBeNull(), { timeout: 5000 });
    const svg = el.querySelector('[role="img"] svg') as SVGElement;
    const caja = svg.getBoundingClientRect();
    expect(Math.abs(caja.width - caja.height)).toBeLessThan(1.5);
    expect(caja.width).toBeGreaterThan(80);
    const marco = el.getBoundingClientRect();
    expect(caja.left).toBeGreaterThanOrEqual(marco.left);
    expect(caja.right).toBeLessThanOrEqual(marco.right);
    expect(caja.bottom).toBeLessThanOrEqual(marco.bottom);
    const codigo = el.querySelector('[aria-label="Código: AB12CD"]') as HTMLElement;
    expect(codigo.textContent).toBe('AB12CD');
    expect(parseFloat(getComputedStyle(codigo).fontSize)).toBeGreaterThanOrEqual(24);
    // Negro sobre blanco: lo que lee la cámara.
    expect(getComputedStyle(svg.parentElement as HTMLElement).backgroundColor).toBe('rgb(255, 255, 255)');
    await expect(host).toMatchScreenshot('qr-sesion-con-codigo.png');
  });

  test('sin código muestra el aviso y no dibuja ningún QR', async () => {
    const host = await montar({ codigo: '' });
    const el = host.element() as HTMLElement;
    await vi.waitFor(() => expect(el.textContent).toContain('Falta el código de la clase.'));
    expect(el.querySelector('[role="img"] svg')).toBeNull();
  });
});
