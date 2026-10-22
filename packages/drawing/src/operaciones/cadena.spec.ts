import { describe, expect, it } from 'vitest';
import { conectarFormas, existeConector } from '../conectores/enlazar.js';
import { conectarEnCadena, filtrarFormasParaCadena, ordenEspacialParaCadena, ordenParaCadena } from './cadena.js';
import { escena, forma, linea } from './util-pruebas.js';

describe('conectarEnCadena', () => {
  it('con menos de dos formas no cambia la escena', () => {
    const e = escena(forma('a', 0, 0));
    expect(conectarEnCadena(e, ['a'])).toBe(e);
    expect(conectarEnCadena(e, [])).toBe(e);
  });

  it('conecta 2, 5 y 20 formas en el orden dado', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `f${i}`);
    const elementos = ids.map((id, i) => forma(id, i * 120, 0));
    const e0 = escena(...elementos);
    for (const n of [2, 5, 20]) {
      const sub = ids.slice(0, n);
      const e1 = conectarEnCadena(e0, sub);
      const lineas = e1.elementos.filter((x) => x.tipo === 'linea');
      expect(lineas).toHaveLength(n - 1);
      for (let i = 0; i < n - 1; i++) {
        expect(existeConector(e1, sub[i]!, sub[i + 1]!)).toBe(true);
      }
    }
  });

  it('respeta el orden de ids (no enlaza al revés)', () => {
    const e0 = escena(forma('a', 0, 0), forma('b', 200, 0), forma('c', 400, 0));
    const e1 = conectarEnCadena(e0, ['a', 'b', 'c']);
    expect(existeConector(e1, 'a', 'b')).toBe(true);
    expect(existeConector(e1, 'b', 'c')).toBe(true);
    expect(existeConector(e1, 'c', 'b')).toBe(false);
    expect(existeConector(e1, 'b', 'a')).toBe(false);
  });

  it('no duplica un conector que ya existe', () => {
    const e0 = escena(forma('a', 0, 0), forma('b', 200, 0), forma('c', 400, 0));
    const e1 = conectarFormas(e0, 'a', 'b');
    const antes = e1.elementos.filter((x) => x.tipo === 'linea').length;
    const e2 = conectarEnCadena(e1, ['a', 'b', 'c']);
    expect(e2.elementos.filter((x) => x.tipo === 'linea')).toHaveLength(antes + 1);
    const e3 = conectarEnCadena(e2, ['a', 'b']);
    expect(e3).toBe(e2);
  });

  it('ignora líneas y repeticiones en la lista', () => {
    const e0 = escena(forma('a', 0, 0), forma('b', 200, 0), linea('L', [[0, 0], [10, 10]]));
    expect(filtrarFormasParaCadena(e0, ['a', 'L', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('orden espacial: izquierda a derecha y arriba a abajo', () => {
    const e = escena(forma('abajo', 100, 300), forma('izq', 0, 0), forma('der', 300, 0), forma('arriba', 100, 0));
    expect(ordenEspacialParaCadena(e, ['abajo', 'der', 'izq', 'arriba'])).toEqual(['izq', 'arriba', 'abajo', 'der']);
  });

  it('ordenParaCadena: respeta el orden elegido si difiere de la escena y lee en pantalla si coincide', () => {
    const e = escena(forma('r', 400, 0), forma('l', 0, 0), forma('m', 200, 0));
    expect(ordenParaCadena(e, ['r', 'l', 'm'])).toEqual(['l', 'm', 'r']);
    expect(ordenParaCadena(e, ['m', 'l', 'r'])).toEqual(['m', 'l', 'r']);
    expect(ordenParaCadena(e, ['r', 'm'])).toEqual(['m', 'r']); // subconjunto en el orden de la escena
    expect(ordenParaCadena(e, ['m', 'r'])).toEqual(['m', 'r']);
    expect(ordenParaCadena(e, ['l'])).toEqual(['l']);
  });
});
