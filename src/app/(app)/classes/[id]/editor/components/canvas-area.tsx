'use client';

import { useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { GripHorizontal, Presentation } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';

import type { Activity, Block, Slide } from '@/types/slide.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { EditorToolbar } from './editor-toolbar';
import { SlideInsertionToolbar } from './floating-toolbar';
import { SlideRenderer } from './slide-renderer';
import { cn } from '@/lib/utils';
import { useBlockDrag, getBlockPos } from '@/hooks/use-block-drag';

// ─── Per-block drag handle ────────────────────────────────────────────────────

/**
 * A small GripHorizontal badge centred on the top edge of a block.
 * Only this badge is pointer-interactive — the rest of the overlay div is
 * pointer-events:none, so clicks on the block body still reach SlideRenderer.
 */
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
  // Always use the original block position for the handle container so it
  // doesn't double-move while SlideRenderer shows the live preview.
  const pos = getBlockPos(block);
  const isActive = draggingId === id;

  return (
    <div
      style={{
        position: 'absolute',
        left:   `${pos.x}%`,
        top:    `${pos.y}%`,
        width:  `${pos.ancho}%`,
        height: `${pos.alto}%`,
        // Invisible container — never captures mouse itself
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      {/* Only the badge is interactive */}
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        title="Arrastrar bloque"
        style={{
          position:        'absolute',
          top:             0,
          left:            '50%',
          transform:       'translate(-50%, -40%)',
          width:           36,
          height:          16,
          pointerEvents:   'auto',
          cursor:          isActive ? 'grabbing' : 'grab',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          background:      'rgba(59, 130, 246, 0.85)',
          borderRadius:    '3px 3px 4px 4px',
          zIndex:          26,
          opacity:         isActive ? 0.4 : 1,
          transition:      'opacity 150ms',
          userSelect:      'none',
        }}
      >
        <GripHorizontal size={10} color="white" />
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CanvasAreaProps {
  slide: Slide | null;
  isLoading?: boolean;
  onBlockSelect?: (id: string) => void;
  onActivityChange?: (blockId: string, activity: Activity) => void;
  onRemoveBlock?: (blockId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/** Marco del slide: dimensiones vía CSS vars (--editor-slide-*) en globals.css */
const SLIDE_FRAME_CLASS = cn(
  'relative aspect-video w-full max-w-[var(--editor-slide-max-w)] max-h-[var(--editor-slide-max-h)] shrink-0 overflow-hidden',
  'rounded-md border border-border bg-card shadow-md',
);

export function CanvasArea({
  slide,
  isLoading,
  onBlockSelect,
  onActivityChange,
  onRemoveBlock,
}: CanvasAreaProps) {
  // ── classId (for PATCH URL) ─────────────────────────────────────────────────
  const params  = useParams<{ id: string }>();
  const classId = params.id ?? '';
  const queryClient = useQueryClient();

  // ── canvasRef — points at the slide frame div ───────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null);

  const hasActivityBlock =
    Boolean(slide?.bloques?.some((b) => b.tipo === 'actividad'));

  const patchSlideBloques = useCallback(
    async (bloques: Block[]) => {
      if (!slide?.id || !classId) return false;
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const res = await fetch(
        `${apiUrl}/classes/${classId}/slides/${slide.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            content: {
              bloques,
              ...(slide.fondo ? { fondo: slide.fondo } : {}),
              ...(slide.diseno ? { diseno: slide.diseno } : {}),
            },
          }),
        },
      );
      return res.ok;
    },
    [slide, classId],
  );

  const handleInsertBlock = useCallback(
    async (block: Block) => {
      if (hasActivityBlock && block.tipo !== 'texto' && block.tipo !== 'actividad') {
        toast.warning('Este slide solo admite texto junto a la actividad');
        return;
      }
      if (!slide?.id || !classId) return;
      const prev = slide.bloques ?? [];
      const next = [...prev, block];
      const newIndex = next.length - 1;
      try {
        const ok = await patchSlideBloques(next);
        if (!ok) {
          toast.error('No se pudo guardar el bloque');
          return;
        }
        await queryClient.refetchQueries({
          queryKey: ['classes', 'detail', classId],
        });
        setTimeout(() => {
          const el = canvasRef.current?.querySelector(
            `[data-block-id="${String(newIndex)}"]`,
          );
          (el as HTMLElement | null)?.click();
        }, 0);
      } catch {
        toast.error('No se pudo guardar el bloque');
      }
    },
    [slide, classId, hasActivityBlock, patchSlideBloques, queryClient],
  );

  // ── drag hook ───────────────────────────────────────────────────────────────
  const { handleDragStart, handleDragEnd, handleDragMove, draggingId, liveBloques } =
    useBlockDrag({
      canvasRef,
      slide,
      onSave: async (updatedBlocks: Block[]) => {
        try {
          await patchSlideBloques(updatedBlocks);
        } catch {
          // Silently ignore — the slide will re-sync on next load.
        }
      },
    });

  // ── dnd-kit sensors ─────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require ≥4 px movement before activating drag so normal clicks work.
      activationConstraint: { distance: 4 },
    }),
  );

  // ── live slide: inject updated positions during drag for real-time preview ──
  const liveSlide: Slide | null =
    slide && liveBloques ? { ...slide, bloques: liveBloques } : slide;

  const blocks = slide?.bloques ?? [];

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        'relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-end overflow-hidden',
        'bg-editor-workspace px-4 pb-2 pt-[var(--editor-canvas-pt)] md:px-6 md:pb-2 md:pt-[var(--editor-canvas-pt-md)]',
      )}
    >
      {/* Floating editor toolbar */}
      <div
        className={cn(
          'absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-1',
          'top-[var(--editor-toolbar-top)] md:top-[var(--editor-toolbar-top-md)]',
          'rounded-md border border-border bg-card px-2 py-1 shadow-sm',
          'motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 motion-safe:ease-out',
          'motion-reduce:transition-none',
        )}
      >
        <SlideInsertionToolbar
          disabled={isLoading || !liveSlide}
          restrictToTextOnly={hasActivityBlock}
          onInsert={handleInsertBlock}
        />
        <Separator orientation="vertical" className="h-6" />
        <EditorToolbar />
      </div>

      {isLoading ? (
        <div className={SLIDE_FRAME_CLASS}>
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      ) : liveSlide ? (
        <DndContext
          sensors={sensors}
          onDragStart={(e: DragStartEvent) => handleDragStart(e)}
          onDragMove={(e: DragMoveEvent)  => handleDragMove(e)}
          onDragEnd={(e: DragEndEvent)    => handleDragEnd(e)}
        >
          <div className={SLIDE_FRAME_CLASS} ref={canvasRef}>
            {/* Slide content — receives live positions during drag */}
            <SlideRenderer
              slide={liveSlide}
              modo="editor"
              onBlockSelect={onBlockSelect}
              onActivityChange={onActivityChange}
              onRemoveBlock={onRemoveBlock}
              className="absolute inset-0 h-full w-full"
            />

            {/* Drag handles — one badge per block, overlaid above SlideRenderer */}
            {blocks.map((block, index) => (
              <BlockDragHandle
                key={index}
                block={block}
                index={index}
                draggingId={draggingId}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <div className="flex w-full max-w-[var(--editor-slide-max-w)] flex-col items-center gap-3 pb-2 text-center">
          <Presentation
            className="size-10 shrink-0 text-muted-foreground/80"
            aria-hidden
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Sin slides</p>
            <p className="text-xs text-muted-foreground">
              Agrega slides desde el panel lateral
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
