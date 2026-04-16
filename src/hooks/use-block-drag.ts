'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

/** Porcentaje del lienzo: alineación con centro/bordes del canvas u otros bloques. */
const SNAP_THRESHOLD_PCT = 2;

export type SnapLine = {
  orientation: 'horizontal' | 'vertical';
  /** Porcentaje 0–100 en el eje correspondiente (igual que `left`/`top` en CSS). */
  position: number;
};

function clampDragCorner(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(-50, Math.min(150, x)),
    y: Math.max(-50, Math.min(150, y)),
  };
}

/**
 * Ajusta (x, y) al punto de snap más cercano y devuelve las guías a dibujar.
 * Solo usa bloques de primer nivel (mismo modelo que el drag por índice).
 */
export function snapPositionToGuides(
  rawX: number,
  rawY: number,
  ancho: number,
  alto: number,
  draggedIndex: number,
  peers: Block[],
): { x: number; y: number; lines: SnapLine[] } {
  const xTargets: number[] = [0, 50, 100];
  const yTargets: number[] = [0, 50, 100];
  for (let i = 0; i < peers.length; i++) {
    if (i === draggedIndex) continue;
    const p = getBlockPos(peers[i]);
    xTargets.push(p.x, p.x + p.ancho / 2, p.x + p.ancho);
    yTargets.push(p.y, p.y + p.alto / 2, p.y + p.alto);
  }

  let snapX = rawX;
  let bestDx = SNAP_THRESHOLD_PCT + 1;
  let guideX: number | null = null;
  for (const target of xTargets) {
    const candidates: { dist: number; x: number; guide: number }[] = [
      { dist: Math.abs(rawX - target), x: target, guide: target },
      {
        dist: Math.abs(rawX + ancho / 2 - target),
        x: target - ancho / 2,
        guide: target,
      },
      { dist: Math.abs(rawX + ancho - target), x: target - ancho, guide: target },
    ];
    for (const c of candidates) {
      if (c.dist <= SNAP_THRESHOLD_PCT && c.dist < bestDx - 1e-9) {
        bestDx = c.dist;
        snapX = c.x;
        guideX = c.guide;
      }
    }
  }

  let snapY = rawY;
  let bestDy = SNAP_THRESHOLD_PCT + 1;
  let guideY: number | null = null;
  for (const target of yTargets) {
    const candidates: { dist: number; y: number; guide: number }[] = [
      { dist: Math.abs(rawY - target), y: target, guide: target },
      {
        dist: Math.abs(rawY + alto / 2 - target),
        y: target - alto / 2,
        guide: target,
      },
      { dist: Math.abs(rawY + alto - target), y: target - alto, guide: target },
    ];
    for (const c of candidates) {
      if (c.dist <= SNAP_THRESHOLD_PCT && c.dist < bestDy - 1e-9) {
        bestDy = c.dist;
        snapY = c.y;
        guideY = c.guide;
      }
    }
  }

  const { x, y } = clampDragCorner(snapX, snapY);
  const lines: SnapLine[] = [];
  if (guideX !== null) lines.push({ orientation: 'vertical', position: guideX });
  if (guideY !== null) lines.push({ orientation: 'horizontal', position: guideY });
  return { x, y, lines };
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
  /** Guías de alineación visibles solo mientras `draggingId !== null`. */
  snapLines: SnapLine[];
  /** Limpia guías (p. ej. al terminar un resize en el lienzo). */
  clearSnapLines: () => void;
  /** Actualiza guías directamente (p. ej. durante resize en el lienzo). */
  setSnapLines: (lines: SnapLine[]) => void;
}

export function useBlockDrag({
  canvasRef,
  slide,
  onSave,
}: BlockDragOptions): BlockDragResult {
  const [draggingId,  setDraggingId]  = useState<string | null>(null);
  const [liveBloques, setLiveBloques] = useState<Block[] | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);

  /** Original x, y of the dragged block recorded at drag-start. */
  const originRef = useRef<{ x: number; y: number } | null>(null);
  /** Última posición con snap (persistir al soltar). */
  const pendingDragPosRef = useRef<{ x: number; y: number } | null>(null);

  const clearSnapLines = useCallback(() => {
    setSnapLines([]);
  }, []);

  // Reset drag state when the active slide changes.
  useEffect(() => {
    setDraggingId(null);
    setLiveBloques(null);
    setSnapLines([]);
    originRef.current = null;
    pendingDragPosRef.current = null;
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
    pendingDragPosRef.current = { x, y };
    setSnapLines([]);
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

    const dragged = bloques[index];
    if (!dragged) return;
    const { ancho, alto } = getBlockPos(dragged);

    const { x: snapX, y: snapY, lines } = snapPositionToGuides(
      res.newX,
      res.newY,
      ancho,
      alto,
      index,
      bloques,
    );
    pendingDragPosRef.current = { x: snapX, y: snapY };
    setSnapLines(lines);

    setLiveBloques((prev) => {
      const base = prev ?? bloques;
      const cur  = base[index];
      if (!cur) return prev;
      const { x: ox, y: oy } = getBlockPos(cur);
      if (
        Math.abs(ox - snapX) < 0.0001 &&
        Math.abs(oy - snapY) < 0.0001
      ) {
        return prev;
      }
      return base.map((b, i) => (i === index ? withPosition(b, snapX, snapY) : b));
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const id      = String(event.active.id);
    const index   = Number(id);
    const bloques = slide?.bloques ?? [];
    const rect    = getRect();

    if (rect && originRef.current) {
      const pending = pendingDragPosRef.current;
      if (pending) {
        onSave(
          bloques.map((b, i) =>
            i === index ? withPosition(b, pending.x, pending.y) : b,
          ),
        );
      } else {
        const res = deltaToPos(index, event.delta, rect);
        if (res) {
          onSave(
            bloques.map((b, i) => (i === index ? withPosition(b, res.newX, res.newY) : b)),
          );
        }
      }
    }

    setSnapLines([]);
    setDraggingId(null);
    setLiveBloques(null);
    originRef.current = null;
    pendingDragPosRef.current = null;
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    draggingId,
    liveBloques,
    snapLines,
    clearSnapLines,
    setSnapLines,
  };
}
