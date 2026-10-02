import { describe, expect, it } from 'vitest';
import type { VariableDef } from '@lumina/types/interaction';
import { asignarVariable } from './asignar.js';
import { crearEstadoInicial } from './estado.js';

const defs: VariableDef[] = [
  { id: 'a', nombre: 'a', tipo: 'numero', valorInicial: 1 },
  { id: 't', nombre: 't', tipo: 'texto', valorInicial: 'x' },
];

describe('asignarVariable', () => {
  const base = crearEstadoInicial(defs, []);

  it('asigna un valor válido sin mutar el estado original', () => {
    const next = asignarVariable(base, defs, 'a', 5);
    expect(next.variables['a']).toBe(5);
    expect(base.variables['a']).toBe(1);
    expect(next.variables['t']).toBe('x');
  });

  it('devuelve el mismo objeto si la variable no existe, el tipo no coincide o no cambia', () => {
    expect(asignarVariable(base, defs, 'zzz', 1)).toBe(base);
    expect(asignarVariable(base, defs, 'a', 'hola')).toBe(base);
    expect(asignarVariable(base, defs, 'a', Number.NaN)).toBe(base);
    expect(asignarVariable(base, defs, 'a', 1)).toBe(base);
  });

  it('rechaza ids como __proto__ y textos demasiado largos', () => {
    expect(asignarVariable(base, defs, '__proto__', 1)).toBe(base);
    expect(asignarVariable(base, defs, 't', 'x'.repeat(201))).toBe(base);
  });

  it('solo toca `variables`', () => {
    const next = asignarVariable(base, defs, 'a', 9);
    expect(Object.keys(next).sort()).toEqual(Object.keys(base).sort());
    expect(next.estados).toBe(base.estados);
  });
});
