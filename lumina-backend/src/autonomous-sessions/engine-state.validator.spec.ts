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

// Etapa N / N2: lo que producen las acciones nuevas del motor debe seguir
// validando al persistirse (K5): números finitos, texto acotado, booleanos.
import { crearEstadoInicial, procesarEvento } from '@lumina/interactions';
// El backend no depende de `@lumina/types`: los tipos se deducen del propio motor.
type Accion = Parameters<
  typeof procesarEvento
>[0][number]['regla']['acciones'][number];
type VariableDef = Parameters<typeof crearEstadoInicial>[0][number];

describe('validarEstadoMotor con estados producidos por las acciones de N2', () => {
  const variables: VariableDef[] = [
    { id: 'n', nombre: 'n', tipo: 'numero', valorInicial: 10 },
    { id: 't', nombre: 't', tipo: 'texto', valorInicial: 'Hola' },
    { id: 'b', nombre: 'b', tipo: 'booleano', valorInicial: true },
  ];
  const declaradas = variables.map((v) => ({ id: v.id, tipo: v.tipo }));
  const lit = (valor: number | string) => ({ tipo: 'literal' as const, valor });

  it.each<[string, Accion]>([
    ['restar', { tipo: 'restar_variable', variableId: 'n', cantidad: lit(3) }],
    [
      'multiplicar',
      { tipo: 'multiplicar_variable', variableId: 'n', cantidad: lit(2) },
    ],
    [
      'dividir (decimal)',
      { tipo: 'dividir_variable', variableId: 'n', cantidad: lit(4) },
    ],
    [
      'dividir por cero (no cambia)',
      { tipo: 'dividir_variable', variableId: 'n', cantidad: lit(0) },
    ],
    ['limpiar', { tipo: 'limpiar_variable', variableId: 't' }],
    [
      'concatenar',
      { tipo: 'concatenar_variable', variableId: 't', texto: lit(' mundo') },
    ],
    [
      'concatenar (recorta a 200)',
      {
        tipo: 'concatenar_variable',
        variableId: 't',
        texto: lit('x'.repeat(500)),
      },
    ],
    ['alternar', { tipo: 'alternar_variable', variableId: 'b' }],
  ])('%s', (_n, accion) => {
    const r = procesarEvento(
      [
        {
          regla: {
            id: 'r',
            evento: 'clic',
            condiciones: [],
            acciones: [accion],
            activa: true,
          },
          origen: { tipo: 'bloque', bloqueId: 'b1', slideId: 's1' },
        },
      ],
      crearEstadoInicial(variables),
      { tipo: 'clic', bloqueId: 'b1', slideId: 's1' },
      { variables },
    );
    expect(() =>
      validarEstadoMotor(JSON.parse(JSON.stringify(r.estado)), declaradas),
    ).not.toThrow();
  });
});
