'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { GripHorizontal } from 'lucide-react';

import type { Background, Block, Slide } from '@/types/slide.types';
import { mergeRendererSlideState, sanitizeSlideContentForPersistence } from '@/lib/class-slide-normalize';
import { SlideInsertionToolbar } from '../editor/components/floating-toolbar';
import { SlideRenderer } from '../editor/components/slide-renderer';
import { cn } from '@/lib/utils';
import { useBlockDrag, getBlockPos, snapPositionToGuides } from '@/hooks/use-block-drag';

const SLIDE_VIEWPORT_CLASS = cn(
  'relative aspect-video w-full max-w-4xl shrink-0',
  'min-h-0 min-w-0',
);

const SLIDE_SURFACE_CLASS = cn(
  'absolute inset-0 overflow-visible rounded-md border border-[#312e81] shadow-lg',
);

function BlockDragHandle({
  block,
  index,
  draggingId,
}: {
  block: Block;
  index: number;
  draggingId: string | null;
}) {
  const id = String(index);
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  const pos = getBlockPos(block);
  const isActive = draggingId === id;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${pos.ancho}%`,
        height: `${pos.alto}%`,
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      <div
        ref={setNodeRef}
        data-drag-handle
        {...attributes}
        {...listeners}
        title="Arrastrar bloque"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translate(-50%, -40%)',
          width: 36,
          height: 16,
          pointerEvents: 'auto',
          cursor: isActive ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(59, 130, 246, 0.85)',
          borderRadius: '3px 3px 4px 4px',
          zIndex: 26,
          opacity: isActive ? 0.4 : 1,
          userSelect: 'none',
        }}
      >
        <GripHorizontal size={10} color="white" />
      </div>
    </div>
  );
}

function visualBlocksOnly(bloques: Block[] | undefined): Block[] {
  return (bloques ?? []).filter((b) => b.tipo !== 'actividad');
}

export interface EscapeRoomSalaCanvasProps {
  classId: string;
  salaId: string;
  bloques?: Block[];
  fondo?: Background;
  onChange: (patch: { bloques?: Block[]; fondo?: Background }) => void;
}

export function EscapeRoomSalaCanvas({
  classId,
  salaId,
  bloques,
  fondo,
  onChange,
}: EscapeRoomSalaCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [committedBloques, setCommittedBloques] = useState<Block[] | null>(null);

  const visualBloques = visualBlocksOnly(bloques);
  const slide: Slide = useMemo(
    () => ({
      id: salaId,
      order: 0,
      type: 'CONTENT' as const,
      title: 'Sala',
      bloques: committedBloques ?? visualBloques,
      fondo: fondo ?? { tipo: 'color', valor: '#1e1b4b' },
      content: null,
    }),
    [salaId, committedBloques, visualBloques, fondo],
  );

  useEffect(() => {
    setCommittedBloques(null);
  }, [salaId]);

  const applyContent = useCallback(
    (content: Record<string, unknown>) => {
      const nextBloques = visualBlocksOnly(
        Array.isArray(content.bloques) ? (content.bloques as Block[]) : [],
      );
      const nextFondo =
        content.fondo && typeof content.fondo === 'object' && !Array.isArray(content.fondo)
          ? (content.fondo as Background)
          : slide.fondo;
      onChange({ bloques: nextBloques, fondo: nextFondo });
      return true;
    },
    [onChange, slide.fondo],
  );

  const handlePersistFromRenderer = useCallback(
    async ({ content }: { previousBloques: Block[]; content: Record<string, unknown> }) => {
      const sanitized = sanitizeSlideContentForPersistence(content) ?? content;
      return applyContent(sanitized);
    },
    [applyContent],
  );

  const handleInsertBlock = useCallback(
    (block: Block) => {
      if (block.tipo === 'actividad') return;
      const prev = visualBlocksOnly(slide.bloques);
      const next = [...prev, block];
      void applyContent(mergeRendererSlideState(slide, { bloques: next }));
    },
    [slide, applyContent],
  );

  const handleDragSave = useCallback(
    async (updatedBlocks: Block[]) => {
      setCommittedBloques(updatedBlocks);
      applyContent(mergeRendererSlideState(slide, { bloques: updatedBlocks }));
      setCommittedBloques(null);
    },
    [slide, applyContent],
  );

  const {
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    draggingId,
    liveBloques,
    snapLines,
    setSnapLines,
    clearSnapLines,
  } = useBlockDrag({
    canvasRef,
    slide,
    onSave: handleDragSave,
  });

  const liveSlide: Slide = liveBloques
    ? { ...slide, bloques: liveBloques }
    : slide;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleResizeMove = useCallback(
    (
      blockId: string,
      rawCoords: { x: number; y: number; ancho: number; alto: number },
    ) => {
      const peers = liveSlide.bloques ?? [];
      const draggedIndex = parseInt(blockId, 10);
      const { x, y, lines } = snapPositionToGuides(
        rawCoords.x,
        rawCoords.y,
        rawCoords.ancho,
        rawCoords.alto,
        Number.isNaN(draggedIndex) ? -1 : draggedIndex,
        peers,
      );
      setSnapLines(lines);
      return { x, y, ancho: rawCoords.ancho, alto: rawCoords.alto };
    },
    [liveSlide.bloques, setSnapLines],
  );

  const handleChangeFondo = useCallback(
    (nextFondo: Background) => {
      onChange({ bloques: visualBloques, fondo: nextFondo });
    },
    [onChange, visualBloques],
  );

  const blocks = liveSlide.bloques ?? [];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-[#0f0d24] p-6">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#312e81] bg-[#1e1b4b] px-3 py-1.5 shadow-sm">
        <SlideInsertionToolbar onInsert={handleInsertBlock} />
        <div className="mx-1 h-4 w-px shrink-0 bg-[#4338ca]" aria-hidden />
        <label className="flex items-center gap-2 text-[11px] text-indigo-100">
          <span>Fondo</span>
          <input
            type="color"
            value={
              liveSlide.fondo?.tipo === 'color'
                ? liveSlide.fondo.valor
                : '#1e1b4b'
            }
            onChange={(e) =>
              handleChangeFondo({ tipo: 'color', valor: e.target.value })
            }
            className="size-7 cursor-pointer rounded border border-[#4338ca] bg-transparent p-0"
            aria-label="Color de fondo de la sala"
          />
        </label>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className={SLIDE_VIEWPORT_CLASS}>
          <div ref={canvasRef} className={SLIDE_SURFACE_CLASS}>
            <SlideRenderer
              slide={liveSlide}
              modo="editor"
              canvasRef={canvasRef}
              viewerClassId={classId}
              onPersistSlide={handlePersistFromRenderer}
              onResizeInteractionEnd={clearSnapLines}
              onResizeMove={handleResizeMove}
              variant="dark"
              className="absolute inset-0 h-full w-full min-h-0 min-w-0"
            />
            {blocks.map((block, index) => (
              <BlockDragHandle
                key={`${salaId}-${index}`}
                block={block}
                index={index}
                draggingId={draggingId}
              />
            ))}
            {snapLines.map((line, i) =>
              line.orientation === 'vertical' ? (
                <div
                  key={`snap-v-${line.position}-${i}`}
                  style={{
                    position: 'absolute',
                    left: `${line.position}%`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: '#F97316',
                    pointerEvents: 'none',
                    zIndex: 9999,
                  }}
                />
              ) : (
                <div
                  key={`snap-h-${line.position}-${i}`}
                  style={{
                    position: 'absolute',
                    top: `${line.position}%`,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: '#F97316',
                    pointerEvents: 'none',
                    zIndex: 9999,
                  }}
                />
              ),
            )}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
