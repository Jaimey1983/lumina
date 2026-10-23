export { ajustar, ajustarCaja, type Cota, type Guia, type OpcionesAjuste, type ResultadoAjuste } from './ajuste.js';
export {
  actualizar,
  agregar,
  bloquear,
  cambiarEstilo,
  duplicar,
  eliminar,
  ocultar,
  type EntradaElemento,
  type OpcionesAgregar,
  type OpcionesDuplicar,
  type ParcheEstilo,
  type ParcheVisual,
} from './edicion.js';
export {
  cajaDeElemento,
  cajaDePuntos,
  cajaDeSeleccion,
  elementoEn,
  elementosEn,
  esquinas,
  puntosResueltos,
  unirCajas,
  type Caja,
  type OpcionesImpacto,
  type OpcionesRectangulo,
} from './geometria.js';
export {
  agrupar,
  alinear,
  desagrupar,
  distribuir,
  reordenar,
  type ModoAlineacion,
  type ModoOrden,
  type OpcionesAlinear,
} from './organizar.js';
export { crearHijo, crearHijoEn, DISTANCIA_HIJO_POR_DEFECTO, LADO_HIJO_TECLADO, type ResultadoCrearHijo } from './hijo.js';
export { conectarEnCadena, filtrarFormasParaCadena, ordenEspacialParaCadena, ordenParaCadena } from './cadena.js';
export { eliminarRama } from './rama.js';
export {
  elementosEnPoligono,
  invertirSeleccion,
  puntoEnPoligono,
  seleccionarIguales,
  seleccionarPorTipo,
  seleccionarRama,
  unidadesElegibles,
  type TipoSeleccionable,
} from './seleccion.js';
export { aplicarFormato, extraerFormato, type FormatoCopiado, type ResultadoFormato } from './formato.js';
export {
  cajaDeFragmento,
  copiar,
  DESPLAZAMIENTO_PEGADO,
  FORMATO_FRAGMENTO,
  MAX_ELEMENTOS_FRAGMENTO,
  MAX_TAMANO_FRAGMENTO,
  pegar,
  validarFragmento,
  VERSION_FRAGMENTO,
  type Fragmento,
  type OpcionesPegar,
  type ResultadoPegar,
} from './portapapeles.js';
export {
  ajustarAngulo,
  ASAS,
  mover,
  redimensionar,
  rotar,
  rotarA,
  type Asa,
  type OpcionesRedimensionar,
  type OpcionesRotar,
} from './transformar.js';
