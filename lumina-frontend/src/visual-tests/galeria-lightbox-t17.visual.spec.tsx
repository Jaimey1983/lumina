/**
 * T17 — el lightbox de la Galería en un navegador real (no jsdom): Embla mide y desliza de verdad,
 * el `Dialog` de Radix atrapa y devuelve el foco, y las imágenes lejanas no se cargan hasta que
 * se acercan. Se comprueba con el DOM y el foco, no con capturas.
 */
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import { elementRegistry } from '@/lib/element-registry-bootstrap';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'clase-1' }),
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => '/classes/clase-1/editor',
  useSearchParams: () => new URLSearchParams(),
}));

async function montar() {
  const def = elementRegistry.obtener('galeria');
  if (!def) throw new Error('sin galería en el registry');
  const Viewer = def.Viewer;
  const view = await render(
    <div style={{ width: 640, height: 400 }}>
      <Viewer estado={def.crearPorDefecto()} config={{}} />
    </div>,
  );
  return view;
}

const dialogo = () => document.querySelector<HTMLElement>('[role="dialog"]');
const contador = () => dialogo()?.querySelector<HTMLElement>('[aria-live="polite"]')?.textContent?.trim();
const slideActivo = () => dialogo()?.querySelector('[aria-roledescription="slide"]:not([aria-hidden])');
const cargadas = () =>
  Array.from(dialogo()?.querySelectorAll<HTMLImageElement>('[aria-roledescription="slide"] img') ?? []).length;

describe('Galería — lightbox en Chromium', () => {
  test('abre en la imagen tocada, navega con flechas de pantalla y de teclado, y respeta los extremos', async () => {
    const view = await montar();
    await view.getByRole('button', { name: /Ampliar imagen 3 de 6/ }).click();
    await vi.waitFor(() => expect(contador()).toBe('3 / 6'));

    await view.getByRole('button', { name: 'Imagen siguiente' }).click();
    await vi.waitFor(() => expect(contador()).toBe('4 / 6'));
    await userEvent.keyboard('{ArrowLeft}');
    await vi.waitFor(() => expect(contador()).toBe('3 / 6'));
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    await vi.waitFor(() => expect(contador()).toBe('6 / 6'));
    await expect.element(view.getByRole('button', { name: 'Imagen siguiente' })).toBeDisabled();
  });

  test('Escape cierra y el foco vuelve a la miniatura que lo abrió', async () => {
    const view = await montar();
    const miniatura = view.getByRole('button', { name: /Ampliar imagen 2 de 6/ });
    await miniatura.click();
    await vi.waitFor(() => expect(dialogo()).not.toBeNull());
    expect(dialogo()?.contains(document.activeElement)).toBe(true); // foco dentro del diálogo
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(dialogo()).toBeNull());
    await vi.waitFor(() => expect(document.activeElement).toBe(miniatura.element()));
  });

  test('el foco queda atrapado: Tab no sale del diálogo', async () => {
    const view = await montar();
    await view.getByRole('button', { name: /Ampliar imagen 1 de 6/ }).click();
    await vi.waitFor(() => expect(dialogo()).not.toBeNull());
    for (let i = 0; i < 12; i++) {
      await userEvent.tab();
      expect(dialogo()?.contains(document.activeElement)).toBe(true);
    }
  });

  test('solo se cargan la imagen actual y sus vecinas, y el zoom ensancha la imagen', async () => {
    const view = await montar();
    await view.getByRole('button', { name: /Ampliar imagen 1 de 6/ }).click();
    await vi.waitFor(() => expect(cargadas()).toBe(2));

    const img = () => slideActivo()?.querySelector<HTMLImageElement>('img');
    await vi.waitFor(() => expect(img()).not.toBeNull());
    const ancho1 = img()!.getBoundingClientRect().width;
    await userEvent.keyboard('+');
    await userEvent.keyboard('+');
    await vi.waitFor(() => expect(img()!.getBoundingClientRect().width).toBeGreaterThan(ancho1 * 1.5));
    // Cambiar de imagen reinicia el zoom.
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => expect(contador()).toBe('2 / 6'));
    await vi.waitFor(() => expect(cargadas()).toBe(3));
    await vi.waitFor(() =>
      expect(document.querySelector('[aria-label="Zoom actual"]')?.textContent?.trim()).toBe('100 %'),
    );
  });

  test('deslizar con el puntero cambia de imagen (Embla)', async () => {
    const view = await montar();
    await view.getByRole('button', { name: /Ampliar imagen 1 de 6/ }).click();
    await vi.waitFor(() => expect(contador()).toBe('1 / 6'));
    const activo = page.elementLocator(slideActivo() as HTMLElement);
    await userEvent.dragAndDrop(activo, activo, {
      sourcePosition: { x: 400, y: 150 },
      targetPosition: { x: 40, y: 150 },
    });
    await vi.waitFor(() => expect(contador()).toBe('2 / 6'));
  });
});
