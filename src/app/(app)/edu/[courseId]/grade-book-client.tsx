'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calculator,
  LoaderCircle,
  NotebookPen,
} from 'lucide-react';
import { toast } from 'sonner';

import { GradeScaleBadge } from '@/components/grade-scale-badge';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardHeading, CardTitle } from '@/components/ui/card';
import { inputVariants } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useClass } from '@/hooks/api/use-class';
import { useClasses } from '@/hooks/api/use-classes';
import { useCourse } from '@/hooks/api/use-course';
import {
  useGradebook,
  computeStudentPromedio,
  type ClassGradebookData,
} from '@/hooks/use-gradebook';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/** Actividades calificadas manualmente por el docente (PATCH por resultId). */
const MANUAL_GRADING = ['short_answer', 'encuesta_viva', 'nube_palabras'] as const;

function isManualGradingActivityType(activityType: string): boolean {
  return (MANUAL_GRADING as readonly string[]).includes(activityType);
}

function canEditEduManualCells(role: string | undefined): boolean {
  if (!role) return false;
  return role !== 'STUDENT';
}

const MANUAL_CELL_BORDER = 'border-2 border-[#F97316]';

const ACTIVITY_LABEL: Record<string, string> = {
  quiz_multiple: 'Quiz',
  verdadero_falso: 'V/F',
  completar_blancos: 'Completar',
  arrastrar_soltar: 'Arrastrar',
  emparejar: 'Emparejar',
  ordenar_pasos: 'Ordenar',
  video_interactivo: 'Video',
  short_answer: 'Respuesta',
  encuesta_viva: 'Encuesta',
  nube_palabras: 'Nube',
};

function abbreviateActivityType(activityType: string) {
  return ACTIVITY_LABEL[activityType] ?? activityType;
}

function studentDisplayName(s: { nombre?: string; name?: string }) {
  return s.nombre ?? s.name ?? 'Sin nombre';
}

function noteForSlide(
  notas: Record<string, number | null | undefined> | undefined,
  slideId: string,
): number | null {
  const v = notas?.[slideId];
  if (v === undefined || v === null || Number.isNaN(v)) return null;
  return v;
}

function AutoGradeCell({ note }: { note: number | null }) {
  if (note === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const good = note >= 3;
  return (
    <span
      className={cn(
        'inline-flex min-w-12 justify-center rounded-md border px-2 py-1 text-sm font-semibold',
        good
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
          : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200',
      )}
    >
      {note.toFixed(1)}
    </span>
  );
}

function ReadOnlyManualGradeCell({ note }: { note: number | null }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-sm font-semibold tabular-nums',
        MANUAL_CELL_BORDER,
        'bg-background text-foreground',
      )}
    >
      {note === null || Number.isNaN(note) ? '—' : note.toFixed(1)}
    </span>
  );
}

function ManualGradeCell({
  classId,
  resultId,
  studentId,
  slideId,
  initialNote,
}: {
  classId: string;
  resultId: string;
  studentId: string;
  slideId: string;
  initialNote: number | null;
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setInvalid(false);
    }
  }, [isEditing, initialNote, studentId, slideId]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const applyCacheAfterSave = useCallback(
    (score: number) => {
      queryClient.setQueryData<ClassGradebookData>(['gradebook', classId], (old) => {
        if (!old) return old;
        const estudiantes = old.estudiantes.map((e) => {
          if (e.studentId !== studentId) return e;
          const notas = { ...(e.notas ?? {}), [slideId]: score };
          const notaFinal = computeStudentPromedio(old.actividades, notas);
          return { ...e, notas, notaFinal };
        });
        return { ...old, estudiantes };
      });
    },
    [classId, queryClient, slideId, studentId],
  );

  const commit = useCallback(async () => {
    if (savingRef.current) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setInvalid(false);
      setIsEditing(false);
      return;
    }
    const raw = trimmed.replace(',', '.');
    const n = parseFloat(raw);
    if (Number.isNaN(n) || n < 0 || n > 5) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    const score = Math.round(n * 10) / 10;
    const orig =
      initialNote != null && !Number.isNaN(initialNote)
        ? Math.round(initialNote * 10) / 10
        : null;
    if (orig !== null && Math.abs(orig - score) < 0.001) {
      setIsEditing(false);
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    try {
      await api.patch(`/classes/${classId}/results/${resultId}`, { score });
      applyCacheAfterSave(score);
      setIsEditing(false);
    } catch {
      toast.error('No se pudo guardar la nota');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, [applyCacheAfterSave, classId, draft, initialNote, resultId]);

  const openEdit = useCallback(() => {
    setDraft(
      initialNote != null && !Number.isNaN(initialNote) ? initialNote.toFixed(1) : '',
    );
    setInvalid(false);
    setIsEditing(true);
  }, [initialNote]);

  if (!isEditing) {
    return (
      <div className="relative inline-flex justify-center">
        <button
          type="button"
          disabled={isSaving}
          onClick={openEdit}
          className={cn(
            'inline-flex h-9 min-w-20 items-center justify-center rounded-md px-2 text-sm font-semibold tabular-nums transition-colors',
            MANUAL_CELL_BORDER,
            'bg-background hover:bg-muted/60',
            isSaving && 'cursor-wait opacity-70',
          )}
        >
          {initialNote != null && !Number.isNaN(initialNote) ? initialNote.toFixed(1) : '—'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-flex justify-center">
      <input
        ref={inputRef}
        data-slot="input"
        type="number"
        min={0}
        max={5}
        step={0.1}
        disabled={isSaving}
        aria-invalid={invalid}
        className={cn(
          inputVariants({ variant: 'md' }),
          'h-9 w-24 text-center font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          MANUAL_CELL_BORDER,
          invalid && 'ring-2 ring-destructive',
          isSaving && 'cursor-wait pr-8',
        )}
        value={draft}
        onChange={(e) => {
          setInvalid(false);
          setDraft(e.target.value);
        }}
        onBlur={() => {
          void commit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setInvalid(false);
            setIsEditing(false);
          }
        }}
      />
      {isSaving ? (
        <LoaderCircle className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

export function GradeBookClient({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const docentePuedeEditarManual = canEditEduManualCells(user?.role);
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const {
    data: classes = [],
    isLoading: classesLoading,
    isError: classesError,
  } = useClasses(courseId);

  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    if (classes.length === 0) {
      setSelectedClassId('');
      return;
    }
    setSelectedClassId((prev) => {
      if (prev && classes.some((c) => c.id === prev)) return prev;
      return classes[0]!.id;
    });
  }, [classes]);

  const { data: classDetail } = useClass(selectedClassId);

  const {
    data: gradebook,
    isLoading: gradebookLoading,
    isError: gradebookError,
    isFetching: gradebookFetching,
  } = useGradebook(selectedClassId || undefined);

  const actividades = gradebook?.actividades ?? [];
  const estudiantes = gradebook?.estudiantes ?? [];

  const slideColumnTitle = useCallback(
    (slideId: string, index: number) => {
      const s = classDetail?.slides?.find((x) => x.id === slideId);
      const t = s?.title?.trim();
      if (t) return t;
      return `Actividad ${index + 1}`;
    },
    [classDetail?.slides],
  );

  const showClassSelect = classes.length > 1;
  const gradebookReady = !gradebookLoading && !gradebookError && !!gradebook;
  const noHayResultados = gradebookReady && estudiantes.length === 0;
  const showFullGrid = gradebookReady && estudiantes.length > 0 && actividades.length > 0;
  const showPromedioOnly = gradebookReady && estudiantes.length > 0 && actividades.length === 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button asChild variant="ghost" size="sm" className="w-fit px-0">
            <Link href="/edu">
              <ArrowLeft className="size-4" />
              Volver a cursos
            </Link>
          </Button>
          <div className="space-y-2">
            <Badge variant="primary" appearance="outline" className="w-fit">
              Lumina Edu
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">
              {courseLoading ? 'Cargando curso...' : course?.name ?? 'Planilla de notas'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Notas por clase y actividad (slides). Escala colombiana 1.0 a 5.0. Calificación manual
              (borde naranja): 0.0 a 5.0, guardado al salir del campo o con Enter.
            </p>
          </div>
        </div>

        <Card className="min-w-full lg:min-w-80 lg:max-w-sm">
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Curso
              </p>
              <p className="text-sm font-medium text-foreground">{course?.code ?? '—'}</p>
            </div>
            {showClassSelect ? (
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Clase
                </p>
                <Select
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                  disabled={classesLoading || classes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una clase" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeading className="w-full space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="size-4 text-muted-foreground" />
                      Planilla por clase
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Datos en vivo desde el libro de calificaciones. Las actividades automáticas se
                      muestran en verde si la nota es ≥ 3 y en rojo si es &lt; 3. Las actividades
                      manuales (respuesta corta, encuesta viva, nube de palabras) llevan borde naranja:
                      el docente hace clic en la celda, edita entre 0.0 y 5.0 y guarda con Enter o
                      al salir del campo.
                    </p>
                  </div>
                </div>
              </CardHeading>
            </CardHeader>
            <CardContent className="space-y-4">
              {classesError ? (
                <Alert variant="destructive">
                  <AlertIcon>
                    <AlertTriangle className="size-4" />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>No se pudieron cargar las clases del curso.</AlertTitle>
                  </AlertContent>
                </Alert>
              ) : null}

              {!classesLoading && classes.length === 0 ? (
                <Alert>
                  <AlertIcon>
                    <NotebookPen className="size-4" />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>Este curso no tiene clases todavía.</AlertTitle>
                  </AlertContent>
                </Alert>
              ) : null}

              {classesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : null}

              {gradebookError ? (
                <Alert variant="destructive">
                  <AlertIcon>
                    <AlertTriangle className="size-4" />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>No se pudo cargar el libro de calificaciones de la clase.</AlertTitle>
                  </AlertContent>
                </Alert>
              ) : null}

              {selectedClassId && (gradebookLoading || gradebookFetching) && !gradebook ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : null}

              {noHayResultados ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                  <NotebookPen className="size-9 text-muted-foreground/70" />
                  <div className="space-y-1">
                    <h3 className="font-medium">Aún no hay resultados para esta clase</h3>
                    <p className="text-sm text-muted-foreground">
                      Cuando haya calificaciones por actividades, aparecerán aquí.
                    </p>
                  </div>
                </div>
              ) : null}

              {showFullGrid || showPromedioOnly ? (
                <div className="relative">
                  {gradebookFetching ? (
                    <div className="absolute inset-0 z-10 flex items-start justify-end pt-1 pr-1">
                      <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-hidden />
                    </div>
                  ) : null}
                  <Table className="min-w-max">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-20 min-w-56 bg-card">
                          Estudiante
                        </TableHead>
                        {showFullGrid
                          ? actividades.map((act, idx) => (
                              <TableHead key={act.slideId} className="max-w-40 text-center text-xs">
                                <span
                                  className="line-clamp-2 font-medium leading-tight"
                                  title={slideColumnTitle(act.slideId, idx)}
                                >
                                  {slideColumnTitle(act.slideId, idx)}
                                </span>
                                <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                                  {abbreviateActivityType(act.activityType)}
                                </span>
                              </TableHead>
                            ))
                          : null}
                        <TableHead className="min-w-28 text-center">Promedio final</TableHead>
                        <TableHead className="sticky right-0 z-20 min-w-36 bg-card text-center">
                          Desempeño
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estudiantes.map((est) => (
                        <TableRow key={est.studentId}>
                          <TableCell className="sticky left-0 z-10 bg-card">
                            <div className="space-y-1">
                              <p className="font-medium">{studentDisplayName(est)}</p>
                              {est.email ? (
                                <p className="text-xs text-muted-foreground">{est.email}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          {showFullGrid
                            ? actividades.map((act) => {
                                const nota = noteForSlide(est.notas, act.slideId);
                                const manual = isManualGradingActivityType(act.activityType);
                                const resultId = est.resultIdsPorSlide?.[act.slideId];
                                return (
                                  <TableCell key={act.slideId} className="text-center">
                                    {manual ? (
                                      docentePuedeEditarManual && resultId ? (
                                        <ManualGradeCell
                                          classId={selectedClassId}
                                          resultId={resultId}
                                          studentId={est.studentId}
                                          slideId={act.slideId}
                                          initialNote={nota}
                                        />
                                      ) : (
                                        <ReadOnlyManualGradeCell note={nota} />
                                      )
                                    ) : (
                                      <AutoGradeCell note={nota} />
                                    )}
                                  </TableCell>
                                );
                              })
                            : null}
                          <TableCell className="text-center">
                            {est.notaFinal != null && !Number.isNaN(est.notaFinal) ? (
                              <span className="text-base font-semibold tabular-nums">
                                {est.notaFinal.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-base font-semibold text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="sticky right-0 z-10 bg-card">
                            <div className="flex justify-center">
                              <GradeScaleBadge note={est.notaFinal} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="size-4 text-muted-foreground" />
                  Escala colombiana
                </CardTitle>
              </CardHeading>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <GradeScaleBadge note={2.5} />
                <GradeScaleBadge note={3.4} />
                <GradeScaleBadge note={4.3} />
                <GradeScaleBadge note={4.9} />
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Bajo:</span> 1.0 - 2.9
                </p>
                <p>
                  <span className="font-medium text-foreground">Básico:</span> 3.0 - 3.9
                </p>
                <p>
                  <span className="font-medium text-foreground">Alto:</span> 4.0 - 4.6
                </p>
                <p>
                  <span className="font-medium text-foreground">Superior:</span> 4.7 - 5.0
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
