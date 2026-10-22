import { describe, expect, it } from 'vitest';
import { conectarFormas } from '../conectores/enlazar.js';
import { escena, forma, grupo, linea, texto } from '../operaciones/util-pruebas.js';
import { bosqueDe, extraerGrafo, MAX_FORMAS_DISPOSICION, separarSueltos, type Grafo } from './grafo.js';

const grafo = (e: ReturnType<typeof escena>, ids?: string[]): Grafo => {
  const g = extraerGrafo(e, ids);
  if ('error' in g) throw new Error(g.error);
  return g;
};
const cadena = (ids: string[]): ReturnType<typeof escena> => {
  let e = escena(...ids.map((id, i) => forma(id, i * 200, 0)));
  for (let i = 0; i < ids.length - 1; i++) e = conectarFormas(e, ids[i] as string, ids[i + 1] as string);
  return e;
};

describe('extraerGrafo', () => {
  it('los nodos son las formas (en el orden de la escena) con su caja, y las aristas los conectores entre ellas', () => {
    const g = grafo(cadena(['a', 'b', 'c']));
    expect(g.nodos.map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(g.nodos[1]).toMatchObject({ x: 200, y: 0, ancho: 100, alto: 60 });
    expect(g.aristas).toEqual([{ desde: 'a', hasta: 'b' }, { desde: 'b', hasta: 'c' }]);
  });

  it('con menos de dos formas no hay nada que organizar', () => {
    expect(extraerGrafo(escena(forma('a', 0, 0)))).toEqual({ error: 'pocas' });
    expect(extraerGrafo(escena())).toEqual({ error: 'pocas' });
    expect(extraerGrafo(cadena(['a', 'b', 'c']), ['a'])).toEqual({ error: 'pocas' });
  });

  it('con más de 500 formas se rechaza; con 500 pasa', () => {
    const f = (n: number) => escena(...Array.from({ length: n }, (_, i) => forma(`f${i}`, i * 10, 0, 5, 5)));
    expect(extraerGrafo(f(MAX_FORMAS_DISPOSICION + 1))).toEqual({ error: 'demasiadas' });
    expect('error' in extraerGrafo(f(MAX_FORMAS_DISPOSICION))).toBe(false);
  });

  it('un límite que se mide sobre lo elegido: 501 formas en la escena pero solo 3 elegidas se organizan', () => {
    const e = escena(...Array.from({ length: 501 }, (_, i) => forma(`f${i}`, i * 10, 0, 5, 5)));
    expect(grafo(e, ['f0', 'f1', 'f2']).nodos).toHaveLength(3);
  });

  it('con formas elegidas solo cuentan ellas y los conectores entre ellas', () => {
    const e = cadena(['a', 'b', 'c', 'd']);
    const g = grafo(e, ['b', 'c']);
    expect(g.nodos.map((n) => n.id)).toEqual(['b', 'c']);
    expect(g.aristas).toEqual([{ desde: 'b', hasta: 'c' }]);
  });

  it('lo elegido que no es una forma (líneas, textos) no se cuenta como nodo', () => {
    const e = escena(forma('a', 0, 0), forma('b', 200, 0), texto('t', 0, 200), linea('l', [[0, 300], [100, 300]]));
    const g = grafo(e);
    expect(g.nodos.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('una forma bloqueada o oculta no es un nodo, y sus conectores no cuentan', () => {
    let e = escena(forma('a', 0, 0), forma('b', 200, 0, 100, 60, { bloqueado: true }), forma('c', 400, 0), forma('d', 600, 0, 100, 60, { oculto: true }), forma('e', 800, 0));
    e = conectarFormas(e, 'a', 'b');
    e = conectarFormas(e, 'a', 'c');
    const g = grafo(e);
    expect(g.nodos.map((n) => n.id)).toEqual(['a', 'c', 'e']);
    expect(g.aristas).toEqual([{ desde: 'a', hasta: 'c' }]);
  });

  it('un grupo es UN nodo (con la caja de todos sus hijos) y los conectores a sus hijos van al grupo', () => {
    let e = escena(forma('a', 0, 0), forma('x', 300, 0), forma('y', 500, 100), grupo('g', ['x', 'y']), forma('z', 900, 0));
    e = conectarFormas(e, 'a', 'x');
    e = conectarFormas(e, 'y', 'z');
    const g = grafo(e);
    expect(g.nodos.map((n) => n.id)).toEqual(['a', 'g', 'z']);
    expect(g.nodos[1]).toMatchObject({ x: 300, y: 0, ancho: 300, alto: 160 });
    expect(g.aristas).toEqual([{ desde: 'a', hasta: 'g' }, { desde: 'g', hasta: 'z' }]);
  });

  it('un grupo con un hijo bloqueado no se mueve (no se puede mover a medias)', () => {
    const e = escena(forma('a', 0, 0), forma('b', 200, 0), forma('x', 400, 0, 100, 60, { bloqueado: true }), forma('y', 600, 0), grupo('g', ['x', 'y']));
    expect(grafo(e).nodos.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('un conector entre dos formas del mismo grupo no es una arista', () => {
    let e = escena(forma('x', 0, 0), forma('y', 200, 0), grupo('g', ['x', 'y']), forma('z', 600, 0));
    e = conectarFormas(e, 'x', 'y');
    expect(grafo(e).aristas).toEqual([]);
  });

  it('los conectores con un extremo suelto no cuentan, y los repetidos se cuentan una vez', () => {
    let e = escena(forma('a', 0, 0), forma('b', 200, 0), linea('suelta', [[0, 100], [50, 100]]));
    e = conectarFormas(e, 'a', 'b');
    // Un segundo conector idéntico (misma dirección): se funde con el primero.
    const l = e.elementos.find((x) => x.tipo === 'linea' && x.origen) as { origen: unknown; destino: unknown };
    const e2 = { ...e, elementos: [...e.elementos, { ...(l as object), id: 'repe' }] } as typeof e;
    expect(grafo(e2).aristas).toEqual([{ desde: 'a', hasta: 'b' }]);
  });

  it('el sentido de las aristas es el del conector', () => {
    let e = escena(forma('a', 0, 0), forma('b', 200, 0));
    e = conectarFormas(e, 'b', 'a');
    expect(grafo(e).aristas).toEqual([{ desde: 'b', hasta: 'a' }]);
  });
});

describe('separarSueltos', () => {
  it('los que tienen alguna arista y los que no, cada uno en su orden', () => {
    let e = escena(forma('a', 0, 0), forma('s1', 200, 0), forma('b', 400, 0), forma('s2', 600, 0));
    e = conectarFormas(e, 'a', 'b');
    const { conectados, sueltos } = separarSueltos(grafo(e));
    expect(conectados.map((n) => n.id)).toEqual(['a', 'b']);
    expect(sueltos.map((n) => n.id)).toEqual(['s1', 's2']);
  });
});

describe('bosqueDe', () => {
  const n = (id: string) => ({ id, x: 0, y: 0, ancho: 10, alto: 10 });
  it('las raíces son los nodos sin entrada, en orden, con su profundidad', () => {
    const b = bosqueDe(['a', 'b', 'c', 'd', 'e'].map(n), [{ desde: 'a', hasta: 'c' }, { desde: 'b', hasta: 'c' }, { desde: 'c', hasta: 'd' }]);
    expect(b.raices).toEqual(['a', 'b', 'e']);
    expect(b.hijos.get('a')).toEqual(['c']); // «c» tiene dos padres: se queda con el primero
    expect(b.hijos.get('b')).toBeUndefined();
    expect([...b.profundidad.entries()]).toEqual(expect.arrayContaining([['a', 0], ['c', 1], ['d', 2], ['b', 0]]));
  });

  it('un ciclo no se cuelga: cada nodo se visita una vez y la arista de vuelta no cuenta', () => {
    const b = bosqueDe(['a', 'b', 'c'].map(n), [{ desde: 'a', hasta: 'b' }, { desde: 'b', hasta: 'c' }, { desde: 'c', hasta: 'a' }]);
    expect(b.raices).toEqual(['a']);
    expect(b.hijos.get('a')).toEqual(['b']);
    expect(b.hijos.get('b')).toEqual(['c']);
    expect(b.hijos.get('c')).toBeUndefined();
  });

  it('un ciclo sin ninguna entrada elige como raíz el primero del orden', () => {
    const b = bosqueDe(['x', 'y'].map(n), [{ desde: 'y', hasta: 'x' }, { desde: 'x', hasta: 'y' }]);
    expect(b.raices).toEqual(['x']);
    expect(b.hijos.get('x')).toEqual(['y']);
  });

  it('un auto-ciclo no rompe nada', () => {
    const b = bosqueDe(['a'].map(n), [{ desde: 'a', hasta: 'a' }]);
    expect(b.raices).toEqual(['a']);
  });
});
