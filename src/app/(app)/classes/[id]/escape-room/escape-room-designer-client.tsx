'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
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
import {
  Check,
  GripVertical,
  Hash,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Slide as ApiSlide } from '@/hooks/api/use-class';
import { useClass } from '@/hooks/api/use-class';
import { useUpdateSlide } from '@/hooks/api/use-classes';
import {
  EscapeRoomSalaConfigFields,
  normalizeEscapeRoomActivity,
  normalizeSala,
  tipoRespuestaLabel,
} from '@/components/editor/activities/escape-room-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScreenLoader } from '@/components/screen-loader';
import {
  getSlideContentRecord,
  sanitizeSlideContentForPersistence,
} from '@/lib/class-slide-normalize';
import { uid } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import type {
  ActivityBlock,
  Block,
  EscapeRoomActivity,
  EscapeRoomSala,
} from '@/types/slide.types';

import { EscapeRoomSalaCanvas } from './escape-room-sala-canvas';

function findEscapeRoomSlide(slides: ApiSlide[] | undefined): {
  slide: ApiSlide;
  activity: EscapeRoomActivity;
} | null {
  if (!slides?.length) return null;
  for (const slide of slides) {
    const c = getSlideContentRecord(slide);
    const bloques = Array.isArray(c.bloques) ? (c.bloques as Block[]) : [];
    const actBlock = bloques.find(
      (b): b is ActivityBlock =>
        b.tipo === 'actividad' && b.actividad?.tipo === 'escape_room',
    );
    if (actBlock) {
      return {
        slide,
        activity: normalizeEscapeRoomActivity(
          actBlock.actividad as EscapeRoomActivity,
        ),
      };
    }
  }
  return null;
}

function buildSlideContentWithActivity(
  slide: ApiSlide,
  activity: EscapeRoomActivity,
): Record<string, unknown> {
  const c = getSlideContentRecord(slide);
  const bloques = (Array.isArray(c.bloques) ? [...c.bloques] : []) as Block[];
  const next = bloques.map((b) => {
    if (b.tipo === 'actividad' && b.actividad?.tipo === 'escape_room') {
      return { ...b, actividad: activity };
    }
    return b;
  });
  return { ...c, bloques: next };
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

class DesignerPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent }: { nativeEvent: Event }) =>
        isDragActivatorTarget(nativeEvent.target),
    },
  ];
}

function TipoRespuestaIcon({ tipo }: { tipo: EscapeRoomSala['tipoRespuesta'] }) {
  switch (tipo) {
    case 'opcion_multiple':
      return <ListChecks className="size-3.5 shrink-0 text-[#6366f1]" aria-hidden />;
    case 'codigo':
      return <Hash className="size-3.5 shrink-0 text-[#6366f1]" aria-hidden />;
    default:
      return <Type className="size-3.5 shrink-0 text-[#6366f1]" aria-hidden />;
  }
}

function SortableSalaThumb({
  sala,
  index,
  isActive,
  onSelect,
}: {
  sala: EscapeRoomSala;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sala.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg border bg-white p-2 shadow-sm transition-colors',
        isActive
          ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30'
          : 'border-[#e5e7eb] hover:border-[#93c5fd]',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-[#9ca3af] hover:text-[#6b7280] active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Reordenar sala"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[#eef2ff] text-[10px] font-bold text-[#4338ca]">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-[#111827]">
          {sala.nombre.trim() || `Sala ${index + 1}`}
        </p>
        <p className="truncate text-[9px] text-[#6b7280]">
          {tipoRespuestaLabel(sala.tipoRespuesta)}
        </p>
      </div>
      <TipoRespuestaIcon tipo={sala.tipoRespuesta} />
    </div>
  );
}

export function EscapeRoomDesignerClient({ classId }: { classId: string }) {
  const { data: cls, isLoading, isError } = useClass(classId);
  const updateSlide = useUpdateSlide(classId);

  const found = useMemo(
    () => findEscapeRoomSlide(cls?.slides),
    [cls?.slides],
  );

  const [activity, setActivity] = useState<EscapeRoomActivity | null>(null);
  const [activeSalaId, setActiveSalaId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [lastSavedJson, setLastSavedJson] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!found || hydratedRef.current) return;
    hydratedRef.current = true;
    const act = found.activity;
    setActivity(act);
    setActiveSalaId(act.salas[0]?.id ?? null);
    setLastSavedJson(JSON.stringify(act));
  }, [found]);

  const isDirty = useMemo(() => {
    if (!activity || lastSavedJson === null) return false;
    return JSON.stringify(activity) !== lastSavedJson;
  }, [activity, lastSavedJson]);

  const activeSala = useMemo(
    () => activity?.salas.find((s) => s.id === activeSalaId) ?? activity?.salas[0] ?? null,
    [activity, activeSalaId],
  );

  const saveStatusLabel = useMemo(() => {
    if (saveError) return 'Error al guardar';
    if (updateSlide.isPending) return 'Guardando…';
    if (isDirty) return 'Cambios pendientes…';
    return 'Guardado';
  }, [saveError, updateSlide.isPending, isDirty]);

  const sensors = useSensors(
    useSensor(DesignerPointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const updateActivity = useCallback((patch: Partial<EscapeRoomActivity>) => {
    setActivity((prev) => (prev ? normalizeEscapeRoomActivity({ ...prev, ...patch }) : prev));
  }, []);

  const updateSala = useCallback((salaId: string, patch: Partial<EscapeRoomSala>) => {
    setActivity((prev) => {
      if (!prev) return prev;
      const salas = prev.salas.map((s) =>
        s.id === salaId ? normalizeSala({ ...s, ...patch }, s.id) : s,
      );
      return normalizeEscapeRoomActivity({ ...prev, salas });
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!found?.slide || !activity) return;
    const raw = buildSlideContentWithActivity(found.slide, activity);
    const payload = sanitizeSlideContentForPersistence(raw) ?? raw;
    updateSlide.mutate(
      { slideId: found.slide.id, content: payload },
      {
        onSuccess: () => {
          setSaveError(false);
          setLastSavedJson(JSON.stringify(activity));
          toast.success('Escape Room guardado');
        },
        onError: () => {
          setSaveError(true);
          toast.error('Error al guardar');
        },
      },
    );
  }, [found, activity, updateSlide]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!activity) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const from = activity.salas.findIndex((s) => s.id === active.id);
      const to = activity.salas.findIndex((s) => s.id === over.id);
      if (from < 0 || to < 0) return;
      updateActivity({ salas: arrayMove(activity.salas, from, to) });
    },
    [activity, updateActivity],
  );

  const addSala = useCallback(() => {
    if (!activity) return;
    const newId = uid();
    const nueva = normalizeSala({
      id: newId,
      nombre: 'Nueva sala',
      descripcion: '',
      desafio: '',
      tipoRespuesta: 'texto',
      respuestaCorrecta: '',
      ignorarMayusculas: true,
      intentosMaximos: 3,
    });
    updateActivity({ salas: [...activity.salas, nueva] });
    setActiveSalaId(newId);
  }, [activity, updateActivity]);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
      return;
    }
    window.location.href = `/classes/${classId}/editor`;
  }, [classId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        const t = e.target as HTMLElement;
        if (
          t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (isError || !cls) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">No se pudo cargar la clase.</p>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/classes/${classId}`}>Volver a la clase</Link>
        </Button>
      </div>
    );
  }

  if (!found || !activity || !activeSala) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          Esta clase no tiene un slide con actividad Escape Room. Agrégala desde el editor
          principal.
        </p>
        <Button variant="outline" size="sm" onClick={handleBack}>
          Volver al editor
        </Button>
      </div>
    );
  }

  const tiempoSlider = activity.tiempoLimiteMinutos ?? 0;
  const salaIds = activity.salas.map((s) => s.id);

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#f3f4f6]">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#1d4ed8] bg-[#2563EB] px-4">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <img
            src="/LM-ffffff.svg"
            alt="Lumina"
            className="h-7 w-auto"
            draggable={false}
          />
        </Link>
        <div className="h-5 w-px shrink-0 bg-white/20" aria-hidden />
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-white">
          Editor Escape Room
        </h1>
        <span
          className={cn(
            'hidden items-center gap-1.5 text-xs sm:inline-flex',
            saveError ? 'text-red-200' : 'text-white/80',
          )}
        >
          {updateSlide.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : isDirty ? null : (
            <Check className="size-3.5" aria-hidden />
          )}
          {saveStatusLabel}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl border border-white/20 bg-white/10 text-xs font-semibold text-white hover:bg-white/20"
          onClick={handleBack}
        >
          ← Volver al editor
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={updateSlide.isPending}
          className="rounded-xl bg-white text-xs font-bold text-[#2563EB] hover:bg-white/95"
          onClick={handleSave}
        >
          <Save className="size-3.5" />
          {updateSlide.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </header>

      <div
        className="w-full shrink-0 border-b border-[#fde68a] bg-[#fffbeb] px-4 py-1.5 text-center text-xs text-[#92400e]"
        role="status"
      >
        🚧 Editor en desarrollo — Próximamente disponible
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Panel izquierdo — salas */}
        <aside className="flex w-60 min-w-60 max-w-60 shrink-0 flex-col border-r border-[#e5e7eb] bg-white">
          <div className="shrink-0 space-y-3 border-b border-[#e5e7eb] p-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]">
                Título
              </Label>
              <Input
                value={activity.titulo}
                onChange={(e) => updateActivity({ titulo: e.target.value })}
                className="h-8 text-xs"
                placeholder="Escape Room"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]">
                  Tiempo límite
                </Label>
                <span className="text-[10px] font-semibold tabular-nums text-[#2563EB]">
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
                  updateActivity({
                    tiempoLimiteMinutos: v === 0 ? undefined : v,
                  });
                }}
                className="h-1.5 w-full cursor-pointer accent-[#2563EB]"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={salaIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {activity.salas.map((sala, index) => (
                    <SortableSalaThumb
                      key={sala.id}
                      sala={sala}
                      index={index}
                      isActive={sala.id === activeSala.id}
                      onSelect={() => setActiveSalaId(sala.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="shrink-0 border-t border-[#e5e7eb] p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-1.5 text-xs"
              onClick={addSala}
            >
              <Plus className="size-3.5" />
              Agregar sala
            </Button>
          </div>
        </aside>

        {/* Canvas central */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EscapeRoomSalaCanvas
            key={activeSala.id}
            classId={classId}
            salaId={activeSala.id}
            bloques={activeSala.bloques}
            fondo={activeSala.fondo}
            onChange={(patch) => updateSala(activeSala.id, patch)}
          />
        </main>

        {/* Panel derecho — lógica */}
        <aside className="flex w-[300px] min-w-[300px] max-w-[300px] shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
          <div className="shrink-0 border-b border-[#e5e7eb] px-3 py-2">
            <p className="text-xs font-semibold text-[#111827]">Configuración de sala</p>
            <p className="text-[10px] text-[#6b7280]">
              {activeSala.nombre.trim() || 'Sala activa'}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <EscapeRoomSalaConfigFields
              sala={activeSala}
              onUpdate={(patch) => updateSala(activeSala.id, patch)}
            />
          </div>
          <div className="shrink-0 space-y-3 border-t border-[#e5e7eb] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]">
              Global
            </p>
            <div className="space-y-1">
              <Label className="text-[11px]">Puntos base por sala</Label>
              <Input
                type="number"
                min={0}
                value={activity.puntosBase}
                onChange={(e) =>
                  updateActivity({
                    puntosBase: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="h-8 text-xs"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#374151]">
              <input
                type="checkbox"
                checked={activity.mostrarRanking}
                onChange={(e) =>
                  updateActivity({ mostrarRanking: e.target.checked })
                }
                className="size-3.5 accent-[#2563EB]"
              />
              Mostrar ranking
            </label>
          </div>
        </aside>
      </div>

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-[#e5e7eb] bg-white px-4 text-xs text-[#6b7280]">
        <span className={saveError ? 'text-destructive' : undefined}>{saveStatusLabel}</span>
        <span>{activity.salas.length} salas</span>
      </footer>
    </div>
  );
}
