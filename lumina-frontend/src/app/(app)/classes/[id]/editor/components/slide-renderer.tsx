'use client';

import {
  CSSProperties,
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Copy, Pencil, Lock, LockOpen, Ungroup } from 'lucide-react';
import { useParams } from 'next/navigation';


import { useUpdateSlide } from '@/hooks/api/use-classes';
import {
  isUnimplementedInteractiveStub,
  mergeRendererSlideState,
  sanitizeSlideContentForPersistence,
  updateBlockAtPath,
} from '@/lib/class-slide-normalize';
import { ResizeHandles } from './resize-handles';
import { getBlockResizeMinDim } from '../lib/block-resize-min-dim';
import { useBlockAnimations } from '@/hooks/use-block-animations';
import { withRect, withRotation, isBlockCanvasLocked, isBlockCanvasPositionable, getBlockPos, blockPosToStyle } from '@/hooks/use-block-drag';

import type {
  Activity,
  ActivityBlock,
  Block,
  ClipGroupBlock,
  FlipCardsWidget,
  Slide,
  TabsWidget,
  CarouselWidget,
  ClickRevealWidget,
  PopupWidget,
  TimelineWidget,
  DiagramaBlock,
  HotspotWidget,
} from '@/types/slide.types';
import { cn } from '@/lib/utils';
import { FONT_CORE_FAMILIES, collectFontFamiliesFromValue } from '@/lib/font-catalog';
import { ensureGoogleFonts } from '@/components/editor/google-fonts-loader';
import { getSlideVariant } from '@/lib/slide-variant';
import {
  backgroundColorSample,
  backgroundToCssStyle,
} from '@/lib/slide-background';
import { BackgroundImageLayer } from './background-image-layer';

import { TorneoActivityEditor } from './activities/torneo-activity';
import type { Socket } from 'socket.io-client';
import { TorneoViewer } from '@/components/viewers/torneo-viewer';
import { EscapeRoomActivityEditor } from './activities/escape-room-activity';
import {
  EscapeRoomViewer,
  bloquesVisiblesDeSala,
} from '@/components/viewers/escape-room-viewer';
import type { FlipCardsInnerSelection } from '@/components/widgets/flip-cards/flip-cards-config';
import type { TabsInnerSelection } from '@/components/widgets/tabs/tabs-config';
import type { CarouselInnerSelection } from '@/components/widgets/carousel/carousel-config';
import type { ClickRevealInnerSelection, PopupInnerSelection, HotspotInnerSelection } from '@/types/widget.types';
import {
  isEditingPopupOverlay,
  mergedPopupConfig,
} from '@/components/widgets/popup/popup-config';
import { syncPopupBlockSizeFromTriggerPx } from '@/lib/popup-defaults';
import { clampPopupTriggerPx } from '@/lib/popup-trigger-size';
import { SlideCanvasRootContext } from '@/components/widgets/shared/slide-canvas-root-context';
import { isWidgetTipo } from '@/types/widget.types';
import type { WidgetBlock } from '@/types/slide.types';
import type { TimelineInnerSelection } from '@/components/widgets/timeline/timeline-config';
import { elementRegistry } from '@/lib/element-registry-bootstrap';
import type { ActivityRuntimeConfig } from '@/lib/activity-runtime-config';

// ─── Modo ──────────────────────────────────────────────────────────────────────

type Modo = 'editor' | 'viewer' | 'preview';

/** Config de runtime que el dispatch genérico pasa a primitivos del registry. */
type PrimitiveRuntimeConfig = {
  isEditing?: boolean;
  onCommit?: (text: string) => void;
  onDiscard?: () => void;
  forceFill?: boolean;
  isThumbnail?: boolean;
  renderInnerBlock?: (innerBlock: Block, colIdx: number, blockIdx: number) => ReactNode;
};

/**
 * Config de runtime de los bloques con canvas (`grafico` / `diagrama` /
 * `clip-group`). E5.7: se despachan por `elementRegistry` como los widgets;
 * su cobertura de integración real vive en
 * `visual-tests/canvas-blocks.integration.visual.spec.tsx`.
 */
type CanvasBlockRuntimeConfig = {
  isThumbnail?: boolean;
  isSelected?: boolean;
  onEnsureBlockSelected?: () => void;
  innerEdit?: boolean;
  renderComposicion?: (bloques: Block[]) => ReactNode;
  onEnterInnerEdit?: () => void;
};

function stripMarcoFromActivityBlock(block: ActivityBlock): ActivityBlock {
  if (!block.marco) return block;
  const rest = { ...block };
  delete rest.marco;
  return rest;
}

function blockForActivityRender(block: Block): Block {
  if (block.tipo !== 'actividad') return block;
  return stripMarcoFromActivityBlock(block);
}

// ─── Activity placeholder labels ──────────────────────────────────────────────

const ACTIVITY_LABELS: Record<Activity['tipo'], string> = {
  quiz_multiple: 'Quiz · Opción múltiple',
  verdadero_falso: 'Actividad · Verdadero / Falso',
  short_answer: 'Actividad · Respuesta corta',
  completar_blancos: 'Actividad · Completar blancos',
  arrastrar_soltar: 'Actividad · Arrastrar y soltar',
  emparejar: 'Actividad · Emparejar',
  ordenar_pasos: 'Actividad · Ordenar pasos',
  video_interactivo: 'Actividad · Video interactivo',
  encuesta_viva: 'Actividad · Encuesta en vivo',
  nube_palabras: 'Actividad · Nube de palabras',
  torneo: 'Actividad · Torneo de preguntas',
  escape_room: 'Actividad · Escape room',
  clasificar: 'Actividad · Clasificar',
  globos: 'Actividad · Globos',
  topo: 'Actividad · Topo',
  ruleta: 'Actividad · Ruleta',
  memoria: 'Actividad · Memoria',
  puzzle_imagen: 'Actividad · Puzzle de imagen',
  sopa_letras: 'Actividad · Sopa de letras',
  crucigrama: 'Actividad · Crucigrama',
  anagrama: 'Actividad · Anagrama',
  ahorcado: 'Actividad · Ahorcado',
  puzzle_palabras: 'Actividad · Puzzle de palabras',
  abrir_caja: 'Actividad · Abrir caja',
  historia_ramificada: 'Actividad · Historia ramificada',
};

// ─── Background → CSS (see `@/lib/slide-background`) ─────────────────────────

// ─── Canvas positioning ───────────────────────────────────────────────────────

function getBlockPositionStyle(block: Block): CSSProperties {
  return blockPosToStyle(block);
}

function getBlockRawCoords(block: Block): { x: number; y: number; ancho: number; alto: number } {
  return getBlockPos(block);
}


/** Mismo fondo que aplica `EscapeRoomSalaCanvas` cuando el autor no elige uno. */
const ESCAPE_ROOM_SALA_FONDO_DEFAULT = { tipo: 'color', valor: '#1e1b4b' } as const;

function RenderActivity({
  block,
  blockId,
  slideId,
  modo,
  isSelected,
  activityCanvasLayout,
  onActivityChange,
  onRemoveBlock,
  onResponse,
  variant = 'light',
  liveSocket,
  torneoSocket,
  viewerStudentId,
  viewerStudentName,
  viewerClassId,
}: {
  block: ActivityBlock;
  blockId: string;
  slideId: string;
  modo: 'editor' | 'viewer';
  isSelected: boolean;
  /** Altura acotada en el lienzo cuando la actividad va sola y centrada. */
  activityCanvasLayout?: boolean;
  onActivityChange?: (blockId: string, activity: Activity) => void;
  onFlipCardsChange?: (blockId: string, block: FlipCardsWidget) => void;
  onRemoveBlock?: (blockId: string) => void;
  /** Callback emitido por el estudiante al responder (solo modo viewer). */
  onResponse?: (response: unknown) => void;
  variant?: 'dark' | 'light';
  liveSocket?: Socket | null;
  torneoSocket?: Socket | null;
  viewerStudentId?: string;
  viewerStudentName?: string;
  viewerClassId?: string;
}) {
  const act = block.actividad;
  const syncKey = `${slideId}-${blockId}`;

  const def = elementRegistry.obtener<Activity, ActivityRuntimeConfig>(act.tipo);
  if (def) {
    if (modo === 'editor') {
      return (
        <def.Editor
          estado={act}
          config={{
            onResponse,
            onComplete: onResponse,
            variant,
            editorSyncKey: syncKey,
            isSelected,
            activityCanvasLayout,
          }}
          onChange={(updatedAct: Activity) => onActivityChange?.(blockId, updatedAct)}
        />
      );
    }
    return (
      <def.Viewer
        estado={act}
        config={{
          onResponse,
          onComplete: onResponse,
          variant,
          editorSyncKey: syncKey,
          liveSocket,
          torneoSocket,
          viewerStudentId,
          viewerStudentName,
          viewerClassId,
          blockId,
        }}
      />
    );
  }

  if (act.tipo === 'torneo') {
    if (modo === 'editor') {
      return (
        <TorneoActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          canvasLayout={!!activityCanvasLayout}
          isSelected={isSelected}
          onChange={(a) => onActivityChange?.(blockId, a)}
          onRemove={onRemoveBlock ? () => onRemoveBlock(blockId) : undefined}
        />
      );
    }
    return (
      <TorneoViewer
        activity={act}
        variant={variant}
        studentId={viewerStudentId ?? ''}
        studentName={viewerStudentName ?? ''}
        classId={viewerClassId ?? ''}
        editorSyncKey={syncKey}
        liveSocket={torneoSocket ?? liveSocket}
        onAnswer={(payload) => onResponse?.(payload)}
      />
    );
  }

  if (act.tipo === 'escape_room') {
    if (modo === 'editor') {
      return (
        <EscapeRoomActivityEditor
          editorSyncKey={syncKey}
          activity={act}
          canvasLayout={!!activityCanvasLayout}
          isSelected={isSelected}
          onChange={(a) => onActivityChange?.(blockId, a)}
          onRemove={onRemoveBlock ? () => onRemoveBlock(blockId) : undefined}
        />
      );
    }
    return (
      <EscapeRoomViewer
        activity={act}
        variant={variant}
        studentId={viewerStudentId ?? ''}
        studentName={viewerStudentName ?? ''}
        classId={viewerClassId ?? ''}
        slideId={slideId}
        editorSyncKey={syncKey}
        liveSocket={liveSocket}
        onComplete={(puntos, timeMs) =>
          // Canal propio de cierre: estos puntos son gamificación narrativa, no
          // una nota 0–5, así que nunca deben alimentar `activity:complete`.
          onResponse?.({ tipo: 'escape_room:finished', puntos, timeMs })
        }
        onAnswer={(roomId, answer, correct, intento) =>
          onResponse?.({ roomId, answer, correct, intento })
        }
        renderSalaCanvas={(sala) => (
          <SlideRenderer
            slide={{
              id: `${slideId}-sala-${sala.id}`,
              order: 0,
              type: 'CONTENT',
              title: sala.nombre,
              bloques: bloquesVisiblesDeSala(sala),
              fondo: sala.fondo ?? ESCAPE_ROOM_SALA_FONDO_DEFAULT,
              content: null,
            }}
            modo="viewer"
            viewerStudentId={viewerStudentId}
            viewerStudentName={viewerStudentName}
            viewerClassId={viewerClassId}
            liveSocket={liveSocket}
            className="h-full w-full"
          />
        )}
      />
    );
  }

  const label = ACTIVITY_LABELS[(act as { tipo: keyof typeof ACTIVITY_LABELS }).tipo];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '1.5rem',
        border: '2px dashed #f59e0b',
        borderRadius: '0.5rem',
        background: '#fffbeb',
        color: '#92400e',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      <span aria-hidden style={{ fontSize: '1.125rem' }}>⚡</span>
      {label}
    </div>
  );
}


const BLOCK_TOOLBAR_GAP_PX = 4;

/** Barra de acciones del bloque en `document.body` para evitar recorte por overflow del canvas. */
function BlockActionToolbarPortal({
  blockRef,
  visible,
  children,
}: {
  blockRef: RefObject<HTMLDivElement | null>;
  visible: boolean;
  children: ReactNode;
}) {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const updatePosition = useCallback(() => {
    const el = blockRef.current;
    if (!el || !visible) {
      setStyle((prev) => (prev === null ? prev : null));
      return;
    }
    const rect = el.getBoundingClientRect();
    const top = rect.top - BLOCK_TOOLBAR_GAP_PX;
    const left = rect.left + rect.width / 2;
    setStyle((prev) => {
      if (
        prev &&
        prev.top === top &&
        prev.left === left &&
        prev.position === 'fixed'
      ) {
        return prev;
      }
      return {
        position: 'fixed',
        top,
        left,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000,
      };
    });
  }, [blockRef, visible]);

  useLayoutEffect(() => {
    updatePosition();
    if (!visible) return;

    const el = blockRef.current;
    if (!el) return;

    const ro = new ResizeObserver(updatePosition);
    ro.observe(el);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [visible, updatePosition, blockRef]);

  if (!visible || !style || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="toolbar"
      aria-label="Opciones del bloque"
      style={style}
      className="flex items-center gap-1 rounded-2xl border border-[#e5e7eb] bg-white px-2 py-1.5 shadow-sm"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

// ─── BlockNode ────────────────────────────────────────────────────────────────

interface BlockNodeProps {
  block: Block;
  blockId: string;
  slideId: string;
  isSelected: boolean;
  modo: Modo;
  selectedId: string | null;
  selectedBlockIds?: string[];
  onClick: (e?: React.MouseEvent) => void;
  onBlockClick: (id: string, e?: React.MouseEvent) => void;
  pathPrefix: string;
  /** Absolute-position style applied to the wrapper div (top-level blocks only). */
  positionStyle?: CSSProperties;
  onActivityChange?: (blockId: string, activity: Activity) => void;
  onFlipCardsChange?: (blockId: string, block: FlipCardsWidget) => void;
  flipCardsInnerSelection?: FlipCardsInnerSelection | null;
  onFlipCardsInnerSelectionChange?: (selection: FlipCardsInnerSelection | null) => void;
  onTabsChange?: (blockId: string, block: TabsWidget) => void;
  tabsInnerSelection?: TabsInnerSelection | null;
  onTabsInnerSelectionChange?: (selection: TabsInnerSelection | null) => void;
  onCarouselChange?: (blockId: string, block: CarouselWidget) => void;
  carouselInnerSelection?: CarouselInnerSelection | null;
  onCarouselInnerSelectionChange?: (selection: CarouselInnerSelection | null) => void;
  onClickRevealChange?: (blockId: string, block: ClickRevealWidget) => void;
  clickRevealInnerSelection?: ClickRevealInnerSelection | null;
  onClickRevealInnerSelectionChange?: (selection: ClickRevealInnerSelection | null) => void;
  onPopupChange?: (blockId: string, block: PopupWidget) => void;
  popupInnerSelection?: PopupInnerSelection | null;
  onPopupInnerSelectionChange?: (selection: PopupInnerSelection | null) => void;
  onHotspotChange?: (blockId: string, block: HotspotWidget) => void;
  hotspotInnerSelection?: HotspotInnerSelection | null;
  onHotspotInnerSelectionChange?: (selection: HotspotInnerSelection | null) => void;
  onTimelineChange?: (blockId: string, block: TimelineWidget) => void;
  timelineInnerSelection?: TimelineInnerSelection | null;
  onTimelineInnerSelectionChange?: (selection: TimelineInnerSelection | null) => void;
  onDiagramaChange?: (blockId: string, block: DiagramaBlock) => void;
  onRemoveBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onCopyBlock?: (blockId: string) => void;
  onToggleCanvasLock?: (blockId: string) => void;
  /** Slide dedicado a actividad(es): el editor de respuesta corta usa layout de lienzo acotado. */
  activityCanvasLayout?: boolean;
  /** Callback emitido por el estudiante al responder (solo modo viewer). */
  onResponse?: (response: unknown) => void;
  /** Contraste de viewers de actividad según luminancia del fondo del slide. */
  variant?: 'dark' | 'light';
  /** Socket en vivo (viewer estudiante) — actividades como torneo escuchan eventos aquí. */
  liveSocket?: Socket | null;
  /** Namespace `/live` para eventos del torneo (opcional; si no, se usa `liveSocket`). */
  torneoSocket?: Socket | null;
  viewerStudentId?: string;
  viewerStudentName?: string;
  viewerClassId?: string;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  currentCoords?: { x: number; y: number; ancho: number; alto: number };
  onResize?: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
  onResizeEnd?: (blockId: string, newCoords: { x: number; y: number; ancho: number; alto: number }) => void;
  /** ID of the block currently in inline-text-edit mode (null if none). */
  editingId?: string | null;
  /** Enter inline-edit mode for a TextBlock (double-click in editor). */
  onEditStart?: (blockId: string) => void;
  /** Commit the edited text and persist (Enter / blur). */
  onEditCommit?: (blockId: string, newText: string) => void;
  /** Discard changes and exit inline-edit mode (Escape). */
  onEditCancel?: () => void;
  /** True while this block is being resized for live visual feedback tweaks. */
  isResizing?: boolean;
  /** Position of this block in the slide's block array — used for staggered entry animation in viewer mode. */
  blockIndex?: number;
  /** Miniatura del panel lateral: render simplificado de widgets e imágenes. */
  isThumbnail?: boolean;
  /** Bloque clip-group en modo edición interna (pan/escala de imagen). */
  clipGroupInnerEditId?: string | null;
  onClipGroupInnerEditChange?: (blockId: string | null) => void;
  onClipGroupChange?: (blockId: string, block: ClipGroupBlock) => void;
  onUngroupClipGroup?: (blockId: string) => void;
  isLiveDragging?: boolean;
  rotacion?: number;
  onRotate?: (blockId: string, angle: number) => void;
  onRotateEnd?: (blockId: string, angle: number) => void;
}

function BlockNode({
  block,
  blockId,
  slideId,
  isSelected,
  modo,
  selectedId,
  selectedBlockIds,
  onClick,
  onBlockClick,
  pathPrefix,
  positionStyle,
  onActivityChange,
  onFlipCardsChange,
  flipCardsInnerSelection,
  onFlipCardsInnerSelectionChange,
  onTabsChange,
  tabsInnerSelection,
  onTabsInnerSelectionChange,
  onCarouselChange,
  carouselInnerSelection,
  onCarouselInnerSelectionChange,
  onClickRevealChange,
  clickRevealInnerSelection,
  onClickRevealInnerSelectionChange,
  onPopupChange,
  popupInnerSelection,
  onPopupInnerSelectionChange,
  onHotspotChange,
  hotspotInnerSelection,
  onHotspotInnerSelectionChange,
  onTimelineChange,
  timelineInnerSelection,
  onTimelineInnerSelectionChange,
  onDiagramaChange,
  onRemoveBlock,
  onDuplicateBlock,
  onCopyBlock,
  onToggleCanvasLock,
  activityCanvasLayout,
  onResponse,
  variant = 'light',
  liveSocket,
  torneoSocket,
  viewerStudentId,
  viewerStudentName,
  viewerClassId,
  canvasRef,
  currentCoords,
  onResize,
  onResizeEnd,
  editingId,
  onEditStart,
  onEditCommit,
  onEditCancel,
  isResizing,
  blockIndex,
  isThumbnail = false,
  clipGroupInnerEditId = null,
  onClipGroupInnerEditChange,
  onClipGroupChange,
  onUngroupClipGroup,
  isLiveDragging = false,
  rotacion,
  onRotate,
  onRotateEnd,
}: BlockNodeProps) {
  const isViewerMode = modo === 'viewer' || modo === 'preview';
  const activityBlockForRender: ActivityBlock | null =
    block.tipo === 'actividad' ? (blockForActivityRender(block) as ActivityBlock) : null;

  const editorMode = modo === 'editor';
  const isFormBlock = block.tipo === 'actividad' && editorMode;
  // Normalize 'preview' to 'viewer' for activity renderers
  const activityModo: 'editor' | 'viewer' = editorMode ? 'editor' : 'viewer';

  const isTextEditing = editorMode && block.tipo === 'texto' && editingId === blockId;
  const isWidgetBlock = editorMode && isWidgetTipo(block.tipo);
  const isInteractiveStub = isUnimplementedInteractiveStub(block);
  const canvasLocked = isBlockCanvasLocked(block);
  const canvasPositionable = isBlockCanvasPositionable(block);
  const isBlockButtonShell =
    editorMode && !isFormBlock && !isTextEditing && !isWidgetBlock && !isInteractiveStub;
  const blockRef = useRef<HTMLDivElement>(null);
  const showActionToolbar =
    editorMode &&
    isSelected &&
    !isFormBlock &&
    !isTextEditing &&
    (!!onRemoveBlock ||
      !!onDuplicateBlock ||
      !!onCopyBlock ||
      !!onToggleCanvasLock ||
      !!onUngroupClipGroup ||
      block.tipo === 'popup');

  const popupOverlayEditing =
    block.tipo === 'popup' &&
    isSelected &&
    isEditingPopupOverlay(popupInnerSelection ?? null);

  const clipInnerEdit =
    block.tipo === 'clip-group' && clipGroupInnerEditId === blockId;

  useBlockAnimations(blockRef, block.animaciones, isViewerMode);

  function renderColumnInnerBlock(innerBlock: Block, colIdx: number, blockIdx: number) {
    const id = `${pathPrefix}-${colIdx}-${blockIdx}`;
    const isInnerSelected = editorMode && (
      selectedBlockIds && selectedBlockIds.length > 0
        ? selectedBlockIds.includes(id)
        : selectedId === id
    );
    return (
      <BlockNode
        key={id}
        block={innerBlock}
        blockId={id}
        slideId={slideId}
        isSelected={isInnerSelected}
        modo={modo}
        selectedId={selectedId}
        selectedBlockIds={selectedBlockIds}
        onClick={(e) => onBlockClick(id, e)}
        onBlockClick={onBlockClick}
        pathPrefix={id}
        onActivityChange={onActivityChange}
        onFlipCardsChange={onFlipCardsChange}
        flipCardsInnerSelection={flipCardsInnerSelection}
        onFlipCardsInnerSelectionChange={onFlipCardsInnerSelectionChange}
        onTabsChange={onTabsChange}
        tabsInnerSelection={tabsInnerSelection}
        onTabsInnerSelectionChange={onTabsInnerSelectionChange}
        onCarouselChange={onCarouselChange}
        carouselInnerSelection={carouselInnerSelection}
        onCarouselInnerSelectionChange={onCarouselInnerSelectionChange}
        onClickRevealChange={onClickRevealChange}
        clickRevealInnerSelection={clickRevealInnerSelection}
        onClickRevealInnerSelectionChange={onClickRevealInnerSelectionChange}
        onPopupChange={onPopupChange}
        popupInnerSelection={popupInnerSelection}
        onPopupInnerSelectionChange={onPopupInnerSelectionChange}
        onHotspotChange={onHotspotChange}
        hotspotInnerSelection={hotspotInnerSelection}
        onHotspotInnerSelectionChange={onHotspotInnerSelectionChange}
        onTimelineChange={onTimelineChange}
        timelineInnerSelection={timelineInnerSelection}
        onTimelineInnerSelectionChange={onTimelineInnerSelectionChange}
        onDiagramaChange={onDiagramaChange}
        onRemoveBlock={onRemoveBlock}
        onDuplicateBlock={onDuplicateBlock}
        onCopyBlock={onCopyBlock}
        onToggleCanvasLock={onToggleCanvasLock}
        onResponse={onResponse}
        variant={variant}
        liveSocket={liveSocket}
        torneoSocket={torneoSocket}
        viewerStudentId={viewerStudentId}
        viewerStudentName={viewerStudentName}
        viewerClassId={viewerClassId}
        isThumbnail={isThumbnail}
      />
    );
  }

  function primitiveRuntimeConfig(): PrimitiveRuntimeConfig {
    if (block.tipo === 'texto') {
      return editorMode
        ? {
            isEditing: isTextEditing,
            onCommit: onEditCommit ? (text) => onEditCommit(blockId, text) : undefined,
            onDiscard: onEditCancel,
          }
        : {};
    }
    if (block.tipo === 'imagen') {
      return { forceFill: isResizing };
    }
    if (block.tipo === 'video') {
      return { isThumbnail };
    }
    if (block.tipo === 'columnas') {
      return { renderInnerBlock: renderColumnInnerBlock };
    }
    return {};
  }

  function renderContent() {
    switch (block.tipo) {
      case 'actividad':
        return activityBlockForRender ? (
          <RenderActivity
            block={activityBlockForRender}
            blockId={blockId}
            slideId={slideId}
            modo={activityModo}
            isSelected={isSelected}
            activityCanvasLayout={activityCanvasLayout}
            onActivityChange={onActivityChange}
            onFlipCardsChange={onFlipCardsChange}
            onRemoveBlock={onRemoveBlock}
            onResponse={onResponse}
            variant={variant}
            liveSocket={liveSocket}
            torneoSocket={torneoSocket}
            viewerStudentId={viewerStudentId}
            viewerStudentName={viewerStudentName}
            viewerClassId={viewerClassId}
          />
        ) : null;
      case 'flip-cards':
      case 'tabs':
      case 'carousel':
      case 'click-reveal':
      case 'popup':
      case 'hotspot':
      case 'tooltip':
      case 'boton':
      case 'contador':
      case 'progreso':
      case 'ruleta':
      case 'timeline': {
        const def = elementRegistry.obtener<
          WidgetBlock,
          { isThumbnail?: boolean; onEnsureBlockSelected?: () => void }
        >(block.tipo);
        if (def) {
          // boton/contador/progreso/tooltip/ruleta: sus Editors no llaman onChange
          // (editan solo por properties-panel.applyNow). default:break es correcto.
          const handleWidgetChange = (updated: WidgetBlock) => {
            switch (block.tipo) {
              case 'flip-cards':
                onFlipCardsChange?.(blockId, updated as FlipCardsWidget);
                break;
              case 'tabs':
                onTabsChange?.(blockId, updated as TabsWidget);
                break;
              case 'carousel':
                onCarouselChange?.(blockId, updated as CarouselWidget);
                break;
              case 'click-reveal':
                onClickRevealChange?.(blockId, updated as ClickRevealWidget);
                break;
              case 'popup':
                onPopupChange?.(blockId, updated as PopupWidget);
                break;
              case 'hotspot':
                onHotspotChange?.(blockId, updated as HotspotWidget);
                break;
              case 'timeline':
                onTimelineChange?.(blockId, updated as TimelineWidget);
                break;
              default:
                break;
            }
          };
          const widgetInnerConfig = (() => {
            switch (block.tipo) {
              case 'flip-cards':
                return {
                  innerSelection: flipCardsInnerSelection ?? null,
                  onInnerSelectionChange: onFlipCardsInnerSelectionChange,
                };
              case 'tabs':
                return {
                  innerSelection: tabsInnerSelection ?? null,
                  onInnerSelectionChange: onTabsInnerSelectionChange,
                };
              case 'carousel':
                return {
                  innerSelection: carouselInnerSelection ?? null,
                  onInnerSelectionChange: onCarouselInnerSelectionChange,
                };
              case 'click-reveal':
                return {
                  innerSelection: clickRevealInnerSelection ?? null,
                  onInnerSelectionChange: onClickRevealInnerSelectionChange,
                };
              case 'popup':
                return {
                  innerSelection: popupInnerSelection ?? null,
                  onInnerSelectionChange: onPopupInnerSelectionChange,
                };
              case 'hotspot':
                return {
                  innerSelection: hotspotInnerSelection ?? null,
                  onInnerSelectionChange: onHotspotInnerSelectionChange,
                };
              case 'timeline':
                return {
                  innerSelection: timelineInnerSelection ?? null,
                  onInnerSelectionChange: onTimelineInnerSelectionChange,
                };
              default:
                return {};
            }
          })();
          const widgetConfig = {
            isThumbnail,
            onEnsureBlockSelected: () => onClick(),
            ...widgetInnerConfig,
          };
          return editorMode ? (
            <def.Editor
              estado={block}
              config={widgetConfig}
              onChange={handleWidgetChange}
            />
          ) : (
            <def.Viewer
              estado={block}
              config={{ isThumbnail }}
            />
          );
        }
        break;
      }
      // E5.7 — `grafico` / `diagrama` / `clip-group` se despachan por
      // `elementRegistry` (adapters de @lumina/element-kit, E4.1–E4.4). La
      // cobertura de integración real (Recharts / @xyflow / máscara SVG,
      // legacy vs kit en navegador) vive en
      // `visual-tests/canvas-blocks.integration.visual.spec.tsx` — cierra
      // `LUM-E5-CANVAS-BLOCKS`.
      case 'grafico':
      case 'diagrama':
      case 'clip-group': {
        const def = elementRegistry.obtener<Block, CanvasBlockRuntimeConfig>(
          block.tipo,
        );
        if (!def) return null;
        const canvasConfig: CanvasBlockRuntimeConfig =
          block.tipo === 'clip-group'
            ? {
                isThumbnail,
                isSelected,
                innerEdit: clipInnerEdit,
                renderComposicion: (bloques: Block[]) => (
                  <SlideRenderer
                    slide={{
                      id: `${slideId}-clip-${blockId}`,
                      order: 0,
                      type: 'CONTENT',
                      title: '',
                      bloques,
                      content: null,
                    }}
                    modo="viewer"
                    viewerFill
                    variant={variant}
                    liveSocket={liveSocket}
                    torneoSocket={torneoSocket}
                    viewerStudentId={viewerStudentId}
                    viewerStudentName={viewerStudentName}
                    viewerClassId={viewerClassId}
                    isThumbnail={isThumbnail}
                    className="h-full w-full"
                  />
                ),
                onEnterInnerEdit:
                  editorMode &&
                  (block.contenido.tipo === 'imagen' ||
                    (block.contenido.tipo === 'composicion' &&
                      block.contenido.fill?.tipo === 'imagen'))
                    ? () => onClipGroupInnerEditChange?.(blockId)
                    : undefined,
              }
            : {
                isThumbnail,
                isSelected: selectedId === blockId,
                onEnsureBlockSelected: () => onClick(),
              };
        const handleCanvasChange = (updated: Block) => {
          if (updated.tipo === 'diagrama') {
            onDiagramaChange?.(blockId, updated);
          } else if (updated.tipo === 'clip-group') {
            onClipGroupChange?.(blockId, updated);
          }
          // `grafico` es soloLecturaEnViewer: se edita por properties-panel.
        };
        return editorMode ? (
          <def.Editor
            estado={block}
            config={canvasConfig}
            onChange={handleCanvasChange}
          />
        ) : (
          <def.Viewer estado={block} config={{ isThumbnail }} />
        );
      }
      default: {
        const def = elementRegistry.obtener<Block, PrimitiveRuntimeConfig>(block.tipo);
        if (!def) return null;
        const config = primitiveRuntimeConfig();
        return editorMode ? (
          <def.Editor estado={block} config={config} onChange={() => undefined} />
        ) : (
          <def.Viewer estado={block} config={config} />
        );
      }
    }
  }

  const animationStyle: CSSProperties =
    isViewerMode && blockIndex !== undefined
      ? {
          animation: 'lumina-block-in 400ms ease-out both',
          animationDelay: `${blockIndex * 80}ms`,
        }
      : {};

  return (
    <>
    <div
      ref={blockRef}
      role={isBlockButtonShell ? 'button' : undefined}
      tabIndex={isBlockButtonShell ? 0 : undefined}
      aria-pressed={editorMode && !isTextEditing ? isSelected : undefined}
      data-block-id={blockId}
      data-live-dragging={isLiveDragging ? 'true' : undefined}
      style={{
        ...positionStyle,
        ...animationStyle,
        ...(isLiveDragging ? { opacity: 1, visibility: 'visible' as const } : {}),
      }}
      onClick={
        editorMode && !isTextEditing && !isInteractiveStub
          ? (e) => { e.stopPropagation(); onClick(e); }
          : undefined
      }
      onDoubleClick={
        editorMode && block.tipo === 'texto' && !isTextEditing
          ? (e) => { e.stopPropagation(); onEditStart?.(blockId); }
          : undefined
      }
      onKeyDown={
        isBlockButtonShell
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        editorMode && 'relative group',
        isBlockButtonShell && 'cursor-pointer outline-none rounded-sm',
        isBlockButtonShell && 'hover:ring-2 hover:ring-blue-500/40',
        editorMode && isTextEditing && 'cursor-text outline-none rounded-sm',
        isFormBlock && 'min-h-0 max-w-full cursor-default',
        editorMode && isSelected && 'ring-2 ring-blue-500 ring-offset-1',
        editorMode && canvasLocked && isSelected && 'ring-amber-500/90',
        editorMode && isLiveDragging && 'z-20 opacity-100 shadow-lg ring-2 ring-[#2563EB]/50',
        isInteractiveStub && 'pointer-events-none',
        !editorMode && block.tipo !== 'hotspot' && block.tipo !== 'tooltip' && 'overflow-hidden max-w-full max-h-full',
        !editorMode && block.tipo === 'actividad' && 'min-h-0',
        !editorMode &&
          (block.tipo === 'actividad' ||
            block.tipo === 'timeline' ||
            block.tipo === 'click-reveal' ||
            block.tipo === 'popup' ||
            block.tipo === 'flip-cards' ||
            block.tipo === 'tabs' ||
            block.tipo === 'carousel' ||
            block.tipo === 'contador' ||
            block.tipo === 'ruleta' ||
            block.tipo === 'grafico' ||
            block.tipo === 'diagrama') &&
          'flex h-full min-h-0 w-full flex-col',
      )}
    >
      {renderContent()}
      {editorMode &&
        isSelected &&
        !clipInnerEdit &&
        !popupOverlayEditing &&
        !canvasLocked &&
        canvasRef &&
        currentCoords &&
        onResize &&
        onResizeEnd && (
        <ResizeHandles
          blockId={blockId}
          x={currentCoords.x}
          y={currentCoords.y}
          ancho={currentCoords.ancho}
          alto={currentCoords.alto}
          rotacion={rotacion}
          lockAspectRatio={block.tipo === 'imagen' ? !!block.lockAspectRatio : false}
          minDim={getBlockResizeMinDim(block.tipo)}
          canvasRef={canvasRef}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
          onRotate={onRotate}
          onRotateEnd={onRotateEnd}
        />
      )}
    </div>
    <BlockActionToolbarPortal blockRef={blockRef} visible={showActionToolbar}>
      {block.tipo === 'popup' && onPopupInnerSelectionChange && !popupOverlayEditing ? (
        <button
          type="button"
          aria-label="Editar contenido del popup"
          title="Editar contenido del popup"
          onClick={(e) => {
            e.stopPropagation();
            onPopupInnerSelectionChange({ kind: 'overlay' });
          }}
          className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]"
        >
          <Pencil className="size-3.5" />
        </button>
      ) : null}
      {!!onToggleCanvasLock && canvasPositionable && (
        <button
          type="button"
          aria-label={canvasLocked ? 'Desbloquear posición' : 'Fijar posición y tamaño'}
          title={canvasLocked ? 'Desbloquear posición' : 'Fijar posición y tamaño'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCanvasLock(blockId);
          }}
          className={cn(
            'flex size-7 items-center justify-center rounded-lg p-1.5',
            canvasLocked
              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]',
          )}
        >
          {canvasLocked ? (
            <Lock className="size-3.5" />
          ) : (
            <LockOpen className="size-3.5" />
          )}
        </button>
      )}
      {!!onCopyBlock && block.tipo !== 'actividad' && (
        <button
          type="button"
          aria-label="Copiar bloque"
          onClick={(e) => {
            e.stopPropagation();
            onCopyBlock(blockId);
          }}
          className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]"
          title="Copiar (Ctrl+C)"
        >
          <Copy className="size-3.5" />
        </button>
      )}
      {!!onDuplicateBlock && block.tipo !== 'actividad' && (
        <button
          type="button"
          aria-label="Duplicar bloque"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateBlock(blockId);
          }}
          className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]"
          title="Duplicar (Ctrl+D)"
        >
          <Copy className="size-3.5" />
        </button>
      )}
      {!!onUngroupClipGroup &&
        block.tipo === 'clip-group' &&
        block.contenido.tipo === 'composicion' && (
          <button
            type="button"
            aria-label="Desagrupar máscara"
            title="Desagrupar máscara — devuelve los elementos al lienzo"
            onClick={(e) => {
              e.stopPropagation();
              onUngroupClipGroup(blockId);
            }}
            className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-[#2563EB]"
          >
            <Ungroup className="size-3.5" />
          </button>
        )}
      {!!onRemoveBlock && (
        <button
          type="button"
          aria-label="Eliminar bloque"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveBlock(blockId);
          }}
          className="flex size-7 items-center justify-center rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f9fafb] hover:text-red-600"
          title="Eliminar (Supr o Backspace)"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </BlockActionToolbarPortal>
    </>
  );
}

// ─── SlideRenderer ────────────────────────────────────────────────────────────

export interface SlideRendererProps {
  slide: Slide;
  /** `'editor'` shows click-selection borders; `'viewer'`/`'preview'` are purely presentational. */
  modo: Modo;
  /**
   * Ref al marco del lienzo (misma caja que `canvasRef` en `CanvasArea`) para medir resize/drag.
   * Si no se pasa, se usa un ref interno en la raíz del renderer.
   */
  canvasRef?: RefObject<HTMLDivElement | null>;
  /** Called with the block's index-path string when a block is selected in editor mode. */
  onBlockSelect?: (blockId: string, e?: React.MouseEvent) => void;
  selectedBlockId?: string | null;
  selectedBlockIds?: string[];
  /** Persiste cambios de una actividad (PATCH vía el padre). */
  onActivityChange?: (blockId: string, activity: Activity) => void;
  /** Persiste cambios de un widget flip-cards (PATCH vía el padre). */
  onFlipCardsChange?: (blockId: string, block: FlipCardsWidget) => void;
  /** Selección interna del widget flip-cards (texto/imagen) para el panel contextual. */
  flipCardsInnerSelection?: FlipCardsInnerSelection | null;
  onFlipCardsInnerSelectionChange?: (selection: FlipCardsInnerSelection | null) => void;
  /** Persiste cambios de un widget tabs (PATCH vía el padre). */
  onTabsChange?: (blockId: string, block: TabsWidget) => void;
  tabsInnerSelection?: TabsInnerSelection | null;
  onTabsInnerSelectionChange?: (selection: TabsInnerSelection | null) => void;
  /** Persiste cambios de un widget carousel (PATCH vía el padre). */
  onCarouselChange?: (blockId: string, block: CarouselWidget) => void;
  carouselInnerSelection?: CarouselInnerSelection | null;
  onCarouselInnerSelectionChange?: (selection: CarouselInnerSelection | null) => void;
  /** Persiste cambios de un widget click-reveal (PATCH vía el padre). */
  onClickRevealChange?: (blockId: string, block: ClickRevealWidget) => void;
  clickRevealInnerSelection?: ClickRevealInnerSelection | null;
  onClickRevealInnerSelectionChange?: (selection: ClickRevealInnerSelection | null) => void;
  onPopupChange?: (blockId: string, block: PopupWidget) => void;
  popupInnerSelection?: PopupInnerSelection | null;
  onPopupInnerSelectionChange?: (selection: PopupInnerSelection | null) => void;
  onHotspotChange?: (blockId: string, block: HotspotWidget) => void;
  hotspotInnerSelection?: HotspotInnerSelection | null;
  onHotspotInnerSelectionChange?: (selection: HotspotInnerSelection | null) => void;
  onTimelineChange?: (blockId: string, block: TimelineWidget) => void;
  timelineInnerSelection?: TimelineInnerSelection | null;
  onTimelineInnerSelectionChange?: (selection: TimelineInnerSelection | null) => void;
  onDiagramaChange?: (blockId: string, block: DiagramaBlock) => void;
  /** Elimina un bloque del slide (p. ej. actividad equivocada). */
  onRemoveBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onCopyBlock?: (blockId: string) => void;
  onToggleCanvasLock?: (blockId: string) => void;
  /** Callback emitido por el estudiante al responder una actividad (solo modo viewer). */
  onResponse?: (response: unknown) => void;
  className?: string;
  /**
   * Si existe, sustituye `useUpdateSlide` para resize/texto: permite historial deshacer/rehacer en el padre.
   */
  onPersistSlide?: (args: {
    previousBloques: Block[];
    content: Record<string, unknown>;
  }) => Promise<boolean>;
  /** Llamado al terminar un resize de bloque (p. ej. limpiar guías de snap del lienzo). */
  onResizeInteractionEnd?: () => void;
  /**
   * Llamado en cada frame de resize con las coordenadas provisionales brutas.
   * Puede devolver coordenadas ajustadas (snapped) que SlideRenderer usará para el
   * live preview. Si no se proporciona, se usan las coords brutas sin snap.
   */
  onResizeMove?: (
    blockId: string,
    rawCoords: { x: number; y: number; ancho: number; alto: number },
  ) => { x: number; y: number; ancho: number; alto: number };
  /**
   * Variante visual de los viewers de actividad.
   * Si se omite, se calcula con la luminancia de `slide.fondo` vía `getSlideVariant`.
   */
  variant?: 'dark' | 'light';
  /** En modo viewer, permite llenar el contenedor padre sin forzar 16:9. */
  viewerFill?: boolean;
  /** Socket.IO del viewer en vivo (p. ej. torneo). */
  liveSocket?: Socket | null;
  /** Socket al namespace `/live` para eventos del torneo (viewer). */
  torneoSocket?: Socket | null;
  viewerStudentId?: string;
  viewerStudentName?: string;
  viewerClassId?: string;
  /** Miniatura del panel lateral (SlideCanvasThumb). No confundir con modo preview escalado. */
  isThumbnail?: boolean;
  /** Id de índice (`"0"`) del bloque en drag live — preview visible, sin opacity 0. */
  draggingBlockId?: string | null;
  clipGroupInnerEditId?: string | null;
  onClipGroupInnerEditChange?: (blockId: string | null) => void;
  onClipGroupChange?: (blockId: string, block: ClipGroupBlock) => void;
  /** Desagrupa un `clip-group` de composición (reemplaza el bloque por sus hijos). */
  onUngroupClipGroup?: (blockId: string) => void;
}

export function SlideRenderer({
  slide,
  modo,
  canvasRef: canvasRefProp,
  onBlockSelect,
  selectedBlockId: selectedBlockIdProp,
  selectedBlockIds: selectedBlockIdsProp,
  onActivityChange,
  onFlipCardsChange,
  flipCardsInnerSelection,
  onFlipCardsInnerSelectionChange,
  onTabsChange,
  tabsInnerSelection,
  onTabsInnerSelectionChange,
  onCarouselChange,
  carouselInnerSelection,
  onCarouselInnerSelectionChange,
  onClickRevealChange,
  clickRevealInnerSelection,
  onClickRevealInnerSelectionChange,
  onPopupChange,
  popupInnerSelection,
  onPopupInnerSelectionChange,
  onHotspotChange,
  hotspotInnerSelection,
  onHotspotInnerSelectionChange,
  onTimelineChange,
  timelineInnerSelection,
  onTimelineInnerSelectionChange,
  onDiagramaChange,
  onRemoveBlock,
  onDuplicateBlock,
  onCopyBlock,
  onToggleCanvasLock,
  onResponse,
  className,
  onPersistSlide,
  onResizeInteractionEnd,
  onResizeMove,
  variant: variantProp,
  viewerFill = false,
  liveSocket,
  torneoSocket,
  viewerStudentId,
  viewerStudentName,
  viewerClassId: viewerClassIdProp,
  isThumbnail = false,
  draggingBlockId = null,
  clipGroupInnerEditId = null,
  onClipGroupInnerEditChange,
  onClipGroupChange,
  onUngroupClipGroup,
}: SlideRendererProps) {
  const [selectedIdState, setSelectedIdState] = useState<string | null>(null);
  const selectedId = selectedBlockIdProp !== undefined ? selectedBlockIdProp : selectedIdState;
  const slideFonts = useMemo(
    () => [...FONT_CORE_FAMILIES, ...collectFontFamiliesFromValue(slide)],
    [slide],
  );
  useEffect(() => {
    ensureGoogleFonts(slideFonts);
  }, [slideFonts]);

  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [resizingCoords, setResizingCoords] = useState<Record<string, { x: number; y: number; ancho: number; alto: number }>>({});
  const [rotatingAngles, setRotatingAngles] = useState<Record<string, number>>({});
  const [slideCanvasRoot, setSlideCanvasRoot] = useState<HTMLElement | null>(null);
  const internalCanvasRef = useRef<HTMLDivElement | null>(null);
  const measureCanvasRef = canvasRefProp ?? internalCanvasRef;

  const bindSlideRootRef = useCallback((node: HTMLDivElement | null) => {
    setSlideCanvasRoot(node);
    if (!canvasRefProp) {
      internalCanvasRef.current = node;
    }
  }, [canvasRefProp]);

  const params = useParams();
  const classId = params.id as string;
  const viewerClassIdResolved = viewerClassIdProp ?? classId;
  const updateSlide = useUpdateSlide(classId);

  const bgStyle = backgroundToCssStyle(slide.fondo);
  const variant =
    variantProp ?? getSlideVariant(backgroundColorSample(slide.fondo));
  const editorMode = modo === 'editor';

  const handleRotate = useCallback((blockId: string, angle: number) => {
    const blocks = slide.bloques ?? [];
    const block = blocks[Number(blockId)];
    if (block && isBlockCanvasLocked(block)) return;
    setRotatingAngles((prev) => ({ ...prev, [blockId]: angle }));
  }, [slide.bloques]);

  const handleRotateEnd = useCallback((blockId: string, angle: number) => {
    const previousBloques = slide.bloques ? [...slide.bloques] : [];
    const block = (slide.bloques ?? [])[Number(blockId)];
    setRotatingAngles((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });
    if (!block || isBlockCanvasLocked(block)) return;

    const nextBlocks = updateBlockAtPath(previousBloques, blockId, (b) => {
      return withRotation(b, angle);
    });

    const updatedContent = mergeRendererSlideState(slide, { bloques: nextBlocks });
    const sanitized = sanitizeSlideContentForPersistence(updatedContent) ?? updatedContent;

    if (onPersistSlide) {
      void onPersistSlide({ previousBloques, content: sanitized });
    } else {
      updateSlide.mutate({ slideId: slide.id, content: sanitized });
    }
  }, [slide, updateSlide, onPersistSlide]);

  const handleResize = useCallback((blockId: string, coords: { x: number; y: number; ancho: number; alto: number }) => {
    const blocks = slide.bloques ?? [];
    const block = blocks[Number(blockId)];
    if (block && isBlockCanvasLocked(block)) return;
    const snapped = onResizeMove ? onResizeMove(blockId, coords) : coords;
    setResizingCoords((prev) => ({ ...prev, [blockId]: snapped }));
  }, [onResizeMove, slide.bloques]);

  const handleResizeEnd = useCallback((blockId: string, coords: { x: number; y: number; ancho: number; alto: number }) => {
    const block = (slide.bloques ?? [])[Number(blockId)];
    if (block && isBlockCanvasLocked(block)) {
      setResizingCoords((prev) => {
        const next = { ...prev };
        delete next[blockId];
        return next;
      });
      return;
    }
    // Apply snap to the final commit coords so the saved position matches the guide.
    const finalCoords = onResizeMove ? onResizeMove(blockId, coords) : coords;

    setResizingCoords((prev) => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });

    const previousBloques = slide.bloques ? [...slide.bloques] : [];
    const nextBlocks = updateBlockAtPath(previousBloques, blockId, (b) => {
      if (b.tipo === 'popup') {
        const popupBlock = b as PopupWidget;
        const canvas = measureCanvasRef.current;
        const cfg = mergedPopupConfig(popupBlock);
        const isIcon = cfg.triggerVisual === 'icono';
        let triggerAnchoPx = cfg.triggerAnchoPx ?? 48;
        let triggerAltoPx = cfg.triggerAltoPx ?? 48;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const wPx = (finalCoords.ancho / 100) * rect.width;
          const hPx = (finalCoords.alto / 100) * rect.height;
          if (isIcon) {
            const side = clampPopupTriggerPx(Math.round((wPx + hPx) / 2));
            triggerAnchoPx = side;
            triggerAltoPx = side;
          } else {
            triggerAnchoPx = clampPopupTriggerPx(Math.round(wPx));
            triggerAltoPx = clampPopupTriggerPx(Math.round(hPx));
          }
        }
        return syncPopupBlockSizeFromTriggerPx({
          ...popupBlock,
          x: finalCoords.x,
          y: finalCoords.y,
          configuracion: {
            ...popupBlock.configuracion,
            triggerAnchoPx,
            triggerAltoPx,
          },
        });
      }

      const resized = withRect(
        b,
        finalCoords.x,
        finalCoords.y,
        finalCoords.ancho,
        finalCoords.alto,
      );
      if (b.tipo === 'imagen') {
        return { ...resized, ajuste: 'llenar' } as Block;
      }
      return resized;
    });

    const updatedContent = mergeRendererSlideState(slide, { bloques: nextBlocks });
    const sanitized = sanitizeSlideContentForPersistence(updatedContent) ?? updatedContent;

    if (onPersistSlide) {
      void onPersistSlide({ previousBloques, content: sanitized });
    } else {
      updateSlide.mutate({ slideId: slide.id, content: sanitized });
    }
    onResizeInteractionEnd?.();
  }, [slide, updateSlide, onPersistSlide, onResizeInteractionEnd, onResizeMove, measureCanvasRef]);

  // ─── Inline text editing ──────────────────────────────────────────────────

  function handleEditStart(blockId: string) {
    if (!editorMode || editingId === blockId) return;
    setEditingId(blockId);
    setSelectedIdState(blockId);
    onBlockSelect?.(blockId);
  }

  const handleEditCommit = useCallback((blockId: string, newText: string) => {
    setEditingId(null);
    const previousBloques = slide.bloques ? [...slide.bloques] : [];
    const blocks = slide.bloques ? [...slide.bloques] : [];
    const blockIndex = parseInt(blockId, 10);
    const block = blocks[blockIndex];
    if (!block || block.tipo !== 'texto' || block.contenido === newText) return;
    blocks[blockIndex] = { ...block, contenido: newText } as Block;
    const updatedContent = mergeRendererSlideState(slide, { bloques: blocks });
    const sanitized = sanitizeSlideContentForPersistence(updatedContent) ?? updatedContent;
    if (onPersistSlide) {
      void onPersistSlide({ previousBloques, content: sanitized });
    } else {
      updateSlide.mutate({ slideId: slide.id, content: sanitized });
    }
  }, [slide, updateSlide, onPersistSlide]);

  function handleEditCancel() {
    setEditingId(null);
  }

  // ─── Block selection / canvas deselect ────────────────────────────────────

  function handleBlockClick(blockId: string, e?: React.MouseEvent) {
    if (!editorMode) return;
    setSelectedIdState(blockId);
    onBlockSelect?.(blockId, e);
  }

  function handleCanvasClick(e: React.MouseEvent) {
    if (!editorMode) return;
    if ((e.target as HTMLElement).closest('[data-popup-overlay-portal]')) return;
    setSelectedIdState(null);
    setEditingId(null);
    onBlockSelect?.('');
  }

  const blocks = slide.bloques ?? [];

  // ─── Preview mode: scaled-down thumbnail ──────────────────────────────────
  // Render a fixed 1280×720 virtual canvas and scale it to fit the thumbnail
  // container. This ensures fonts, images, and block positions are all
  // proportionally correct — identical to how PowerPoint / Canva do it.
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0);

  useLayoutEffect(() => {
    if (modo !== 'preview') return;
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) setPreviewScale(el.clientWidth / 1280);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [modo]);

  if (modo === 'preview') {
    return (
      <SlideCanvasRootContext.Provider value={slideCanvasRoot}>
      <div
        ref={previewContainerRef}
        className={cn('relative overflow-hidden', className)}
        style={{ aspectRatio: '16 / 9' }}
      >
        {previewScale > 0 && (
          <div
            ref={bindSlideRootRef}
            data-slide-root
            className="canvas-slide"
            style={{
              ...bgStyle,
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1280,
              height: 720,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
            }}
          >
            {slide.fondo?.tipo === 'imagen' && typeof slide.fondo.rotacion === 'number' && slide.fondo.rotacion % 360 !== 0 && (
              <BackgroundImageLayer fondo={slide.fondo} />
            )}
            {blocks.map((block, index) => {
              const blockId = String(index);
              return (
                <BlockNode
                  key={blockId}
                  block={block}
                  blockId={blockId}
                  slideId={slide.id}
                  isSelected={false}
                  modo="preview"
                  selectedId={null}
                  onClick={() => {}}
                  onBlockClick={() => {}}
                  pathPrefix={blockId}
                  positionStyle={getBlockPositionStyle(block)}
                  canvasRef={measureCanvasRef}
                  currentCoords={{ x: 0, y: 0, ancho: 0, alto: 0 }}
                  onResize={() => {}}
                  onResizeEnd={() => {}}
                  editingId={null}
                  variant={variant}
                  blockIndex={index}
                  liveSocket={liveSocket}
                  torneoSocket={torneoSocket}
                  viewerStudentId={viewerStudentId}
                  viewerStudentName={viewerStudentName}
            viewerClassId={viewerClassIdResolved}
            isThumbnail={isThumbnail}
            clipGroupInnerEditId={clipGroupInnerEditId}
            onClipGroupInnerEditChange={onClipGroupInnerEditChange}
            onClipGroupChange={onClipGroupChange}
          />
              );
            })}
          </div>
        )}
      </div>
      </SlideCanvasRootContext.Provider>
    );
  }

  // ─── Editor / viewer mode ─────────────────────────────────────────────────
  return (
    <SlideCanvasRootContext.Provider value={slideCanvasRoot}>
    <div
      data-slide-root
      className={cn('canvas-slide', editorMode ? 'overflow-visible' : 'overflow-hidden', className)}
      style={{
        ...bgStyle,
        ...(editorMode
          ? {
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: 0,
              minWidth: 0,
              overflow: 'visible',
            }
          : viewerFill
            ? {
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }
            : {
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                overflow: 'hidden',
              }),
      }}
      onClick={handleCanvasClick}
      ref={bindSlideRootRef}
    >
      {slide.fondo?.tipo === 'imagen' && typeof slide.fondo.rotacion === 'number' && slide.fondo.rotacion % 360 !== 0 && (
        <BackgroundImageLayer fondo={slide.fondo} className="rounded-md" />
      )}
      {/* key={slide.id} forces full remount of blocks on slide change → re-triggers entry animation */}
      {blocks.map((block, index) => {
        const blockId = String(index);
        const posStyleObj = getBlockPositionStyle(block);
        const currentCoords = resizingCoords[blockId] ?? getBlockRawCoords(block);
        const currentRot = rotatingAngles[blockId] !== undefined
          ? rotatingAngles[blockId]
          : (block as { rotacion?: number }).rotacion ?? (block.tipo === 'actividad' ? block.marco?.rotacion : undefined);

        const posStyle = resizingCoords[blockId] ? {
          position: 'absolute' as const,
          left: `${currentCoords.x}%`,
          top: `${currentCoords.y}%`,
          width: `${currentCoords.ancho}%`,
          height: `${currentCoords.alto}%`,
          zIndex: (block as { zIndex?: number }).zIndex ?? 1,
          transform: currentRot ? `rotate(${currentRot}deg)` : undefined,
          transformOrigin: currentRot ? 'center center' : undefined,
        } : rotatingAngles[blockId] !== undefined ? {
          ...posStyleObj,
          transform: `rotate(${rotatingAngles[blockId]}deg)`,
          transformOrigin: 'center center',
        } : posStyleObj;

        const isBlockSelected = editorMode && (
          selectedBlockIdsProp && selectedBlockIdsProp.length > 0
            ? selectedBlockIdsProp.includes(blockId)
            : selectedId === blockId
        );

        return (
          <BlockNode
            key={`${slide.id}-${blockId}`}
            block={block}
            blockId={blockId}
            slideId={slide.id}
            isSelected={isBlockSelected}
            modo={modo}
            selectedId={selectedId}
            selectedBlockIds={selectedBlockIdsProp}
            onClick={(e) => handleBlockClick(blockId, e)}
            onBlockClick={(id, e) => handleBlockClick(id, e)}
            pathPrefix={blockId}
            positionStyle={posStyle}
            rotacion={currentRot}
            onRotate={handleRotate}
            onRotateEnd={handleRotateEnd}
            onActivityChange={onActivityChange}
            onFlipCardsChange={onFlipCardsChange}
            flipCardsInnerSelection={flipCardsInnerSelection}
            onFlipCardsInnerSelectionChange={onFlipCardsInnerSelectionChange}
            onTabsChange={onTabsChange}
            tabsInnerSelection={tabsInnerSelection}
            onTabsInnerSelectionChange={onTabsInnerSelectionChange}
            onCarouselChange={onCarouselChange}
            carouselInnerSelection={carouselInnerSelection}
            onCarouselInnerSelectionChange={onCarouselInnerSelectionChange}
            onClickRevealChange={onClickRevealChange}
            clickRevealInnerSelection={clickRevealInnerSelection}
            onClickRevealInnerSelectionChange={onClickRevealInnerSelectionChange}
            onPopupChange={onPopupChange}
            popupInnerSelection={popupInnerSelection}
            onPopupInnerSelectionChange={onPopupInnerSelectionChange}
            onHotspotChange={onHotspotChange}
            hotspotInnerSelection={hotspotInnerSelection}
            onHotspotInnerSelectionChange={onHotspotInnerSelectionChange}
            onTimelineChange={onTimelineChange}
            timelineInnerSelection={timelineInnerSelection}
            onTimelineInnerSelectionChange={onTimelineInnerSelectionChange}
            onDiagramaChange={onDiagramaChange}
            onRemoveBlock={editorMode ? onRemoveBlock : undefined}
            onDuplicateBlock={editorMode ? onDuplicateBlock : undefined}
            onCopyBlock={editorMode ? onCopyBlock : undefined}
            onToggleCanvasLock={editorMode ? onToggleCanvasLock : undefined}
            onResponse={onResponse}
            canvasRef={measureCanvasRef}
            currentCoords={currentCoords}
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            editingId={editingId}
            onEditStart={editorMode ? handleEditStart : undefined}
            onEditCommit={editorMode ? handleEditCommit : undefined}
            onEditCancel={editorMode ? handleEditCancel : undefined}
            isResizing={Boolean(resizingCoords[blockId])}
            variant={variant}
            blockIndex={index}
            liveSocket={liveSocket}
            torneoSocket={torneoSocket}
            viewerStudentId={viewerStudentId}
            viewerStudentName={viewerStudentName}
            viewerClassId={viewerClassIdResolved}
            isThumbnail={isThumbnail}
            clipGroupInnerEditId={clipGroupInnerEditId}
            onClipGroupInnerEditChange={onClipGroupInnerEditChange}
            onClipGroupChange={editorMode ? onClipGroupChange : undefined}
            onUngroupClipGroup={editorMode ? onUngroupClipGroup : undefined}
            isLiveDragging={draggingBlockId === blockId}
          />
        );
      })}

      {blocks.length === 0 && editorMode && (
        <div className="flex h-full items-center justify-center text-sm text-neutral-400 select-none pointer-events-none">
          Sin bloques — agrega contenido desde el panel lateral
        </div>
      )}
    </div>
    </SlideCanvasRootContext.Provider>
  );
}
