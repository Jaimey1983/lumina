'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  BookOpen,
  Clock,
  Download,
  GraduationCap,
  MessageCircle,
  Star,
  Users,
} from 'lucide-react';

import { useCourses } from '@/hooks/api/use-courses';
import { useCourseAnalytics } from '@/hooks/api/use-course-analytics';
import type {
  StudentProgressRow,
  ActivityRankingRow,
  AtRiskStudentRow,
  GradeDistribution,
} from '@/hooks/api/use-course-analytics';

import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ─── Styling constants ────────────────────────────────────────────────────────

const SELECT_CLS =
  'h-8.5 px-3 rounded-md border border-input bg-background text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground';

const ANALYTICS_CARD =
  'rounded-[10px] bg-[#ffffff] border border-[#e5e7eb] shadow-[0px_2px_6px_rgb(37_99_235_/_0.08)]';
const ANALYTICS_CARD_HEADER = 'border-b border-[#e5e7eb]';
const ANALYTICS_SECTION_TITLE = 'text-sm font-semibold text-[#111827]';
const ANALYTICS_TABLE_HEAD_ROW = 'border-b border-[#e5e7eb] bg-[#F5F5F7]';
const ANALYTICS_TABLE_HEAD_CELL = 'px-5 py-3 text-xs font-medium text-[#6b7280]';
const ANALYTICS_TABLE_HEAD_CELL_CENTER = 'px-4 py-3 text-center text-xs font-medium text-[#6b7280]';
const ANALYTICS_TABLE_BODY_ROW =
  'border-b border-[#e5e7eb] last:border-0 transition-colors hover:bg-[#f9fafb]';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(decimals);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  subLabel?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function KpiCard({ label, value, subLabel, icon, loading }: KpiCardProps) {
  return (
    <div className={cn(ANALYTICS_CARD, 'p-5')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">{label}</span>
        <span className="text-[#9ca3af]">{icon}</span>
      </div>
      {loading ? (
        <>
          <Skeleton className="h-9 w-28 mb-1.5" />
          <Skeleton className="h-3 w-32" />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold leading-none text-[#111827]">{value}</p>
          {subLabel ? <p className="text-xs text-[#6b7280] mt-1.5">{subLabel}</p> : null}
        </>
      )}
    </div>
  );
}

// ─── Course Summary (KPI row) ─────────────────────────────────────────────────

function CourseSummarySection({
  summary,
  isLoading,
  isError,
}: {
  summary: { totalStudents: number; avgGrade: number | null; completionRate: number; activeClasses: number } | null;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isError) {
    return (
      <Alert variant="destructive" appearance="light">
        <AlertIcon>
          <AlertCircle />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>No se pudo cargar el resumen del curso.</AlertTitle>
        </AlertContent>
      </Alert>
    );
  }

  const cards: KpiCardProps[] = [
    {
      label: 'Estudiantes',
      value: summary ? String(summary.totalStudents) : '—',
      subLabel: 'Total en el curso',
      icon: <Users className="size-5 text-[#2563EB]" />,
      loading: isLoading,
    },
    {
      label: 'Promedio general',
      value: summary ? fmt(summary.avgGrade) : '—',
      subLabel: 'Escala 0–5',
      icon: <Star className="size-5 text-[#2563EB]" />,
      loading: isLoading,
    },
    {
      label: 'Tasa de completitud',
      value: summary ? `${summary.completionRate}%` : '—',
      subLabel: 'Actividades completadas',
      icon: <BookOpen className="size-5 text-[#2563EB]" />,
      loading: isLoading,
    },
    {
      label: 'Clases activas',
      value: summary ? String(summary.activeClasses) : '—',
      subLabel: 'Estado publicado',
      icon: <BarChart2 className="size-5 text-[#2563EB]" />,
      loading: isLoading,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}

// ─── Performance badge helper ─────────────────────────────────────────────────

const PERF_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'primary' }> = {
  Superior: { label: 'Superior', variant: 'success' },
  Alto: { label: 'Alto', variant: 'primary' },
  Basico: { label: 'Básico', variant: 'warning' },
  Bajo: { label: 'Bajo', variant: 'destructive' },
};

// ─── Student Progress ─────────────────────────────────────────────────────────

function StudentProgressSection({
  data,
  isLoading,
  isError,
}: {
  data: StudentProgressRow[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <Card className={ANALYTICS_CARD}>
      <CardHeader className={ANALYTICS_CARD_HEADER}>
        <CardHeading>
          <CardTitle className={ANALYTICS_SECTION_TITLE}>Progreso de estudiantes</CardTitle>
        </CardHeading>
        {!isLoading && (
          <CardToolbar>
            <span className="text-sm text-[#6b7280]">{data.length} estudiantes</span>
          </CardToolbar>
        )}
      </CardHeader>
      {isLoading ? (
        <SectionSkeleton />
      ) : isError ? (
        <CardContent>
          <p className="text-sm text-destructive">No se pudo cargar el progreso.</p>
        </CardContent>
      ) : data.length === 0 ? (
        <CardContent>
          <p className="text-sm text-[#6b7280] text-center py-8">Sin datos disponibles.</p>
        </CardContent>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={ANALYTICS_TABLE_HEAD_ROW}>
                <th className={cn(ANALYTICS_TABLE_HEAD_CELL, 'text-left')}>Estudiante</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Completadas</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Promedio</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Desempeño</th>
                <th className={cn(ANALYTICS_TABLE_HEAD_CELL, 'text-left')}>Última clase</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const perf = row.performance ? PERF_BADGE[row.performance] : null;
                return (
                  <tr key={row.studentId} className={ANALYTICS_TABLE_BODY_ROW}>
                    <td className="px-5 py-3 font-medium text-[#111827]">{row.studentName}</td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">
                      {row.activitiesCompleted}/{row.totalActivities}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-[#111827]">
                      {fmt(row.avgGrade)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {perf ? (
                        <Badge variant={perf.variant} appearance="light">
                          {perf.label}
                        </Badge>
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#6b7280] text-xs">{row.lastClass}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Activity Type labels ─────────────────────────────────────────────────────

const ACTIVITY_LABEL: Record<string, string> = {
  quiz_multiple: 'Quiz múltiple',
  verdadero_falso: 'Verdadero/Falso',
  completar_blancos: 'Completar blancos',
  arrastrar_soltar: 'Arrastrar y soltar',
  emparejar: 'Emparejar',
  ordenar_pasos: 'Ordenar pasos',
  video_interactivo: 'Video interactivo',
  short_answer: 'Respuesta corta',
  encuesta_viva: 'Encuesta en vivo',
  nube_palabras: 'Nube de palabras',
};

function labelForActivityType(t: string) {
  return ACTIVITY_LABEL[t] ?? t;
}

function performanceForAvg(avg: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (avg >= 4.0) return 'HIGH';
  if (avg >= 3.0) return 'MEDIUM';
  return 'LOW';
}

const PERF_CONFIG: Record<'HIGH' | 'MEDIUM' | 'LOW', { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  HIGH: { label: 'Alto', variant: 'success' },
  MEDIUM: { label: 'Medio', variant: 'warning' },
  LOW: { label: 'Bajo', variant: 'destructive' },
};

// ─── Activity Ranking ─────────────────────────────────────────────────────────

function ActivityRankingSection({
  data,
  isLoading,
  isError,
}: {
  data: ActivityRankingRow[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <Card className={ANALYTICS_CARD}>
      <CardHeader className={ANALYTICS_CARD_HEADER}>
        <CardHeading>
          <CardTitle className={ANALYTICS_SECTION_TITLE}>Ranking de actividades</CardTitle>
        </CardHeading>
      </CardHeader>
      {isLoading ? (
        <SectionSkeleton />
      ) : isError ? (
        <CardContent>
          <p className="text-sm text-destructive">No se pudo cargar el ranking.</p>
        </CardContent>
      ) : data.length === 0 ? (
        <CardContent>
          <p className="text-sm text-[#6b7280] text-center py-8">Sin actividades aún.</p>
        </CardContent>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={ANALYTICS_TABLE_HEAD_ROW}>
                <th className={cn(ANALYTICS_TABLE_HEAD_CELL, 'text-left')}>Tipo de actividad</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Promedio</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Respuestas</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const perf = PERF_CONFIG[performanceForAvg(row.avgScore)];
                return (
                  <tr key={row.activityType} className={ANALYTICS_TABLE_BODY_ROW}>
                    <td className="px-5 py-3 font-medium text-[#111827]">
                      {labelForActivityType(row.activityType)}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-[#111827]">
                      {fmt(row.avgScore)}
                      <span className="text-xs font-normal text-[#6b7280]"> /5</span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">{row.totalResponses}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={perf.variant} appearance="light">
                        {perf.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Engagement (no data source yet) ─────────────────────────────────────────

function EngagementSection() {
  return (
    <Card className={ANALYTICS_CARD}>
      <CardHeader className={ANALYTICS_CARD_HEADER}>
        <CardHeading>
          <CardTitle className={ANALYTICS_SECTION_TITLE}>Engagement</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center py-10 gap-3 text-center">
          <MessageCircle className="size-9 text-[#9ca3af]" />
          <p className="text-sm font-medium text-[#6b7280]">Disponible próximamente</p>
          <p className="text-xs text-[#9ca3af] max-w-xs">
            Requiere datos de sesión en vivo — esta sección se habilitará
            cuando el backend registre eventos de participación en tiempo real.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── At-Risk Students ─────────────────────────────────────────────────────────

function AtRiskSection({
  data,
  isLoading,
  isError,
}: {
  data: AtRiskStudentRow[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <Card className={ANALYTICS_CARD}>
      <CardHeader className={ANALYTICS_CARD_HEADER}>
        <CardHeading>
          <CardTitle className={cn(ANALYTICS_SECTION_TITLE, 'inline-flex items-center gap-2')}>
            <AlertTriangle className="size-4 text-warning" />
            Estudiantes en riesgo
          </CardTitle>
        </CardHeading>
        {!isLoading && data.length > 0 && (
          <CardToolbar>
            <Badge variant="warning" appearance="light">
              {data.length} en riesgo
            </Badge>
          </CardToolbar>
        )}
      </CardHeader>
      {isLoading ? (
        <SectionSkeleton rows={3} />
      ) : isError ? (
        <CardContent>
          <p className="text-sm text-destructive">No se pudo cargar los estudiantes en riesgo.</p>
        </CardContent>
      ) : data.length === 0 ? (
        <CardContent>
          <div className="flex flex-col items-center py-10 gap-2 text-center">
            <GraduationCap className="size-8 text-success" />
            <p className="text-sm text-[#6b7280]">Sin estudiantes en riesgo.</p>
          </div>
        </CardContent>
      ) : (
        <div className="divide-y divide-[#e5e7eb]">
          {data.map((student) => (
            <div
              key={student.studentId}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#f9fafb]"
            >
              <p className="font-medium text-sm text-[#111827]">{student.studentName}</p>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-sm text-[#111827]">
                  {fmt(student.promedio)}
                </span>
                <Badge variant="destructive" appearance="light" className="text-xs">
                  Bajo
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Grade Distribution ───────────────────────────────────────────────────────

const DISTRIBUTION_RANGES = ['Bajo', 'Básico', 'Alto', 'Superior'] as const;

function GradeDistributionSection({
  distribution,
  isLoading,
  isError,
}: {
  distribution: GradeDistribution | null;
  isLoading: boolean;
  isError: boolean;
}) {
  const chartData = distribution
    ? [
        { range: 'Bajo\n(<3.0)', count: distribution.bajo },
        { range: 'Básico\n(3–3.9)', count: distribution.basico },
        { range: 'Alto\n(4–4.6)', count: distribution.alto },
        { range: 'Superior\n(≥4.7)', count: distribution.superior },
      ]
    : DISTRIBUTION_RANGES.map((range) => ({ range, count: 0 }));

  return (
    <Card className={ANALYTICS_CARD}>
      <CardHeader className={ANALYTICS_CARD_HEADER}>
        <CardHeading>
          <CardTitle className={ANALYTICS_SECTION_TITLE}>Distribución de desempeño</CardTitle>
        </CardHeading>
        {distribution && !isLoading && (
          <CardToolbar>
            <span className="text-xs text-[#6b7280]">
              {distribution.bajo + distribution.basico + distribution.alto + distribution.superior} estudiantes
            </span>
          </CardToolbar>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : isError ? (
          <p className="text-sm text-destructive py-4">No se pudo cargar la distribución.</p>
        ) : !distribution ? (
          <div className="flex flex-col items-center py-12 gap-2 text-center">
            <BarChart2 className="size-9 text-[#6b7280]" />
            <p className="text-sm text-[#6b7280]">Sin datos de distribución.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value: number) => [value, 'Estudiantes']}
              />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AnalyticsClient() {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const [coursePick, setCoursePick] = useState<string | null>(null);

  const selectedCourseId = coursePick ?? courses[0]?.id ?? '';

  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } =
    useCourseAnalytics(selectedCourseId);

  const summary = analytics?.summary ?? null;
  const studentProgress = analytics?.studentProgress ?? [];
  const activityRanking = analytics?.activityRanking ?? [];
  const atRisk = analytics?.atRisk ?? [];
  const distribution = analytics?.distribution ?? null;

  return (
    <div className="w-full space-y-6 p-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#111827]">Analytics</h1>
          <p className="text-sm mt-1 text-[#6b7280]">Métricas y reportes de rendimiento por curso</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Course selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="course-select" className="text-sm font-medium shrink-0">
              Curso:
            </label>
            {coursesLoading ? (
              <Skeleton className="h-8.5 w-52" />
            ) : courses.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Sin cursos disponibles.</p>
            ) : (
              <select
                id="course-select"
                value={selectedCourseId}
                onChange={(e) => setCoursePick(e.target.value)}
                className={`${SELECT_CLS} min-w-[14rem]`}
              >
                <option value="" disabled>
                  Selecciona un curso
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            <Download size={15} />
            Descargar reporte
          </button>
        </div>
      </div>

      {!selectedCourseId ? (
        <div className="flex flex-col items-center py-24 gap-3 text-center">
          <BarChart2 className="size-12 text-[#6b7280]" />
          <p className="text-sm text-[#6b7280]">Selecciona un curso para ver sus analytics.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          <CourseSummarySection
            summary={summary}
            isLoading={analyticsLoading}
            isError={analyticsError}
          />

          {/* Loading indicator for analytics data */}
          {analyticsLoading && (
            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
              <Clock className="size-4 animate-spin" />
              Calculando métricas del curso…
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <StudentProgressSection
              data={studentProgress}
              isLoading={analyticsLoading}
              isError={analyticsError}
            />
            <ActivityRankingSection
              data={activityRanking}
              isLoading={analyticsLoading}
              isError={analyticsError}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <EngagementSection />
            <AtRiskSection
              data={atRisk}
              isLoading={analyticsLoading}
              isError={analyticsError}
            />
          </div>

          <GradeDistributionSection
            distribution={distribution}
            isLoading={analyticsLoading}
            isError={analyticsError}
          />
        </div>
      )}
    </div>
  );
}
