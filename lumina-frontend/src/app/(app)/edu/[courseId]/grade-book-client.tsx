'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calculator,
  Loader2,
  NotebookPen,
} from 'lucide-react';
import { toast } from 'sonner';

import { GradeScaleBadge, getColombianGradeScale } from '@/components/grade-scale-badge';
import { Alert, AlertContent, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { PageBanner } from '@/components/ui/page-banner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useAutonomousResults, useUpdateAutonomousScore } from '@/hooks/api/use-autonomous-results';
import { useAutonomousSessions } from '@/hooks/api/use-autonomous-sessions';
import { useClass } from '@/hooks/api/use-class';
import { useClasses } from '@/hooks/api/use-classes';
import { useCourse } from '@/hooks/api/use-course';
import {
  useGradebook,
  computeStudentPromedio,
  normalizeFromRows,
  type ApiGradebookRow,
  type ClassGradebookActividad,
  type ClassGradebookData,
  type ClassGradebookEstudiante,
} from '@/hooks/use-gradebook';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/helpers';
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
  clasificar: 'Clasificar',
  puzzle_imagen: 'Puzzle de imagen',
  anagrama: 'Anagrama',
  puzzle_palabras: 'Puzzle de palabras',
  crucigrama: 'Crucigrama',
  sopa_letras: 'Sopa de letras',
  globos: 'Globos',
  topo: 'Topo',
  abrir_caja: 'Abrir la caja',
  historia_ramificada: 'Historia ramificada',
  memoria: 'Memoria',
  ahorcado: 'Ahorcado',
};

function abbreviateActivityType(activityType: string) {
  return ACTIVITY_LABEL[activityType] ?? activityType;
}

// colombianNoteColorClass eliminada — Lumina 2.1: color solo en badges, no en celdas numéricas

function performanceBadgeClassName(note: number | null | undefined) {
  const level = getColombianGradeScale(note)?.level;
  if (level === 'Superior') return 'border-0 bg-[#dcfce7] text-[#16a34a]';
  if (level === 'Alto') return 'border-0 bg-[#dbeafe] text-[#2563EB]';
  if (level === 'Basico') return 'border-0 bg-[#fef3c7] text-[#d97706]';
  if (level === 'Bajo') return 'border-0 bg-[#fee2e2] text-[#f87171]';
  return 'border-0 bg-[#f9fafb] text-[#6b7280]';
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

type GradeSheetTab = 'live' | 'autonomous';

function AutoGradeCell({ note }: { note: number | null }) {
  if (note === null) {
    return <span className="text-[#9ca3af]">—</span>;
  }
  return (
    <span className="inline-flex min-w-12 justify-center text-sm tabular-nums text-[#111827]">
      {note.toFixed(1)}
    </span>
  );
}

function ReadOnlyManualGradeCell({ note }: { note: number | null }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-16 justify-center rounded-lg border border-[#2563EB]/30 border-l-2 border-l-[#2563EB] bg-white px-2 py-1.5 text-sm font-bold tabular-nums text-[#2563EB]',
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
          const manualPorSlide = { ...(e.manualPorSlide ?? {}), [slideId]: true };
          const notaFinal = computeStudentPromedio(
            old.actividades,
            notas,
            manualPorSlide,
          );
          return { ...e, notas, manualPorSlide, notaFinal };
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
            'inline-flex h-9 min-w-16 items-center justify-center rounded-lg border border-[#2563EB]/30 border-l-2 border-l-[#2563EB] bg-white px-2 text-sm font-bold tabular-nums text-[#2563EB] transition-colors hover:bg-[#f9fafb]',
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
          'h-9 w-16 rounded-lg border border-[#2563EB] bg-white text-center text-sm font-bold tabular-nums text-[#2563EB] ring-2 ring-[#dbeafe] [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          invalid && 'border-[#f87171] ring-2 ring-[#fee2e2]',
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
        <Loader2 className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#6b7280]" />
      ) : null}
    </div>
  );
}

function AutonomousManualGradeCell({
  sessionId,
  progressId,
  studentId,
  slideId,
  initialNote,
}: {
  sessionId: string;
  progressId: string;
  studentId: string;
  slideId: string;
  initialNote: number | null;
}) {
  const updateScore = useUpdateAutonomousScore(sessionId);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false);
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

  const commit = useCallback(async () => {
    if (savingRef.current || updateScore.isPending) return;
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
    try {
      await updateScore.mutateAsync({ progressId, score });
      setIsEditing(false);
    } catch {
      toast.error('No se pudo guardar la nota');
    } finally {
      savingRef.current = false;
    }
  }, [draft, initialNote, progressId, updateScore]);

  const openEdit = useCallback(() => {
    setDraft(
      initialNote != null && !Number.isNaN(initialNote) ? initialNote.toFixed(1) : '',
    );
    setInvalid(false);
    setIsEditing(true);
  }, [initialNote]);

  const isSaving = updateScore.isPending;

  if (!isEditing) {
    return (
      <div className="relative inline-flex justify-center">
        <button
          type="button"
          disabled={isSaving}
          onClick={openEdit}
          className={cn(
            'inline-flex h-9 min-w-16 items-center justify-center rounded-lg border border-[#2563EB]/30 border-l-2 border-l-[#2563EB] bg-white px-2 text-sm font-bold tabular-nums text-[#2563EB] transition-colors hover:bg-[#f9fafb]',
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
          'h-9 w-16 rounded-lg border border-[#2563EB] bg-white text-center text-sm font-bold tabular-nums text-[#2563EB] ring-2 ring-[#dbeafe] [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          invalid && 'border-[#f87171] ring-2 ring-[#fee2e2]',
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
        <Loader2 className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-[#6b7280]" />
      ) : null}
    </div>
  );
}

function SessionGradebookTable({
  classId,
  actividades,
  estudiantes,
  showFullGrid,
  isFetching,
  autonomousSessionId,
  docentePuedeEditarManual,
  slideColumnTitle,
}: {
  classId: string;
  actividades: ClassGradebookActividad[];
  estudiantes: ClassGradebookEstudiante[];
  showFullGrid: boolean;
  isFetching: boolean;
  /** Si está definido, las notas manuales usan PATCH de progreso autónomo. */
  autonomousSessionId?: string;
  docentePuedeEditarManual: boolean;
  slideColumnTitle: (slideId: string, index: number) => string;
}) {
  return (
    <div className="relative overflow-x-auto">
      {isFetching ? (
        <div className="absolute inset-0 z-10 flex items-start justify-end pt-1 pr-1">
          <Loader2 className="size-5 animate-spin text-[#6b7280]" aria-hidden />
        </div>
      ) : null}
      <Table className="min-w-max">
        <TableHeader>
          <TableRow className="h-[var(--lumina-table-header-height)] border-[--lumina-divider] bg-[var(--lumina-table-header-bg)] hover:bg-[var(--lumina-table-header-bg)]">
            <TableHead className="sticky left-0 z-20 h-[var(--lumina-table-header-height)] min-w-56 bg-[var(--lumina-table-header-bg)] px-4 py-2 text-xs font-medium text-[#6b7280]">
              Estudiante
            </TableHead>
            {showFullGrid
              ? actividades.map((act, idx) => (
                  <TableHead
                    key={act.slideId}
                    className="h-[var(--lumina-table-header-height)] max-w-40 px-4 py-2 text-center text-xs font-medium text-[#6b7280]"
                  >
                    <span
                      className="line-clamp-2 font-medium leading-tight"
                      title={slideColumnTitle(act.slideId, idx)}
                    >
                      {slideColumnTitle(act.slideId, idx)}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium tracking-normal text-[#9ca3af]">
                      {abbreviateActivityType(act.activityType)}
                    </span>
                  </TableHead>
                ))
              : null}
            <TableHead className="h-[var(--lumina-table-header-height)] min-w-28 px-4 py-2 text-center text-xs font-medium text-[#6b7280]">
              Promedio final
            </TableHead>
            <TableHead className="sticky right-0 z-20 h-[var(--lumina-table-header-height)] min-w-36 bg-[var(--lumina-table-header-bg)] px-4 py-2 text-center text-xs font-medium text-[#6b7280]">
              Desempeño
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estudiantes.map((est, rowIdx) => {
            const rowStripe = rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#f0f9ff]';
            return (
              <TableRow
                key={est.studentId}
                className="group h-[var(--lumina-table-row-height)] border-b border-[--lumina-divider]"
              >
                <TableCell
                  className={cn(
                    'sticky left-0 z-10 border-b border-[--lumina-divider] px-4 py-2',
                    rowStripe,
                    'group-hover:bg-[#f9fafb]',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#60a5fa] to-[#60A5FA] text-xs font-bold text-white">
                      {getInitials(studentDisplayName(est), 2)}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium text-[#111827]">{studentDisplayName(est)}</p>
                        {est.source === 'autonomous' ? (
                          <span className="inline-flex shrink-0 rounded-lumina-sm bg-[#dbeafe] px-1.5 py-0.5 text-xs font-medium text-[#2563EB]">
                            Recuperación
                          </span>
                        ) : null}
                      </div>
                      {est.email ? (
                        <p className="truncate text-xs text-[#6b7280]">{est.email}</p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                {showFullGrid
                  ? actividades.map((act) => {
                      const nota = noteForSlide(est.notas, act.slideId);
                      const manual = isManualGradingActivityType(act.activityType);
                      const resultId = est.resultIdsPorSlide?.[act.slideId];
                      const useReadonlyManual =
                        !docentePuedeEditarManual || !resultId;
                      return (
                        <TableCell
                          key={act.slideId}
                          className={cn(
                            'border-b border-[--lumina-divider] px-4 py-2 text-center',
                            rowStripe,
                            'group-hover:bg-[#f9fafb]',
                          )}
                        >
                          {est.source === 'autonomous' ? (
                            <span className="text-[#9ca3af]">—</span>
                          ) : autonomousSessionId ? (
                            manual ? (
                              useReadonlyManual ? (
                                <ReadOnlyManualGradeCell note={nota} />
                              ) : (
                                <AutonomousManualGradeCell
                                  sessionId={autonomousSessionId}
                                  progressId={resultId!}
                                  studentId={est.studentId}
                                  slideId={act.slideId}
                                  initialNote={nota}
                                />
                              )
                            ) : (
                              <AutoGradeCell note={nota} />
                            )
                          ) : manual ? (
                            useReadonlyManual ? (
                              <ReadOnlyManualGradeCell note={nota} />
                            ) : (
                              <ManualGradeCell
                                classId={classId}
                                resultId={resultId!}
                                studentId={est.studentId}
                                slideId={act.slideId}
                                initialNote={nota}
                              />
                            )
                          ) : (
                            <AutoGradeCell note={nota} />
                          )}
                        </TableCell>
                      );
                    })
                  : null}
                <TableCell
                  className={cn(
                    'border-b border-[--lumina-divider] px-4 py-2 text-center',
                    rowStripe,
                    'group-hover:bg-[#f9fafb]',
                  )}
                >
                  {est.notaFinal != null && !Number.isNaN(est.notaFinal) ? (
                    <span className="text-base font-semibold tabular-nums text-[#111827]">
                      {est.notaFinal.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-base font-semibold text-[#9ca3af]">—</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    'sticky right-0 z-10 border-b border-[--lumina-divider] px-4 py-2',
                    rowStripe,
                    'group-hover:bg-[#f9fafb]',
                  )}
                >
                  <div className="flex justify-center">
                    <GradeScaleBadge
                      note={est.notaFinal}
                      className={performanceBadgeClassName(est.notaFinal)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
  const [gradeSheetTab, setGradeSheetTab] = useState<GradeSheetTab>('live');
  const [selectedAutonomousSessionId, setSelectedAutonomousSessionId] = useState('');

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

  const {
    data: autonomousSessionsRaw = [],
    isLoading: autonomousSessionsLoading,
    isError: autonomousSessionsError,
  } = useAutonomousSessions(selectedClassId, { enabled: gradeSheetTab === 'autonomous' });

  const independentSessions = useMemo(() => {
    return autonomousSessionsRaw.filter((s) => {
      const purpose = s.purpose ?? 'independent';
      if (purpose !== 'independent') return false;
      return s.status === 'closed' || s.status === 'open';
    });
  }, [autonomousSessionsRaw]);

  useEffect(() => {
    setSelectedAutonomousSessionId((prev) => {
      if (prev && independentSessions.some((x) => x.id === prev)) return prev;
      return independentSessions[0]?.id ?? '';
    });
  }, [independentSessions]);

  const {
    data: autonomousResults = [],
    isLoading: autonomousResultsLoading,
    isError: autonomousResultsError,
  } = useAutonomousResults(
    gradeSheetTab === 'autonomous' && selectedAutonomousSessionId
      ? selectedAutonomousSessionId
      : undefined,
  );

  const autonomousApiRows: ApiGradebookRow[] = useMemo(
    () =>
      autonomousResults.map((r) => ({
        studentId: r.studentId,
        nombre: r.studentName,
        promedio: r.score,
        resultados: r.resultados,
      })),
    [autonomousResults],
  );

  const autonomousGradebookData = useMemo(
    () => normalizeFromRows(autonomousApiRows),
    [autonomousApiRows],
  );

  const autonomousEstudiantesSorted = useMemo(() => {
    const e = autonomousGradebookData.estudiantes;
    return [...e].sort((a, b) =>
      studentDisplayName(a).localeCompare(studentDisplayName(b), 'es', { sensitivity: 'base' }),
    );
  }, [autonomousGradebookData]);

  const actividadesAutonomas = autonomousGradebookData.actividades;
  const showFullGridAutonomous =
    autonomousEstudiantesSorted.length > 0 && actividadesAutonomas.length > 0;
  const showPromedioOnlyAutonomous =
    autonomousEstudiantesSorted.length > 0 && actividadesAutonomas.length === 0;

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

  const nombreClase =
    classDetail?.title?.trim() ||
    course?.name ||
    (courseLoading ? 'Cargando…' : 'Planilla de notas');
  const nombreCurso = course?.name?.trim() || (courseLoading ? 'Cargando…' : '—');
  const estudiantesCountDisplay =
    gradebook != null && !gradebookLoading
      ? String(estudiantes.length)
      : selectedClassId && gradebookLoading
        ? '…'
        : '—';

  return (
    <div className="w-full flex flex-col gap-0 pb-6">
      <div className="px-6 pt-4">
        <Link
          href="/edu"
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#6b7280] no-underline transition-all duration-150 ease-in-out hover:bg-[#eff6ff] hover:text-[#2563EB]"
        >
          <ArrowLeft className="size-4 shrink-0" />
          Volver a cursos
        </Link>
      </div>

      <PageBanner
        title="Lumina Edu — Planilla"
        subtitle={`${nombreCurso} · Escala colombiana 1.0–5.0`}
        action={
          <button
            type="button"
            className="rounded-lg border border-white/50 bg-transparent px-4 py-1.5 text-[0.75rem] font-extrabold text-white hover:bg-white/10"
          >
            Exportar
          </button>
        }
      />

      <div className="px-6 pt-4 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <p className="text-xs font-medium text-[#6b7280]">
            {nombreClase} · {estudiantesCountDisplay} estudiantes
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            {course?.code ? (
              <p className="text-xs font-medium text-[#6b7280]">Curso {course.code}</p>
            ) : null}
            {showClassSelect ? (
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={classesLoading || classes.length === 0}
              >
                <SelectTrigger className="w-full min-w-[12rem] border-[#e5e7eb] bg-white sm:w-64">
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
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-lumina-sm">
          <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-[#6b7280]" />
              <h2 className="text-sm font-bold text-[#1e1b4b]">Planilla por clase</h2>
            </div>
          </div>
          {!classesLoading && classes.length > 0 && selectedClassId ? (
            <div className="flex border-b border-[#e5e7eb] px-2" role="tablist" aria-label="Vista de planilla">
              <button
                type="button"
                role="tab"
                aria-selected={gradeSheetTab === 'live'}
                onClick={() => setGradeSheetTab('live')}
                className={cn(
                  'rounded-none border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  gradeSheetTab === 'live'
                    ? 'border-[#2563EB] text-[#111827]'
                    : 'border-transparent text-[#6b7280] hover:bg-[#f9fafb]',
                )}
              >
                Clase en vivo
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={gradeSheetTab === 'autonomous'}
                onClick={() => setGradeSheetTab('autonomous')}
                className={cn(
                  'rounded-none border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  gradeSheetTab === 'autonomous'
                    ? 'border-[#2563EB] text-[#111827]'
                    : 'border-transparent text-[#6b7280] hover:bg-[#f9fafb]',
                )}
              >
                Tareas autónomas
              </button>
            </div>
          ) : null}
          <div className="space-y-4 p-4">
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
              <Alert className="border-[#e5e7eb] bg-[#f0f9ff]">
                <AlertIcon>
                  <NotebookPen className="size-4 text-[#6b7280]" />
                </AlertIcon>
                <AlertContent>
                  <AlertTitle className="text-[#1e1b4b]">Este curso no tiene clases todavía.</AlertTitle>
                </AlertContent>
              </Alert>
            ) : null}

            {classesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-[#6b7280]" />
              </div>
            ) : null}

            {!classesLoading && classes.length > 0 && selectedClassId && gradeSheetTab === 'live' ? (
              <>
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
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-[#6b7280]" />
              </div>
            ) : null}

            {noHayResultados ? (
              <div className="py-20 text-center">
                <p className="font-medium text-[#6b7280]">No hay resultados registrados aún</p>
              </div>
            ) : null}

            {showFullGrid || showPromedioOnly ? (
              <SessionGradebookTable
                classId={selectedClassId}
                actividades={actividades}
                estudiantes={estudiantes}
                showFullGrid={showFullGrid}
                isFetching={gradebookFetching}
                docentePuedeEditarManual={docentePuedeEditarManual}
                slideColumnTitle={slideColumnTitle}
              />
            ) : null}
              </>
            ) : null}

            {!classesLoading && classes.length > 0 && selectedClassId && gradeSheetTab === 'autonomous' ? (
              <>
                {autonomousSessionsError ? (
                  <Alert variant="destructive">
                    <AlertIcon>
                      <AlertTriangle className="size-4" />
                    </AlertIcon>
                    <AlertContent>
                      <AlertTitle>No se pudieron cargar las tareas autónomas.</AlertTitle>
                    </AlertContent>
                  </Alert>
                ) : null}

                {autonomousSessionsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-8 animate-spin text-[#6b7280]" />
                  </div>
                ) : independentSessions.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-sm font-medium text-[#6b7280]">
                      No hay tareas independientes para esta clase
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {independentSessions.length > 1 ? (
                      <div className="max-w-md">
                        <Select
                          value={selectedAutonomousSessionId}
                          onValueChange={setSelectedAutonomousSessionId}
                        >
                          <SelectTrigger className="w-full border-[#e5e7eb] bg-white">
                            <SelectValue placeholder="Selecciona una sesión" />
                          </SelectTrigger>
                          <SelectContent>
                            {independentSessions.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                Tarea ·{' '}
                                {new Date(s.opensAt).toLocaleDateString('es-CO', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}
                    {autonomousResultsError ? (
                      <Alert variant="destructive">
                        <AlertIcon>
                          <AlertTriangle className="size-4" />
                        </AlertIcon>
                        <AlertContent>
                          <AlertTitle>No se pudieron cargar los resultados de la sesión.</AlertTitle>
                        </AlertContent>
                      </Alert>
                    ) : null}
                    {!selectedAutonomousSessionId ? null : autonomousResultsLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="size-8 animate-spin text-[#6b7280]" />
                      </div>
                    ) : autonomousResults.length === 0 ? (
                      <div className="py-16 text-center">
                        <p className="text-sm font-medium text-[#6b7280]">
                          No hay tareas independientes para esta clase
                        </p>
                      </div>
                    ) : showFullGridAutonomous || showPromedioOnlyAutonomous ? (
                      <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
                        <SessionGradebookTable
                          classId={selectedClassId}
                          actividades={actividadesAutonomas}
                          estudiantes={autonomousEstudiantesSorted}
                          showFullGrid={showFullGridAutonomous}
                          isFetching={false}
                          autonomousSessionId={selectedAutonomousSessionId}
                          docentePuedeEditarManual={docentePuedeEditarManual}
                          slideColumnTitle={slideColumnTitle}
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>

        <div className="h-fit overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1e1b4b]">
            <Calculator className="size-4 text-[#6b7280]" />
            Escala de valoración
          </h3>
          <div className="flex flex-wrap gap-2">
            <GradeScaleBadge note={2.5} className={performanceBadgeClassName(2.5)} />
            <GradeScaleBadge note={3.4} className={performanceBadgeClassName(3.4)} />
            <GradeScaleBadge note={4.3} className={performanceBadgeClassName(4.3)} />
            <GradeScaleBadge note={4.9} className={performanceBadgeClassName(4.9)} />
          </div>
          <div className="mt-4 grid gap-2 text-sm text-[#6b7280]">
            <p>
              <span className="font-semibold text-[#1e1b4b]">Bajo:</span> 1.0 - 2.9
            </p>
            <p>
              <span className="font-semibold text-[#1e1b4b]">Básico:</span> 3.0 - 3.9
            </p>
            <p>
              <span className="font-semibold text-[#1e1b4b]">Alto:</span> 4.0 - 4.6
            </p>
            <p>
              <span className="font-semibold text-[#1e1b4b]">Superior:</span> 4.7 - 5.0
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
