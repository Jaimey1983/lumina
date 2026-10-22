import { describe, expect, it } from 'vitest';
import { disponerCuadricula } from './cuadricula.js';
import { solapes } from './util-pruebas.js';

const nodo = (id: string, ancho = 100, alto = 60) => ({ id, x: 500, y: 500, ancho, alto });

describe('disponerCuadricula', () => {
  it('filas de ceil(√n) columnas, en orden, desde (0, 0)', () => {
    const ns = Array.from({ length: 7 }, (_, i) => nodo(`n${i}`));
    const p = disponerCuadricula(ns);
    expect(p.get('n0')).toEqual({ x: 0, y: 0 });
    expect(p.get('n1')).toEqual({ x: 140, y: 0 });
    expect(p.get('n2')).toEqual({ x: 280, y: 0 });
    expect(p.get('n3')).toEqual({ x: 0, y: 100 }); // 3 columnas: la 4.ª va en la segunda fila
    expect(solapes(ns, p)).toEqual([]);
  });

  it('con tamaños distintos, cada fila es tan alta como su nodo más alto', () => {
    const ns = [nodo('a', 50, 200), nodo('b', 80, 30), nodo('c', 60, 60), nodo('d', 60, 60)];
    const p = disponerCuadricula(ns);
    expect(p.get('c')?.y).toBe(240); // 200 + 40
    expect(solapes(ns, p)).toEqual([]);
  });

  it('uno solo y ninguno', () => {
    expect(disponerCuadricula([nodo('a')]).get('a')).toEqual({ x: 0, y: 0 });
    expect(disponerCuadricula([]).size).toBe(0);
  });
});
