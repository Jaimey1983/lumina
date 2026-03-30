'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCoursePeriods } from '@/hooks/api/use-periods';
import {
  useGradebookStructure,
  useCreateGradebookStructure,
} from '@/hooks/api/use-gradebook-structure';
import {
  useAchievements,
  useCreateAchievement,
  useUpdateAchievement,
  useDeleteAchievement,
  type Achievement,
  type PerformanceIndicator,
  type CourseActivity,
  type CreateAchievementInput,
  type UpdateAchievementInput,
} from '@/hooks/api/use-achievements';
import { useUpdatePerformanceIndicator } from '@/hooks/api/use-performance-indicators';
import {
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  type CreateActivityInput,
  type UpdateActivityInput,
} from '@/hooks/api/use-activities';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPETENCE_ABBR: Record<string, string> = {
  COGNITIVE: 'COG',
  METHODOLOGICAL: 'MET',
  INTERPERSONAL: 'INT',
  INSTRUMENTAL: 'INS',
};

const COMPETENCE_LABEL: Record<string, string> = {
  COGNITIVE: 'Cognitivo',
  METHODOLOGICAL: 'Metodológico',
  INTERPERSONAL: 'Interpersonal',
  INSTRUMENTAL: 'Instrumental',
};

const COMPETENCE_VARIANT: Record<
  string,
  'primary' | 'success' | 'warning' | 'info'
> = {
  COGNITIVE: 'primary',
  METHODOLOGICAL: 'success',
  INTERPERSONAL: 'warning',
  INSTRUMENTAL: 'info',
};

const SCOPE_LABEL: Record<string, string> = {
  SPECIFIC: 'Específico',
  SUBJECT: 'Materia',
  GENERAL: 'General',
};

// ─── Modal state union ────────────────────────────────────────────────────────

type ModalState =
  | { type: 'create-achievement'; aspectId: string }
  | { type: 'edit-achievement'; achievement: Achievement; aspectId: string }
  | { type: 'edit-indicator'; indicator: PerformanceIndicator; aspectId: string }
  | { type: 'create-activity'; indicator: PerformanceIndicator; aspectId: string }
  | { type: 'edit-activity'; activity: CourseActivity; aspectId: string }
  | null;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const achievementSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  statement: z.string().min(1, 'El enunciado es obligatorio'),
  periodId: z.string().optional(),
  scope: z.enum(['SPECIFIC', 'SUBJECT', 'GENERAL']),
});
type AchievementFormData = z.infer<typeof achievementSchema>;

const indicatorSchema = z.object({
  statement: z.string().min(1, 'El enunciado es obligatorio'),
});
type IndicatorFormData = z.infer<typeof indicatorSchema>;

const activitySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  weight: z
    .number({ message: 'Debe ser un número' })
    .min(0, 'Mínimo 0')
    .max(1, 'Máximo 1'),
  maxScore: z
    .number({ message: 'Debe ser un número' })
    .min(0, 'Mínimo 0'),
});
type ActivityFormData = z.infer<typeof activitySchema>;

// ─── Achievement Modal ────────────────────────────────────────────────────────

function AchievementModal({
  courseId,
  modal,
  periods,
  onClose,
}: {
  courseId: string;
  modal: Extract<ModalState, { type: 'create-achievement' | 'edit-achievement' }>;
  periods: { id: string; name: string }[];
  onClose: () => void;
}) {
  const isEdit = modal.type === 'edit-achievement';
  const achievement = isEdit ? modal.achievement : null;

  const createMutation = useCreateAchievement(courseId, modal.aspectId);
  const updateMutation = useUpdateAchievement(courseId, modal.aspectId);

  const form = useForm<AchievementFormData>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      code: achievement?.code ?? '',
      statement: achievement?.statement ?? '',
      periodId: achievement?.periodId ?? '',
      scope: achievement?.scope ?? 'SPECIFIC',
    },
  });

  function onSubmit(data: AchievementFormData) {
    const periodId = data.periodId?.trim() || undefined;

    if (isEdit && achievement) {
      const input: UpdateAchievementInput = {
        code: data.code,
        statement: data.statement,
        scope: data.scope,
        ...(periodId ? { periodId } : {}),
      };
      updateMutation.mutate(
        { id: achievement.id, input },
        {
          onSuccess: () => { toast.success('Logro actualizado'); onClose(); },
          onError: () => toast.error('Error al actualizar el logro'),
        },
      );
    } else {
      const input: CreateAchievementInput = {
        code: data.code,
        statement: data.statement,
        scope: data.scope,
        aspectId: modal.aspectId,
        ...(periodId ? { periodId } : {}),
      };
      createMutation.mutate(input, {
        onSuccess: () => {
          toast.success('Logro creado — indicadores generados automáticamente');
          onClose();
        },
        onError: () => toast.error('Error al crear el logro'),
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar logro' : 'Nuevo logro'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alcance</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground"
                          {...field}
                        >
                          <option value="SPECIFIC">Específico</option>
                          <option value="SUBJECT">Materia</option>
                          <option value="GENERAL">General</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enunciado</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-[0.8125rem] shadow-xs placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring resize-none"
                        placeholder="El estudiante demuestra..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {periods.length > 0 && (
                <FormField
                  control={form.control}
                  name="periodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                      <FormControl>
                        <select
                          className="flex h-8.5 w-full rounded-md border border-input bg-background px-3 text-[0.8125rem] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-ring/30 focus:border-ring text-foreground"
                          {...field}
                        >
                          <option value="">Sin período</option>
                          {periods.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!isEdit && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  La IA generará automáticamente los 4 indicadores de logro (COG, MET, INT, INS) al crear este logro.
                </p>
              )}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (isEdit ? 'Guardando…' : 'Creando…') : (isEdit ? 'Guardar' : 'Crear logro')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Indicator Modal ──────────────────────────────────────────────────────────

function IndicatorModal({
  courseId,
  modal,
  onClose,
}: {
  courseId: string;
  modal: Extract<ModalState, { type: 'edit-indicator' }>;
  onClose: () => void;
}) {
  const updateMutation = useUpdatePerformanceIndicator(courseId, modal.aspectId);

  const form = useForm<IndicatorFormData>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: { statement: modal.indicator.statement },
  });

  function onSubmit(data: IndicatorFormData) {
    updateMutation.mutate(
      { id: modal.indicator.id, input: { statement: data.statement } },
      {
        onSuccess: () => { toast.success('Indicador actualizado'); onClose(); },
        onError: () => toast.error('Error al actualizar el indicador'),
      },
    );
  }

  const ct = modal.indicator.competenceType;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar indicador
            <Badge variant={COMPETENCE_VARIANT[ct] ?? 'secondary'} appearance="light" size="sm">
              {COMPETENCE_ABBR[ct] ?? ct}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <FormField
                control={form.control}
                name="statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enunciado</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-[0.8125rem] shadow-xs placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Activity Modal ───────────────────────────────────────────────────────────

function ActivityModal({
  courseId,
  modal,
  onClose,
}: {
  courseId: string;
  modal: Extract<ModalState, { type: 'create-activity' | 'edit-activity' }>;
  onClose: () => void;
}) {
  const isEdit = modal.type === 'edit-activity';
  const activity = isEdit ? modal.activity : null;

  const createMutation = useCreateActivity(courseId, modal.aspectId);
  const updateMutation = useUpdateActivity(courseId, modal.aspectId);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: activity?.name ?? '',
      weight: activity?.weight ?? 0.1,
      maxScore: activity?.maxScore ?? 10,
    },
  });

  function onSubmit(data: ActivityFormData) {
    if (isEdit && activity) {
      const input: UpdateActivityInput = { name: data.name, weight: data.weight, maxScore: data.maxScore };
      updateMutation.mutate(
        { id: activity.id, input },
        {
          onSuccess: () => { toast.success('Actividad actualizada'); onClose(); },
          onError: () => toast.error('Error al actualizar la actividad'),
        },
      );
    } else {
      const indicatorId = (modal as Extract<ModalState, { type: 'create-activity' }>).indicator.id;
      const input: CreateActivityInput = {
        name: data.name,
        weight: data.weight,
        maxScore: data.maxScore,
        performanceIndicatorId: indicatorId,
      };
      createMutation.mutate(input, {
        onSuccess: () => { toast.success('Actividad creada'); onClose(); },
        onError: () => toast.error('Error al crear la actividad'),
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar actividad' : 'Nueva actividad'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Taller 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (0–1)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={1}
                          placeholder="0.30"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota máxima</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          min={0}
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando…' : (isEdit ? 'Guardar' : 'Crear actividad')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({
  activity,
  onEdit,
  onDelete,
}: {
  activity: CourseActivity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/40 group">
      <div className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0 ml-1" />
      <div className="flex-1 min-w-0">
        <span className="text-sm">{activity.name}</span>
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        peso: {activity.weight} · max: {activity.maxScore}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="size-6" onClick={onEdit} title="Editar">
          <Pencil className="size-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-6 text-destructive hover:text-destructive"
          onClick={onDelete}
          title="Eliminar"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Indicator Row ────────────────────────────────────────────────────────────

function IndicatorRow({
  indicator,
  aspectId,
  courseId,
  onEdit,
  onAddActivity,
}: {
  indicator: PerformanceIndicator;
  aspectId: string;
  courseId: string;
  onEdit: () => void;
  onAddActivity: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const deleteMutation = useDeleteActivity(courseId, aspectId);

  const activities = indicator.activities ?? [];
  const ct = indicator.competenceType;

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {/* Indicator header */}
      <div
        className="flex items-start gap-3 px-3 py-2.5 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
        <Badge
          variant={COMPETENCE_VARIANT[ct] ?? 'secondary'}
          appearance="light"
          size="sm"
          title={COMPETENCE_LABEL[ct]}
          className="shrink-0"
        >
          {COMPETENCE_ABBR[ct] ?? ct}
        </Badge>
        <p className="text-sm flex-1 leading-snug">{indicator.statement}</p>
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="icon" variant="ghost" className="size-6" onClick={onEdit} title="Editar indicador">
            <Pencil className="size-3" />
          </Button>
          <Button size="icon" variant="ghost" className="size-6" onClick={onAddActivity} title="Agregar actividad">
            <Plus className="size-3" />
          </Button>
        </div>
      </div>

      {/* Activities */}
      {expanded && (
        <div className="px-3 py-2 space-y-0.5 border-t border-border bg-background">
          {activities.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Sin actividades — pulsa + para agregar
            </p>
          ) : (
            activities.map((act) => (
              <ActivityRow
                key={act.id}
                activity={act}
                onEdit={() => { /* handled by parent via modal */ }}
                onDelete={() => {
                  deleteMutation.mutate(act.id, {
                    onSuccess: () => toast.success('Actividad eliminada'),
                    onError: () => toast.error('Error al eliminar'),
                  });
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Achievement Row ──────────────────────────────────────────────────────────

function AchievementRow({
  achievement,
  aspectId,
  courseId,
  onEdit,
  onDelete,
  onEditIndicator,
  onAddActivity,
  onEditActivity,
}: {
  achievement: Achievement;
  aspectId: string;
  courseId: string;
  onEdit: () => void;
  onDelete: () => void;
  onEditIndicator: (indicator: PerformanceIndicator) => void;
  onAddActivity: (indicator: PerformanceIndicator) => void;
  onEditActivity: (activity: CourseActivity, indicator: PerformanceIndicator) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const indicators = achievement.performanceIndicators ?? [];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Achievement header */}
      <div
        className="flex items-start gap-3 px-4 py-3 bg-background cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
        <span className="font-mono text-xs text-muted-foreground shrink-0 mt-0.5 w-10">
          {achievement.code}
        </span>
        <p className="text-sm flex-1 leading-snug">{achievement.statement}</p>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Badge variant="secondary" appearance="light" size="sm">
            {SCOPE_LABEL[achievement.scope] ?? achievement.scope}
          </Badge>
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="icon" variant="ghost" className="size-6" onClick={onEdit} title="Editar logro">
              <Pencil className="size-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-destructive hover:text-destructive"
              onClick={onDelete}
              title="Eliminar logro"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Indicators */}
      {expanded && (
        <div className="px-4 py-3 space-y-2 border-t border-border bg-muted/10">
          {indicators.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              Sin indicadores aún
            </p>
          ) : (
            indicators.map((ind) => (
              <IndicatorRow
                key={ind.id}
                indicator={ind}
                aspectId={aspectId}
                courseId={courseId}
                onEdit={() => onEditIndicator(ind)}
                onAddActivity={() => onAddActivity(ind)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Aspect Section ───────────────────────────────────────────────────────────

function AspectSection({
  aspect,
  courseId,
  onModal,
}: {
  aspect: { id: string; name: string; weight: number };
  courseId: string;
  onModal: (state: ModalState) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { data: achievements = [], isLoading } = useAchievements(courseId, aspect.id);
  const deleteMutation = useDeleteAchievement(courseId, aspect.id);

  const weightPct = Math.round(aspect.weight * 100);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Aspect header */}
      <div
        className="flex items-center gap-3 px-5 py-3 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
        <h3 className="font-semibold flex-1">{aspect.name}</h3>
        <Badge variant="secondary" appearance="light">
          {weightPct}%
        </Badge>
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onModal({ type: 'create-achievement', aspectId: aspect.id })}
          >
            <Plus className="size-4" />
            Logro
          </Button>
        </div>
      </div>

      {/* Achievements */}
      {expanded && (
        <div className="px-5 py-4 space-y-3 bg-background">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          ) : achievements.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              <p className="text-sm text-muted-foreground">
                No hay logros en este aspecto.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onModal({ type: 'create-achievement', aspectId: aspect.id })}
              >
                <Plus className="size-4" />
                Crear primer logro
              </Button>
            </div>
          ) : (
            achievements.map((ach) => (
              <AchievementRow
                key={ach.id}
                achievement={ach}
                aspectId={aspect.id}
                courseId={courseId}
                onEdit={() =>
                  onModal({ type: 'edit-achievement', achievement: ach, aspectId: aspect.id })
                }
                onDelete={() => {
                  deleteMutation.mutate(ach.id, {
                    onSuccess: () => toast.success('Logro eliminado'),
                    onError: () => toast.error('Error al eliminar el logro'),
                  });
                }}
                onEditIndicator={(ind) =>
                  onModal({ type: 'edit-indicator', indicator: ind, aspectId: aspect.id })
                }
                onAddActivity={(ind) =>
                  onModal({ type: 'create-activity', indicator: ind, aspectId: aspect.id })
                }
                onEditActivity={(act) =>
                  onModal({ type: 'edit-activity', activity: act, aspectId: aspect.id })
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Tab Component ───────────────────────────────────────────────────────

export function GradebookStructureTab({ courseId }: { courseId: string }) {
  const { data: structure, isLoading, isError } = useGradebookStructure(courseId);
  const { data: periods = [] } = useCoursePeriods(courseId);
  const createStructure = useCreateGradebookStructure(courseId);

  const [modal, setModal] = useState<ModalState>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" appearance="light" className="mt-4">
        <AlertIcon><AlertCircle /></AlertIcon>
        <AlertContent>
          <AlertTitle>No se pudo cargar la estructura de calificación.</AlertTitle>
        </AlertContent>
      </Alert>
    );
  }

  const aspects = structure?.aspects ?? [];

  if (aspects.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-4 mt-4 text-center border border-dashed border-border rounded-xl">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
          <BookOpen className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold">Sin estructura de calificación</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crea la estructura para definir aspectos, logros e indicadores.
          </p>
        </div>
        <Button
          onClick={() => {
            createStructure.mutate(undefined, {
              onSuccess: () => toast.success('Estructura creada'),
              onError: () => toast.error('Error al crear la estructura'),
            });
          }}
          disabled={createStructure.isPending}
        >
          {createStructure.isPending ? 'Creando…' : 'Crear estructura'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {aspects.map((aspect) => (
        <AspectSection
          key={aspect.id}
          aspect={aspect}
          courseId={courseId}
          onModal={setModal}
        />
      ))}

      {/* ── Modals ── */}
      {modal?.type === 'create-achievement' && (
        <AchievementModal
          courseId={courseId}
          modal={modal}
          periods={periods}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'edit-achievement' && (
        <AchievementModal
          courseId={courseId}
          modal={modal}
          periods={periods}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'edit-indicator' && (
        <IndicatorModal
          courseId={courseId}
          modal={modal}
          onClose={() => setModal(null)}
        />
      )}
      {(modal?.type === 'create-activity' || modal?.type === 'edit-activity') && (
        <ActivityModal
          courseId={courseId}
          modal={modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
