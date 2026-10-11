/**
 * T15 — posición real de la burbuja del Hotspot en un navegador (no jsdom): en cada borde y
 * esquina del slide, y con el canvas a distinto zoom (`transform: scale`), la burbuja abierta
 * tiene que quedar dentro del `.canvas-slide`. Se mide con `getBoundingClientRect`, no con
 * capturas: el resultado no depende del dibujo, solo de la geometría.
 */
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { pedirOverlay } from '@lumina/element-kit/widgets/abrir-overlay';
import { elementRegistry } from '@/lib/element-registry-bootstrap';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'clase-1' }),
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => '/classes/clase-1/editor',
  useSearchParams: () => new URLSearchParams(),
}));

const ANCHO = 640;
const ALTO = 360;
const MARGEN = 4;

type Pos = { nombre: string; x: number; y: number };

const POSICIONES: Pos[] = [
  { nombre: 'centro', x: 300, y: 160 },
  { nombre: 'borde izquierdo', x: 0, y: 160 },
  { nombre: 'borde derecho', x: 622, y: 160 },
  { nombre: 'borde superior', x: 300, y: 0 },
  { nombre: 'borde inferior', x: 300, y: 342 },
  { nombre: 'esquina superior izquierda', x: 0, y: 0 },
  { nombre: 'esquina inferior derecha', x: 622, y: 342 },
];

async function abrirYMedir(pos: Pos, escala: number, posicionBurbuja: string) {
  const def = elementRegistry.obtener('hotspot');
  if (!def) throw new Error('sin hotspot en el registry');
  const Viewer = def.Viewer;
  const estado = def.crearPorDefecto() as Record<string, unknown> & {
    configuracion: Record<string, unknown>;
  };
  estado.configuracion = { ...estado.configuracion, posicionBurbuja, triggerEvento: 'click' };
  const id = `h-${pos.nombre}-${escala}-${posicionBurbuja}`;

  const view = await render(
    <div style={{ padding: 40, background: '#e2e8f0', width: ANCHO * 1.5, height: ALTO * 1.5 }}>
      {/* El proyecto visual no carga Tailwind: las tres utilidades que usa el visor del Hotspot. */}
      <style>{'.h-full{height:100%}.w-full{width:100%}.relative{position:relative}'}</style>
      <div
        className="canvas-slide"
        data-testid="slide"
        style={{
          position: 'relative',
          width: ANCHO,
          height: ALTO,
          background: '#fff',
          transform: `scale(${escala})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Del tamaño del marcador (16 px): así el disparador y la raíz del Hotspot coinciden. */}
        <div style={{ position: 'absolute', left: pos.x, top: pos.y, width: 16, height: 16 }}>
          <Viewer estado={estado} config={{ bloqueId: id }} />
        </div>
      </div>
    </div>,
  );
  pedirOverlay(id);
  const slide = view.getByTestId('slide').element() as HTMLElement;
  let burbuja: HTMLElement | null = null;
  await vi.waitFor(
    () => {
      burbuja = slide.querySelector<HTMLElement>('[role="dialog"]');
      if (!burbuja || getComputedStyle(burbuja).display === 'none') throw new Error('aún cerrada');
    },
    { timeout: 5_000 },
  );
  // Floating UI calcula tras abrir y la burbuja entra con una animación de 0,3 s: se espera a que
  // se asiente para medir la posición final y no un fotograma intermedio.
  await new Promise((r) => setTimeout(r, 500));
  return { slide: slide.getBoundingClientRect(), burbuja: (burbuja as unknown as HTMLElement).getBoundingClientRect() };
}

describe('Hotspot — la burbuja abierta queda dentro del slide', () => {
  for (const escala of [1, 0.6, 1.4]) {
    for (const lado of ['auto', 'abajo', 'derecha']) {
      for (const pos of POSICIONES) {
        test(`${pos.nombre} · zoom ${escala * 100}% · lado ${lado}`, async () => {
          const { slide, burbuja } = await abrirYMedir(pos, escala, lado);
          const margen = MARGEN * escala - 1.5; // tolerancia de subpíxeles
          // Con un lado explícito la burbuja solo se desplaza en el eje ortogonal: lo que
          // sobresalga en el eje del lado elegido no es un fallo (no cambia de lado).
          const ejeLibre = lado === 'abajo' ? 'vertical' : lado === 'derecha' ? 'horizontal' : null;
          if (ejeLibre !== 'horizontal') {
            expect(burbuja.left).toBeGreaterThanOrEqual(slide.left + margen);
            expect(burbuja.right).toBeLessThanOrEqual(slide.right - margen);
          }
          if (ejeLibre !== 'vertical') {
            expect(burbuja.top).toBeGreaterThanOrEqual(slide.top + margen);
            expect(burbuja.bottom).toBeLessThanOrEqual(slide.bottom - margen);
          }
        });
      }
    }
  }
});
