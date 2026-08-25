'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { GripHorizontal, Presentation } from 'lucide-react';
import { toast } from 'sonner';
import { useDraggable } from '@dnd-kit/core';

import { blockDragId } from '../lib/block-drag-id';

import type {
  Activity,
  Background,
  Block,
  FlipCardsWidget,
  Slide,
  SlideGuias,
  TabsWidget,
  CarouselWidget,
  ClickRevealWidget,
  TimelineWidget,
} from '@/types/slide.types';
import { EMPTY_SLIDE_GUIAS } from '@/types/slide.types';
import {
  getBlockAtPath,
  isUnimplementedInteractiveStub,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import { remintBlockChildIds } from '@/components/widgets/shared/widget-clone';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SlideEditorChrome,
  SlideInsertionToolbar,
  type LayerReorderAction,
} from './floating-toolbar';
import type { FlipCardsInnerSelection } from '@/components/widgets/flip-cards/flip-cards-config';
import type { TabsInnerSelection } from '@/components/widgets/tabs/tabs-config';
import type { CarouselInnerSelection } from '@/components/widgets/carousel/carousel-config';
import type { ClickRevealInnerSelection, HotspotInnerSelection, HotspotWidget, PopupInnerSelection, PopupWidget } from '@/types/widget.types';
import type { TimelineInnerSelection } from '@/components/widgets/timeline/timeline-config';
import { PropertiesPanel } from './panels/properties-panel';
import { SlideRenderer } from './slide-renderer';
import { cn } from '@/lib/utils';
import {
  applyNudgeToBlocks,
  getBlockPos,
  snapLineColor,
  snapPositionToGuides,
} from '@/hooks/use-block-drag';
import { toggleCenterGuides } from '@/lib/canvas-guides';
import { useEditorBlockDrag } from './editor-dnd-shell';
import { DroppableCanvas } from './droppable-canvas';
import { SpacingIndicators } from '@/components/editor/spacing-indicators';
import { CanvasGuidesChrome } from './canvas-guides';
import { AlignmentToolbar } from '@/components/editor/alignment-toolbar';
import {
  appendTextBlockToWidgetSlide,
  createWidgetSlideTextBlock,
  resolveWidgetSlideInsertTarget,
} from '@/components/widgets/shared/widget-slide-blocks';

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
  selectedBlockIds,
}: {
  block: Block;
  index: number;
  draggingId: string | null;
  selectedBlockIds: string[];
}) {
  const id = blockDragId(index);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    data: {
      selectedBlockIds,
    },
  });
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
  onFlipCardsChange?: (blockId: string, block: FlipCardsWidget) => void;
  onTabsChange?: (blockId: string, block: TabsWidget) => void;
  onCarouselChange?: (blockId: string, block: CarouselWidget) => void;
  onClickRevealChange?: (blockId: string, block: ClickRevealWidget) => void;
  onPopupChange?: (blockId: string, block: PopupWidget) => void;
  onHotspotChange?: (blockId: string, block: HotspotWidget) => void;
  onTimelineChange?: (blockId: string, block: TimelineWidget) => void;
  onRemoveBlock?: (blockId: string) => void;
  onCopyBlock?: (block: Block) => void;
  copiedBlock?: Block | null;
  /** Fired with live/committed block positions during and after drag (null when settled). */
  onEffectiveBloques?: (bloques: Block[] | null) => void;
  /** Panel «Respuestas en vivo» abierto: oculta PROPIEDADES aunque haya bloque seleccionado. */
  livePanelOpen?: boolean;
  /** Ref al marco del slide (compartido con EditorDndShell para drops del panel). */
  canvasSurfaceRef?: Ref<HTMLDivElement | null>;
  /** Muestra reglas y guías manuales (solo editor). */
  guidesVisible?: boolean;
}

export type CanvasAreaHandle = {
  undo: () => void;
  redo: () => void;
  duplicateSelectedBlock: () => void;
  copySelectedBlock: () => void;
  /** Elimina el bloque seleccionado si hay uno; devuelve si se ejecutó la eliminación. */
  deleteSelectedBlock: () => boolean;
  clearBlockSelection: () => void;
  /** Persiste posiciones tras arrastrar un bloque en el lienzo. */
  persistBloquesFromDrag: (bloques: Block[]) => void;
  /** Selecciona un bloque por índice (p. ej. tras insertar actividad). */
  selectBlockByIndex: (index: number) => void;
  /** Mueve la selección en px virtuales. Devuelve si había algo que mover. */
  nudgeSelectedBlocks: (dxPx: number, dyPx: number) => boolean;
  /** Añade o quita las guías centrales (640 / 360). */
  toggleCenterGuides: () => void;
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
    onFlipCardsChange,
    onTabsChange,
    onCarouselChange,
    onClickRevealChange,
    onPopupChange,
    onHotspotChange,
    onTimelineChange,
    onRemoveBlock,
    onCopyBlock,
    copiedBlock,
    onEffectiveBloques,
    livePanelOpen = false,
    canvasSurfaceRef,
    guidesVisible = true,
  },
  ref,
) {
  // ── classId (for PATCH URL) ─────────────────────────────────────────────────
  const params  = useParams<{ id: string }>();
  const classId = params.id ?? '';
  const queryClient = useQueryClient();

  // ── canvasRef — points at the slide frame div ───────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null);

  const setCanvasSurfaceRef = useCallback(
    (node: HTMLDivElement | null) => {
      canvasRef.current = node;
      if (typeof canvasSurfaceRef === 'function') {
        canvasSurfaceRef(node);
      } else if (canvasSurfaceRef && 'current' in canvasSurfaceRef) {
        (canvasSurfaceRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [canvasSurfaceRef],
  );

  const {
    draggingId,
    liveBloques,
    snapLines,
    clearSnapLines,
    setSnapLines,
    snapSuppressedRef,
  } = useEditorBlockDrag();

  /**
   * Optimistic bridge: holds the final block positions immediately after a
   * successful drag so the canvas doesn't snap back while the query refetches.
   * Cleared once the query settles or the active slide changes.
   */
  const [committedBloques, setCommittedBloques] = useState<Block[] | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [flipCardsInnerSelection, setFlipCardsInnerSelection] =
    useState<FlipCardsInnerSelection | null>(null);
  const [tabsInnerSelection, setTabsInnerSelection] =
    useState<TabsInnerSelection | null>(null);
  const [carouselInnerSelection, setCarouselInnerSelection] =
    useState<CarouselInnerSelection | null>(null);
  const [clickRevealInnerSelection, setClickRevealInnerSelection] =
    useState<ClickRevealInnerSelection | null>(null);
  const [popupInnerSelection, setPopupInnerSelection] =
    useState<PopupInnerSelection | null>(null);
  const [hotspotInnerSelection, setHotspotInnerSelection] =
    useState<HotspotInnerSelection | null>(null);
  const [timelineInnerSelection, setTimelineInnerSelection] =
    useState<TimelineInnerSelection | null>(null);

  const clearInnerSelections = useCallback(() => {
    setFlipCardsInnerSelection(null);
    setTabsInnerSelection(null);
    setCarouselInnerSelection(null);
    setClickRevealInnerSelection(null);
    setPopupInnerSelection(null);
    setHotspotInnerSelection(null);
    setTimelineInnerSelection(null);
  }, []);

  const [marqueeRect, setMarqueeRect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const wasDraggingRef = useRef(false);
  const onBlockSelectRef = useRef(onBlockSelect);
  onBlockSelectRef.current = onBlockSelect;
  const selectedBlockIdRef = useRef(selectedBlockId);
  selectedBlockIdRef.current = selectedBlockId;

  // Clear committed state when the user switches slides.
  useEffect(() => {
    setCommittedBloques(null);
  }, [slide?.id]);

  useEffect(() => {
    setSelectedBlockId(null);
    setSelectedBlockIds([]);
    clearInnerSelections();
  }, [slide?.id, clearInnerSelections]);

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
    (
      bloques: Block[],
      fondoOverride?: Background,
      guiasOverride?: SlideGuias,
    ) => {
      const guias = guiasOverride ?? slide?.guias ?? EMPTY_SLIDE_GUIAS;
      return {
        bloques,
        ...(fondoOverride !== undefined
          ? { fondo: fondoOverride }
          : slide?.fondo
            ? { fondo: slide.fondo }
            : {}),
        ...(slide?.diseno ? { diseno: slide.diseno } : {}),
        ...(slide?.transicion ? { transicion: slide.transicion } : {}),
        guias,
      };
    },
    [slide?.fondo, slide?.diseno, slide?.guias, slide?.transicion],
  );

  const persistGuias = useCallback(
    async (nextGuias: SlideGuias) => {
      if (!slide?.id || !classId) return;
      const bloques = slide.bloques ?? [];
      const content = buildContentPayload(bloques, undefined, nextGuias);
      const ok = await patchSlideContent(content);
      if (ok) {
        await queryClient.refetchQueries({
          queryKey: ['classes', 'detail', classId],
        });
      } else {
        toast.error('No se pudieron guardar las guías');
      }
    },
    [slide?.id, slide?.bloques, classId, buildContentPayload, patchSlideContent, queryClient],
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

      if (block.tipo === 'texto') {
        const widgetTarget = resolveWidgetSlideInsertTarget(
          selectedBlockId,
          slide.bloques ?? [],
          tabsInnerSelection,
          carouselInnerSelection,
        );
        if (widgetTarget) {
          const textBlock = createWidgetSlideTextBlock({
            contenido: block.contenido || 'Texto nuevo',
            tamanoFuente: block.tamanoFuente ?? '16px',
            color: block.color ?? '#334155',
            negrita: block.negrita ?? false,
            alineacion: block.alineacion ?? 'izquierda',
          });
          const updated = appendTextBlockToWidgetSlide(
            widgetTarget.widget,
            widgetTarget.slideId,
            textBlock,
          ) as TabsWidget | CarouselWidget;
          if (widgetTarget.kind === 'tabs') {
            onTabsChange?.(widgetTarget.blockPath, updated as TabsWidget);
          } else {
            onCarouselChange?.(widgetTarget.blockPath, updated as CarouselWidget);
          }
          toast.success('Texto añadido a la ficha activa');
          return;
        }
      }

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
    [
      slide,
      classId,
      hasActivityBlock,
      persistBloques,
      selectedBlockId,
      tabsInnerSelection,
      carouselInnerSelection,
      onTabsChange,
      onCarouselChange,
    ],
  );

  const handleDuplicateBlock = useCallback(
    async (blockPath: string) => {
      if (!slide?.id || !classId) return;
      const prev = cloneBloques(slide.bloques ?? []);
      const b = getBlockAtPath(prev, blockPath);
      if (!b) return;

      const dup = remintBlockChildIds(structuredClone(b) as Block) as Block & { id?: string };
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

  // ── snap during resize ──────────────────────────────────────────────────────
  /**
   * Called by SlideRenderer on every resize frame with the raw provisional
   * coordinates.  Runs the same snapPositionToGuides logic used during drag,
   * updates the visible orange guide lines, and returns the snapped coords so
   * SlideRenderer can show the live preview at the snapped position.
   */
  const handleResizeMove = useCallback(
    (
      blockId: string,
      rawCoords: { x: number; y: number; ancho: number; alto: number },
    ): { x: number; y: number; ancho: number; alto: number } => {
      const peers = slide?.bloques ?? [];
      const draggedIndex = parseInt(blockId, 10);

      const { x, y, lines } = snapPositionToGuides(
        rawCoords.x,
        rawCoords.y,
        rawCoords.ancho,
        rawCoords.alto,
        isNaN(draggedIndex) ? -1 : draggedIndex,
        peers,
        { guias: slide?.guias, enabled: !snapSuppressedRef.current },
      );

      setSnapLines(lines);
      return { x, y, ancho: rawCoords.ancho, alto: rawCoords.alto };
    },
    [slide?.bloques, slide?.guias, setSnapLines, snapSuppressedRef],
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
  const allBlocks = effectiveBloques ?? blocks;
  const activeBlock = selectedBlockId ? allBlocks[Number(selectedBlockId)] : undefined;

  useEffect(() => {
    if (draggingId != null) return;

    const bloques = effectiveBloques ?? slide?.bloques ?? [];
    if (!bloques.length) {
      setSelectedBlockId(null);
      setSelectedBlockIds([]);
      clearInnerSelections();
      onBlockSelectRef.current?.('');
      return;
    }
    if (selectedBlockId) {
      if (!getBlockAtPath(bloques, selectedBlockId)) {
        setSelectedBlockId(null);
        setSelectedBlockIds([]);
        clearInnerSelections();
        onBlockSelectRef.current?.('');
      }
    } else {
      setSelectedBlockIds((prev) => (prev.length === 0 ? prev : []));
    }
  }, [slide?.id, selectedBlockId, effectiveBloques, slide?.bloques, clearInnerSelections, draggingId]);

  const handleRendererBlockSelect = useCallback(
    (id: string, e?: React.MouseEvent) => {
      // Clear other widgets' inner state only when the selected block changes.
      // Same-click text focus then sets the field. Never do this in an effect
      // on selectedBlockId — that wipe runs after the inner set and drops it.
      if (selectedBlockIdRef.current !== id) {
        clearInnerSelections();
      }
      if (e?.shiftKey) {
        setSelectedBlockIds((prev) => {
          let next = [...prev];
          if (next.includes(id)) {
            next = next.filter((item) => item !== id);
          } else {
            next.push(id);
          }
          const lastSelected = next.length > 0 ? next[next.length - 1]! : null;
          setSelectedBlockId(lastSelected);
          onBlockSelect?.(lastSelected || '');
          return next;
        });
      } else {
        setSelectedBlockId(id);
        setSelectedBlockIds(id ? [id] : []);
        onBlockSelect?.(id);
      }
    },
    [onBlockSelect, clearInnerSelections],
  );

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    const target = e.target as HTMLElement;
    
    // Ignore if click started on interactive elements, block nodes, resize/drag handles
    if (
      target.closest('[data-block-id]') ||
      target.closest('[data-drag-handle]') ||
      target.closest('[data-resize-handle]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select')
    ) {
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setMarqueeRect({
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });

    let hasMoved = false;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      const currentRect = canvasRef.current.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(currentRect.width, moveEvent.clientX - currentRect.left));
      const currentY = Math.max(0, Math.min(currentRect.height, moveEvent.clientY - currentRect.top));

      const dx = moveEvent.clientX - (rect.left + startX);
      const dy = moveEvent.clientY - (rect.top + startY);
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMoved = true;
        wasDraggingRef.current = true;
      }

      setMarqueeRect((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentX,
          currentY,
        };
      });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      setMarqueeRect((prev) => {
        if (!prev) return null;

        const x1 = Math.min(prev.startX, prev.currentX);
        const x2 = Math.max(prev.startX, prev.currentX);
        const y1 = Math.min(prev.startY, prev.currentY);
        const y2 = Math.max(prev.startY, prev.currentY);

        const marqueeWidth = x2 - x1;
        const marqueeHeight = y2 - y1;

        if (marqueeWidth > 4 || marqueeHeight > 4) {
          const canvasBounds = canvasRef.current?.getBoundingClientRect();
          if (canvasBounds) {
            const canvasW = canvasBounds.width;
            const canvasH = canvasBounds.height;

            const marqueeLeftPct = (x1 / canvasW) * 100;
            const marqueeRightPct = (x2 / canvasW) * 100;
            const marqueeTopPct = (y1 / canvasH) * 100;
            const marqueeBottomPct = (y2 / canvasH) * 100;

            const intersectedIds: string[] = [];
            allBlocks.forEach((block, index) => {
              if (isUnimplementedInteractiveStub(block)) return;
              const pos = getBlockPos(block);
              const blockLeft = pos.x;
              const blockRight = pos.x + pos.ancho;
              const blockTop = pos.y;
              const blockBottom = pos.y + pos.alto;

              const overlapX = marqueeLeftPct < blockRight && marqueeRightPct > blockLeft;
              const overlapY = marqueeTopPct < blockBottom && marqueeBottomPct > blockTop;

              if (overlapX && overlapY) {
                intersectedIds.push(String(index));
              }
            });

            if (intersectedIds.length > 0) {
              setSelectedBlockIds(intersectedIds);
              const lastId = intersectedIds[intersectedIds.length - 1]!;
              if (selectedBlockIdRef.current !== lastId) {
                clearInnerSelections();
              }
              setSelectedBlockId(lastId);
              onBlockSelect?.(lastId);
            } else {
              setSelectedBlockIds([]);
              setSelectedBlockId(null);
              clearInnerSelections();
              onBlockSelect?.('');
            }
          }
        }

        return null;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [allBlocks, onBlockSelect, clearInnerSelections]);

  const handleApplyBloques = useCallback(
    async (next: Block[]) => {
      const prev = cloneBloques(liveSlide?.bloques ?? slide?.bloques ?? []);
      return persistBloques(next, prev, true);
    },
    [liveSlide?.bloques, slide?.bloques, persistBloques],
  );

  const handleApplySlide = useCallback(
    async (patch: Partial<Slide>): Promise<boolean> => {
      const bloques = cloneBloques(liveSlide?.bloques ?? slide?.bloques ?? []);
      const content: Record<string, unknown> = {
        ...buildContentPayload(bloques),
      };
      if (patch.transicion !== undefined) {
        content.transicion = patch.transicion;
      }
      const ok = await patchSlideContent(content);
      if (!ok) {
        toast.error('No se pudo guardar');
        return false;
      }
      await queryClient.refetchQueries({
        queryKey: ['classes', 'detail', classId],
      });
      return true;
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

  useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    const onClickCapture = (e: MouseEvent) => {
      if (wasDraggingRef.current) {
        wasDraggingRef.current = false;
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      const t = e.target as HTMLElement;
      if (t.closest('[data-block-id]')) return;
      if (t.closest('[data-drag-handle]')) return;
      setSelectedBlockId(null);
      setSelectedBlockIds([]);
      clearInnerSelections();
      onBlockSelectRef.current?.('');
    };
    root.addEventListener('click', onClickCapture, true);
    return () => root.removeEventListener('click', onClickCapture, true);
  }, [slide?.id, clearInnerSelections]);

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
        setSelectedBlockIds([]);
        clearInnerSelections();
        onBlockSelectRef.current?.('');
        return true;
      },
      clearBlockSelection: () => {
        setSelectedBlockId(null);
        setSelectedBlockIds([]);
        clearInnerSelections();
        onBlockSelectRef.current?.('');
      },
      persistBloquesFromDrag: (bloques) => {
        void handleDragSave(bloques);
      },
      selectBlockByIndex: (index) => {
        const id = String(index);
        if (selectedBlockIdRef.current !== id) {
          clearInnerSelections();
        }
        setSelectedBlockId(id);
        setSelectedBlockIds([id]);
        onBlockSelectRef.current?.(id);
        setTimeout(() => {
          const el = canvasRef.current?.querySelector(
            `[data-block-id="${id}"]`,
          ) as HTMLElement | null;
          el?.click();
        }, 0);
      },
      nudgeSelectedBlocks: (dxPx, dyPx) => {
        if (draggingId != null) return false;
        const ids =
          selectedBlockIds.length > 0
            ? selectedBlockIds
            : selectedBlockId
              ? [selectedBlockId]
              : [];
        const indices = ids
          .map(Number)
          .filter((n) => Number.isInteger(n) && n >= 0);
        if (indices.length === 0) return false;
        const prev = cloneBloques(liveSlide?.bloques ?? slide?.bloques ?? []);
        const next = applyNudgeToBlocks(prev, indices, dxPx, dyPx);
        const changed = indices.some((i) => {
          const a = getBlockPos(prev[i]!);
          const b = getBlockPos(next[i]!);
          return a.x !== b.x || a.y !== b.y;
        });
        if (!changed) return false;
        void persistBloques(next, prev, true);
        return true;
      },
      toggleCenterGuides: () => {
        const current = liveSlide?.guias ?? slide?.guias ?? EMPTY_SLIDE_GUIAS;
        void persistGuias(toggleCenterGuides(current));
      },
    }),
    [
      selectedBlockId,
      selectedBlockIds,
      draggingId,
      liveSlide?.bloques,
      liveSlide?.guias,
      slide?.bloques,
      slide?.guias,
      persistBloques,
      persistGuias,
      handleUndo,
      handleRedo,
      handleDuplicateBlock,
      handleCopyBlock,
      onRemoveBlock,
      handleDragSave,
      clearInnerSelections,
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
        // overflow-visible: allows rulers and blocks dragged outside the slide
        //   frame to remain visible and interactive in the grey workspace margin.
        'relative isolate flex min-h-0 min-w-0 flex-1 flex-col items-center justify-end overflow-visible',
        'bg-editor-workspace px-12 pb-12 pt-[var(--editor-canvas-pt)] md:px-12 md:pb-12 md:pt-[var(--editor-canvas-pt-md)]',
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setSelectedBlockId(null);
          setSelectedBlockIds([]);
          clearInnerSelections();
          onBlockSelectRef.current?.('');
        }
      }}
    >
      {/* Floating editor toolbar */}
      <div
        className={cn(
          'absolute left-1/2 z-50 flex max-w-[calc(100vw-2rem)] min-w-0 -translate-x-1/2 items-center gap-1',
          'top-[var(--editor-toolbar-top)] md:top-[var(--editor-toolbar-top-md)]',
          'rounded-2xl border border-[#e5e7eb] bg-white px-3 py-1.5 shadow-sm',
          'motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 motion-safe:ease-out',
          'motion-reduce:transition-none',
        )}
      >
        <SlideInsertionToolbar
          disabled={isLoading || !liveSlide}
          restrictToTextOnly={hasActivityBlock}
          onInsert={handleInsertBlock}
        />
        <div className="mx-1 h-4 w-px shrink-0 bg-[#e5e7eb]" aria-hidden />
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

      {/* Floating Alignment Toolbar */}
      {selectedBlockIds.length >= 2 && (
        <div
          className="absolute left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-1 duration-200"
          style={{
            top: 'calc(var(--editor-toolbar-top, 12px) + 52px)',
          }}
        >
          <AlignmentToolbar
            selectedIds={selectedBlockIds}
            bloques={liveSlide?.bloques ?? []}
            onApplyBloques={handleApplyBloques}
          />
        </div>
      )}

      {isLoading ? (
        <div className={SLIDE_VIEWPORT_CLASS}>
          <div className={SLIDE_SURFACE_CLASS}>
            <Skeleton className="h-full w-full rounded-none" />
          </div>
        </div>
      ) : liveSlide ? (
        <CanvasGuidesChrome
          visible={guidesVisible}
          viewportClassName={SLIDE_VIEWPORT_CLASS}
          guias={liveSlide.guias ?? EMPTY_SLIDE_GUIAS}
          onGuiasChange={(next) => {
            void persistGuias(next);
          }}
          canvasRef={canvasRef}
        >
          <DroppableCanvas
            ref={setCanvasSurfaceRef}
            className={cn(SLIDE_SURFACE_CLASS, 'z-0')}
            onMouseDown={handleCanvasMouseDown}
          >
          {/* Contenido del slide — independiente de reglas/guías */}
          <SlideRenderer
            slide={liveSlide}
            modo="editor"
            canvasRef={canvasRef}
            onBlockSelect={handleRendererBlockSelect}
            selectedBlockId={selectedBlockId}
            selectedBlockIds={selectedBlockIds}
            onActivityChange={onActivityChange}
            onFlipCardsChange={onFlipCardsChange}
            flipCardsInnerSelection={flipCardsInnerSelection}
            onFlipCardsInnerSelectionChange={setFlipCardsInnerSelection}
            onTabsChange={onTabsChange}
            tabsInnerSelection={tabsInnerSelection}
            onTabsInnerSelectionChange={setTabsInnerSelection}
            onCarouselChange={onCarouselChange}
            carouselInnerSelection={carouselInnerSelection}
            onCarouselInnerSelectionChange={setCarouselInnerSelection}
            onClickRevealChange={onClickRevealChange}
            clickRevealInnerSelection={clickRevealInnerSelection}
            onClickRevealInnerSelectionChange={setClickRevealInnerSelection}
            onPopupChange={onPopupChange}
            popupInnerSelection={popupInnerSelection}
            onPopupInnerSelectionChange={setPopupInnerSelection}
            onHotspotChange={onHotspotChange}
            hotspotInnerSelection={hotspotInnerSelection}
            onHotspotInnerSelectionChange={setHotspotInnerSelection}
            onTimelineChange={onTimelineChange}
            timelineInnerSelection={timelineInnerSelection}
            onTimelineInnerSelectionChange={setTimelineInnerSelection}
            onRemoveBlock={onRemoveBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onCopyBlock={handleCopyBlock}
            onPersistSlide={handlePersistFromRenderer}
            onResizeInteractionEnd={clearSnapLines}
            onResizeMove={handleResizeMove}
            className="absolute inset-0 h-full w-full min-h-0 min-w-0"
          />

          {marqueeRect && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(marqueeRect.startX, marqueeRect.currentX)}px`,
                top: `${Math.min(marqueeRect.startY, marqueeRect.currentY)}px`,
                width: `${Math.abs(marqueeRect.currentX - marqueeRect.startX)}px`,
                height: `${Math.abs(marqueeRect.currentY - marqueeRect.startY)}px`,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid #2563EB',
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            />
          )}

          {activeBlock ? (
            <SpacingIndicators
              activeBlock={activeBlock}
              activeIndex={
                Number.isInteger(Number(selectedBlockId))
                  ? Number(selectedBlockId)
                  : undefined
              }
              allBlocks={allBlocks}
              canvasWidth={1280}
              canvasHeight={720}
            />
          ) : null}

          {/* Drag handles — one badge per block, overlaid above SlideRenderer */}
          {blocks.map((block, index) =>
            isUnimplementedInteractiveStub(block) ? null : (
            <BlockDragHandle
              key={index}
              block={block}
              index={index}
              draggingId={draggingId}
              selectedBlockIds={selectedBlockIds}
            />
            ),
          )}

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
                  background: snapLineColor(line),
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
                  background: snapLineColor(line),
                  pointerEvents: 'none',
                  zIndex: 9999,
                }}
              />
            ),
          )}
          </DroppableCanvas>
        </CanvasGuidesChrome>
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
          ? 'max-w-72 opacity-100 translate-x-0 pointer-events-auto'
          : 'max-w-0 opacity-0 translate-x-4 pointer-events-none',
      )}
    >
      <PropertiesPanel
        bloques={liveSlide?.bloques ?? []}
        selectedBlockId={selectedBlockId}
        selectedBlockIds={selectedBlockIds}
        onApplyBloques={handleApplyBloques}
        slide={liveSlide}
        onApplySlide={handleApplySlide}
        flipCardsInnerSelection={flipCardsInnerSelection}
        tabsInnerSelection={tabsInnerSelection}
        carouselInnerSelection={carouselInnerSelection}
        clickRevealInnerSelection={clickRevealInnerSelection}
        popupInnerSelection={popupInnerSelection}
        hotspotInnerSelection={hotspotInnerSelection}
        timelineInnerSelection={timelineInnerSelection}
      />
    </div>
    </div>
  );
});
