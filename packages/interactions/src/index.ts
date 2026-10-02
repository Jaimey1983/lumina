// @lumina/interactions — motor de interacción (Etapa K / K2).
// Puro. Decide el FLUJO; la NOTA la decide @lumina/scoring (C1/C4).

export { crearEstadoInicial } from './estado.js';
export { evaluarCondicion, evaluarCondiciones, evaluarOperando } from './condiciones.js';
export type { CtxEvaluacion } from './condiciones.js';
export { procesarEvento } from './motor.js';
export { recolectarReglas, contextoDesdeSlides } from './recolectar.js';
export type { ContextoValidacion } from './recolectar.js';
export { validarReglas } from './validar.js';
export { validarVariables, MAX_VARIABLES, MAX_TEXTO_VARIABLE } from './variables.js';
export { usosDeVariable } from './uso.js';
export type { UsoDeVariable } from './uso.js';
export type { CodigoError, ErrorValidacion } from './validar.js';
export { LIMITES_POR_DEFECTO } from './tipos.js';
export type {
  Aviso,
  CodigoAviso,
  ContextoMotor,
  Efecto,
  EstadoMotor,
  EventoMotor,
  LimitesMotor,
  OrigenRegla,
  ReglaAplicable,
  ResultadoMotor,
} from './tipos.js';
