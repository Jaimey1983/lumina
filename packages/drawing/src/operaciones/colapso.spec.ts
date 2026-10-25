import { describe, expect, it } from 'vitest';
import { conectarFormas } from '../conectores/enlazar.js';
import { formasVisibles } from '../conectores/puertos.js';
import { normalizarEscena } from '../normalizar.js';
import type { Escena } from '../tipos.js';
import { alternarColapso, contarOcultos, fijarColapso, formasConHijos, hijosDe, ocultosPorColapso, resumenDeColapso, tieneHijos } from './colapso.js';
import { escena, forma, getForma, linea } from './util-pruebas.js';
import { bloqueadosEfectivos, ocultosEfectivos } from './utilidades.js';

/** Un árbol: raiz → a, b ; a → a1, a2 ; b → b1. Las formas van una al lado de la otra para que los conectores no se pisen. */
const arbol = (...extra: Array<Record<string, unknown>>): Escena => {
  let e = escena(...['raiz', 'a', 'b', 'a1', 'a2', 'b1'].map((id, i) => forma(id, i * 150, (i % 3) * 100)), ...extra);
  for (const [p, h] of [['raiz', 'a'], ['raiz', 'b'], ['a', 'a1'], ['a', 'a2'], ['b', 'b1']] as const) e = conectarFormas(e, p, h);
  return e;
};
const plegar = (e: Escena, ...ids: string[]): Escena => fijarColapso(e, ids, true);
const conectores = (e: Escena): string[] => e.elementos.filter((x) => x.tipo === 'linea').map((x) => x.id);
const formasOcultas = (e: Escena): string[] => e.elementos.filter((x) => x.tipo === 'forma' && ocultosPorColapso(e).has(x.id)).map((x) => x.id);

describe('hijosDe y tieneHijos (Y38a)', () => {
  it('los destinos de los conectores que salen de la forma, en el orden de los conectores', () => {
    const e = arbol();
    expect(hijosDe(e, 'raiz')).toEqual(['a', 'b']);
    expect(hijosDe(e, 'a')).toEqual(['a1', 'a2']);
    expect(hijosDe(e, 'a1')).toEqual([]);
  });
  it('sin repetir aunque haya dos conectores al mismo hijo', () => {
    let e = arbol();
    e = { ...e, elementos: [...e.elementos, { ...(e.elementos.find((x) => x.tipo === 'linea') as object), id: 'duplicado' } as never] };
    expect(hijosDe(e, 'raiz')).toEqual(['a', 'b']);
  });
  it('un conector suelto o que va a algo que no es una forma no cuenta', () => {
    const e = escena(forma('a', 0, 0), forma('b', 300, 0), linea('suelto', [[0, 0], [10, 10]]), linea('a-nada', [[0, 0], [10, 10]], { origen: { elementoId: 'a', puerto: 0 }, destino: { elementoId: 'inexistente', puerto: 0 } }));
    expect(hijosDe(e, 'a')).toEqual([]);
  });
  it('tieneHijos y formasConHijos', () => {
    const e = arbol();
    expect(tieneHijos(e, 'raiz')).toBe(true);
    expect(tieneHijos(e, 'a1')).toBe(false);
    expect([...formasConHijos(e)].sort()).toEqual(['a', 'b', 'raiz']);
  });
});

describe('ocultosPorColapso (Y38a)', () => {
  it('sin ninguna plegada no hay nada oculto (y es el mismo conjunto vacío, sin armar el grafo)', () => {
    expect(ocultosPorColapso(arbol()).size).toBe(0);
    expect(resumenDeColapso(arbol())).toBe(resumenDeColapso(escena()));
  });

  it('plegar la raíz oculta todo lo demás y los conectores', () => {
    const e = plegar(arbol(), 'raiz');
    expect(formasOcultas(e).sort()).toEqual(['a', 'a1', 'a2', 'b', 'b1']);
    for (const id of conectores(e)) expect(ocultosPorColapso(e).has(id), id).toBe(true);
    expect(ocultosPorColapso(e).has('raiz')).toBe(false);
  });

  it('plegar una rama oculta solo la rama', () => {
    const e = plegar(arbol(), 'a');
    expect(formasOcultas(e).sort()).toEqual(['a1', 'a2']);
    expect(ocultosPorColapso(e).has('a')).toBe(false);
    const visibles = conectores(e).filter((id) => !ocultosPorColapso(e).has(id));
    expect(visibles).toHaveLength(3); // raiz→a, raiz→b y b→b1
  });

  it('plegadas anidadas: la de adentro queda oculta; desplegar la de afuera la muestra plegada', () => {
    const e = plegar(arbol(), 'raiz', 'a');
    expect(formasOcultas(e).sort()).toEqual(['a', 'a1', 'a2', 'b', 'b1']);
    const afuera = fijarColapso(e, ['raiz'], false);
    expect(formasOcultas(afuera).sort()).toEqual(['a1', 'a2']);
  });

  it('un nodo con dos padres se queda visible si alguno de los caminos se ve', () => {
    let e = escena(...['r', 'p', 'q', 'h'].map((id, i) => forma(id, i * 150, 0)));
    for (const [a, b] of [['r', 'p'], ['r', 'q'], ['p', 'h'], ['q', 'h']] as const) e = conectarFormas(e, a, b);
    expect(formasOcultas(plegar(e, 'p'))).toEqual([]);
    expect(formasOcultas(plegar(e, 'p', 'q'))).toEqual(['h']);
    expect(formasOcultas(plegar(e, 'r')).sort()).toEqual(['h', 'p', 'q']);
  });

  it('un ciclo no cuelga el cálculo ni oculta a la propia plegada', () => {
    let e = escena(...['r', 'a', 'b'].map((id, i) => forma(id, i * 150, 0)));
    for (const [x, y] of [['r', 'a'], ['a', 'b'], ['b', 'a']] as const) e = conectarFormas(e, x, y);
    const p = plegar(e, 'a');
    expect(formasOcultas(p)).toEqual(['b']);
    expect(ocultosPorColapso(p).has('a')).toBe(false);
  });

  it('un ciclo sin entrada no se oculta (no hay desde dónde plegarlo)', () => {
    let e = escena(...['a', 'b'].map((id, i) => forma(id, i * 150, 0)));
    for (const [x, y] of [['a', 'b'], ['b', 'a']] as const) e = conectarFormas(e, x, y);
    expect(formasOcultas(plegar(e, 'a'))).toEqual([]);
  });

  it('una plegada sin hijos no oculta nada (ni siquiera se pliega)', () => {
    const e = arbol();
    expect(plegar(e, 'a1')).toBe(e);
    const aMano = { ...e, elementos: e.elementos.map((x) => (x.id === 'a1' ? { ...x, colapsado: true as const } : x)) } as Escena;
    expect(ocultosPorColapso(aMano).size).toBe(0);
  });

  it('lo que ya estaba oculto a mano sigue oculto y no se cuenta', () => {
    const e = plegar(arbol(), 'a');
    const conMano = { ...e, elementos: e.elementos.map((x) => (x.id === 'a1' ? { ...x, oculto: true } : x)) } as Escena;
    expect(contarOcultos(conMano, 'a')).toBe(2); // las cuenta como plegadas: también cuelgan de «a»
    expect(ocultosEfectivos(conMano).has('a1')).toBe(true);
  });

  it('un conector entre dos formas visibles sigue visible', () => {
    const e = plegar(arbol(), 'a');
    const rb = e.elementos.find((x) => x.tipo === 'linea' && x.origen?.elementoId === 'raiz' && x.destino?.elementoId === 'b');
    expect(ocultosPorColapso(e).has((rb as { id: string }).id)).toBe(false);
  });
});

describe('contarOcultos (Y38a)', () => {
  it('cuenta formas, no conectores', () => {
    const e = plegar(arbol(), 'raiz');
    expect(contarOcultos(e, 'raiz')).toBe(5);
    expect(contarOcultos(plegar(arbol(), 'a'), 'a')).toBe(2);
  });
  it('con plegadas anidadas cada una cuenta lo suyo', () => {
    const e = plegar(arbol(), 'raiz', 'a');
    expect(contarOcultos(e, 'raiz')).toBe(5);
    expect(contarOcultos(e, 'a')).toBe(2);
  });
  it('0 si no está plegada o no oculta nada', () => {
    expect(contarOcultos(arbol(), 'raiz')).toBe(0);
    expect(contarOcultos(plegar(arbol(), 'a'), 'b')).toBe(0);
  });
});

describe('alternarColapso y fijarColapso (Y38a)', () => {
  it('pliega, despliega y vuelve a plegar', () => {
    const e = arbol();
    const p = alternarColapso(e, 'a');
    expect(getForma(p, 'a').colapsado).toBe(true);
    const d = alternarColapso(p, 'a');
    expect('colapsado' in getForma(d, 'a')).toBe(false); // se quita la clave, no queda en false
    expect(JSON.stringify(d)).toBe(JSON.stringify(e));
  });
  it('no pliega una forma sin hijos, un id que no existe ni algo que no es una forma', () => {
    const e = arbol();
    expect(alternarColapso(e, 'a1')).toBe(e);
    expect(alternarColapso(e, 'no-existe')).toBe(e);
    const conLinea = e;
    expect(alternarColapso(conLinea, conectores(e)[0] as string)).toBe(e);
  });
  it('varias de una vez; solo cambia `colapsado` y no toca lo demás', () => {
    const e = arbol();
    const p = fijarColapso(e, ['raiz', 'a', 'a1'], true);
    expect(getForma(p, 'raiz').colapsado).toBe(true);
    expect(getForma(p, 'a').colapsado).toBe(true);
    expect('colapsado' in getForma(p, 'a1')).toBe(false);
    expect(getForma(p, 'b')).toBe(getForma(e, 'b')); // la misma referencia: no se tocó
  });
  it('misma escena si nada cambia', () => {
    const e = arbol();
    expect(fijarColapso(e, ['raiz'], false)).toBe(e);
    const p = plegar(e, 'raiz');
    expect(fijarColapso(p, ['raiz'], true)).toBe(p);
  });
  it('las formas bloqueadas se pliegan igual (no se edita su contenido)', () => {
    const e = arbol();
    const bloqueada = { ...e, elementos: e.elementos.map((x) => (x.id === 'a' ? { ...x, bloqueado: true } : x)) } as Escena;
    expect(bloqueadosEfectivos(bloqueada).has('a')).toBe(true);
    expect(getForma(alternarColapso(bloqueada, 'a'), 'a').colapsado).toBe(true);
  });
  it('no cambia la escena de entrada', () => {
    const e = arbol();
    const copia = JSON.stringify(e);
    alternarColapso(e, 'raiz');
    expect(JSON.stringify(e)).toBe(copia);
  });
});

describe('lo plegado cuenta como oculto (Y38a)', () => {
  it('ocultosEfectivos lo incluye (no se elige, no se alinea, no se organiza)', () => {
    const e = plegar(arbol(), 'a');
    expect([...ocultosEfectivos(e)].sort()).toEqual(expect.arrayContaining(['a1', 'a2']));
    expect(ocultosEfectivos(e).has('a')).toBe(false);
    expect(ocultosEfectivos(arbol()).size).toBe(0);
  });
  it('formasVisibles no incluye lo plegado (no ofrece puertos ni estorba a los conectores)', () => {
    const e = plegar(arbol(), 'a');
    expect(formasVisibles(e).map((f) => f.id).sort()).toEqual(['a', 'b', 'b1', 'raiz']);
  });
});

describe('normalizar `colapsado` (Y38a)', () => {
  const con = (valor: unknown): Escena => normalizarEscena({ elementos: [{ id: 'a', tipo: 'forma', forma: 'rectangulo', transformacion: { x: 0, y: 0, ancho: 100, alto: 60, rotacion: 0 }, colapsado: valor }] });
  it('solo `true` se conserva', () => {
    expect(getForma(con(true), 'a').colapsado).toBe(true);
  });
  it('false, "si", 1, null y lo demás se omiten', () => {
    for (const v of [false, 'si', 1, null, 'true', {}, []]) expect('colapsado' in getForma(con(v), 'a'), String(v)).toBe(false);
  });
  it('es idempotente y se serializa sin la clave cuando no está', () => {
    const e = con(true);
    expect(JSON.stringify(normalizarEscena(e))).toBe(JSON.stringify(e));
    expect(JSON.stringify(con(false))).not.toContain('colapsado');
  });
  it('un texto o una línea con `colapsado` lo ignoran (solo las formas se pliegan)', () => {
    const e = normalizarEscena({ elementos: [{ id: 't', tipo: 'texto', texto: 'x', colapsado: true, transformacion: { x: 0, y: 0, ancho: 100, alto: 30, rotacion: 0 } }] });
    expect(JSON.stringify(e)).not.toContain('colapsado');
  });
});

describe('rendimiento (DW9, Y38a)', () => {
  const grande = (n: number, plegar: boolean): Escena => {
    const els: Array<Record<string, unknown>> = Array.from({ length: n }, (_v, i) => forma(`f${i}`, (i % 25) * 200, Math.floor(i / 25) * 120, 100, 60, plegar && i % 7 === 0 && i > 0 ? { colapsado: true } : {}));
    let e = normalizarEscena({ ancho: 10000, alto: 10000, elementos: els });
    for (let i = 1; i < n; i++) e = conectarFormas(e, `f${Math.floor((i - 1) / 2)}`, `f${i}`);
    return e;
  };
  const medir = (g: () => void): number => {
    for (let i = 0; i < 3; i++) g();
    const m: number[] = [];
    for (let i = 0; i < 7; i++) {
      const a = performance.now();
      g();
      m.push(performance.now() - a);
    }
    return [...m].sort((x, y) => x - y)[3] as number;
  };
  it('sin plegadas, `ocultosEfectivos` cuesta lo mismo que sin el cálculo de lo plegado (camino rápido)', () => {
    const e = grande(500, false);
    const sin = medir(() => void ocultosEfectivos(e));
    const solo = medir(() => void ocultosPorColapso(e));
    expect(solo).toBeLessThan(Math.max(sin, 0.05) * 2 + 0.5);
  });
  it('con 500 formas y muchas plegadas se calcula en poco tiempo', () => {
    const e = grande(500, true);
    expect(medir(() => void ocultosPorColapso(e))).toBeLessThan(100);
  });
});
