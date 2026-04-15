'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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

import type { Activity, Background, Block, Slide } from '@/types/slide.types';
import {
  getBlockAtPath,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  SlideEditorChrome,
  SlideInsertionToolbar,
  type LayerReorderAction,
} from './floating-toolbar';
import { PropertiesPanel } from './panels/properties-panel';
import { SlideRenderer } from './slide-renderer';
import { cn } from '@/lib/utils';
import { useBlockDrag, getBlockPos } from '@/hooks/use-block-drag';

const MAX_UNDO = 20;

function cloneBloques(bloques: Block[]): Block[] {
  try {
    return structuredClone(bloques);
  } catch {
    return JSON.parse(JSON.stringify(bloques)) as Block[];
  }
}

function getBlockZ(block: Block): number {
  const z = (block as { zIndex?: number }).zIndex;
  return typeof z === 'number' ? z : 1;
}

function collectZIndices(blocks: Block[]): number[] {
  const out: number[] = [];
  function walk(arr: Block[]) {
    for (const b of arr) {
      out.push(getBlockZ(b));
      if (b.tipo === 'columnas') {
        for (const col of b.columnas) walk(col);
      }
    }
  }
  walk(blocks);
  return out;
}

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
  onCopyBlock?: (block: Block) => void;
  copiedBlock?: Block | null;
  /** Fired with live/committed block positions during and after drag (null when settled). */
  onEffectiveBloques?: (bloques: Block[] | null) => void;
  /** Panel «Respuestas en vivo» abierto: oculta PROPIEDADES aunque haya bloque seleccionado. */
  livePanelOpen?: boolean;
}

export type CanvasAreaHandle = {
  undo: () => void;
  redo: () => void;
  duplicateSelectedBlock: () => void;
  copySelectedBlock: () => void;
  /** Elimina el bloque seleccionado si hay uno; devuelve si se ejecutó la eliminación. */
  deleteSelectedBlock: () => boolean;
  clearBlockSelection: () => void;
};

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

export const CanvasArea = forwardRef<CanvasAreaHandle, CanvasAreaProps>(function CanvasArea(
  {
    slide,
    isLoading,
    onBlockSelect,
    onActivityChange,
    onRemoveBlock,
    onCopyBlock,
    copiedBlock,
    onEffectiveBloques,
    livePanelOpen = false,
  },
  ref,
) {
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

  const undoRef = useRef<Block[][]>([]);
  const redoRef = useRef<Block[][]>([]);
  const isUndoRedoRef = useRef(false);
  const [historyTick, setHistoryTick] = useState(0);
  const bumpHistory = useCallback(() => setHistoryTick((t) => t + 1), []);

  useEffect(() => {
    undoRef.current = [];
    redoRef.current = [];
    bumpHistory();
  }, [slide?.id, bumpHistory]);

  const canUndo = undoRef.current.length > 0;
  const canRedo = redoRef.current.length > 0;
  void historyTick;

  const patchSlideContent = useCallback(
    async (content: Record<string, unknown>): Promise<boolean> => {
      if (!slide?.id || !classId) return false;
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const sanitized = sanitizeSlideContentForPersistence(content) ?? content;
      const res = await fetch(
        `${apiUrl}/classes/${classId}/slides/${slide.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content: sanitized }),
        },
      );
      return res.ok;
    },
    [slide?.id, classId],
  );

  const buildContentPayload = useCallback(
    (bloques: Block[], fondoOverride?: Background) => {
      return {
        bloques,
        ...(fondoOverride !== undefined
          ? { fondo: fondoOverride }
          : slide?.fondo
            ? { fondo: slide.fondo }
            : {}),
        ...(slide?.diseno ? { diseno: slide.diseno } : {}),
      };
    },
    [slide?.fondo, slide?.diseno],
  );

  const pushUndo = useCallback(
    (prev: Block[]) => {
      if (isUndoRedoRef.current) return;
      undoRef.current = [...undoRef.current, cloneBloques(prev)];
      if (undoRef.current.length > MAX_UNDO) {
        undoRef.current = undoRef.current.slice(-MAX_UNDO);
      }
      redoRef.current = [];
      bumpHistory();
    },
    [bumpHistory],
  );

  const persistBloques = useCallback(
    async (
      nextBloques: Block[],
      previousBloques: Block[],
      recordHistory: boolean,
    ): Promise<boolean> => {
      let pushed = false;
      if (recordHistory && !isUndoRedoRef.current) {
        pushUndo(previousBloques);
        pushed = true;
      }
      const content = buildContentPayload(nextBloques);
      const ok = await patchSlideContent(content);
      if (!ok) {
        if (pushed && !isUndoRedoRef.current) {
          undoRef.current = undoRef.current.slice(0, -1);
          bumpHistory();
        }
        return false;
      }
      await queryClient.refetchQueries({
        queryKey: ['classes', 'detail', classId],
      });
      return true;
    },
    [buildContentPayload, patchSlideContent, pushUndo, queryClient, classId, bumpHistory],
  );

  const handleInsertBlock = useCallback(
    async (block: Block) => {
      if (hasActivityBlock && block.tipo !== 'texto' && block.tipo !== 'actividad') {
        toast.warning('Este slide solo admite texto junto a la actividad');
        return;
      }
      if (!slide?.id || !classId) return;
      const prev = cloneBloques(slide.bloques ?? []);
      const next = [...prev, block];
      const newIndex = next.length - 1;
      try {
        const ok = await persistBloques(next, prev, true);
        if (!ok) {
          toast.error('No se pudo guardar el bloque');
          return;
        }
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
    [slide, classId, hasActivityBlock, persistBloques],
  );

  const handleDuplicateBlock = useCallback(
    async (blockPath: string) => {
      if (!slide?.id || !classId) return;
      const prev = cloneBloques(slide.bloques ?? []);
      const b = getBlockAtPath(prev, blockPath);
      if (!b) return;

      const dup = structuredClone(b) as Block & { id?: string };
      dup.id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const dupPos = dup as { x?: number; y?: number; ancho?: number; alto?: number };

      if (dupPos.x !== undefined) {
        dupPos.x += 3;
        const width = typeof dupPos.ancho === 'number' ? dupPos.ancho : 0;
        if (dupPos.x + width > 100) dupPos.x -= 3;
      }
      if (dupPos.y !== undefined) {
        dupPos.y += 3;
      }

      const next = [...prev, dup];
      const newIndex = next.length - 1;

      try {
        const ok = await persistBloques(next, prev, true);
        if (ok) {
          setTimeout(() => {
            const el = canvasRef.current?.querySelector(
              `[data-block-id="${String(newIndex)}"]`
            ) as HTMLElement | null;
            if (el) el.click();
          }, 50);
        } else {
          toast.error('No se pudo duplicar el bloque');
        }
      } catch {
        toast.error('No se pudo duplicar el bloque');
      }
    },
    [slide?.id, classId, slide?.bloques, persistBloques],
  );

  const handleCopyBlock = useCallback(
    (blockPath: string) => {
      const b = getBlockAtPath(slide?.bloques ?? [], blockPath);
      if (b && onCopyBlock) {
        onCopyBlock(b);
        toast.success('Bloque copiado');
      }
    },
    [slide?.bloques, onCopyBlock],
  );

  const handleDragSave = useCallback(
    async (updatedBlocks: Block[]) => {
      setCommittedBloques(updatedBlocks);
      try {
        const prev = cloneBloques(slide?.bloques ?? []);
        await persistBloques(updatedBlocks, prev, true);
      } catch {
        // Silently ignore — positions will re-sync on next load.
      } finally {
        setCommittedBloques(null);
      }
    },
    [persistBloques, slide?.bloques],
  );

  // ── drag hook ───────────────────────────────────────────────────────────────
  const {
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    draggingId,
    liveBloques,
    snapLines,
    clearSnapLines,
  } = useBlockDrag({
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

  const handleUndo = useCallback(async () => {
    if (!slide?.id || undoRef.current.length === 0) return;
    const snapshot = undoRef.current.pop()!;
    const current = cloneBloques(liveSlide?.bloques ?? slide?.bloques ?? []);
    isUndoRedoRef.current = true;
    const content = buildContentPayload(snapshot);
    const ok = await patchSlideContent(content);
    isUndoRedoRef.current = false;
    if (ok) {
      redoRef.current.push(current);
      bumpHistory();
      await queryClient.refetchQueries({
        queryKey: ['classes', 'detail', classId],
      });
    } else {
      undoRef.current.push(snapshot);
      bumpHistory();
      toast.error('No se pudo deshacer');
    }
  }, [
    slide?.id,
    slide?.bloques,
    liveSlide?.bloques,
    buildContentPayload,
    patchSlideContent,
    queryClient,
    classId,
    bumpHistory,
  ]);

  const handleRedo = useCallback(async () => {
    if (redoRef.current.length === 0) return;
    const snapshot = redoRef.current.pop()!;
    const current = cloneBloques(liveSlide?.bloques ?? slide?.bloques ?? []);
    isUndoRedoRef.current = true;
    const content = buildContentPayload(snapshot);
    const ok = await patchSlideContent(content);
    isUndoRedoRef.current = false;
    if (ok) {
      undoRef.current.push(current);
      if (undoRef.current.length > MAX_UNDO) {
        undoRef.current = undoRef.current.slice(-MAX_UNDO);
      }
      bumpHistory();
      await queryClient.refetchQueries({
        queryKey: ['classes', 'detail', classId],
      });
    } else {
      redoRef.current.push(snapshot);
      bumpHistory();
      toast.error('No se pudo rehacer');
    }
  }, [
    liveSlide?.bloques,
    slide?.bloques,
    buildContentPayload,
    patchSlideContent,
    queryClient,
    classId,
    bumpHistory,
  ]);

  const handleReorder = useCallback(
    (action: LayerReorderAction) => {
      if (!selectedBlockId || !liveSlide?.bloques) return;
      const bloques = cloneBloques(liveSlide.bloques);
      const prev = cloneBloques(liveSlide.bloques);
      const zs = collectZIndices(bloques);
      if (zs.length === 0) return;
      const min = Math.min(...zs);
      const max = Math.max(...zs);
      const next = updateBlockAtPath(bloques, selectedBlockId, (b) => {
        const z = getBlockZ(b);
        let nz = z;
        if (action === 'traer_frente') nz = max + 1;
        else if (action === 'enviar_atras_total') nz = min - 1;
        else if (action === 'adelante_uno') nz = z + 1;
        else if (action === 'atras_uno') nz = z - 1;
        return { ...b, zIndex: nz } as Block;
      });
      void persistBloques(next, prev, true).then((ok) => {
        if (!ok) toast.error('No se pudo actualizar el orden de capas');
      });
    },
    [selectedBlockId, liveSlide?.bloques, persistBloques],
  );

  const handleChangeFondo = useCallback(
    async (fondo: Background) => {
      const bloques = liveSlide?.bloques ?? slide?.bloques ?? [];
      const content = buildContentPayload(cloneBloques(bloques), fondo);
      const ok = await patchSlideContent(content);
      if (ok) {
        await queryClient.refetchQueries({
          queryKey: ['classes', 'detail', classId],
        });
        toast.success('Fondo guardado');
      } else {
        toast.error('No se pudo guardar el fondo');
      }
    },
    [
      liveSlide?.bloques,
      slide?.bloques,
      buildContentPayload,
      patchSlideContent,
      queryClient,
      classId,
    ],
  );

  const handlePersistFromRenderer = useCallback(
    async ({
      previousBloques,
      content,
    }: {
      previousBloques: Block[];
      content: Record<string, unknown>;
    }) => {
      const nextBloques = (content.bloques as Block[]) ?? [];
      return persistBloques(nextBloques, previousBloques, true);
    },
    [persistBloques],
  );

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
  }, [slide?.id, selectedBlockId, effectiveBloques, slide?.bloques]);

  const handleRendererBlockSelect = useCallback(
    (id: string) => {
      setSelectedBlockId(id);
      onBlockSelect?.(id);
    },
    [onBlockSelect],
  );

  const handleApplyBloques = useCallback(
    async (next: Block[]) => {
      const prev = cloneBloques(liveSlide?.bloques ?? slide?.bloques ?? []);
      return persistBloques(next, prev, true);
    },
    [liveSlide?.bloques, slide?.bloques, persistBloques],
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

  const showPropertiesPanel =
    selectedBlockId != null && selectedBlockId !== '' && !livePanelOpen;

  useImperativeHandle(
    ref,
    () => ({
      undo: () => {
        void handleUndo();
      },
      redo: () => {
        void handleRedo();
      },
      duplicateSelectedBlock: () => {
        if (!selectedBlockId) return;
        void handleDuplicateBlock(selectedBlockId);
      },
      copySelectedBlock: () => {
        if (!selectedBlockId) return;
        handleCopyBlock(selectedBlockId);
      },
      deleteSelectedBlock: () => {
        if (!selectedBlockId) return false;
        onRemoveBlock?.(selectedBlockId);
        setSelectedBlockId(null);
        onBlockSelectRef.current?.('');
        return true;
      },
      clearBlockSelection: () => {
        setSelectedBlockId(null);
        onBlockSelectRef.current?.('');
      },
    }),
    [
      selectedBlockId,
      handleUndo,
      handleRedo,
      handleDuplicateBlock,
      handleCopyBlock,
      onRemoveBlock,
    ],
  );

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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedBlockId(null);
          onBlockSelectRef.current?.('');
        }
      }}
    >
      {/* Floating editor toolbar */}
      <div
        className={cn(
          'absolute left-1/2 z-10 flex max-w-[calc(100vw-2rem)] min-w-0 -translate-x-1/2 items-center gap-1',
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
        <SlideEditorChrome
          disabled={isLoading || !liveSlide}
          restrictToTextOnly={hasActivityBlock}
          selectedBlockId={selectedBlockId}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => void handleUndo()}
          onRedo={() => void handleRedo()}
          onReorder={handleReorder}
          fondo={liveSlide?.fondo}
          onChangeFondo={(f) => void handleChangeFondo(f)}
          onInsertAudio={handleInsertBlock}
        />
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
              onDuplicateBlock={handleDuplicateBlock}
              onCopyBlock={handleCopyBlock}
              onPersistSlide={handlePersistFromRenderer}
              onResizeInteractionEnd={clearSnapLines}
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

    <div
      className={cn(
        'h-full min-w-0 shrink-0 overflow-hidden transition-all duration-200 ease-in-out',
        showPropertiesPanel
          ? 'max-w-64 opacity-100 translate-x-0 pointer-events-auto'
          : 'max-w-0 opacity-0 translate-x-4 pointer-events-none',
      )}
    >
      <PropertiesPanel
        bloques={liveSlide?.bloques ?? []}
        selectedBlockId={selectedBlockId}
        onApplyBloques={handleApplyBloques}
      />
    </div>
    </div>
  );
});
