import {
  countsTowardClassGradebookAverage,
  evaluateActivityResponse,
} from '@lumina/scoring';

/** Escala máxima del promedio mostrado en el gradebook de clase (0–5). */
export const GRADEBOOK_SCORE_SCALE = 5.0;

// E7.5: el re-export de `@lumina/scoring` se retiró (`LUM-E7-GRADEBOOK-FACADE`).
// Los consumidores importan de `@lumina/scoring` directo; acá queda solo la
// lógica propia del gradebook de clase.

/**
 * Puntúa una respuesta autónoma. Delega en `evaluateActivityResponse` (espejo
 * del frontend — NO reinterpretar casos aquí).
 *
 * Respuesta null/undefined → 0.0 (no respondió).
 * manual / participation / exclude → null (no inventar nota).
 */
export function scoreActivityResponse(
  activityType: string,
  response: unknown,
  activityDef: unknown,
): number | null {
  if (response === null || response === undefined) return 0.0;
  const evaluated = evaluateActivityResponse(
    activityType,
    activityDef,
    response,
  );
  return evaluated.score;
}

/** short_answer con puntuación pendiente (null): no entra en numerador ni denominador. */
export function isShortAnswerPendingScore(
  activityType: string,
  score: number | null,
): boolean {
  return activityType === 'short_answer' && score === null;
}

/**
 * Extrae `actividad.tipo` del JSON de un slide, incluyendo bloques anidados
 * en `columnas` (layout de dos columnas del editor).
 */
export function activityTipoFromSlideContent(content: unknown): string | null {
  return findActivityTipo(content);
}

function findActivityTipo(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findActivityTipo(item);
      if (found) return found;
    }
    return null;
  }
  const o = node as Record<string, unknown>;
  if (
    o.tipo === 'actividad' &&
    o.actividad &&
    typeof o.actividad === 'object'
  ) {
    const tipo = (o.actividad as { tipo?: unknown }).tipo;
    if (typeof tipo === 'string' && tipo.trim()) return tipo;
  }
  if ('bloques' in o) {
    const found = findActivityTipo(o.bloques);
    if (found) return found;
  }
  if ('columnas' in o) {
    const found = findActivityTipo(o.columnas);
    if (found) return found;
  }
  return null;
}

/**
 * Contribución al promedio (0–5), o null si no cuenta.
 * Ausencia, exclude, participation, partial diferido y short_answer sin nota → null.
 * Debe coincidir con `countsTowardClassGradebookAverage` — NO reinterpretar.
 */
export function contributionOnFivePointScale(
  activityType: string,
  score: number | null,
  maxScore: number,
  hasResult = true,
  isManual?: boolean,
): number | null {
  if (
    !countsTowardClassGradebookAverage({
      activityType,
      score,
      hasResult,
      isManual,
      maxScore,
    })
  ) {
    return null;
  }
  const max = maxScore > 0 ? maxScore : GRADEBOOK_SCORE_SCALE;
  return (score / max) * GRADEBOOK_SCORE_SCALE;
}

export interface GradebookSlideRef {
  slideId: string;
  activityType: string;
}

/**
 * Numerador/denominador del promedio Edu.
 * Solo `esEvaluable` (binary/partial/manual vía ACTIVITY_SCORING).
 * Sin ClassResult → ignore (no 0). exclude/participation nunca entran.
 */
export function sumAndDenominatorForClassGradebook(
  slides: readonly GradebookSlideRef[],
  resultBySlideId: ReadonlyMap<
    string,
    {
      activityType: string;
      score: number | null;
      maxScore: number;
      isManual?: boolean;
    }
  >,
): { sum: number; denominator: number } {
  let sum = 0;
  let denominator = 0;
  for (const slide of slides) {
    const row = resultBySlideId.get(slide.slideId);
    const activityType = row?.activityType || slide.activityType;
    const c = contributionOnFivePointScale(
      activityType,
      row?.score ?? null,
      row?.maxScore ?? GRADEBOOK_SCORE_SCALE,
      resultBySlideId.has(slide.slideId),
      row?.isManual,
    );
    if (c === null) continue;
    denominator += 1;
    sum += c;
  }
  return { sum, denominator };
}
