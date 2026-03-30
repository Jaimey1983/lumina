'use client';

import { useEffect, useState } from 'react';
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
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart2,
  BookOpen,
  GraduationCap,
  MessageCircle,
  Star,
  Trophy,
  Users,
} from 'lucide-react';

import { useCourses } from '@/hooks/api/use-courses';
import { useCoursePeriods } from '@/hooks/api/use-periods';
import {
  useCourseSummary,
  useStudentProgress,
  useActivityRanking,
  useStudentEngagement,
  useGradeDistribution,
} from '@/hooks/api/use-analytics-detail';
import { useAtRiskStudents } from '@/hooks/api/use-performance';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SELECT_CLS =
  'h-8.5 px-3 rounded-md border border-input bg-background text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground';

function fmt(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(decimals);
}

function pct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${Math.round(n)}%`;
}

// ─── Section skeleton ─────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

// ─── 1. Course Summary Cards ──────────────────────────────────────────────────

function CourseSummarySection({ courseId }: { courseId: string }) {
  const { data, isLoading, isError } = useCourseSummary(courseId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive" appearance="light">
        <AlertIcon><AlertCircle /></AlertIcon>
        <AlertContent><AlertTitle>No se pudo cargar el resumen del curso.</AlertTitle></AlertContent>
      </Alert>
    );
  }

  const statCards = [
    {
      label: 'Estudiantes',
      value: data.totalStudents,
      icon: <Users className="size-5 text-primary" />,
    },
    {
      label: 'Promedio general',
      value: fmt(data.avgGrade),
      icon: <Star className="size-5 text-warning" />,
    },
    {
      label: 'Tasa de completitud',
      value: pct(data.completionRate),
      icon: <BookOpen className="size-5 text-success" />,
    },
    {
      label: 'Clases activas',
      value: data.classesByStatus?.find((s) => s.status === 'PUBLISHED')?.count ?? 0,
      icon: <BarChart2 className="size-5 text-info" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── 2. Student Progress Table ─────────────────────────────────────────────────

function StudentProgressSection({ courseId }: { courseId: string }) {
  const { data = [], isLoading, isError } = useStudentProgress(courseId);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <ArrowUp className="size-4 text-success" />;
    if (trend === 'down') return <ArrowDown className="size-4 text-destructive" />;
    return <ArrowRight className="size-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Progreso de estudiantes</CardTitle>
        </CardHeading>
        {!isLoading && <CardToolbar><span className="text-sm text-muted-foreground">{data.length} estudiantes</span></CardToolbar>}
      </CardHeader>
      {isLoading ? (
        <SectionSkeleton />
      ) : isError ? (
        <CardContent>
          <p className="text-sm text-destructive">No se pudo cargar el progreso.</p>
        </CardContent>
      ) : data.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Sin datos disponibles.</p>
        </CardContent>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estudiante</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Completadas</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Promedio</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.studentId} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 font-medium">{row.studentName}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {row.activitiesCompleted}/{row.totalActivities}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {fmt(row.avgGrade)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex justify-center">
                      <TrendIcon trend={row.trend} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── 3. Activity Ranking Table ─────────────────────────────────────────────────

const PERFORMANCE_CONFIG: Record<
  'HIGH' | 'MEDIUM' | 'LOW',
  { label: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  HIGH: { label: 'Alto', variant: 'success' },
  MEDIUM: { label: 'Medio', variant: 'warning' },
  LOW: { label: 'Bajo', variant: 'destructive' },
};

function ActivityRankingSection({ courseId }: { courseId: string }) {
  const { data = [], isLoading, isError } = useActivityRanking(courseId);

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Ranking de actividades</CardTitle>
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
          <p className="text-sm text-muted-foreground text-center py-8">Sin actividades aún.</p>
        </CardContent>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actividad</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Promedio</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Calificados</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const perf = PERFORMANCE_CONFIG[row.performance] ?? PERFORMANCE_CONFIG.MEDIUM;
                return (
                  <tr key={row.activityId} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 font-medium">{row.activityName}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {fmt(row.avgScore)} <span className="text-xs font-normal text-muted-foreground">/ {row.maxScore}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{row.totalGraded}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={perf.variant} appearance="light">{perf.label}</Badge>
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

// ─── 4. Engagement Table ───────────────────────────────────────────────────────

function EngagementSection({ courseId }: { courseId: string }) {
  const { data = [], isLoading, isError } = useStudentEngagement(courseId);

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Engagement</CardTitle>
        </CardHeading>
      </CardHeader>
      {isLoading ? (
        <SectionSkeleton />
      ) : isError ? (
        <CardContent>
          <p className="text-sm text-destructive">No se pudo cargar el engagement.</p>
        </CardContent>
      ) : data.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Sin datos de engagement.</p>
        </CardContent>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estudiante</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> Mensajes</span>
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Trophy className="size-3.5" /> Puntos</span>
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Star className="size-3.5" /> Badges</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.studentId} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 font-medium">{row.studentName}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{row.messagesSent}</td>
                  <td className="px-4 py-3 text-center font-semibold">{row.gamificationPoints}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{row.badgesEarned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── 5. At-Risk Students ───────────────────────────────────────────────────────

function AtRiskSection({ courseId }: { courseId: string }) {
  const { data = [], isLoading, isError } = useAtRiskStudents(courseId);

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle className="inline-flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            Estudiantes en riesgo
          </CardTitle>
        </CardHeading>
        {!isLoading && data.length > 0 && (
          <CardToolbar>
            <Badge variant="warning" appearance="light">{data.length} en riesgo</Badge>
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
            <p className="text-sm text-muted-foreground">Sin estudiantes en riesgo.</p>
          </div>
        </CardContent>
      ) : (
        <div className="divide-y divide-border">
          {data.map((student) => (
            <div key={student.studentId} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-muted/40 transition-colors">
              <div>
                <p className="font-medium text-sm">{student.studentName}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {student.reasons.map((reason, i) => (
                    <Badge key={i} variant="destructive" appearance="light" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0 text-sm">
                <p className="font-semibold">{fmt(student.avgGrade)}</p>
                <p className="text-xs text-muted-foreground">{pct(student.completionRate)} completado</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── 6. Grade Distribution Chart ──────────────────────────────────────────────

const DISTRIBUTION_RANGES = ['0-1', '1-2', '2-3', '3-4', '4-5'];

function GradeDistributionSection({
  courseId,
  periodId,
  periods,
  periodsLoading,
  onPeriodChange,
}: {
  courseId: string;
  periodId: string;
  periods: { id: string; name: string }[];
  periodsLoading: boolean;
  onPeriodChange: (id: string) => void;
}) {
  const { data = [], isLoading, isError } = useGradeDistribution(courseId, periodId);

  // Ensure all ranges are present even if backend omits some
  const chartData = DISTRIBUTION_RANGES.map((range) => ({
    range,
    count: data.find((d) => d.range === range)?.count ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Distribución de notas</CardTitle>
        </CardHeading>
        <CardToolbar>
          {periodsLoading ? (
            <Skeleton className="h-8.5 w-40" />
          ) : periods.length === 0 ? (
            <span className="text-xs text-muted-foreground">Sin períodos</span>
          ) : (
            <select
              value={periodId}
              onChange={(e) => onPeriodChange(e.target.value)}
              className={`${SELECT_CLS} min-w-[10rem]`}
            >
              <option value="" disabled>Período</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </CardToolbar>
      </CardHeader>
      <CardContent>
        {!periodId ? (
          <div className="flex flex-col items-center py-12 gap-2 text-center">
            <BarChart2 className="size-9 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Selecciona un período para ver la distribución.</p>
          </div>
        ) : isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : isError ? (
          <p className="text-sm text-destructive py-4">No se pudo cargar la distribución.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value: number) => [value, 'Estudiantes']}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={56} />
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
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [distributionPeriodId, setDistributionPeriodId] = useState('');

  const { data: periods = [], isLoading: periodsLoading } = useCoursePeriods(selectedCourseId);

  // Auto-select first course
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Reset period when course changes
  useEffect(() => {
    setDistributionPeriodId('');
  }, [selectedCourseId]);

  // Auto-select first period for distribution chart
  useEffect(() => {
    if (!distributionPeriodId && periods.length > 0) {
      setDistributionPeriodId(periods[0].id);
    }
  }, [periods, distributionPeriodId]);

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas y reportes de rendimiento por curso.
          </p>
        </div>

        {/* Course selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="course-select" className="text-sm font-medium shrink-0">
            Curso:
          </label>
          {coursesLoading ? (
            <Skeleton className="h-8.5 w-52" />
          ) : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cursos disponibles.</p>
          ) : (
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className={`${SELECT_CLS} min-w-[14rem]`}
            >
              <option value="" disabled>Selecciona un curso</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!selectedCourseId ? (
        <div className="flex flex-col items-center py-24 gap-3 text-center">
          <BarChart2 className="size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Selecciona un curso para ver sus analytics.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Summary */}
          <CourseSummarySection courseId={selectedCourseId} />

          {/* 2 & 3 — Progress + Activities side by side on large screens */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <StudentProgressSection courseId={selectedCourseId} />
            <ActivityRankingSection courseId={selectedCourseId} />
          </div>

          {/* 4 & 5 — Engagement + At-risk side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <EngagementSection courseId={selectedCourseId} />
            <AtRiskSection courseId={selectedCourseId} />
          </div>

          {/* 6. Distribution */}
          <GradeDistributionSection
            courseId={selectedCourseId}
            periodId={distributionPeriodId}
            periods={periods}
            periodsLoading={periodsLoading}
            onPeriodChange={setDistributionPeriodId}
          />
        </div>
      )}
    </div>
  );
}
