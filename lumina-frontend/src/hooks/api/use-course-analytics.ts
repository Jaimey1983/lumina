import { useQueries, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Class } from '@/hooks/api/use-classes';
import { toDisplayNoteOnFive, type ApiGradebookRow } from '@/hooks/use-gradebook';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function normalizeClasses(data: unknown): Class[] {
  if (Array.isArray(data)) return data as Class[];
  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: Class[] }).data;
  }
  return [];
}

function unwrapEnvelope(data: unknown): unknown {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: unknown }).data;
  }
  return data;
}

function normalizeGradebookRows(raw: unknown): ApiGradebookRow[] {
  const body = unwrapEnvelope(raw);
  if (Array.isArray(body)) return body as ApiGradebookRow[];
  if (
    body &&
    typeof body === 'object' &&
    Array.isArray((body as { estudiantes?: unknown }).estudiantes)
  ) {
    return (body as { estudiantes: ApiGradebookRow[] }).estudiantes;
  }
  return [];
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CourseAnalyticsSummary {
  totalStudents: number;
  avgGrade: number | null;
  completionRate: number;
  activeClasses: number;
}

export interface StudentProgressRow {
  studentId: string;
  studentName: string;
  activitiesCompleted: number;
  totalActivities: number;
  avgGrade: number | null;
  /** Performance tier derived from avgGrade. */
  performance: 'Superior' | 'Alto' | 'Basico' | 'Bajo' | null;
  /** Last class title the student appeared in. */
  lastClass: string;
}

export interface ActivityRankingRow {
  activityType: string;
  avgScore: number;
  totalResponses: number;
}

export interface AtRiskStudentRow {
  studentId: string;
  studentName: string;
  promedio: number;
}

export interface GradeDistribution {
  bajo: number;
  basico: number;
  alto: number;
  superior: number;
}

export interface CourseAnalyticsData {
  summary: CourseAnalyticsSummary;
  studentProgress: StudentProgressRow[];
  activityRanking: ActivityRankingRow[];
  atRisk: AtRiskStudentRow[];
  distribution: GradeDistribution;
}

// ─── Performance label helper ─────────────────────────────────────────────────

function getPerformance(avg: number | null): StudentProgressRow['performance'] {
  if (avg === null) return null;
  if (avg < 3.0) return 'Bajo';
  if (avg < 4.0) return 'Basico';
  if (avg <= 4.6) return 'Alto';
  return 'Superior';
}

// ─── Core computation ─────────────────────────────────────────────────────────

/**
 * Given all classes and their gradebook rows, compute all KPIs needed
 * for the analytics dashboard.
 */
function computeAnalytics(
  classes: Class[],
  gradebooksByClassId: Map<string, ApiGradebookRow[]>,
): CourseAnalyticsData {
  // 1. Unique students across all classes (by studentId).
  const studentMap = new Map<
    string,
    { nombre: string; promedios: number[]; lastClass: string; activitiesCompleted: number; totalActivities: number }
  >();

  // 2. Activity scores aggregated by activityType.
  const activityMap = new Map<string, { total: number; count: number }>();

  for (const cls of classes) {
    const rows = gradebooksByClassId.get(cls.id) ?? [];
    for (const row of rows) {
      const existing = studentMap.get(row.studentId);
      const promedio = row.promedio;

      // Activities completed = score > 0 in all resultados
      const totalActs = row.resultados?.length ?? 0;
      const completedActs = row.resultados?.filter((r) => {
        const display = toDisplayNoteOnFive(r.score, r.maxScore);
        return display !== null && display > 0;
      }).length ?? 0;

      if (!existing) {
        studentMap.set(row.studentId, {
          nombre: row.nombre,
          promedios: promedio !== null && promedio !== undefined && Number.isFinite(Number(promedio))
            ? [Number(promedio)]
            : [],
          lastClass: cls.title,
          activitiesCompleted: completedActs,
          totalActivities: totalActs,
        });
      } else {
        if (promedio !== null && promedio !== undefined && Number.isFinite(Number(promedio))) {
          existing.promedios.push(Number(promedio));
        }
        existing.lastClass = cls.title;
        existing.activitiesCompleted += completedActs;
        existing.totalActivities += totalActs;
      }

      // Activity ranking
      for (const r of row.resultados ?? []) {
        const display = toDisplayNoteOnFive(r.score, r.maxScore);
        if (display !== null) {
          const entry = activityMap.get(r.activityType) ?? { total: 0, count: 0 };
          entry.total += display;
          entry.count += 1;
          activityMap.set(r.activityType, entry);
        }
      }
    }
  }

  // ─── Build StudentProgressRow[] ──────────────────────────────────────────
  const studentProgress: StudentProgressRow[] = [];
  studentMap.forEach((val, studentId) => {
    const avgGrade =
      val.promedios.length > 0
        ? Math.round((val.promedios.reduce((s, p) => s + p, 0) / val.promedios.length) * 10) / 10
        : null;
    studentProgress.push({
      studentId,
      studentName: val.nombre,
      activitiesCompleted: val.activitiesCompleted,
      totalActivities: val.totalActivities,
      avgGrade,
      performance: getPerformance(avgGrade),
      lastClass: val.lastClass,
    });
  });

  // ─── Summary KPIs ────────────────────────────────────────────────────────
  const allPromedios = studentProgress
    .map((s) => s.avgGrade)
    .filter((p): p is number => p !== null);

  const avgGrade =
    allPromedios.length > 0
      ? Math.round((allPromedios.reduce((s, p) => s + p, 0) / allPromedios.length) * 10) / 10
      : null;

  // Completitud: % students with all activities scored > 0
  const fullyComplete = studentProgress.filter(
    (s) => s.totalActivities > 0 && s.activitiesCompleted >= s.totalActivities,
  ).length;
  const completionRate =
    studentProgress.length > 0
      ? Math.round((fullyComplete / studentProgress.length) * 100)
      : 0;

  const activeClasses = classes.filter((c) => c.status !== 'draft' && c.status !== 'borrador').length;

  // ─── Activity ranking ────────────────────────────────────────────────────
  const activityRanking: ActivityRankingRow[] = [];
  activityMap.forEach((val, activityType) => {
    activityRanking.push({
      activityType,
      avgScore: Math.round((val.total / val.count) * 10) / 10,
      totalResponses: val.count,
    });
  });
  activityRanking.sort((a, b) => b.avgScore - a.avgScore);

  // ─── At-risk and distribution ─────────────────────────────────────────────
  const atRisk: AtRiskStudentRow[] = studentProgress
    .filter((s) => s.avgGrade !== null && (s.avgGrade as number) < 3.0)
    .map((s) => ({ studentId: s.studentId, studentName: s.studentName, promedio: s.avgGrade as number }));

  const distribution: GradeDistribution = {
    bajo: studentProgress.filter((s) => s.avgGrade !== null && (s.avgGrade as number) < 3.0).length,
    basico: studentProgress.filter((s) => s.avgGrade !== null && (s.avgGrade as number) >= 3.0 && (s.avgGrade as number) < 4.0).length,
    alto: studentProgress.filter((s) => s.avgGrade !== null && (s.avgGrade as number) >= 4.0 && (s.avgGrade as number) <= 4.6).length,
    superior: studentProgress.filter((s) => s.avgGrade !== null && (s.avgGrade as number) > 4.6).length,
  };

  return {
    summary: {
      totalStudents: studentMap.size,
      avgGrade,
      completionRate,
      activeClasses,
    },
    studentProgress,
    activityRanking,
    atRisk,
    distribution,
  };
}

// ─── Public hook ──────────────────────────────────────────────────────────────

/**
 * Fetches all classes for `courseId` then loads each class's gradebook in
 * parallel. All KPIs are computed client-side from the raw gradebook data —
 * no dedicated analytics endpoints required.
 */
export function useCourseAnalytics(courseId: string) {
  // Step 1: get list of classes for the course.
  const classesQuery = useQuery({
    queryKey: ['classes', courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data } = await api.get<unknown>('/classes', { params: { courseId } });
      return normalizeClasses(data);
    },
  });

  const classes = classesQuery.data ?? [];

  // Step 2: for each class, fetch the gradebook in parallel.
  const gradebookQueries = useQueries({
    queries: classes.map((cls) => ({
      queryKey: ['gradebook', cls.id],
      enabled: !!cls.id,
      queryFn: async () => {
        const { data } = await api.get<unknown>(`/classes/${cls.id}/gradebook`);
        return { classId: cls.id, rows: normalizeGradebookRows(data) };
      },
    })),
  });

  const isLoading =
    classesQuery.isLoading ||
    (classes.length > 0 && gradebookQueries.some((q) => q.isLoading));

  const isError =
    classesQuery.isError || gradebookQueries.some((q) => q.isError);

  const allLoaded =
    !classesQuery.isLoading &&
    !classesQuery.isError &&
    gradebookQueries.every((q) => !q.isLoading && !q.isError);

  let analytics: CourseAnalyticsData | null = null;

  if (allLoaded && classes.length >= 0) {
    const gradebooksByClassId = new Map<string, ApiGradebookRow[]>();
    for (const q of gradebookQueries) {
      if (q.data) {
        gradebooksByClassId.set(q.data.classId, q.data.rows);
      }
    }
    analytics = computeAnalytics(classes, gradebooksByClassId);
  }

  return { data: analytics, isLoading, isError, classes };
}
