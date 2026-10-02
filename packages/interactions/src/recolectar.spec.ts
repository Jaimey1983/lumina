import { describe, expect, it } from 'vitest';
import { crearEstadoInicial, entrarASlide } from './estado.js';
import { contextoDesdeSlides, recolectarReglas } from './recolectar.js';
import { bloque, num, regla, slide } from './prueba-utils.js';

const r = (id: string) => regla(id, 'clic', [{ tipo: 'siguiente' }]);

describe('recolectarReglas', () => {
  it('orden fijo por slide: reglas del slide, bloques, bloques de capas', () => {
    const slides = [
      slide('s1', {
        reglas: [r('slide-1')],
        bloques: [
          bloque('a', { disparadores: [r('a-1'), r('a-2')] }),
          bloque('b', { disparadores: [r('b-1')] }),
        ],
        capas: [
          { id: 'c', nombre: 'Capa', bloques: [bloque('x', { disparadores: [r('x-1')] })] },
        ],
      }),
      slide('s2', { reglas: [r('slide-2')] }),
    ];
    const salida = recolectarReglas(slides);
    expect(salida.map((x) => x.regla.id)).toEqual([
      'slide-1', 'a-1', 'a-2', 'b-1', 'x-1', 'slide-2',
    ]);
    expect(salida[1]?.origen).toEqual({ tipo: 'bloque', bloqueId: 'a', slideId: 's1' });
    expect(salida[0]?.origen).toEqual({ tipo: 'slide', slideId: 's1' });
    // Una regla de un bloque de capa reacciona a ese bloque, dentro de su slide.
    expect(salida[4]?.origen).toEqual({ tipo: 'bloque', bloqueId: 'x', slideId: 's1' });
  });

  it('un bloque SIN id no puede ser dueño de reglas: se ignoran, sin adivinar', () => {
    const salida = recolectarReglas([
      slide('s1', { bloques: [bloque(undefined, { disparadores: [r('huerfana')] })] }),
    ]);
    expect(salida).toEqual([]);
  });

  it('slides sin reglas ni bloques no rompen', () => {
    expect(recolectarReglas([slide('s1')])).toEqual([]);
  });
});

describe('contextoDesdeSlides', () => {
  it('junta ids de slides, bloques (incluidos los de capas) y capas', () => {
    const ctx = contextoDesdeSlides(
      [num('n')],
      [
        slide('s1', {
          bloques: [bloque('a'), bloque(undefined)],
          capas: [{ id: 'c1', nombre: 'C', bloques: [bloque('x')] }],
        }),
        slide('s2'),
      ],
    );
    expect([...ctx.slideIds].sort()).toEqual(['s1', 's2']);
    expect([...ctx.bloqueIds].sort()).toEqual(['a', 'x']);
    expect([...ctx.capaIds]).toEqual(['c1']);
  });
});

describe('crearEstadoInicial con slides', () => {
  it('toma Block.estado y las capas visibleInicial', () => {
    const e = crearEstadoInicial(
      [num('n', 4)],
      [
        slide('s1', {
          bloques: [bloque('a', { estado: 'deshabilitado' }), bloque('b'), bloque('c', { estado: 'normal' })],
          capas: [
            { id: 'abierta', nombre: 'A', visibleInicial: true, bloques: [bloque('x', { estado: 'visitado' })] },
            { id: 'cerrada', nombre: 'B', bloques: [] },
          ],
        }),
      ],
    );
    expect(e.variables).toEqual({ n: 4 });
    expect(e.estados).toEqual({ a: 'deshabilitado', x: 'visitado' });
    expect(e.capasAbiertas).toEqual(['abierta']);
  });

  it('un valorInicial incoherente se reemplaza por el neutro del tipo', () => {
    const e = crearEstadoInicial([
      { id: 'n', nombre: 'n', tipo: 'numero', valorInicial: 'x' },
      { id: 't', nombre: 't', tipo: 'texto', valorInicial: 3 },
      { id: 'b', nombre: 'b', tipo: 'booleano', valorInicial: 'si' },
    ]);
    expect(e.variables).toEqual({ n: 0, t: '', b: false });
  });

  it('siembra ocultoInicial del slide, de la capa y de los hijos de columnas', () => {
    const e = crearEstadoInicial(
      [],
      [
        slide('s1', {
          bloques: [
            bloque('visible'),
            bloque('pista', { ocultoInicial: true }),
            bloque('cols', {
              tipo: 'columnas',
              columnas: [[bloque('hijo', { ocultoInicial: true })]],
            }),
          ],
          capas: [
            {
              id: 'abierta',
              nombre: 'A',
              visibleInicial: true,
              bloques: [bloque('en-capa', { ocultoInicial: true })],
            },
          ],
        }),
      ],
    );
    expect(e.visibles.pista).toBe(false);
    expect(e.visibles.hijo).toBe(false);
    expect(e.visibles['en-capa']).toBe(false);
    expect(e.visibles).not.toHaveProperty('visible');
    expect(e.capasAbiertas).toEqual(['abierta']);
  });

  it('no pisa un visibles que una acción ya escribió', () => {
    const s = slide('s1', { bloques: [bloque('pista', { ocultoInicial: true })] });
    const base = crearEstadoInicial([], [s]);
    const tocado = { ...base, visibles: { ...base.visibles, pista: true } };
    expect(entrarASlide(tocado, s).visibles.pista).toBe(true);
  });

  it('K5: un estado restaurado no se reabre al entrar de nuevo', () => {
    const s = slide('s1', {
      bloques: [bloque('pista', { ocultoInicial: true })],
      capas: [{ id: 'abierta', nombre: 'A', visibleInicial: true, bloques: [] }],
    });
    const inicial = crearEstadoInicial([], [s]);
    const restaurado = {
      ...inicial,
      visibles: { ...inicial.visibles, pista: true },
      capasAbiertas: [] as string[],
    };
    const otra = entrarASlide(restaurado, s);
    expect(otra.visibles.pista).toBe(true);
    expect(otra.capasAbiertas).toEqual([]);
  });

  it('la primera entrada siembra y la segunda no reabre una capa cerrada', () => {
    const s = slide('s1', {
      bloques: [bloque('pista', { ocultoInicial: true })],
      capas: [{ id: 'abierta', nombre: 'A', visibleInicial: true, bloques: [] }],
    });
    const primera = entrarASlide(crearEstadoInicial([]), s);
    expect(primera.visibles.pista).toBe(false);
    expect(primera.capasAbiertas).toEqual(['abierta']);
    const segunda = entrarASlide({ ...primera, capasAbiertas: [] }, s);
    expect(segunda.capasAbiertas).toEqual([]);
    expect(segunda.visibles.pista).toBe(false);
  });
});
