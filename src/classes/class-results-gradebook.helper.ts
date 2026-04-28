/** Escala máxima del promedio mostrado en el gradebook de clase (0–5). */
export const GRADEBOOK_SCORE_SCALE = 5.0;

/**
 * Pasa la respuesta guardada (string, string[], u objetos legacy) a ids de opción
 * estables. Sin ids válidos → null.
 */
function normalizeQuizMultipleResponse(response: unknown): string[] | null {
  if (response === null || response === undefined) return null;
  if (typeof response === 'string') {
    const t = response.trim();
    return t ? [t] : null;
  }
  if (Array.isArray(response)) {
    const ids = response.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
    return ids.length > 0 ? [...new Set(ids)] : null;
  }
  if (typeof response === 'object' && response !== null) {
    const o = response as Record<string, unknown>;
    if (typeof o.opcionSeleccionada === 'string' && o.opcionSeleccionada.trim()) {
      return [o.opcionSeleccionada];
    }
    if (typeof o.selectedId === 'string' && o.selectedId.trim()) {
      return [o.selectedId];
    }
    if (Array.isArray(o.opcionesSeleccionadas)) {
      const ids = o.opcionesSeleccionadas.filter(
        (x): x is string => typeof x === 'string' && x.trim() !== '',
      );
      return ids.length > 0 ? [...new Set(ids)] : null;
    }
  }
  return null;
}

function applyMinScore(raw: number, responded: boolean): number {
  if (!responded) return 0.0;
  return Math.max(1.0, raw);
}

/**
 * Calcula el score (0–5) de una actividad en modo autónomo a partir
 * de la respuesta raw guardada en AutonomousProgress y la definición
 * de la actividad extraída del contenido del slide.
 *
 * Respuesta null/undefined → 0.0 (no respondió).
 * Respondió → mínimo 1.0. Todo correcto → 5.0.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function scoreActivityResponse(activityType: string, response: unknown, activityDef: any): number {
  if (response === null || response === undefined) return 0.0;

  switch (activityType) {
    case 'quiz_multiple': {
      const sel = normalizeQuizMultipleResponse(response);
      if (sel === null) return 0.0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const correctIds: string[] = (activityDef?.opciones ?? [])
        .filter((o: any) => o.esCorrecta)
        .map((o: any) => o.id);
      if (correctIds.length === 0) return 1.0;
      const allCorrect =
        sel.length === correctIds.length && sel.every((id) => correctIds.includes(id));
      return allCorrect ? 5.0 : 1.0;
    }

    case 'verdadero_falso': {
      return response === activityDef?.respuestaCorrecta ? 5.0 : 1.0;
    }

    case 'completar_blancos': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blancos: any[] = activityDef?.blancos ?? [];
      if (blancos.length === 0) return 1.0;
      const resp = response as Record<string, string>;
      let correct = 0;
      for (const blanco of blancos) {
        const given = (resp[blanco.id] ?? '').trim();
        const expected: string = (blanco.respuesta ?? '').trim();
        const alt: string[] = blanco.alternativas ?? [];
        const ignCase: boolean = blanco.ignorarMayusculas !== false;
        const eq = (a: string, b: string) => (ignCase ? a.toLowerCase() === b.toLowerCase() : a === b);
        if (eq(given, expected) || alt.some((a: string) => eq(given, a))) correct++;
      }
      return applyMinScore((correct / blancos.length) * 5.0, true);
    }

    case 'arrastrar_soltar': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = activityDef?.items ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zonas: any[] = activityDef?.zonas ?? [];
      if (items.length === 0) return 1.0;
      const correctZone: Record<string, string> = {};
      for (const zona of zonas) {
        for (const itemId of (zona.itemsCorrectos ?? [])) {
          correctZone[itemId as string] = zona.id as string;
        }
      }
      const placements = response as { itemId: string; zoneId: string | null }[];
      let correct = 0;
      for (const p of placements) {
        if (correctZone[p.itemId] && correctZone[p.itemId] === p.zoneId) correct++;
      }
      return applyMinScore((correct / items.length) * 5.0, true);
    }

    case 'emparejar': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pares: any[] = activityDef?.pares ?? [];
      if (pares.length === 0) return 1.0;
      const matches = response as { leftId: string; rightId: string }[];
      const correct = matches.filter((m) => m.leftId === m.rightId).length;
      return applyMinScore((correct / pares.length) * 5.0, true);
    }

    case 'ordenar_pasos': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pasos: any[] = activityDef?.pasos ?? [];
      if (pasos.length === 0) return 1.0;
      const orderedIds = response as string[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const correctOrder = [...pasos].sort((a: any, b: any) => a.ordenCorrecto - b.ordenCorrecto).map((p: any) => p.id as string);
      let correct = 0;
      for (let i = 0; i < orderedIds.length && i < correctOrder.length; i++) {
        if (orderedIds[i] === correctOrder[i]) correct++;
      }
      return applyMinScore((correct / pasos.length) * 5.0, true);
    }

    // Participación: respondió → 1.0, no respondió → 0.0
    case 'short_answer':
      if (typeof response === 'string') return response.trim().length > 0 ? 1.0 : 0.0;
      return 1.0;

    case 'encuesta_viva':
    case 'nube_palabras':
      return applyMinScore(1.0, response !== null && response !== undefined);

    case 'video_interactivo': {
      // Accept both legacy single-answer payload and the accumulated
      // `{ historial: [{ questionIndex, answer }] }` shape.
      const preguntas = Array.isArray(activityDef?.preguntas) ? activityDef.preguntas : [];
      if (preguntas.length === 0) return 1.0;

      let answerByQuestion = new Map<number, string>();
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        const r = response as Record<string, unknown>;
        if (Array.isArray(r.historial)) {
          answerByQuestion = new Map(
            r.historial
              .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const o = item as Record<string, unknown>;
                const questionIndex =
                  typeof o.questionIndex === 'number' ? o.questionIndex : NaN;
                const answer = typeof o.answer === 'string' ? o.answer : '';
                if (!Number.isFinite(questionIndex) || !answer.trim()) return null;
                return [questionIndex, answer] as const;
              })
              .filter((x): x is readonly [number, string] => x !== null),
          );
        } else if (
          typeof r.questionIndex === 'number' &&
          typeof r.answer === 'string' &&
          r.answer.trim()
        ) {
          answerByQuestion.set(r.questionIndex, r.answer);
        }
      }

      const responded = answerByQuestion.size > 0;
      if (!responded) return 0.0;

      let correct = 0;
      for (let i = 0; i < preguntas.length; i++) {
        const selected = answerByQuestion.get(i);
        if (!selected) continue;
        const opciones = Array.isArray(preguntas[i]?.opciones) ? preguntas[i].opciones : [];
        const isCorrect = opciones.some(
          (op: any) => op?.id === selected && op?.esCorrecta === true,
        );
        if (isCorrect) correct += 1;
      }
      return applyMinScore((correct / preguntas.length) * 5.0, true);
    }

    default:
      return 1.0;
  }
}

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
