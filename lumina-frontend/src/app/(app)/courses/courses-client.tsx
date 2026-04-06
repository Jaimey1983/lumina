'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { AlertCircle, BookOpen, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useCourses, type Course } from '@/hooks/api/use-courses';
import { useCourse } from '@/hooks/api/use-course';
import { api } from '@/lib/api';

import {
  Card,
  CardHeader,
  CardHeading,
  CardTable,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// ─── Schema ───────────────────────────────────────────────────────────────────

const courseSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  code: z.string().min(1, 'El código es obligatorio'),
  description: z.string().optional(),
});
type CourseFormData = z.infer<typeof courseSchema>;

// ─── Course Form (keyed to reset state on mode change) ────────────────────────

function CourseFormContent({
  courseId,
  onSuccess,
  onCancel,
}: {
  courseId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!courseId;
  const { data: courseDetail, isLoading: detailLoading } = useCourse(courseId ?? '');

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  useEffect(() => {
    if (courseDetail) {
      form.reset({
        name: courseDetail.name,
        code: courseDetail.code,
        description: courseDetail.description ?? '',
      });
    }
  }, [courseDetail, form]);

  const mutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      if (isEdit) {
        return api.patch(`/courses/${courseId}`, data);
      }
      return api.post('/courses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success(isEdit ? 'Curso actualizado' : 'Curso creado');
      onSuccess();
    },
    onError: () => {
      toast.error(isEdit ? 'Error al actualizar el curso' : 'Error al crear el curso');
    },
  });

  if (isEdit && detailLoading) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
      >
        <DialogBody className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del curso" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: MAT-101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Descripción{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <textarea
                    className="flex w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-[0.8125rem] shadow-xs placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-60 resize-none"
                    placeholder="Descripción del curso..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear curso'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// ─── Delete Dialog ─────────────────────────────────────────────────────────────

function DeleteDialog({
  course,
  open,
  onOpenChange,
}: {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/courses/${course?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso eliminado');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al eliminar el curso');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar curso?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar{' '}
            <span className="font-medium text-foreground">{course?.name}</span>? Esta
            acción no se puede deshacer.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CoursesClient() {
  const router = useRouter();
  const { data: courses = [], isLoading, isError } = useCourses();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; course: Course | null }>({
    open: false,
    course: null,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return courses;
    return courses.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [courses, search]);

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
          <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>
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
        accessorKey: 'createdAt',
        header: 'Fecha de creación',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
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
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/courses/${row.original.id}`)}
              title="Ver curso"
            >
              <Eye className="size-4" />
              Ver
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingCourseId(row.original.id);
                setFormOpen(true);
              }}
              title="Editar curso"
            >
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteDialog({ open: true, course: row.original })}
              title="Eliminar curso"
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cursos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona todos tus cursos desde aquí.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCourseId(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nuevo curso
        </Button>
      </div>

      {/* Error */}
      {isError && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>No se pudieron cargar los cursos.</AlertTitle>
          </AlertContent>
        </Alert>
      )}

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Lista de cursos</CardTitle>
          </CardHeading>
          <CardToolbar>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-8 w-56"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardToolbar>
        </CardHeader>
        <CardTable>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {search ? 'Sin resultados' : 'No hay cursos aún'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {search
                    ? 'Intenta con otro término de búsqueda.'
                    : 'Crea tu primer curso para comenzar.'}
                </p>
              </div>
              {!search && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCourseId(undefined);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Crear primer curso
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

      {/* Create / Edit modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCourseId ? 'Editar curso' : 'Nuevo curso'}
            </DialogTitle>
          </DialogHeader>
          <CourseFormContent
            key={editingCourseId ?? 'new'}
            courseId={editingCourseId}
            onSuccess={() => setFormOpen(false)}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <DeleteDialog
        course={deleteDialog.course}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}
