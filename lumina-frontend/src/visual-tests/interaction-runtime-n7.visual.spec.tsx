/**
 * N7 — variables del sistema de solo lectura, probadas en un navegador real
 * (la visibilidad de la pestaña y los relojes no se comprueban bien en jsdom).
 *
 * El runtime se monta con `useInteractionRuntime`; el valor de la variable se lee
 * de lo que devuelve el hook.
 */
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SlideNavContext } from '@lumina/editor-shared/slide-nav-context';
import type { Regla, VariableDef } from '@lumina/types/interaction';
import type { Block, Slide } from '@lumina/types/slide';
import { useInteractionRuntime } from '@/hooks/use-interaction-runtime';
import { SlideRenderer } from '@/app/(app)/classes/[id]/editor/components/slide-renderer';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'clase-1' }),
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => '/classes/clase-1/preview',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/api', () => ({
  api: { interceptors: { request: { use: () => undefined }, response: { use: () => undefined } } },
}));
vi.mock('@/hooks/api/use-classes', () => ({
  useUpdateSlide: () => ({ mutate: () => undefined, isPending: false }),
}));

const VARS: VariableDef[] = [{ id: 'v', nombre: 'v', tipo: 'numero', valorInicial: 0 }];
const suma = (n = 1): Regla['acciones'] => [{ tipo: 'sumar_variable', variableId: 'v', cantidad: n }];

function slideDe(id: string, bloques: Block[], reglas?: Regla[]): Slide {
  return { id, order: 0, type: 'CONTENT', title: id, bloques, ...(reglas ? { reglas } : {}) } as Slide;
}

function Host({
  slides,
  slideId,
  estadoInicial,
  simulado,
}: {
  slides: Slide[];
  slideId: string;
  estadoInicial?: unknown;
  simulado?: boolean;
}) {
  const { runtime, slides: listos, estado, sistemaSimulado } = useInteractionRuntime({
    enabled: true,
    slides,
    variables: VARS,
    slideId,
    navigate: () => undefined,
    estadoInicial,
    ...(simulado ? { simulado: true } : {}),
  });
  const actual = listos.find((s) => s.id === slideId)!;
  return (
    <QueryClientProvider client={new QueryClient()}>
      <div data-testid="valor">{String(estado?.variables.v ?? 0)}</div>
      <div data-testid="simulado">{String(sistemaSimulado)}</div>
      <SlideNavContext.Provider value={{ navigate: () => undefined, slideCount: slides.length, slideIndex: 0 }}>
        <div style={{ width: 800, height: 450, position: 'relative' }}>
          <SlideRenderer modo="preview" slide={actual} runtime={runtime} />
        </div>
      </SlideNavContext.Provider>
    </QueryClientProvider>
  );
}

const valor = (c: HTMLElement) => c.querySelector('[data-testid="valor"]')!.textContent;
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));
/**
 * Eventos DOM reales (no del sistema operativo): los archivos visuales corren en
 * paralelo en páginas distintas y el foco / los relojes de una página en segundo
 * plano no son fiables. Despachar el evento en el DOM prueba lo mismo — los
 * manejadores del runtime — sin depender de qué iframe tiene el foco.
 */
const teclear = (objetivo: EventTarget, code: string) =>
  objetivo.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
const espera = (cond: () => boolean) => vi.waitFor(() => expect(cond()).toBe(true), { timeout: 5000 });

async function montar(node: ReactNode) {
  const vista = await render(node);
  await pausa(150);
  return vista;
}


const sis = (clave: string) => ({ tipo: 'sistema', clave }) as never;
const lit = (valor: number) => ({ tipo: 'literal', valor }) as never;
const cmp = (clave: string, operador: '==' | '>=', derecha: unknown) =>
  ({ tipo: 'comparacion', operador, izquierda: sis(clave), derecha }) as never;

function ocultarPestana(oculta: boolean) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (oculta ? 'hidden' : 'visible') });
}

describe('N7 — variables del sistema en navegador real', () => {
  test('slide_numero == slide_total dispara solo en el último slide', async () => {
    const regla: Regla = {
      id: 'ultimo',
      evento: 'al_entrar_slide',
      condiciones: [cmp('slide_numero', '==', sis('slide_total'))],
      acciones: suma(),
      activa: true,
    };
    const slides = [slideDe('s1', [], [regla]), slideDe('s2', [], [regla])];
    const { container, rerender, unmount } = await montar(<Host slides={slides} slideId="s1" />);
    await pausa(150);
    expect(valor(container)).toBe('0');
    await rerender(<Host slides={slides} slideId="s2" />);
    await espera(() => valor(container) === '1');
    await unmount();
  });

  test('tiempo_s no cuenta el tiempo con la pestaña oculta', async () => {
    const regla: Regla = {
      id: 'un-segundo',
      evento: 'temporizador',
      parametro: 1,
      condiciones: [cmp('tiempo_s', '>=', lit(1))],
      acciones: suma(),
      activa: true,
    };
    ocultarPestana(true);
    try {
      const oculto = await montar(<Host slides={[slideDe('s1', [], [regla])]} slideId="s1" />);
      await pausa(1500); // el reloj del temporizador corre, pero el tiempo ACTIVO es 0
      expect(valor(oculto.container)).toBe('0');
      await oculto.unmount();
    } finally {
      ocultarPestana(false);
    }
    const visible = await montar(<Host slides={[slideDe('s1', [], [regla])]} slideId="s1" />);
    await espera(() => valor(visible.container) === '1');
    await visible.unmount();
  });

  test('tras recargar, el tiempo sale del estado persistido (no vuelve a cero)', async () => {
    const regla: Regla = {
      id: 'tiempo-largo',
      evento: 'tecla',
      parametro: 'KeyA',
      condiciones: [cmp('tiempo_s', '>=', lit(100))],
      acciones: suma(),
      activa: true,
    };
    const slides = [slideDe('s1', [], [regla])];
    const nuevo = await montar(<Host slides={slides} slideId="s1" />);
    teclear(window, 'KeyA');
    await pausa(200);
    expect(valor(nuevo.container)).toBe('0');
    await nuevo.unmount();

    const recargado = await montar(
      <Host slides={slides} slideId="s1" estadoInicial={{ visibles: { '\u001d150': true } }} />,
    );
    teclear(window, 'KeyA');
    await espera(() => valor(recargado.container) === '1');
    await recargado.unmount();
  });

  test('la vista previa se declara simulada; el autónomo no', async () => {
    const slides = [slideDe('s1', [], [])];
    const prev = await montar(<Host slides={slides} slideId="s1" simulado />);
    expect(prev.container.querySelector('[data-testid="simulado"]')!.textContent).toBe('true');
    await prev.unmount();
    const real = await montar(<Host slides={slides} slideId="s1" />);
    expect(real.container.querySelector('[data-testid="simulado"]')!.textContent).toBe('false');
    await real.unmount();
  });
});
