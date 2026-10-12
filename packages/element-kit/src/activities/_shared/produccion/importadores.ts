/**
 * U12.2 — punto de entrada de la importación: `importadorDe(tipo)` y `importarTexto`.
 * Un tipo sin importador devuelve `undefined` (el panel no ofrece «Importar»).
 */
import type { Activity } from '@lumina/types/slide';

import type { Importador, ModoImportacion, ResultadoImportacion } from './importacion.js';
import * as listas from './importadores-listas.js';
import * as nuevos from './importadores-nuevos.js';
import * as preguntas from './importadores-preguntas.js';
import { parsearTabla } from './tabla.js';

const IMPORTADORES: Partial<Record<Activity['tipo'], Importador>> = {
  quiz_multiple: preguntas.importadorQuizMultiple,
  torneo: preguntas.importadorTorneo,
  globos: preguntas.importadorGlobos,
  topo: preguntas.importadorTopo,
  video_interactivo: preguntas.importadorVideoInteractivo,
  verdadero_falso: preguntas.importadorVerdaderoFalso,
  encuesta_viva: preguntas.importadorEncuestaViva,
  emparejar: listas.importadorEmparejar,
  memoria: listas.importadorMemoria,
  ordenar_pasos: listas.importadorOrdenarPasos,
  ruleta: listas.importadorRuleta,
  nube_palabras: listas.importadorNubePalabras,
  sopa_letras: listas.importadorSopaLetras,
  anagrama: listas.importadorAnagrama,
  puzzle_palabras: listas.importadorPuzzlePalabras,
  crucigrama: listas.importadorCrucigrama,
  ahorcado: listas.importadorAhorcado,
  clasificar: listas.importadorClasificar,
  arrastrar_soltar: listas.importadorArrastrarSoltar,
  abrir_caja: listas.importadorAbrirCaja,
  relacionar_lineas: nuevos.importadorRelacionarLineas,
  problema_pasos: nuevos.importadorProblemaPasos,
};

export function importadorDe(tipo: Activity['tipo']): Importador | undefined {
  return IMPORTADORES[tipo];
}

export function tiposImportables(): string[] {
  return Object.keys(IMPORTADORES);
}

/** Lee el texto pegado y lo aplica a la actividad. Sin importador para el tipo, devuelve la actividad intacta. */
export function importarTexto<A extends Activity>(
  actividad: A,
  texto: string,
  modo: ModoImportacion,
): ResultadoImportacion<A> {
  const imp = importadorDe(actividad.tipo);
  if (!imp) return { actividad, leidas: 0, descartadas: [] };
  return imp.importar(actividad, parsearTabla(texto), modo) as ResultadoImportacion<A>;
}

export { parsearTabla } from './tabla.js';
export type { FilaDescartada, Importador, ModoImportacion, ResultadoImportacion } from './importacion.js';
