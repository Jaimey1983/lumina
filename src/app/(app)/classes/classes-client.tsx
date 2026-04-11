'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { SlideThumbnailPreview } from '@/app/(app)/classes/[id]/editor/components/slides-panel';
import { useCourses } from '@/hooks/api/use-courses';
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  type Class,
} from '@/hooks/api/use-classes';
import { useClass } from '@/hooks/api/use-class';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
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

function isPublishedStatus(status: string) {
  return status?.toUpperCase() === 'PUBLISHED';
}

function isDraftStatus(status: string) {
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

// ─── Class card (grid) ────────────────────────────────────────────────────────

function ClassCard({
  cls,
  courseId,
  onDelete,
}: {
  cls: Class;
  courseId: string;
  onDelete: (c: Class) => void;
}) {
  const queryClient = useQueryClient();
  const { data: detail, isLoading: detailLoading } = useClass(cls.id);

  const firstSlide = useMemo(() => {
    const slides = detail?.slides;
    if (!slides?.length) return null;
    return [...slides].sort((a, b) => a.order - b.order)[0] ?? null;
  }, [detail?.slides]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/classes/${cls.id}`, { status: 'published' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', courseId] });
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', cls.id] });
      toast.success('Clase publicada');
    },
    onError: () => toast.error('Error al publicar la clase'),
  });

  const published = isPublishedStatus(cls.status);
  const draft = isDraftStatus(cls.status);

  return (
    <div
      className={cn(
        'group cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-card shadow-md',
        'transition-shadow hover:shadow-lg dark:border-zinc-700',
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {detailLoading ? (
          <Skeleton className="absolute inset-0 size-full rounded-none" />
        ) : firstSlide ? (
          <SlideThumbnailPreview
            order={firstSlide.order}
            content={firstSlide.content}
            isActive={false}
            aspectRatio="4/3"
            showOuterRing={false}
            className="rounded-none"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            <BookOpen className="size-14 text-white/75" aria-hidden />
          </div>
        )}

        <div
          className={cn(
            'absolute bottom-2 right-2 z-10 flex items-center gap-2',
            'pointer-events-none opacity-0 transition-opacity duration-150',
            'group-hover:pointer-events-auto group-hover:opacity-100',
          )}
        >
          <Link
            href={`/classes/${cls.id}`}
            onClick={(e) => e.stopPropagation()}
            aria-label="Ver clase"
            className="inline-flex text-white/70 transition-colors hover:text-blue-400"
          >
            <Eye size={18} className="cursor-pointer" aria-hidden />
          </Link>
          <Link
            href={`/classes/${cls.id}/editor`}
            onClick={(e) => e.stopPropagation()}
            aria-label="Abrir editor"
            className="inline-flex text-white/70 transition-colors hover:text-blue-400"
          >
            <Pencil size={18} className="cursor-pointer" aria-hidden />
          </Link>
          {!published ? (
            <button
              type="button"
              disabled={publishMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                publishMutation.mutate();
              }}
              aria-label="Publicar clase"
              className={cn(
                'inline-flex border-0 bg-transparent p-0 text-white/70 transition-colors',
                'hover:text-blue-400 disabled:pointer-events-none disabled:opacity-40',
              )}
            >
              <Send size={18} className="cursor-pointer" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(cls);
            }}
            aria-label="Eliminar clase"
            className="inline-flex border-0 bg-transparent p-0 text-red-400 transition-colors hover:text-red-300"
          >
            <Trash2 size={18} className="cursor-pointer" aria-hidden />
          </button>
        </div>
      </div>

      <div className="border-t border-border/60 p-3">
        <p className="truncate font-medium text-foreground">{cls.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge
            variant={
              published ? 'success' : draft ? 'secondary' : statusVariant(cls.status)
            }
            appearance="light"
            className="text-[10px]"
          >
            {published ? 'Publicada' : draft ? 'Borrador' : statusLabel(cls.status)}
          </Badge>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {new Date(cls.createdAt).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

function ClassesGrid({
  classes,
  courseId,
  onDelete,
}: {
  classes: Class[];
  courseId: string;
  onDelete: (cls: Class) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {classes.map((cls) => (
        <ClassCard key={cls.id} cls={cls} courseId={courseId} onDelete={onDelete} />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ClassesClient() {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();

  const [coursePick, setCoursePick] = useState<string | null>(null);
  const selectedCourseId = coursePick ?? courses[0]?.id ?? '';
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cls: Class | null }>({
    open: false,
    cls: null,
  });

  const {
    data: classes = [],
    isLoading: classesLoading,
    isError: classesError,
  } = useClasses(selectedCourseId);

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
        <CardContent className="p-4">
          {!selectedCourseId ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <GraduationCap className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Selecciona un curso para ver sus clases.
              </p>
            </div>
          ) : classesLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <GraduationCap className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No hay clases aún</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crea la primera clase para este curso.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Crear primera clase
              </Button>
            </div>
          ) : (
            <ClassesGrid
              classes={classes}
              courseId={selectedCourseId}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Create / Edit modal */}
      {selectedCourseId && (
        <ClassFormModal
          courseId={selectedCourseId}
          open={formOpen}
          onOpenChange={setFormOpen}
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
