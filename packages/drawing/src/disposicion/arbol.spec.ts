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

describe('disponerArbol: alineación y espejo (Y37a)', () => {
  const ancho = (n: NodoDisposicion): number => n.ancho;
  const izq = (ns: NodoDisposicion[], p: Posiciones, id: string): number => (p.get(id) as { x: number }).x;
  const arriba = (p: Posiciones, id: string): number => (p.get(id) as { y: number }).y;
  const der = (ns: NodoDisposicion[], p: Posiciones, id: string): number => izq(ns, p, id) + ancho(ns.find((n) => n.id === id) as NodoDisposicion);
  const base = (): { ns: NodoDisposicion[]; aristas: Array<{ desde: string; hasta: string }> } => ({
    ns: [nodo('r', 100), nodo('a', 180), nodo('b', 60), nodo('c', 140), nodo('d', 90)],
    aristas: [{ desde: 'r', hasta: 'a' }, { desde: 'r', hasta: 'b' }, { desde: 'a', hasta: 'c' }, { desde: 'b', hasta: 'd' }],
  });

  it('los valores por defecto dan exactamente lo de antes (compatibilidad)', () => {
    const { ns, aristas } = base();
    expect([...disponerArbol(ns, aristas, { alinear: 'centro', invertir: false })]).toEqual([...disponerArbol(ns, aristas)]);
    expect([...disponerArbol(ns, aristas, { orientacion: 'abajo', alinear: 'centro' })]).toEqual([...disponerArbol(ns, aristas, { orientacion: 'abajo' })]);
  });

  it("`alinear: 'inicio'` en `derecha`: los bordes izquierdos de un nivel coinciden aunque midan distinto", () => {
    const { ns, aristas } = base();
    const p = disponerArbol(ns, aristas, { alinear: 'inicio' });
    expect(izq(ns, p, 'a')).toBe(izq(ns, p, 'b'));
    expect(izq(ns, p, 'c')).toBe(izq(ns, p, 'd'));
    // Con `centro` no coinciden: es justo lo que se corrige.
    const centrado = disponerArbol(ns, aristas);
    expect(izq(ns, centrado, 'a')).not.toBe(izq(ns, centrado, 'b'));
  });

  it("`alinear: 'inicio'` en `abajo`: los bordes de arriba de un nivel coinciden aunque midan distinto de alto", () => {
    const ns = [nodo('r', 100, 60), nodo('a', 100, 120), nodo('b', 100, 40)];
    const p = disponerArbol(ns, [{ desde: 'r', hasta: 'a' }, { desde: 'r', hasta: 'b' }], { orientacion: 'abajo', alinear: 'inicio' });
    expect(arriba(p, 'a')).toBe(arriba(p, 'b'));
  });

  it("con `inicio` la separación entre niveles sigue siendo de 80 entre el borde de la caja mayor y el siguiente nivel", () => {
    const { ns, aristas } = base();
    const p = disponerArbol(ns, aristas, { alinear: 'inicio' });
    // La caja mayor del nivel 1 es «a» (180): el nivel 2 empieza 80 después de su borde derecho.
    expect(izq(ns, p, 'c') - (izq(ns, p, 'a') + 180)).toBe(80);
  });

  it("`inicio` no descentra al padre sobre sus hijos", () => {
    const { ns, aristas } = base();
    const p = disponerArbol(ns, aristas, { alinear: 'inicio' });
    const cy = (id: string): number => centro(ns.find((n) => n.id === id) as NodoDisposicion, p).y;
    expect(cy('r')).toBeCloseTo((cy('a') + cy('b')) / 2, 6);
  });

  it('`invertir` en `derecha`: los hijos quedan a la izquierda del padre', () => {
    const { ns, aristas } = base();
    const p = disponerArbol(ns, aristas, { invertir: true });
    expect(der(ns, p, 'a')).toBeLessThan(izq(ns, p, 'r'));
    expect(der(ns, p, 'c')).toBeLessThan(izq(ns, p, 'a'));
  });

  it('`invertir` con `inicio`: los bordes alineados son los derechos', () => {
    const { ns, aristas } = base();
    const p = disponerArbol(ns, aristas, { invertir: true, alinear: 'inicio' });
    expect(der(ns, p, 'a')).toBe(der(ns, p, 'b'));
    expect(der(ns, p, 'c')).toBe(der(ns, p, 'd'));
  });

  it('`invertir` en `abajo`: los hijos quedan arriba del padre', () => {
    const ns = [nodo('r'), nodo('a'), nodo('b')];
    const p = disponerArbol(ns, [{ desde: 'r', hasta: 'a' }, { desde: 'r', hasta: 'b' }], { orientacion: 'abajo', invertir: true });
    expect(arriba(p, 'a') + 60).toBeLessThan(arriba(p, 'r'));
    // El orden entre hermanos no se espeja: solo el eje principal.
    expect((p.get('a') as { x: number }).x).toBeLessThan((p.get('b') as { x: number }).x);
  });

  it('`invertir` conserva las distancias entre niveles y el centrado', () => {
    const { ns, aristas } = base();
    const normal = disponerArbol(ns, aristas, { alinear: 'inicio' });
    const espejo = disponerArbol(ns, aristas, { alinear: 'inicio', invertir: true });
    const cyN = (id: string): number => centro(ns.find((n) => n.id === id) as NodoDisposicion, normal).y;
    const cyE = (id: string): number => centro(ns.find((n) => n.id === id) as NodoDisposicion, espejo).y;
    for (const id of ['r', 'a', 'b', 'c', 'd']) expect(cyE(id)).toBeCloseTo(cyN(id), 6);
  });

  it('el orden de hermanos se pasa al motor', () => {
    const ns = [nodo('r'), nodo('a'), nodo('b')];
    const aristas = [{ desde: 'r', hasta: 'a' }, { desde: 'r', hasta: 'b' }];
    const sin = disponerArbol(ns, aristas, { orientacion: 'abajo' });
    expect((sin.get('a') as { x: number }).x).toBeLessThan((sin.get('b') as { x: number }).x);
    const con = disponerArbol(ns, aristas, { orientacion: 'abajo', ordenHermanos: (x, y) => y.id.localeCompare(x.id) });
    expect((con.get('b') as { x: number }).x).toBeLessThan((con.get('a') as { x: number }).x);
  });

  it('propiedad barrida: 20, 100 y 500 nodos de tamaños distintos, nunca se pisan, en las cuatro combinaciones y las dos alineaciones', () => {
    for (const n of [20, 100, 500]) {
      for (const semilla of [1, 2]) {
        const { nodos, aristas } = arbolAlAzar(n, semilla * 100 + n);
        for (const orientacion of ['derecha', 'abajo'] as const) {
          for (const invertir of [false, true]) {
            for (const alinear of ['centro', 'inicio'] as const) {
              const p = disponerArbol(nodos, aristas, { orientacion, invertir, alinear });
              expect(p.size, `${n}/${semilla}/${orientacion}/${invertir}/${alinear}`).toBe(n);
              expect(solapes(nodos, p), `${n}/${semilla}/${orientacion}/${invertir}/${alinear}`).toEqual([]);
            }
          }
        }
      }
    }
  });

  it('es determinista con todas las opciones', () => {
    const { nodos, aristas } = arbolAlAzar(60, 9);
    const o = { orientacion: 'abajo', invertir: true, alinear: 'inicio' } as const;
    expect([...disponerArbol(nodos, aristas, o)]).toEqual([...disponerArbol(nodos, aristas, o)]);
  });

  it('500 nodos con las opciones nuevas se calculan sin diferencia con los de siempre (proporción)', () => {
    const { nodos, aristas } = arbolAlAzar(500, 42);
    const medir = (o: Parameters<typeof disponerArbol>[2]): number => {
      for (let i = 0; i < 3; i++) disponerArbol(nodos, aristas, o);
      const m: number[] = [];
      for (let i = 0; i < 7; i++) {
        const a = performance.now();
        disponerArbol(nodos, aristas, o);
        m.push(performance.now() - a);
      }
      return [...m].sort((x, y) => x - y)[3] as number;
    };
    const base0 = medir({});
    const nuevo = medir({ alinear: 'inicio', invertir: true, ordenHermanos: (a, b) => a.x - b.x });
    expect(nuevo).toBeLessThan(Math.max(base0, 1) * 6);
    expect(nuevo).toBeLessThan(1000);
  });
});

describe("disponerArbol: centrar sobre el primer y el último hijo (Y37a)", () => {
  const cy = (ns: NodoDisposicion[], p: Posiciones, id: string): number => centro(ns.find((n) => n.id === id) as NodoDisposicion, p).y;
  const cxx = (ns: NodoDisposicion[], p: Posiciones, id: string): number => centro(ns.find((n) => n.id === id) as NodoDisposicion, p).x;

  /** r → a, b ; a tiene tres hojas, b una: el abanico de «a» es mucho más ancho que el de «b». */
  const asimetrico = (): { ns: NodoDisposicion[]; aristas: Array<{ desde: string; hasta: string }> } => ({
    ns: ['r', 'a', 'b', 'a1', 'a2', 'a3', 'b1'].map((id) => nodo(id, 100, 60)),
    aristas: [['r', 'a'], ['r', 'b'], ['a', 'a1'], ['a', 'a2'], ['a', 'a3'], ['b', 'b1']].map(([desde, hasta]) => ({ desde: desde as string, hasta: hasta as string })),
  });

  it("con `hijos` el padre queda a medio camino entre el centro del primer hijo y el del último", () => {
    const { ns, aristas } = asimetrico();
    const p = disponerArbol(ns, aristas, { centrar: 'hijos' });
    expect(cy(ns, p, 'r')).toBeCloseTo((cy(ns, p, 'a') + cy(ns, p, 'b')) / 2, 6);
    expect(cy(ns, p, 'a')).toBeCloseTo((cy(ns, p, 'a1') + cy(ns, p, 'a3')) / 2, 6);
  });

  it("con `bloque` (el valor por defecto) sigue centrado sobre todo lo que ocupan los hijos: no es lo mismo", () => {
    const { ns, aristas } = asimetrico();
    const bloque = disponerArbol(ns, aristas);
    const hijos = disponerArbol(ns, aristas, { centrar: 'hijos' });
    expect(cy(ns, bloque, 'r')).not.toBeCloseTo((cy(ns, bloque, 'a') + cy(ns, bloque, 'b')) / 2, 3);
    expect([...bloque]).toEqual([...disponerArbol(ns, aristas, { centrar: 'bloque' })]);
    expect([...hijos]).not.toEqual([...bloque]);
  });

  it("en un árbol simétrico las dos formas dan lo mismo", () => {
    const ns = ['r', 'a', 'b', 'c', 'd'].map((id) => nodo(id));
    const aristas = [['r', 'a'], ['r', 'b'], ['a', 'c'], ['b', 'd']].map(([desde, hasta]) => ({ desde: desde as string, hasta: hasta as string }));
    const x = disponerArbol(ns, aristas);
    const y = disponerArbol(ns, aristas, { centrar: 'hijos' });
    for (const n of ns) {
      expect((y.get(n.id) as { x: number }).x).toBeCloseTo((x.get(n.id) as { x: number }).x, 6);
      expect((y.get(n.id) as { y: number }).y).toBeCloseTo((x.get(n.id) as { y: number }).y, 6);
    }
  });

  it("en `abajo` el centro de comparación es el horizontal", () => {
    const { ns, aristas } = asimetrico();
    const p = disponerArbol(ns, aristas, { centrar: 'hijos', orientacion: 'abajo' });
    expect(cxx(ns, p, 'r')).toBeCloseTo((cxx(ns, p, 'a') + cxx(ns, p, 'b')) / 2, 6);
  });

  it("un padre más ancho que sus hijos no pisa a su vecino y sus hijos quedan centrados en él", () => {
    const ns = [nodo('r1', 100, 400), nodo('h1', 100, 20), nodo('h2', 100, 20), nodo('r2', 100, 60), nodo('h3', 100, 20)];
    const aristas = [['r1', 'h1'], ['r1', 'h2'], ['r2', 'h3']].map(([desde, hasta]) => ({ desde: desde as string, hasta: hasta as string }));
    const p = disponerArbol(ns, aristas, { centrar: 'hijos' });
    expect(solapes(ns, p)).toEqual([]);
    expect(cy(ns, p, 'r1')).toBeCloseTo((cy(ns, p, 'h1') + cy(ns, p, 'h2')) / 2, 6);
  });

  it("propiedad barrida: 20, 100 y 500 nodos de tamaños distintos: nunca se pisan y el padre queda en el medio de sus extremos", () => {
    for (const n of [20, 100, 500]) {
      for (const semilla of [1, 2]) {
        const { nodos, aristas } = arbolAlAzar(n, semilla * 100 + n);
        for (const orientacion of ['derecha', 'abajo'] as const) {
          for (const invertir of [false, true]) {
            const p = disponerArbol(nodos, aristas, { orientacion, invertir, centrar: 'hijos', alinear: 'inicio' });
            const etiqueta = `${n}/${semilla}/${orientacion}/${invertir}`;
            expect(p.size, etiqueta).toBe(n);
            expect(solapes(nodos, p), etiqueta).toEqual([]);
            const c = (id: string): number => {
              const q = centro(nodos.find((x) => x.id === id) as NodoDisposicion, p);
              return orientacion === 'derecha' ? q.y : q.x;
            };
            const hs = new Map<string, string[]>();
            for (const a of aristas) hs.set(a.desde, [...(hs.get(a.desde) ?? []), a.hasta]);
            for (const [padre, lista] of hs) {
              // Los hijos van en el orden de las aristas: el primero y el último son los extremos.
              expect(c(padre), `${etiqueta} ${padre}`).toBeCloseTo((c(lista[0] as string) + c(lista[lista.length - 1] as string)) / 2, 6);
            }
          }
        }
      }
    }
  });
});
