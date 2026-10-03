import { describe, expect, it } from 'vitest';
import type { VariableDef } from '@lumina/types/interaction';
import { validarRegla } from '@lumina/interactions';
import { GRUPOS_ACCION, accionPorDefecto, condicionPorDefecto, kindDeOperando, kindsParaDerecha, operadoresPara, operandoPorDefecto, tipoDeVariablePara, ETIQUETA_ACCION, OPERANDO_KINDS } from './modelo';

const vars: VariableDef[] = [
  { id: 'n', nombre: 'n', tipo: 'numero', valorInicial: 0 },
  { id: 't', nombre: 't', tipo: 'texto', valorInicial: '' },
  { id: 'b', nombre: 'b', tipo: 'booleano', valorInicial: false },
];
const ctx = { variables: vars, bloqueIds: ['bl1'], slideIds: ['s1'], capaIds: ['c1'] };
const vctx = {
  variables: vars,
  bloqueIds: new Set(['bl1']),
  slideIds: new Set(['s1']),
  capaIds: new Set(['c1']),
};

describe('modelo del constructor (N3)', () => {
  it('cada tipo de acción tiene etiqueta y aparece en un grupo (no se olvida ninguna)', () => {
    const enGrupos = GRUPOS_ACCION.flatMap((g) => g.tipos).sort();
    expect(enGrupos).toEqual(Object.keys(ETIQUETA_ACCION).sort());
    expect(enGrupos).toHaveLength(16);
  });

  it('toda acción por defecto es válida con el universo completo (el formulario no nace roto)', () => {
    for (const g of GRUPOS_ACCION) {
      for (const tipo of g.tipos) {
        const a = accionPorDefecto(tipo, ctx);
        const avisos = validarRegla(
          { id: 'r', evento: 'clic', activa: true, condiciones: [], acciones: [a] },
          { tipo: 'bloque', bloqueId: 'bl1', slideId: 's1' },
          vctx,
        );
        expect(avisos, tipo).toEqual([]);
      }
    }
  });

  it('el operador depende del tipo del lado izquierdo', () => {
    expect(operadoresPara('numero')).toContain('<=');
    expect(operadoresPara('texto')).toContain('contiene');
    expect(operadoresPara('texto')).not.toContain('<');
    expect(operadoresPara('booleano')).toEqual(['==', '!=']);
    expect(kindsParaDerecha('numero')).not.toContain('literal_texto');
    expect(kindsParaDerecha('texto')).toContain('literal_texto');
  });

  it('condiciones por defecto son válidas y «entre» es numérica', () => {
    for (const k of ['comparacion', 'entre', 'grupo_y', 'grupo_o'] as const) {
      const c = condicionPorDefecto(k, vars, ['bl1']);
      expect(
        validarRegla(
          { id: 'r', evento: 'clic', activa: true, condiciones: [c], acciones: [{ tipo: 'siguiente' }] },
          { tipo: 'bloque', bloqueId: 'bl1', slideId: 's1' },
          vctx,
        ),
        k,
      ).toEqual([]);
    }
  });

  it('sin variables ni bloques las fábricas no revientan', () => {
    expect(() => condicionPorDefecto('comparacion', [], [])).not.toThrow();
    expect(operandoPorDefecto('variable', [], [])).toEqual({ tipo: 'variable', variableId: '' });
  });

  it('kindDeOperando es inverso de operandoPorDefecto', () => {
    for (const k of OPERANDO_KINDS) {
      expect(kindDeOperando(operandoPorDefecto(k, vars, ['bl1']))).toBe(k);
    }
  });

  it('tipoDeVariablePara filtra las acciones aritméticas, de texto y lógicas', () => {
    expect(tipoDeVariablePara('restar_variable')).toBe('numero');
    expect(tipoDeVariablePara('concatenar_variable')).toBe('texto');
    expect(tipoDeVariablePara('alternar_variable')).toBe('booleano');
    expect(tipoDeVariablePara('limpiar_variable')).toBeUndefined();
  });
});
