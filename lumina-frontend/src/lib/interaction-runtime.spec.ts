import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { recolectarReglas } from '@lumina/interactions';
import type { Regla } from '@lumina/types/interaction';
import type { Block, Slide } from '@lumina/types/slide';
import type { SlideNavAction } from '@lumina/editor-shared/slide-nav-context';
import {
  REGLA_LEGACY_BOTON,
  REGLA_LEGACY_CONTADOR,
  classSlideToRendererSlide,
  migrarAccionesLegacyARegla,
  sanitizeSlideContentForPersistence,
} from './class-slide-normalize';
import { ejecutarEvento } from './interaction-runtime';

const boton = (extra: Record<string, unknown> = {}): Block =>
  ({ tipo: 'boton', texto: 'Ir', variante: 'primario', accion: 'ninguna', ...extra }) as unknown as Block;
const contador = (extra: Record<string, unknown> = {}): Block =>
  ({ tipo: 'contador', modo: 'temporizador', alTerminar: 'ninguna', ...extra }) as unknown as Block;
const hotspot = (id: string): Block => ({ tipo: 'hotspot', id }) as unknown as Block;
const slide = (id: string, bloques: Block[], extra: Partial<Slide> = {}): Slide =>
  ({ id, order: 0, type: 'CONTENT', title: id, bloques, ...extra }) as Slide;

const idDe = (b: Block | undefined) => (b as { id?: string } | undefined)?.id;
const reglasDe = (b: Block | undefined) =>
  (b as { disparadores?: Regla[] } | undefined)?.disparadores ?? [];

describe('migrarAccionesLegacyARegla (D6)', () => {
  it('Botón siguiente/anterior → regla clic y id determinista', () => {
    const [s] = migrarAccionesLegacyARegla([
      slide('s1', [boton({ accion: 'siguiente' }), boton({ accion: 'anterior' })]),
    ]);
    const [a, b] = s!.bloques!;
    expect(idDe(a)).toBe('s1:b0');
    expect(reglasDe(a)).toEqual([
      { id: REGLA_LEGACY_BOTON, evento: 'clic', condiciones: [], acciones: [{ tipo: 'siguiente' }], activa: true },
    ]);
    expect(reglasDe(b)[0]?.acciones).toEqual([{ tipo: 'anterior' }]);
  });

  it('Botón ir_a → ir_a_slide con el mismo clamp del despacho legado', () => {
    const slides = [slide('s1', [boton({ accion: 'ir_a', slideIndex: 99 })]), slide('s2', []), slide('s3', [])];
    const [s1] = migrarAccionesLegacyARegla(slides);
    expect(reglasDe(s1!.bloques![0])[0]?.acciones).toEqual([{ tipo: 'ir_a_slide', slideId: 's3' }]);
  });

  it('Contador alTerminar siguiente → regla fin_contador', () => {
    const [s] = migrarAccionesLegacyARegla([slide('s1', [contador({ alTerminar: 'siguiente' })])]);
    expect(reglasDe(s!.bloques![0])[0]).toMatchObject({
      id: REGLA_LEGACY_CONTADOR,
      evento: 'fin_contador',
      acciones: [{ tipo: 'siguiente' }],
    });
  });

  it('url / ninguna / alTerminar ninguna no generan reglas ni cambian referencias', () => {
    const slides = [slide('s1', [boton({ accion: 'url' }), boton(), contador()])];
    const out = migrarAccionesLegacyARegla(slides);
    expect(out).toBe(slides);
    expect(recolectarReglas(out)).toEqual([]);
  });

  it('es idempotente y respeta un id existente', () => {
    const slides = [slide('s1', [boton({ id: 'mi-boton', accion: 'siguiente' }), contador({ alTerminar: 'siguiente' })])];
    const una = migrarAccionesLegacyARegla(slides);
    const dos = migrarAccionesLegacyARegla(una);
    expect(dos).toEqual(una);
    expect(dos).toBe(una);
    expect(idDe(una[0]!.bloques![0])).toBe('mi-boton');
    expect(reglasDe(una[0]!.bloques![0])).toHaveLength(1);
  });

  it('conserva los disparadores propios del bloque', () => {
    const propia: Regla = { id: 'x', evento: 'clic', condiciones: [], acciones: [{ tipo: 'anterior' }], activa: true };
    const [s] = migrarAccionesLegacyARegla([
      slide('s1', [boton({ id: 'b', accion: 'siguiente', disparadores: [propia] })]),
    ]);
    expect(reglasDe(s!.bloques![0]).map((r) => r.id)).toEqual(['x', REGLA_LEGACY_BOTON]);
  });

  it('no muta la entrada', () => {
    const slides = [slide('s1', [boton({ accion: 'siguiente' })])];
    const copia = JSON.parse(JSON.stringify(slides));
    migrarAccionesLegacyARegla(slides);
    expect(slides).toEqual(copia);
  });
});

describe('normalización conserva los campos del motor (no se pierden al leer ni al guardar)', () => {
  const regla: Regla = { id: 'r1', evento: 'clic', condiciones: [], acciones: [{ tipo: 'siguiente' }], activa: true };
  const api = (bloques: unknown[]): ApiSlide =>
    ({ id: 's', order: 0, type: 'CONTENT', title: 't', content: { bloques, reglas: [regla] } }) as unknown as ApiSlide;

  it('id/disparadores/estado de un widget sobreviven y Slide.reglas pasa', () => {
    const s = classSlideToRendererSlide(
      api([{ tipo: 'boton', texto: 'a', variante: 'primario', id: 'btn', disparadores: [regla], estado: 'visitado' }]),
    );
    const b = s.bloques![0] as unknown as Record<string, unknown>;
    expect(b.id).toBe('btn');
    expect(b.disparadores).toEqual([regla]);
    expect(b.estado).toBe('visitado');
    expect(s.reglas).toEqual([regla]);
  });

  it('también al persistir', () => {
    const out = sanitizeSlideContentForPersistence({
      bloques: [{ tipo: 'contador', modo: 'temporizador', id: 'c', disparadores: [regla] }],
    });
    const b = (out!.bloques as Record<string, unknown>[])[0]!;
    expect(b.id).toBe('c');
    expect(b.disparadores).toEqual([regla]);
  });

  it('animaciones, canvasLocked y rotacion también sobreviven (leer, guardar y dentro de columnas)', () => {
    const comunes = { animaciones: [{ id: 'a' }], canvasLocked: true, rotacion: 33 };
    const tipos: Record<string, unknown>[] = [
      { tipo: 'boton', texto: 'x', variante: 'primario' },
      { tipo: 'contador', modo: 'temporizador' },
      { tipo: 'progreso' },
      { tipo: 'tooltip' },
      { tipo: 'hotspot' },
      { tipo: 'popup' },
      { tipo: 'ruleta' },
      { tipo: 'grafico' },
      { tipo: 'diagrama' },
      { tipo: 'actividad', actividad: { tipo: 'ruleta' } },
    ];
    const bloques = tipos.map((t) => ({ ...t, ...comunes }));
    const leidos = classSlideToRendererSlide(api(bloques)).bloques!;
    const guardados = sanitizeSlideContentForPersistence({ bloques })!.bloques as unknown[];
    for (const lista of [leidos, guardados]) {
      lista.forEach((b, i) => {
        expect(b, String(tipos[i]!.tipo)).toMatchObject(comunes);
      });
    }
    const [col] = classSlideToRendererSlide(
      api([{ tipo: 'columnas', columnas: [[{ tipo: 'boton', texto: 'y', variante: 'primario', ...comunes }]] }]),
    ).bloques!;
    expect((col as unknown as { columnas: unknown[][] }).columnas[0]![0]).toMatchObject(comunes);
  });

  it('un bloque sin campos del motor no los gana', () => {
    const s = classSlideToRendererSlide(api([{ tipo: 'boton', texto: 'a', variante: 'primario' }]));
    expect(s.bloques![0]).not.toHaveProperty('id');
    expect(s.bloques![0]).not.toHaveProperty('disparadores');
  });
});

describe('ejecutarEvento (runtime)', () => {
  const slides = migrarAccionesLegacyARegla([
    slide('s1', [boton({ accion: 'ir_a', slideIndex: 2 }), hotspot('h1')]),
    slide('s2', [boton({ accion: 'siguiente' })]),
    slide('s3', []),
  ]);
  const reglas = recolectarReglas(slides);
  const idBoton = idDe(slides[0]!.bloques![0])!;

  it('clic en un botón con ir_a navega a ese slide', () => {
    const navigate = vi.fn<(a: SlideNavAction) => void>();
    ejecutarEvento({ reglas, estado: null, variables: [], slides, evento: { tipo: 'clic', bloqueId: idBoton, slideId: 's1' }, navigate });
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith({ kind: 'ir_a', index: 2 });
  });

  it('visitado de un hotspot actualiza su estado de objeto', () => {
    const estado = ejecutarEvento({ reglas, estado: null, variables: [], slides, evento: { tipo: 'visitado', bloqueId: 'h1', slideId: 's1' }, navigate: null });
    expect(estado.estados.h1).toBe('visitado');
  });

  it('D1: sin navigate (vivo / presentación) no navega, aunque la regla coincida', () => {
    const estado = ejecutarEvento({ reglas, estado: null, variables: [], slides, evento: { tipo: 'clic', bloqueId: idBoton, slideId: 's1' }, navigate: null });
    expect(estado).toBeDefined();
  });

  it('C2/C3: reintentar o saltar solo navega — sin red, sin notas, sin claves de puntaje', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('el runtime no debe usar la red');
    });
    const navigate = vi.fn<(a: SlideNavAction) => void>();
    let estado = null as ReturnType<typeof ejecutarEvento> | null;
    // Reintento: el mismo clic cinco veces; salto: s1 → s3 sin pasar por s2.
    for (let i = 0; i < 5; i += 1) {
      estado = ejecutarEvento({ reglas, estado, variables: [], slides, evento: { tipo: 'clic', bloqueId: idBoton, slideId: 's1' }, navigate });
    }
    expect(navigate.mock.calls.every(([a]) => a.kind === 'ir_a' && a.index === 2)).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(Object.keys(estado!).sort()).toEqual(['capasAbiertas', 'estados', 'respuestas', 'variables', 'visibles']);
    expect(JSON.stringify(estado)).not.toMatch(/score|nota|puntaje/i);
    fetchSpy.mockRestore();
  });
});

describe('C1/C4: el runtime no conoce la nota ni la red', () => {
  for (const archivo of ['src/hooks/use-interaction-runtime.ts', 'src/lib/interaction-runtime.ts']) {
    it(`${archivo} no importa scoring, API, fetch ni socket`, () => {
      const src = readFileSync(join(process.cwd(), archivo), 'utf8');
      const sinComentarios = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(sinComentarios).not.toMatch(/@lumina\/scoring|@\/lib\/api|\bfetch\(|socket|useMutation|useSaveProgress/);
    });
  }
});
