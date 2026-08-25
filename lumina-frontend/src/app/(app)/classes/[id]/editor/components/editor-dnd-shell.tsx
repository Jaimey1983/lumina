'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { LucideIcon } from 'lucide-react';

import type { Block, BlockMarco, Slide } from '@/types/slide.types';
import { useBlockDrag } from '@/hooks/use-block-drag';
import {
  clientPointToActivityMarco,
  clientPointToWidgetMarco,
  getDropClientPoint,
  getWidgetDropSizePct,
  isActivityPanelDrag,
  isWidgetPanelDrag,
} from '../lib/activity-canvas-position';
import { CANVAS_DROP_ZONE_ID } from './droppable-canvas';
import type { ActivityPanelDragData } from './draggable-activity-item';
import type { WidgetPanelDragData } from './draggable-widget-item';
import type { ActivityType, WidgetType } from './panels/activities-panel';
import { cn } from '@/lib/utils';

export interface ActivityDragOverlayState {
  label: string;
  Icon: LucideIcon;
}

type PanelDragState =
  | ({ kind: 'activity' } & ActivityPanelDragData)
  | ({ kind: 'widget' } & WidgetPanelDragData);

const EditorDndShellContext = createContext<{ isOverCanvas: boolean; panelDragActive: boolean }>({
  isOverCanvas: false,
  panelDragActive: false,
});

export function useEditorDndShell() {
  return useContext(EditorDndShellContext);
}

const BlockDragContext = createContext<ReturnType<typeof useBlockDrag> | null>(null);

export function useEditorBlockDrag() {
  const ctx = useContext(BlockDragContext);
  if (!ctx) {
    throw new Error('useEditorBlockDrag debe usarse dentro de EditorDndShell');
  }
  return ctx;
}

interface EditorDndShellProps {
  children: ReactNode;
  canvasRef: RefObject<HTMLDivElement | null>;
  slide: Slide | null;
  onBlockDragSave: (updatedBlocks: Block[]) => void | Promise<void>;
  onActivityDrop: (type: ActivityType, marco: BlockMarco) => void;
  onWidgetDrop?: (type: WidgetType, marco: BlockMarco) => void;
  getActivityDragOverlay?: (type: ActivityType) => ActivityDragOverlayState | null;
  getWidgetDragOverlay?: (type: WidgetType) => ActivityDragOverlayState | null;
}

export function EditorDndShell({
  children,
  canvasRef,
  slide,
  onBlockDragSave,
  onActivityDrop,
  onWidgetDrop,
  getActivityDragOverlay,
  getWidgetDragOverlay,
}: EditorDndShellProps) {
  const [panelDrag, setPanelDrag] = useState<PanelDragState | null>(null);
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const [dropMissHint, setDropMissHint] = useState(false);

  const blockDrag = useBlockDrag({
    canvasRef,
    slide,
    onSave: onBlockDragSave,
  });

  /**
   * DndContext no debe recibir callbacks nuevos en cada onMove: liveBloques cambia
   * el objeto `blockDrag` y @dnd-kit reentra en onDragMove → Maximum update depth.
   */
  const blockDragRef = useRef(blockDrag);
  blockDragRef.current = blockDrag;
  const panelDragRef = useRef(panelDrag);
  panelDragRef.current = panelDrag;
  const onActivityDropRef = useRef(onActivityDrop);
  onActivityDropRef.current = onActivityDrop;
  const onWidgetDropRef = useRef(onWidgetDrop);
  onWidgetDropRef.current = onWidgetDrop;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (isActivityPanelDrag(event.active)) {
      const data = event.active.data.current as ActivityPanelDragData;
      setPanelDrag({ kind: 'activity', ...data });
      return;
    }
    if (isWidgetPanelDrag(event.active)) {
      const data = event.active.data.current as WidgetPanelDragData;
      setPanelDrag({ kind: 'widget', ...data });
      return;
    }
    blockDragRef.current.handleDragStart(event);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (panelDragRef.current) {
      setIsOverCanvas(event.over?.id === CANVAS_DROP_ZONE_ID);
      return;
    }
    blockDragRef.current.handleDragMove(event);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activePanel = panelDragRef.current;
      if (activePanel) {
        const droppedOnCanvas = event.over?.id === CANVAS_DROP_ZONE_ID;
        if (droppedOnCanvas && canvasRef.current) {
          const point = getDropClientPoint(event);
          if (point) {
            const rect = canvasRef.current.getBoundingClientRect();
            if (activePanel.kind === 'activity') {
              onActivityDropRef.current(
                activePanel.tipo,
                clientPointToActivityMarco(rect, point.clientX, point.clientY),
              );
            } else if (activePanel.kind === 'widget') {
              onWidgetDropRef.current?.(
                activePanel.tipo,
                clientPointToWidgetMarco(
                  rect,
                  point.clientX,
                  point.clientY,
                  getWidgetDropSizePct(activePanel.tipo),
                ),
              );
            }
          }
        } else if (!droppedOnCanvas) {
          setDropMissHint(true);
          window.setTimeout(() => setDropMissHint(false), 2200);
        }
        setPanelDrag(null);
        setIsOverCanvas(false);
        return;
      }
      blockDragRef.current.handleDragEnd(event);
    },
    [canvasRef],
  );

  const handleDragCancel = useCallback(() => {
    setPanelDrag(null);
    setIsOverCanvas(false);
  }, []);

  const overlay =
    panelDrag?.kind === 'activity' && getActivityDragOverlay
      ? getActivityDragOverlay(panelDrag.tipo)
      : panelDrag?.kind === 'widget' && getWidgetDragOverlay
        ? getWidgetDragOverlay(panelDrag.tipo)
        : null;

  useEffect(() => {
    if (!panelDrag) return;
    const prev = document.body.style.cursor;
    document.body.style.cursor = 'grabbing';
    return () => {
      document.body.style.cursor = prev;
    };
  }, [panelDrag]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <BlockDragContext.Provider value={blockDrag}>
        <EditorDndShellContext.Provider
          value={{ isOverCanvas, panelDragActive: panelDrag != null }}
        >
          <div className="contents">
            {children}
          </div>
          {dropMissHint ? (
            <div
              className="pointer-events-none fixed bottom-20 left-1/2 z-[10000] -translate-x-1/2 rounded-md border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-md"
              role="status"
            >
              Suelta sobre el lienzo para insertar el elemento
            </div>
          ) : null}
        </EditorDndShellContext.Provider>
      </BlockDragContext.Provider>

      <DragOverlay dropAnimation={null}>
        {panelDrag && overlay ? (
          <div
            className={cn(
              'flex items-center gap-2 rounded-md border border-[#2563EB]/40 bg-white/95 px-3 py-2 shadow-md',
              'pointer-events-none cursor-grabbing',
            )}
          >
            <overlay.Icon className="size-4 shrink-0 text-[#2563EB]" />
            <span className="text-xs font-medium text-foreground">{overlay.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
