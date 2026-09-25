'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  Pencil,
  Play,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { SlideThumbnailPreview } from '@/app/(app)/classes/[id]/editor/components/slides-panel';
import { NewClassCurricularModal } from '@/app/(app)/courses/[id]/new-class-curricular-modal';
import { STATUS_BADGE_STYLE } from '@/app/(app)/classes/class-status-badge-styles';
import { useAuth } from '@/hooks/use-auth';
import { useCourses } from '@/hooks/api/use-courses';
import {
  useClasses,
  useEnrolledClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  type Class,
} from '@/hooks/api/use-classes';
import { useClass } from '@/hooks/api/use-class';
import { StudentEnrolledClassCard } from './components/student-enrolled-class-card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '@lumina/ui/card';
import { Button } from '@lumina/ui/button';
import { Skeleton } from '@lumina/ui/skeleton';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@lumina/ui/alert';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lumina/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@lumina/ui/form';
import { Input } from '@lumina/ui/input';
import { PageBanner } from '@lumina/ui/page-banner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  LIVE: 'En vivo',
  ARCHIVED: 'Archivada',
};

function statusLabel(status: string) {
  return STATUS_LABELS[status?.toUpperCase()] ?? status;
}

function isPublishedStatus(status: string) {
  return status?.toUpperCase() === 'PUBLISHED';
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
  isPersonal = false,
}: {
  courseId?: string;
  classId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sin curso (`courseId: null`) — el backend siempre trata esto como
   * "presentación personal" (`isPersonalPresentation = !dto.courseId ||
   * isStudent`), sin importar el rol real. Gobierna solo la redacción y el
   * `courseId` enviado, no quién puede abrir el modal. */
  isPersonal?: boolean;
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
          toast.success(isPersonal ? 'Presentación actualizada' : 'Clase actualizada');
          onOpenChange(false);
        },
        onError: () =>
          toast.error(
            isPersonal ? 'Error al actualizar la presentación' : 'Error al actualizar la clase',
          ),
      });
    } else {
      createMutation.mutate(
        {
          ...data,
          courseId: isPersonal ? null : courseId,
          modoEntrega: isPersonal ? 'presentacion' : undefined,
        },
        {
          onSuccess: () => {
            toast.success(isPersonal ? 'Presentación creada' : 'Clase creada');
            onOpenChange(false);
          },
          onError: () =>
            toast.error(
              isPersonal ? 'Error al crear la presentación' : 'Error al crear la clase',
            ),
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? isPersonal
                ? 'Editar presentación'
                : 'Editar clase'
              : isPersonal
                ? 'Nueva presentación'
                : 'Nueva clase'}
          </DialogTitle>
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
                        <Input
                          placeholder={
                            isPersonal ? 'Título de la presentación' : 'Título de la clase'
                          }
                          {...field}
                        />
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
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Descripción breve" {...field} />
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
                  {isPending
                    ? 'Guardando...'
                    : isEdit
                      ? 'Guardar cambios'
                      : isPersonal
                        ? 'Crear presentación'
                        : 'Crear clase'}
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
  isPersonal = false,
}: {
  cls: Class | null;
  courseId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPersonal?: boolean;
}) {
  const deleteMutation = useDeleteClass(courseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPersonal ? '¿Eliminar presentación?' : '¿Eliminar clase?'}</DialogTitle>
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
                  toast.success(isPersonal ? 'Presentación eliminada' : 'Clase eliminada');
                  onOpenChange(false);
                },
                onError: () =>
                  toast.error(
                    isPersonal ? 'Error al eliminar la presentación' : 'Error al eliminar la clase',
                  ),
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

const EMPTY_GRADIENTS = [
  'linear-gradient(135deg, #dbeafe, #dbeafe)',
  'linear-gradient(135deg, #dbeafe, #e0f2fe)',
  'linear-gradient(135deg, #fef3c7, #dbeafe)',
];

function ClassCard({
  cls,
  courseId,
  onDelete,
  index,
  isPersonal = false,
}: {
  cls: Class;
  courseId?: string;
  onDelete: (c: Class) => void;
  index: number;
  isPersonal?: boolean;
}) {
  const router = useRouter();
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
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: ['classes', courseId] });
      }
      queryClient.invalidateQueries({ queryKey: ['classes', 'personal'] });
      queryClient.invalidateQueries({ queryKey: ['classes', 'detail', cls.id] });
      toast.success('Clase publicada');
    },
    onError: () => toast.error('Error al publicar la clase'),
  });

  const published = isPublishedStatus(cls.status);
  const emptyGradient = EMPTY_GRADIENTS[index % EMPTY_GRADIENTS.length];
  const badgeStyle = STATUS_BADGE_STYLE[cls.status?.toUpperCase()] ?? STATUS_BADGE_STYLE.DRAFT;
  const slideCount = cls._count?.slides;

  return (
    <article
      className="group relative overflow-hidden bg-white"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)',
        transition: 'all 200ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = '#d1d5db';
        el.style.boxShadow = '0px 6px 20px rgba(0, 0, 0, 0.10)';
        el.style.transform = 'translateY(-2px)';
        router.prefetch(`/classes/${cls.id}`);
        router.prefetch(`/classes/${cls.id}/editor`);
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = '#e5e7eb';
        el.style.boxShadow = '0px 2px 6px rgba(0, 0, 0, 0.06)';
        el.style.transform = 'translateY(0)';
      }}
    >
      <Link
        href={isPersonal ? `/classes/${cls.id}/editor` : `/classes/${cls.id}`}
        className="absolute inset-0 z-0"
        aria-label={
          isPersonal ? `Abrir presentación: ${cls.title}` : `Abrir clase: ${cls.title}`
        }
      />

      <div className="relative w-full overflow-hidden" style={{ height: '180px' }}>
        {detailLoading ? (
          <Skeleton className="absolute inset-0 size-full rounded-none" />
        ) : firstSlide ? (
          <SlideThumbnailPreview
            order={firstSlide.order}
            content={firstSlide.content}
            isActive={false}
            aspectRatio="4/3"
            showOuterRing={false}
            className="h-full rounded-none"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center"
            style={{ background: emptyGradient }}
          >
            <BookOpen
              className="size-12"
              style={{ color: '#2563EB', opacity: 0.4 }}
              aria-hidden
            />
          </div>
        )}

        <div
          className={cn(
            'absolute bottom-2 right-2 z-10 flex items-center gap-2',
            'pointer-events-none opacity-0 transition-opacity duration-150',
            'group-hover:pointer-events-auto group-hover:opacity-100',
          )}
        >
          {isPersonal && (
            <Link
              href={`/classes/${cls.id}/present`}
              onClick={(e) => e.stopPropagation()}
              aria-label="Presentar"
              title="Presentar"
              className="relative z-10 inline-flex text-white/70 transition-colors hover:text-blue-400"
            >
              <Play size={18} className="cursor-pointer" aria-hidden />
            </Link>
          )}
          <Link
            href={`/classes/${cls.id}/editor`}
            onClick={(e) => e.stopPropagation()}
            aria-label={isPersonal ? 'Editar presentación' : 'Abrir editor'}
            title={isPersonal ? 'Editar presentación' : 'Abrir editor'}
            className="relative z-10 inline-flex text-white/70 transition-colors hover:text-blue-400"
          >
            <Pencil size={18} className="cursor-pointer" aria-hidden />
          </Link>
          {!isPersonal && !published ? (
            <button
              type="button"
              disabled={publishMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                publishMutation.mutate();
              }}
              aria-label="Publicar clase"
              className={cn(
                'relative z-10 inline-flex border-0 bg-transparent p-0 text-white/70 transition-colors',
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
            aria-label={isPersonal ? 'Eliminar presentación' : 'Eliminar clase'}
            title={isPersonal ? 'Eliminar presentación' : 'Eliminar clase'}
            className="relative z-10 inline-flex border-0 bg-transparent p-0 text-red-400 transition-colors hover:text-red-300"
          >
            <Trash2 size={18} className="cursor-pointer" aria-hidden />
          </button>
        </div>
      </div>

      <div className="relative z-[1] pointer-events-none p-3">
        <p className="truncate text-sm font-semibold text-[#111827]">{cls.title}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
          >
            {isPersonal ? 'Presentación' : statusLabel(cls.status)}
          </span>
          <span className="text-xs text-[#9ca3af] shrink-0">
            {typeof slideCount === 'number'
              ? `${slideCount} slide${slideCount !== 1 ? 's' : ''}`
              : new Date(cls.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
          </span>
        </div>
      </div>
    </article>
  );
}

function ClassesGrid({
  classes,
  courseId,
  onDelete,
  isPersonal = false,
}: {
  classes: Class[];
  courseId?: string;
  onDelete: (cls: Class) => void;
  isPersonal?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {classes.map((cls, index) => (
        <ClassCard
          key={cls.id}
          cls={cls}
          courseId={courseId}
          onDelete={onDelete}
          index={index}
          isPersonal={isPersonal}
        />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ClassesClient() {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const { data: courses = [], isLoading: coursesLoading } = useCourses();

  const [studentTab, setStudentTab] = useState<'classes' | 'presentations'>('classes');
  // Docente/admin: "Clases de mis cursos" (requiere curso) vs "Mis presentaciones
  // personales" (courseId: null — el backend ya trata esto como presentación
  // personal para cualquier rol, `isPersonalPresentation = !dto.courseId ||
  // isStudent`). Antes de esta pestaña, una clase personal de docente — p. ej.
  // la copia creada por "Duplicar a mis clases" en la Guía de Lumina — no tenía
  // ningún camino de UI para volver a encontrarla (ver AGENTS.md, análisis del
  // problema "todas las clases asociadas a un curso").
  const [teacherTab, setTeacherTab] = useState<'courses' | 'presentations'>('courses');
  const [coursePick, setCoursePick] = useState<string | null>(null);
  const selectedCourseId = isStudent ? '' : (coursePick ?? courses[0]?.id ?? '');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cls: Class | null }>({
    open: false,
    cls: null,
  });

  const isPersonalTab = isStudent
    ? studentTab === 'presentations'
    : teacherTab === 'presentations';
  // Nunca pasar un `selectedCourseId` "colgado" de la pestaña de cursos hacia
  // las presentaciones personales del docente (que son courseId: null).
  const effectiveCourseId = isPersonalTab ? undefined : selectedCourseId;

  // Clases matriculadas para estudiantes (GET /classes/enrolled)
  const {
    data: enrolledClasses = [],
    isLoading: enrolledLoading,
    isError: enrolledError,
  } = useEnrolledClasses({
    enabled: isStudent,
  });

  // Presentaciones personales (alumno o docente, courseId: null) o clases del
  // curso seleccionado (docente).
  const {
    data: classes = [],
    isLoading: classesLoading,
    isError: classesError,
  } = useClasses(effectiveCourseId, {
    enabled: isStudent
      ? studentTab === 'presentations'
      : isPersonalTab || !!selectedCourseId,
  });

  function handleDelete(cls: Class) {
    setDeleteDialog({ open: true, cls });
  }

  const bannerTitle = isPersonalTab ? 'Mis Presentaciones' : 'Mis Clases';

  const bannerSubtitle = isPersonalTab
    ? `${classes.length} presentación${classes.length !== 1 ? 'es' : ''} · Crea y organiza tus presentaciones interactivas`
    : isStudent
      ? `${enrolledClasses.length} clase${enrolledClasses.length !== 1 ? 's' : ''} en tus cursos matriculados`
      : selectedCourseId
        ? `${classes.length} clase${classes.length !== 1 ? 's' : ''} · Gestiona y organiza tu contenido`
        : 'Selecciona un curso para ver tus clases';

  return (
    <div className="w-full flex flex-col gap-0 pb-6">
      <PageBanner
        title={bannerTitle}
        subtitle={bannerSubtitle}
        backHref="/dashboard"
        action={
          isPersonalTab ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="bg-white text-[#2563EB] font-extrabold text-[0.75rem] px-4 py-1.5 rounded-lg border-none cursor-pointer"
            >
              ＋ Nueva presentación
            </button>
          ) : isStudent ? null : (
            <button
              type="button"
              disabled={!selectedCourseId}
              onClick={() => {
                setFormOpen(true);
              }}
              className="bg-white text-[#2563EB] font-extrabold text-[0.75rem] px-4 py-1.5 rounded-lg border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ＋ Nueva clase
            </button>
          )
        }
      />

      <div className="px-6 pt-4 space-y-4">
        {/* Pestañas para estudiante (Mis Clases vs Mis Presentaciones) */}
        {isStudent && (
          <div className="flex border-b border-[#e5e7eb] gap-6 mb-2">
            <button
              type="button"
              onClick={() => setStudentTab('classes')}
              className={cn(
                'pb-3 text-sm font-bold transition-all relative flex items-center gap-2',
                studentTab === 'classes'
                  ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
                  : 'text-gray-500 hover:text-gray-800',
              )}
            >
              <span>Clases de mis cursos</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {enrolledClasses.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStudentTab('presentations')}
              className={cn(
                'pb-3 text-sm font-bold transition-all relative flex items-center gap-2',
                studentTab === 'presentations'
                  ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
                  : 'text-gray-500 hover:text-gray-800',
              )}
            >
              <span>Mis presentaciones</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {classes.length}
              </span>
            </button>
          </div>
        )}

        {/* Pestañas para docente/admin (Clases de mis cursos vs Mis presentaciones) */}
        {!isStudent && (
          <div className="flex border-b border-[#e5e7eb] gap-6 mb-2">
            <button
              type="button"
              onClick={() => setTeacherTab('courses')}
              className={cn(
                'pb-3 text-sm font-bold transition-all relative flex items-center gap-2',
                teacherTab === 'courses'
                  ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
                  : 'text-gray-500 hover:text-gray-800',
              )}
            >
              <span>Clases de mis cursos</span>
            </button>
            <button
              type="button"
              onClick={() => setTeacherTab('presentations')}
              className={cn(
                'pb-3 text-sm font-bold transition-all relative flex items-center gap-2',
                teacherTab === 'presentations'
                  ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
                  : 'text-gray-500 hover:text-gray-800',
              )}
            >
              <span>Mis presentaciones personales</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                {teacherTab === 'presentations' ? classes.length : ''}
              </span>
            </button>
          </div>
        )}

        {/* Selector de curso (Docentes, solo en la pestaña "Clases de mis cursos") */}
        {!isStudent && teacherTab === 'courses' && (
          <div className="flex flex-wrap items-center gap-3">
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
                className="h-8.5 min-w-0 w-full flex-1 px-3 rounded-md border border-input bg-background text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground sm:w-auto sm:min-w-[14rem] sm:flex-none"
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
        )}

        {/* Error */}
        {(classesError || enrolledError) && (
          <Alert variant="destructive" appearance="light">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>
                No se pudieron cargar los datos de las clases.
              </AlertTitle>
            </AlertContent>
          </Alert>
        )}

        {/* Contenido: Si estudiante está en pestaña 'classes' */}
        {isStudent && studentTab === 'classes' ? (
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>Clases asignadas en tus cursos</CardTitle>
              </CardHeading>
              <CardToolbar>
                <span className="text-sm text-muted-foreground">
                  {enrolledLoading ? '...' : `${enrolledClasses.length} clase${enrolledClasses.length !== 1 ? 's' : ''}`}
                </span>
              </CardToolbar>
            </CardHeader>
            <CardContent className="p-4">
              {enrolledLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-xl border border-zinc-200"
                    >
                      <Skeleton className="aspect-[4/3] w-full rounded-none" />
                      <div className="space-y-2 p-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : enrolledClasses.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <BookOpen className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No hay clases asignadas aún</p>
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                      Cuando tus docentes publiquen clases en los cursos donde estás inscrito, las verás reflejadas aquí.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {enrolledClasses.map((cls, index) => (
                    <StudentEnrolledClassCard key={cls.id} cls={cls} index={index} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle>
                  {isPersonalTab
                    ? 'Mis presentaciones personales'
                    : selectedCourseId
                      ? `Clases de ${courses.find((c) => c.id === selectedCourseId)?.name ?? 'curso seleccionado'}`
                      : 'Clases'}
                </CardTitle>
              </CardHeading>
              {(isPersonalTab || selectedCourseId) && (
                <CardToolbar>
                  <span className="text-sm text-muted-foreground">
                    {classesLoading
                      ? '...'
                      : `${classes.length} ${
                          isPersonalTab
                            ? `presentación${classes.length !== 1 ? 'es' : ''}`
                            : `clase${classes.length !== 1 ? 's' : ''}`
                        }`}
                  </span>
                </CardToolbar>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {!isStudent && !isPersonalTab && !selectedCourseId ? (
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
                    {isPersonalTab ? (
                      <BookOpen className="size-6 text-muted-foreground" />
                    ) : (
                      <GraduationCap className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {isPersonalTab ? 'No tienes presentaciones aún' : 'No hay clases aún'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isPersonalTab
                        ? 'Crea tu primera presentación interactiva para comenzar.'
                        : 'Crea la primera clase para este curso.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    {isPersonalTab ? 'Crear primera presentación' : 'Crear primera clase'}
                  </Button>
                </div>
              ) : (
                <ClassesGrid
                  classes={classes}
                  courseId={effectiveCourseId}
                  onDelete={handleDelete}
                  isPersonal={isPersonalTab}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Nueva presentación personal (alumno o docente, sin curso) — modal
            simple título+descripción, courseId: null (misma semántica que el
            backend le da a cualquier rol sin curso). */}
        {isPersonalTab && (
          <ClassFormModal
            courseId={effectiveCourseId}
            open={formOpen}
            onOpenChange={setFormOpen}
            isPersonal
          />
        )}

        {/* Nueva clase (docente, con curso) — único camino de creación, motor curricular (Etapa J / J6) */}
        {!isStudent && teacherTab === 'courses' && selectedCourseId && (
          <NewClassCurricularModal
            courseId={selectedCourseId}
            open={formOpen}
            onOpenChange={setFormOpen}
          />
        )}

        {/* Delete dialog */}
        <DeleteDialog
          cls={deleteDialog.cls}
          courseId={effectiveCourseId}
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
          isPersonal={isPersonalTab}
        />
      </div>
    </div>
  );
}
