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
  ClipGroupBlock,
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
  removeBlockAtPath,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import { remintBlockChildIds } from '@/components/widgets/shared/widget-clone';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SlideEditorChrome,
  SlideInsertionToolbar,
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
  isBlockCanvasLocked,
  isBlockCanvasPositionable,
  prepareBlockForPaste,
  snapLineColor,
  snapPositionToGuides,
} from '@/hooks/use-block-drag';
import { toggleCenterGuides } from '@/lib/canvas-guides';
import { setSlideGrillaSize, toggleSlideGrilla } from '@/lib/canvas-grid';
import {
  CANVAS_ZOOM_DEFAULT,
  stepCanvasZoom,
  wheelDeltaToZoomStep,
} from '@/lib/canvas-zoom';
import { useEditorBlockDrag } from './editor-dnd-shell';
import { DroppableCanvas } from './droppable-canvas';
import { SpacingIndicators } from '@/components/editor/spacing-indicators';
import { CanvasGuidesChrome } from './canvas-guides';
import { AlignmentToolbar } from '@/components/editor/alignment-toolbar';
import { LayersPanel } from '@/components/editor/layers-panel';
import {
  applyLayerReorderAction,
  type LayerReorderAction,
} from '@/lib/canvas-layers';
import {
  appendTextBlockToWidgetSlide,
  createWidgetSlideTextBlock,
  resolveWidgetSlideInsertTarget,
} from '@/components/widgets/shared/widget-slide-blocks';
import {
  MAX_UNDO,
  canRedoHistory,
  canUndoHistory,
  captureSlideSnapshot,
  cloneSlideBlocks,
  createInitialHistory,
  historyViewItems,
  jumpHistory,
  pushHistoryEntry,
  redoHistory,
  resetSlideHistory as createFreshSlideHistory,
  undoHistory,
  type HistoryKind,
  type SlideHistorySnapshot,
  type SlideHistoryState,
} from '../lib/canvas-history';

const DEFAULT_SLIDE_FONDO: Background = { tipo: 'color', valor: '#ffffff' };

function buildPastedBlock(source: Block): Block {
  const cloned =
    typeof structuredClone === 'function'
      ? structuredClone(source)
      : (JSON.parse(JSON.stringify(source)) as Block);
  const reminted = remintBlockChildIds(cloned);
  return prepareBlockForPaste(reminted, {
    newId: `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  });
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
  if (!isBlockCanvasPositionable(block) || isBlockCanvasLocked(block)) {
    return null;
  }

  const id = blockDragId(index);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id,
    data: {
      selectedBlockIds,
    },
  });
  // Posición sincronizada con SlideRenderer (effectiveBloques durante drag/commit).
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
  /** Fired with live/committed block positions during and after drag (null when settled). */
  onEffectiveBloques?: (bloques: Block[] | null) => void;
  /** Notifica cambios en canUndo/canRedo (p. ej. topbar del editor). */
  onHistoryStateChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  /** Panel «Respuestas en vivo» abierto: oculta PROPIEDADES aunque haya bloque seleccionado. */
  livePanelOpen?: boolean;
  /** Ref al marco del slide (compartido con EditorDndShell para drops del panel). */
  canvasSurfaceRef?: Ref<HTMLDivElement | null>;
  /** Muestra reglas y guías manuales (solo editor). */
  guidesVisible?: boolean;
  /** Escala visual del lienzo (1 = 100 %). */
  canvasZoom?: number;
  onCanvasZoomChange?: (zoom: number) => void;
}

export type CanvasAreaHandle = {
  undo: () => void;
  redo: () => void;
  /** Pega en el slide activo y registra el cambio en la pila de undo. */
  pasteCopiedBlock: (block: Block) => void;
  /**
   * Pega en cualquier slide (cross-slide) con historial de undo por slideId.
   * `slideMeta` debe reflejar el estado actual del slide destino en servidor.
   */
  pasteCopiedBlockInSlide: (
    slideId: string,
    block: Block,
    slideMeta: { bloques: Block[]; fondo?: Background; guias?: SlideGuias },
  ) => void;
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
  /** Activa o desactiva la grilla de snap del slide. */
  toggleGrid: () => void;
  /** Cambia el tamaño de celda de la grilla (px virtuales) y la activa. */
  setGridSize: (tamanoPx: number) => void;
  /** Reinicia la pila Ctrl+Z del slide activo (p. ej. tras restaurar una versión). */
  resetSlideHistory: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Viewport 16:9 con tamaño de layout fijo (no crece con el contenido desbordado).
 * El marco interno (surface) es absolute inset-0 + overflow visible; el viewport fija el 16:9.
 */
const SLIDE_VIEWPORT_CLASS = cn(
  'relative aspect-video w-full max-w-full max-h-full shrink-0',
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
    onCopyBlock,
    onEffectiveBloques,
    onHistoryStateChange,
    livePanelOpen = false,
    canvasSurfaceRef,
    guidesVisible = true,
    canvasZoom = CANVAS_ZOOM_DEFAULT,
    onCanvasZoomChange,
  },
  ref,
) {
  const workspaceRef = useRef<HTMLDivElement>(null);
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
  const [clipGroupInnerEditId, setClipGroupInnerEditId] = useState<string | null>(
    null,
  );

  const clearInnerSelections = useCallback(() => {
    setFlipCardsInnerSelection(null);
    setTabsInnerSelection(null);
    setCarouselInnerSelection(null);
    setClickRevealInnerSelection(null);
    setPopupInnerSelection(null);
    setHotspotInnerSelection(null);
    setTimelineInnerSelection(null);
    setClipGroupInnerEditId(null);
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

  /**
   * Pila de edición por slideId (sesión del editor). Ver `canvas-history.ts`.
   * No se limpia al cambiar de slide; se pierde al desmontar CanvasArea.
   */
  const historiesRef = useRef<Map<string, SlideHistoryState>>(new Map());
  const isUndoRedoRef = useRef(false);
  /** Metadatos del slide en pantalla (fondo/guias/transición) para snapshots coherentes. */
  const editorMetaRef = useRef<{
    fondo?: Background;
    guias: SlideGuias;
    transicion?: Slide['transicion'];
  }>({
    guias: EMPTY_SLIDE_GUIAS,
  });
  const [historyTick, setHistoryTick] = useState(0);
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const bumpHistory = useCallback(() => setHistoryTick((t) => t + 1), []);

  useEffect(() => {
    if (!slide?.id) return;
    if (!historiesRef.current.has(slide.id)) {
      historiesRef.current.set(
        slide.id,
        createInitialHistory(captureSlideSnapshot(slide, 'inicio')),
      );
    }
    bumpHistory();
  }, [slide?.id, bumpHistory]);

  const activeHistory = slide?.id
    ? historiesRef.current.get(slide.id)
    : undefined;
  const canUndo = activeHistory ? canUndoHistory(activeHistory) : false;
  const canRedo = activeHistory ? canRedoHistory(activeHistory) : false;
  const historyItems = activeHistory ? historyViewItems(activeHistory) : [];
  void historyTick;

  useEffect(() => {
    setClipGroupInnerEditId(null);
  }, [slide?.id, selectedBlockId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClipGroupInnerEditId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    onHistoryStateChange?.({ canUndo, canRedo });
  }, [canUndo, canRedo, historyTick, onHistoryStateChange]);

  const buildContentFromSnapshot = useCallback(
    (snapshot: SlideHistorySnapshot) => {
      return {
        bloques: cloneSlideBlocks(snapshot.bloques),
        fondo: snapshot.fondo ?? DEFAULT_SLIDE_FONDO,
        ...(slide?.diseno ? { diseno: slide.diseno } : {}),
        ...(snapshot.transicion !== undefined
          ? { transicion: snapshot.transicion }
          : slide?.transicion
            ? { transicion: slide.transicion }
            : {}),
        guias: snapshot.guias,
      };
    },
    [slide?.diseno, slide?.transicion],
  );

  const patchSlideContentById = useCallback(
    async (slideId: string, content: Record<string, unknown>): Promise<boolean> => {
      if (!classId) return false;
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const sanitized = sanitizeSlideContentForPersistence(content) ?? content;
      const res = await fetch(
        `${apiUrl}/classes/${classId}/slides/${slideId}`,
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
    [classId],
  );

  const patchSlideContent = useCallback(
    async (content: Record<string, unknown>): Promise<boolean> => {
      if (!slide?.id || !classId) return false;
      return patchSlideContentById(slide.id, content);
    },
    [slide?.id, classId, patchSlideContentById],
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

  const recordAfterSuccess = useCallback(
    (
      slideId: string,
      previous: SlideHistorySnapshot,
      next: SlideHistorySnapshot,
    ) => {
      if (isUndoRedoRef.current) return;
      let state = historiesRef.current.get(slideId);
      if (!state || state.entries.length === 0) {
        state = createInitialHistory({ ...previous, kind: 'inicio' });
      } else if (
        state.index === 0 &&
        state.entries.length === 1 &&
        state.entries[0]?.kind === 'inicio'
      ) {
        state = {
          entries: [{ ...previous, kind: 'inicio', at: state.entries[0].at }],
          index: 0,
        };
      }
      state = pushHistoryEntry(state, next, MAX_UNDO);
      historiesRef.current.set(slideId, state);
      bumpHistory();
    },
    [bumpHistory],
  );

  const persistBloques = useCallback(
    async (
      nextBloques: Block[],
      previousBloques: Block[],
      recordHistory: boolean,
      kind: HistoryKind = 'edicion',
    ): Promise<boolean> => {
      const content = buildContentPayload(nextBloques);
      const ok = await patchSlideContent(content);
      if (!ok) return false;
      if (recordHistory && slide?.id && !isUndoRedoRef.current) {
        const meta = editorMetaRef.current;
        recordAfterSuccess(
          slide.id,
          captureSlideSnapshot(
            {
              bloques: previousBloques,
              fondo: meta.fondo,
              guias: meta.guias,
              transicion: meta.transicion,
            },
            'edicion',
          ),
          captureSlideSnapshot(
            {
              bloques: nextBloques,
              fondo: meta.fondo,
              guias: meta.guias,
              transicion: meta.transicion,
            },
            kind,
          ),
        );
      }
      await queryClient.refetchQueries({
        queryKey: ['classes', 'detail', classId],
      });
      return true;
    },
    [
      buildContentPayload,
      patchSlideContent,
      queryClient,
      classId,
      slide,
      recordAfterSuccess,
    ],
  );

  const ensureHistoryForSlide = useCallback(
    (
      slideId: string,
      snapshot: {
        bloques: Block[];
        fondo?: Background;
        guias?: SlideGuias;
      },
    ) => {
      if (!historiesRef.current.has(slideId)) {
        historiesRef.current.set(
          slideId,
          createInitialHistory(captureSlideSnapshot(snapshot, 'inicio')),
        );
      }
    },
    [],
  );

  const persistBloquesForSlide = useCallback(
    async (
      slideId: string,
      nextBloques: Block[],
      previousBloques: Block[],
      slideMeta: { fondo?: Background; guias?: SlideGuias; diseno?: Slide['diseno']; transicion?: Slide['transicion'] },
      recordHistory: boolean,
      kind: HistoryKind = 'edicion',
    ): Promise<boolean> => {
      const guias = slideMeta.guias ?? EMPTY_SLIDE_GUIAS;
      const content: Record<string, unknown> = {
        bloques: nextBloques,
        ...(slideMeta.fondo ? { fondo: slideMeta.fondo } : {}),
        ...(slideMeta.diseno ? { diseno: slideMeta.diseno } : {}),
        ...(slideMeta.transicion ? { transicion: slideMeta.transicion } : {}),
        guias,
      };
      const ok = await patchSlideContentById(slideId, content);
      if (!ok) return false;
      if (recordHistory && !isUndoRedoRef.current) {
        ensureHistoryForSlide(slideId, {
          bloques: previousBloques,
          fondo: slideMeta.fondo,
          guias,
        });
        recordAfterSuccess(
          slideId,
          captureSlideSnapshot(
            {
              bloques: previousBloques,
              fondo: slideMeta.fondo,
              guias,
              transicion: slideMeta.transicion,
            },
            'edicion',
          ),
          captureSlideSnapshot(
            {
              bloques: nextBloques,
              fondo: slideMeta.fondo,
              guias,
              transicion: slideMeta.transicion,
            },
            kind,
          ),
        );
      }
      await queryClient.refetchQueries({
        queryKey: ['classes', 'detail', classId],
      });
      return true;
    },
    [
      patchSlideContentById,
      queryClient,
      classId,
      recordAfterSuccess,
      ensureHistoryForSlide,
    ],
  );

  const persistGuias = useCallback(
    async (nextGuias: SlideGuias) => {
      if (!slide?.id || !classId) return;
      const bloques = liveBloques ?? committedBloques ?? slide.bloques ?? [];
      const meta = editorMetaRef.current;
      const previous = captureSlideSnapshot(
        {
          bloques,
          fondo: meta.fondo,
          guias: meta.guias,
          transicion: meta.transicion,
        },
        'guias',
      );
      const content = buildContentPayload(bloques, undefined, nextGuias);
      const ok = await patchSlideContent(content);
      if (ok) {
        recordAfterSuccess(
          slide.id,
          previous,
          captureSlideSnapshot(
            {
              bloques,
              fondo: meta.fondo,
              guias: nextGuias,
              transicion: meta.transicion,
            },
            'guias',
          ),
        );
        await queryClient.refetchQueries({
          queryKey: ['classes', 'detail', classId],
        });
      } else {
        toast.error('No se pudieron guardar las guías');
      }
    },
    [
      slide?.id,
      slide?.bloques,
      slide?.fondo,
      slide?.guias,
      liveBloques,
      committedBloques,
      classId,
      buildContentPayload,
      patchSlideContent,
      queryClient,
      recordAfterSuccess,
    ],
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

      const prev = cloneSlideBlocks(slide.bloques ?? []);
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
      const prev = cloneSlideBlocks(slide.bloques ?? []);
      const b = getBlockAtPath(prev, blockPath);
      if (!b) return;

      const dup = buildPastedBlock(b);
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
        const prev = cloneSlideBlocks(slide?.bloques ?? []);
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

  editorMetaRef.current = {
    fondo: liveSlide?.fondo ?? slide?.fondo,
    guias: liveSlide?.guias ?? slide?.guias ?? EMPTY_SLIDE_GUIAS,
    transicion: liveSlide?.transicion ?? slide?.transicion,
  };

  const restoreSnapshot = useCallback(
    async (
      nextState: SlideHistoryState,
      snapshot: SlideHistorySnapshot,
      failMessage: string,
    ) => {
      if (!slide?.id) return;
      isUndoRedoRef.current = true;
      const ok = await patchSlideContent(buildContentFromSnapshot(snapshot));
      isUndoRedoRef.current = false;
      if (ok) {
        historiesRef.current.set(slide.id, nextState);
        bumpHistory();
        await queryClient.refetchQueries({
          queryKey: ['classes', 'detail', classId],
        });
      } else {
        toast.error(failMessage);
      }
    },
    [
      slide?.id,
      buildContentFromSnapshot,
      patchSlideContent,
      queryClient,
      classId,
      bumpHistory,
    ],
  );

  const handleUndo = useCallback(async () => {
    if (!slide?.id) return;
    const state = historiesRef.current.get(slide.id);
    if (!state) return;
    const result = undoHistory(state);
    if (!result) return;
    await restoreSnapshot(result.state, result.snapshot, 'No se pudo deshacer');
  }, [slide?.id, restoreSnapshot]);

  const handleRedo = useCallback(async () => {
    if (!slide?.id) return;
    const state = historiesRef.current.get(slide.id);
    if (!state) return;
    const result = redoHistory(state);
    if (!result) return;
    await restoreSnapshot(result.state, result.snapshot, 'No se pudo rehacer');
  }, [slide?.id, restoreSnapshot]);

  const handleJumpToHistory = useCallback(
    async (index: number) => {
      if (!slide?.id) return;
      const state = historiesRef.current.get(slide.id);
      if (!state) return;
      const result = jumpHistory(state, index);
      if (!result) return;
      await restoreSnapshot(
        result.state,
        result.snapshot,
        'No se pudo restaurar ese punto',
      );
    },
    [slide?.id, restoreSnapshot],
  );

  const handlePasteCopiedBlock = useCallback(
    async (block: Block) => {
      if (!slide?.id || !classId) return;
      const prev = cloneSlideBlocks(liveSlide?.bloques ?? slide.bloques ?? []);
      const dup = buildPastedBlock(block);
      const next = [...prev, dup];
      const ok = await persistBloques(next, prev, true, 'pegar');
      if (ok) {
        toast.success('Bloque pegado');
        const newIndex = next.length - 1;
        setTimeout(() => {
          const el = canvasRef.current?.querySelector(
            `[data-block-id="${String(newIndex)}"]`,
          ) as HTMLElement | null;
          el?.click();
        }, 50);
      } else {
        toast.error('No se pudo pegar el bloque');
      }
    },
    [slide?.id, slide?.bloques, liveSlide?.bloques, classId, persistBloques],
  );

  const handlePasteCopiedBlockInSlide = useCallback(
    async (
      slideId: string,
      block: Block,
      slideMeta: { bloques: Block[]; fondo?: Background; guias?: SlideGuias },
    ) => {
      if (!classId) return;
      const prev = cloneSlideBlocks(slideMeta.bloques);
      const dup = buildPastedBlock(block);
      const next = [...prev, dup];
      const ok = await persistBloquesForSlide(
        slideId,
        next,
        prev,
        {
          fondo: slideMeta.fondo,
          guias: slideMeta.guias,
        },
        true,
        'pegar',
      );
      if (ok) {
        toast.success('Bloque pegado');
      } else {
        toast.error('No se pudo pegar el bloque');
      }
    },
    [classId, persistBloquesForSlide],
  );

  const handleToggleCanvasLock = useCallback(
    async (blockPath: string) => {
      if (!slide?.id || !classId) return;
      const prev = cloneSlideBlocks(liveSlide?.bloques ?? slide.bloques ?? []);
      const block = getBlockAtPath(prev, blockPath);
      if (!block || !isBlockCanvasPositionable(block)) return;
      const locking = !isBlockCanvasLocked(block);
      const next = updateBlockAtPath(prev, blockPath, (b) => ({
        ...b,
        canvasLocked: locking ? true : undefined,
      }));
      const ok = await persistBloques(next, prev, true);
      if (ok) {
        toast.success(
          locking ? 'Posición y tamaño fijados' : 'Bloque desbloqueado',
        );
      }
    },
    [slide?.id, classId, slide?.bloques, liveSlide?.bloques, persistBloques],
  );

  const handleRemoveBlock = useCallback(
    async (blockPath: string) => {
      if (!slide?.id || !classId) return;
      const prev = cloneSlideBlocks(liveSlide?.bloques ?? slide.bloques ?? []);
      const next = removeBlockAtPath(prev, blockPath);
      if (next === prev) return;
      setSelectedBlockId(null);
      setSelectedBlockIds([]);
      clearInnerSelections();
      onBlockSelectRef.current?.('');
      const ok = await persistBloques(next, prev, true, 'eliminar');
      if (ok) {
        toast.success('Actividad eliminada');
      } else {
        toast.error('No se pudo eliminar');
      }
    },
    [
      slide?.id,
      classId,
      slide?.bloques,
      liveSlide?.bloques,
      persistBloques,
      clearInnerSelections,
    ],
  );

  const handleLayerReorder = useCallback(
    (blockPath: string, action: LayerReorderAction) => {
      if (!liveSlide?.bloques) return;
      const index = Number(blockPath);
      if (!Number.isInteger(index) || index < 0) return;
      const block = liveSlide.bloques[index];
      if (!block || isBlockCanvasLocked(block)) return;
      const prev = cloneSlideBlocks(liveSlide.bloques);
      const next = applyLayerReorderAction(prev, index, action);
      void persistBloques(next, prev, true).then((ok) => {
        if (!ok) toast.error('No se pudo actualizar el orden de capas');
      });
    },
    [liveSlide?.bloques, persistBloques],
  );

  const handleReorder = useCallback(
    (action: LayerReorderAction) => {
      if (!selectedBlockId) return;
      handleLayerReorder(selectedBlockId, action);
    },
    [selectedBlockId, handleLayerReorder],
  );

  const handleChangeFondo = useCallback(
    async (fondo: Background) => {
      if (!slide?.id) return;
      const bloques = liveSlide?.bloques ?? slide?.bloques ?? [];
      const previous = captureSlideSnapshot(
        { bloques, fondo: slide.fondo, guias: slide.guias },
        'fondo',
      );
      const content = buildContentPayload(cloneSlideBlocks(bloques), fondo);
      const ok = await patchSlideContent(content);
      if (ok) {
        recordAfterSuccess(
          slide.id,
          previous,
          captureSlideSnapshot(
            { bloques, fondo, guias: slide.guias },
            'fondo',
          ),
        );
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
      slide?.id,
      slide?.bloques,
      slide?.fondo,
      slide?.guias,
      buildContentPayload,
      patchSlideContent,
      queryClient,
      classId,
      recordAfterSuccess,
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

    const push = () => {
      if (Object.is(lastPushedEffectiveBloquesRef.current, effectiveBloques)) return;
      lastPushedEffectiveBloquesRef.current = effectiveBloques;
      onEffectiveBloquesRef.current?.(effectiveBloques);
    };

    // Durante el drag, actualizar la miniatura con throttle evita re-render en cada
    // frame (rompe dnd-kit) pero mantiene la vista lateral razonablemente sincronizada.
    if (draggingId != null) {
      const timer = window.setTimeout(push, 150);
      return () => clearTimeout(timer);
    }

    push();
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
      const prev = cloneSlideBlocks(liveSlide?.bloques ?? slide?.bloques ?? []);
      return persistBloques(next, prev, true);
    },
    [liveSlide?.bloques, slide?.bloques, persistBloques],
  );

  const handleClipGroupChange = useCallback(
    async (blockId: string, updated: ClipGroupBlock) => {
      const idx = Number(blockId);
      if (!Number.isInteger(idx) || idx < 0) return;
      const prev = cloneSlideBlocks(liveSlide?.bloques ?? slide?.bloques ?? []);
      if (idx >= prev.length) return;
      const next = prev.map((b, i) => (i === idx ? updated : b));
      await persistBloques(next, prev, true);
    },
    [liveSlide?.bloques, slide?.bloques, persistBloques],
  );

  const handleApplySlide = useCallback(
    async (patch: Partial<Slide>): Promise<boolean> => {
      if (!slide?.id) return false;
      const prevBloques = cloneSlideBlocks(liveSlide?.bloques ?? slide?.bloques ?? []);
      const meta = editorMetaRef.current;
      const previousSnapshot = captureSlideSnapshot(
        {
          bloques: prevBloques,
          fondo: meta.fondo,
          guias: meta.guias,
          transicion: meta.transicion,
        },
        'edicion',
      );

      const content: Record<string, unknown> = {
        ...buildContentPayload(prevBloques),
      };
      if (patch.transicion !== undefined) {
        content.transicion = patch.transicion;
      }
      const ok = await patchSlideContent(content);
      if (!ok) {
        toast.error('No se pudo guardar');
        return false;
      }
      if (!isUndoRedoRef.current) {
        const nextTransicion =
          patch.transicion !== undefined ? patch.transicion : meta.transicion;
        recordAfterSuccess(
          slide.id,
          previousSnapshot,
          captureSlideSnapshot(
            {
              bloques: prevBloques,
              fondo: meta.fondo,
              guias: meta.guias,
              transicion: nextTransicion,
            },
            'edicion',
          ),
        );
      }
      await queryClient.refetchQueries({
        queryKey: ['classes', 'detail', classId],
      });
      return true;
    },
    [
      slide?.id,
      liveSlide?.bloques,
      slide?.bloques,
      buildContentPayload,
      patchSlideContent,
      queryClient,
      classId,
      recordAfterSuccess,
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
      pasteCopiedBlock: (block) => {
        void handlePasteCopiedBlock(block);
      },
      pasteCopiedBlockInSlide: (slideId, block, slideMeta) => {
        void handlePasteCopiedBlockInSlide(slideId, block, slideMeta);
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
        void handleRemoveBlock(selectedBlockId);
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
        const prev = cloneSlideBlocks(liveSlide?.bloques ?? slide?.bloques ?? []);
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
      toggleGrid: () => {
        const current = liveSlide?.guias ?? slide?.guias ?? EMPTY_SLIDE_GUIAS;
        void persistGuias(toggleSlideGrilla(current));
      },
      setGridSize: (tamanoPx: number) => {
        const current = liveSlide?.guias ?? slide?.guias ?? EMPTY_SLIDE_GUIAS;
        void persistGuias(setSlideGrillaSize(current, tamanoPx));
      },
      resetSlideHistory: () => {
        if (!slide?.id) return;
        const meta = editorMetaRef.current;
        const bloques = liveSlide?.bloques ?? slide?.bloques ?? [];
        const snapshot = captureSlideSnapshot(
          {
            bloques,
            fondo: meta.fondo ?? slide.fondo,
            guias: meta.guias,
            transicion: meta.transicion ?? slide.transicion,
          },
          'inicio',
        );
        historiesRef.current.set(slide.id, createFreshSlideHistory(snapshot));
        bumpHistory();
      },
    }),
    [
      selectedBlockId,
      selectedBlockIds,
      draggingId,
      liveSlide?.bloques,
      liveSlide?.guias,
      slide?.id,
      slide?.bloques,
      slide?.guias,
      slide?.fondo,
      slide?.transicion,
      persistBloques,
      persistGuias,
      handleUndo,
      handleRedo,
      handlePasteCopiedBlock,
      handlePasteCopiedBlockInSlide,
      handleDuplicateBlock,
      handleCopyBlock,
      handleRemoveBlock,
      handleDragSave,
      clearInnerSelections,
      bumpHistory,
    ],
  );

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el || !onCanvasZoomChange) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      onCanvasZoomChange(stepCanvasZoom(canvasZoom, wheelDeltaToZoomStep(e.deltaY)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [canvasZoom, onCanvasZoomChange]);

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
      ref={workspaceRef}
      className={cn(
        // isolate: new stacking context — blocks can't z-index-bleed into siblings.
        // overflow-visible: allows rulers and blocks dragged outside the slide
        //   frame to remain visible and interactive in the grey workspace margin.
        'relative isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-visible box-border bg-editor-workspace',
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
          historyItems={historyItems}
          onJumpToHistory={(index) => void handleJumpToHistory(index)}
          onReorder={handleReorder}
          layersPanelOpen={layersPanelOpen}
          onToggleLayersPanel={() => setLayersPanelOpen((v) => !v)}
          fondo={liveSlide?.fondo}
          onChangeFondo={(f) => void handleChangeFondo(f)}
          onInsertAudio={handleInsertBlock}
        />
      </div>

      {/* Floating Alignment Toolbar — solo si hay ≥2 bloques desbloqueados */}
      {selectedBlockIds.filter((id) => {
        const b = liveSlide?.bloques?.[Number(id)];
        return b && !isBlockCanvasLocked(b);
      }).length >= 2 && (
        <div
          className="absolute left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-1 duration-200"
          style={{
            top: 'calc(var(--editor-toolbar-top, 0.5rem) + 3rem)',
          }}
        >
          <AlignmentToolbar
            selectedIds={selectedBlockIds}
            bloques={liveSlide?.bloques ?? []}
            onApplyBloques={handleApplyBloques}
          />
        </div>
      )}

      <div
        className={cn(
          'flex min-h-0 w-full flex-1 items-center justify-center overflow-visible px-12 pb-[var(--editor-canvas-pb)] pt-[var(--editor-canvas-pt)] md:px-12 md:pt-[var(--editor-canvas-pt-md)]',
          canvasZoom > 1 && 'overflow-auto',
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
      {isLoading ? (
        <div
          className="mx-auto flex max-h-full w-full max-w-[var(--editor-slide-max-w)] shrink-0 justify-center"
          style={{
            transform: `scale(${canvasZoom})`,
            transformOrigin: 'center center',
          }}
        >
          <div className={SLIDE_VIEWPORT_CLASS}>
            <div className={SLIDE_SURFACE_CLASS}>
              <Skeleton className="h-full w-full rounded-none" />
            </div>
          </div>
        </div>
      ) : liveSlide ? (
        <div
          className="mx-auto flex max-h-full w-full max-w-[var(--editor-slide-max-w)] shrink-0 justify-center"
          style={{
            transform: `scale(${canvasZoom})`,
            transformOrigin: 'center center',
          }}
        >
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
            clipGroupInnerEditId={clipGroupInnerEditId}
            onClipGroupInnerEditChange={setClipGroupInnerEditId}
            onClipGroupChange={handleClipGroupChange}
            onRemoveBlock={handleRemoveBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onCopyBlock={handleCopyBlock}
            onToggleCanvasLock={(blockPath) => void handleToggleCanvasLock(blockPath)}
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

          {/* Drag handles — sincronizados con effectiveBloques */}
          {allBlocks.map((block, index) =>
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
        </div>
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
    </div>

    {layersPanelOpen ? (
      <div className="h-full w-56 min-w-0 shrink-0 overflow-hidden">
        <LayersPanel
          bloques={liveSlide?.bloques ?? []}
          selectedBlockIds={selectedBlockIds}
          onSelectBlock={handleRendererBlockSelect}
          onLayerReorder={handleLayerReorder}
          disabled={isLoading || !liveSlide}
        />
      </div>
    ) : null}

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
