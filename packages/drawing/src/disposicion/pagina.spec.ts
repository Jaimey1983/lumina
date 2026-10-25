import { describe, expect, it } from 'vitest';
import type { NodoDisposicion, Posiciones } from './grafo.js';
import { cajaDeNodos, comprimir, comprimirParaQueQuepa, entraEnPagina, hayPisadas, MARGEN_PAGINA, superficieDeNodos, trasladarAPagina } from './pagina.js';

const nodo = (id: string, ancho = 100, alto = 60): NodoDisposicion => ({ id, x: 0, y: 0, ancho, alto });
const pos = (...e: Array<[string, number, number]>): Posiciones => new Map(e.map(([id, x, y]) => [id, { x, y }]));
const PAGINA = { ancho: 1000, alto: 600 };

describe('cajaDeNodos', () => {
  it('envuelve a todos con su tamaño', () => {
    const ns = [nodo('a', 100, 60), nodo('b', 50, 40)];
    expect(cajaDeNodos(ns, pos(['a', 10, 20], ['b', 300, 200]))).toEqual({ x: 10, y: 20, ancho: 340, alto: 220 });
  });
  it('sin nodos o sin posiciones es null', () => {
    expect(cajaDeNodos([], new Map())).toBeNull();
    expect(cajaDeNodos([nodo('a')], new Map())).toBeNull();
  });
  it('ignora los nodos sin posición', () => {
    expect(cajaDeNodos([nodo('a'), nodo('b')], pos(['a', 5, 5]))).toEqual({ x: 5, y: 5, ancho: 100, alto: 60 });
  });
});

describe('entraEnPagina', () => {
  it('justo en el borde entra; un píxel afuera, no', () => {
    expect(entraEnPagina({ x: 0, y: 0, ancho: 1000, alto: 600 }, PAGINA)).toBe(true);
    expect(entraEnPagina({ x: 0, y: 0, ancho: 1001, alto: 600 }, PAGINA)).toBe(false);
    expect(entraEnPagina({ x: -1, y: 0, ancho: 10, alto: 10 }, PAGINA)).toBe(false);
    expect(entraEnPagina({ x: 0, y: 0, ancho: 10, alto: 601 }, PAGINA)).toBe(false);
  });
  it('con margen, el borde exacto no entra', () => {
    expect(entraEnPagina({ x: 0, y: 0, ancho: 100, alto: 100 }, PAGINA, MARGEN_PAGINA)).toBe(false);
    expect(entraEnPagina({ x: 24, y: 24, ancho: 952, alto: 552 }, PAGINA, MARGEN_PAGINA)).toBe(true);
  });
});

describe('trasladarAPagina', () => {
  const ns = [nodo('a', 100, 60), nodo('b', 100, 60)];
  it('si ya entra devuelve las mismas posiciones (misma referencia)', () => {
    const p = pos(['a', 100, 100], ['b', 400, 300]);
    expect(trasladarAPagina(p, ns, PAGINA)).toBe(p);
  });
  it('fuera por la izquierda y arriba: el menor desplazamiento que lo mete', () => {
    const r = trasladarAPagina(pos(['a', -50, -20], ['b', 300, 200]), ns, PAGINA) as Posiciones;
    expect(r.get('a')).toEqual({ x: 0, y: 0 });
    expect(r.get('b')).toEqual({ x: 350, y: 220 });
  });
  it('fuera por la derecha y abajo', () => {
    const r = trasladarAPagina(pos(['a', 100, 100], ['b', 950, 580]), ns, PAGINA) as Posiciones;
    expect(r.get('b')).toEqual({ x: 900, y: 540 });
    expect(r.get('a')).toEqual({ x: 50, y: 60 });
  });
  it('solo se mueve el eje que lo necesita', () => {
    const r = trasladarAPagina(pos(['a', 100, -10], ['b', 400, 300]), ns, PAGINA) as Posiciones;
    expect(r.get('a')).toEqual({ x: 100, y: 0 });
  });
  it('con margen deja esa distancia al borde', () => {
    const r = trasladarAPagina(pos(['a', 0, 0], ['b', 300, 200]), ns, PAGINA, MARGEN_PAGINA) as Posiciones;
    expect(r.get('a')).toEqual({ x: 24, y: 24 });
  });
  it('mayor que la página: null', () => {
    expect(trasladarAPagina(pos(['a', 0, 0], ['b', 950, 100]), ns, PAGINA)).toBeNull();
    expect(trasladarAPagina(pos(['a', 0, 0], ['b', 100, 560]), ns, PAGINA)).toBeNull();
  });
  it('mayor que el espacio con margen pero no que la página: null con margen, traslada sin él', () => {
    const p = pos(['a', 0, 0], ['b', 880, 100]); // caja de 980 de ancho
    expect(trasladarAPagina(p, ns, PAGINA, MARGEN_PAGINA)).toBeNull();
    expect(trasladarAPagina(p, ns, PAGINA)).toBe(p);
  });
  it('no cambia las posiciones de entrada', () => {
    const p = pos(['a', -50, 0], ['b', 300, 200]);
    trasladarAPagina(p, ns, PAGINA);
    expect(p.get('a')).toEqual({ x: -50, y: 0 });
  });
});

describe('comprimir', () => {
  const ns = [nodo('a', 100, 60), nodo('b', 100, 60), nodo('c', 100, 60)];
  const p = pos(['a', 0, 0], ['b', 400, 0], ['c', 200, 300]);
  it('factor 1: las mismas posiciones', () => {
    expect(comprimir(p, ns, { fx: 1, fy: 1 })).toBe(p);
  });
  it('acerca los centros respecto del centro de la caja y no toca los tamaños', () => {
    const caja = cajaDeNodos(ns, p) as { x: number; ancho: number; y: number; alto: number };
    const r = comprimir(p, ns, { fx: 0.5, fy: 1 });
    const cx = (id: string): number => (r.get(id) as { x: number }).x + 50;
    expect(cx('b') - cx('a')).toBeCloseTo(200, 6); // eran 400 entre centros
    // El centro de la caja no se mueve.
    const nueva = cajaDeNodos(ns, r) as { x: number; ancho: number; y: number; alto: number };
    expect(nueva.x + nueva.ancho / 2).toBeCloseTo(caja.x + caja.ancho / 2, 6);
    expect(nueva.y).toBeCloseTo(caja.y, 6); // fy = 1: el alto no cambia
    expect(nueva.alto).toBeCloseTo(caja.alto, 6);
  });
  it('un eje no afecta al otro', () => {
    const r = comprimir(p, ns, { fx: 1, fy: 0.5 });
    expect((r.get('a') as { x: number }).x).toBe(0);
    expect((r.get('b') as { x: number }).x).toBe(400);
  });
  it('no cambia la posición de entrada', () => {
    comprimir(p, ns, { fx: 0.5, fy: 0.5 });
    expect(p.get('b')).toEqual({ x: 400, y: 0 });
  });
});

describe('hayPisadas', () => {
  const ns = [nodo('a'), nodo('b')];
  it('sin solape: false; tocándose por el borde: false', () => {
    expect(hayPisadas(ns, pos(['a', 0, 0], ['b', 300, 0]))).toBe(false);
    expect(hayPisadas(ns, pos(['a', 0, 0], ['b', 100, 0]))).toBe(false);
  });
  it('con solape: true', () => {
    expect(hayPisadas(ns, pos(['a', 0, 0], ['b', 99, 0]))).toBe(true);
    expect(hayPisadas(ns, pos(['a', 0, 0], ['b', 50, 30]))).toBe(true);
  });
  it('un nodo dentro de otro: true', () => {
    expect(hayPisadas([nodo('g', 500, 500), nodo('p', 10, 10)], pos(['g', 0, 0], ['p', 100, 100]))).toBe(true);
  });
  it('los nodos sin posición no cuentan', () => {
    expect(hayPisadas(ns, pos(['a', 0, 0]))).toBe(false);
  });
});

describe('superficieDeNodos', () => {
  it('suma las áreas', () => {
    expect(superficieDeNodos([nodo('a', 10, 10), nodo('b', 20, 5)])).toBe(200);
    expect(superficieDeNodos([])).toBe(0);
  });
});

describe('comprimirParaQueQuepa', () => {
  const ns = [nodo('a', 100, 60), nodo('b', 100, 60), nodo('c', 100, 60)];
  const p = pos(['a', 0, 0], ['b', 1100, 0], ['c', 550, 700]); // caja 1200 × 760 en una página de 1000 × 600
  it('si ya cabía devuelve las mismas posiciones', () => {
    const q = pos(['a', 0, 0], ['b', 300, 0], ['c', 100, 200]);
    expect(comprimirParaQueQuepa(q, ns, PAGINA, 0, 0.55)).toBe(q);
  });
  it('lo acerca hasta que cabe, sin tocar los tamaños y por el mayor factor posible', () => {
    const r = comprimirParaQueQuepa(p, ns, PAGINA, 0, 0.55) as Posiciones;
    const caja = cajaDeNodos(ns, r) as { ancho: number; alto: number };
    expect(caja.ancho).toBeLessThanOrEqual(1000 + 1e-6);
    expect(caja.alto).toBeLessThanOrEqual(600 + 1e-6);
    // «Mayor factor posible»: queda ajustado al espacio, no mucho más chico.
    expect(caja.ancho).toBeGreaterThan(999);
    expect(caja.alto).toBeGreaterThan(599);
  });
  it('cada eje por separado: el que ya cabía no se mueve', () => {
    const q = pos(['a', 0, 0], ['b', 1100, 0], ['c', 550, 300]); // 1200 de ancho, 360 de alto
    const r = comprimirParaQueQuepa(q, ns, PAGINA, 0, 0.55) as Posiciones;
    expect((r.get('a') as { y: number }).y).toBe(0);
    expect((r.get('c') as { y: number }).y).toBe(300);
    expect(((cajaDeNodos(ns, r) as { ancho: number }).ancho)).toBeLessThanOrEqual(1000 + 1e-6);
  });
  it('con margen deja ese espacio', () => {
    const r = comprimirParaQueQuepa(p, ns, PAGINA, 24, 0.55) as Posiciones;
    const caja = cajaDeNodos(ns, r) as { ancho: number; alto: number };
    expect(caja.ancho).toBeLessThanOrEqual(1000 - 48 + 1e-6);
    expect(caja.alto).toBeLessThanOrEqual(600 - 48 + 1e-6);
  });
  it('si ni con el mínimo cabe: null', () => {
    expect(comprimirParaQueQuepa(p, ns, PAGINA, 0, 0.95)).toBeNull();
    expect(comprimirParaQueQuepa(pos(['a', 0, 0], ['b', 5000, 0]), ns, PAGINA, 0, 0.55)).toBeNull();
  });
  it('no cambia las posiciones de entrada', () => {
    comprimirParaQueQuepa(p, ns, PAGINA, 0, 0.55);
    expect(p.get('b')).toEqual({ x: 1100, y: 0 });
  });
});
