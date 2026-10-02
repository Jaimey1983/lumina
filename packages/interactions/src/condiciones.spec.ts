import { describe, expect, it } from 'vitest';
import type { Condicion } from '@lumina/types/interaction';
import { evaluarCondicion, evaluarCondiciones } from './condiciones.js';
import { crearEstadoInicial } from './estado.js';
import { bool, cmp, lit, num, txt, variable } from './prueba-utils.js';
import type { Aviso } from './tipos.js';

const estado = crearEstadoInicial([
  num('n', 5),
  txt('t', 'hola'),
  bool('b', true),
]);
const ev = (c: Condicion) => {
  const avisos: Aviso[] = [];
  const r = evaluarCondicion(c, estado, { avisos, profundidadMax: 16 });
  return { r, avisos };
};

describe('comparaciones', () => {
  it.each([
    ['==', 5, true],
    ['==', 4, false],
    ['!=', 4, true],
    ['<', 6, true],
    ['<', 5, false],
    ['<=', 5, true],
    ['>', 4, true],
    ['>=', 6, false],
  ] as const)('n %s %s → %s', (op, valor, esperado) => {
    expect(ev(cmp(variable('n'), op, lit(valor))).r).toBe(esperado);
  });

  it('== entre tipos distintos es falso y != es verdadero (sin coerción)', () => {
    expect(ev(cmp(variable('n'), '==', lit('5'))).r).toBe(false);
    expect(ev(cmp(variable('n'), '!=', lit('5'))).r).toBe(true);
    expect(ev(cmp(variable('b'), '==', lit(1))).r).toBe(false);
  });

  it('el orden solo vale entre números: texto → falso + aviso', () => {
    const { r, avisos } = ev(cmp(variable('t'), '<', lit('zzz')));
    expect(r).toBe(false);
    expect(avisos.map((a) => a.codigo)).toEqual(['tipo_incompatible']);
  });

  it('NaN / Infinity no pasan por comparaciones de orden', () => {
    expect(ev(cmp(lit(Number.NaN), '<', lit(1))).r).toBe(false);
    expect(ev(cmp(lit(Infinity), '>', lit(1))).r).toBe(false);
  });

  it('variable inexistente: falso (también con !=) y deja aviso', () => {
    for (const op of ['==', '!=', '<'] as const) {
      const { r, avisos } = ev(cmp(variable('fantasma'), op, lit(1)));
      expect(r).toBe(false);
      expect(avisos[0]?.codigo).toBe('variable_inexistente');
    }
  });

  it('un id peligroso no "existe" por herencia del prototipo', () => {
    for (const id of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      expect(ev(cmp(variable(id), '==', lit(1))).avisos[0]?.codigo).toBe(
        'variable_inexistente',
      );
    }
  });
});

describe('operandos de bloque', () => {
  it('estado_bloque: sin registro es "normal"', () => {
    const c = cmp({ tipo: 'estado_bloque', bloqueId: 'x' }, '==', lit('normal'));
    expect(ev(c).r).toBe(true);
  });
  it('respuesta_correcta: sin respuesta registrada es false', () => {
    const c = cmp({ tipo: 'respuesta_correcta', bloqueId: 'x' }, '==', lit(true));
    expect(ev(c).r).toBe(false);
  });
});

describe('y / o / no', () => {
  const V = cmp(lit(1), '==', lit(1));
  const F = cmp(lit(1), '==', lit(2));
  it('y', () => {
    expect(ev({ tipo: 'y', condiciones: [V, V] }).r).toBe(true);
    expect(ev({ tipo: 'y', condiciones: [V, F] }).r).toBe(false);
  });
  it('o', () => {
    expect(ev({ tipo: 'o', condiciones: [F, V] }).r).toBe(true);
    expect(ev({ tipo: 'o', condiciones: [F, F] }).r).toBe(false);
  });
  it('no', () => {
    expect(ev({ tipo: 'no', condicion: F }).r).toBe(true);
  });
  it('elementos neutros: y vacío = verdadero, o vacío = falso', () => {
    expect(ev({ tipo: 'y', condiciones: [] }).r).toBe(true);
    expect(ev({ tipo: 'o', condiciones: [] }).r).toBe(false);
  });
  it('lista vacía de condiciones de una regla = verdadero', () => {
    expect(evaluarCondiciones([], estado, { avisos: [], profundidadMax: 16 })).toBe(true);
  });
});

describe('profundidad (entrada no confiable)', () => {
  it('una condición anidada de más del límite es falsa y no revienta la pila', () => {
    let c: Condicion = cmp(lit(1), '==', lit(1));
    for (let i = 0; i < 10_000; i++) c = { tipo: 'no', condicion: c };
    const avisos: Aviso[] = [];
    const r = evaluarCondicion(c, estado, { avisos, profundidadMax: 16 });
    expect(r).toBe(false);
    expect(avisos.some((a) => a.codigo === 'condicion_demasiado_profunda')).toBe(true);
  });
});

describe('una condición rota hace falsa la regla ENTERA (falla cerrado)', () => {
  const F = cmp(lit(1), '==', lit(2));
  const rota = cmp(variable('borrada'), '==', lit(1));
  const incompatible = cmp(variable('t'), '<', lit('z'));

  it('no(rota) NO es verdadero: un `no` no puede "arreglar" una regla rota', () => {
    expect(ev({ tipo: 'no', condicion: rota }).r).toBe(false);
    expect(ev({ tipo: 'no', condicion: incompatible }).r).toBe(false);
  });
  it('o(falso, rota) y y(verdadero, rota) tampoco disparan', () => {
    expect(ev({ tipo: 'o', condiciones: [F, rota] }).r).toBe(false);
    expect(
      ev({ tipo: 'y', condiciones: [cmp(lit(1), '==', lit(1)), rota] }).r,
    ).toBe(false);
  });
  it('en cambio una rama NO visitada (cortocircuito) no la rompe', () => {
    const V = cmp(lit(1), '==', lit(1));
    expect(ev({ tipo: 'o', condiciones: [V, rota] }).r).toBe(true);
  });
  it('la marca de rota se reinicia entre evaluaciones', () => {
    const ctx = { avisos: [] as Aviso[], profundidadMax: 16 };
    expect(evaluarCondicion(rota, estado, ctx)).toBe(false);
    expect(evaluarCondicion(cmp(lit(1), '==', lit(1)), estado, ctx)).toBe(true);
  });
  it('con 10 000 `no` anidados no alterna: sigue siendo falso', () => {
    let c: Condicion = cmp(lit(1), '==', lit(1));
    for (let i = 0; i < 10_001; i++) c = { tipo: 'no', condicion: c };
    expect(ev(c).r).toBe(false);
  });
});
