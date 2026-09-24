'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  GraduationCap,
  LayoutGrid,
  ListTree,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/use-auth';
import { useCourse } from '@/hooks/api/use-course';
import { useCourseStudents, type Student } from '@/hooks/api/use-students';
import { useClasses, type Class } from '@/hooks/api/use-classes';
import { useCoursePeriods } from '@/hooks/api/use-periods';
import { useUsers } from '@/hooks/api/use-users';
import { useGradeCalculation } from '@/hooks/api/use-grade-calculation';
import {
  useDesempenosCurso,
  useCreateDesempenoCurso,
  useDeleteDesempenoCurso,
  useIndicadoresGuardados,
  type DesempenoCurso,
  type IndicadoresClase,
} from '@/hooks/api/use-desempenos';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/api-error-message';
import { GradebookStructureTab } from './gradebook-structure-tab';
import { NewClassCurricularModal } from './new-class-curricular-modal';
import { STATUS_LABELS } from '@/app/(app)/classes/class-status-badge-styles';
import {
  AREAS_LABELS,
  EBC_COMPONENTES,
  ICFES_COMPETENCIAS,
  type AreaCurricular,
} from '@lumina/curriculum-data';

import { Card, CardContent, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@lumina/ui/card';
import { Badge } from '@lumina/ui/badge';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Skeleton } from '@lumina/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@lumina/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumina/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lumina/ui/table';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@lumina/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@lumina/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@lumina/ui/select';
import { Separator } from '@lumina/ui/separator';

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ courseId }: { courseId: string }) {
  const { data: course, isLoading, isError } = useCourse(courseId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !course) {
    return (
      <Alert variant="destructive" appearance="light">
        <AlertIcon><AlertCircle /></AlertIcon>
        <AlertContent><AlertTitle>No se pudo cargar el curso.</AlertTitle></AlertContent>
      </Alert>
    );
  }

  const rows = [
    { label: 'Nombre', value: course.name },
    { label: 'Código', value: <span className="font-mono text-sm">{course.code}</span> },
    {
      label: 'Área',
      value: course.area ? (
        AREAS_LABELS[course.area as AreaCurricular]
      ) : (
        <span className="text-muted-foreground">Sin especificar</span>
      ),
    },
    {
      label: 'Grado',
      value: course.grado ? (
        `Grado ${course.grado}`
      ) : (
        <span className="text-muted-foreground">Sin especificar</span>
      ),
    },
    {
      label: 'Estado',
      value: (
        <Badge variant={course.isActive ? 'success' : 'secondary'} appearance="light">
          {course.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      label: 'Fecha de creación',
      value: new Date(course.createdAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    },
    { label: 'Docente', value: course.teacher?.name ?? course.teacherId },
    ...(course.description ? [{ label: 'Descripción', value: course.description }] : []),
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <dl>
          {rows.map((row, i) => (
            <div key={i}>
              {i > 0 && <Separator />}
              <div className="flex items-start gap-4 px-5 py-4">
                <dt className="w-40 shrink-0 text-sm text-muted-foreground">{row.label}</dt>
                <dd className="text-sm flex-1">{row.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

// ─── Desempeños del curso (Etapa J / J6.2, Entrada 1) ──────────────────────────

const desempenoSchema = z.object({
  componenteEbc: z.string().min(1, 'Selecciona un componente'),
  competenciaIcfes: z.string().min(1, 'Selecciona una competencia'),
});
type DesempenoFormData = z.infer<typeof desempenoSchema>;

function NewDesempenoModal({
  courseId,
  area,
  onClose,
}: {
  courseId: string;
  area: AreaCurricular;
  onClose: () => void;
}) {
  const createMutation = useCreateDesempenoCurso(courseId);
  const form = useForm<DesempenoFormData>({
    resolver: zodResolver(desempenoSchema),
    defaultValues: { componenteEbc: '', competenciaIcfes: '' },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Desempeño generado');
        onClose();
      },
      onError: (err) => {
        toast.error(apiErrorMessage(err, 'No se pudo generar el desempeño'));
      },
    });
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo desempeño</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <DialogBody className="space-y-4">
              <FormField
                control={form.control}
                name="componenteEbc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Componente EBC</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un componente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EBC_COMPONENTES[area].map((c) => (
                          <SelectItem key={c.codigo} value={c.codigo}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="competenciaIcfes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competencia ICFES</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una competencia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ICFES_COMPETENCIAS[area].map((c) => (
                          <SelectItem key={c.codigo} value={c.codigo}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                <Sparkles />
                {createMutation.isPending ? 'Generando…' : 'Generar con IA'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Indicadores guardados por desempeño (Etapa J / J6, banco reutilizable) — se
// generan y persisten desde "Nueva clase"; acá solo se ven y se exponen como
// disponibles para reutilizar en otra clase del mismo curso (punto 4).
const TIPOS_INDICADOR_LABELS: Array<{ key: keyof IndicadoresClase; label: string }> = [
  { key: 'cognitivo', label: 'Cognitivo' },
  { key: 'procedimental', label: 'Procedimental' },
  { key: 'actitudinal', label: 'Actitudinal' },
];

function DesempenoCard({
  desempeno: d,
  area,
  courseId,
  onDelete,
  deleting,
}: {
  desempeno: DesempenoCurso;
  area: AreaCurricular;
  courseId: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: indicadoresGuardados = [], isLoading: indicadoresLoading } =
    useIndicadoresGuardados(courseId, expanded ? d.id : null);

  const componenteLabel =
    EBC_COMPONENTES[area].find((c) => c.codigo === d.componenteEbc)?.label ??
    d.componenteEbc;
  const competenciaLabel =
    ICFES_COMPETENCIAS[area].find((c) => c.codigo === d.competenciaIcfes)?.label ??
    d.competenciaIcfes;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge appearance="light">
                <Target className="size-3" />
                {componenteLabel}
              </Badge>
              <Badge appearance="light" variant="info">
                {competenciaLabel}
              </Badge>
            </div>
            <p className="text-sm">{d.enunciado}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? 'Ocultar indicadores guardados' : 'Ver indicadores guardados'}
            >
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} disabled={deleting}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-3 border-t border-border pt-3">
            {indicadoresLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : indicadoresGuardados.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Todavía no hay indicadores guardados para este desempeño — se
                guardan automáticamente al generarlos con IA desde
                &quot;Nueva clase&quot;.
              </p>
            ) : (
              <div className="space-y-2.5">
                {TIPOS_INDICADOR_LABELS.map(({ key, label }) => {
                  const items = indicadoresGuardados.filter((i) => i.tipo === key);
                  if (items.length === 0) return null;
                  return (
                    <div key={key} className="space-y-1">
                      <p className="text-xs font-medium leading-none">
                        {label}{' '}
                        <span className="font-normal text-muted-foreground">
                          ({items.length})
                        </span>
                      </p>
                      <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                        {items.map((i) => (
                          <li key={i.id}>{i.enunciado}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] leading-snug text-muted-foreground">
              Se ofrecen automáticamente para reutilizar al elegir este
              desempeño en &quot;Nueva clase&quot; — no hace falta volver a
              generarlos con IA.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DesempenosTab({ courseId }: { courseId: string }) {
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const {
    data: desempenos = [],
    isLoading: listLoading,
    isError,
  } = useDesempenosCurso(courseId);
  const deleteMutation = useDeleteDesempenoCurso(courseId);
  const [modalOpen, setModalOpen] = useState(false);

  if (courseLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const area = course?.area as AreaCurricular | undefined;
  if (!course || !area || !course.grado) {
    return (
      <Alert appearance="light">
        <AlertIcon>
          <AlertCircle />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>
            Este curso no tiene área/grado configurados — edítalo desde{' '}
            <Link href="/courses" className="underline">
              la lista de cursos
            </Link>{' '}
            para poder generar desempeños.
          </AlertTitle>
        </AlertContent>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {AREAS_LABELS[area]} · Grado {course.grado}
        </p>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus />
          Nuevo desempeño
        </Button>
      </div>

      {listLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>No se pudieron cargar los desempeños.</AlertTitle>
          </AlertContent>
        </Alert>
      ) : desempenos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Todavía no hay desempeños generados para este curso.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {desempenos.map((d) => (
            <DesempenoCard
              key={d.id}
              desempeno={d}
              area={area}
              courseId={courseId}
              onDelete={() => deleteMutation.mutate(d.id)}
              deleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <NewDesempenoModal
          courseId={courseId}
          area={area}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Enroll Modal ─────────────────────────────────────────────────────────────

function EnrollModal({
  courseId,
  open,
  onOpenChange,
}: {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const { data: users = [], isLoading } = useUsers();
  const { data: enrolled = [] } = useCourseStudents(courseId);
  const enrolledIds = new Set(enrolled.map((s) => s.user.id));

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          !enrolledIds.has(u.id) &&
          (u.role === 'STUDENT' || !u.role) &&
          (u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())),
      )
    : users.filter((u) => !enrolledIds.has(u.id) && (u.role === 'STUDENT' || !u.role));

  const mutation = useMutation({
    mutationFn: async (payload: { userId?: string; email?: string }) => {
      return api.post(`/courses/${courseId}/enroll`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'students'] });
      toast.success('Estudiante matriculado');
      setEmail('');
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, 'Error al matricular el estudiante'));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Matricular estudiante</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = email.trim().toLowerCase();
              if (!value) return;
              mutation.mutate({ email: value });
            }}
          >
            <Input
              type="email"
              placeholder="Correo del estudiante"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mutation.isPending}
            />
            <Button type="submit" disabled={mutation.isPending || !email.trim()}>
              Matricular
            </Button>
          </form>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {users.length === 0
                  ? 'Escribe el correo del estudiante para matricularlo.'
                  : 'No se encontraron usuarios disponibles.'}
              </p>
            ) : (
              filtered.slice(0, 20).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => mutation.mutate({ userId: user.id })}
                    disabled={mutation.isPending}
                  >
                    Matricular
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Students Tab ─────────────────────────────────────────────────────────────

function StudentsTab({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const [enrollOpen, setEnrollOpen] = useState(false);
  const { data: students = [], isLoading, isError } = useCourseStudents(courseId);

  const columns: ColumnDef<Student>[] = [
    {
      id: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.user.name} {row.original.user.lastName}
        </span>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.user.email}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha de matrícula',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {isError && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon><AlertCircle /></AlertIcon>
          <AlertContent><AlertTitle>No se pudieron cargar los estudiantes.</AlertTitle></AlertContent>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Estudiantes matriculados</CardTitle>
          </CardHeading>
          {!isStudent && (
            <CardToolbar>
              <Button size="sm" onClick={() => setEnrollOpen(true)}>
                <Plus className="size-4" />
                Matricular estudiante
              </Button>
            </CardToolbar>
          )}
        </CardHeader>
        <CardTable>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Users className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay estudiantes matriculados.</p>
              {!isStudent && (
                <Button size="sm" variant="outline" onClick={() => setEnrollOpen(true)}>
                  <Plus className="size-4" />
                  Matricular primero
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
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
          )}
        </CardTable>
      </Card>

      {!isStudent && (
        <EnrollModal courseId={courseId} open={enrollOpen} onOpenChange={setEnrollOpen} />
      )}
    </div>
  );
}

// ─── Classes Tab ──────────────────────────────────────────────────────────────
// El modal local viejo (solo título+estado) se reemplazó por
// `NewClassCurricularModal` (Etapa J / J6.3, Entrada 2 — flujo completo D4:
// título → elegir Desempeño del curso → camino DBA/EBC excluyente →
// generar indicadores → un solo submit).

function ClassesTab({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const [newClassOpen, setNewClassOpen] = useState(false);
  const { data: classes = [], isLoading, isError } = useClasses(courseId);

  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => (
        <Link
          href={`/classes/${row.original.id}`}
          className="font-medium text-[#2563EB] hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.original.status?.toUpperCase() ?? 'DRAFT';
        const published = status === 'PUBLISHED' || status === 'LIVE';
        return (
          <Badge variant={published ? 'success' : 'secondary'} appearance="light">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          {isStudent ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/classes/${row.original.id}`}>
                <Eye className="size-3.5" />
                Ingresar a la clase
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/classes/${row.original.id}/editor`}>
                <Pencil className="size-3.5" />
                Editar
              </Link>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: classes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {isError && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon><AlertCircle /></AlertIcon>
          <AlertContent><AlertTitle>No se pudieron cargar las clases.</AlertTitle></AlertContent>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>{isStudent ? 'Presentaciones del curso' : 'Clases del curso'}</CardTitle>
          </CardHeading>
          {!isStudent && (
            <CardToolbar>
              <Button size="sm" onClick={() => setNewClassOpen(true)}>
                <Plus className="size-4" />
                Nueva clase
              </Button>
            </CardToolbar>
          )}
        </CardHeader>
        <CardTable>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <LayoutGrid className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isStudent
                  ? 'No hay presentaciones disponibles en este curso.'
                  : 'No hay clases en este curso.'}
              </p>
              {!isStudent && (
                <Button size="sm" variant="outline" onClick={() => setNewClassOpen(true)}>
                  <Plus className="size-4" />
                  Crear primera clase
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
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
          )}
        </CardTable>
      </Card>

      {!isStudent && (
        <NewClassCurricularModal
          courseId={courseId}
          open={newClassOpen}
          onOpenChange={setNewClassOpen}
        />
      )}
    </div>
  );
}

// ─── Grades Tab ───────────────────────────────────────────────────────────────

function GradesTab({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const [periodPick, setPeriodPick] = useState<string | null>(null);
  const { data: periods = [], isLoading: periodsLoading } = useCoursePeriods(courseId);

  const selectedPeriodId =
    periodPick != null && periods.some((p) => p.id === periodPick)
      ? periodPick
      : (periods.find((p) => p.isActive)?.id ?? periods[0]?.id ?? '');

  const gradeQuery = useGradeCalculation(courseId, selectedPeriodId);
  const allGrades = gradeQuery.data ?? [];
  const grades = isStudent && user?.id
    ? allGrades.filter((entry) => entry.studentId === user.id)
    : allGrades;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Calificaciones</CardTitle>
          </CardHeading>
          <CardToolbar>
            {periodsLoading ? (
              <Skeleton className="h-8.5 w-44" />
            ) : (
              <select
                value={selectedPeriodId}
                onChange={(e) => setPeriodPick(e.target.value)}
                className="h-8.5 px-3 rounded-md border border-input bg-background text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground"
              >
                <option value="">Seleccionar período</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </CardToolbar>
        </CardHeader>
        <CardTable>
          {!selectedPeriodId ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Calendar className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Selecciona un período para ver las calificaciones.
              </p>
            </div>
          ) : gradeQuery.isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : gradeQuery.isError ? (
            <div className="p-5">
              <Alert variant="destructive" appearance="light">
                <AlertIcon><AlertCircle /></AlertIcon>
                <AlertContent>
                  <AlertTitle>No se pudieron cargar las calificaciones.</AlertTitle>
                </AlertContent>
              </Alert>
            </div>
          ) : grades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No hay calificaciones para este período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Nota final</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((entry, index) => (
                  <TableRow key={entry.studentId || index}>
                    <TableCell className="font-medium">{entry.studentName}</TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {entry.finalGrade !== null ? entry.finalGrade.toFixed(1) : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.isComplete ? 'success' : 'warning'}
                        appearance="light"
                      >
                        {entry.isComplete ? 'Completo' : 'Parcial'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardTable>
      </Card>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function CourseDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const { data: course, isLoading } = useCourse(id);

  return (
    <div className="w-full space-y-6 p-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild className="mt-0.5">
          <Link href="/courses">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <>
              <h1 className="text-2xl font-semibold">{course?.name ?? 'Curso'}</h1>
              <p className="text-sm text-muted-foreground mt-1 font-mono">{course?.code}</p>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList variant="line" size="md">
          <TabsTrigger value="info">
            <BookOpen />
            Información
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users />
            Estudiantes
          </TabsTrigger>
          <TabsTrigger value="classes">
            <LayoutGrid />
            {isStudent ? 'Presentaciones' : 'Clases'}
          </TabsTrigger>
          <TabsTrigger value="grades">
            <GraduationCap />
            Calificaciones
          </TabsTrigger>
          {!isStudent && (
            <TabsTrigger value="structure">
              <ListTree />
              Estructura
            </TabsTrigger>
          )}
          {!isStudent && (
            <TabsTrigger value="desempenos">
              <Target />
              Desempeños
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info">
          <InfoTab courseId={id} />
        </TabsContent>
        <TabsContent value="students">
          <StudentsTab courseId={id} />
        </TabsContent>
        <TabsContent value="classes">
          <ClassesTab courseId={id} />
        </TabsContent>
        <TabsContent value="grades">
          <GradesTab courseId={id} />
        </TabsContent>
        {!isStudent && (
          <TabsContent value="structure">
            <GradebookStructureTab courseId={id} />
          </TabsContent>
        )}
        {!isStudent && (
          <TabsContent value="desempenos">
            <DesempenosTab courseId={id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
