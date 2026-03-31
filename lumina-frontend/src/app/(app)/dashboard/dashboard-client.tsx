'use client';

import { useMemo } from 'react';
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
  LayoutGrid,
  MessageSquare,
  TrendingUp,
  Users,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useCourses, type Course } from '@/hooks/api/use-courses';
import { useClassesByCourses } from '@/hooks/api/use-classes';
import { useAnalytics } from '@/hooks/api/use-analytics';
import { useUsers } from '@/hooks/api/use-users';
import { useMyGrades } from '@/hooks/api/use-grades';
import { useMyBadges } from '@/hooks/api/use-badges';
import { type AuthUser } from '@/contexts/auth-context';

import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

function isPublished(status: string) {
  return status?.toLowerCase() === 'published';
}

// ─── Shared Components ────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
          <Icon className="size-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-16 mt-1" />
          ) : (
            <p className="text-2xl font-semibold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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

function TeacherDashboard({ user }: { user: AuthUser }) {
  const coursesQuery = useCourses();
  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);

  const classesQuery = useClassesByCourses(courses.map((c) => c.id));
  const analyticsQuery = useAnalytics();

  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const messages = analyticsQuery.data?.recentMessages ?? [];

  const activeCourses = useMemo(
    () => courses.filter((c) => c.isActive).length,
    [courses],
  );

  const publishedClassesCount = useMemo(
    () => classes.filter((c) => isPublished(c.status)).length,
    [classes],
  );

  const recentClasses = useMemo(
    () =>
      [...classes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [classes],
  );

  const avgGrade =
    analyticsQuery.data?.avgGrade != null
      ? analyticsQuery.data.avgGrade.toFixed(1)
      : '—';

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenido, {user.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aquí está el resumen de tu actividad docente.
        </p>
      </div>

      {coursesQuery.isError && <ErrorAlert message="No se pudieron cargar los cursos." />}
      {classesQuery.isError && <ErrorAlert message="No se pudieron cargar las clases." />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cursos activos"
          value={activeCourses}
          icon={BookOpen}
          loading={coursesQuery.isLoading}
        />
        <StatCard
          title="Cursos totales"
          value={courses.length}
          icon={Users}
          loading={coursesQuery.isLoading}
        />
        <StatCard
          title="Clases publicadas"
          value={publishedClassesCount}
          icon={LayoutGrid}
          loading={coursesQuery.isLoading || classesQuery.isLoading}
        />
        <StatCard
          title="Promedio general"
          value={analyticsQuery.isLoading ? '—' : avgGrade}
          icon={TrendingUp}
          loading={analyticsQuery.isLoading}
        />
      </div>

      {/* Courses table */}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Mis cursos</CardTitle>
          </CardHeading>
        </CardHeader>
        <CardTable>
          {coursesQuery.isLoading ? <TableSkeletons /> : <CoursesTable courses={courses} />}
        </CardTable>
      </Card>

      {/* Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent classes */}
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Clases recientes</CardTitle>
            </CardHeading>
          </CardHeader>
          <CardContent className="p-0">
            {classesQuery.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5 text-center">
                No hay clases recientes.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentClasses.map((cls) => (
                  <li key={cls.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <LayoutGrid className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cls.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(cls.createdAt)}</p>
                    </div>
                    <Badge
                      variant={isPublished(cls.status) ? 'success' : 'secondary'}
                      appearance="light"
                      size="sm"
                    >
                      {isPublished(cls.status) ? 'Publicada' : 'Borrador'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent messages */}
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Mensajes recientes</CardTitle>
            </CardHeading>
          </CardHeader>
          <CardContent className="p-0">
            {analyticsQuery.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5 text-center">
                No hay mensajes recientes.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {messages.slice(0, 5).map((msg) => (
                  <li key={msg.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <MessageSquare className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        De: {msg.from} · {formatDate(msg.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
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
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel de Administración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hola, {user.name}. Visión general de la plataforma Lumina.
        </p>
      </div>

      {coursesQuery.isError && <ErrorAlert message="No se pudieron cargar los cursos." />}
      {usersQuery.isError && <ErrorAlert message="No se pudieron cargar los usuarios." />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total usuarios"
          value={users.length}
          icon={Users}
          loading={usersQuery.isLoading}
        />
        <StatCard
          title="Total cursos"
          value={courses.length}
          icon={BookOpen}
          loading={coursesQuery.isLoading}
        />
        <StatCard
          title="Cursos activos"
          value={activeCourses}
          icon={LayoutGrid}
          loading={coursesQuery.isLoading}
        />
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/users">
            <Users className="size-4" />
            Gestionar usuarios
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/courses">
            <BookOpen className="size-4" />
            Gestionar cursos
          </Link>
        </Button>
      </div>

      {/* All courses */}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Todos los cursos</CardTitle>
          </CardHeading>
        </CardHeader>
        <CardTable>
          {coursesQuery.isLoading ? <TableSkeletons rows={5} /> : <CoursesTable courses={courses} />}
        </CardTable>
      </Card>
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
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Bienvenido de vuelta, {user.name}.</p>
      </div>

      {coursesQuery.isError && <ErrorAlert message="No se pudieron cargar tus cursos." />}
      {gradesQuery.isError && <ErrorAlert message="No se pudieron cargar tus notas." />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Cursos matriculados"
          value={courses.length}
          icon={BookOpen}
          loading={coursesQuery.isLoading}
        />
        <StatCard
          title="Notas registradas"
          value={grades.length}
          icon={TrendingUp}
          loading={gradesQuery.isLoading}
        />
        <StatCard
          title="Puntos acumulados"
          value={badgesData?.totalPoints ?? 0}
          icon={Award}
          loading={badgesQuery.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Enrolled courses */}
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Mis cursos</CardTitle>
            </CardHeading>
            <CardToolbar>
              <Button size="sm" variant="outline" asChild>
                <Link href="/courses">Ver todos</Link>
              </Button>
            </CardToolbar>
          </CardHeader>
          <CardContent className="p-0">
            {coursesQuery.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5 text-center">
                No estás matriculado en ningún curso.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {courses.slice(0, 5).map((course) => (
                  <li key={course.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{course.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{course.code}</p>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/courses/${course.id}`}>Ver</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent grades */}
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Mis notas recientes</CardTitle>
            </CardHeading>
            <CardToolbar>
              <Button size="sm" variant="outline" asChild>
                <Link href="/gradebook">Ver todas</Link>
              </Button>
            </CardToolbar>
          </CardHeader>
          <CardContent className="p-0">
            {gradesQuery.isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5 text-center">
                No tienes notas registradas.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentGrades.map((grade) => {
                  const pct = grade.maxScore > 0
                    ? Math.round((grade.score / grade.maxScore) * 100)
                    : 0;
                  return (
                    <li key={grade.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{grade.courseName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(grade.createdAt)}</p>
                      </div>
                      <Badge
                        variant={pct >= 70 ? 'success' : pct >= 50 ? 'warning' : 'destructive'}
                        appearance="light"
                      >
                        {grade.score}/{grade.maxScore}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Mis logros</CardTitle>
          </CardHeading>
          {badgesData && (
            <CardToolbar>
              <Badge variant="warning" appearance="light">
                <Award className="size-3" />
                {badgesData.totalPoints} puntos
              </Badge>
            </CardToolbar>
          )}
        </CardHeader>
        <CardContent>
          {badgesQuery.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !badgesData?.badges?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aún no tienes logros. ¡Sigue avanzando!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badgesData.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-muted/30 text-center"
                >
                  <div className="size-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Award className="size-5 text-yellow-500" />
                  </div>
                  <p className="text-xs font-medium leading-tight">{badge.name}</p>
                  <Badge variant="secondary" size="sm">
                    {badge.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function DashboardClient() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
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
