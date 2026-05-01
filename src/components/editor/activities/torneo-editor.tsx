'use client';

import { useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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

import type { TorneoActivity } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Pregunta = TorneoActivity['preguntas'][number];

export interface TorneoEditorProps {
  activity: TorneoActivity;
  onChange: (next: TorneoActivity) => void;
}

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalize(raw: TorneoActivity | null | undefined): TorneoActivity {
  const fb = BLOCK_FALLBACKS.torneo;
  if (!raw || raw.tipo !== 'torneo') {
    return {
      tipo: 'torneo',
      preguntas: fb.preguntas.map((p) => ({ ...p, opciones: [...p.opciones] })),
      puntosBase: fb.puntosBase,
      bonusVelocidad: fb.bonusVelocidad,
    };
  }
  return {
    ...raw,
    preguntas: (raw.preguntas ?? []).map((p) => ({
      enunciado: p.enunciado ?? '',
      opciones: [...(p.opciones ?? [])].concat(['', '', '', '']).slice(0, 4),
      correcta: p.correcta ?? '',
      tiempoSegundos: Math.min(30, Math.max(5, p.tiempoSegundos ?? 15)),
    })),
    puntosBase: raw.puntosBase ?? 1000,
    bonusVelocidad: raw.bonusVelocidad ?? 500,
  };
}

// ─── SortablePregunta ─────────────────────────────────────────────────────────

function SortablePregunta({
  id,
  index,
  preg,
  total,
  onUpdate,
  onRemove,
}: {
  id: string;
  index: number;
  preg: Pregunta;
  total: number;
  onUpdate: (patch: Partial<Pregunta>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  const opts = [...(preg.opciones ?? [])].concat(['', '', '', '']).slice(0, 4) as [
    string,
    string,
    string,
    string,
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'space-y-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2.5',
        isDragging && 'shadow-lumina-md',
      )}
    >
      {/* Row: drag handle + title + remove */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="cursor-grab touch-none text-[#9ca3af] hover:text-[#6b7280] active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Reordenar"
        >
          <GripVertical className="size-4" />
        </button>
        <span className="flex-1 text-[11px] font-semibold text-[#111827]">
          Pregunta {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-[#9ca3af] hover:text-red-600"
          disabled={total <= 1}
          onClick={onRemove}
          aria-label="Eliminar pregunta"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Enunciado */}
      <div className="space-y-1">
        <Label className="text-[11px]">Enunciado</Label>
        <Input
          value={preg.enunciado}
          onChange={(e) => onUpdate({ enunciado: e.target.value })}
          className="h-8 text-xs"
          placeholder="¿Pregunta?"
        />
      </div>

      {/* Opciones + radio correcta */}
      <div className="space-y-1">
        <Label className="text-[11px]">Opciones (marca la correcta)</Label>
        <div className="space-y-1">
          {opts.map((op, oi) => {
            const letter = String.fromCharCode(65 + oi);
            const isCorrect = preg.correcta === op && op.trim() !== '';
            return (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correcta-${id}`}
                  checked={isCorrect}
                  disabled={!op.trim()}
                  onChange={() => {
                    if (op.trim()) onUpdate({ correcta: op });
                  }}
                  className="size-3.5 accent-[#2563EB]"
                  aria-label={`Marcar opción ${letter} como correcta`}
                />
                <span className="w-4 shrink-0 text-[10px] font-semibold text-[#6b7280]">
                  {letter}
                </span>
                <Input
                  value={op}
                  onChange={(e) => {
                    const next = [...opts] as [string, string, string, string];
                    next[oi] = e.target.value;
                    // si era la correcta y cambió, actualizar correcta también
                    const wasCorrect = preg.correcta === opts[oi];
                    onUpdate({
                      opciones: next,
                      ...(wasCorrect ? { correcta: e.target.value } : {}),
                    });
                  }}
                  className="h-7 flex-1 text-xs"
                  placeholder={`Opción ${letter}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Slider tiempo */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[11px]">Tiempo</Label>
          <span className="text-[11px] font-semibold tabular-nums text-[#2563EB]">
            {preg.tiempoSegundos}s
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={30}
          step={5}
          value={preg.tiempoSegundos}
          onChange={(e) => onUpdate({ tiempoSegundos: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer accent-[#2563EB]"
        />
        <div className="flex justify-between text-[9px] text-[#9ca3af]">
          <span>5s</span>
          <span>30s</span>
        </div>
      </div>
    </div>
  );
}

// ─── TorneoEditor ─────────────────────────────────────────────────────────────

export function TorneoEditor({ activity, onChange }: TorneoEditorProps) {
  const [local, setLocal] = useState<TorneoActivity>(() => normalize(activity));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function commit(next: TorneoActivity) {
    setLocal(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(next), 300);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = local.preguntas.map((_, i) => String(i));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = Number(active.id);
    const to = Number(over.id);
    if (Number.isNaN(from) || Number.isNaN(to)) return;
    const next = { ...local, preguntas: arrayMove(local.preguntas, from, to) };
    commit(next);
  }

  function updatePregunta(index: number, patch: Partial<Pregunta>) {
    const pregs = local.preguntas.map((p, i) =>
      i === index ? { ...p, ...patch } : p,
    );
    commit({ ...local, preguntas: pregs });
  }

  function removePregunta(index: number) {
    if (local.preguntas.length <= 1) return;
    commit({ ...local, preguntas: local.preguntas.filter((_, i) => i !== index) });
  }

  function addPregunta() {
    commit({
      ...local,
      preguntas: [
        ...local.preguntas,
        {
          enunciado: 'Nueva pregunta',
          opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          correcta: 'Opción A',
          tiempoSegundos: 15,
        },
      ],
    });
  }

  return (
    <div className="flex max-h-[min(70vh,540px)] min-h-0 w-full flex-col overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lumina-xs">

      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e5e7eb] bg-[#fffbeb] px-2.5 py-1.5">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
          Torneo
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-[#9ca3af]">
          {local.preguntas.length} pregunta{local.preguntas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-2.5">

        {/* Config global */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px] font-medium">Puntos base</Label>
            <Input
              type="number"
              min={0}
              value={local.puntosBase}
              onChange={(e) =>
                commit({ ...local, puntosBase: Math.max(0, Number(e.target.value) || 0) })
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-medium">Bonus velocidad</Label>
            <Input
              type="number"
              min={0}
              value={local.bonusVelocidad}
              onChange={(e) =>
                commit({ ...local, bonusVelocidad: Math.max(0, Number(e.target.value) || 0) })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Preguntas con DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {local.preguntas.map((preg, i) => (
                <SortablePregunta
                  key={String(i)}
                  id={String(i)}
                  index={i}
                  preg={preg}
                  total={local.preguntas.length}
                  onUpdate={(patch) => updatePregunta(i, patch)}
                  onRemove={() => removePregunta(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full gap-1.5 border-amber-200 bg-amber-50/50 text-xs hover:bg-amber-50"
          onClick={addPregunta}
        >
          <Plus className="size-3.5" />
          Agregar pregunta
        </Button>
      </div>
    </div>
  );
}
