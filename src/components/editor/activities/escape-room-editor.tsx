'use client';

import { useEffect, useState } from 'react';
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
import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react';

import type { EscapeRoomActivity, EscapeRoomSala } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uid } from '@/lib/helpers';
import { cn } from '@/lib/utils';

// â”€â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface EscapeRoomEditorProps {
  activity: EscapeRoomActivity;
  onChange: (activity: EscapeRoomActivity) => void;
  /** Guardar pendiente al salir del campo (debounce del lienzo). */
  onBlurFlush?: () => void;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const INPUT_BASE =
  'rounded-md border border-[#e5e7eb] bg-white px-2.5 py-2 text-xs text-[#111827] placeholder:text-[#9ca3af] focus-visible:border-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/25';

const SELECT_BASE =
  'h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-2 text-xs text-[#111827] focus-visible:border-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/25';

function tipoRespuestaLabel(t: EscapeRoomSala['tipoRespuesta']) {
  switch (t) {
    case 'texto':
      return 'Texto';
    case 'opcion_multiple':
      return 'OpciÃ³n mÃºltiple';
    case 'codigo':
      return 'CÃ³digo';
    default:
      return t;
  }
}

function normalizeSala(raw: Partial<EscapeRoomSala> | undefined, fallbackId?: string): EscapeRoomSala {
  const id = raw?.id?.trim() || fallbackId || uid();
  const tipo =
    raw?.tipoRespuesta === 'opcion_multiple' || raw?.tipoRespuesta === 'codigo'
      ? raw.tipoRespuesta
      : 'texto';
  let opciones: string[] | undefined;
  if (tipo === 'opcion_multiple') {
    const opts = [...(raw?.opciones ?? [])].filter((_, i) => i < 20);
    while (opts.length < 2) opts.push('');
    opciones = opts.slice(0, 12);
  }
  let respuestaCorrecta = raw?.respuestaCorrecta ?? '';
  if (tipo === 'opcion_multiple' && opciones) {
    const hit = opciones.find((o) => o === respuestaCorrecta && o.trim());
    if (!hit) {
      respuestaCorrecta = opciones.find((o) => o.trim()) ?? '';
    }
  }
  let intentos = raw?.intentosMaximos ?? 3;
  if (intentos !== -1 && intentos !== 1 && intentos !== 2 && intentos !== 3) {
    intentos = 3;
  }
  return {
    id,
    nombre: raw?.nombre ?? '',
    descripcion: raw?.descripcion ?? '',
    desafio: raw?.desafio ?? '',
    tipoRespuesta: tipo,
    ...(tipo === 'opcion_multiple' ? { opciones } : {}),
    respuestaCorrecta,
    ignorarMayusculas: raw?.ignorarMayusculas !== false,
    pista: raw?.pista,
    intentosMaximos: intentos,
  };
}

export function normalizeEscapeRoomActivity(
  raw: EscapeRoomActivity | null | undefined,
): EscapeRoomActivity {
  const fb = BLOCK_FALLBACKS.escape_room;
  if (!raw || raw.tipo !== 'escape_room') {
    return {
      tipo: 'escape_room',
      titulo: fb.titulo,
      introduccion: fb.introduccion,
      tiempoLimiteMinutos: fb.tiempoLimiteMinutos,
      mostrarRanking: fb.mostrarRanking,
      puntosBase: fb.puntosBase,
      salas: fb.salas.map((s) =>
        normalizeSala({
          ...s,
          opciones: s.tipoRespuesta === 'opcion_multiple' ? [...(s.opciones ?? [])] : undefined,
        }),
      ),
    };
  }
  const salas = (raw.salas ?? []).map((s) => normalizeSala(s));
  if (salas.length === 0) {
    return {
      ...raw,
      tipo: 'escape_room',
      titulo: raw.titulo ?? fb.titulo,
      introduccion: raw.introduccion ?? fb.introduccion,
      mostrarRanking: raw.mostrarRanking !== false,
      puntosBase: raw.puntosBase ?? fb.puntosBase,
      tiempoLimiteMinutos:
        raw.tiempoLimiteMinutos === undefined || raw.tiempoLimiteMinutos === 0
          ? undefined
          : raw.tiempoLimiteMinutos,
      salas: fb.salas.map((s) =>
        normalizeSala({
          ...s,
          opciones: s.tipoRespuesta === 'opcion_multiple' ? [...(s.opciones ?? [])] : undefined,
        }),
      ),
    };
  }
  return {
    tipo: 'escape_room',
    titulo: raw.titulo ?? '',
    introduccion: raw.introduccion ?? '',
    salas,
    tiempoLimiteMinutos:
      raw.tiempoLimiteMinutos === undefined || raw.tiempoLimiteMinutos === 0
        ? undefined
        : Math.min(60, Math.max(1, raw.tiempoLimiteMinutos)),
    mostrarRanking: raw.mostrarRanking !== false,
    puntosBase: Math.max(0, raw.puntosBase ?? 300),
  };
}

function isDragActivatorTarget(target: EventTarget | null) {
  let cur = target as HTMLElement | null;
  while (cur) {
    if (
      cur.tagName === 'INPUT' ||
      cur.tagName === 'TEXTAREA' ||
      cur.tagName === 'SELECT' ||
      cur.tagName === 'BUTTON' ||
      cur.tagName === 'LABEL' ||
      cur.isContentEditable
    ) {
      return false;
    }
    cur = cur.parentElement;
  }
  return true;
}

/** Evita que el drag de salas capture clics en campos del formulario. */
class EscapeRoomPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: { nativeEvent: Event }) =>
        isDragActivatorTarget(nativeEvent.target),
    },
  ];
}

// â”€â”€â”€ Sortable sala card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SortableSalaCard({
  sala,
  expanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onBlurFlush,
  totalSalas,
}: {
  sala: EscapeRoomSala;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<EscapeRoomSala>) => void;
  onRemove: () => void;
  onBlurFlush?: () => void;
  totalSalas: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sala.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  const opts =
    sala.tipoRespuesta === 'opcion_multiple'
      ? (() => {
          const o = [...(sala.opciones ?? [])];
          while (o.length < 2) o.push('');
          return o.slice(0, 12);
        })()
      : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f9fafb]',
        isDragging && 'shadow-lumina-md',
      )}
    >
      <div className="flex items-center gap-1 border-b border-[#e5e7eb] bg-white px-2 py-1.5">
        <button
          type="button"
          className="cursor-grab touch-none text-[#9ca3af] hover:text-[#6b7280] active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Reordenar sala"
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-[#9ca3af] transition-transform',
              !expanded && '-rotate-90',
            )}
            aria-hidden
          />
          <span className="truncate text-[11px] font-semibold text-[#111827]">
            {sala.nombre.trim() || 'Sala sin nombre'}
          </span>
          <span className="shrink-0 rounded bg-[#dbeafe] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#2563EB]">
            {tipoRespuestaLabel(sala.tipoRespuesta)}
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-[#9ca3af] hover:text-red-600"
          disabled={totalSalas <= 1}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Eliminar sala"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 p-2.5">
          <div className="space-y-1">
            <Label className="text-[11px]">Nombre de la sala</Label>
            <Input
              value={sala.nombre}
              onChange={(e) => onUpdate({ nombre: e.target.value })}
              onBlur={onBlurFlush}
              className="h-8 text-xs"
              placeholder="Ej. La sala de los misterios"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">DescripciÃ³n / narrativa</Label>
            <textarea
              value={sala.descripcion}
              onChange={(e) => onUpdate({ descripcion: e.target.value })}
              onBlur={onBlurFlush}
              rows={3}
              className={cn(INPUT_BASE, 'min-h-[72px] resize-y')}
              placeholder="Contexto de la sala"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">DesafÃ­o / pregunta</Label>
            <textarea
              value={sala.desafio}
              onChange={(e) => onUpdate({ desafio: e.target.value })}
              onBlur={onBlurFlush}
              rows={2}
              className={cn(INPUT_BASE, 'min-h-[56px] resize-y')}
              placeholder="Enunciado del acertijo"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">Tipo de respuesta</Label>
            <select
              value={sala.tipoRespuesta}
              onChange={(e) => {
                const nextTipo = e.target.value as EscapeRoomSala['tipoRespuesta'];
                if (nextTipo === 'opcion_multiple') {
                  onUpdate({
                    tipoRespuesta: 'opcion_multiple',
                    opciones: ['', ''],
                    respuestaCorrecta: '',
                  });
                } else {
                  onUpdate({
                    tipoRespuesta: nextTipo,
                    opciones: undefined,
                  });
                }
              }}
              className={SELECT_BASE}
            >
              <option value="texto">Texto libre</option>
              <option value="opcion_multiple">OpciÃ³n mÃºltiple</option>
              <option value="codigo">CÃ³digo numÃ©rico</option>
            </select>
          </div>

          {sala.tipoRespuesta === 'opcion_multiple' && (
            <div className="space-y-1">
              <Label className="text-[11px]">Opciones (marca la correcta)</Label>
              <div className="space-y-1">
                {opts.map((op, oi) => {
                  const letter = String.fromCharCode(65 + oi);
                  const nonEmpty = op.trim() !== '';
                  const isCorrect = sala.respuestaCorrecta === op && nonEmpty;
                  return (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correcta-${sala.id}`}
                        checked={isCorrect}
                        disabled={!nonEmpty}
                        onChange={() => {
                          if (nonEmpty) onUpdate({ respuestaCorrecta: op });
                        }}
                        className="size-3.5 accent-[#2563EB]"
                        aria-label={`Marcar opciÃ³n ${letter} como correcta`}
                      />
                      <span className="w-4 shrink-0 text-[10px] font-semibold text-[#6b7280]">
                        {letter}
                      </span>
                      <Input
                        value={op}
                        onChange={(e) => {
                          const next = [...opts];
                          next[oi] = e.target.value;
                          const wasCorrect = sala.respuestaCorrecta === opts[oi];
                          onUpdate({
                            opciones: next,
                            ...(wasCorrect ? { respuestaCorrecta: e.target.value } : {}),
                          });
                        }}
                        className="h-7 flex-1 text-xs"
                        placeholder={`OpciÃ³n ${letter}`}
                      />
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 h-7 w-full gap-1 text-[10px]"
                disabled={opts.length >= 12}
                onClick={() => onUpdate({ opciones: [...opts, ''] })}
              >
                <Plus className="size-3" />
                Agregar opciÃ³n
              </Button>
            </div>
          )}

          {(sala.tipoRespuesta === 'texto' || sala.tipoRespuesta === 'codigo') && (
            <div className="space-y-1">
              <Label className="text-[11px]">Respuesta correcta</Label>
              <Input
                value={sala.respuestaCorrecta}
                onChange={(e) => onUpdate({ respuestaCorrecta: e.target.value })}
                onBlur={onBlurFlush}
                className="h-8 text-xs"
                placeholder={sala.tipoRespuesta === 'codigo' ? 'Ej. 100' : 'Texto esperado'}
              />
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#374151]">
            <input
              type="checkbox"
              checked={sala.ignorarMayusculas}
              onChange={(e) => onUpdate({ ignorarMayusculas: e.target.checked })}
              className="size-3.5 accent-[#2563EB]"
            />
            Ignorar mayÃºsculas
          </label>

          <div className="space-y-1">
            <Label className="text-[11px]">Pista (opcional)</Label>
            <textarea
              value={sala.pista ?? ''}
              onChange={(e) => onUpdate({ pista: e.target.value || undefined })}
              onBlur={onBlurFlush}
              rows={2}
              className={cn(INPUT_BASE, 'min-h-[48px] resize-y')}
              placeholder="Ayuda para el estudiante"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">Intentos mÃ¡ximos</Label>
            <select
              value={String(sala.intentosMaximos)}
              onChange={(e) => onUpdate({ intentosMaximos: Number(e.target.value) })}
              className={SELECT_BASE}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="-1">Ilimitado</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ EscapeRoomEditor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function EscapeRoomEditor({
  activity,
  onChange,
  onBlurFlush,
}: EscapeRoomEditorProps) {
  const act = normalizeEscapeRoomActivity(activity);
  const salaIdKey = act.salas.map((s) => s.id).join('|');
  const [expandedIds, setExpandedIds] = useState(() => new Set(act.salas.map((s) => s.id)));

  useEffect(() => {
    setExpandedIds((prev) => {
      const valid = new Set(act.salas.map((s) => s.id));
      const next = new Set<string>();
      for (const id of prev) if (valid.has(id)) next.add(id);
      for (const id of valid) if (!prev.has(id)) next.add(id);
      return next;
    });
  }, [salaIdKey]);

  const sensors = useSensors(
    useSensor(EscapeRoomPointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = act.salas.map((s) => s.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = act.salas.findIndex((s) => s.id === active.id);
    const to = act.salas.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return;
    onChange({ ...act, salas: arrayMove(act.salas, from, to) });
  }

  function updateSala(id: string, patch: Partial<EscapeRoomSala>) {
    const salas = act.salas.map((s) => (s.id === id ? normalizeSala({ ...s, ...patch }, s.id) : s));
    onChange({ ...act, salas });
  }

  function removeSala(id: string) {
    if (act.salas.length <= 1) return;
    onChange({ ...act, salas: act.salas.filter((s) => s.id !== id) });
  }

  function addSala() {
    const newId = uid();
    const nueva: EscapeRoomSala = normalizeSala({
      id: newId,
      nombre: 'Nueva sala',
      descripcion: '',
      desafio: '',
      tipoRespuesta: 'texto',
      respuestaCorrecta: '',
      ignorarMayusculas: true,
      intentosMaximos: 3,
    });
    setExpandedIds((prev) => new Set(prev).add(newId));
    onChange({ ...act, salas: [...act.salas, nueva] });
  }

  const tiempoSlider = act.tiempoLimiteMinutos ?? 0;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-2.5">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium">TÃ­tulo del Escape Room</Label>
        <Input
          value={act.titulo}
          onChange={(e) => onChange({ ...act, titulo: e.target.value })}
          onBlur={onBlurFlush}
          className="h-8 text-xs"
          placeholder="Nombre de la actividad"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] font-medium">IntroducciÃ³n / narrativa</Label>
        <textarea
          value={act.introduccion}
          onChange={(e) => onChange({ ...act, introduccion: e.target.value })}
          onBlur={onBlurFlush}
          rows={3}
          className={cn(INPUT_BASE, 'min-h-[72px] resize-y')}
          placeholder="Historia inicial para el estudiante"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px] flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[11px] font-medium">Tiempo lÃ­mite</Label>
            <span className="text-[11px] font-semibold tabular-nums text-[#2563EB]">
              {tiempoSlider === 0 ? 'Sin lÃ­mite' : `${tiempoSlider} min`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={tiempoSlider}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange({
                ...act,
                tiempoLimiteMinutos: v === 0 ? undefined : v,
              });
            }}
            className="h-1.5 w-full cursor-pointer accent-[#2563EB]"
          />
          <div className="flex justify-between text-[9px] text-[#9ca3af]">
            <span>0</span>
            <span>60 min</span>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 pb-1 text-[11px] text-[#374151]">
          <input
            type="checkbox"
            checked={act.mostrarRanking}
            onChange={(e) => onChange({ ...act, mostrarRanking: e.target.checked })}
            className="size-3.5 accent-[#2563EB]"
          />
          Mostrar ranking
        </label>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] font-medium">Puntos base por sala</Label>
        <Input
          type="number"
          min={0}
          value={act.puntosBase}
          onChange={(e) =>
            onChange({ ...act, puntosBase: Math.max(0, Number(e.target.value) || 0) })
          }
          onBlur={onBlurFlush}
          className="h-8 max-w-[140px] text-xs"
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {act.salas.map((sala) => (
              <SortableSalaCard
                key={sala.id}
                sala={sala}
                expanded={expandedIds.has(sala.id)}
                onToggleExpand={() =>
                  setExpandedIds((prev) => {
                    const n = new Set(prev);
                    if (n.has(sala.id)) n.delete(sala.id);
                    else n.add(sala.id);
                    return n;
                  })
                }
                onUpdate={(patch) => updateSala(sala.id, patch)}
                onRemove={() => removeSala(sala.id)}
                onBlurFlush={onBlurFlush}
                totalSalas={act.salas.length}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-full gap-1.5 border-[#bfdbfe] bg-[#eff6ff]/80 text-xs hover:bg-[#eff6ff]"
        onClick={addSala}
      >
        <Plus className="size-3.5" />
        Agregar sala
      </Button>
      </div>
    </div>
  );
}
