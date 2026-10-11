/**
 * T0 — línea base visual de los 14 widgets (etapa T).
 *
 * Un snapshot del Viewer por widget con el estado de `crearPorDefecto()` y uno
 * por cada preset declarado en su `ElementDefinition`. Para regenerar las
 * referencias: `pnpm --filter lumina-frontend test:visual:update`.
 *
 * Los widgets de tipo overlay (popup, hotspot, tooltip) se capturan cerrados,
 * es decir, el disparador; abrirlos pertenece a las fichas que los modifiquen.
 */
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { elementRegistry } from '@/lib/element-registry-bootstrap';
import {
  WIDGET_TIPOS,
  WidgetVisualHost,
  estadoDe,
  presetsDe,
  type WidgetTipo,
} from './widgets-fixture';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'clase-1' }),
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => '/classes/clase-1/editor',
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * La molécula dibuja su `<canvas>` de forma asíncrona (carga diferida de
 * smiles-drawer): se espera a que tenga píxeles para que la captura no dependa
 * de la carga de la máquina.
 */
async function esperarCanvasDibujado(host: HTMLElement) {
  await vi.waitFor(
    () => {
      const canvas = host.querySelector('canvas');
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) throw new Error('sin canvas todavía');
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (!data.some((valor, i) => i % 4 === 3 && valor > 0)) {
        throw new Error('canvas aún vacío');
      }
    },
    { timeout: 10_000, interval: 50 },
  );
}

async function capturar(tipo: WidgetTipo, nombre: string, presetId?: string) {
  const def = elementRegistry.obtener(tipo);
  if (!def) throw new Error(`El registry no tiene el widget "${tipo}"`);
  const Viewer = def.Viewer;
  const view = await render(
    <WidgetVisualHost>
      <Viewer estado={estadoDe(tipo, presetId)} config={{}} />
    </WidgetVisualHost>,
  );
  const host = view.getByTestId('widget-visual-host');
  await expect.element(host).toBeVisible();
  if (tipo === 'molecula') await esperarCanvasDibujado(host.element() as HTMLElement);
  await expect(host).toMatchScreenshot(`${nombre}.png`);
}

describe('widgets — línea base visual (T0)', () => {
  test('el registry tiene los 14 widgets', () => {
    for (const tipo of WIDGET_TIPOS) {
      expect(elementRegistry.obtener(tipo), tipo).toBeDefined();
    }
  });

  for (const tipo of WIDGET_TIPOS) {
    describe(tipo, () => {
      test('por defecto', async () => {
        await capturar(tipo, `${tipo}--defecto`);
      });

      for (const preset of presetsDe(tipo)) {
        test(`preset ${preset.id}`, async () => {
          await capturar(tipo, `${tipo}--preset-${preset.id}`, preset.id);
        });
      }
    });
  }
});
