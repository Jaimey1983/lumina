import { describe, expect, it } from 'vitest';

import { detectarSeparador, parsearTabla } from './tabla.js';

describe('parsearTabla', () => {
  it('vacío o solo espacios no da filas', () => {
    expect(parsearTabla('')).toEqual([]);
    expect(parsearTabla('  \n \n')).toEqual([]);
  });
  it('detecta el tabulador (lo que llega al pegar desde una hoja de cálculo)', () => {
    expect(parsearTabla('a\tb\tc\n1\t2\t3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });
  it('detecta ; luego | luego , por orden de preferencia', () => {
    expect(detectarSeparador('a;b,c')).toBe(';');
    expect(detectarSeparador('a|b,c')).toBe('|');
    expect(detectarSeparador('a,b')).toBe(',');
    expect(parsearTabla('¿Cuál es, en español, la capital?;Bogotá')).toEqual([['¿Cuál es, en español, la capital?', 'Bogotá']]);
  });
  it('una sola columna cuando no hay separador', () => {
    expect(parsearTabla('uno\ndos\ntres')).toEqual([['uno'], ['dos'], ['tres']]);
  });
  it('comillas de CSV: separador dentro, comilla doblada y salto de línea', () => {
    expect(parsearTabla('"a;b";c')).toEqual([['a;b', 'c']]);
    expect(parsearTabla('"dijo ""hola""";x')).toEqual([['dijo "hola"', 'x']]);
    expect(parsearTabla('"línea 1\nlínea 2";x\ny;z')).toEqual([['línea 1\nlínea 2', 'x'], ['y', 'z']]);
  });
  it('recorta espacios, ignora filas vacías y entiende \\r\\n', () => {
    expect(parsearTabla(' a ; b \r\n\r\n c ; d ')).toEqual([['a', 'b'], ['c', 'd']]);
  });
  it('conserva tildes y la Ñ tal cual', () => {
    expect(parsearTabla('niño;Ñandú;canción')).toEqual([['niño', 'Ñandú', 'canción']]);
  });
});
