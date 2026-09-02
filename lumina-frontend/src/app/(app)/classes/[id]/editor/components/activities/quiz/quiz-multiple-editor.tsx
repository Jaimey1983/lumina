'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

import type { Feedback, QuizLayoutVariant, QuizMultiple, QuizOption, QuizPregunta } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { normalizarQuizMultiple } from '@/lib/class-slide-normalize';

import { useActivityEditor } from '../use-activity-editor';
import {
  ALL_QUIZ_LAYOUT_VARIANTS,
  QUIZ_LAYOUT_LABELS,
  QUIZ_MAX_OPCIONES,
  QUIZ_MAX_PREGUNTAS,
  quizLayoutUsesQuestionImage,
  updatePreguntaInActivity,
} from './quiz-utils';

const DEFAULTS: QuizMultiple = {
  tipo: 'quiz_multiple',
  preguntas: [{ id: 'q-1', texto: '', opciones: [] }],
  deliveryMode: 'AUTONOMOUS',
  layoutVariant: 'classic-list',
  shuffleOptions: false,
  shufflePreguntas: false,
};

function normalize(a: QuizMultiple | null | undefined): QuizMultiple {
  if (!a) return { ...DEFAULTS };
  return normalizarQuizMultiple(a);
}

function createPregunta(): QuizPregunta {
  return { id: crypto.randomUUID(), texto: '', opciones: [] };
}

function preguntaSummary(p: QuizPregunta, index: number): string {
  const t = p.texto.trim();
  return t || `Pregunta ${index + 1}`;
}

interface EditorProps {
  editorSyncKey: string;
  activity: QuizMultiple | null;
  onChange: (a: QuizMultiple) => void;
  onRemove?: () => void;
  canvasLayout?: boolean;
  isSelected?: boolean;
}

function SortablePreguntaRow({
  pregunta,
  index,
  isActive,
  canRemove,
  onSelect,
  onRemove,
}: {
  pregunta: QuizPregunta;
  index: number;
  isActive: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pregunta.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 rounded-md border px-1 py-1',
        isActive
          ? 'border-[#2563EB] bg-[#eff6ff]'
          : 'border-[#e5e7eb] bg-white hover:border-[#bfdbfe]',
        isDragging && 'shadow-lumina-sm',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded p-0.5 text-[#9ca3af] hover:text-[#6b7280] active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label={`Reordenar ${preguntaSummary(pregunta, index)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 truncate text-left text-[11px] font-medium text-[#111827]"
      >
        <span className="text-[#9ca3af]">{index + 1}.</span>{' '}
        {preguntaSummary(pregunta, index)}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 text-[#9ca3af] hover:text-destructive"
        disabled={!canRemove}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Eliminar pregunta"
      >
        <Trash2 className="size-3" />
      </Button>
    </div>
  );
}

export function QuizMultipleActivityEditor({
  editorSyncKey,
  activity,
  onChange,
  onRemove,
  canvasLayout,
  isSelected,
}: EditorProps) {
  const { local, setLocal, flush, commitImmediate, schedulePersist } = useActivityEditor<QuizMultiple>({
    data: activity,
    editorSyncKey,
    normalize,
    onChange,
  });

  const preguntaIdsKey = local.preguntas.map((p) => p.id).join('|');
  const [activePreguntaId, setActivePreguntaId] = useState(
    () => local.preguntas[0]?.id ?? '',
  );

  useEffect(() => {
    setActivePreguntaId((prev) => {
      if (local.preguntas.some((p) => p.id === prev)) return prev;
      return local.preguntas[0]?.id ?? '';
    });
  }, [preguntaIdsKey, editorSyncKey]);

  const activeIndex = useMemo(
    () => local.preguntas.findIndex((p) => p.id === activePreguntaId),
    [local.preguntas, activePreguntaId],
  );
  const activePregunta =
    activeIndex >= 0 ? local.preguntas[activeIndex] : local.preguntas[0];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function updateImmediate(partial: Partial<QuizMultiple>) {
    commitImmediate({ ...local, ...partial, tipo: 'quiz_multiple' });
  }

  function updateActivePregunta(patch: Partial<QuizPregunta>, debounced = false) {
    if (!activePregunta) return;
    const next = updatePreguntaInActivity(local, activePregunta.id, patch);
    setLocal(next);
    if (debounced) schedulePersist(next);
    else commitImmediate(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = local.preguntas.findIndex((p) => p.id === active.id);
    const to = local.preguntas.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;
    updateImmediate({ preguntas: arrayMove(local.preguntas, from, to) });
  }

  function addPregunta() {
    if (local.preguntas.length >= QUIZ_MAX_PREGUNTAS) return;
    const nueva = createPregunta();
    const next = {
      ...local,
      tipo: 'quiz_multiple' as const,
      preguntas: [...local.preguntas, nueva],
    };
    setActivePreguntaId(nueva.id);
    commitImmediate(next);
  }

  function removePregunta(id: string) {
    if (local.preguntas.length <= 1) return;
    const idx = local.preguntas.findIndex((p) => p.id === id);
    const nextPreguntas = local.preguntas.filter((p) => p.id !== id);
    const next = { ...local, tipo: 'quiz_multiple' as const, preguntas: nextPreguntas };
    if (activePreguntaId === id) {
      const fallback = nextPreguntas[Math.max(0, idx - 1)] ?? nextPreguntas[0];
      setActivePreguntaId(fallback?.id ?? '');
    }
    commitImmediate(next);
  }

  function addOption() {
    if (!activePregunta || activePregunta.opciones.length >= QUIZ_MAX_OPCIONES) return;
    const newOption: QuizOption = { id: crypto.randomUUID(), texto: '', esCorrecta: false };
    updateActivePregunta({ opciones: [...activePregunta.opciones, newOption] });
  }

  function updateOptionText(id: string, texto: string) {
    if (!activePregunta) return;
    const opciones = activePregunta.opciones.map((o) => (o.id === id ? { ...o, texto } : o));
    const next = updatePreguntaInActivity(local, activePregunta.id, { opciones });
    setLocal(next);
    schedulePersist(next);
  }

  function removeOption(id: string) {
    if (!activePregunta) return;
    updateActivePregunta({
      opciones: activePregunta.opciones.filter((o) => o.id !== id),
    });
  }

  function setSingleCorrectOption(id: string) {
    if (!activePregunta) return;
    updateActivePregunta({
      opciones: activePregunta.opciones.map((o) => ({
        ...o,
        esCorrecta: o.id === id,
      })),
    });
  }

  function toggleCorrectOption(id: string) {
    if (!activePregunta) return;
    updateActivePregunta({
      opciones: activePregunta.opciones.map((o) =>
        o.id === id ? { ...o, esCorrecta: !o.esCorrecta } : o,
      ),
    });
  }

  function updateActiveRetroalimentacion(patch: Partial<Feedback>, debounced = false) {
    if (!activePregunta) return;
    const merged = { ...activePregunta.retroalimentacion, ...patch };
    const hasContent =
      Boolean(merged.correcto?.trim()) ||
      Boolean(merged.incorrecto?.trim()) ||
      Boolean(merged.explicacion?.trim()) ||
      merged.mostrarExplicacion === true;
    updateActivePregunta(
      { retroalimentacion: hasContent ? merged : undefined },
      debounced,
    );
  }

  function handleDeliveryModeChange(mode: 'AUTONOMOUS' | 'SYNCED') {
    if (mode === 'SYNCED') {
      updateImmediate({
        deliveryMode: mode,
        allowTeacherPause: local.allowTeacherPause ?? true,
        allowTeacherSkip: local.allowTeacherSkip ?? true,
        autoAdvanceOnAllAnswered: local.autoAdvanceOnAllAnswered ?? false,
      });
    } else {
      updateImmediate({ deliveryMode: mode });
    }
  }

  const isSynced = local.deliveryMode === 'SYNCED';
  const isMultiCorrect = activePregunta?.multipleRespuesta === true;

  return (
    <div
      data-activity-editor-root
      className={cn(
        canvasLayout
          ? 'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-md border-0 bg-transparent shadow-none'
          : 'flex max-h-[min(70vh,520px)] min-h-0 w-full max-w-full flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lumina-xs',
        !canvasLayout && isSelected && 'ring-1 ring-[#2563EB]/45',
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5">
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          Quiz
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-[#9ca3af]">
          {local.preguntas.length} pregunta{local.preguntas.length === 1 ? '' : 's'}
        </span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-[#9ca3af] hover:text-destructive"
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
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium">Diseño de opciones</Label>
            <Select
              value={local.layoutVariant}
              onValueChange={(v) => updateImmediate({ layoutVariant: v as QuizLayoutVariant })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_QUIZ_LAYOUT_VARIANTS.map((v) => (
                  <SelectItem key={v} value={v} className="text-xs">
                    {QUIZ_LAYOUT_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-medium">Modo de entrega</Label>
            <Select
              value={local.deliveryMode}
              onValueChange={(v) => handleDeliveryModeChange(v as 'AUTONOMOUS' | 'SYNCED')}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTONOMOUS" className="text-xs">
                  Autónomo (alumno)
                </SelectItem>
                <SelectItem value="SYNCED" className="text-xs">
                  Sincronizado (en vivo)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="cursor-pointer text-[11px] font-medium leading-tight">
              Mezclar opciones
            </Label>
            <Switch
              className="scale-90"
              checked={local.shuffleOptions ?? false}
              onCheckedChange={(checked) => updateImmediate({ shuffleOptions: checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="cursor-pointer text-[11px] font-medium leading-tight">
              Mezclar preguntas
            </Label>
            <Switch
              className="scale-90"
              checked={local.shufflePreguntas ?? false}
              onCheckedChange={(checked) => updateImmediate({ shufflePreguntas: checked })}
            />
          </div>
        </div>

        {isSynced ? (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/60 p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Sesión en vivo
            </p>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium">Tiempo por pregunta (seg)</Label>
              <Input
                type="number"
                min={5}
                max={300}
                value={local.timePerQuestion ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  const v = raw === '' ? undefined : Math.max(5, Math.min(300, Number(raw) || 5));
                  updateImmediate({ timePerQuestion: v });
                }}
                onBlur={flush}
                className="h-8 max-w-[120px] text-xs"
                placeholder="30"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="cursor-pointer text-[11px] font-medium">Docente puede pausar</Label>
              <Switch
                className="scale-90"
                checked={local.allowTeacherPause ?? true}
                onCheckedChange={(checked) => updateImmediate({ allowTeacherPause: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="cursor-pointer text-[11px] font-medium">Docente puede saltar</Label>
              <Switch
                className="scale-90"
                checked={local.allowTeacherSkip ?? true}
                onCheckedChange={(checked) => updateImmediate({ allowTeacherSkip: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="cursor-pointer text-[11px] font-medium leading-tight">
                Avanzar cuando todos respondieron
              </Label>
              <Switch
                className="scale-90"
                checked={local.autoAdvanceOnAllAnswered ?? false}
                onCheckedChange={(checked) =>
                  updateImmediate({ autoAdvanceOnAllAnswered: checked })
                }
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium">Preguntas</Label>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={local.preguntas.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {local.preguntas.map((p, idx) => (
                  <SortablePreguntaRow
                    key={p.id}
                    pregunta={p}
                    index={idx}
                    isActive={p.id === activePregunta?.id}
                    canRemove={local.preguntas.length > 1}
                    onSelect={() => setActivePreguntaId(p.id)}
                    onRemove={() => removePregunta(p.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {local.preguntas.length < QUIZ_MAX_PREGUNTAS ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPregunta}
              className="h-8 w-full text-xs"
            >
              <Plus className="mr-1.5 size-3" /> Agregar pregunta
            </Button>
          ) : (
            <p className="text-[10px] text-[#9ca3af]">Máximo {QUIZ_MAX_PREGUNTAS} preguntas.</p>
          )}
        </div>

        {activePregunta ? (
          <div className="space-y-2 rounded-md border border-[#e5e7eb] bg-[#fafafa] p-2">
            <p className="text-[11px] font-semibold text-[#374151]">
              Editando pregunta {activeIndex + 1}
            </p>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium">Enunciado</Label>
              <Input
                value={activePregunta.texto}
                onChange={(e) => updateActivePregunta({ texto: e.target.value }, true)}
                onBlur={flush}
                className="h-8 text-xs"
                placeholder="Escribe la pregunta..."
              />
            </div>

            {quizLayoutUsesQuestionImage(local.layoutVariant) ? (
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Imagen de la pregunta (URL)</Label>
                <Input
                  value={activePregunta.imagenUrl ?? ''}
                  onChange={(e) =>
                    updateActivePregunta({ imagenUrl: e.target.value || undefined }, true)
                  }
                  onBlur={flush}
                  className="h-8 text-xs"
                  placeholder="https://..."
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 rounded-md border border-[#e5e7eb] bg-white px-2 py-1.5">
              <Label className="cursor-pointer text-[11px] font-medium leading-tight">
                Varias respuestas correctas
              </Label>
              <Switch
                className="scale-90"
                checked={isMultiCorrect}
                onCheckedChange={(checked) =>
                  updateActivePregunta({ multipleRespuesta: checked })
                }
              />
            </div>

            <div className="space-y-2 rounded-md border border-[#e5e7eb] bg-white px-2 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]">
                Retroalimentación
              </p>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Si acierta</Label>
                <Input
                  value={activePregunta.retroalimentacion?.correcto ?? ''}
                  onChange={(e) =>
                    updateActiveRetroalimentacion({ correcto: e.target.value }, true)
                  }
                  onBlur={flush}
                  className="h-8 text-xs"
                  placeholder="¡Correcto!"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Si falla</Label>
                <Input
                  value={activePregunta.retroalimentacion?.incorrecto ?? ''}
                  onChange={(e) =>
                    updateActiveRetroalimentacion({ incorrecto: e.target.value }, true)
                  }
                  onBlur={flush}
                  className="h-8 text-xs"
                  placeholder="Incorrecto. Revisa la respuesta correcta."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Explicación (opcional)</Label>
                <Input
                  value={activePregunta.retroalimentacion?.explicacion ?? ''}
                  onChange={(e) =>
                    updateActiveRetroalimentacion({ explicacion: e.target.value }, true)
                  }
                  onBlur={flush}
                  className="h-8 text-xs text-[#9ca3af]"
                  placeholder="Aparece tras responder si está activada abajo"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="cursor-pointer text-[11px] font-medium leading-tight">
                  Mostrar explicación
                </Label>
                <Switch
                  className="scale-90"
                  checked={activePregunta.retroalimentacion?.mostrarExplicacion ?? false}
                  onCheckedChange={(checked) =>
                    updateActiveRetroalimentacion({ mostrarExplicacion: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium">Opciones</Label>
              <div className="space-y-1.5">
                {activePregunta.opciones.map((op, idx) => (
                  <div key={op.id} className="flex items-center gap-2">
                    {isMultiCorrect ? (
                      <input
                        type="checkbox"
                        checked={op.esCorrecta}
                        onChange={() => toggleCorrectOption(op.id)}
                        className="size-4 shrink-0 cursor-pointer accent-[#2563EB]"
                        aria-label={`Marcar opción ${idx + 1} como correcta`}
                      />
                    ) : (
                      <input
                        type="radio"
                        name={`quiz-correct-${editorSyncKey}-${activePregunta.id}`}
                        checked={op.esCorrecta}
                        onChange={() => setSingleCorrectOption(op.id)}
                        className="size-4 shrink-0 cursor-pointer"
                      />
                    )}
                    <Input
                      value={op.texto}
                      onChange={(e) => updateOptionText(op.id, e.target.value)}
                      onBlur={flush}
                      className={cn('h-8 text-xs', op.esCorrecta && 'border-green-300 bg-green-50/30')}
                      placeholder={`Opción ${idx + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-[#9ca3af] hover:text-destructive"
                      onClick={() => removeOption(op.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              {activePregunta.opciones.length < QUIZ_MAX_OPCIONES ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-1 h-8 w-full text-xs"
                >
                  <Plus className="mr-1.5 size-3" /> Agregar opción
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
