'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { ClasificarActivity, ClasificarItem } from '@/types/slide.types';
import { evaluateActivityResponse, type ActivityEvaluationResult } from '@/lib/activity-scoring';
import { ActivityResultOverlay } from '../shared/activity-result-overlay';

// ── Draggable Item ────────────────────────────────────────────────────────────
interface DraggableItemProps {
  item: ClasificarItem;
  estado?: 'correcto' | 'incorrecto' | null;
  disabled?: boolean;
}

function DraggableItem({ item, estado, disabled }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const borderColor =
    estado === 'correcto'
      ? '#16A34A'
      : estado === 'incorrecto'
        ? '#DC2626'
        : '#E5E7EB';

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderColor, opacity: isDragging ? 0.4 : 1 }}
      className="rounded-md px-3 py-2 bg-white text-sm text-gray-800 shadow-sm border-2 cursor-grab active:cursor-grabbing transition-colors select-none"
      {...listeners}
      {...attributes}
    >
      {item.texto}
    </div>
  );
}

// ── Droppable Column ──────────────────────────────────────────────────────────
interface DroppableColumnProps {
  id: string;
  nombre: string;
  color: string;
  items: ClasificarItem[];
  estados: Record<string, 'correcto' | 'incorrecto' | null>;
  verificado: boolean;
}

function DroppableColumn({ id, nombre, color, items, estados, verificado }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl flex flex-col gap-2 p-3 min-h-[120px] transition-colors"
      style={{
        backgroundColor: isOver ? color + '33' : color + '11',
        border: `2px dashed ${isOver ? color : color + '88'}`,
      }}
    >
      <div
        className="rounded-lg px-3 py-1.5 text-center text-sm font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {nombre}
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        {items.map((item) => (
          <DraggableItem
            key={item.id}
            item={item}
            estado={verificado ? estados[item.id] : null}
            disabled={verificado}
          />
        ))}
      </div>
    </div>
  );
}

// ── Viewer principal ──────────────────────────────────────────────────────────
interface ClasificarViewerProps {
  actividad: ClasificarActivity;
  onComplete?: (response: unknown) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function ClasificarViewer({ actividad, onComplete }: ClasificarViewerProps) {
  const { configuracion, categorias, items } = actividad;
  const colores = configuracion.colorCategorias;

  // Map: itemId → categoriaId actual (null = sin clasificar)
  const [ubicaciones, setUbicaciones] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(items.map((i) => [i.id, null])),
  );

  const [shuffledItems] = useState(() => shuffle(items));
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [verificado, setVerificado] = useState(false);
  const [estados, setEstados] = useState<Record<string, 'correcto' | 'incorrecto' | null>>({});
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveDragId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    setActiveDragId(null);
    if (!over) return;

    const itemId = active.id as string;
    const destino = over.id as string;

    // 'sin-clasificar' es el área origen
    setUbicaciones((prev) => ({ ...prev, [itemId]: destino === 'sin-clasificar' ? null : destino }));
  }, []);

  const handleVerificar = useCallback(() => {
    const raw = { ubicaciones: { ...ubicaciones } };
    const evaluated = evaluateActivityResponse('clasificar', actividad, raw);
    const nuevosEstados: Record<string, 'correcto' | 'incorrecto' | null> = {};
    items.forEach((item, i) => {
      nuevosEstados[item.id] = evaluated.details[i]?.correct ? 'correcto' : 'incorrecto';
    });
    setEstados(nuevosEstados);
    setEvaluation(evaluated);
    setVerificado(true);
    setMostrarResultado(true);
    onComplete?.(raw);
  }, [actividad, items, ubicaciones, onComplete]);

  const handleReintentar = useCallback(() => {
    setUbicaciones(Object.fromEntries(items.map((i) => [i.id, null])));
    setEstados({});
    setVerificado(false);
    setMostrarResultado(false);
    setEvaluation(null);
  }, [items]);

  const itemsSinClasificar = shuffledItems.filter((i) => ubicaciones[i.id] === null);
  const todoClasificado = itemsSinClasificar.length === 0;
  const activeItem = activeDragId ? items.find((i) => i.id === activeDragId) : null;

  return (
    <div className="relative w-full h-full flex flex-col gap-3 p-3">
      {/*
        ⚠️ DndContext envuelve TODA la zona interactiva:
        el área origen (sin-clasificar) Y las columnas de categorías.
        Nunca mover el área origen fuera de este contexto.
      */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Área sin clasificar — DENTRO del DndContext */}
        {!verificado && (
          <DroppableColumn
            id="sin-clasificar"
            nombre="Elementos para clasificar"
            color="#6B7280"
            items={itemsSinClasificar}
            estados={{}}
            verificado={false}
          />
        )}

        {/* Columnas de categorías */}
        <div
          className="flex-1 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${configuracion.columnas}, 1fr)` }}
        >
          {categorias.map((cat, idx) => {
            const color = colores[idx % colores.length];
            const itemsEnCat = shuffledItems.filter((i) => ubicaciones[i.id] === cat.id);
            return (
              <DroppableColumn
                key={cat.id}
                id={cat.id}
                nombre={cat.nombre}
                color={color}
                items={itemsEnCat}
                estados={estados}
                verificado={verificado}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="rounded-md px-3 py-2 bg-white text-sm text-gray-800 shadow-lg border-2 border-blue-400 cursor-grabbing">
              {activeItem.texto}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Botón verificar — fuera del DndContext está bien (no es droppable/draggable) */}
      {!verificado && (
        <button
          onClick={handleVerificar}
          disabled={!todoClasificado}
          className="mt-1 self-center px-6 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          Verificar
        </button>
      )}

      {/* Overlay resultado */}
      {mostrarResultado && (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          onReintentar={configuracion.permitirReintento ? handleReintentar : undefined}
          mostrarReintentar={configuracion.permitirReintento}
        />
      )}
    </div>
  );
}
