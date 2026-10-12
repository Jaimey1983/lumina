/**
 * U12 / DU9 — punto de entrada de la validación: `validarActividad(actividad)` despacha por `tipo`.
 * Un tipo sin validador devuelve `[]` (no se inventan problemas). U12.1b suma el Grupo 4.
 */
import type { Activity } from '@lumina/types/slide';

import type { ProblemaActividad, Validador } from './problemas.js';
import * as clasicos from './validadores-clasicos.js';

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
