'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

import type { Activity, Block, Slide } from '@/types/slide.types';
import { getBlockAtPath } from '@/lib/class-slide-normalize';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { EditorToolbar } from './editor-toolbar';
import { SlideInsertionToolbar } from './floating-toolbar';
import { PropertiesPanel } from './panels/properties-panel';
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
        data-drag-handle
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
  /** Fired with live/committed block positions during and after drag (null when settled). */
  onEffectiveBloques?: (bloques: Block[] | null) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Viewport 16:9 con tamaño de layout fijo (no crece con el contenido desbordado).
 * El marco interno (surface) es absolute inset-0 + overflow visible; el viewport fija el 16:9.
 */
const SLIDE_VIEWPORT_CLASS = cn(
  'relative aspect-video w-full max-w-[var(--editor-slide-max-w)] max-h-[var(--editor-slide-max-h)] shrink-0',
  'min-h-0 min-w-0',
);

const SLIDE_SURFACE_CLASS = cn(
  'absolute inset-0 overflow-visible rounded-md border border-border bg-card shadow-md',
);

export function CanvasArea({
  slide,
  isLoading,
  onBlockSelect,
  onActivityChange,
  onRemoveBlock,
  onEffectiveBloques,
}: CanvasAreaProps) {
  // ── classId (for PATCH URL) ─────────────────────────────────────────────────
  const params  = useParams<{ id: string }>();
  const classId = params.id ?? '';
  const queryClient = useQueryClient();

  // ── canvasRef — points at the slide frame div ───────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null);

  /**
   * Optimistic bridge: holds the final block positions immediately after a
   * successful drag so the canvas doesn't snap back while the query refetches.
   * Cleared once the query settles or the active slide changes.
   */
  const [committedBloques, setCommittedBloques] = useState<Block[] | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const onBlockSelectRef = useRef(onBlockSelect);
  onBlockSelectRef.current = onBlockSelect;

  // Clear committed state when the user switches slides.
  useEffect(() => {
    setCommittedBloques(null);
  }, [slide?.id]);

  useEffect(() => {
    setSelectedBlockId(null);
  }, [slide?.id]);

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

  const handleDragSave = useCallback(
    async (updatedBlocks: Block[]) => {
      setCommittedBloques(updatedBlocks);
      try {
        const ok = await patchSlideBloques(updatedBlocks);
        if (ok) {
          await queryClient.refetchQueries({
            queryKey: ['classes', 'detail', classId],
          });
        }
      } catch {
        // Silently ignore — positions will re-sync on next load.
      } finally {
        setCommittedBloques(null);
      }
    },
    [patchSlideBloques, queryClient, classId],
  );

  // ── drag hook ───────────────────────────────────────────────────────────────
  const { handleDragStart, handleDragEnd, handleDragMove, draggingId, liveBloques } =
    useBlockDrag({
      canvasRef,
      slide,
      onSave: handleDragSave,
    });

  // ── dnd-kit sensors ─────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require ≥4 px movement before activating drag so normal clicks work.
      activationConstraint: { distance: 4 },
    }),
  );

  // ── live slide: inject updated positions during drag for real-time preview ──
  // Priority: live drag positions > committed (post-drag, pre-refetch) > server state
  const effectiveBloques = liveBloques ?? committedBloques;
  const liveSlide: Slide | null =
    slide && effectiveBloques ? { ...slide, bloques: effectiveBloques } : slide;

  // Bubble effectiveBloques to parent so the slide panel thumbnail stays in sync.
  const onEffectiveBloquesRef = useRef(onEffectiveBloques);
  onEffectiveBloquesRef.current = onEffectiveBloques;
  /** Evita setState en el padre en cada render cuando la referencia ya se sincronizó (bucle infinito). */
  const lastPushedEffectiveBloquesRef = useRef<Block[] | null | undefined>(undefined);
  const lastSlideIdForPushRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (slide?.id !== lastSlideIdForPushRef.current) {
      lastSlideIdForPushRef.current = slide?.id;
      lastPushedEffectiveBloquesRef.current = undefined;
    }
    // Mientras DndKit mueve el puntero, actualizar el padre re-renderiza todo el árbol y
    // @dnd-kit puede re-entrar en onMove → Maximum update depth.
    if (draggingId != null) return;

    if (Object.is(lastPushedEffectiveBloquesRef.current, effectiveBloques)) return;
    lastPushedEffectiveBloquesRef.current = effectiveBloques;
    onEffectiveBloquesRef.current?.(effectiveBloques);
  }, [effectiveBloques, slide?.id, draggingId]);

  const blocks = slide?.bloques ?? [];

  useEffect(() => {
    if (!selectedBlockId) return;
    const bloques = effectiveBloques ?? slide?.bloques ?? [];
    if (!bloques.length) {
      setSelectedBlockId(null);
      onBlockSelectRef.current?.('');
      return;
    }
    if (!getBlockAtPath(bloques, selectedBlockId)) {
      setSelectedBlockId(null);
      onBlockSelectRef.current?.('');
    }
  }, [
    slide?.id,
    selectedBlockId,
    effectiveBloques,
    slide?.bloques?.length,
  ]);

  const handleRendererBlockSelect = useCallback(
    (id: string) => {
      setSelectedBlockId(id);
      onBlockSelect?.(id);
    },
    [onBlockSelect],
  );

  const handleApplyBloques = useCallback(
    async (next: Block[]) => {
      const ok = await patchSlideBloques(next);
      if (ok) {
        await queryClient.refetchQueries({
          queryKey: ['classes', 'detail', classId],
        });
      }
      return ok;
    },
    [patchSlideBloques, queryClient, classId],
  );

  useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    const onClickCapture = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-block-id]')) return;
      if (t.closest('[data-drag-handle]')) return;
      setSelectedBlockId(null);
      onBlockSelectRef.current?.('');
    };
    root.addEventListener('click', onClickCapture, true);
    return () => root.removeEventListener('click', onClickCapture, true);
  }, [slide?.id]);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
    {/*
      * overflow-visible (not hidden) so that blocks dragged outside the slide
      * frame remain visible and interactable in the grey workspace margin.
      * 48 px padding on all sides guarantees handles stay reachable.
      * The outermost flex div keeps overflow-hidden as the final clip boundary.
      */}
    <div
      className={cn(
        // isolate: new stacking context — blocks can't z-index-bleed into siblings.
        // overflow-clip: clips overflow at workspace boundary without creating a
        //   scroll container, so blocks beyond the 48 px padding are hidden but
        //   blocks in the padding zone remain visible and interactive.
        'relative isolate flex min-h-0 min-w-0 flex-1 flex-col items-center justify-end overflow-clip',
        'bg-editor-workspace px-12 pb-12 pt-[var(--editor-canvas-pt)] md:px-12 md:pb-12 md:pt-[var(--editor-canvas-pt-md)]',
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
        <div className={SLIDE_VIEWPORT_CLASS}>
          <div className={SLIDE_SURFACE_CLASS}>
            <Skeleton className="h-full w-full rounded-none" />
          </div>
        </div>
      ) : liveSlide ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <div className={SLIDE_VIEWPORT_CLASS}>
            <div ref={canvasRef} className={SLIDE_SURFACE_CLASS}>
            {/* Slide content — receives live positions during drag */}
            <SlideRenderer
              slide={liveSlide}
              modo="editor"
              canvasRef={canvasRef}
              onBlockSelect={handleRendererBlockSelect}
              onActivityChange={onActivityChange}
              onRemoveBlock={onRemoveBlock}
              className="absolute inset-0 h-full w-full min-h-0 min-w-0"
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

    <PropertiesPanel
      bloques={liveSlide?.bloques ?? []}
      selectedBlockId={selectedBlockId}
      onApplyBloques={handleApplyBloques}
    />
    </div>
  );
}
