'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import type { RefObject } from 'react';

import type { Block, Slide, SlideGuias } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import {
  VIRTUAL_CANVAS_HEIGHT,
  VIRTUAL_CANVAS_WIDTH,
  virtualXToPercent,
  virtualYToPercent,
} from '@/lib/canvas-guides';
import { getEqualGapSnapTargets } from '@/lib/canvas-spacing';

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
    case 'flip-cards': {
      const fb = BLOCK_FALLBACKS.flipCards;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'tabs': {
      const fb = BLOCK_FALLBACKS.tabs;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'carousel': {
      const fb = BLOCK_FALLBACKS.carousel;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'click-reveal': {
      const fb = BLOCK_FALLBACKS.clickReveal;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'popup': {
      const fb = BLOCK_FALLBACKS.popup;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'hotspot': {
      const fb = BLOCK_FALLBACKS.hotspot;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'tooltip': {
      const fb = BLOCK_FALLBACKS.tooltip;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'boton': {
      const fb = BLOCK_FALLBACKS.boton;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'contador': {
      const fb = BLOCK_FALLBACKS.contador;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'progreso': {
      const fb = BLOCK_FALLBACKS.progreso;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'timeline': {
      const fb = BLOCK_FALLBACKS.timeline;
      return {
        x:     block.x     ?? fb.x,
        y:     block.y     ?? fb.y,
        ancho: block.ancho ?? fb.ancho,
        alto:  block.alto  ?? fb.alto,
      };
    }
    case 'actividad': {
      const marco = block.marco;
      if (marco) {
        return {
          x: marco.izquierdaPct,
          y: marco.arribaPct,
          ancho: marco.anchoPct,
          alto: marco.altoPct,
        };
      }
      return { ...ACTIVITY_FALLBACK };
    }
    default:
      return { ...DEFAULT_FALLBACK };
  }
}

/** Returns a new block with updated x, y (canvas % or activity `marco`). */
export function withPosition(block: Block, x: number, y: number): Block {
  switch (block.tipo) {
    case 'texto':       return { ...block, x, y };
    case 'imagen':      return { ...block, x, y };
    case 'video':       return { ...block, x, y };
    case 'forma':       return { ...block, x, y };
    case 'flip-cards':  return { ...block, x, y };
    case 'tabs':        return { ...block, x, y };
    case 'carousel':    return { ...block, x, y };
    case 'click-reveal': return { ...block, x, y };
    case 'popup':        return { ...block, x, y };
    case 'hotspot':      return { ...block, x, y };
    case 'tooltip':      return { ...block, x, y };
    case 'boton':        return { ...block, x, y };
    case 'contador':     return { ...block, x, y };
    case 'progreso':     return { ...block, x, y };
    case 'timeline':     return { ...block, x, y };
    case 'actividad': {
      const marco = block.marco ?? {
        izquierdaPct: ACTIVITY_FALLBACK.x,
        arribaPct: ACTIVITY_FALLBACK.y,
        anchoPct: ACTIVITY_FALLBACK.ancho,
        altoPct: ACTIVITY_FALLBACK.alto,
      };
      return {
        ...block,
        marco: { ...marco, izquierdaPct: x, arribaPct: y },
      };
    }
    default:            return block;
  }
}

export type GroupDragOrigins = Record<string, { x: number; y: number }>;

/**
 * Preview/persist writer for canvas drag.
 *
 * Contrato: SlideRenderer pinta left/top % desde el bloque. El handle no aplica
 * transform de dnd-kit y DragOverlay no clona bloques del lienzo. Este writer
 * tiene que actualizar el índice arrastrado en cada move — también sin grupo —
 * o el bloque queda congelado en el origen.
 */
export function applyLiveDragPositions({
  bloques,
  draggedIndex,
  snapX,
  snapY,
  origin,
  groupOrigins,
}: {
  bloques: Block[];
  draggedIndex: number;
  snapX: number;
  snapY: number;
  origin: { x: number; y: number };
  groupOrigins: GroupDragOrigins | null;
}): Block[] {
  if (groupOrigins) {
    const deltaX = snapX - origin.x;
    const deltaY = snapY - origin.y;
    return bloques.map((b, i) => {
      const origPos = groupOrigins[String(i)];
      if (!origPos) return b;
      const { ancho, alto } = getBlockPos(b);
      const newX = Math.max(0, Math.min(100 - ancho, origPos.x + deltaX));
      const newY = Math.max(0, Math.min(100 - alto, origPos.y + deltaY));
      return withPosition(b, newX, newY);
    });
  }

  return bloques.map((b, i) =>
    i === draggedIndex ? withPosition(b, snapX, snapY) : b,
  );
}

/** Alcance del imán en px del canvas virtual 1280×720 (igual en X y en Y). */
export const SNAP_THRESHOLD_PX = 8;
const SNAP_PRIORITY = { canvas: 1, peer: 2, gap: 3, guide: 4 } as const;

export function snapThresholdPct(axis: 'x' | 'y'): number {
  const span = axis === 'x' ? VIRTUAL_CANVAS_WIDTH : VIRTUAL_CANVAS_HEIGHT;
  return (SNAP_THRESHOLD_PX / span) * 100;
}

export type SnapLine = {
  orientation: 'horizontal' | 'vertical';
  /** Porcentaje 0–100 en el eje correspondiente (igual que `left`/`top` en CSS). */
  position: number;
  kind?: 'align' | 'gap';
};

export function snapLineColor(line: SnapLine): string {
  return line.kind === 'gap' ? '#10B981' : '#F97316';
}

export type SnapToGuidesOptions = {
  guias?: SlideGuias | null;
  /** false = Alt u otro modificador: coords crudas, sin líneas. */
  enabled?: boolean;
};

/** Tope absoluto del origen (bloques grandes pueden colgarse del lienzo). */
export const CANVAS_OVERFLOW_ORIGIN_MIN = -50;
export const CANVAS_OVERFLOW_ORIGIN_MAX = 150;

/**
 * Mínimo del bbox (en % del lienzo) que debe intersectar 0–100.
 * Bloques ≤ 4 % (Hotspot, Tooltip, Popup) quedan enteros; los más grandes
 * pueden colgarse pero no desaparecer del viewer (`overflow: hidden`).
 */
export const MIN_VISIBLE_PCT = 4;

/** Origen en un eje: -50…150 ∩ “sigue habiendo `min(size, 4 %)` dentro de 0–100”. */
export function clampAxisOrigin(origin: number, size: number): number {
  const span = Number.isFinite(size) ? Math.max(size, 0) : 0;
  const visible = Math.min(span, MIN_VISIBLE_PCT);
  const min = Math.max(CANVAS_OVERFLOW_ORIGIN_MIN, visible - span);
  const max = Math.min(CANVAS_OVERFLOW_ORIGIN_MAX, 100 - visible);
  if (min > max) {
    return Math.max(CANVAS_OVERFLOW_ORIGIN_MIN, Math.min(CANVAS_OVERFLOW_ORIGIN_MAX, origin));
  }
  return Math.max(min, Math.min(max, origin));
}

export function clampDragCorner(
  x: number,
  y: number,
  ancho: number,
  alto: number,
): { x: number; y: number } {
  return {
    x: clampAxisOrigin(x, ancho),
    y: clampAxisOrigin(y, alto),
  };
}

export const NUDGE_STEP_PX = 1;
export const NUDGE_STEP_SHIFT_PX = 10;

/** Desplaza bloques en px virtuales (1 px X = 1/1280 del slide). */
export function applyNudgeToBlocks(
  bloques: Block[],
  indices: number[],
  dxPx: number,
  dyPx: number,
): Block[] {
  const dx = (dxPx / VIRTUAL_CANVAS_WIDTH) * 100;
  const dy = (dyPx / VIRTUAL_CANVAS_HEIGHT) * 100;
  const wanted = new Set(indices);
  return bloques.map((b, i) => {
    if (!wanted.has(i)) return b;
    const pos = getBlockPos(b);
    const { x, y } = clampDragCorner(pos.x + dx, pos.y + dy, pos.ancho, pos.alto);
    return withPosition(b, x, y);
  });
}

type SnapTarget = {
  value: number;
  priority: number;
  kind: 'align' | 'gap';
  edgeOnly?: boolean;
  lineAt?: number;
};

function pickAxisSnap(
  raw: number,
  size: number,
  targets: SnapTarget[],
  thresholdPct: number,
): { snap: number; guide: number; kind: 'align' | 'gap' } | null {
  let bestDist = thresholdPct + 1;
  let bestPriority = -1;
  let snap = raw;
  let guide: number | null = null;
  let kind: 'align' | 'gap' = 'align';

  for (const target of targets) {
    const candidates = target.edgeOnly
      ? [{ dist: Math.abs(raw - target.value), snap: target.value }]
      : [
          { dist: Math.abs(raw - target.value), snap: target.value },
          { dist: Math.abs(raw + size / 2 - target.value), snap: target.value - size / 2 },
          { dist: Math.abs(raw + size - target.value), snap: target.value - size },
        ];
    for (const c of candidates) {
      if (c.dist > thresholdPct) continue;
      const closer = c.dist < bestDist - 1e-9;
      const tiePrefer =
        Math.abs(c.dist - bestDist) <= 1e-9 && target.priority > bestPriority;
      if (closer || tiePrefer) {
        bestDist = c.dist;
        bestPriority = target.priority;
        snap = c.snap;
        guide = target.lineAt ?? target.value;
        kind = target.kind;
      }
    }
  }

  return guide === null ? null : { snap, guide, kind };
}

/**
 * Ajusta (x, y) al punto de snap más cercano y devuelve las guías a dibujar.
 * Targets: canvas, pares, huecos iguales, guías manuales.
 * Umbral: SNAP_THRESHOLD_PX en ambos ejes.
 * Gana el más cercano; en empate, guía > hueco > par > canvas.
 */
export function snapPositionToGuides(
  rawX: number,
  rawY: number,
  ancho: number,
  alto: number,
  draggedIndex: number | number[],
  peers: Block[],
  options?: SnapToGuidesOptions,
): { x: number; y: number; lines: SnapLine[] } {
  if (options?.enabled === false) {
    const { x, y } = clampDragCorner(rawX, rawY, ancho, alto);
    return { x, y, lines: [] };
  }

  const xTargets: SnapTarget[] = [
    { value: 0, priority: SNAP_PRIORITY.canvas, kind: 'align' },
    { value: 50, priority: SNAP_PRIORITY.canvas, kind: 'align' },
    { value: 100, priority: SNAP_PRIORITY.canvas, kind: 'align' },
  ];
  const yTargets: SnapTarget[] = [
    { value: 0, priority: SNAP_PRIORITY.canvas, kind: 'align' },
    { value: 50, priority: SNAP_PRIORITY.canvas, kind: 'align' },
    { value: 100, priority: SNAP_PRIORITY.canvas, kind: 'align' },
  ];

  const ignores = Array.isArray(draggedIndex) ? draggedIndex : [draggedIndex];
  const peerPositions: BlockPos[] = [];
  for (let i = 0; i < peers.length; i++) {
    if (ignores.includes(i)) continue;
    const p = getBlockPos(peers[i]);
    peerPositions.push(p);
    xTargets.push(
      { value: p.x, priority: SNAP_PRIORITY.peer, kind: 'align' },
      { value: p.x + p.ancho / 2, priority: SNAP_PRIORITY.peer, kind: 'align' },
      { value: p.x + p.ancho, priority: SNAP_PRIORITY.peer, kind: 'align' },
    );
    yTargets.push(
      { value: p.y, priority: SNAP_PRIORITY.peer, kind: 'align' },
      { value: p.y + p.alto / 2, priority: SNAP_PRIORITY.peer, kind: 'align' },
      { value: p.y + p.alto, priority: SNAP_PRIORITY.peer, kind: 'align' },
    );
  }

  const gaps = getEqualGapSnapTargets(rawX, rawY, ancho, alto, peerPositions);
  for (const g of gaps.x) {
    xTargets.push({
      value: g.snap,
      priority: SNAP_PRIORITY.gap,
      kind: 'gap',
      edgeOnly: true,
      lineAt: g.lineAt,
    });
  }
  for (const g of gaps.y) {
    yTargets.push({
      value: g.snap,
      priority: SNAP_PRIORITY.gap,
      kind: 'gap',
      edgeOnly: true,
      lineAt: g.lineAt,
    });
  }

  for (const xPx of options?.guias?.verticales ?? []) {
    xTargets.push({
      value: virtualXToPercent(xPx),
      priority: SNAP_PRIORITY.guide,
      kind: 'align',
    });
  }
  for (const yPx of options?.guias?.horizontales ?? []) {
    yTargets.push({
      value: virtualYToPercent(yPx),
      priority: SNAP_PRIORITY.guide,
      kind: 'align',
    });
  }

  const hitX = pickAxisSnap(rawX, ancho, xTargets, snapThresholdPct('x'));
  const hitY = pickAxisSnap(rawY, alto, yTargets, snapThresholdPct('y'));
  const { x, y } = clampDragCorner(hitX?.snap ?? rawX, hitY?.snap ?? rawY, ancho, alto);
  const lines: SnapLine[] = [];
  if (hitX) {
    lines.push({ orientation: 'vertical', position: hitX.guide, kind: hitX.kind });
  }
  if (hitY) {
    lines.push({ orientation: 'horizontal', position: hitY.guide, kind: hitY.kind });
  }
  return { x, y, lines };
}

function sameBlockOrigin(a: Block, b: Block): boolean {
  const pa = getBlockPos(a);
  const pb = getBlockPos(b);
  return pa.x === pb.x && pa.y === pb.y && pa.ancho === pb.ancho && pa.alto === pb.alto;
}

function sameLivePositions(prev: Block[] | null, next: Block[]): boolean {
  if (!prev || prev.length !== next.length) return false;
  for (let i = 0; i < next.length; i++) {
    if (!sameBlockOrigin(prev[i]!, next[i]!)) return false;
  }
  return true;
}

function sameSnapLines(a: SnapLine[], b: SnapLine[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i]!;
    const right = b[i]!;
    if (
      left.orientation !== right.orientation ||
      left.position !== right.position ||
      left.kind !== right.kind
    ) {
      return false;
    }
  }
  return true;
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
  /** true mientras Alt está pulsado — el resize del lienzo reutiliza este flag. */
  snapSuppressedRef: RefObject<boolean>;
}

export function useBlockDrag({
  canvasRef,
  slide,
  onSave,
}: BlockDragOptions): BlockDragResult {
  const [draggingId,  setDraggingId]  = useState<string | null>(null);
  const [liveBloques, setLiveBloques] = useState<Block[] | null>(null);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const snapSuppressedRef = useRef(false);

  useEffect(() => {
    const sync = (e: KeyboardEvent) => {
      snapSuppressedRef.current = e.altKey;
    };
    const clear = () => {
      snapSuppressedRef.current = false;
    };
    window.addEventListener('keydown', sync);
    window.addEventListener('keyup', sync);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', sync);
      window.removeEventListener('keyup', sync);
      window.removeEventListener('blur', clear);
    };
  }, []);

  /** Original x, y of the dragged block recorded at drag-start. */
  const originRef = useRef<{ x: number; y: number } | null>(null);
  /** Última posición con snap (persistir al soltar). */
  const pendingDragPosRef = useRef<{ x: number; y: number } | null>(null);
  /** Original positions of all selected blocks at drag start. */
  const selectedOriginsRef = useRef<Record<string, { x: number; y: number }> | null>(null);

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
    selectedOriginsRef.current = null;
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
    const { ancho, alto } = getBlockPos(block);
    const { x, y } = clampDragCorner(
      originRef.current.x + dx,
      originRef.current.y + dy,
      ancho,
      alto,
    );
    return { newX: x, newY: y };
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

    // Multi-select handling: check if dragged block is in the selected set
    const selectedIds = (event.active.data.current?.selectedBlockIds as string[]) ?? [];
    const isDraggingSelectedGroup = selectedIds.length > 1 && selectedIds.includes(id);

    if (isDraggingSelectedGroup) {
      const origins: Record<string, { x: number; y: number }> = {};
      selectedIds.forEach((sid) => {
        const b = bloques[Number(sid)];
        if (b) {
          origins[sid] = getBlockPos(b);
        }
      });
      selectedOriginsRef.current = origins;
    } else {
      selectedOriginsRef.current = null;
    }

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

    // If dragging a group, skip all selected indices from snap guide alignment peers
    const snapIgnores = selectedOriginsRef.current
      ? Object.keys(selectedOriginsRef.current).map(Number)
      : index;

    const { x: snapX, y: snapY, lines } = snapPositionToGuides(
      res.newX,
      res.newY,
      ancho,
      alto,
      snapIgnores,
      bloques,
      { guias: slide?.guias, enabled: !snapSuppressedRef.current },
    );
    pendingDragPosRef.current = { x: snapX, y: snapY };
    setSnapLines((prev) => (sameSnapLines(prev, lines) ? prev : lines));

    setLiveBloques((prev) => {
      const next = applyLiveDragPositions({
        bloques: prev ?? bloques,
        draggedIndex: index,
        snapX,
        snapY,
        origin: originRef.current!,
        groupOrigins: selectedOriginsRef.current,
      });
      return sameLivePositions(prev, next) ? prev : next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const id      = String(event.active.id);
    const index   = Number(id);
    const bloques = slide?.bloques ?? [];
    const rect    = getRect();

    if (rect && originRef.current) {
      const pending = pendingDragPosRef.current;
      let finalX = originRef.current.x;
      let finalY = originRef.current.y;

      if (pending) {
        finalX = pending.x;
        finalY = pending.y;
      } else {
        const res = deltaToPos(index, event.delta, rect);
        if (res) {
          finalX = res.newX;
          finalY = res.newY;
        }
      }

      onSave(
        applyLiveDragPositions({
          bloques,
          draggedIndex: index,
          snapX: finalX,
          snapY: finalY,
          origin: originRef.current,
          groupOrigins: selectedOriginsRef.current,
        }),
      );
    }

    setSnapLines([]);
    setDraggingId(null);
    setLiveBloques(null);
    originRef.current = null;
    pendingDragPosRef.current = null;
    selectedOriginsRef.current = null;
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
    snapSuppressedRef,
  };
}
