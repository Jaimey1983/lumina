'use client';

import { useMemo, useState } from 'react';
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
  useAutonomousTextResponses,
  useSessionDetail,
  useSessionsComparison,
} from '@/hooks/api/use-analytics-sessions';
import type {
  SessionComparisonRow,
  SessionDetailData,
  TextResponseRow,
} from '@/hooks/api/use-analytics-sessions';

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
import { PageBanner } from '@/components/ui/page-banner';

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

function formatDurationSeconds(totalSec: number | null | undefined): string {
  if (totalSec === null || totalSec === undefined || !Number.isFinite(totalSec)) return '—';
  const s = Math.max(0, Math.floor(totalSec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r > 0 ? `${m} min ${r}s` : `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h} h ${rm} min` : `${h} h`;
}

function formatShortDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}m ${r}s`;
}

function downloadStudentProgressCSV(data: StudentProgressRow[], courseName: string) {
  const headers = [
    'Estudiante',
    'Actividades completadas',
    'Total actividades',
    'Promedio',
    'Desempeño',
    'Última clase',
  ];
  const rows = data.map((r) => [
    `"${String(r.studentName ?? '').replace(/"/g, '""')}"`,
    String(r.activitiesCompleted),
    String(r.totalActivities),
    r.avgGrade !== null && r.avgGrade !== undefined ? r.avgGrade.toFixed(1) : '—',
    r.performance ?? '—',
    `"${String(r.lastClass ?? '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safe = courseName.replace(/[^\w\-]+/g, '_').slice(0, 40);
  a.download = `reporte_${safe}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatActivityDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function ResponsePreview({ response }: { response: unknown }) {
  if (response === null || response === undefined) {
    return <span className="text-[#9ca3af]">—</span>;
  }
  if (typeof response === 'string') {
    return <span className="text-[#111827]">{response}</span>;
  }
  if (Array.isArray(response)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {response.map((x, i) => (
          <span
            key={i}
            className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-xs text-[#2563EB]"
          >
            {typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof response === 'object') {
    return (
      <pre className="max-h-40 overflow-auto text-xs whitespace-pre-wrap break-all text-[#374151]">
        {JSON.stringify(response, null, 2)}
      </pre>
    );
  }
  return <span>{String(response)}</span>;
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

// ─── Telemetría en vivo (resumen) ────────────────────────────────────────────

function TelemetryIntroSection({
  sessionCount,
  loading,
}: {
  sessionCount: number;
  loading: boolean;
}) {
  return (
    <Card className={ANALYTICS_CARD}>
      <CardHeader className={ANALYTICS_CARD_HEADER}>
        <CardHeading>
          <CardTitle className={ANALYTICS_SECTION_TITLE}>Engagement en vivo</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MessageCircle className="size-5 shrink-0 text-[#2563EB] mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-[#111827]">
                  <span className="font-semibold">{sessionCount}</span>{' '}
                  {sessionCount === 1
                    ? 'sesión con telemetría registrada'
                    : 'sesiones con telemetría registradas'}{' '}
                  en este curso.
                </p>
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  Conexiones de estudiantes vía sala <code className="text-[#374151]">/live</code> cuando hay una{' '}
                  <span className="font-medium">sesión HTTP activa</span> de la clase. El detalle por sesión está en la
                  tabla inferior.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionsComparisonSection({
  rows,
  loading,
  selectedSessionId,
  onSelectSession,
}: {
  rows: SessionComparisonRow[];
  loading: boolean;
  selectedSessionId: string | null;
  onSelectSession: (id: string | null) => void;
}) {
  return (
    <Card className={ANALYTICS_CARD}>
      <CardHeader className={ANALYTICS_CARD_HEADER}>
        <CardHeading>
          <CardTitle className={ANALYTICS_SECTION_TITLE}>Comparativa de sesiones en vivo</CardTitle>
        </CardHeading>
      </CardHeader>
      {loading ? (
        <SectionSkeleton rows={5} />
      ) : rows.length === 0 ? (
        <CardContent>
          <p className="text-sm text-[#6b7280] text-center py-10">
            Las sesiones con datos de telemetría aparecerán aquí.
          </p>
        </CardContent>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={ANALYTICS_TABLE_HEAD_ROW}>
                <th className={cn(ANALYTICS_TABLE_HEAD_CELL, 'text-left')}>Clase</th>
                <th className={cn(ANALYTICS_TABLE_HEAD_CELL, 'text-left')}>Fecha inicio</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Duración</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Participantes</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Promedio</th>
                <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Conexiones pico</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const active = row.sessionId === selectedSessionId;
                return (
                  <tr
                    key={row.sessionId}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      onSelectSession(active ? null : row.sessionId)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectSession(active ? null : row.sessionId);
                      }
                    }}
                    className={cn(
                      ANALYTICS_TABLE_BODY_ROW,
                      'cursor-pointer',
                      active && 'bg-[#eff6ff] border-l-2 border-l-[#2563EB]',
                    )}
                  >
                    <td className="px-5 py-3 font-medium text-[#111827]">{row.classTitle}</td>
                    <td className="px-5 py-3 text-[#6b7280]">
                      {formatActivityDate(row.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">
                      {formatDurationSeconds(row.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-center text-[#111827]">{row.participantCount}</td>
                    <td className="px-4 py-3 text-center font-semibold text-[#111827]">
                      {fmt(row.avgScore)}
                    </td>
                    <td className="px-4 py-3 text-center text-[#6b7280]">{row.peakConnections}</td>
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

function SessionDetailSection({
  sessionId,
  data,
  loading,
  onClose,
}: {
  sessionId: string;
  data: SessionDetailData | undefined;
  loading: boolean;
  onClose: () => void;
}) {
  const funnelChartData = useMemo(
    () =>
      (data?.funnelData ?? []).map((f) => ({
        ...f,
        label: `Slide ${f.slideIndex}`,
      })),
    [data?.funnelData],
  );

  return (
    <Card className={ANALYTICS_CARD}>
      <CardHeader className={cn(ANALYTICS_CARD_HEADER, 'flex-row flex-wrap items-center justify-between gap-3')}>
        <CardHeading>
          <CardTitle className={ANALYTICS_SECTION_TITLE}>Detalle de sesión</CardTitle>
          <p className="text-xs font-normal text-[#6b7280] mt-1 font-mono">{sessionId}</p>
        </CardHeading>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8]"
        >
          ✕ Cerrar detalle
        </button>
      </CardHeader>
      {loading ? (
        <SectionSkeleton rows={6} />
      ) : !data ? (
        <CardContent>
          <p className="text-sm text-[#6b7280]">No se pudo cargar el detalle.</p>
        </CardContent>
      ) : (
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <p className="text-xs text-[#6b7280]">Inicio</p>
              <p className="font-medium text-[#111827]">{formatActivityDate(data.sessionLog.startedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">Fin</p>
              <p className="font-medium text-[#111827]">
                {data.sessionLog.endedAt ? formatActivityDate(data.sessionLog.endedAt) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">Duración</p>
              <p className="font-medium text-[#111827]">
                {formatDurationSeconds(data.sessionLog.durationSeconds)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">Pico conexiones</p>
              <p className="font-medium text-[#111827]">{data.sessionLog.peakConnections}</p>
            </div>
            <div>
              <p className="text-xs text-[#6b7280]">Slides totales</p>
              <p className="font-medium text-[#111827]">{data.sessionLog.totalSlides}</p>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#e5e7eb] overflow-hidden">
            <div className="px-4 py-3 bg-[#f9fafb] border-b border-[#e5e7eb]">
              <p className={ANALYTICS_SECTION_TITLE}>Mapa de calor por slide</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={ANALYTICS_TABLE_HEAD_ROW}>
                    <th className={cn(ANALYTICS_TABLE_HEAD_CELL, 'text-left')}>#</th>
                    <th className={cn(ANALYTICS_TABLE_HEAD_CELL, 'text-left')}>Actividad</th>
                    <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Tiempo prom. (s)</th>
                    <th className={cn(ANALYTICS_TABLE_HEAD_CELL, 'text-left min-w-[160px]')}>
                      Tasa respuesta
                    </th>
                    <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Estudiantes</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.slideHeatmap]
                    .sort((a, b) => a.slideIndex - b.slideIndex)
                    .map((row) => (
                      <tr key={`${row.slideIndex}-${row.slideId}`} className={ANALYTICS_TABLE_BODY_ROW}>
                        <td className="px-5 py-3 text-[#6b7280]">{row.slideIndex}</td>
                        <td className="px-5 py-3 text-[#111827]">
                          {row.activityType ? labelForActivityType(row.activityType) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-[#111827]">{row.avgTimeOnSlide}</td>
                        <td className="px-5 py-3">
                          <div className="h-2 rounded-full bg-[#dbeafe] overflow-hidden">
                            <div
                              className="h-full bg-[#2563EB] rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, row.responseRate))}%` }}
                            />
                          </div>
                          <p className="text-xs text-[#6b7280] mt-1">{row.responseRate}%</p>
                        </td>
                        <td className="px-4 py-3 text-center text-[#111827]">{row.totalStudents}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#e5e7eb] p-4">
            <p className={cn(ANALYTICS_SECTION_TITLE, 'mb-3')}>Embudo de participación</p>
            <ResponsiveContainer width="100%" height={Math.max(220, funnelChartData.length * 36)}>
              <BarChart
                layout="vertical"
                data={funnelChartData}
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal stroke="#e5e7eb" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={88}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip
                  formatter={(value: number) => [value, 'Estudiantes alcanzados']}
                  labelFormatter={(l) => String(l)}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                  }}
                />
                <Bar dataKey="studentsReached" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-[10px] border border-[#e5e7eb] overflow-hidden">
            <div className="px-4 py-3 bg-[#f9fafb] border-b border-[#e5e7eb]">
              <p className={ANALYTICS_SECTION_TITLE}>Engagement por estudiante</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={ANALYTICS_TABLE_HEAD_ROW}>
                    <th className={cn(ANALYTICS_TABLE_HEAD_CELL, 'text-left')}>Estudiante</th>
                    <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Slides vistas</th>
                    <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Respondidas</th>
                    <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Tiempo total</th>
                    <th className={ANALYTICS_TABLE_HEAD_CELL_CENTER}>Completitud</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentEngagement.map((s) => {
                    const denom = Math.max(1, data.sessionLog.totalSlides);
                    const pct = Math.round((s.slidesAnswered / denom) * 100);
                    let variant: 'success' | 'warning' | 'destructive' = 'destructive';
                    if (pct >= 80) variant = 'success';
                    else if (pct >= 50) variant = 'warning';
                    return (
                      <tr key={s.studentId} className={ANALYTICS_TABLE_BODY_ROW}>
                        <td className="px-5 py-3 font-medium text-[#111827]">{s.studentName}</td>
                        <td className="px-4 py-3 text-center text-[#6b7280]">{s.slidesViewed}</td>
                        <td className="px-4 py-3 text-center text-[#111827]">{s.slidesAnswered}</td>
                        <td className="px-4 py-3 text-center text-[#6b7280]">
                          {formatShortDuration(s.totalTimeSeconds)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={variant} appearance="light">
                            {pct}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

const TEXT_ACTIVITY_BADGE: Record<
  string,
  { label: string; variant: 'primary' | 'warning' | 'success' }
> = {
  short_answer: { label: 'Respuesta corta', variant: 'primary' },
  nube_palabras: { label: 'Nube de palabras', variant: 'warning' },
  encuesta_viva: { label: 'Encuesta', variant: 'success' },
};

function TextResponsesSection({ rows }: { rows: TextResponseRow[] }) {
  const [openType, setOpenType] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const m = new Map<string, TextResponseRow[]>();
    for (const r of rows) {
      const k = r.activityType || 'otro';
      const arr = m.get(k) ?? [];
      arr.push(r);
      m.set(k, arr);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  return (
    <Card className={ANALYTICS_CARD}>
      <CardHeader className={ANALYTICS_CARD_HEADER}>
        <CardHeading>
          <CardTitle className={ANALYTICS_SECTION_TITLE}>Respuestas de texto — Modo autónomo</CardTitle>
        </CardHeading>
      </CardHeader>
      <CardContent className="space-y-3">
        {grouped.map(([activityType, list]) => {
          const cfg = TEXT_ACTIVITY_BADGE[activityType] ?? {
            label: labelForActivityType(activityType),
            variant: 'primary' as const,
          };
          const open = openType === activityType;
          return (
            <div key={activityType} className="rounded-[10px] border border-[#e5e7eb] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenType(open ? null : activityType)}
                className="flex w-full items-center justify-between px-4 py-3 bg-[#f9fafb] hover:bg-[#f3f4f6] text-left"
              >
                <span className="flex items-center gap-2">
                  <Badge variant={cfg.variant} appearance="light">
                    {cfg.label}
                  </Badge>
                  <span className="text-sm text-[#6b7280]">{list.length} respuestas</span>
                </span>
                <span className="text-[#2563EB] text-sm">{open ? 'Ocultar' : 'Ver'}</span>
              </button>
              {open ? (
                <div className="divide-y divide-[#e5e7eb]">
                  {list.map((r) => (
                    <div key={`${r.sessionId}-${r.studentId}-${r.slideId}-${r.answeredAt}`} className="px-4 py-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-[#111827]">{r.studentName}</p>
                        <span className="text-xs text-[#6b7280]">{formatActivityDate(r.answeredAt)}</span>
                      </div>
                      <p className="text-xs text-[#6b7280]">
                        {r.classTitle} · slide {r.slideId.slice(0, 8)}…
                      </p>
                      <div className="text-sm">
                        <ResponsePreview response={r.response} />
                      </div>
                      {r.score !== null && r.score !== undefined ? (
                        <p className="text-xs text-[#6b7280]">
                          Nota: <span className="font-semibold text-[#111827]">{fmt(r.score)}</span>
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const selectedCourseId = coursePick ?? courses[0]?.id ?? '';

  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } =
    useCourseAnalytics(selectedCourseId);

  const { data: sessionsComparison = [], isLoading: sessionsLoading } =
    useSessionsComparison(selectedCourseId);
  const { data: sessionDetail, isLoading: sessionDetailLoading } = useSessionDetail(
    selectedCourseId,
    selectedSessionId,
  );
  const { data: textResponses = [] } = useAutonomousTextResponses(selectedCourseId);

  const summary = analytics?.summary ?? null;
  const studentProgress = analytics?.studentProgress ?? [];
  const activityRanking = analytics?.activityRanking ?? [];
  const atRisk = analytics?.atRisk ?? [];
  const distribution = analytics?.distribution ?? null;

  const activeCourseName = courses.find((c) => c.id === selectedCourseId)?.name;
  const bannerSubtitle =
    activeCourseName ??
    (coursesLoading ? 'Cargando…' : courses.length === 0 ? 'Sin cursos disponibles' : 'Selecciona un curso');

  return (
    <div className="w-full flex flex-col gap-0 pb-6">
      <PageBanner title="Analytics" subtitle={bannerSubtitle} />

      <div className="px-6 pt-4 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Course selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="course-select" className="text-sm font-medium shrink-0 text-[#111827]">
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
                onChange={(e) => {
                  setCoursePick(e.target.value);
                  setSelectedSessionId(null);
                }}
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
            disabled={analyticsLoading || studentProgress.length === 0}
            onClick={() =>
              downloadStudentProgressCSV(
                studentProgress,
                activeCourseName ?? 'curso',
              )
            }
            className="inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50 disabled:pointer-events-none"
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

          {selectedSessionId ? (
            <SessionDetailSection
              sessionId={selectedSessionId}
              data={sessionDetail}
              loading={sessionDetailLoading}
              onClose={() => setSelectedSessionId(null)}
            />
          ) : null}

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
            <TelemetryIntroSection
              sessionCount={sessionsComparison.length}
              loading={sessionsLoading}
            />
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

          <SessionsComparisonSection
            rows={sessionsComparison}
            loading={sessionsLoading}
            selectedSessionId={selectedSessionId}
            onSelectSession={setSelectedSessionId}
          />

          {textResponses.length > 0 ? <TextResponsesSection rows={textResponses} /> : null}
        </div>
      )}
      </div>
    </div>
  );
}
