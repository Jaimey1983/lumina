'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, ChevronUp, ChevronDown, Plus, GripVertical } from 'lucide-react';

import type { OrderSteps, OrderStep } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useActivityEditor } from './use-activity-editor';

// Editor-only fields that ride along with the persisted activity data.
export type OrderStepsLocal = OrderSteps & { mostrarNumeros?: boolean };

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PASOS: OrderStep[] = [
  { id: 'step-1', contenido: '', ordenCorrecto: 1 },
  { id: 'step-2', contenido: '', ordenCorrecto: 2 },
];

function normalize(a: OrderStepsLocal | null | undefined): OrderStepsLocal {
  if (!a) {
    return {
      tipo: 'ordenar_pasos',
      instruccion: '',
      pasos: DEFAULT_PASOS,
      mostrarNumeros: true,
    };
  }
  const pasos = a.pasos?.length >= 2 ? a.pasos : DEFAULT_PASOS;
  return { ...a, pasos, tipo: 'ordenar_pasos', mostrarNumeros: a.mostrarNumeros ?? true };
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  editorSyncKey?: string;
  data: OrderStepsLocal | null;
  onChange: (data: OrderStepsLocal) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

export function OrderStepsActivityEditor({
  editorSyncKey = '',
  data,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: Props) {
  const { local, setLocal, flush, schedulePersist, commitImmediate } =
    useActivityEditor<OrderStepsLocal>({
      data,
      editorSyncKey,
      normalize,
      onChange,
    });

  function updateText(partial: Partial<OrderStepsLocal>) {
    const next: OrderStepsLocal = { ...local, ...partial, tipo: 'ordenar_pasos' };
    setLocal(next);
    schedulePersist(next);
  }

  function updateImmediate(partial: Partial<OrderStepsLocal>) {
    commitImmediate({ ...local, ...partial, tipo: 'ordenar_pasos' });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────────

  function updateStepText(id: string, contenido: string) {
    const nextPasos = local.pasos.map((s, i) =>
      s.id === id ? { ...s, contenido, ordenCorrecto: i + 1 } : s,
    );
    updateText({ pasos: nextPasos });
  }

  function addStep() {
    if (local.pasos.length >= 10) return;
    const newStep: OrderStep = {
      id: `step-${generateId()}`,
      contenido: '',
      ordenCorrecto: local.pasos.length + 1,
    };
    updateImmediate({ pasos: [...local.pasos, newStep] });
  }

  function removeStep(id: string) {
    if (local.pasos.length <= 2) return;
    const filtered = local.pasos.filter((s) => s.id !== id);
    const reindexed = filtered.map((s, i) => ({ ...s, ordenCorrecto: i + 1 }));
    updateImmediate({ pasos: reindexed });
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === local.pasos.length - 1) return;

    const nextPasos = [...local.pasos];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [nextPasos[index], nextPasos[swapIndex]] = [nextPasos[swapIndex], nextPasos[index]];
    const reindexed = nextPasos.map((s, i) => ({ ...s, ordenCorrecto: i + 1 }));
    updateImmediate({ pasos: reindexed });
  }

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(52vh,380px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        !canvasLayout && isSelected && 'ring-1 ring-primary/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
          Ordenar Pasos
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
          Los cambios se guardan al pausar la escritura
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            title="Eliminar esta actividad"
            aria-label="Eliminar esta actividad"
            onClick={(e) => {
              e.stopPropagation();
              flush();
              onRemove();
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-2.5 pr-1">
        <div className="space-y-1">
          <Label htmlFor="os-instructions" className="text-[11px] font-medium">
            Instrucción general
          </Label>
          <Textarea
            id="os-instructions"
            value={local.instruccion}
            onChange={(e) => updateText({ instruccion: e.target.value })}
            onBlur={flush}
            rows={2}
            className="min-h-[2.75rem] resize-none text-xs"
            placeholder="Ej: Ordena los siguientes pasos cronológicamente…"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium">Secuencia Correcta</Label>
            <span className="text-[10px] text-muted-foreground">
              {local.pasos.length}/10
            </span>
          </div>

          <div className="space-y-1.5">
            {local.pasos.map((paso, idx) => (
              <div key={paso.id} className="flex items-center gap-1.5">
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-5 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={idx === 0}
                    onClick={() => moveStep(idx, 'up')}
                  >
                    <ChevronUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-5 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={idx === local.pasos.length - 1}
                    onClick={() => moveStep(idx, 'down')}
                  >
                    <ChevronDown className="size-3" />
                  </Button>
                </div>

                <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-2 py-1">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground">
                    {idx + 1}
                  </span>
                  <Input
                    value={paso.contenido}
                    onChange={(e) => updateStepText(paso.id, e.target.value)}
                    onBlur={flush}
                    className="h-6 flex-1 rounded-none border-0 bg-transparent p-0 px-1 text-xs shadow-none focus-visible:ring-0"
                    placeholder={`Paso ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                    disabled={local.pasos.length <= 2}
                    onClick={() => removeStep(paso.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {local.pasos.length < 10 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-full border-dashed text-[11px] text-muted-foreground hover:text-foreground"
              onClick={addStep}
            >
              <Plus className="mr-1.5 size-3" />
              Agregar paso
            </Button>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-border bg-muted/15 px-2 py-1.5">
          <Label htmlFor="os-show-numbers" className="cursor-pointer text-[11px] font-medium leading-tight">
            Mostrar números de orden al estudiante
          </Label>
          <Switch
            id="os-show-numbers"
            className="scale-90"
            checked={local.mostrarNumeros ?? true}
            onCheckedChange={(checked) => updateImmediate({ mostrarNumeros: checked })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

function SortableStep({ id, content, index, showNumbers }: { id: string; content: string; index: number; showNumbers?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex w-full items-center gap-3 rounded-md border bg-background p-3 shadow-sm',
        isDragging && 'opacity-50 ring-2 ring-primary'
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      {showNumbers && (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
          {index + 1}
        </span>
      )}
      <span className="text-sm">{content}</span>
    </div>
  );
}

export function OrderStepsViewer({
  activity,
  editorSyncKey,
  onResponse,
}: {
  activity: OrderStepsLocal;
  editorSyncKey?: string;
  onResponse?: (response: unknown) => void;
}) {
  const [items, setItems] = useState<{ id: string; content: string }[]>([]);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (!activity?.pasos) return;
    const shuffled = [...activity.pasos].sort(() => Math.random() - 0.5);
    setItems(shuffled.map((s) => ({ id: s.id, content: s.contenido })));
    setAnswered(false);
  }, [activity?.pasos, editorSyncKey]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    if (answered) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSubmit = () => {
    if (answered) return;
    setAnswered(true);
    onResponse?.(items.map((i) => i.id));
  };

  if (!activity) return null;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      {activity.instruccion && (
        <p className="text-sm font-medium text-foreground">{activity.instruccion}</p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <SortableStep
                key={item.id}
                id={item.id}
                content={item.content}
                index={index}
                showNumbers={activity.mostrarNumeros}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {answered ? (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
          <span>✓</span> ¡Respuesta enviada!
        </div>
      ) : (
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Enviar</Button>
        </div>
      )}
    </div>
  );
}
