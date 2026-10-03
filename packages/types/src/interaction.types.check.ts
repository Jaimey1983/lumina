// Chequeos de FORMA de los tipos del motor de interacción (K1).
// Se verifican con `tsc --noEmit` (script `test` del paquete); este paquete no
// tiene runner de pruebas y no se agrega uno solo para tipos. Excluido del
// build (`tsconfig.build.json`), así que no llega a `dist/`.

import type {
  Accion,
  AccionTipo,
  Capa,
  ClaveSistema,
  Condicion,
  EstadoObjeto,
  EventoTipo,
  Operando,
  Regla,
  VariableDef,
} from './interaction.types.js';
import type { Block, Slide, SlideClass } from './slide.types.js';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;

// ─── Compatibilidad hacia atrás: todo campo nuevo es opcional ────────────────
// `Record<never, never> extends Pick<…>` solo se cumple si TODAS las claves elegidas son opcionales,
// es decir, un bloque/slide/clase guardado antes de K1 sigue tipando igual.
export type _BlockAditivo = Assert<
  Record<never, never> extends Pick<Block, 'disparadores' | 'estado' | 'ocultoInicial'> ? true : false
>;
export type _SlideAditivo = Assert<
  Record<never, never> extends Pick<Slide, 'capas' | 'reglas'> ? true : false
>;
export type _ClaseAditivo = Assert<
  Record<never, never> extends Pick<SlideClass, 'variables'> ? true : false
>;

// Los campos nuevos tienen el tipo esperado.
export type _TipoDisparadores = Assert<
  Equal<NonNullable<Block['disparadores']>, Regla[]>
>;
export type _TipoEstado = Assert<
  Equal<NonNullable<Block['estado']>, EstadoObjeto>
>;
export type _TipoOcultoInicial = Assert<Equal<NonNullable<Block['ocultoInicial']>, boolean>>;
export type _TipoCapas = Assert<Equal<NonNullable<Slide['capas']>, Capa[]>>;
export type _TipoVariables = Assert<
  Equal<NonNullable<SlideClass['variables']>, VariableDef[]>
>;

// ─── Catálogos cerrados (si alguien agrega uno, este chequeo obliga a decidirlo)
export type _Eventos = Assert<
  Equal<
    EventoTipo,
    | 'clic'
    | 'visitado'
    | 'seleccionado'
    | 'respuesta_correcta'
    | 'respuesta_incorrecta'
    | 'fin_contador'
    | 'al_entrar_slide'
  >
>;

export type _Acciones = Assert<
  Equal<
    AccionTipo,
    | 'ir_a_slide'
    | 'siguiente'
    | 'anterior'
    | 'mostrar'
    | 'ocultar'
    | 'cambiar_estado'
    | 'abrir_capa'
    | 'cerrar_capa'
    | 'asignar_variable'
    | 'sumar_variable'
    | 'restar_variable'
    | 'multiplicar_variable'
    | 'dividir_variable'
    | 'limpiar_variable'
    | 'concatenar_variable'
    | 'alternar_variable'
  >
>;

// ─── C1/C4: el motor no califica ni lee notas ────────────────────────────────
// Ninguna acción ni operando puede nombrar puntaje/nota/score. `@lumina/scoring`
// decide la nota; el motor solo decide el flujo.
type NombraNota<T extends string> = T extends `${string}${
  | 'puntaje'
  | 'puntos'
  | 'nota'
  | 'score'
  | 'calificacion'}${string}`
  ? T
  : never;
export type _SinNotaEnAcciones = Assert<
  Equal<NombraNota<AccionTipo>, never>
>;
export type _SinNotaEnOperandos = Assert<
  Equal<NombraNota<Operando['tipo']>, never>
>;
export type _SinNotaEnSistema = Assert<Equal<NombraNota<ClaveSistema>, never>>;
export type _SinNotaEnCondiciones = Assert<Equal<NombraNota<Condicion['tipo']>, never>>;

// N1: catálogo de operandos y de condiciones (cambiarlos obliga a decidirlo).
export type _Operandos = Assert<
  Equal<
    Operando['tipo'],
    'literal' | 'variable' | 'estado_bloque' | 'respuesta_correcta' | 'sistema'
  >
>;
export type _Condiciones = Assert<
  Equal<Condicion['tipo'], 'comparacion' | 'entre' | 'y' | 'o' | 'no'>
>;
export type _ClavesSistema = Assert<
  Equal<ClaveSistema, 'slide_numero' | 'slide_total' | 'progreso_pct' | 'tiempo_s' | 'intento'>
>;
// `sino` es opcional (una regla guardada antes de N1 sigue tipando) y solo acepta Accion.
export type _SinoAditivo = Assert<Record<never, never> extends Pick<Regla, 'sino'> ? true : false>;
export type _TipoSino = Assert<Equal<NonNullable<Regla['sino']>, Accion[]>>;

// ─── Ejemplos reales: deben compilar ─────────────────────────────────────────
export const variableIntentos: VariableDef = {
  id: 'v-intentos',
  nombre: 'intentos',
  tipo: 'numero',
  valorInicial: 0,
};

/** «Si responde mal y lleva menos de 3 intentos: sumar 1 y abrir la pista». */
export const reglaPista: Regla = {
  id: 'r-pista',
  evento: 'respuesta_incorrecta',
  activa: true,
  condiciones: [
    {
      tipo: 'comparacion',
      operador: '<',
      izquierda: { tipo: 'variable', variableId: 'v-intentos' },
      derecha: { tipo: 'literal', valor: 3 },
    },
  ],
  acciones: [
    { tipo: 'sumar_variable', variableId: 'v-intentos', cantidad: 1 },
    { tipo: 'abrir_capa', capaId: 'capa-pista' },
  ],
};

/** «Al entrar, si ya visitó A o B: ir a refuerzo». Árbol anidado y/o/no. */
export const condicionAnidada: Condicion = {
  tipo: 'y',
  condiciones: [
    {
      tipo: 'o',
      condiciones: [
        {
          tipo: 'comparacion',
          operador: '==',
          izquierda: { tipo: 'estado_bloque', bloqueId: 'b-a' },
          derecha: { tipo: 'literal', valor: 'visitado' },
        },
        {
          tipo: 'comparacion',
          operador: '==',
          izquierda: { tipo: 'estado_bloque', bloqueId: 'b-b' },
          derecha: { tipo: 'literal', valor: 'visitado' },
        },
      ],
    },
    {
      tipo: 'no',
      condicion: {
        tipo: 'comparacion',
        operador: '==',
        izquierda: { tipo: 'respuesta_correcta', bloqueId: 'b-quiz' },
        derecha: { tipo: 'literal', valor: true },
      },
    },
  ],
};

// Exhaustividad: si se agrega una `Accion` sin tratarla, esto deja de compilar.
export function describirAccion(a: Accion): string {
  switch (a.tipo) {
    case 'ir_a_slide':
      return `ir a ${a.slideId}`;
    case 'siguiente':
    case 'anterior':
      return a.tipo;
    case 'mostrar':
    case 'ocultar':
      return `${a.tipo} ${a.bloqueId}`;
    case 'cambiar_estado':
      return `${a.bloqueId} → ${a.estado}`;
    case 'abrir_capa':
    case 'cerrar_capa':
      return `${a.tipo} ${a.capaId}`;
    case 'asignar_variable':
      return `asignar ${a.variableId}`;
    case 'sumar_variable':
      return `sumar ${a.cantidad} a ${a.variableId}`;
    case 'restar_variable':
    case 'multiplicar_variable':
    case 'dividir_variable':
      return `${a.tipo} ${a.variableId}`;
    case 'limpiar_variable':
    case 'alternar_variable':
      return `${a.tipo} ${a.variableId}`;
    case 'concatenar_variable':
      return `concatenar a ${a.variableId}`;
    default: {
      const _nunca: never = a;
      return _nunca;
    }
  }
}
