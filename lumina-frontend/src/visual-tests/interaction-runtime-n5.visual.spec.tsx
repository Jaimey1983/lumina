/**
 * N5 — eventos nuevos del motor, probados en un navegador real (los eventos de
 * puntero, teclado y reloj no se pueden comprobar bien en jsdom/node).
 *
 * El runtime se monta con `useInteractionRuntime` y un `SlideRenderer` en modo
 * `preview`; el valor de la variable se lee de lo que devuelve el hook.
 */
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SlideNavContext } from '@lumina/editor-shared/slide-nav-context';
import type { Regla, VariableDef } from '@lumina/types/interaction';
import type { Block, Slide } from '@lumina/types/slide';
import { elementRegistry } from '@/lib/element-registry-bootstrap';
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

function boton(id: string, disparadores: Regla[]): Block {
  const base = elementRegistry.obtener('boton')!.crearPorDefecto() as Block;
  // `accion: 'siguiente'` para que el botón esté habilitado (con `ninguna` se pinta deshabilitado).
  return { ...base, id, disparadores, accion: 'siguiente' } as Block;
}
function slideDe(id: string, bloques: Block[], reglas?: Regla[]): Slide {
  return { id, order: 0, type: 'CONTENT', title: id, bloques, ...(reglas ? { reglas } : {}) } as Slide;
}

function Host({ slides, slideId }: { slides: Slide[]; slideId: string }) {
  const { runtime, slides: listos, estado } = useInteractionRuntime({
    enabled: true,
    slides,
    variables: VARS,
    slideId,
    navigate: () => undefined,
  });
  const actual = listos.find((s) => s.id === slideId)!;
  return (
    <QueryClientProvider client={new QueryClient()}>
      <div data-testid="valor">{String(estado?.variables.v ?? 0)}</div>
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
const mouse = (el: Element, tipo: 'pointerover' | 'pointerout') =>
  el.dispatchEvent(
    new PointerEvent(tipo, { pointerType: 'mouse', bubbles: true, relatedTarget: document.body }),
  );
const espera = (cond: () => boolean) => vi.waitFor(() => expect(cond()).toBe(true), { timeout: 5000 });

async function montar(node: ReactNode) {
  const vista = await render(node);
  await pausa(150);
  return vista;
}

describe('N5 — eventos en navegador real', () => {
  test('tecla: Intro configurada dispara; otra tecla y escribir en un campo no', async () => {
    const s = slideDe('s1', [], [{ id: 'r', evento: 'tecla', parametro: 'Enter', condiciones: [], acciones: suma(), activa: true }]);
    const { container, unmount } = await montar(<Host slides={[s]} slideId="s1" />);
    teclear(window, 'KeyA');
    await pausa(150);
    expect(valor(container)).toBe('0');
    teclear(window, 'Enter');
    await espera(() => valor(container) === '1');
    await unmount();
  });

  test('tecla: se ignora si el foco está en un campo de texto', async () => {
    const s = slideDe('s1', [], [{ id: 'r', evento: 'tecla', parametro: 'KeyA', condiciones: [], acciones: suma(), activa: true }]);
    const { container, unmount } = await montar(
      <>
        <input data-testid="campo" />
        <Host slides={[s]} slideId="s1" />
      </>,
    );
    const campo = container.querySelector('[data-testid="campo"]') as HTMLInputElement;
    teclear(campo, 'KeyA'); // el evento nace en el campo y sube hasta `window`
    await pausa(150);
    expect(valor(container)).toBe('0');
    teclear(document.body, 'KeyA');
    await espera(() => valor(container) === '1');
    await unmount();
  });

  test('temporizador: dispara una sola vez tras N segundos', async () => {
    const s = slideDe('s1', [], [{ id: 'r', evento: 'temporizador', parametro: 1, condiciones: [], acciones: suma(), activa: true }]);
    const { container, unmount } = await montar(<Host slides={[s]} slideId="s1" />);
    expect(valor(container)).toBe('0');
    await espera(() => valor(container) === '1');
    await pausa(1500);
    expect(valor(container)).toBe('1'); // una sola vez
    await unmount();
  });

  test('hover: entra y sale del botón (con anti-rebote)', async () => {
    const b = boton('b1', [
      { id: 'in', evento: 'hover_entra', condiciones: [], acciones: suma(10), activa: true },
      { id: 'out', evento: 'hover_sale', condiciones: [], acciones: suma(100), activa: true },
    ]);
    const { container, unmount } = await montar(<Host slides={[slideDe('s1', [b])]} slideId="s1" />);
    // En el renderer `data-block-id` es el índice del bloque dentro del slide.
    const el = container.querySelector('[data-block-id="0"]') as HTMLElement;
    mouse(el, 'pointerover');
    await espera(() => valor(container) === '10');
    mouse(el, 'pointerout');
    await espera(() => valor(container) === '110');
    // Un parpadeo (sale y entra enseguida) no emite nada.
    mouse(el, 'pointerover');
    await espera(() => valor(container) === '120');
    mouse(el, 'pointerout');
    mouse(el, 'pointerover');
    await pausa(300);
    expect(valor(container)).toBe('120');
    await unmount();
  });

  test('cambio_variable: un clic cambia la variable y una regla la observa', async () => {
    const b = boton('b1', [{ id: 'c', evento: 'clic', condiciones: [], acciones: suma(), activa: true }]);
    const s = slideDe('s1', [b], [{ id: 'obs', evento: 'cambio_variable', parametro: 'v', condiciones: [], acciones: suma(10), activa: true }]);
    const { container, unmount } = await montar(<Host slides={[s]} slideId="s1" />);
    const el = container.querySelector('[data-block-id="0"]') as HTMLElement;
    (el.querySelector('button') as HTMLButtonElement).click();
    await espera(() => valor(container) === '11');
    // 1 por el clic + 10 por la reacción; la reacción cambia `v` otra vez pero el ciclo se corta.
    expect(valor(container)).toBe('11');
    await unmount();
  });
});
