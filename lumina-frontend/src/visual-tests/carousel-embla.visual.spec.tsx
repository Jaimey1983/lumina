/**
 * T6 — el Carousel sobre Embla, en un navegador real (en jsdom Embla no puede medir
 * páginas, así que allí se prueba el contrato con un doble: ver
 * packages/element-kit/src/widgets/carousel/carousel-viewer.parity.spec.tsx).
 * Aquí se comprueba el comportamiento de verdad: navegar, loop, autoplay y que las
 * páginas inactivas no reciban foco.
 */
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import { elementRegistry } from '@/lib/element-registry-bootstrap';
import { estadoDe } from './widgets-fixture';

type Estado = { configuracion: Record<string, unknown> };

function montar(config: Record<string, unknown> = {}) {
  const def = elementRegistry.obtener('carousel');
  if (!def) throw new Error('El registry no tiene el carousel');
  const base = estadoDe('carousel') as Estado;
  const estado = {
    ...base,
    configuracion: { ...base.configuracion, mostrarFlechasInternas: false, ...config },
  };
  const Viewer = def.Viewer;
  return render(
    // Marco grande: en el de 360×240 de la línea base el cuerpo del carrusel queda en ~14 px de alto.
    <div style={{ position: 'relative', width: 700, height: 520, overflow: 'hidden' }}>
      <Viewer estado={estado} config={{}} />
    </div>,
  );
}

const paginas = () => Array.from(document.querySelectorAll('[aria-roledescription="slide"]')) as HTMLElement[];
const activa = () => paginas().findIndex((p) => p.getAttribute('aria-hidden') !== 'true');

describe('Carousel sobre Embla (navegador real)', () => {
  test('Siguiente y Anterior cambian de página; sin loop se desactivan en los extremos', async () => {
    await montar();
    await expect.poll(() => paginas().length).toBe(3);
    expect(activa()).toBe(0);
    const anterior = page.getByRole('button', { name: 'Anterior' });
    await expect.element(anterior).toBeDisabled();

    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect.poll(activa).toBe(1);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect.poll(activa).toBe(2);
    await expect.element(page.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  test('con loop, Anterior en la primera página da la vuelta a la última', async () => {
    await montar({ loop: true });
    await expect.poll(() => paginas().length).toBe(3);
    await page.getByRole('button', { name: 'Anterior' }).click();
    await expect.poll(activa).toBe(2);
  });

  test('un punto lleva a su página', async () => {
    await montar();
    await expect.poll(() => paginas().length).toBe(3);
    await page.getByRole('button', { name: 'Ir a Página 3' }).click();
    await expect.poll(activa).toBe(2);
  });

  test('las páginas inactivas son inert: nada dentro de ellas recibe foco', async () => {
    await montar();
    await expect.poll(() => paginas().length).toBe(3);
    for (const [i, p] of paginas().entries()) {
      expect(p.hasAttribute('inert'), `página ${i}`).toBe(i !== 0);
    }
  });

  test('arrastrar hacia la izquierda (swipe) avanza a la página siguiente', async () => {
    await montar();
    await expect.poll(() => paginas().length).toBe(3);
    const primera = page.elementLocator(paginas()[0]);
    await userEvent.dragAndDrop(primera, primera, {
      sourcePosition: { x: 300, y: 120 },
      targetPosition: { x: 20, y: 120 },
    });
    await expect.poll(activa).toBe(1);
  });

  test('transición fade: navega y la página que sale queda transparente', async () => {
    await montar({ transicion: 'fade' });
    await expect.poll(() => paginas().length).toBe(3);
    expect(activa()).toBe(0);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect.poll(activa).toBe(1);
    // Con `fade` las páginas no se desplazan: la activa se ve y las demás se apagan.
    await expect.poll(() => Number(getComputedStyle(paginas()[1]).opacity), { timeout: 4000 }).toBe(1);
    await expect.poll(() => Number(getComputedStyle(paginas()[0]).opacity), { timeout: 4000 }).toBe(0);
  });

  test('transición fade: el loop da la vuelta en ambos sentidos', async () => {
    await montar({ transicion: 'fade', loop: true });
    await expect.poll(() => paginas().length).toBe(3);
    await page.getByRole('button', { name: 'Anterior' }).click();
    await expect.poll(activa).toBe(2);
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect.poll(activa).toBe(0);
  });

  test('con autoplay avanza sola', async () => {
    // El autoplay se pausa con el puntero encima (stopOnMouseEnter): se aparta el ratón del
    // carrusel (el de la prueba anterior quedó sobre él) hasta una esquina libre.
    const lejos = document.createElement('button');
    lejos.setAttribute('style', 'position:fixed;right:0;bottom:0;width:24px;height:24px;z-index:9999');
    lejos.textContent = 'x';
    document.body.appendChild(lejos);
    await userEvent.hover(page.elementLocator(lejos));
    await montar({ autoplay: true, autoplayMs: 1500 });
    await expect.poll(() => paginas().length).toBe(3);
    expect(activa()).toBe(0);
    await expect.poll(activa, { timeout: 6000 }).toBeGreaterThan(0);
  });
});
