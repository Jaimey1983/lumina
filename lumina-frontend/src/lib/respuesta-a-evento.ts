/**
 * Etapa K / K7a (D10) — traduce la respuesta de un alumno a un evento de FLUJO
 * para el motor de interacción: `respuesta_correcta` / `respuesta_incorrecta`.
 *
 * Solo reduce el resultado a un booleano. NUNCA envía ese booleano a la red,
 * no lo persiste y no toca la nota: la nota la sigue calculando el backend con
 * `@lumina/scoring` (C1/C4/C5). Vive aparte de `interaction-runtime.ts` para que
 * el runtime siga sin conocer `@lumina/scoring`.
 *
 * «Correcta» = acertó TODO (`correct === true`); el crédito parcial no cuenta.
 * Las actividades sin respuesta correcta que decir (manual / participación /
 * excluida / borrador) devuelven `null` y no emiten nada.
 */

import { evaluateActivityResponse, isActivityDraftResponse } from '@lumina/scoring';
import type { EventoTipo } from '@lumina/types/interaction';

export function eventoDeRespuesta(
  actividadTipo: string,
  actividad: unknown,
  respuesta: unknown,
): Extract<EventoTipo, 'respuesta_correcta' | 'respuesta_incorrecta'> | null {
  if (respuesta === null || respuesta === undefined) return null;
  if (isActivityDraftResponse(respuesta)) return null;
  // video_interactivo responde por pregunta (respuesta parcial del intento): no hay «correcta» global.
  if (actividadTipo === 'video_interactivo') return null;
  const { correct } = evaluateActivityResponse(actividadTipo, actividad, respuesta);
  if (correct === true) return 'respuesta_correcta';
  if (correct === false) return 'respuesta_incorrecta';
  return null;
}
