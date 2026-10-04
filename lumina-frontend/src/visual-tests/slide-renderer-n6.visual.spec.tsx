/**
 * N6 — apariencia por estado de objeto, en un navegador real.
 *
 * Con runtime (preview) el contenedor del bloque toma la apariencia de su estado
 * y de hover/presionado; en `editor` y en miniatura el HTML es idéntico al del
 * mismo slide sin apariencias. Los punteros se despachan sobre el DOM (como en
 * el visual de N5): el ratón del sistema no es fiable con archivos en paralelo.
 */
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import type { Block, Slide } from '@lumina/types/slide';
import { elementRegistry } from '@/lib/element-registry-bootstrap';
import type { SlideInteractionRuntime } from '@/hooks/use-interaction-runtime';
import { SlideRenderer } from '@/app/(app)/classes/[id]/editor/components/slide-renderer';
import { normalizeRenderedHtml } from './canvas-blocks-fixture';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'clase-1' }),
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => '/classes/clase-1/editor',
  useSearchParams: () => new URLSearchParams(),
}));

// El reproductor importa `useUpdateSlide`, que arrastra `api.ts` (`process.env`).
// En el browser de Vitest no hay `process`. El spec no persiste slides.
vi.mock('@/lib/api', () => ({
  api: {
    interceptors: {
      request: { use: () => undefined },
      response: { use: () => undefined },
    },
  },
}));

vi.mock('@/hooks/api/use-classes', () => ({
  useUpdateSlide: () => ({ mutate: () => undefined, isPending: false }),
}));

function texto(id: string, contenido: string): Block {
  const base = elementRegistry.obtener('texto')!.crearPorDefecto();
  if (typeof base !== 'object' || base === null || !('tipo' in base)) {
    throw new Error('crearPorDefecto de texto no devolvió un bloque');
  }
  const bloque = base as Block;
  if (bloque.tipo !== 'texto') {
    throw new Error('crearPorDefecto de texto no devolvió un bloque de texto');
  }
  return { ...bloque, id, contenido };
}

function slideDe(bloques: Block[], capas?: Slide['capas']): Slide {
  return {
    id: 's1',
    order: 0,
    type: 'CONTENT',
    title: 't',
    bloques,
    capas,
  };
}

function runtimeDe(parcial: Partial<SlideInteractionRuntime>): SlideInteractionRuntime {
  return {
    emitir: () => undefined,
    estadoDe: () => undefined,
    visibles: {},
    capasAbiertas: [],
    cerrarCapa: () => undefined,
    ...parcial,
  };
}

function Host({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <div data-testid="canvas-host" style={{ width: 800, height: 450, position: 'relative' }}>
        {children}
      </div>
    </QueryClientProvider>
  );
}

async function htmlDe(node: ReactNode): Promise<string> {
  const view = await render(<Host>{node}</Host>);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
  await new Promise((r) => setTimeout(r, 300));
  const el = view.container.querySelector('[data-testid="canvas-host"]') as HTMLElement;
  const html = normalizeRenderedHtml(el.innerHTML);
  await view.unmount();
  return html;
}


const APARIENCIAS = {
  normal: { fondo: '#111111' },
  hover: { fondo: '#ff0000', escala: 1.1 },
  down: { fondo: '#00ff00', escala: 0.9 },
  visitado: { opacidad: 0.6 },
} as const;

const conEstados = (): Block =>
  ({
    ...texto('t1', 'HOLA-N6'),
    apariencias: APARIENCIAS,
    estadosPersonalizados: [{ id: 'ok', nombre: 'Correcto', apariencia: { fondo: '#16a34a', brillo: 1.2 } }],
  }) as Block;

const sinEstados = (): Block => texto('t1', 'HOLA-N6');

function contenedor(host: HTMLElement): HTMLElement {
  const nodo = Array.from(host.querySelectorAll('div')).find((d) => d.textContent === 'HOLA-N6' && d.style.pointerEvents === 'auto');
  const el = nodo?.closest('[style*="pointer-events"]') ?? nodo;
  if (!el) throw new Error('no se encontró el contenedor del bloque');
  return el as HTMLElement;
}

async function montar(node: ReactNode) {
  const view = await render(<Host>{node}</Host>);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
  await new Promise((r) => setTimeout(r, 200));
  return view;
}

/** React sintetiza `onPointerEnter/Leave` desde `pointerover/out`: se despachan esos. */
function puntero(el: Element, tipo: 'entra' | 'sale' | 'pointerdown' | 'pointerup') {
  const real = tipo === 'entra' ? 'pointerover' : tipo === 'sale' ? 'pointerout' : tipo;
  el.dispatchEvent(new PointerEvent(real, { pointerType: 'mouse', bubbles: true, relatedTarget: null }));
}

describe('N6 — apariencia por estado', () => {
  test('preview aplica la apariencia del estado actual (base y personalizado)', async () => {
    const slide = slideDe([conEstados()]);
    const normal = await montar(<SlideRenderer modo="preview" slide={slide} runtime={runtimeDe({})} />);
    expect(contenedor(normal.container).style.backgroundColor).toBe('rgb(17, 17, 17)');
    await normal.unmount();

    const visitado = await montar(
      <SlideRenderer modo="preview" slide={slide} runtime={runtimeDe({ estadoDe: () => 'visitado' })} />,
    );
    const v = contenedor(visitado.container);
    expect(v.style.opacity).toBe('0.6');
    expect(v.style.backgroundColor).not.toBe('rgb(17, 17, 17)');
    await visitado.unmount();

    const ok = await montar(
      <SlideRenderer modo="preview" slide={slide} runtime={runtimeDe({ estadoDe: () => 'ok' })} />,
    );
    const o = contenedor(ok.container);
    expect(o.style.backgroundColor).toBe('rgb(22, 163, 74)');
    expect(o.style.filter).toBe('brightness(1.2)');
    await ok.unmount();
  });

  test('hover y presionado se aplican y se retiran; la escala no pisa transform', async () => {
    const view = await montar(
      <SlideRenderer modo="preview" slide={slideDe([conEstados()])} runtime={runtimeDe({})} />,
    );
    const el = contenedor(view.container);
    puntero(el, 'entra');
    await new Promise((r) => setTimeout(r, 50));
    expect(contenedor(view.container).style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(contenedor(view.container).style.scale).toBe('1.1');
    puntero(el, 'pointerdown');
    await new Promise((r) => setTimeout(r, 50));
    expect(contenedor(view.container).style.backgroundColor).toBe('rgb(0, 255, 0)');
    expect(contenedor(view.container).style.scale).toBe('0.9');
    puntero(el, 'pointerup');
    puntero(el, 'sale');
    await new Promise((r) => setTimeout(r, 50));
    expect(contenedor(view.container).style.backgroundColor).toBe('rgb(17, 17, 17)');
    expect(contenedor(view.container).style.scale).toBe('');
    await view.unmount();
  });

  test('editor y miniatura rinden EXACTAMENTE igual que sin apariencias', async () => {
    for (const props of [{ modo: 'editor' as const }, { modo: 'preview' as const, isThumbnail: true }]) {
      const con = await htmlDe(<SlideRenderer {...props} slide={slideDe([conEstados()])} runtime={runtimeDe({})} />);
      const sin = await htmlDe(<SlideRenderer {...props} slide={slideDe([sinEstados()])} runtime={runtimeDe({})} />);
      expect(con).toBe(sin);
    }
  });

  test('sin runtime (presentación / clase en vivo) tampoco se aplica nada', async () => {
    const con = await htmlDe(<SlideRenderer modo="viewer" slide={slideDe([conEstados()])} />);
    const sin = await htmlDe(<SlideRenderer modo="viewer" slide={slideDe([sinEstados()])} />);
    expect(con).toBe(sin);
  });
});
