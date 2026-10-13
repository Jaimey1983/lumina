'use client';

/**
 * Editor de `escape_room` (U11.4, movido desde `lumina-frontend`): campos de la actividad, salas
 * ordenables y los campos de cada sala (`EscapeRoomSalaConfigFields`, que también usa el diseñador).
 * Misma lógica que antes; cambia el color (tokens semánticos, sin hex) y se corrigió el texto con
 * codificación rota de cinco rótulos.
 */

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
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react';

import type { EscapeRoomActivity, EscapeRoomSala } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { cn } from '@lumina/ui/lib/utils';

import {
  ESCAPE_ROOM_INTENTOS_DEFAULT,
  ESCAPE_ROOM_INTENTOS_ILIMITADOS,
} from './escape-room-logic.js';
import { normalizeEscapeRoomActivity, normalizeSala, uid } from './escape-room-normalize.js';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EscapeRoomEditorProps {
  activity: EscapeRoomActivity;
  onChange: (activity: EscapeRoomActivity) => void;
  /** Guardar pendiente al salir del campo (debounce del lienzo). */
  onBlurFlush?: () => void;
}


const INPUT_BASE =
  'rounded-md border border-input bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25';

const SELECT_BASE =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25';

export function tipoRespuestaLabel(t: EscapeRoomSala['tipoRespuesta']) {
  switch (t) {
    case 'texto':
      return 'Texto';
    case 'opcion_multiple':
      return 'Opción múltiple';
    case 'codigo':
      return 'Código';
    default:
      return t;
  }
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

// ─── Campos de configuración lógica de una sala ───────────────────────────────

const MAX_PISTAS_POR_SALA = 5;

function movePista(pistas: string[], from: number, to: number): string[] {
  if (to < 0 || to >= pistas.length) return pistas;
  const next = [...pistas];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export interface EscapeRoomSalaConfigFieldsProps {
  sala: EscapeRoomSala;
  onUpdate: (patch: Partial<EscapeRoomSala>) => void;
  onBlurFlush?: () => void;
}

export function EscapeRoomSalaConfigFields({
  sala,
  onUpdate,
  onBlurFlush,
}: EscapeRoomSalaConfigFieldsProps) {
  const opts =
    sala.tipoRespuesta === 'opcion_multiple'
      ? (() => {
          const o = [...(sala.opciones ?? [])];
          while (o.length < 2) o.push('');
          return o.slice(0, 12);
        })()
      : [];

  const pistas = sala.pistas ?? (sala.pista?.trim() ? [sala.pista] : []);
  const ilimitado = sala.intentosMaximos === ESCAPE_ROOM_INTENTOS_ILIMITADOS;

  return (
    <div className="space-y-2">
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
        <Label className="text-[11px]">Descripción / narrativa</Label>
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
        <Label className="text-[11px]">Desafío / pregunta</Label>
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
          <option value="opcion_multiple">Opción múltiple</option>
          <option value="codigo">Código numérico</option>
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
                    className="size-3.5 accent-primary"
                    aria-label={`Marcar opción ${letter} como correcta`}
                  />
                  <span className="w-4 shrink-0 text-[10px] font-semibold text-muted-foreground">
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
                    placeholder={`Opción ${letter}`}
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
            Agregar opción
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

      <label className="flex cursor-pointer items-center gap-2 text-[11px] text-foreground">
        <input
          type="checkbox"
          checked={sala.ignorarMayusculas}
          onChange={(e) => onUpdate({ ignorarMayusculas: e.target.checked })}
          className="size-3.5 accent-primary"
        />
        Ignorar mayúsculas
      </label>

      <div className="space-y-1">
        <Label className="text-[11px]">Pistas (opcional)</Label>
        <p className="text-[10px] leading-snug text-muted-foreground">
          Se revelan en orden: la primera tras el primer fallo, la segunda tras el segundo, y así
          sucesivamente. No restan puntos.
        </p>
        {pistas.length > 0 && (
          <div className="space-y-1.5">
            {pistas.map((p, pi) => (
              <div key={pi} className="flex items-start gap-1.5">
                <span className="mt-2 w-4 shrink-0 text-[10px] font-semibold text-muted-foreground">
                  {pi + 1}
                </span>
                <textarea
                  value={p}
                  onChange={(e) => {
                    const next = [...pistas];
                    next[pi] = e.target.value;
                    onUpdate({ pistas: next });
                  }}
                  onBlur={onBlurFlush}
                  rows={2}
                  className={cn(INPUT_BASE, 'min-h-[48px] flex-1 resize-y')}
                  placeholder={`Pista ${pi + 1}`}
                />
                <div className="flex shrink-0 flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={pi === 0}
                    aria-label={`Subir pista ${pi + 1}`}
                    onClick={() => onUpdate({ pistas: movePista(pistas, pi, pi - 1) })}
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={pi === pistas.length - 1}
                    aria-label={`Bajar pista ${pi + 1}`}
                    onClick={() => onUpdate({ pistas: movePista(pistas, pi, pi + 1) })}
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive hover:text-destructive/80"
                    aria-label={`Eliminar pista ${pi + 1}`}
                    onClick={() => onUpdate({ pistas: pistas.filter((_, i) => i !== pi) })}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 h-7 w-full gap-1 text-[10px]"
          disabled={pistas.length >= MAX_PISTAS_POR_SALA}
          onClick={() => onUpdate({ pistas: [...pistas, ''] })}
        >
          <Plus className="size-3" />
          Agregar pista
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px]">Intentos máximos</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={99}
            step={1}
            value={ilimitado ? '' : String(sala.intentosMaximos)}
            disabled={ilimitado}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= 1) onUpdate({ intentosMaximos: Math.floor(v) });
            }}
            onBlur={onBlurFlush}
            className="h-8 w-20 text-xs"
            placeholder={ilimitado ? '∞' : String(ESCAPE_ROOM_INTENTOS_DEFAULT)}
          />
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-foreground">
            <input
              type="checkbox"
              checked={ilimitado}
              onChange={(e) =>
                onUpdate({
                  intentosMaximos: e.target.checked
                    ? ESCAPE_ROOM_INTENTOS_ILIMITADOS
                    : ESCAPE_ROOM_INTENTOS_DEFAULT,
                })
              }
              className="size-3.5 accent-primary"
            />
            Ilimitados
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable sala card ───────────────────────────────────────────────────────

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-muted/40',
        isDragging && 'shadow-lumina-md',
      )}
    >
      <div className="flex items-center gap-1 border-b border-border bg-background px-2 py-1.5">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
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
              'size-4 shrink-0 text-muted-foreground transition-transform',
              !expanded && '-rotate-90',
            )}
            aria-hidden
          />
          <span className="truncate text-[11px] font-semibold text-foreground">
            {sala.nombre.trim() || 'Sala sin nombre'}
          </span>
          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
            {tipoRespuestaLabel(sala.tipoRespuesta)}
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-red-600"
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
        <div className="p-2.5">
          <EscapeRoomSalaConfigFields sala={sala} onUpdate={onUpdate} onBlurFlush={onBlurFlush} />
        </div>
      )}
    </div>
  );
}

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
        <Label className="text-[11px] font-medium">Título del Escape Room</Label>
        <Input
          value={act.titulo}
          onChange={(e) => onChange({ ...act, titulo: e.target.value })}
          onBlur={onBlurFlush}
          className="h-8 text-xs"
          placeholder="Nombre de la actividad"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] font-medium">Introducción / narrativa</Label>
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
            <Label className="text-[11px] font-medium">Tiempo límite</Label>
            <span className="text-[11px] font-semibold tabular-nums text-primary">
              {tiempoSlider === 0 ? 'Sin límite' : `${tiempoSlider} min`}
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
            className="h-1.5 w-full cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>0</span>
            <span>60 min</span>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 pb-1 text-[11px] text-foreground">
          <input
            type="checkbox"
            checked={act.mostrarRanking}
            onChange={(e) => onChange({ ...act, mostrarRanking: e.target.checked })}
            className="size-3.5 accent-primary"
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
        className="h-8 w-full gap-1.5 border-primary/30 bg-primary/5 text-xs hover:bg-primary/10"
        onClick={addSala}
      >
        <Plus className="size-3.5" />
        Agregar sala
      </Button>
      </div>
    </div>
  );
}
