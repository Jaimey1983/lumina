'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  Award,
  BookOpen,
  Plus,
  Users,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useCourses, type Course } from '@/hooks/api/use-courses';
import { useClassesByCourses, type Class } from '@/hooks/api/use-classes';
import { useAnalytics } from '@/hooks/api/use-analytics';
import { useUsers } from '@/hooks/api/use-users';
import { useMyGrades } from '@/hooks/api/use-grades';
import { useMyBadges } from '@/hooks/api/use-badges';
import { type AuthUser } from '@/contexts/auth-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBanner } from '@/components/ui/page-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatTodayEs() {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function monthBounds(ref = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  const prevStart = new Date(y, m - 1, 1);
  const prevEnd = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end, prevStart, prevEnd };
}

function countClassesCreatedBetween(classes: Class[], from: Date, to: Date) {
  const a = from.getTime();
  const b = to.getTime();
  return classes.filter((c) => {
    const t = new Date(c.createdAt).getTime();
    return t >= a && t <= b;
  }).length;
}

function DeltaLabel({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff === 0) {
    return (
      <p className="mt-1 text-lumina-sm font-semibold text-[#9ca3af]">Sin cambio vs. mes anterior</p>
    );
  }
  const up = diff > 0;
  return (
    <p
      className="mt-1 text-lumina-sm font-semibold"
      style={{ color: up ? '#34d399' : '#f87171' }}
    >
      {up ? '+' : ''}
      {diff} vs. mes anterior
    </p>
  );
}

function StatCardLumina({
  label,
  valueNode,
  delta,
}: {
  label: string;
  valueNode: ReactNode;
  delta?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-lumina-xs">
      <div className="text-2xl font-extrabold">
        <span className="bg-gradient-to-r from-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
          {valueNode}
        </span>
      </div>
      <p className="mt-0.5 text-lumina-sm font-medium text-[#6b7280]">{label}</p>
      {delta != null ? delta : null}
    </div>
  );
}

const THUMB_GRADIENTS = [
  'from-[#60a5fa] to-[#2563EB]',
  'from-[#60a5fa] to-[#60A5FA]',
  'from-[#60A5FA] to-[#9ca3af]',
  'from-[#9ca3af] to-[#9ca3af]',
] as const;

function notaBadge(score: number, maxScore: number) {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const [bg, color] =
    pct >= 0.8
      ? (['#dcfce7', '#16a34a'] as const)
      : pct >= 0.6
        ? (['#dbeafe', '#2563EB'] as const)
        : (['#fee2e2', '#f87171'] as const);
  return (
    <span
      className="rounded-md px-2 py-0.5 text-lumina-sm font-semibold"
      style={{ background: bg, color }}
    >
      {score}/{maxScore}
    </span>
  );
}

function classStatusBadge(cls: Class) {
  const s = cls.status?.toUpperCase() ?? '';
  if (s === 'LIVE') {
    return (
      <span className="rounded-md bg-[#dbeafe] px-2 py-0.5 text-lumina-sm font-semibold text-[#2563EB]">
        En vivo
      </span>
    );
  }
  if (s === 'PUBLISHED') {
    return (
      <span className="rounded-md bg-[#dbeafe] px-2 py-0.5 text-lumina-sm font-semibold text-[#3b82f6]">
        Publicada
      </span>
    );
  }
  if (s.includes('AUTONOM')) {
    return (
      <span className="rounded-md bg-[#fef3c7] px-2 py-0.5 text-lumina-sm font-semibold text-[#d97706]">
        Autónomo
      </span>
    );
  }
  if (s === 'DRAFT') {
    return (
      <span className="rounded-md bg-[#f3f4f6] px-2 py-0.5 text-lumina-sm font-semibold text-[#9ca3af]">
        Borrador
      </span>
    );
  }
  if (s === 'ARCHIVED') {
    return (
      <span className="rounded-md bg-[#f3f4f6] px-2 py-0.5 text-lumina-sm font-semibold text-[#9ca3af]">
        Archivada
      </span>
    );
  }
  return (
    <span className="rounded-md bg-[#f3f4f6] px-2 py-0.5 text-lumina-sm font-semibold text-[#9ca3af]">
      Borrador
    </span>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive" appearance="light">
      <AlertIcon>
        <AlertCircle />
      </AlertIcon>
      <AlertContent>
        <AlertTitle>{message}</AlertTitle>
      </AlertContent>
    </Alert>
  );
}

function TableSkeletons({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

// ─── Courses Table (TanStack Table) ──────────────────────────────────────────

function CoursesTable({ courses }: { courses: Course[] }) {
  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Código',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Creado',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {new Date(row.original.createdAt).toLocaleDateString('es-ES')}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'success' : 'secondary'}
            appearance="light"
          >
            {row.original.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/courses/${row.original.id}`}>Ver curso</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: courses,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (courses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No hay cursos disponibles.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Teacher Dashboard ────────────────────────────────────────────────────────

const DESEMPENO_PLACEHOLDER = [
  { emoji: '📊', name: 'Participación', sub: 'Vista general', pct: 78, score: '7.8' },
  { emoji: '✍️', name: 'Actividades', sub: 'Entregas', pct: 64, score: '6.4' },
  { emoji: '🎯', name: 'Evaluación', sub: 'Resultados', pct: 82, score: '8.2' },
];

function TeacherDashboard({ user }: { user: AuthUser }) {
  const coursesQuery = useCourses();
  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);

  const classesQuery = useClassesByCourses(courses.map((c) => c.id));
  const analyticsQuery = useAnalytics();

  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);

  const bounds = useMemo(() => monthBounds(), []);
  const sessionsThisMonth = useMemo(
    () => countClassesCreatedBetween(classes, bounds.start, bounds.end),
    [classes, bounds.end, bounds.start],
  );
  const sessionsPrevMonth = useMemo(
    () => countClassesCreatedBetween(classes, bounds.prevStart, bounds.prevEnd),
    [classes, bounds.prevEnd, bounds.prevStart],
  );

  const recentClasses = useMemo(
    () =>
      [...classes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [classes],
  );

  const courseById = useMemo(() => {
    const m = new Map<string, Course>();
    for (const c of courses) m.set(c.id, c);
    return m;
  }, [courses]);

  const liveClass = useMemo(
    () => classes.find((c) => c.status?.toUpperCase() === 'LIVE'),
    [classes],
  );

  const avgGrade =
    analyticsQuery.data?.avgGrade != null
      ? analyticsQuery.data.avgGrade.toFixed(1)
      : '—';

  const nombre = user.name?.trim() || 'docente';
  const loadingLists = coursesQuery.isLoading || classesQuery.isLoading;

  return (
    <div className="w-full flex flex-col gap-0 pb-6">
      <PageBanner
        title={`${greetingForNow()}, ${nombre} 👋`}
        subtitle={`${formatTodayEs()} · ${classes.length} clases`}
        action={
          <Link
            href="/classes"
            className="bg-white text-[#2563EB] font-extrabold text-[0.75rem] px-4 py-1.5 rounded-lg"
          >
            ＋ Nueva clase
          </Link>
        }
      />
      <div className="px-6 pt-4 space-y-5">
        {coursesQuery.isError && <ErrorAlert message="No se pudieron cargar los cursos." />}
        {classesQuery.isError && <ErrorAlert message="No se pudieron cargar las clases." />}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loadingLists ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-lumina-xs"
            >
              <Skeleton className="mb-2 h-8 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))
        ) : (
          <>
            <StatCardLumina
              label="Clases creadas"
              valueNode={classes.length}
              delta={
                sessionsThisMonth > 0 ? (
                  <p className="mt-1 text-lumina-sm font-semibold" style={{ color: '#34d399' }}>
                    +{sessionsThisMonth} nueva{sessionsThisMonth === 1 ? '' : 's'} este mes
                  </p>
                ) : (
                  <p className="mt-1 text-lumina-sm font-semibold text-[#9ca3af]">Sin altas este mes</p>
                )
              }
            />
            <StatCardLumina label="Estudiantes activos" valueNode="—" />
            <StatCardLumina
              label="Promedio general"
              valueNode={analyticsQuery.isLoading ? '…' : avgGrade}
            />
            <StatCardLumina
              label="Sesiones este mes"
              valueNode={sessionsThisMonth}
              delta={
                <DeltaLabel current={sessionsThisMonth} previous={sessionsPrevMonth} />
              }
            />
          </>
        )}
        </div>

        {liveClass && (
        <div className="rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#60A5FA] p-5 text-white shadow-lumina-md">
          <p className="mb-1 flex items-center gap-1.5 text-lumina-sm font-bold opacity-80">
            <span className="size-2 animate-pulse rounded-full bg-white" />
            Clase en vivo ahora
          </p>
          <p className="mb-3 text-lg font-extrabold tracking-tight">{liveClass.title}</p>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/20 p-2.5">
              <p className="text-lumina-sm font-semibold opacity-80">Conectados</p>
              <p className="text-sm font-bold">—</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5">
              <p className="text-lumina-sm font-semibold opacity-80">Respondieron</p>
              <p className="text-sm font-bold">—</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5">
              <p className="text-lumina-sm font-semibold opacity-80">Slide actual</p>
              <p className="text-sm font-bold">—</p>
            </div>
          </div>
          <Link
            href={`/classes/${liveClass.id}/editor`}
            className="inline-block rounded-lg border border-white/40 bg-white/20 px-4 py-1.5 text-lumina-sm font-bold text-white"
          >
            Ver clase en vivo →
          </Link>
        </div>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_300px]">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-lumina-sm">
          <h2 className="mb-4 text-lumina-md font-bold text-[#1e1b4b]">Clases recientes</h2>
          {classesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : recentClasses.length === 0 ? (
            <p className="text-center text-lumina-sm text-[#9ca3af]">No hay clases recientes.</p>
          ) : (
            <ul className="space-y-3">
              {recentClasses.map((cls, index) => {
                const courseName = cls.courseId
                  ? courseById.get(cls.courseId)?.name ?? 'Curso'
                  : 'Curso';
                return (
                  <li key={cls.id}>
                    <Link
                      href={`/classes/${cls.id}`}
                      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#f9fafb]"
                    >
                      <div
                        className={`h-9 w-11 shrink-0 rounded-lg bg-gradient-to-br ${THUMB_GRADIENTS[index % THUMB_GRADIENTS.length]}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#1e1b4b]">{cls.title}</p>
                        <p className="text-lumina-sm text-[#9ca3af]">
                          {courseName} · {formatDate(cls.createdAt)}
                        </p>
                      </div>
                      {classStatusBadge(cls)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-lumina-sm">
          <h2 className="mb-4 text-lumina-md font-bold text-[#1e1b4b]">Desempeño por actividad</h2>
          <ul className="space-y-4">
            {DESEMPENO_PLACEHOLDER.map((row) => (
              <li key={row.name}>
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-base"
                    style={{ background: '#f9fafb' }}
                  >
                    {row.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1e1b4b]">{row.name}</p>
                        <p className="text-lumina-sm text-[#9ca3af]">{row.sub}</p>
                      </div>
                      <span className="shrink-0 text-sm font-extrabold text-[#2563EB]">
                        {row.score}
                      </span>
                    </div>
                    <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-[#f9fafb]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        </div>

        <div className="flex flex-wrap gap-3">
        <Link
          href="/courses"
          className="text-sm font-semibold text-[#2563EB] underline-offset-2 hover:underline"
        >
          Ver todos mis cursos →
        </Link>
        <Link
          href="/classes"
          className="text-sm font-semibold text-[#2563EB] underline-offset-2 hover:underline"
        >
          Gestionar clases →
        </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ user }: { user: AuthUser }) {
  const coursesQuery = useCourses();
  const usersQuery = useUsers();

  const courses = coursesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const activeCourses = courses.filter((c) => c.isActive).length;

  return (
    <div className="w-full space-y-6 p-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#111827]">Panel de Administración</h1>
        <p className="mt-1 text-lumina-sm font-medium text-[#6b7280]">
          Hola, {user.name}. Visión general de la plataforma Lumina.
        </p>
      </div>

      {coursesQuery.isError && <ErrorAlert message="No se pudieron cargar los cursos." />}
      {usersQuery.isError && <ErrorAlert message="No se pudieron cargar los usuarios." />}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCardLumina
          label="Total usuarios"
          valueNode={usersQuery.isLoading ? '…' : users.length}
        />
        <StatCardLumina
          label="Total cursos"
          valueNode={coursesQuery.isLoading ? '…' : courses.length}
        />
        <StatCardLumina
          label="Cursos activos"
          valueNode={coursesQuery.isLoading ? '…' : activeCourses}
        />
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2 text-lumina-sm font-semibold text-[#111827] shadow-lumina-xs hover:bg-[#f9fafb]"
        >
          <Users className="size-4 text-[#2563EB]" />
          Gestionar usuarios
        </Link>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2 text-lumina-sm font-semibold text-[#111827] shadow-lumina-xs hover:bg-[#f9fafb]"
        >
          <BookOpen className="size-4 text-[#2563EB]" />
          Gestionar cursos
        </Link>
      </div>

      {/* All courses */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-lumina-sm">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <h2 className="text-lumina-md font-bold text-[#111827]">Todos los cursos</h2>
        </div>
        <div className="overflow-x-auto">
          {coursesQuery.isLoading ? <TableSkeletons rows={5} /> : <CoursesTable courses={courses} />}
        </div>
      </div>
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────

function StudentDashboard({ user }: { user: AuthUser }) {
  const coursesQuery = useCourses();
  const gradesQuery = useMyGrades();
  const badgesQuery = useMyBadges();

  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);
  const grades = useMemo(() => gradesQuery.data ?? [], [gradesQuery.data]);
  const badgesData = badgesQuery.data;

  const recentGrades = useMemo(
    () =>
      [...grades]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [grades],
  );

  return (
    <div className="w-full space-y-6 p-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#111827]">Mi Panel</h1>
        <p className="mt-1 text-lumina-sm font-medium text-[#6b7280]">
          Bienvenido de vuelta, {user.name}.
        </p>
      </div>

      {coursesQuery.isError && <ErrorAlert message="No se pudieron cargar tus cursos." />}
      {gradesQuery.isError && <ErrorAlert message="No se pudieron cargar tus notas." />}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCardLumina
          label="Cursos matriculados"
          valueNode={coursesQuery.isLoading ? '…' : courses.length}
        />
        <StatCardLumina
          label="Notas registradas"
          valueNode={gradesQuery.isLoading ? '…' : grades.length}
        />
        <StatCardLumina
          label="Puntos acumulados"
          valueNode={badgesQuery.isLoading ? '…' : (badgesData?.totalPoints ?? 0)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Enrolled courses */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-lumina-sm">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
            <h2 className="text-lumina-md font-bold text-[#111827]">Mis cursos</h2>
            <Link
              href="/courses"
              className="text-lumina-sm font-semibold text-[#2563EB] underline-offset-2 hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="p-0">
            {coursesQuery.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <p className="p-5 text-center text-lumina-sm font-medium text-[#6b7280]">
                No estás matriculado en ningún curso.
              </p>
            ) : (
              <ul className="divide-y divide-[#e5e7eb]">
                {courses.slice(0, 5).map((course) => (
                  <li key={course.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#dbeafe]">
                      <BookOpen className="size-4 text-[#2563EB]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lumina-sm font-medium text-[#111827]">{course.name}</p>
                      <p className="font-mono text-[11px] text-[#9ca3af]">{course.code}</p>
                    </div>
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-lumina-sm font-semibold text-[#2563EB] underline-offset-2 hover:underline"
                    >
                      Ver →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent grades */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-lumina-sm">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
            <h2 className="text-lumina-md font-bold text-[#111827]">Mis notas recientes</h2>
            <Link
              href="/gradebook"
              className="text-lumina-sm font-semibold text-[#2563EB] underline-offset-2 hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <div className="p-0">
            {gradesQuery.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentGrades.length === 0 ? (
              <p className="p-5 text-center text-lumina-sm font-medium text-[#6b7280]">
                No tienes notas registradas.
              </p>
            ) : (
              <ul className="divide-y divide-[#e5e7eb]">
                {recentGrades.map((grade) => (
                  <li key={grade.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lumina-sm font-medium text-[#111827]">
                        {grade.courseName}
                      </p>
                      <p className="text-lumina-sm text-[#9ca3af]">{formatDate(grade.createdAt)}</p>
                    </div>
                    {notaBadge(grade.score, grade.maxScore)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-lumina-sm">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <h2 className="text-lumina-md font-bold text-[#111827]">Mis logros</h2>
          {badgesData ? (
            <span className="rounded-md bg-[#fef3c7] px-2 py-0.5 text-lumina-sm font-semibold text-[#d97706]">
              ⭐ {badgesData.totalPoints} puntos
            </span>
          ) : null}
        </div>
        <div className="p-5">
          {badgesQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !badgesData?.badges?.length ? (
            <p className="py-4 text-center text-lumina-sm font-medium text-[#6b7280]">
              Aún no tienes logros. ¡Sigue avanzando!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {badgesData.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4 text-center"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-yellow-500/10">
                    <Award className="size-5 text-yellow-500" />
                  </div>
                  <p className="text-lumina-sm font-medium leading-tight text-[#111827]">{badge.name}</p>
                  <span className="rounded px-1.5 py-0.5 text-[11px] font-semibold bg-[#f3f4f6] text-[#6b7280]">
                    {badge.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function DashboardClient() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role?.toUpperCase()) {
    case 'SUPERADMIN':
    case 'ADMIN':
      return <AdminDashboard user={user} />;
    case 'TEACHER':
      return <TeacherDashboard user={user} />;
    case 'STUDENT':
      return <StudentDashboard user={user} />;
    default:
      return <TeacherDashboard user={user} />;
  }
}
