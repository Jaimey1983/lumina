'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BookCheck,
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCourse } from '@/hooks/api/use-course';
import { useGradebookStructure } from '@/hooks/api/use-gradebook-structure';
import {
  useGradeCalculation,
  useGradeSheet,
  useSaveGradeSheetEntry,
  type GradeSheetActivity,
  type GradeSheetEntry,
} from '@/hooks/api/use-grade-calculation';
import { useCoursePeriods } from '@/hooks/api/use-periods';
import { cn } from '@/lib/utils';

function toFiveScale(score: number | null, maxScore: number) {
  if (score === null || Number.isNaN(score)) {
    return '';
  }

  if (maxScore <= 0) {
    return score.toFixed(1);
  }

  const scaled = (score / maxScore) * 5;
  return scaled.toFixed(1);
}

function fromFiveScale(score: number, maxScore: number) {
  if (maxScore <= 0) {
    return score;
  }

  return Number(((score / 5) * maxScore).toFixed(2));
}

function findEntry(entries: GradeSheetEntry[], studentId: string, activityId: string) {
  return entries.find((entry) => entry.studentId === studentId && entry.activityId === activityId) ?? null;
}

function getWeightStatus(totalWeight: number) {
  const rounded = Number(totalWeight.toFixed(2));
  const isValid = Math.abs(rounded - 0.9) < 0.001;
  return {
    rounded,
    isValid,
  };
}

function EditableGradeCell({
  activity,
  entry,
  studentId,
  onSave,
  disabled,
}: {
  activity: GradeSheetActivity;
  entry: GradeSheetEntry | null;
  studentId: string;
  onSave: (input: {
    entryId?: string;
    studentId: string;
    activityId: string;
    score: number;
  }) => Promise<void>;
  disabled: boolean;
}) {
  const [value, setValue] = useState(toFiveScale(entry?.score ?? null, activity.maxScore));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(toFiveScale(entry?.score ?? null, activity.maxScore));
  }, [activity.maxScore, entry?.id, entry?.score]);

  async function commitValue() {
    const trimmed = value.trim();

    if (!trimmed) {
      setValue(toFiveScale(entry?.score ?? null, activity.maxScore));
      return;
    }

    const numericValue = Number(trimmed);

    if (Number.isNaN(numericValue) || numericValue < 1 || numericValue > 5) {
      toast.error('La nota debe estar entre 1.0 y 5.0');
      setValue(toFiveScale(entry?.score ?? null, activity.maxScore));
      return;
    }

    const nextScore = fromFiveScale(numericValue, activity.maxScore);
    const currentScore = entry?.score ?? null;
    if (currentScore !== null && Math.abs(currentScore - nextScore) < 0.001) {
      setValue(numericValue.toFixed(1));
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        entryId: entry?.id,
        studentId,
        activityId: activity.id,
        score: nextScore,
      });
      setValue(numericValue.toFixed(1));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative min-w-24">
      <Input
        type="number"
        min={1}
        max={5}
        step="0.1"
        value={value}
        disabled={disabled || isSaving}
        className={cn(
          'h-9 text-center font-medium',
          isSaving && 'pr-8',
        )}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          void commitValue();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void commitValue();
          }

          if (event.key === 'Escape') {
            setValue(toFiveScale(entry?.score ?? null, activity.maxScore));
          }
        }}
      />
      {isSaving ? (
        <LoaderCircle className="absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

export function GradeBookClient({ courseId }: { courseId: string }) {
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: periods = [], isLoading: periodsLoading } = useCoursePeriods(courseId);
  const { data: structure, isLoading: structureLoading } = useGradebookStructure(courseId);

  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  useEffect(() => {
    if (!selectedPeriodId && periods[0]?.id) {
      setSelectedPeriodId(periods[0].id);
    }
  }, [periods, selectedPeriodId]);

  const activePeriodId = periods.some((period) => period.id === selectedPeriodId)
    ? selectedPeriodId
    : (periods[0]?.id ?? '');

  const {
    data: sheet,
    isLoading: sheetLoading,
    isError: sheetError,
  } = useGradeSheet(courseId, activePeriodId);
  const {
    data: calculations = [],
    isLoading: calculationsLoading,
    isError: calculationsError,
  } = useGradeCalculation(courseId, activePeriodId);
  const saveGradeMutation = useSaveGradeSheetEntry(courseId, activePeriodId);

  const students = sheet?.students ?? [];
  const activities = sheet?.activities ?? [];
  const entries = sheet?.entries ?? [];
  const finalGradeMap = new Map(
    calculations.map((row) => [
      row.studentId,
      { finalGrade: row.finalGrade, isComplete: row.isComplete, studentName: row.studentName },
    ]),
  );

  const totalWeight = structure?.aspects.reduce((sum, aspect) => sum + aspect.weight, 0) ?? 0;
  const weightStatus = getWeightStatus(totalWeight);

  async function handleSaveGrade(input: {
    entryId?: string;
    studentId: string;
    activityId: string;
    score: number;
  }) {
    try {
      await saveGradeMutation.mutateAsync(input);
      toast.success('Nota guardada');
    } catch {
      toast.error('No se pudo guardar la nota');
      throw new Error('save-grade-failed');
    }
  }

  const showEmptyState = !sheetLoading && !sheetError && students.length === 0;

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
              Registro de actividades en escala colombiana y promedio final institucional por estudiante.
            </p>
          </div>
        </div>

        <Card className="min-w-full lg:min-w-80 lg:max-w-sm">
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Curso
              </p>
              <p className="text-sm font-medium text-foreground">{course?.code ?? 'Sin codigo'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Período
              </p>
              <p className="text-sm font-medium text-foreground">
                {periods.find((period) => period.id === activePeriodId)?.name ?? 'Selecciona un período'}
              </p>
            </div>
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
                    <CardTitle>Planilla por curso</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Edita cada nota entre 1.0 y 5.0. Los cambios se guardan al salir de la celda o al presionar Enter.
                    </p>
                  </div>
                  <div className="w-full lg:w-64">
                    <Select value={activePeriodId} onValueChange={setSelectedPeriodId}>
                      <SelectTrigger>
                        <SelectValue placeholder={periodsLoading ? 'Cargando períodos...' : 'Selecciona un período'} />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeading>
            </CardHeader>
            <CardContent className="space-y-4">
              {!periodsLoading && periods.length === 0 ? (
                <Alert variant="destructive">
                  <AlertIcon>
                    <AlertTriangle className="size-4" />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>El curso no tiene períodos configurados.</AlertTitle>
                  </AlertContent>
                </Alert>
              ) : null}

              {sheetError ? (
                <Alert variant="destructive">
                  <AlertIcon>
                    <AlertTriangle className="size-4" />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>No se pudo cargar la planilla de notas.</AlertTitle>
                  </AlertContent>
                </Alert>
              ) : null}

              {sheetLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : null}

              {showEmptyState ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                  <NotebookPen className="size-9 text-muted-foreground/70" />
                  <div className="space-y-1">
                    <h3 className="font-medium">No hay estudiantes o actividades registradas</h3>
                    <p className="text-sm text-muted-foreground">
                      La planilla se llenará cuando el curso tenga estudiantes matriculados y actividades evaluables.
                    </p>
                  </div>
                </div>
              ) : null}

              {!sheetLoading && !sheetError && students.length > 0 ? (
                <Table className="min-w-max">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-20 min-w-56 bg-card">Estudiante</TableHead>
                      {activities.map((activity) => (
                        <TableHead key={activity.id} className="min-w-32 text-center">
                          <div className="space-y-1">
                            <p className="line-clamp-2 font-medium text-foreground">{activity.name}</p>
                            <p className="text-xs text-muted-foreground">Escala 1.0 a 5.0</p>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="sticky right-0 z-20 min-w-44 bg-card text-center">Promedio final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const finalRow = finalGradeMap.get(student.id);

                      return (
                        <TableRow key={student.id}>
                          <TableCell className="sticky left-0 z-10 bg-card">
                            <div className="space-y-1">
                              <p className="font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </div>
                          </TableCell>

                          {activities.map((activity) => {
                            const entry = findEntry(entries, student.id, activity.id);

                            return (
                              <TableCell key={activity.id} className="text-center">
                                <EditableGradeCell
                                  activity={activity}
                                  entry={entry}
                                  studentId={student.id}
                                  disabled={!activePeriodId || saveGradeMutation.isPending}
                                  onSave={handleSaveGrade}
                                />
                              </TableCell>
                            );
                          })}

                          <TableCell className="sticky right-0 z-10 bg-card text-center">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-base font-semibold">
                                {finalRow?.finalGrade !== null && finalRow?.finalGrade !== undefined
                                  ? finalRow.finalGrade.toFixed(1)
                                  : '--'}
                              </span>
                              <GradeScaleBadge note={finalRow?.finalGrade} />
                              <span className="text-xs text-muted-foreground">
                                {finalRow?.isComplete ? 'Completo' : 'Pendiente'}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
                <p><span className="font-medium text-foreground">Bajo:</span> 1.0 - 2.9</p>
                <p><span className="font-medium text-foreground">Basico:</span> 3.0 - 3.9</p>
                <p><span className="font-medium text-foreground">Alto:</span> 4.0 - 4.6</p>
                <p><span className="font-medium text-foreground">Superior:</span> 4.7 - 5.0</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardHeading>
                <CardTitle className="flex items-center gap-2">
                  <BookCheck className="size-4 text-muted-foreground" />
                  Estructura institucional
                </CardTitle>
              </CardHeading>
            </CardHeader>
            <CardContent className="space-y-4">
              {structureLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : null}

              {!structureLoading && (structure?.aspects.length ?? 0) > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {structure?.aspects.map((aspect) => (
                      <Badge key={aspect.id} variant="secondary" appearance="outline" className="gap-2">
                        <span>{aspect.name}</span>
                        <span className="font-semibold text-foreground">{aspect.weight.toFixed(2)}</span>
                      </Badge>
                    ))}
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Suma de aspectos evaluativos</span>
                      <span className="font-semibold text-foreground">{weightStatus.rounded.toFixed(2)}</span>
                    </div>
                  </div>

                  {!weightStatus.isValid ? (
                    <Alert variant="destructive">
                      <AlertIcon>
                        <AlertTriangle className="size-4" />
                      </AlertIcon>
                      <AlertContent>
                        <AlertTitle>
                          Los aspectos deben sumar exactamente 0.90. El 0.10 restante se reserva para autoevaluacion y coevaluacion.
                        </AlertTitle>
                      </AlertContent>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertIcon>
                        <BookCheck className="size-4" />
                      </AlertIcon>
                      <AlertContent>
                        <AlertTitle>
                          Configuracion valida: 0.90 en aspectos + 0.05 autoevaluacion + 0.05 coevaluacion.
                        </AlertTitle>
                      </AlertContent>
                    </Alert>
                  )}
                </>
              ) : null}

              {!structureLoading && (structure?.aspects.length ?? 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Este curso aun no tiene estructura institucional configurada para la planilla.
                </div>
              ) : null}
            </CardContent>
          </Card>

          {calculationsError ? (
            <Alert variant="destructive">
              <AlertIcon>
                <AlertTriangle className="size-4" />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>No se pudo cargar el calculo final de notas.</AlertTitle>
              </AlertContent>
            </Alert>
          ) : null}

          {calculationsLoading ? (
            <Card>
              <CardContent className="space-y-3 pt-5">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-4/6" />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}