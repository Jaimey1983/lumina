/** Escala máxima del promedio mostrado en el gradebook de clase (0–5). */
export const GRADEBOOK_SCORE_SCALE = 5.0;

/** short_answer con puntuación pendiente (null): no entra en numerador ni denominador. */
export function isShortAnswerPendingScore(
  activityType: string,
  score: number | null,
): boolean {
  return activityType === 'short_answer' && score === null;
}

/**
 * Contribución de una actividad al promedio (0–5), o null si la actividad se excluye del promedio.
 */
export function contributionOnFivePointScale(
  activityType: string,
  score: number | null,
  maxScore: number,
): number | null {
  if (isShortAnswerPendingScore(activityType, score)) {
    return null;
  }
  const max = maxScore > 0 ? maxScore : 1;
  const effective = score ?? 0;
  return (effective / max) * GRADEBOOK_SCORE_SCALE;
}

export function sumAndDenominatorForClassGradebook(
  activitySlideIds: readonly string[],
  resultBySlideId: ReadonlyMap<
    string,
    { activityType: string; score: number | null; maxScore: number }
  >,
): { sum: number; denominator: number } {
  let sum = 0;
  let denominator = 0;
  for (const slideId of activitySlideIds) {
    const row = resultBySlideId.get(slideId);
    const activityType = row?.activityType ?? '';
    const score = row?.score ?? null;
    const maxScore = row?.maxScore ?? 1;
    const c = contributionOnFivePointScale(activityType, score, maxScore);
    if (c === null) {
      continue;
    }
    denominator += 1;
    sum += c;
  }
  return { sum, denominator };
}
