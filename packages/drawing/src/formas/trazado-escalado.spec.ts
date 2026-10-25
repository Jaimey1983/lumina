import { describe, expect, it } from 'vitest';
import { escalarTrazado } from './trazado-escalado.js';

const e = (d: string, sx = 1, sy = 1): string => escalarTrazado(d, sx, sy);

describe('escalarTrazado — comandos absolutos', () => {
  it('M, L, Z', () => {
    expect(e('M0 0L10 0L10 10Z')).toBe('M0,0 L10,0 L10,10 Z');
  });

  it('escala cada eje con su factor', () => {
    expect(e('M2 4L6 8', 2, 3)).toBe('M4,12 L12,24');
  });

  it('H y V pasan a L, con el otro eje del punto actual', () => {
    expect(e('M1 2H5V6', 2, 10)).toBe('M2,20 L10,20 L10,60');
  });

  it('C cúbica', () => {
    expect(e('M0 0C1 2 3 4 5 6', 2, 2)).toBe('M0,0 C2,4 6,8 10,12');
  });

  it('Q cuadrática', () => {
    expect(e('M0 0Q1 2 3 4', 10, 1)).toBe('M0,0 Q10,2 30,4');
  });

  it('A arco: rx y ry escalan con su eje, las banderas no', () => {
    expect(e('M0 0A2 3 0 1 0 4 6', 2, 5)).toBe('M0,0 A4,15 0 1 0 8,30');
  });

  it('el radio de un arco con signo negativo se toma en valor absoluto (como el navegador)', () => {
    expect(e('M0 0A-2 -3 0 0 1 4 6', 1, 1)).toBe('M0,0 A2,3 0 0 1 4,6');
  });
});

describe('escalarTrazado — comandos relativos', () => {
  it('m, l, h, v, z', () => {
    expect(e('m1 1l2 0h3v4z', 2, 2)).toBe('M2,2 L6,2 L12,2 L12,10 Z');
  });

  it('el punto actual tras `z` es el inicio del subtrazado', () => {
    expect(e('M1 1h4v4zl2 0')).toBe('M1,1 L5,1 L5,5 Z L3,1');
  });

  it('c relativa usa el punto actual para sus tres puntos', () => {
    expect(e('M10 10c1 2 3 4 5 6', 2, 2)).toBe('M20,20 C22,24 26,28 30,32');
  });

  it('q relativa', () => {
    expect(e('M2 2q1 1 2 0')).toBe('M2,2 Q3,3 4,2');
  });

  it('a relativa: el destino se suma al punto actual y los radios no', () => {
    expect(e('M10 10a2 3 0 0 1 4 6', 2, 5)).toBe('M20,50 A4,15 0 0 1 28,80');
  });

  it('un `m` relativo al comienzo parte del origen', () => {
    expect(e('m3 4l1 1')).toBe('M3,4 L4,5');
  });
});

describe('escalarTrazado — repeticiones, números pegados y banderas pegadas', () => {
  it('varios pares tras un M son líneas', () => {
    expect(e('M0 0 10 0 10 10')).toBe('M0,0 L10,0 L10,10');
  });

  it('varios pares tras una m relativa son líneas relativas', () => {
    expect(e('m1 1 2 0 0 2')).toBe('M1,1 L3,1 L3,3');
  });

  it('varias repeticiones de c', () => {
    expect(e('M0 0c1 1 2 2 3 3 1 1 2 2 3 3')).toBe('M0,0 C1,1 2,2 3,3 C4,4 5,5 6,6');
  });

  it('números pegados: signos y puntos decimales', () => {
    expect(e('M.5.5L-1-2')).toBe('M0.5,0.5 L-1,-2');
    expect(e('M1.5.5L1e1-1')).toBe('M1.5,0.5 L10,-1');
  });

  it('banderas de arco pegadas al resto (`a2 2 0 0022 17`)', () => {
    expect(e('M0 0a2 2 0 0022 17')).toBe('M0,0 A2,2 0 0 0 22,17');
    expect(e('M0 0a2 2 0 1122 17')).toBe('M0,0 A2,2 0 1 1 22,17');
  });

  it('comas y saltos de línea como separadores', () => {
    expect(e('M0,0\nL10,\n10')).toBe('M0,0 L10,10');
  });
});

describe('escalarTrazado — reflejo de S y T', () => {
  it('S usa el reflejo del segundo punto de control del C anterior', () => {
    // C termina en (4, 0) con control (3, 1): el reflejo respecto de (4, 0) es (5, -1).
    expect(e('M0 0C1 1 3 1 4 0S7 1 8 0')).toBe('M0,0 C1,1 3,1 4,0 C5,-1 7,1 8,0');
  });

  it('S sin un C antes usa el punto actual como primer control', () => {
    expect(e('M0 0S2 2 4 0')).toBe('M0,0 C0,0 2,2 4,0');
  });

  it('s relativa', () => {
    expect(e('M0 0C1 1 3 1 4 0s3 1 4 0')).toBe('M0,0 C1,1 3,1 4,0 C5,-1 7,1 8,0');
  });

  it('T refleja el control de la Q anterior', () => {
    // Q (1,1)→(2,0); el reflejo respecto de (2,0) es (3,-1).
    expect(e('M0 0Q1 1 2 0T4 0')).toBe('M0,0 Q1,1 2,0 Q3,-1 4,0');
  });

  it('T sin una Q antes usa el punto actual', () => {
    expect(e('M0 0T4 0')).toBe('M0,0 Q0,0 4,0');
  });
});

describe('escalarTrazado — entradas rotas', () => {
  it.each([
    ['vacía', ''],
    ['solo espacios', '   '],
    ['comando desconocido', 'M0 0X1 1'],
    ['faltan argumentos', 'M0'],
    ['letra suelta', 'L'],
    ['bandera inválida', 'M0 0A1 1 0 2 0 1 1'],
    ['texto cualquiera', 'hola'],
  ])('%s → vacío, sin lanzar', (_nombre, d) => {
    expect(e(d)).toBe('');
  });

  it('factores no finitos → vacío', () => {
    expect(escalarTrazado('M0 0L1 1', NaN, 1)).toBe('');
    expect(escalarTrazado('M0 0L1 1', 1, Infinity)).toBe('');
  });

  it('nunca deja un NaN', () => {
    for (const d of ['M0 0L1 1', 'M0 0C1 1 2 2 3 3', 'M1 1a2 2 0 0 1 4 4z']) expect(e(d, 3, 7)).not.toContain('NaN');
  });
});

describe('escalarTrazado — propiedades', () => {
  it('escalar con 1 y 1 es lo mismo que convertir a absolutos (idempotente al volver a pasar el resultado)', () => {
    const una = e('M2 3l4 0a2 2 0 0 1 2 2v3h-1z');
    expect(e(una)).toBe(una);
  });

  it('escalar en dos pasos es escalar de una vez', () => {
    const d = 'M2 3C4 5 6 7 8 9S12 13 14 15a2 2 0 0 1 3 4zm1 1l2 2';
    expect(e(e(d, 2, 3), 5, 7)).toBe(e(d, 10, 21));
  });
});
