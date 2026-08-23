import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import {
  computeClassGradebookPromedio,
  esEvaluable,
  isGradebookScoringDeferred,
  type GradebookAverageEntry,
} from '@/lib/activity-scoring';

/** Actividad evaluable asociada a un slide (columna de la planilla). */
export interface ClassGradebookActividad {
  slideId: string;
  activityType: string;
  /** Indicador a nivel columna (p. ej. API antigua); las celdas usan `manualPorSlide` por fila. */
  esManual?: boolean;
}

/** Estudiante con notas por slideId y promedio final. */
export interface ClassGradebookEstudiante {
  studentId: string;
  nombre?: string;
  name?: string;
  email?: string;
  /** Origen de la fila: sesión en vivo o recuperación vía sesión autónoma. */
  source?: 'live' | 'autonomous';
  /** Promedio final en escala 0–5 (según backend). */
  notaFinal?: number | null;
  /** Nota mostrada por slideId (0–5), o null si no hay resultado. */
  notas?: Record<string, number | null | undefined>;
  /** Por slideId: si true, la celda es nota manual editable. */
  manualPorSlide?: Record<string, boolean>;
  /** Por slideId: id del resultado para PATCH /classes/:classId/results/:id */
  resultIdsPorSlide?: Record<string, string>;
}

export interface ClassGradebookData {
  actividades: ClassGradebookActividad[];
  estudiantes: ClassGradebookEstudiante[];
}

/** Fila devuelta por GET /classes/:id/gradebook (formato actual). */
export interface ApiGradebookResultado {
  slideId: string;
  activityType: string;
  score: number | null;
  maxScore: number;
  isManual: boolean;
  /** Identificador del resultado (el backend puede enviar `id` o `resultId`). */
  id?: string;
  resultId?: string;
}

export interface ApiGradebookRow {
  studentId: string;
  nombre: string;
  promedio: number | null;
  resultados: ApiGradebookResultado[];
  /** Si `autonomous`, la fila es recuperación: sin desglose por actividad en planilla principal. */
  source?: 'live' | 'autonomous';
}

function unwrapEnvelope(data: unknown): unknown {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: unknown }).data;
  }
  return data;
}

/**
 * Recálculo local del promedio Edu (p. ej. tras PATCH de una celda).
 * Debe coincidir con `class-results-gradebook.helper.ts` / `computeClassGradebookPromedio`
 * — NO reinterpretar al portar.
 */
export function computeStudentPromedio(
  actividades: { slideId: string; activityType: string }[],
  notas: Record<string, number | null | undefined> | undefined,
  manualPorSlide?: Record<string, boolean>,
): number | null {
  const entries: GradebookAverageEntry[] = actividades.map((a) => {
    const raw = notas?.[a.slideId];
    const hasResult = raw !== null && raw !== undefined && Number.isFinite(Number(raw));
    return {
      activityType: a.activityType,
      score: hasResult ? Number(raw) : null,
      hasResult,
      isManual:
        a.activityType === 'short_answer'
          ? manualPorSlide?.[a.slideId] === true
          : undefined,
      maxScore: 5,
    };
  });
  return computeClassGradebookPromedio(entries);
}

/** Pasa score/maxScore a escala 0–5 para mostrar y comparar con el umbral 3. */
export function toDisplayNoteOnFive(
  score: number | null | undefined,
  maxScore: number,
): number | null {
  if (score === null || score === undefined || !Number.isFinite(score)) return null;
  const s = Number(score);
  const m = Number(maxScore);
  if (!Number.isFinite(m) || m <= 0) {
    return Math.min(5, Math.max(0, s));
  }
  if (m <= 5.0001) {
    return Math.min(5, Math.max(0, s));
  }
  return Math.min(5, Math.max(0, (s / m) * 5));
}

/** A partir de filas estilo API construye `actividades` y `estudiantes`. */
export function normalizeFromRows(
  rows: ApiGradebookRow[],
  canonicalActividades?: ClassGradebookActividad[],
): ClassGradebookData {
  let actividades: ClassGradebookActividad[];

  if (canonicalActividades && canonicalActividades.length > 0) {
    actividades = canonicalActividades.filter((a) => esEvaluable(a.activityType));
  } else {
    const slideOrder: string[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      for (const r of row.resultados ?? []) {
        if (!r?.slideId || seen.has(r.slideId)) continue;
        if (!esEvaluable(r.activityType)) continue;
        seen.add(r.slideId);
        slideOrder.push(r.slideId);
      }
    }

    actividades = slideOrder.map((slideId) => {
      const first = rows
        .flatMap((x) => x.resultados ?? [])
        .find((r) => r.slideId === slideId && esEvaluable(r.activityType));
      return {
        slideId,
        activityType: first?.activityType ?? 'actividad',
        esManual: first?.isManual === true || first?.activityType === 'short_answer',
      };
    });
  }

  const columnIds = new Set(actividades.map((a) => a.slideId));

  const estudiantes: ClassGradebookEstudiante[] = rows.map((row) => {
    const notas: Record<string, number | null> = {};
    const manualPorSlide: Record<string, boolean> = {};
    const resultIdsPorSlide: Record<string, string> = {};
    for (const r of row.resultados ?? []) {
      if (!esEvaluable(r.activityType) || !columnIds.has(r.slideId)) continue;
      if (isGradebookScoringDeferred(r.activityType)) continue;
      if (r.score === null || r.score === undefined) {
        notas[r.slideId] = null;
      } else {
        notas[r.slideId] = toDisplayNoteOnFive(r.score, r.maxScore);
      }
      if (r.isManual === true) {
        manualPorSlide[r.slideId] = true;
      }
      const rid = r.id ?? r.resultId;
      if (rid != null && String(rid).length > 0) {
        resultIdsPorSlide[r.slideId] = String(rid);
      }
    }
    const p = row.promedio;
    return {
      studentId: row.studentId,
      nombre: row.nombre,
      source: row.source,
      notaFinal:
        p !== null && p !== undefined && Number.isFinite(Number(p)) ? Number(p) : null,
      notas,
      manualPorSlide,
      resultIdsPorSlide,
    };
  });

  return { actividades, estudiantes };
}

function normalizeResponse(data: unknown): ClassGradebookData {
  const body = unwrapEnvelope(data);

  if (Array.isArray(body)) {
    return normalizeFromRows(body as ApiGradebookRow[]);
  }

  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const actividadesRaw = Array.isArray(b.actividades)
      ? (b.actividades as ClassGradebookActividad[])
      : [];
    const estudiantesRaw = Array.isArray(b.estudiantes)
      ? (b.estudiantes as ApiGradebookRow[] | ClassGradebookEstudiante[])
      : [];

    const canonical = actividadesRaw.filter((a) => a?.activityType && esEvaluable(a.activityType));

    const looksLikeApiRows =
      estudiantesRaw.length === 0 ||
      estudiantesRaw.every(
        (row) =>
          row &&
          typeof row === 'object' &&
          Array.isArray((row as ApiGradebookRow).resultados),
      );

    if (looksLikeApiRows && (canonical.length > 0 || estudiantesRaw.length > 0)) {
      return normalizeFromRows(
        estudiantesRaw as ApiGradebookRow[],
        canonical.length > 0 ? canonical : undefined,
      );
    }

    if (canonical.length > 0 || estudiantesRaw.length > 0) {
      return {
        actividades: canonical.length > 0 ? canonical : actividadesRaw,
        estudiantes: estudiantesRaw as ClassGradebookEstudiante[],
      };
    }
  }

  return { actividades: [], estudiantes: [] };
}

/**
 * GET /classes/:id/gradebook — planilla (array de filas con resultados o formato legado).
 */
export function useGradebook(classId: string | undefined) {
  return useQuery({
    queryKey: ['gradebook', classId],
    enabled: !!classId,
    queryFn: async () => {
      const { data } = await api.get<unknown>(`/classes/${classId}/gradebook`);
      return normalizeResponse(data);
    },
  });
}
