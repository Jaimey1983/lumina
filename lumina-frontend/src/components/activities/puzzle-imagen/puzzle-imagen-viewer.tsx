'use client';

import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
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
import { PuzzleImagenActivity } from '@/types/slide.types';
import { evaluateActivityResponse, wrapActivityDraftResponse, type ActivityEvaluationResult } from '@/lib/activity-scoring';
import { ActivityResultOverlay } from '../shared/activity-result-overlay';
import {
  calcularTamanoCeldaPuzzle,
  generarOrdenMezclado,
  PUZZLE_IMAGEN_GAP_PX,
} from './puzzle-imagen-config';

interface PiezaProps {
  index: number;
  filas: number;
  columnas: number;
  imagen: string;
  cellSize: number;
  disabled?: boolean;
  isDragging?: boolean;
}

function piezaBackgroundPosition(index: number, filas: number, columnas: number): string {
  const row = Math.floor(index / columnas);
  const col = index % columnas;
  return `${col * (100 / Math.max(columnas - 1, 1))}% ${row * (100 / Math.max(filas - 1, 1))}%`;
}

function piezaStyle(
  index: number,
  filas: number,
  columnas: number,
  imagen: string,
  cellSize: number,
): React.CSSProperties {
  return {
    width: cellSize,
    height: cellSize,
    backgroundImage: `url(${imagen})`,
    backgroundSize: `${columnas * 100}% ${filas * 100}%`,
    backgroundPosition: piezaBackgroundPosition(index, filas, columnas),
  };
}

function Pieza({
  index,
  filas,
  columnas,
  imagen,
  cellSize,
  disabled,
  isDragging,
  embedded,
}: PiezaProps & { embedded?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `pieza-${index}`,
    disabled,
  });

  const style: React.CSSProperties = {
    ...(embedded
      ? {
          width: '100%',
          height: '100%',
          backgroundImage: `url(${imagen})`,
          backgroundSize: `${columnas * 100}% ${filas * 100}%`,
          backgroundPosition: piezaBackgroundPosition(index, filas, columnas),
        }
      : piezaStyle(index, filas, columnas, imagen, cellSize)),
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: disabled ? 'default' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        embedded
          ? 'h-full w-full'
          : 'shrink-0 rounded-sm border-2 border-gray-200 transition-colors hover:border-blue-400'
      }
      {...(disabled ? {} : { ...listeners, ...attributes })}
    />
  );
}

interface SlotProps {
  posicion: number;
  filas: number;
  columnas: number;
  imagen: string;
  cellSize: number;
  piezaActual: number | null;
  esCorrecta: boolean;
  mostrarNumero: boolean;
  verificado: boolean;
}

function Slot({
  posicion,
  filas,
  columnas,
  imagen,
  cellSize,
  piezaActual,
  esCorrecta,
  mostrarNumero,
  verificado,
}: SlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${posicion}` });

  return (
    <div
      ref={setNodeRef}
      className="relative shrink-0 overflow-hidden rounded-sm border-2 transition-colors"
      style={{
        width: cellSize,
        height: cellSize,
        borderColor: verificado
          ? esCorrecta
            ? '#16A34A'
            : '#DC2626'
          : isOver
            ? '#2563EB'
            : '#E5E7EB',
        backgroundColor: isOver ? '#EFF6FF' : '#F9FAFB',
      }}
    >
      {piezaActual !== null ? (
        <Pieza
          index={piezaActual}
          filas={filas}
          columnas={columnas}
          imagen={imagen}
          cellSize={cellSize}
          disabled={verificado}
          embedded
        />
      ) : (
        mostrarNumero && (
          <span
            className="absolute inset-0 flex items-center justify-center font-bold text-gray-300"
            style={{ fontSize: Math.max(10, Math.floor(cellSize * 0.22)) }}
          >
            {posicion + 1}
          </span>
        )
      )}
    </div>
  );
}

interface OrigenAreaProps {
  filas: number;
  columnas: number;
  imagen: string;
  cellSize: number;
  origenPiezas: number[];
  verificado: boolean;
  activeDragId: string | null;
}

function OrigenArea({
  filas,
  columnas,
  imagen,
  cellSize,
  origenPiezas,
  verificado,
  activeDragId,
}: OrigenAreaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'origen' });
  const origenCols = columnas;

  if (cellSize <= 0) return null;

  return (
    <div
      ref={setNodeRef}
      className="rounded-lg p-1 transition-colors"
      style={{
        minWidth: origenCols * cellSize + (origenCols - 1) * PUZZLE_IMAGEN_GAP_PX + 8,
        minHeight: filas * cellSize + (filas - 1) * PUZZLE_IMAGEN_GAP_PX + 8,
        backgroundColor: isOver ? '#EFF6FF' : 'transparent',
        border: isOver ? '2px dashed #2563EB' : '2px dashed transparent',
      }}
    >
      <div
        className="grid justify-center"
        style={{
          gridTemplateColumns: `repeat(${origenCols}, ${cellSize}px)`,
          gridAutoRows: `${cellSize}px`,
          gap: PUZZLE_IMAGEN_GAP_PX,
        }}
      >
        {origenPiezas.map((idx) => (
          <Pieza
            key={idx}
            index={idx}
            filas={filas}
            columnas={columnas}
            imagen={imagen}
            cellSize={cellSize}
            disabled={verificado}
            isDragging={activeDragId === `pieza-${idx}`}
          />
        ))}
      </div>
    </div>
  );
}

interface PuzzleImagenViewerProps {
  actividad: PuzzleImagenActivity;
  onComplete?: (response: unknown) => void;
}

export function PuzzleImagenViewer({ actividad, onComplete }: PuzzleImagenViewerProps) {
  const { configuracion, imagen } = actividad;
  const { filas, columnas, mostrarVista, dificultad } = configuracion;
  const total = filas * columnas;

  const [origenPiezas, setOrigenPiezas] = useState<number[]>(() =>
    generarOrdenMezclado(filas, columnas),
  );
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(total).fill(null));
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [verificado, setVerificado] = useState(false);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [evaluation, setEvaluation] = useState<ActivityEvaluationResult | null>(null);
  const [cellSize, setCellSize] = useState(0);
  const assemblyAreaRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (verificado) return;
    onComplete?.(wrapActivityDraftResponse({ slots }));
  }, [slots, verificado, onComplete]);

  useLayoutEffect(() => {
    const el = assemblyAreaRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setCellSize(
        calcularTamanoCeldaPuzzle(rect.width, rect.height, filas, columnas, PUZZLE_IMAGEN_GAP_PX),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [filas, columnas]);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveDragId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      setActiveDragId(null);
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;
      const piezaIndex = parseInt(activeId.replace('pieza-', ''), 10);

      if (overId.startsWith('slot-')) {
        const slotPos = parseInt(overId.replace('slot-', ''), 10);

        setSlots((prev) => {
          const nuevos = [...prev];
          const slotAnterior = prev.findIndex((s) => s === piezaIndex);
          const displaced = nuevos[slotPos];

          if (slotAnterior !== -1) {
            nuevos[slotAnterior] = null;
          }

          if (displaced !== null && displaced !== piezaIndex) {
            setOrigenPiezas((op) => [...op, displaced]);
          }

          nuevos[slotPos] = piezaIndex;

          if (slotAnterior === -1) {
            setOrigenPiezas((op) => op.filter((p) => p !== piezaIndex));
          }

          return nuevos;
        });
      } else if (overId === 'origen') {
        const slotAnterior = slots.findIndex((s) => s === piezaIndex);
        if (slotAnterior !== -1) {
          setSlots((prev) => {
            const nuevos = [...prev];
            nuevos[slotAnterior] = null;
            return nuevos;
          });
          setOrigenPiezas((op) => [...op, piezaIndex]);
        }
      }
    },
    [slots],
  );

  const handleVerificar = useCallback(() => {
    setVerificado(true);
    const raw = { slots: [...slots] };
    const evaluated = evaluateActivityResponse('puzzle_imagen', actividad, raw);
    setEvaluation(evaluated);
    onComplete?.(raw);
    setMostrarResultado(evaluated.score !== null);
  }, [actividad, slots, onComplete]);

  const handleReintentar = useCallback(() => {
    setOrigenPiezas(generarOrdenMezclado(filas, columnas));
    setSlots(Array(total).fill(null));
    setVerificado(false);
    setMostrarResultado(false);
    setEvaluation(null);
  }, [filas, columnas, total]);

  const todosColocados = origenPiezas.length === 0;
  const activePiezaIndex = activeDragId
    ? parseInt(activeDragId.replace('pieza-', ''), 10)
    : null;
  const mostrarNumeroEnSlot = dificultad === 'facil';

  if (!imagen) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
        Sin imagen configurada
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden p-3">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {mostrarVista && dificultad !== 'dificil' && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-gray-500">Referencia:</span>
            <img
              src={imagen}
              alt="Referencia"
              className="h-10 rounded border border-gray-200 object-cover"
            />
          </div>
        )}

        <div className="flex min-h-0 flex-1 gap-2 overflow-hidden">
          <div className="flex min-h-0 w-[38%] flex-col gap-1 overflow-hidden">
            <span className="shrink-0 text-xs font-medium text-gray-500">Piezas</span>
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto">
              <OrigenArea
                filas={filas}
                columnas={columnas}
                imagen={imagen}
                cellSize={cellSize}
                origenPiezas={origenPiezas}
                verificado={verificado}
                activeDragId={activeDragId}
              />
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-hidden">
            <span className="shrink-0 text-xs font-medium text-gray-500">Armalo aquí</span>
            <div
              ref={assemblyAreaRef}
              className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            >
              {cellSize > 0 && (
                <div
                  className="grid shrink-0"
                  style={{
                    gridTemplateColumns: `repeat(${columnas}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${filas}, ${cellSize}px)`,
                    gap: PUZZLE_IMAGEN_GAP_PX,
                  }}
                >
                  {slots.map((pieza, pos) => (
                    <Slot
                      key={pos}
                      posicion={pos}
                      filas={filas}
                      columnas={columnas}
                      imagen={imagen}
                      cellSize={cellSize}
                      piezaActual={pieza}
                      esCorrecta={pieza === pos}
                      mostrarNumero={mostrarNumeroEnSlot}
                      verificado={verificado}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activePiezaIndex !== null && cellSize > 0 && (
            <div
              className="rounded-sm border-2 border-blue-400 shadow-xl"
              style={piezaStyle(activePiezaIndex, filas, columnas, imagen, cellSize)}
            />
          )}
        </DragOverlay>
      </DndContext>

      {!verificado && (
        <button
          type="button"
          onClick={handleVerificar}
          disabled={!todosColocados}
          className="shrink-0 self-center rounded-lg bg-[#2563EB] px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Verificar
        </button>
      )}

      {mostrarResultado && (
        <ActivityResultOverlay
          evaluation={evaluation ?? undefined}
          onReintentar={handleReintentar}
          mostrarReintentar={true}
        />
      )}
    </div>
  );
}
