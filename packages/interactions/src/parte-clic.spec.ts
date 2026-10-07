// Etapa M / M2c: `parte_clic` — clic en una parte de un elemento (parámetro = id de la parte).
import { describe, expect, it } from 'vitest';
import type { Regla } from '@lumina/types/interaction';
import { crearEstadoInicial } from './estado.js';
import { errorDeParametro, esIdDeParte } from './eventos.js';
import { describirEvento } from './describir.js';
import { procesarEvento } from './motor.js';
import { deBloque, num, regla } from './prueba-utils.js';

const vars = [num('a', 0), num('b', 0)];
const suma = (variableId: string) => ({ tipo: 'sumar_variable', variableId, cantidad: 1 }) as const;
const parteRegla = (id: string, parte: string | undefined, v: string): Regla => {
  const r = regla(id, 'parte_clic', [suma(v)]);
  return parte === undefined ? r : { ...r, parametro: parte };
};
const correr = (reglas: ReturnType<typeof deBloque>[], parte?: string) =>
  procesarEvento(reglas, crearEstadoInicial(vars), {
    tipo: 'parte_clic',
    bloqueId: 'b1',
    slideId: 's1',
    ...(parte ? { detalle: { parte } } : {}),
  }, { variables: vars });

describe('parte_clic', () => {
  it('solo dispara la regla de la parte tocada', () => {
    const reglas = [
      deBloque(parteRegla('r1', 'a1', 'a'), 'b1'),
      deBloque(parteRegla('r2', 'b2', 'b'), 'b1'),
    ];
    expect(correr(reglas, 'b2').estado.variables).toMatchObject({ a: 0, b: 1 });
  });

  it('sin detalle o con regla sin parámetro no dispara', () => {
    const reglas = [deBloque(parteRegla('r1', 'a1', 'a'), 'b1'), deBloque(parteRegla('r2', undefined, 'b'), 'b1')];
    expect(correr(reglas).estado.variables).toMatchObject({ a: 0, b: 0 });
    expect(correr(reglas, 'a1').estado.variables).toMatchObject({ a: 1, b: 0 });
  });

  it('valida el id de la parte', () => {
    expect(esIdDeParte('a_1-x')).toBe(true);
    expect(esIdDeParte('a b')).toBe(false);
    expect(esIdDeParte('')).toBe(false);
    expect(esIdDeParte(3)).toBe(false);
    expect(errorDeParametro({ evento: 'parte_clic', parametro: 'a1' })).toBeUndefined();
    expect(errorDeParametro({ evento: 'parte_clic' })).toMatch(/parte/);
    expect(errorDeParametro({ evento: 'parte_clic', parametro: '<x>' })).toMatch(/parte/);
  });

  it('se describe con el nombre de la parte', () => {
    const ctx = {} as never;
    expect(describirEvento({ evento: 'parte_clic', parametro: 'a1' }, ctx)).toBe('se hace clic en la parte «a1»');
  });
});
