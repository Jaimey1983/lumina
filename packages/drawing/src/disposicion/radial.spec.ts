import { describe, expect, it } from 'vitest';
import type { NodoDisposicion, Posiciones } from './grafo.js';
import { disponerRadial } from './radial.js';
import { arbolAlAzar, solapes } from './util-pruebas.js';

const nodo = (id: string, ancho = 100, alto = 60): NodoDisposicion => ({ id, x: 0, y: 0, ancho, alto });
const centro = (n: NodoDisposicion, p: Posiciones) => {
  const q = p.get(n.id) as { x: number; y: number };
  return { x: q.x + n.ancho / 2, y: q.y + n.alto / 2 };
};
const dist = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);

describe('disponerRadial', () => {
  it('los nodos del mismo nivel quedan a igual distancia de la raíz', () => {
    const ns = ['r', 'a', 'b', 'c', 'd'].map((id) => nodo(id));
    const p = disponerRadial(ns, ['a', 'b', 'c', 'd'].map((h) => ({ desde: 'r', hasta: h })));
    const raiz = centro(ns[0] as NodoDisposicion, p);
    const d = ns.slice(1).map((n) => dist(raiz, centro(n, p)));
    for (const x of d) expect(x).toBeCloseTo(d[0] as number, 6);
    expect(d[0]).toBeGreaterThan(0);
    expect(solapes(ns, p)).toEqual([]);
  });

  it('con varios niveles, cada uno a mayor distancia que el anterior', () => {
    const ns = ['r', 'a', 'b', 'a1', 'a2', 'b1'].map((id) => nodo(id));
    const p = disponerRadial(ns, [['r', 'a'], ['r', 'b'], ['a', 'a1'], ['a', 'a2'], ['b', 'b1']].map(([desde, hasta]) => ({ desde: desde as string, hasta: hasta as string })));
    const raiz = centro(ns[0] as NodoDisposicion, p);
    const nivel1 = dist(raiz, centro(ns[1] as NodoDisposicion, p));
    const nivel2 = dist(raiz, centro(ns[3] as NodoDisposicion, p));
    expect(nivel2).toBeGreaterThan(nivel1);
    expect(dist(raiz, centro(ns[4] as NodoDisposicion, p))).toBeCloseTo(nivel2, 6);
    expect(solapes(ns, p)).toEqual([]);
  });

  it('el ángulo se reparte según las hojas de cada rama: tres hojas, tres cuartos de vuelta; una, un cuarto', () => {
    const ns = ['r', 'a', 'b', 'a1', 'a2', 'a3'].map((id) => nodo(id));
    const p = disponerRadial(ns, [['r', 'a'], ['r', 'b'], ['a', 'a1'], ['a', 'a2'], ['a', 'a3']].map(([desde, hasta]) => ({ desde: desde as string, hasta: hasta as string })));
    const raiz = centro(ns[0] as NodoDisposicion, p);
    const ang = (i: number): number => {
      const c = centro(ns[i] as NodoDisposicion, p);
      return Math.atan2(c.y - raiz.y, c.x - raiz.x);
    };
    expect(ang(1)).toBeCloseTo(0.75 * Math.PI, 6); // «a»: el centro de sus 3/4 de vuelta
    expect(ang(2)).toBeCloseTo(-0.25 * Math.PI, 6); // «b»: el centro del último cuarto
    expect(solapes(ns, p)).toEqual([]);
  });

  it('entre un anillo y el siguiente queda, como mínimo, el hueco de 40 entre los círculos que envuelven a cada nodo', () => {
    const ns = [nodo('r'), nodo('a')];
    const p = disponerRadial(ns, [{ desde: 'r', hasta: 'a' }]);
    const radio = Math.hypot(100, 60) / 2;
    expect(dist(centro(ns[0] as NodoDisposicion, p), centro(ns[1] as NodoDisposicion, p))).toBeCloseTo(2 * radio + 40, 6);
  });

  it('una cadena queda en un rayo, y un solo nodo grande junto a uno diminuto no se pisan', () => {
    const ns = [nodo('r', 50, 50), nodo('a', 300, 300), nodo('b', 5, 5), nodo('c', 300, 300)];
    const p = disponerRadial(ns, [{ desde: 'r', hasta: 'a' }, { desde: 'r', hasta: 'b' }, { desde: 'r', hasta: 'c' }]);
    expect(solapes(ns, p)).toEqual([]);
  });

  it('el caso en que la distancia entre vecinos engaña: dos grandes con uno diminuto en medio no se pisan', () => {
    const ns = [nodo('r', 40, 40), nodo('g1', 400, 400), nodo('m', 4, 4), nodo('g2', 400, 400)];
    const p = disponerRadial(ns, [{ desde: 'r', hasta: 'g1' }, { desde: 'r', hasta: 'm' }, { desde: 'r', hasta: 'g2' }]);
    expect(solapes(ns, p)).toEqual([]);
  });

  it('un bosque: cada árbol con su raíz en su centro, uno al lado del otro y sin pisarse', () => {
    const ns = ['a', 'b', 'c', 'd', 'e'].map((id) => nodo(id));
    const p = disponerRadial(ns, [{ desde: 'a', hasta: 'b' }, { desde: 'a', hasta: 'c' }, { desde: 'd', hasta: 'e' }]);
    expect(p.size).toBe(5);
    expect(solapes(ns, p)).toEqual([]);
  });

  it('con un ciclo no se cuelga', () => {
    const ns = ['a', 'b', 'c'].map((id) => nodo(id));
    const p = disponerRadial(ns, [{ desde: 'a', hasta: 'b' }, { desde: 'b', hasta: 'c' }, { desde: 'c', hasta: 'a' }]);
    expect(p.size).toBe(3);
    expect(solapes(ns, p)).toEqual([]);
  });

  it('es determinista', () => {
    const { nodos, aristas } = arbolAlAzar(60, 9);
    expect([...disponerRadial(nodos, aristas)]).toEqual([...disponerRadial(nodos, aristas)]);
  });

  it('propiedad barrida: con 20, 100 y 500 nodos de tamaños distintos, nunca se pisan', () => {
    for (const n of [20, 100, 500]) {
      for (const semilla of [1, 2, 3]) {
        const { nodos, aristas } = arbolAlAzar(n, semilla * 1000 + n);
        const p = disponerRadial(nodos, aristas);
        expect(p.size, `${n}/${semilla}`).toBe(n);
        expect(solapes(nodos, p), `${n}/${semilla}`).toEqual([]);
      }
    }
  });

  it('500 nodos se calculan en menos de un segundo', () => {
    const { nodos, aristas } = arbolAlAzar(500, 4);
    const t = performance.now();
    disponerRadial(nodos, aristas);
    expect(performance.now() - t).toBeLessThan(1000);
  });
});
