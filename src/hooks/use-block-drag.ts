'use client';

import { useEffect, useRef, useState } from 'react';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import type { RefObject } from 'react';

import type { Block, Slide } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';

// ─── Position helpers ─────────────────────────────────────────────────────────

const ACTIVITY_FALLBACK = { x: 5, y: 5, ancho: 90, alto: 90 } as const;
const DEFAULT_FALLBACK  = { x: 5, y: 5, ancho: 90, alto: 90 } as const;

export interface BlockPos {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * Returns the canvas-percentage bounding box of a block,
 * applying BLOCK_FALLBACKS for blocks that pre-date the free-canvas system.
 */
export function getBlockPos(block: Block): BlockPos {
  switch (block.tipo) {
    case 'texto': {
      const fb = BLOCK_FALLBACKS.text;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'imagen': {
      const fb = BLOCK_FALLBACKS.image;
      return {
        x:     block.x ?? fb.x,
        y:     block.y ?? fb.y,
        ancho: typeof block.ancho === 'number' ? block.ancho : fb.ancho,
        alto:  typeof block.alto  === 'number' ? block.alto  : fb.alto,
      };
    }
    case 'video': {
      const fb = BLOCK_FALLBACKS.video;
      return {
        x:     block.x ?? fb.x,
        y:     block.y ?? fb.y,
        ancho: typeof block.ancho === 'number' ? block.ancho : fb.ancho,
        alto:  typeof block.alto  === 'number' ? block.alto  : fb.alto,
      };
    }
    case 'forma': {
      const fb = BLOCK_FALLBACKS.forma;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'actividad':
      return { ...ACTIVITY_FALLBACK };
    default:
      return { ...DEFAULT_FALLBACK };
  }
}

/** Returns a new block with updated x, y (only for block types that support canvas coords). */
function withPosition(block: Block, x: number, y: number): Block {
  switch (block.tipo) {
    case 'texto':  return { ...block, x, y };
    case 'imagen': return { ...block, x, y };
    case 'video':  return { ...block, x, y };
    case 'forma':  return { ...block, x, y };
    default:       return block;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface BlockDragOptions {
  /** Ref to the canvas container div — used to measure pixel dimensions for % conversion. */
  canvasRef: RefObject<HTMLDivElement | null>;
  /** Current renderer slide (with bloques in % coords). */
  slide: Slide | null;
  /** Called once on drag-end with the final updated block array. */
  onSave: (updatedBlocks: Block[]) => void;
}

export interface BlockDragResult {
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd:   (event: DragEndEvent)   => void;
  handleDragMove:  (event: DragMoveEvent)  => void;
  /** Index string of the block currently being dragged, or null. */
  draggingId:  string | null;
  /** Live block array with updated x/y during drag (null when not dragging). */
  liveBloques: Block[] | null;
}

export function useBlockDrag({
  canvasRef,
  slide,
  onSave,
}: BlockDragOptions): BlockDragResult {
  const [draggingId,  setDraggingId]  = useState<string | null>(null);
  const [liveBloques, setLiveBloques] = useState<Block[] | null>(null);

  /** Original x, y of the dragged block recorded at drag-start. */
  const originRef = useRef<{ x: number; y: number } | null>(null);

  // Reset drag state when the active slide changes.
  useEffect(() => {
    setDraggingId(null);
    setLiveBloques(null);
    originRef.current = null;
  }, [slide?.id]);

  // ─── helpers (react-compiler now handles memoization) ──

  const getRect = (): DOMRect | null => {
    const rect = canvasRef.current?.getBoundingClientRect() ?? null;
    return rect && rect.width > 0 ? rect : null;
  };

  const deltaToPos = (
    blockIndex: number,
    delta: { x: number; y: number },
    rect: DOMRect,
  ): { newX: number; newY: number } | null => {
    const bloques = slide?.bloques ?? [];
    const block = bloques[blockIndex];
    if (!block || !originRef.current) return null;

    const dx = (delta.x / rect.width) * 100;
    const dy = (delta.y / rect.height) * 100;

    return {
      newX: Math.max(-50, Math.min(150, originRef.current.x + dx)),
      newY: Math.max(-50, Math.min(150, originRef.current.y + dy)),
    };
  };

  // ─── handlers (react-compiler now handles memoization; evita bucles en onMove) ──

  const handleDragStart = (event: DragStartEvent) => {
    const id      = String(event.active.id);
    const bloques = slide?.bloques ?? [];
    const block   = bloques[Number(id)];
    if (!block) return;

    const { x, y } = getBlockPos(block);
    originRef.current = { x, y };
    setDraggingId(id);
    setLiveBloques([...bloques]);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!originRef.current) return;
    const rect = getRect();
    if (!rect) return;

    const index   = Number(String(event.active.id));
    const bloques = slide?.bloques ?? [];
    const res     = deltaToPos(index, event.delta, rect);
    if (!res) return;

    setLiveBloques((prev) => {
      const base = prev ?? bloques;
      const cur  = base[index];
      if (!cur) return prev;
      const { x: ox, y: oy } = getBlockPos(cur);
      if (
        Math.abs(ox - res.newX) < 0.0001 &&
        Math.abs(oy - res.newY) < 0.0001
      ) {
        return prev;
      }
      return base.map((b, i) => (i === index ? withPosition(b, res.newX, res.newY) : b));
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const id      = String(event.active.id);
    const index   = Number(id);
    const bloques = slide?.bloques ?? [];
    const rect    = getRect();

    if (rect && originRef.current) {
      const res = deltaToPos(index, event.delta, rect);
      if (res) {
        onSave(
          bloques.map((b, i) => (i === index ? withPosition(b, res.newX, res.newY) : b)),
        );
      }
    }

    setDraggingId(null);
    setLiveBloques(null);
    originRef.current = null;
  };

  return { handleDragStart, handleDragEnd, handleDragMove, draggingId, liveBloques };
}
