'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  getDropClientPoint,
  isActivityPanelDrag,
} from '../lib/activity-canvas-position';
import { CANVAS_DROP_ZONE_ID } from './droppable-canvas';
import type { ActivityPanelDragData } from './draggable-activity-item';
import type { ActivityType } from './panels/activities-panel';
import { cn } from '@/lib/utils';

export interface ActivityDragOverlayState {
  label: string;
  Icon: LucideIcon;
}

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
  getActivityDragOverlay?: (type: ActivityType) => ActivityDragOverlayState | null;
}

export function EditorDndShell({
  children,
  canvasRef,
  slide,
  onBlockDragSave,
  onActivityDrop,
  getActivityDragOverlay,
}: EditorDndShellProps) {
  const [panelDrag, setPanelDrag] = useState<ActivityPanelDragData | null>(null);
  const [isOverCanvas, setIsOverCanvas] = useState(false);

  const blockDrag = useBlockDrag({
    canvasRef,
    slide,
    onSave: onBlockDragSave,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (isActivityPanelDrag(event.active)) {
        const data = event.active.data.current as ActivityPanelDragData;
        setPanelDrag(data);
        return;
      }
      blockDrag.handleDragStart(event);
    },
    [blockDrag],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (panelDrag) {
        setIsOverCanvas(event.over?.id === CANVAS_DROP_ZONE_ID);
        return;
      }
      blockDrag.handleDragMove(event);
    },
    [blockDrag, panelDrag],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (panelDrag) {
        if (event.over?.id === CANVAS_DROP_ZONE_ID && canvasRef.current) {
          const point = getDropClientPoint(event);
          if (point) {
            const marco = clientPointToActivityMarco(
              canvasRef.current.getBoundingClientRect(),
              point.clientX,
              point.clientY,
            );
            onActivityDrop(panelDrag.tipo, marco);
          }
        }
        setPanelDrag(null);
        setIsOverCanvas(false);
        return;
      }
      blockDrag.handleDragEnd(event);
    },
    [blockDrag, canvasRef, onActivityDrop, panelDrag],
  );

  const handleDragCancel = useCallback(() => {
    setPanelDrag(null);
    setIsOverCanvas(false);
  }, []);

  const overlay =
    panelDrag && getActivityDragOverlay
      ? getActivityDragOverlay(panelDrag.tipo)
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
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            {children}
          </div>
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
