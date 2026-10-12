/**
 * U12 / DU9 — punto de entrada de la validación: `validarActividad(actividad)` despacha por `tipo`.
 * Un tipo sin validador devuelve `[]` (no se inventan problemas). Cubre todas las actividades (las nuevas, U14+, en `validadores-nuevos`).
 */
import type { Activity } from '@lumina/types/slide';

import type { ProblemaActividad, Validador } from './problemas.js';
import * as clasicos from './validadores-clasicos.js';
import * as g4 from './validadores-grupo4.js';
import * as nuevos from './validadores-nuevos.js';

/** Validador por `tipo`. Agregar un tipo = agregar una línea acá. */
const VALIDADORES: Partial<Record<Activity['tipo'], Validador<never>>> = {
  quiz_multiple: clasicos.validarQuizMultiple,
  verdadero_falso: clasicos.validarVerdaderoFalso,
  short_answer: clasicos.validarShortAnswer,
  respuesta_matematica: clasicos.validarRespuestaMatematica,
  completar_blancos: clasicos.validarCompletarBlancos,
  arrastrar_soltar: clasicos.validarArrastrarSoltar,
  emparejar: clasicos.validarEmparejar,
  ordenar_pasos: clasicos.validarOrdenarPasos,
  video_interactivo: clasicos.validarVideoInteractivo,
  encuesta_viva: clasicos.validarEncuestaViva,
  nube_palabras: clasicos.validarNubePalabras,
  balancear_ecuacion: clasicos.validarBalancearEcuacion,
  ubicar_elemento: clasicos.validarUbicarElemento,
  formular_compuesto: clasicos.validarFormularCompuesto,
  clasificar: g4.validarClasificar,
  memoria: g4.validarMemoria,
  puzzle_imagen: g4.validarPuzzleImagen,
  sopa_letras: g4.validarSopaLetras,
  crucigrama: g4.validarCrucigrama,
  anagrama: g4.validarAnagrama,
  ahorcado: g4.validarAhorcado,
  puzzle_palabras: g4.validarPuzzlePalabras,
  abrir_caja: g4.validarAbrirCaja,
  globos: g4.validarGlobos,
  topo: g4.validarTopo,
  historia_ramificada: g4.validarHistoriaRamificada,
  ruleta: g4.validarRuleta,
  torneo: g4.validarTorneo,
  escape_room: g4.validarEscapeRoom,
  relacionar_lineas: nuevos.validarRelacionarLineas,
  problema_pasos: nuevos.validarProblemaPasos,
  etiquetar_imagen: nuevos.validarEtiquetarImagen,
};

/** Tipos que ya tienen validador. */
export function tiposValidables(): string[] {
  return Object.keys(VALIDADORES);
}

export function validarActividad(actividad: Activity | null | undefined): ProblemaActividad[] {
  if (!actividad) return [];
  const validador = VALIDADORES[actividad.tipo] as Validador<Activity> | undefined;
  return validador ? validador(actividad) : [];
}

export { resumirProblemas, type NivelProblema, type ProblemaActividad, type ResumenProblemas } from './problemas.js';
