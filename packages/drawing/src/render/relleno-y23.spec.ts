import { describe, expect, it } from 'vitest';

import { normalizarEscena } from '../normalizar.js';
import type { Escena } from '../tipos.js';
import { escenaANodos, escenaASvg, type NodoSvg } from './render.js';

// Valores escritos como literales (no con las constantes del código): una mutación de una constante tiene que romper una prueba.

const escena = (elementos: unknown[]): Escena => normalizarEscena({ ancho: 800, alto: 600, fondo: null, elementos });
const forma = (id: string, estilo: unknown) => ({ tipo: 'forma', id, forma: 'rectangulo', transformacion: { x: 100, y: 50, ancho: 200, alto: 100, rotacion: 0 }, estilo });

function buscar(nodos: NodoSvg[], tag: string): NodoSvg[] {
  return nodos.flatMap((n) => [...(n.tag === tag ? [n] : []), ...buscar(n.hijos ?? [], tag)]);
}
const defs = (e: Escena, opciones = {}): NodoSvg[] => buscar(escenaANodos(e, opciones).nodos, 'defs')[0]?.hijos ?? [];
const rellenoDe = (e: Escena, opciones = {}): string => String(buscar(escenaANodos(e, opciones).nodos, 'path')[0]?.attrs.fill ?? buscar(escenaANodos(e, opciones).nodos, 'rect')[0]?.attrs.fill);

const DEGRADADO = { tipo: 'degradado', desde: '#FFFFFF', hasta: '#000000', angulo: 90 };

describe('degradado radial', () => {
  const e = escena([forma('a', { relleno: { ...DEGRADADO, forma: 'radial' } })]);

  it('define un radialGradient centrado, con el color «desde» en el centro y «hasta» en el borde', () => {
    const [g] = defs(e, { prefijoIds: 'p' });
    expect(g).toEqual({
      tag: 'radialGradient',
      attrs: { id: 'p-degradado-1', cx: 0.5, cy: 0.5, r: 0.5 },
      hijos: [
        { tag: 'stop', attrs: { offset: 0, 'stop-color': '#FFFFFF' } },
        { tag: 'stop', attrs: { offset: 1, 'stop-color': '#000000' } },
      ],
    });
  });

  it('la forma lo usa como relleno', () => {
    expect(rellenoDe(e, { prefijoIds: 'p' })).toBe('url(#p-degradado-1)');
  });

  it('no emite un linearGradient', () => {
    expect(buscar(escenaANodos(e).nodos, 'linearGradient')).toEqual([]);
  });
});

describe('paradas intermedias', () => {
  const paradas = [{ posicion: 0.3, color: '#FF0000' }, { posicion: 0.7, color: 'var(--primary)' }];

  it('en lineal salen entre las dos de siempre, en orden y con su offset', () => {
    const [g] = defs(escena([forma('a', { relleno: { ...DEGRADADO, angulo: 0, paradas } })]), { modo: 'claro' });
    expect(g?.tag).toBe('linearGradient');
    expect(g?.attrs).toMatchObject({ x1: 0, y1: 0.5, x2: 1, y2: 0.5 });
    expect((g?.hijos ?? []).map((s) => [s.attrs.offset, s.attrs['stop-color']])).toEqual([
      [0, '#FFFFFF'],
      [0.3, '#FF0000'],
      [0.7, '#2563EB'],
      [1, '#000000'],
    ]);
  });

  it('en radial también', () => {
    const [g] = defs(escena([forma('a', { relleno: { ...DEGRADADO, forma: 'radial', paradas } })]), { modo: 'oscuro' });
    expect(g?.tag).toBe('radialGradient');
    expect((g?.hijos ?? []).map((s) => [s.attrs.offset, s.attrs['stop-color']])).toEqual([
      [0, '#FFFFFF'],
      [0.3, '#FF0000'],
      [0.7, '#60A5FA'],
      [1, '#000000'],
    ]);
  });

  it('un degradado sin paradas es el de siempre: dos stops y el mismo gradiente lineal', () => {
    const [g] = defs(escena([forma('a', { relleno: { ...DEGRADADO, angulo: 90 } })]), { prefijoIds: 'p' });
    expect(g).toEqual({
      tag: 'linearGradient',
      attrs: { id: 'p-degradado-1', x1: 0.5, y1: 0, x2: 0.5, y2: 1 },
      hijos: [
        { tag: 'stop', attrs: { offset: 0, 'stop-color': '#FFFFFF' } },
        { tag: 'stop', attrs: { offset: 1, 'stop-color': '#000000' } },
      ],
    });
  });

  it('ningún degradado aplica el alfa de sus colores (DY32): ni los extremos ni las paradas, lineal o radial', () => {
    for (const forma_ of [undefined, 'radial']) {
      const [g] = defs(escena([forma('a', { relleno: { tipo: 'degradado', desde: '#FF000080', hasta: '#0000FF40', angulo: 0, ...(forma_ ? { forma: forma_ } : {}), paradas: [{ posicion: 0.5, color: '#00FF0033' }] } })]));
      const stops = g?.hijos ?? [];
      expect(stops.map((s) => s.attrs['stop-color'])).toEqual(['#FF0000', '#00FF00', '#0000FF']);
      expect(stops.every((s) => !('stop-opacity' in s.attrs))).toBe(true);
    }
  });
});

describe('relleno «patrón»', () => {
  const patron = (extra: Record<string, unknown>, opciones = {}) => {
    const e = escena([forma('a', { relleno: { tipo: 'patron', color: '#112233', fondo: null, escala: 12, ...extra } })]);
    return { e, defs: defs(e, { prefijoIds: 'p', ...opciones }) };
  };

  it('cada patrón es un <pattern> en unidades de escena, del tamaño de la escala, y la forma lo usa', () => {
    const { e, defs: d } = patron({ patron: 'rayas', escala: 20 });
    expect(d).toHaveLength(1);
    expect(d[0]?.tag).toBe('pattern');
    expect(d[0]?.attrs).toEqual({ id: 'p-patron-1', patternUnits: 'userSpaceOnUse', width: 20, height: 20 });
    expect(rellenoDe(e, { prefijoIds: 'p' })).toBe('url(#p-patron-1)');
  });

  it('rayas: una franja horizontal de un cuarto del lado, centrada', () => {
    const { defs: d } = patron({ patron: 'rayas' });
    expect(d[0]?.hijos).toEqual([{ tag: 'rect', attrs: { x: 0, y: 4.5, width: 12, height: 3, fill: '#112233' } }]);
  });

  it('diagonal: tres segmentos a 45° que se juntan entre azulejos, con un cuarto del lado de grosor', () => {
    const { defs: d } = patron({ patron: 'diagonal' });
    expect(d[0]?.hijos).toEqual([{ tag: 'path', attrs: { d: 'M-6 6L6 -6M0 12L12 0M6 18L18 6', stroke: '#112233', 'stroke-width': 3, fill: 'none' } }]);
  });

  it('cuadrícula: una línea horizontal y una vertical por el medio, de un octavo del lado', () => {
    const { defs: d } = patron({ patron: 'cuadricula' });
    expect(d[0]?.hijos).toEqual([{ tag: 'path', attrs: { d: 'M0 6L12 6M6 0L6 12', stroke: '#112233', 'stroke-width': 1.5, fill: 'none' } }]);
  });

  it('puntos: un círculo de un sexto del lado en el centro', () => {
    const { defs: d } = patron({ patron: 'puntos' });
    expect(d[0]?.hijos).toEqual([{ tag: 'circle', attrs: { cx: 6, cy: 6, r: 2, fill: '#112233' } }]);
  });

  it('el rectángulo de fondo solo existe si hay fondo, y va primero', () => {
    const sin = patron({ patron: 'puntos', fondo: null }).defs[0]?.hijos ?? [];
    expect(sin.map((h) => h.tag)).toEqual(['circle']);
    const con = patron({ patron: 'puntos', fondo: '#FEF3C7' }).defs[0]?.hijos ?? [];
    expect(con.map((h) => h.tag)).toEqual(['rect', 'circle']);
    expect(con[0]).toEqual({ tag: 'rect', attrs: { width: 12, height: 12, fill: '#FEF3C7' } });
  });

  it('el alfa de los colores del patrón sí se aplica', () => {
    const h = patron({ patron: 'puntos', color: '#FF000080', fondo: '#0000FF40' }).defs[0]?.hijos ?? [];
    expect(h[0]?.attrs).toMatchObject({ fill: '#0000FF', 'fill-opacity': 0.25 });
    expect(h[1]?.attrs).toMatchObject({ fill: '#FF0000', 'fill-opacity': 0.5 });
  });

  it('los tokens siguen al tema en un archivo y se dejan tal cual en pantalla', () => {
    const colores = (modo: string) => (patron({ patron: 'rayas', color: 'var(--primary)', fondo: 'var(--muted)' }, { modo }).defs[0]?.hijos ?? []).map((h) => h.attrs.fill);
    expect(colores('claro')).toEqual(['#F1F5F9', '#2563EB']);
    expect(colores('oscuro')).toEqual(['#1E293B', '#60A5FA']);
    expect(colores('css')).toEqual(['var(--muted)', 'var(--primary)']);
  });

  it('dos dibujos con prefijos distintos no comparten ids', () => {
    const e = escena([forma('a', { relleno: { tipo: 'patron', patron: 'rayas' } })]);
    expect(defs(e, { prefijoIds: 'uno' })[0]?.attrs.id).toBe('uno-patron-1');
    expect(defs(e, { prefijoIds: 'dos' })[0]?.attrs.id).toBe('dos-patron-1');
  });

  it('cada forma con patrón tiene su propio azulejo, con su escala', () => {
    const e = escena([forma('a', { relleno: { tipo: 'patron', patron: 'rayas', escala: 8 } }), forma('b', { relleno: { tipo: 'patron', patron: 'puntos', escala: 30 } })]);
    expect(defs(e, { prefijoIds: 'p' }).map((d) => [d.attrs.id, d.attrs.width])).toEqual([['p-patron-1', 8], ['p-patron-2', 30]]);
  });

  it('el patrón va dentro del mismo grupo que la forma: gira con ella', () => {
    const e = escena([{ ...forma('a', { relleno: { tipo: 'patron', patron: 'rayas' } }), transformacion: { x: 10, y: 20, ancho: 100, alto: 50, rotacion: 30 } }]);
    const g = escenaANodos(e).nodos.find((n) => n.attrs['data-elemento-id'] === 'a');
    expect(g?.attrs.transform).toBe('translate(10 20) rotate(30 50 25)');
    expect(buscar(g?.hijos ?? [], 'path')[0]?.attrs.fill).toMatch(/^url\(#.+-patron-\d+\)$/);
  });
});

describe('sombra interior', () => {
  const sombra = (extra = {}) => escena([forma('a', { sombra: { color: '#00000080', desenfoque: 10, dx: 3, dy: 5, ...extra } })]);

  it('la proyectada sigue siendo un feDropShadow', () => {
    const [f] = defs(sombra(), { prefijoIds: 'p' });
    expect(f).toEqual({
      tag: 'filter',
      attrs: { id: 'p-sombra-1', x: '-30%', y: '-30%', width: '160%', height: '160%' },
      hijos: [{ tag: 'feDropShadow', attrs: { dx: 3, dy: 5, stdDeviation: 5, 'flood-color': '#000000', 'flood-opacity': 0.5 } }],
    });
  });

  it('la interior invierte el alfa, lo difumina y desplaza, recorta el color con él y lo compone sobre el dibujo', () => {
    const [f] = defs(sombra({ interior: true }), { prefijoIds: 'p' });
    expect(f?.attrs).toEqual({ id: 'p-sombra-1', x: '-30%', y: '-30%', width: '160%', height: '160%' });
    expect(f?.hijos).toEqual([
      { tag: 'feComponentTransfer', attrs: { in: 'SourceAlpha', result: 'invertida' }, hijos: [{ tag: 'feFuncA', attrs: { type: 'table', tableValues: '1 0' } }] },
      { tag: 'feGaussianBlur', attrs: { in: 'invertida', stdDeviation: 5, result: 'difusa' } },
      { tag: 'feOffset', attrs: { in: 'difusa', dx: 3, dy: 5, result: 'desplazada' } },
      { tag: 'feFlood', attrs: { 'flood-color': '#000000', 'flood-opacity': 0.5, result: 'color' } },
      { tag: 'feComposite', attrs: { in: 'color', in2: 'desplazada', operator: 'in', result: 'sombra' } },
      { tag: 'feComposite', attrs: { in: 'sombra', in2: 'SourceAlpha', operator: 'in', result: 'interior' } },
      { tag: 'feMerge', attrs: {}, hijos: [{ tag: 'feMergeNode', attrs: { in: 'SourceGraphic' } }, { tag: 'feMergeNode', attrs: { in: 'interior' } }] },
    ]);
  });

  it('la forma usa el filtro, y la interior no emite feDropShadow', () => {
    const e = sombra({ interior: true });
    expect(buscar(escenaANodos(e).nodos, 'feDropShadow')).toEqual([]);
    const g = escenaANodos(e, { prefijoIds: 'p' }).nodos.find((n) => n.attrs['data-elemento-id'] === 'a');
    expect(buscar(g?.hijos ?? [], 'path')[0]?.attrs.filter).toBe('url(#p-sombra-1)');
  });

  it('el color de la sombra interior sigue al tema', () => {
    const e = sombra({ interior: true, color: 'var(--foreground)' });
    const flood = (modo: string) => buscar(defs(e, { modo }), 'feFlood')[0]?.attrs['flood-color'];
    expect(flood('claro')).toBe('#0F172A');
    expect(flood('oscuro')).toBe('#F1F5F9');
    expect(flood('css')).toBe('var(--foreground)');
  });

  it('una forma con relleno y con sombra interior comparten defs sin chocar ids', () => {
    const e = escena([forma('a', { relleno: { tipo: 'patron', patron: 'rayas' }, sombra: { color: '#000000', interior: true } })]);
    const ids = defs(e, { prefijoIds: 'p' }).map((d) => d.attrs.id);
    expect(ids).toEqual(['p-patron-1', 'p-sombra-2']);
  });
});

describe('el archivo SVG con todo lo nuevo', () => {
  const todo = escena([
    forma('a', { relleno: { ...DEGRADADO, forma: 'radial', paradas: [{ posicion: 0.5, color: 'var(--chart-2)' }] }, sombra: { color: 'var(--foreground)', interior: true } }),
    forma('b', { relleno: { tipo: 'patron', patron: 'diagonal', color: 'var(--primary)', fondo: 'var(--muted)', escala: 16 } }),
    forma('c', { relleno: { tipo: 'patron', patron: 'cuadricula', color: '#112233', fondo: null, escala: 9 } }),
  ]);

  it.each(['claro', 'oscuro'] as const)('en modo %s no queda ningún «var(» sin resolver', (modo) => {
    expect(escenaASvg(todo, { modo }).svg).not.toContain('var(');
  });

  it('en modo css conserva los tokens', () => {
    expect(escenaASvg(todo, { modo: 'css' }).svg).toContain('var(--primary)');
  });

  it('sale con los nombres de atributo que pide SVG (camelCase donde corresponde)', () => {
    const { svg } = escenaASvg(todo, { modo: 'claro' });
    expect(svg).toContain('patternUnits="userSpaceOnUse"');
    expect(svg).toContain('tableValues="1 0"');
    expect(svg).toContain('<radialGradient ');
    expect(svg).not.toContain('pattern-units');
  });

  it('es XML bien formado (etiquetas balanceadas, atributos entre comillas)', () => {
    const { svg } = escenaASvg(todo, { modo: 'claro' });
    const pila: string[] = [];
    const re = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>/g;
    let ultimo = 0;
    for (const m of svg.matchAll(re)) {
      expect(/[<>]/.test(svg.slice(ultimo, m.index))).toBe(false);
      ultimo = (m.index ?? 0) + m[0].length;
      if (m[4] === '/') continue;
      if (m[1] === '/') expect(pila.pop()).toBe(m[2]);
      else pila.push(m[2] as string);
    }
    expect(pila).toEqual([]);
    expect(/[<>]/.test(svg.slice(ultimo))).toBe(false);
  });

  it('un solo <defs> con todo, y sin él cuando no hace falta', () => {
    expect(buscar(escenaANodos(todo).nodos, 'defs')).toHaveLength(1);
    expect(buscar(escenaANodos(escena([forma('a', { relleno: { tipo: 'solido', color: '#FFFFFF' } })])).nodos, 'defs')).toEqual([]);
  });
});

describe('rendimiento (DW9)', () => {
  const mediana = (f: () => void): number => {
    for (let i = 0; i < 3; i++) f(); // calentamiento
    const t: number[] = [];
    for (let i = 0; i < 7; i++) {
      const a = performance.now();
      f();
      t.push(performance.now() - a);
    }
    return [...t].sort((x, y) => x - y)[3] as number;
  };
  const grande = (estilo: (i: number) => unknown): Escena =>
    escena(Array.from({ length: 500 }, (_v, i) => ({ ...forma(`f${i}`, estilo(i)), transformacion: { x: (i % 25) * 40, y: Math.floor(i / 25) * 40, ancho: 30, alto: 30, rotacion: 0 } })));

  it('500 formas con patrón, radial con paradas y sombra interior tardan a lo sumo el triple que con relleno sólido y sombra proyectada', () => {
    const viejo = grande(() => ({ relleno: { tipo: 'solido', color: '#FDE68A' }, sombra: { color: '#00000055', desenfoque: 6, dx: 1, dy: 2 } }));
    const nuevo = grande((i) => ({
      relleno: i % 2 === 0 ? { tipo: 'patron', patron: 'cuadricula', color: '#123456', fondo: '#FEF3C7', escala: 12 } : { ...DEGRADADO, forma: 'radial', paradas: [{ posicion: 0.5, color: '#FF0000' }] },
      sombra: { color: '#00000055', desenfoque: 6, dx: 1, dy: 2, interior: true },
    }));
    const tViejo = mediana(() => void escenaANodos(viejo));
    const tNuevo = mediana(() => void escenaANodos(nuevo));
    expect(tNuevo).toBeLessThanOrEqual(Math.max(tViejo * 3, 5));
  });
});
