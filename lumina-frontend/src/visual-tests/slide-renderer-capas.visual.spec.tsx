/**
 * K8a — red de seguridad del reproductor de capas.
 *
 * En `editor` (y sin runtime) una capa abierta en el estado del motor no se
 * pinta: el HTML coincide con el mismo slide sin runtime. En `preview` sí.
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

describe('K8a — capas solo en modos con runtime', () => {
  const slide = slideDe(
    [texto('base', 'BASE-VISIBLE')],
    [{ id: 'c1', nombre: 'Pista', modal: true, bloques: [texto('pista', 'CAPA-SECRETA')] }],
  );
  const runtime = runtimeDe({ capasAbiertas: ['c1'] });

  test('editor con capa abierta rinde igual que editor sin runtime', async () => {
    const conRuntime = await htmlDe(<SlideRenderer modo="editor" slide={slide} runtime={runtime} />);
    const sinRuntime = await htmlDe(<SlideRenderer modo="editor" slide={slide} />);
    expect(conRuntime).not.toContain('CAPA-SECRETA');
    expect(conRuntime).not.toContain('role="dialog"');
    expect(conRuntime).toBe(sinRuntime);
  });

  test('preview pinta la capa abierta y omite el bloque oculto', async () => {
    const abierto = await htmlDe(<SlideRenderer modo="preview" slide={slide} runtime={runtime} />);
    expect(abierto).toContain('CAPA-SECRETA');
    expect(abierto).toContain('role="dialog"');

    const oculto = slideDe([texto('base', 'BASE-OCULTA')]);
    const html = await htmlDe(
      <SlideRenderer
        modo="preview"
        slide={oculto}
        runtime={runtimeDe({ visibles: { base: false } })}
      />,
    );
    expect(html).not.toContain('BASE-OCULTA');
  });
});
