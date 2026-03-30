'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  GraduationCap,
  LayoutGrid,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCourse } from '@/hooks/api/use-course';
import { useCourseStudents, type Student } from '@/hooks/api/use-students';
import { useClasses, type Class } from '@/hooks/api/use-classes';
import { useCoursePeriods } from '@/hooks/api/use-periods';
import { useUsers } from '@/hooks/api/use-users';
import { api } from '@/lib/api';

import { Card, CardContent, CardHeader, CardHeading, CardTable, CardTitle, CardToolbar } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

// ─── Grade calculation types ──────────────────────────────────────────────────

interface GradeEntry {
  studentId: string;
  studentName: string;
  finalGrade: number;
  status: 'complete' | 'partial';
}

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
  const { data: users = [], isLoading } = useUsers();

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.post(`/courses/${courseId}/students`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'students'] });
      toast.success('Estudiante matriculado');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al matricular el estudiante');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Matricular estudiante</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
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
                No se encontraron usuarios.
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
                    onClick={() => mutation.mutate(user.id)}
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
          <CardToolbar>
            <Button size="sm" onClick={() => setEnrollOpen(true)}>
              <Plus className="size-4" />
              Matricular estudiante
            </Button>
          </CardToolbar>
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
              <Button size="sm" variant="outline" onClick={() => setEnrollOpen(true)}>
                <Plus className="size-4" />
                Matricular primero
              </Button>
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

      <EnrollModal courseId={courseId} open={enrollOpen} onOpenChange={setEnrollOpen} />
    </div>
  );
}

// ─── New Class Modal ──────────────────────────────────────────────────────────

const classSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  status: z.enum(['draft', 'published']),
});
type ClassFormData = z.infer<typeof classSchema>;

function NewClassModal({
  courseId,
  open,
  onOpenChange,
}: {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: { title: '', status: 'draft' },
  });

  const mutation = useMutation({
    mutationFn: async (data: ClassFormData) => {
      return api.post('/classes', { ...data, courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', courseId] });
      toast.success('Clase creada');
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al crear la clase');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva clase</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
            <DialogBody className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título de la clase" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring"
                        {...field}
                      >
                        <option value="draft">Borrador</option>
                        <option value="published">Publicada</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creando...' : 'Crear clase'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Classes Tab ──────────────────────────────────────────────────────────────

function ClassesTab({ courseId }: { courseId: string }) {
  const [newClassOpen, setNewClassOpen] = useState(false);
  const { data: classes = [], isLoading, isError } = useClasses(courseId);

  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const published =
          row.original.status?.toLowerCase() === 'published';
        return (
          <Badge variant={published ? 'success' : 'secondary'} appearance="light">
            {published ? 'Publicada' : 'Borrador'}
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
            <CardTitle>Clases del curso</CardTitle>
          </CardHeading>
          <CardToolbar>
            <Button size="sm" onClick={() => setNewClassOpen(true)}>
              <Plus className="size-4" />
              Nueva clase
            </Button>
          </CardToolbar>
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
              <p className="text-sm text-muted-foreground">No hay clases en este curso.</p>
              <Button size="sm" variant="outline" onClick={() => setNewClassOpen(true)}>
                <Plus className="size-4" />
                Crear primera clase
              </Button>
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

      <NewClassModal courseId={courseId} open={newClassOpen} onOpenChange={setNewClassOpen} />
    </div>
  );
}

// ─── Grades Tab ───────────────────────────────────────────────────────────────

function GradesTab({ courseId }: { courseId: string }) {
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const { data: periods = [], isLoading: periodsLoading } = useCoursePeriods(courseId);

  const gradeQuery = useQuery({
    queryKey: ['grade-calculation', courseId, selectedPeriodId],
    enabled: !!selectedPeriodId,
    queryFn: async () => {
      const { data } = await api.get(
        `/courses/${courseId}/grade-calculation`,
        { params: { periodId: selectedPeriodId } },
      );
      // Backend returns { data: [...], meta: {} } or plain array
      if (Array.isArray(data)) return data as GradeEntry[];
      const inner = (data as { data?: unknown })?.data;
      return Array.isArray(inner) ? (inner as GradeEntry[]) : [];
    },
  });

  const grades = gradeQuery.data ?? [];

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
                onChange={(e) => setSelectedPeriodId(e.target.value)}
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
                {grades.map((entry) => (
                  <TableRow key={entry.studentId}>
                    <TableCell className="font-medium">{entry.studentName}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{entry.finalGrade.toFixed(1)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.status === 'complete' ? 'success' : 'warning'}
                        appearance="light"
                      >
                        {entry.status === 'complete' ? 'Completo' : 'Parcial'}
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
  const { data: course, isLoading } = useCourse(id);

  return (
    <div className="container py-6 space-y-6">
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
            Clases
          </TabsTrigger>
          <TabsTrigger value="grades">
            <GraduationCap />
            Calificaciones
          </TabsTrigger>
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
      </Tabs>
    </div>
  );
}
