import { Prisma } from '@prisma/client';
import { getActivityScoringKind } from './activity-scoring';

/** Escala de ClassResult / notaColombiana (Fase 0). No usar 1. */
export const CLASS_RESULT_MAX_SCORE_DEFAULT = 5;

export interface PersistableStudentResult {
  activityType: string;
  score?: number | null;
  maxScore?: number;
  correct?: boolean | null;
  historial?: unknown[];
  response?: unknown;
}

/**
 * JSON crudo a persistir en ClassResult.response.
 * Si el cliente envía `response`, se guarda TAL CUAL (sin transformar).
 * Fallback legado: { correct, historial } de clientes que aún no mandan response.
 */
export function toPersistedResponseJson(
  item: PersistableStudentResult,
): unknown {
  if (item.response !== undefined) {
    return item.response;
  }
  const legacy: Record<string, unknown> = {};
  if (item.correct !== undefined && item.correct !== null) {
    legacy.correct = item.correct;
  }
  if (item.historial !== undefined) {
    legacy.historial = item.historial;
  }
  return Object.keys(legacy).length > 0 ? legacy : null;
}

export function toPrismaJsonValue(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export function resolvePersistedMaxScore(
  item: PersistableStudentResult,
): number {
  return typeof item.maxScore === 'number' &&
    Number.isFinite(item.maxScore) &&
    item.maxScore > 0
    ? item.maxScore
    : CLASS_RESULT_MAX_SCORE_DEFAULT;
}

/**
 * Score a persistir. No inventa 0 para un intento fallido evaluable.
 *
 * - Si viene `score` numérico (incl. 0 = no respondió), se respeta.
 * - `score: null` → null (manual / participation / exclude, Fase 2).
 * - Sin score + kind manual/participation/exclude → null.
 * - Sin score + correct true → maxScore (default 5).
 * - Sin score + correct false → 1.0 (mínimo pedagógico de notaColombiana).
 * - Sin score y sin correct → null (no fabricar 0).
 */
export function resolvePersistedClassResultScore(
  item: PersistableStudentResult,
): number | null {
  const kind = getActivityScoringKind(item.activityType);
  if (kind === 'manual' || kind === 'participation' || kind === 'exclude') {
    return typeof item.score === 'number' && Number.isFinite(item.score)
      ? item.score
      : null;
  }
  if (typeof item.score === 'number' && Number.isFinite(item.score)) {
    return item.score;
  }
  if (item.score === null) return null;
  if (item.correct === true) return resolvePersistedMaxScore(item);
  if (item.correct === false) return 1.0;
  return null;
}
