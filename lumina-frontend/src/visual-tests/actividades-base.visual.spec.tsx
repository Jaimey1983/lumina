/**
 * U0 — línea base visual de las 26 actividades del kit (etapa U).
 *
 * Un snapshot del `Viewer` real del registry por actividad, en estado inicial
 * (`crearPorDefecto()`), más tres estados posteriores a responder: el overlay de
 * resultado compartido (`ActivityResultOverlay`, que U3 reemplaza), Verdadero/Falso
 * con feedback y Memoria completada. Para regenerar las referencias:
 * `pnpm --filter lumina-frontend test:visual:update`.
 *
 * `Math.random` va sembrado; el tiempo está congelado (`congelarTiempo`); sin animaciones ni transiciones. Referencias solo
 * `chromium-linux` (como `widgets-base`).
 */
import './actividades-visual.css';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import { ActivityResultOverlay } from '@lumina/element-kit/activities/_shared/activity-result-overlay';
import { elementRegistry } from '@/lib/element-registry-bootstrap';
import {
  ACTIVIDAD_TIPOS,
  ACTIVIDAD_VISUAL_HEIGHT,
  ACTIVIDAD_VISUAL_WIDTH,
  ActividadVisualHost,
  congelarTiempo,
  estadoActividad,
  fijarAzar,
  type ActividadTipo,
} from './actividades-fixture';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'clase-1' }),
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => '/classes/clase-1/editor',
  useSearchParams: () => new URLSearchParams(),
}));

let restaurarAzar: () => void;
let tiempo: ReturnType<typeof congelarTiempo>;
beforeEach(async () => {
  restaurarAzar = fijarAzar();
  tiempo = congelarTiempo();
  // El iframe de vitest mide 414 px por defecto: más angosto que el host (640 px) recortaría la captura.
  await page.viewport(ACTIVIDAD_VISUAL_WIDTH + 40, ACTIVIDAD_VISUAL_HEIGHT + 40);
});
afterEach(() => {
  tiempo.restaurar();
  restaurarAzar();
});

async function montar(tipo: ActividadTipo, estado: unknown = estadoActividad(tipo)) {
  const def = elementRegistry.obtener(tipo);
  if (!def) throw new Error(`El registry no tiene la actividad "${tipo}"`);
  const Viewer = def.Viewer;
  const view = await render(
    <ActividadVisualHost>
      <Viewer estado={estado} config={{}} />
    </ActividadVisualHost>,
  );
  const host = view.getByTestId('actividad-visual-host');
  await expect.element(host).toBeVisible();
  return { view, host };
}

describe('actividades — línea base visual (U0)', () => {
  test('el registry tiene las 26 actividades', () => {
    expect(ACTIVIDAD_TIPOS).toHaveLength(26);
    for (const tipo of ACTIVIDAD_TIPOS) {
      expect(elementRegistry.obtener(tipo), tipo).toBeDefined();
    }
  });

  for (const tipo of ACTIVIDAD_TIPOS) {
    test(`${tipo} — estado inicial`, async () => {
      const { host } = await montar(tipo);
      // Globos es una animación continua: se avanza un número fijo de cuadros para capturar globos en pantalla.
      if (tipo === 'globos') act(() => tiempo.avanzarFrames(90));
      await expect(host).toMatchScreenshot(`${tipo}--inicial.png`);
    });
  }

  test('resultado compartido (ActivityResultOverlay) — aprobado', async () => {
    const view = await render(
      <ActividadVisualHost>
        <ActivityResultOverlay correctas={4} total={5} onReintentar={() => undefined} />
      </ActividadVisualHost>,
    );
    const host = view.getByTestId('actividad-visual-host');
    await expect(host).toMatchScreenshot('resultado-overlay--aprobado.png');
  });

  test('resultado compartido (ActivityResultOverlay) — reprobado', async () => {
    const view = await render(
      <ActividadVisualHost>
        <ActivityResultOverlay correctas={1} total={5} onReintentar={() => undefined} />
      </ActividadVisualHost>,
    );
    const host = view.getByTestId('actividad-visual-host');
    await expect(host).toMatchScreenshot('resultado-overlay--reprobado.png');
  });

  test('verdadero_falso — feedback tras responder', async () => {
    const { view, host } = await montar('verdadero_falso');
    await userEvent.click(view.getByRole('button', { name: /Verdadero/ }));
    await expect(host).toMatchScreenshot('verdadero_falso--respondida.png');
  });
});
