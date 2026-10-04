// @lumina/interactions — motor de interacción (Etapa K / K2).
// Puro. Decide el FLUJO; la NOTA la decide @lumina/scoring (C1/C4).

export { crearEstadoInicial, entrarASlide } from './estado.js';
export { evaluarCondicion, evaluarCondiciones, evaluarOperando } from './condiciones.js';
export type { CtxEvaluacion } from './condiciones.js';
export { procesarEvento } from './motor.js';
export {
  EVENTOS_DE_ENTORNO,
  EVENTOS_DE_SLIDE,
  TECLAS_PERMITIDAS,
  TEMPORIZADOR_MAX_S,
  TEMPORIZADOR_MIN_S,
  errorDeParametro,
  esSegundosValidos,
  esTeclaPermitida,
  etiquetaTecla,
  eventoUsaParametro,
} from './eventos.js';
export { hayReglaDeEvento, temporizadoresPendientes } from './temporizadores.js';
export { recolectarReglas, contextoDesdeSlides } from './recolectar.js';
export type { ContextoValidacion } from './recolectar.js';
export { validarReglas, tipoDeOperando } from './validar.js';
export { validarRegla } from './validar-regla.js';
export type { AvisoCampo, OpcionesValidarRegla } from './validar-regla.js';
export {
  ELIMINADO,
  CLAVES_SISTEMA_ETIQUETA,
  describirAccion,
  describirCondicion,
  describirEvento,
  describirOperando,
  describirRegla,
  nombreEvento,
  nombreOperador,
  totalAcciones,
} from './describir.js';
export type { ContextoDescripcion } from './describir.js';
export {
  actualizarCondicion,
  agregarCondicion,
  alternarGrupo,
  alternarNegacion,
  bloqueIdsReferenciados,
  cambiarEvento,
  condicionEn,
  duplicarRegla,
  envolverEnGrupo,
  guardarEnLista,
  moverEnLista,
  quitarCondicion,
  quitarDeLista,
  reemplazarEnLista,
  reglaNueva,
  sinMarcaDePlantilla,
}  from './constructor.js';
export type { RutaCondicion } from './constructor.js';
export { asignarVariable } from './asignar.js';
export { validarVariables, MAX_VARIABLES, MAX_TEXTO_VARIABLE } from './variables.js';
export { usosDeVariable } from './uso.js';
export type { UsoDeVariable } from './uso.js';
export {
  PLANTILLAS,
  fusionarReglas,
  idReglaDePlantilla,
  plantillaBotonNavega,
  plantillaDeRegla,
  plantillaIrARefuerzo,
  plantillaRevelarAlVisitarTodo,
} from './plantillas.js';
export type {
  DestinoNavegacion,
  ReglaDeBloque,
  ResultadoPlantilla,
} from './plantillas.js';
export {
  bloqueParaPegar,
  generarMapaDeIds,
  limpiarReferenciasABloque,
  limpiarReferenciasASlide,
  referenciasA,
  reglasConReferenciasRotas,
  remapearIds,
} from './integridad.js';
export type {
  CodigoReferenciaRota,
  MapaIds,
  ReferenciaAObjetivo,
  ReferenciaRota,
  ResultadoLimpieza,
  SlideMotor,
} from './integridad.js';
export type { CodigoError, ErrorValidacion } from './validar.js';
export { CLAVES_SISTEMA, LIMITES_POR_DEFECTO } from './tipos.js';
export { accionesDeRegla } from './reglas.js';
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
export {
  ESTADOS_BASE,
  ESTADOS_CON_APARIENCIA,
  MAX_ESTADOS_PERSONALIZADOS,
  MAX_NOMBRE_ESTADO,
  RANGOS_APARIENCIA,
  aparienciaDeEstado,
  cumpleAA,
  esColorHex,
  esEstadoBase,
  estadoDeclarado,
  estadosPersonalizadosPorBloque,
  idsDeEstadosPersonalizados,
  razonDeContraste,
  sanearApariencia,
  usosDeEstado,
  validarApariencia,
  validarEstadosPersonalizados,
} from './estados-bloque.js';
export type {
  ErrorApariencia,
  ErrorEstadosPersonalizados,
  UsoDeEstado,
} from './estados-bloque.js';
