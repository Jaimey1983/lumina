import type {
  Accion,
  AccionTipo,
  ClaveSistema,
  Condicion,
  EstadoObjeto,
  Operando,
  OperadorComparacion,
  VariableDef,
  VariableTipo,
} from '@lumina/types/interaction';
import { tipoDeOperando } from '@lumina/interactions';

/**
 * Modelo puro del constructor de reglas (N3): fábricas por defecto y reglas de
 * qué operadores/operandos ofrecer según el tipo. Sin React: se prueba en node.
 */

export type TipoValor = VariableTipo | 'desconocido';

export const OPERANDO_KINDS = [
  'literal_numero',
  'literal_texto',
  'literal_booleano',
  'variable',
  'estado_bloque',
  'respuesta_correcta',
  'sistema',
] as const;
export type OperandoKind = (typeof OPERANDO_KINDS)[number];

export const ETIQUETA_KIND: Record<OperandoKind, string> = {
  literal_numero: 'Un número',
  literal_texto: 'Un texto',
  literal_booleano: 'Sí / No',
  variable: 'Una variable',
  estado_bloque: 'El estado de un elemento',
  respuesta_correcta: 'Si la respuesta de una actividad fue correcta',
  sistema: 'Dato del sistema',
};

export function kindDeOperando(op: Operando): OperandoKind {
  switch (op.tipo) {
    case 'literal':
      return typeof op.valor === 'number'
        ? 'literal_numero'
        : typeof op.valor === 'boolean'
          ? 'literal_booleano'
          : 'literal_texto';
    case 'variable':
    case 'estado_bloque':
    case 'respuesta_correcta':
    case 'sistema':
      return op.tipo;
  }
}

export function operandoPorDefecto(
  kind: OperandoKind,
  variables: readonly VariableDef[],
  bloqueIds: readonly string[],
): Operando {
  switch (kind) {
    case 'literal_numero':
      return { tipo: 'literal', valor: 0 };
    case 'literal_texto':
      return { tipo: 'literal', valor: '' };
    case 'literal_booleano':
      return { tipo: 'literal', valor: true };
    case 'variable':
      return { tipo: 'variable', variableId: variables[0]?.id ?? '' };
    case 'estado_bloque':
      return { tipo: 'estado_bloque', bloqueId: bloqueIds[0] ?? '' };
    case 'respuesta_correcta':
      return { tipo: 'respuesta_correcta', bloqueId: bloqueIds[0] ?? '' };
    case 'sistema':
      return { tipo: 'sistema', clave: 'slide_numero' };
  }
}

/** Tipo de valor de un operando dado el universo de variables. */
export function tipoDe(op: Operando, variables: readonly VariableDef[]): TipoValor {
  return tipoDeOperando(op, new Map(variables.map((v) => [v.id, v])));
}

const TODOS: readonly OperadorComparacion[] = ['==', '!=', '<', '<=', '>', '>='];
const TEXTO: readonly OperadorComparacion[] = [
  '==',
  '!=',
  'contiene',
  'no_contiene',
  'empieza_con',
  'termina_con',
];

/** Operadores que tienen sentido según el tipo del lado izquierdo. */
export function operadoresPara(tipo: TipoValor): readonly OperadorComparacion[] {
  if (tipo === 'numero') return TODOS;
  if (tipo === 'texto') return TEXTO;
  if (tipo === 'booleano') return ['==', '!='];
  return ['==', '!='];
}

export const ETIQUETA_OPERADOR: Record<OperadorComparacion, string> = {
  '==': 'es igual a',
  '!=': 'es distinto de',
  '<': 'es menor que',
  '<=': 'es menor o igual que',
  '>': 'es mayor que',
  '>=': 'es mayor o igual que',
  contiene: 'contiene',
  no_contiene: 'no contiene',
  empieza_con: 'empieza con',
  termina_con: 'termina con',
};

/** Qué clases de operando se pueden poner a la derecha de una comparación. */
export function kindsParaDerecha(izq: TipoValor): readonly OperandoKind[] {
  switch (izq) {
    case 'numero':
      return ['literal_numero', 'variable', 'sistema'];
    case 'texto':
      return ['literal_texto', 'variable', 'estado_bloque'];
    case 'booleano':
      return ['literal_booleano', 'variable', 'respuesta_correcta'];
    default:
      return OPERANDO_KINDS;
  }
}

/** Qué clases de operando se pueden poner a la izquierda (y en «entre»: solo numéricos). */
export const KINDS_IZQUIERDA: readonly OperandoKind[] = [
  'variable',
  'estado_bloque',
  'respuesta_correcta',
  'sistema',
];
export const KINDS_NUMERICOS: readonly OperandoKind[] = ['literal_numero', 'variable', 'sistema'];

export const ESTADOS: readonly { valor: EstadoObjeto; etiqueta: string }[] = [
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'visitado', etiqueta: 'Visitado' },
  { valor: 'seleccionado', etiqueta: 'Seleccionado' },
  { valor: 'deshabilitado', etiqueta: 'Deshabilitado' },
];

export type CondicionKind = 'comparacion' | 'entre' | 'grupo_y' | 'grupo_o';

export function condicionPorDefecto(
  kind: CondicionKind,
  variables: readonly VariableDef[],
  bloqueIds: readonly string[],
): Condicion {
  const izquierda: Operando = variables[0]
    ? { tipo: 'variable', variableId: variables[0].id }
    : bloqueIds[0]
      ? { tipo: 'estado_bloque', bloqueId: bloqueIds[0] }
      : { tipo: 'sistema', clave: 'slide_numero' as ClaveSistema };
  const t = tipoDe(izquierda, variables);
  const derecha: Operando =
    t === 'numero'
      ? { tipo: 'literal', valor: 0 }
      : t === 'booleano'
        ? { tipo: 'literal', valor: true }
        : { tipo: 'literal', valor: t === 'texto' ? '' : 'visitado' };
  switch (kind) {
    case 'comparacion':
      return { tipo: 'comparacion', operador: '==', izquierda, derecha };
    case 'entre':
      return {
        tipo: 'entre',
        valor: izquierda.tipo === 'variable' && t === 'numero' ? izquierda : { tipo: 'sistema', clave: 'slide_numero' },
        desde: { tipo: 'literal', valor: 0 },
        hasta: { tipo: 'literal', valor: 10 },
      };
    case 'grupo_y':
      return { tipo: 'y', condiciones: [condicionPorDefecto('comparacion', variables, bloqueIds)] };
    case 'grupo_o':
      return { tipo: 'o', condiciones: [condicionPorDefecto('comparacion', variables, bloqueIds)] };
  }
}

export const ETIQUETA_ACCION: Record<AccionTipo, string> = {
  ir_a_slide: 'Ir a un slide',
  siguiente: 'Ir al siguiente slide',
  anterior: 'Volver al slide anterior',
  mostrar: 'Mostrar un elemento',
  ocultar: 'Ocultar un elemento',
  cambiar_estado: 'Cambiar el estado de un elemento',
  abrir_capa: 'Abrir una capa',
  cerrar_capa: 'Cerrar una capa',
  asignar_variable: 'Asignar un valor a una variable',
  sumar_variable: 'Sumar a una variable',
  restar_variable: 'Restar a una variable',
  multiplicar_variable: 'Multiplicar una variable',
  dividir_variable: 'Dividir una variable',
  limpiar_variable: 'Reiniciar una variable',
  concatenar_variable: 'Añadir texto a una variable',
  alternar_variable: 'Invertir una variable (sí/no)',
};

export const GRUPOS_ACCION: readonly { titulo: string; tipos: readonly AccionTipo[] }[] = [
  { titulo: 'Navegación', tipos: ['ir_a_slide', 'siguiente', 'anterior'] },
  { titulo: 'Elementos y capas', tipos: ['mostrar', 'ocultar', 'cambiar_estado', 'abrir_capa', 'cerrar_capa'] },
  {
    titulo: 'Variables',
    tipos: [
      'asignar_variable',
      'sumar_variable',
      'restar_variable',
      'multiplicar_variable',
      'dividir_variable',
      'limpiar_variable',
      'concatenar_variable',
      'alternar_variable',
    ],
  },
];

/** Variable de ese tipo para una acción, o la primera si no hay. */
function variableDe(variables: readonly VariableDef[], tipo?: VariableTipo): string {
  return (tipo ? variables.find((v) => v.tipo === tipo) : variables[0])?.id ?? '';
}

export function accionPorDefecto(
  tipo: AccionTipo,
  ctx: {
    variables: readonly VariableDef[];
    bloqueIds: readonly string[];
    slideIds: readonly string[];
    capaIds: readonly string[];
  },
): Accion {
  const b = ctx.bloqueIds[0] ?? '';
  switch (tipo) {
    case 'ir_a_slide':
      return { tipo, slideId: ctx.slideIds[0] ?? '' };
    case 'siguiente':
    case 'anterior':
      return { tipo };
    case 'mostrar':
    case 'ocultar':
      return { tipo, bloqueId: b };
    case 'cambiar_estado':
      return { tipo, bloqueId: b, estado: 'visitado' };
    case 'abrir_capa':
    case 'cerrar_capa':
      return { tipo, capaId: ctx.capaIds[0] ?? '' };
    case 'asignar_variable': {
      const id = variableDe(ctx.variables);
      const def = ctx.variables.find((v) => v.id === id);
      const valor =
        def?.tipo === 'texto' ? '' : def?.tipo === 'booleano' ? true : 0;
      return { tipo, variableId: id, valor: { tipo: 'literal', valor } };
    }
    case 'sumar_variable':
      return { tipo, variableId: variableDe(ctx.variables, 'numero'), cantidad: 1 };
    case 'restar_variable':
    case 'multiplicar_variable':
    case 'dividir_variable':
      return {
        tipo,
        variableId: variableDe(ctx.variables, 'numero'),
        cantidad: { tipo: 'literal', valor: tipo === 'restar_variable' ? 1 : 2 },
      };
    case 'limpiar_variable':
      return { tipo, variableId: variableDe(ctx.variables) };
    case 'concatenar_variable':
      return { tipo, variableId: variableDe(ctx.variables, 'texto'), texto: { tipo: 'literal', valor: '' } };
    case 'alternar_variable':
      return { tipo, variableId: variableDe(ctx.variables, 'booleano') };
  }
}

/** Tipos de variable que admite cada acción sobre variables (para filtrar el selector). */
export function tipoDeVariablePara(a: AccionTipo): VariableTipo | undefined {
  switch (a) {
    case 'sumar_variable':
    case 'restar_variable':
    case 'multiplicar_variable':
    case 'dividir_variable':
      return 'numero';
    case 'concatenar_variable':
      return 'texto';
    case 'alternar_variable':
      return 'booleano';
    default:
      return undefined;
  }
}
