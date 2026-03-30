'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCourses } from '@/hooks/api/use-courses';
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  usePublishClass,
  type Class,
} from '@/hooks/api/use-classes';
import { useClass } from '@/hooks/api/use-class';

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
import { Input } from '@/components/ui/input';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  LIVE: 'En vivo',
  ARCHIVED: 'Archivada',
};

const STATUS_VARIANTS: Record<
  string,
  'secondary' | 'success' | 'warning' | 'destructive' | 'primary'
> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  LIVE: 'primary',
  ARCHIVED: 'destructive',
};

function statusLabel(status: string) {
  return STATUS_LABELS[status?.toUpperCase()] ?? status;
}

function statusVariant(status: string) {
  return STATUS_VARIANTS[status?.toUpperCase()] ?? 'secondary';
}

function isDraft(status: string) {
  return status?.toUpperCase() === 'DRAFT';
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const classSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
});
type ClassFormData = z.infer<typeof classSchema>;

// ─── Class Form Modal ─────────────────────────────────────────────────────────

function ClassFormModal({
  courseId,
  classId,
  open,
  onOpenChange,
}: {
  courseId: string;
  classId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!classId;
  const { data: classDetail, isLoading: detailLoading } = useClass(classId ?? '');
  const createMutation = useCreateClass(courseId);
  const updateMutation = useUpdateClass(classId ?? '', courseId);

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: { title: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      if (isEdit && classDetail) {
        form.reset({
          title: classDetail.title,
          description: classDetail.description ?? '',
        });
      } else if (!isEdit) {
        form.reset({ title: '', description: '' });
      }
    }
  }, [open, isEdit, classDetail, form]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(data: ClassFormData) {
    if (isEdit) {
      updateMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Clase actualizada');
          onOpenChange(false);
        },
        onError: () => toast.error('Error al actualizar la clase'),
      });
    } else {
      createMutation.mutate(
        { ...data, courseId },
        {
          onSuccess: () => {
            toast.success('Clase creada');
            onOpenChange(false);
          },
          onError: () => toast.error('Error al crear la clase'),
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar clase' : 'Nueva clase'}</DialogTitle>
        </DialogHeader>

        {isEdit && detailLoading ? (
          <DialogBody className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </DialogBody>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
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
                          placeholder="Descripción de la clase..."
                          {...field}
                        />
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
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear clase'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  cls,
  courseId,
  open,
  onOpenChange,
}: {
  cls: Class | null;
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteMutation = useDeleteClass(courseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar clase?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar{' '}
            <span className="font-medium text-foreground">{cls?.title}</span>? Esta acción no
            se puede deshacer.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (!cls) return;
              deleteMutation.mutate(cls.id, {
                onSuccess: () => {
                  toast.success('Clase eliminada');
                  onOpenChange(false);
                },
                onError: () => toast.error('Error al eliminar la clase'),
              });
            }}
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Classes Table ────────────────────────────────────────────────────────────

function ClassesTable({
  classes,
  courseId,
  onEdit,
  onDelete,
}: {
  classes: Class[];
  courseId: string;
  onEdit: (cls: Class) => void;
  onDelete: (cls: Class) => void;
}) {
  const publishMutation = usePublishClass(courseId);

  const columns = useMemo<ColumnDef<Class>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Título',
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)} appearance="light">
            {statusLabel(row.original.status)}
          </Badge>
        ),
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
        cell: ({ row }) => {
          const cls = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button size="sm" variant="ghost" asChild title="Ver clase">
                <Link href={`/classes/${cls.id}`}>
                  <Eye className="size-4" />
                  Ver
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(cls)}
                title="Editar clase"
              >
                <Pencil className="size-4" />
                Editar
              </Button>
              {isDraft(cls.status) && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={publishMutation.isPending}
                  onClick={() => {
                    publishMutation.mutate(cls.id, {
                      onSuccess: () => toast.success('Clase publicada'),
                      onError: () => toast.error('Error al publicar la clase'),
                    });
                  }}
                  title="Publicar clase"
                >
                  <Send className="size-4" />
                  Publicar
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(cls)}
                title="Eliminar clase"
              >
                <Trash2 className="size-4" />
                Eliminar
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete, publishMutation],
  );

  const table = useReactTable({
    data: classes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ClassesClient() {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();

  const [coursePick, setCoursePick] = useState<string | null>(null);
  const selectedCourseId = coursePick ?? courses[0]?.id ?? '';
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cls: Class | null }>({
    open: false,
    cls: null,
  });

  const {
    data: classes = [],
    isLoading: classesLoading,
    isError: classesError,
  } = useClasses(selectedCourseId);

  function handleEdit(cls: Class) {
    setEditingClass(cls);
    setFormOpen(true);
  }

  function handleDelete(cls: Class) {
    setDeleteDialog({ open: true, cls });
  }

  return (
    <div className="container py-6 space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las clases de tus cursos.
          </p>
        </div>
        <Button
          disabled={!selectedCourseId}
          onClick={() => {
            setEditingClass(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nueva clase
        </Button>
      </div>

      {/* Course selector */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="course-select"
          className="text-sm font-medium text-foreground shrink-0"
        >
          Curso:
        </label>
        {coursesLoading ? (
          <Skeleton className="h-8.5 w-56" />
        ) : courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay cursos disponibles.</p>
        ) : (
          <select
            id="course-select"
            value={selectedCourseId}
            onChange={(e) => setCoursePick(e.target.value)}
            className="h-8.5 px-3 rounded-md border border-input bg-background text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground min-w-[14rem]"
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

      {/* Error */}
      {classesError && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>No se pudieron cargar las clases.</AlertTitle>
          </AlertContent>
        </Alert>
      )}

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>
              {selectedCourseId
                ? `Clases de ${courses.find((c) => c.id === selectedCourseId)?.name ?? 'curso seleccionado'}`
                : 'Clases'}
            </CardTitle>
          </CardHeading>
          {selectedCourseId && (
            <CardToolbar>
              <span className="text-sm text-muted-foreground">
                {classesLoading ? '...' : `${classes.length} clase${classes.length !== 1 ? 's' : ''}`}
              </span>
            </CardToolbar>
          )}
        </CardHeader>
        <CardTable>
          {!selectedCourseId ? (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <GraduationCap className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Selecciona un curso para ver sus clases.
              </p>
            </div>
          ) : classesLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                <GraduationCap className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No hay clases aún</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crea la primera clase para este curso.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingClass(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Crear primera clase
              </Button>
            </div>
          ) : (
            <ClassesTable
              classes={classes}
              courseId={selectedCourseId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardTable>
      </Card>

      {/* Create / Edit modal */}
      {selectedCourseId && (
        <ClassFormModal
          key={editingClass?.id ?? 'new'}
          courseId={selectedCourseId}
          classId={editingClass?.id}
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingClass(undefined);
          }}
        />
      )}

      {/* Delete dialog */}
      <DeleteDialog
        cls={deleteDialog.cls}
        courseId={selectedCourseId}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}
