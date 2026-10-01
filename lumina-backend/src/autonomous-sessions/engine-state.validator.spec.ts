import { BadRequestException } from '@nestjs/common';
import {
  leerVariablesDeclaradas,
  validarEstadoMotor,
  MAX_ESTADO_BYTES,
} from './engine-state.validator';

const defs = [
  { id: 'intentos', tipo: 'numero' as const },
  { id: 'nombre', tipo: 'texto' as const },
  { id: 'listo', tipo: 'booleano' as const },
];

describe('validarEstadoMotor (K5)', () => {
  it('acepta un estado válido y lo devuelve saneado', () => {
    const e = validarEstadoMotor(
      {
        variables: { intentos: 2, listo: true },
        estados: { b1: 'visitado' },
        visibles: { b2: false },
        capasAbiertas: ['c1'],
        respuestas: { b3: true },
      },
      defs,
    );
    expect(e.variables).toEqual({ intentos: 2, listo: true });
    expect(e.capasAbiertas).toEqual(['c1']);
  });

  it('acepta un estado vacío', () => {
    expect(validarEstadoMotor({}, defs)).toEqual({
      variables: {},
      estados: {},
      visibles: {},
      capasAbiertas: [],
      respuestas: {},
    });
  });

  it.each([
    ['variable inexistente', { variables: { fantasma: 1 } }],
    ['tipo erróneo (número)', { variables: { intentos: '3' } }],
    ['tipo erróneo (booleano)', { variables: { listo: 'si' } }],
    ['número no finito', { variables: { intentos: null } }],
    ['clave desconocida', { puntaje: 5 }],
    ['estado de objeto inválido', { estados: { b1: 'roto' } }],
    ['visibles no booleano', { visibles: { b1: 1 } }],
    ['capas con no-string', { capasAbiertas: [1] }],
  ])('rechaza: %s', (_n, payload) => {
    expect(() => validarEstadoMotor(payload, defs)).toThrow(
      BadRequestException,
    );
  });

  it('rechaza claves peligrosas (__proto__)', () => {
    const payload: unknown = JSON.parse('{"estados":{"__proto__":"visitado"}}');
    expect(() => validarEstadoMotor(payload, defs)).toThrow(
      BadRequestException,
    );
  });

  it('rechaza payloads demasiado grandes', () => {
    const grande = { variables: { nombre: 'x'.repeat(MAX_ESTADO_BYTES) } };
    expect(() => validarEstadoMotor(grande, defs)).toThrow(BadRequestException);
  });

  it('rechaza lo que no es objeto', () => {
    expect(() => validarEstadoMotor([], defs)).toThrow(BadRequestException);
    expect(() => validarEstadoMotor(null, defs)).toThrow(BadRequestException);
  });

  it('leerVariablesDeclaradas tolera basura', () => {
    expect(leerVariablesDeclaradas(null)).toEqual([]);
    expect(
      leerVariablesDeclaradas([{ id: 'a', tipo: 'numero' }, { id: 1 }, 'x']),
    ).toEqual([{ id: 'a', tipo: 'numero' }]);
  });
});
