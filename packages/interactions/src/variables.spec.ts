import { describe, expect, it } from 'vitest';
import type { VariableDef } from '@lumina/types/interaction';
import { MAX_VARIABLES, validarVariables } from './variables.js';

const v = (p: Partial<VariableDef> = {}): VariableDef => ({
  id: 'v1',
  nombre: 'intentos',
  tipo: 'numero',
  valorInicial: 0,
  ...p,
});

describe('validarVariables', () => {
  it('acepta variables válidas', () => {
    expect(
      validarVariables([
        v(),
        v({ id: 'v2', nombre: 'activo', tipo: 'booleano', valorInicial: true }),
        v({ id: 'v3', nombre: 'nota', tipo: 'texto', valorInicial: 'a' }),
      ]),
    ).toEqual([]);
  });
  it('rechaza ids y nombres duplicados (sin distinguir mayúsculas)', () => {
    const e = validarVariables([v(), v(), v({ id: 'v2', nombre: 'INTENTOS' })]);
    expect(e.filter((x) => x.codigo === 'variable_duplicada')).toHaveLength(3);
  });
  it('rechaza nombre vacío, id vacío y tipo desconocido', () => {
    expect(validarVariables([v({ nombre: '  ' })])[0]?.codigo).toBe('variable_invalida');
    expect(validarVariables([v({ id: '' })])[0]?.codigo).toBe('variable_invalida');
    expect(
      validarVariables([v({ tipo: 'fecha' as unknown as 'numero' })])[0]?.codigo,
    ).toBe('variable_invalida');
  });
  it('rechaza valor inicial incoherente, NaN y texto largo', () => {
    expect(validarVariables([v({ valorInicial: 'x' })])[0]?.codigo).toBe(
      'valor_inicial_incoherente',
    );
    expect(validarVariables([v({ valorInicial: Number.NaN })])[0]?.codigo).toBe(
      'valor_inicial_incoherente',
    );
    expect(
      validarVariables([v({ tipo: 'texto', valorInicial: 'a'.repeat(201) })])[0]?.codigo,
    ).toBe('variable_invalida');
  });
  it('limita la cantidad', () => {
    const muchas = Array.from({ length: MAX_VARIABLES + 1 }, (_, i) =>
      v({ id: `v${i}`, nombre: `n${i}` }),
    );
    expect(validarVariables(muchas).some((x) => x.codigo === 'demasiadas_variables')).toBe(true);
  });
});
