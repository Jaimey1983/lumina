'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useCourses } from '@/hooks/api/use-courses';
import { useCoursePeriods } from '@/hooks/api/use-periods';
import {
  useGradebook,
  useCreateGradeEntry,
  useUpdateGradeEntry,
  type GradebookActivity,
  type GradebookStudent,
  type GradebookEntry,
} from '@/hooks/api/use-gradebook';
import { useGradeCalculation } from '@/hooks/api/use-grade-calculation';

import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
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
import { Textarea } from '@/components/ui/textarea';

// ─── Schema ───────────────────────────────────────────────────────────────────

function gradeSchema(maxScore: number) {
  return z.object({
    score: z
      .number({ message: 'La nota debe ser un número' })
      .min(0, 'La nota mínima es 0')
      .max(maxScore, `La nota máxima es ${maxScore}`),
    feedback: z.string().optional(),
  });
}
type GradeFormData = { score: number; feedback?: string };

// ─── Grade Entry Modal ─────────────────────────────────────────────────────────

function GradeEntryModal({
  open,
  onOpenChange,
  courseId,
  periodId,
  student,
  activity,
  existingEntry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  periodId: string;
  student: GradebookStudent | null;
  activity: GradebookActivity | null;
  existingEntry: GradebookEntry | null;
}) {
  const isEdit = !!existingEntry;
  const maxScore = activity?.maxScore ?? 100;

  const createMutation = useCreateGradeEntry(courseId, periodId);
  const updateMutation = useUpdateGradeEntry(courseId, periodId);

  const schema = gradeSchema(maxScore);
  const form = useForm<GradeFormData>({
    resolver: zodResolver(schema),
    defaultValues: { score: existingEntry?.score ?? 0, feedback: existingEntry?.feedback ?? '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        score: existingEntry?.score ?? 0,
        feedback: existingEntry?.feedback ?? '',
      });
    }
  }, [open, existingEntry, form]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  function onSubmit(data: GradeFormData) {
    if (isEdit && existingEntry) {
      updateMutation.mutate(
        { entryId: existingEntry.id, input: { score: data.score, feedback: data.feedback } },
        {
          onSuccess: () => {
            toast.success('Nota actualizada');
            onOpenChange(false);
          },
          onError: () => toast.error('Error al actualizar la nota'),
        },
      );
    } else {
      if (!student || !activity) return;
      createMutation.mutate(
        {
          studentId: student.id,
          activityId: activity.id,
          score: data.score,
          feedback: data.feedback,
        },
        {
          onSuccess: () => {
            toast.success('Nota registrada');
            onOpenChange(false);
          },
          onError: () => toast.error('Error al registrar la nota'),
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar nota' : 'Ingresar nota'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              {student && activity && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Estudiante:</span>{' '}
                    {student.name}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Actividad:</span>{' '}
                    {activity.name}{' '}
                    <span className="text-muted-foreground">(máx. {activity.maxScore})</span>
                  </p>
                </div>
              )}
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={maxScore}
                        step="0.1"
                        placeholder={`0 – ${maxScore}`}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Retroalimentación{' '}
                      <span className="font-normal text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Comentarios para el estudiante..."
                        className="resize-none"
                        rows={3}
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
                {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar nota'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Gradebook Table ───────────────────────────────────────────────────────────

function GradebookTable({
  students,
  activities,
  entries,
  onCellClick,
}: {
  students: GradebookStudent[];
  activities: GradebookActivity[];
  entries: GradebookEntry[];
  onCellClick: (student: GradebookStudent, activity: GradebookActivity, entry: GradebookEntry | null) => void;
}) {
  function getEntry(studentId: string, activityId: string): GradebookEntry | null {
    return entries.find((e) => e.studentId === studentId && e.activityId === activityId) ?? null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap min-w-[180px] sticky left-0 bg-card z-10">
              Estudiante
            </th>
            {activities.map((activity) => (
              <th
                key={activity.id}
                className="text-center px-3 py-3 font-medium text-muted-foreground whitespace-nowrap min-w-[110px]"
              >
                <div className="truncate max-w-[110px]" title={activity.name}>
                  {activity.name}
                </div>
                <div className="text-xs font-normal text-muted-foreground/70">
                  / {activity.maxScore}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
              <td className="px-4 py-3 font-medium whitespace-nowrap sticky left-0 bg-card z-10">
                {student.name}
              </td>
              {activities.map((activity) => {
                const entry = getEntry(student.id, activity.id);
                const hasScore = entry !== null && entry.score !== null;
                return (
                  <td key={activity.id} className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onCellClick(student, activity, entry)}
                      className={`
                        w-full min-w-[80px] rounded-md px-2 py-1.5 text-sm font-medium transition-colors
                        ${hasScore
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'text-muted-foreground hover:bg-muted border border-dashed border-border hover:border-solid hover:border-primary/30'
                        }
                      `}
                      title={`${student.name} — ${activity.name}`}
                    >
                      {hasScore ? entry!.score : '—'}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Grade Calculation Panel ───────────────────────────────────────────────────

function GradeCalculationPanel({
  courseId,
  periodId,
}: {
  courseId: string;
  periodId: string;
}) {
  const { data: rows = [], isLoading, isError } = useGradeCalculation(courseId, periodId);

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-sm text-destructive">
        No se pudo cargar el resumen de notas finales.
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No hay datos de notas finales aún.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estudiante</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Nota final</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.studentId} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
              <td className="px-4 py-3 font-medium">{row.studentName}</td>
              <td className="px-4 py-3 text-center font-semibold">
                {row.finalGrade !== null ? row.finalGrade : '—'}
              </td>
              <td className="px-4 py-3 text-center">
                {row.isComplete ? (
                  <Badge variant="success" appearance="light" className="inline-flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    Completo
                  </Badge>
                ) : (
                  <Badge variant="secondary" appearance="light" className="inline-flex items-center gap-1">
                    <XCircle className="size-3" />
                    Pendiente
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function GradebookClient() {
  const { data: courses = [], isLoading: coursesLoading } = useCourses();

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const { data: periods = [], isLoading: periodsLoading } = useCoursePeriods(selectedCourseId);

  const {
    data: gradebook,
    isLoading: gradebookLoading,
    isError: gradebookError,
  } = useGradebook(selectedCourseId, selectedPeriodId);

  // Auto-select first course
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Auto-select first period when periods load or course changes
  useEffect(() => {
    setSelectedPeriodId('');
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedPeriodId && periods.length > 0) {
      setSelectedPeriodId(periods[0].id);
    }
  }, [periods, selectedPeriodId]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStudent, setModalStudent] = useState<GradebookStudent | null>(null);
  const [modalActivity, setModalActivity] = useState<GradebookActivity | null>(null);
  const [modalEntry, setModalEntry] = useState<GradebookEntry | null>(null);

  function handleCellClick(
    student: GradebookStudent,
    activity: GradebookActivity,
    entry: GradebookEntry | null,
  ) {
    setModalStudent(student);
    setModalActivity(activity);
    setModalEntry(entry);
    setModalOpen(true);
  }

  const hasData = !!selectedCourseId && !!selectedPeriodId;
  const activities = gradebook?.activities ?? [];
  const students = gradebook?.students ?? [];
  const entries = gradebook?.entries ?? [];

  return (
    <div className="container py-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Calificaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registra y gestiona las notas de los estudiantes por período.
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="course-select" className="text-sm font-medium shrink-0">
            Curso:
          </label>
          {coursesLoading ? (
            <Skeleton className="h-8.5 w-52" />
          ) : courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay cursos disponibles.</p>
          ) : (
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
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

        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-sm font-medium shrink-0">
            Período:
          </label>
          {periodsLoading && selectedCourseId ? (
            <Skeleton className="h-8.5 w-44" />
          ) : !selectedCourseId ? (
            <p className="text-sm text-muted-foreground">Selecciona un curso primero.</p>
          ) : periods.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin períodos disponibles.</p>
          ) : (
            <select
              id="period-select"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="h-8.5 px-3 rounded-md border border-input bg-background text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground min-w-[11rem]"
            >
              <option value="" disabled>
                Selecciona un período
              </option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Error */}
      {gradebookError && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>No se pudo cargar el libro de calificaciones.</AlertTitle>
          </AlertContent>
        </Alert>
      )}

      {/* Gradebook Table */}
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Libro de notas</CardTitle>
          </CardHeading>
        </CardHeader>
        {!hasData ? (
          <CardContent>
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <BookOpen className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Selecciona un curso y un período para ver el libro de notas.
              </p>
            </div>
          </CardContent>
        ) : gradebookLoading ? (
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        ) : activities.length === 0 || students.length === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <BookOpen className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No hay actividades ni estudiantes registrados para este período.
              </p>
            </div>
          </CardContent>
        ) : (
          <GradebookTable
            students={students}
            activities={activities}
            entries={entries}
            onCellClick={handleCellClick}
          />
        )}
      </Card>

      {/* Grade Calculation Panel */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardHeading>
              <CardTitle>Notas finales</CardTitle>
            </CardHeading>
          </CardHeader>
          <GradeCalculationPanel courseId={selectedCourseId} periodId={selectedPeriodId} />
        </Card>
      )}

      {/* Grade Entry Modal */}
      <GradeEntryModal
        key={`${modalStudent?.id}-${modalActivity?.id}`}
        open={modalOpen}
        onOpenChange={setModalOpen}
        courseId={selectedCourseId}
        periodId={selectedPeriodId}
        student={modalStudent}
        activity={modalActivity}
        existingEntry={modalEntry}
      />
    </div>
  );
}
