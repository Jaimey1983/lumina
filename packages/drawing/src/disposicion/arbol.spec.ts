import { describe, expect, it } from 'vitest';
import { disponerArbol } from './arbol.js';
import type { NodoDisposicion, Posiciones } from './grafo.js';
import { arbolAlAzar, solapes } from './util-pruebas.js';

const nodo = (id: string, ancho = 100, alto = 60): NodoDisposicion => ({ id, x: 0, y: 0, ancho, alto });
const centro = (n: NodoDisposicion, p: Posiciones) => {
  const q = p.get(n.id) as { x: number; y: number };
  return { x: q.x + n.ancho / 2, y: q.y + n.alto / 2 };
};

describe('disponerArbol', () => {
  it('una cadena de 3, de izquierda a derecha: cada nivel a la derecha del anterior y todos a la misma altura', () => {
    const ns = ['a', 'b', 'c'].map((id) => nodo(id));
    const p = disponerArbol(ns, [{ desde: 'a', hasta: 'b' }, { desde: 'b', hasta: 'c' }]);
    expect(p.get('a')?.x).toBeLessThan(p.get('b')?.x as number);
    expect((p.get('b')?.x as number)).toBeLessThan(p.get('c')?.x as number);
    expect(new Set(ns.map((n) => centro(n, p).y)).size).toBe(1);
    // Separación entre niveles: lo que sobra entre el borde derecho de uno y el izquierdo del siguiente.
    expect((p.get('b')?.x as number) - ((p.get('a')?.x as number) + 100)).toBe(80);
  });

  it('un árbol de 7 (binario): cada padre queda centrado respecto de sus hijos', () => {
    const ids = ['r', 'a', 'b', 'c', 'd', 'e', 'f'];
    const ns = ids.map((id) => nodo(id));
    const aristas = [['r', 'a'], ['r', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'e'], ['b', 'f']].map(([desde, hasta]) => ({ desde: desde as string, hasta: hasta as string }));
    const p = disponerArbol(ns, aristas);
    const cy = (id: string) => centro(ns.find((n) => n.id === id) as NodoDisposicion, p).y;
    expect(cy('a')).toBeCloseTo((cy('c') + cy('d')) / 2, 6);
    expect(cy('b')).toBeCloseTo((cy('e') + cy('f')) / 2, 6);
    expect(cy('r')).toBeCloseTo((cy('a') + cy('b')) / 2, 6);
    expect(solapes(ns, p)).toEqual([]);
  });

  it('los nodos de un mismo nivel comparten columna', () => {
    const ns = [nodo('r', 100), nodo('a', 180), nodo('b', 60)];
    const p = disponerArbol(ns, [{ desde: 'r', hasta: 'a' }, { desde: 'r', hasta: 'b' }]);
    // «a» y «b» están centrados en la misma columna aunque midan distinto.
    expect(centro(ns[1] as NodoDisposicion, p).x).toBeCloseTo(centro(ns[2] as NodoDisposicion, p).x, 6);
  });

  it('de arriba abajo: los niveles son filas y los hermanos se reparten en horizontal', () => {
    const ns = ['r', 'a', 'b'].map((id) => nodo(id));
    const p = disponerArbol(ns, [{ desde: 'r', hasta: 'a' }, { desde: 'r', hasta: 'b' }], { orientacion: 'abajo' });
    expect(p.get('r')?.y).toBeLessThan(p.get('a')?.y as number);
    expect(p.get('a')?.y).toBe(p.get('b')?.y);
    expect(p.get('a')?.x).toBeLessThan(p.get('b')?.x as number);
    expect(centro(ns[0] as NodoDisposicion, p).x).toBeCloseTo((centro(ns[1] as NodoDisposicion, p).x + centro(ns[2] as NodoDisposicion, p).x) / 2, 6);
  });

  it('un padre más alto que sus hijos no pisa a su vecino', () => {
    // «r1» es alto y tiene un hijo bajito; «r2» es otra raíz justo debajo.
    const ns = [nodo('r1', 100, 400), nodo('h1', 100, 20), nodo('r2', 100, 60), nodo('h2', 100, 20)];
    const p = disponerArbol(ns, [{ desde: 'r1', hasta: 'h1' }, { desde: 'r2', hasta: 'h2' }]);
    expect(solapes(ns, p)).toEqual([]);
    // Y el hijo bajito queda centrado respecto del padre alto, no pegado a su borde de arriba.
    expect(centro(ns[1] as NodoDisposicion, p).y).toBeCloseTo(centro(ns[0] as NodoDisposicion, p).y, 6);
  });

  it('un bosque: cada árbol va aparte, uno tras otro, sin pisarse', () => {
    const ns = ['a', 'b', 'c', 'd', 'e'].map((id) => nodo(id));
    const p = disponerArbol(ns, [{ desde: 'a', hasta: 'b' }, { desde: 'a', hasta: 'c' }, { desde: 'd', hasta: 'e' }]);
    expect(solapes(ns, p)).toEqual([]);
    expect(p.get('d')?.y).toBeGreaterThan(p.get('c')?.y as number);
  });

  it('con un ciclo no se cuelga y todos los nodos reciben posición', () => {
    const ns = ['a', 'b', 'c'].map((id) => nodo(id));
    const p = disponerArbol(ns, [{ desde: 'a', hasta: 'b' }, { desde: 'b', hasta: 'c' }, { desde: 'c', hasta: 'a' }]);
    expect(p.size).toBe(3);
    expect(solapes(ns, p)).toEqual([]);
  });

  it('es determinista: dos corridas dan lo mismo', () => {
    const { nodos, aristas } = arbolAlAzar(60, 7);
    expect([...disponerArbol(nodos, aristas)]).toEqual([...disponerArbol(nodos, aristas)]);
  });

  it('propiedad barrida: con 20, 100 y 500 nodos de tamaños distintos, nunca se pisan, en las dos orientaciones', () => {
    for (const n of [20, 100, 500]) {
      for (const semilla of [1, 2, 3]) {
        const { nodos, aristas } = arbolAlAzar(n, semilla * 100 + n);
        for (const orientacion of ['derecha', 'abajo'] as const) {
          const p = disponerArbol(nodos, aristas, { orientacion });
          expect(p.size, `${n}/${semilla}/${orientacion}`).toBe(n);
          expect(solapes(nodos, p), `${n}/${semilla}/${orientacion}`).toEqual([]);
        }
      }
    }
  });

  it('500 nodos se calculan en menos de un segundo', () => {
    const { nodos, aristas } = arbolAlAzar(500, 42);
    const t = performance.now();
    disponerArbol(nodos, aristas);
    expect(performance.now() - t).toBeLessThan(1000);
  });
});
