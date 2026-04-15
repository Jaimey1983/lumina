import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

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
  score: number;
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
}

function unwrapEnvelope(data: unknown): unknown {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: unknown }).data;
  }
  return data;
}

/** Promedio simple de las notas por columnas de actividad (escala 0–5). */
export function computeStudentPromedio(
  actividades: { slideId: string }[],
  notas: Record<string, number | null | undefined> | undefined,
): number | null {
  if (!notas || actividades.length === 0) return null;
  const values: number[] = [];
  for (const a of actividades) {
    const v = notas[a.slideId];
    if (v !== null && v !== undefined && Number.isFinite(Number(v))) {
      values.push(Number(v));
    }
  }
  if (values.length === 0) return null;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

/** Pasa score/maxScore a escala 0–5 para mostrar y comparar con el umbral 3. */
export function toDisplayNoteOnFive(score: number, maxScore: number): number | null {
  if (!Number.isFinite(score)) return null;
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

function normalizeFromRows(rows: ApiGradebookRow[]): ClassGradebookData {
  const slideOrder: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const r of row.resultados ?? []) {
      if (r?.slideId && !seen.has(r.slideId)) {
        seen.add(r.slideId);
        slideOrder.push(r.slideId);
      }
    }
  }

  const actividades: ClassGradebookActividad[] = slideOrder.map((slideId) => {
    const first = rows
      .flatMap((x) => x.resultados ?? [])
      .find((r) => r.slideId === slideId);
    return {
      slideId,
      activityType: first?.activityType ?? 'actividad',
      esManual: first?.isManual === true,
    };
  });

  const estudiantes: ClassGradebookEstudiante[] = rows.map((row) => {
    const notas: Record<string, number | null> = {};
    const manualPorSlide: Record<string, boolean> = {};
    const resultIdsPorSlide: Record<string, string> = {};
    for (const r of row.resultados ?? []) {
      notas[r.slideId] = toDisplayNoteOnFive(r.score, r.maxScore);
      if (r.isManual) {
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
    const actividades = Array.isArray(b.actividades) ? b.actividades : [];
    const estudiantes = Array.isArray(b.estudiantes) ? b.estudiantes : [];
    if (actividades.length > 0 || estudiantes.length > 0) {
      return {
        actividades: actividades as ClassGradebookActividad[],
        estudiantes: estudiantes as ClassGradebookEstudiante[],
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
