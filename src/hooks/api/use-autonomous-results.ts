import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export interface AutonomousResultado {
  slideId: string;
  activityType: string;
  score: number;
  maxScore: number;
  isManual: boolean;
}

export interface AutonomousResultRow {
  studentId: string;
  studentName: string;
  /** promedio final (escala del backend) */
  score: number | null;
  status: string;
  completedAt: string | null;
  resultados: AutonomousResultado[];
}

function unwrapEnvelope(data: unknown): unknown {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: unknown }).data;
  }
  return data;
}

function pickString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}

function pickNumber(...vals: unknown[]): number | null {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = parseFloat(v.replace(',', '.'));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function buildNameFromUser(user: Record<string, unknown> | null): string | null {
  if (!user) return null;
  const name = pickString(user.name, user.firstName, user.nombre);
  const last = pickString(user.lastName, user.last_name, user.apellido);
  if (name && last) return `${name} ${last}`;
  return name ?? last;
}

function mapResultado(r: unknown): AutonomousResultado | null {
  if (!r || typeof r !== 'object') return null;
  const o = r as Record<string, unknown>;
  const slideId = pickString(o.slideId) ?? (typeof o.slideId === 'string' ? o.slideId : null);
  if (!slideId) return null;
  const activityType = typeof o.activityType === 'string' ? o.activityType : 'actividad';
  const score = pickNumber(o.score) ?? 0;
  const maxScore = pickNumber(o.maxScore) ?? 0;
  const isManual = o.isManual === true;
  return { slideId, activityType, score, maxScore, isManual };
}

/** Normaliza la respuesta de GET /autonomous-sessions/:sessionId/results (mismo criterio que gradebook de clase). */
export function normalizeAutonomousResults(raw: unknown): AutonomousResultRow[] {
  const data = unwrapEnvelope(raw);
  const body = data as { purpose?: string; results?: unknown[] } | unknown[];
  const rowsUnresolved = Array.isArray(body)
    ? body
    : (body as { results?: unknown[] }).results ?? [];
  const rows = Array.isArray(rowsUnresolved) ? rowsUnresolved : [];

  return rows.map((item, index): AutonomousResultRow => {
    const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const nestedStudent =
      row.student && typeof row.student === 'object'
        ? (row.student as Record<string, unknown>)
        : null;
    const nestedUser =
      nestedStudent?.user && typeof nestedStudent.user === 'object'
        ? (nestedStudent.user as Record<string, unknown>)
        : null;

    const studentName =
      pickString(
        row.nombre,
        row.studentName,
        row.student_name,
        row.displayName,
        buildNameFromUser(nestedUser),
        nestedStudent
          ? pickString(nestedStudent.name, nestedStudent.nombre)
          : null,
        row.name,
        row.nombre,
      ) ?? 'Sin nombre';

    const studentIdFromNested =
      nestedStudent && (pickString(nestedStudent.id, nestedStudent.studentId) as string | null);
    const studentId =
      pickString(row.studentId) ??
      (typeof row.studentId === 'string' && row.studentId ? row.studentId : null) ??
      studentIdFromNested ??
      `__anon_${index}`;

    const resultadosRaw = row.resultados;
    const resultados: AutonomousResultado[] = Array.isArray(resultadosRaw)
      ? (resultadosRaw as unknown[]).map(mapResultado).filter((x): x is AutonomousResultado => x != null)
      : [];

    const score = pickNumber(
      row.promedio,
      row.score,
      row.finalScore,
      row.notaFinal,
      row.finalNote,
    );

    const rawStatus = row.status ?? row.submissionStatus ?? row.state ?? '';
    const status =
      typeof rawStatus === 'string' ? rawStatus.toLowerCase() : String(rawStatus).toLowerCase();

    const completedAt =
      pickString(row.completedAt, row.completed_at, row.finishedAt, row.finished_at) ?? null;

    return { studentId, studentName, score, status, completedAt, resultados };
  });
}

export function useAutonomousResults(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['autonomous-session-results', sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data } = await api.get<unknown>(`/autonomous-sessions/${sessionId}/results`);
      return normalizeAutonomousResults(data);
    },
  });
}
