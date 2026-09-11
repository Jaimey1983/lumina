// Imán de posición — portado de lumina-frontend/src/hooks/use-block-drag.ts
// (solo la parte de snapping; la sesión de drag dnd-kit y los writers de bloque
// se quedan en el frontend hasta G2). Añade `zoom` al umbral (default 1 →
// idéntico a hoy). Paridad en snap.spec.ts.

import type { Block, SlideGuias } from '@lumina/types/slide';
import { getBlockPos, type BlockPos } from '@lumina/editor-shared/block-pos';

import {
  VIRTUAL_CANVAS_WIDTH,
  VIRTUAL_CANVAS_HEIGHT,
  virtualXToPercent,
  virtualYToPercent,
} from './virtual-canvas.js';
import { clampDragCorner } from './clamp.js';
import { getEqualGapSnapTargets } from './spacing.js';
import { snapAxisToGridPercent } from './grid.js';

/** Alcance del imán en px del canvas virtual 1280×720 (igual en X y en Y). */
export const SNAP_THRESHOLD_PX = 8;
const SNAP_PRIORITY = { canvas: 1, peer: 2, gap: 3, guide: 4 } as const;

/**
 * Umbral del imán en % del eje. `zoom` > 1 lo estrecha para mantener un umbral
 * constante en px de pantalla (un px de pantalla = 1/zoom px virtuales).
 */
export function snapThresholdPct(axis: 'x' | 'y', zoom = 1): number {
  const span = axis === 'x' ? VIRTUAL_CANVAS_WIDTH : VIRTUAL_CANVAS_HEIGHT;
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  return (SNAP_THRESHOLD_PX / span) * 100 / z;
}

export type SnapLine = {
  orientation: 'horizontal' | 'vertical';
  /** Porcentaje 0–100 en el eje correspondiente (igual que `left`/`top` en CSS). */
  position: number;
  kind?: 'align' | 'gap' | 'grid';
};

export function snapLineColor(line: SnapLine): string {
  if (line.kind === 'gap') return '#10B981';
  if (line.kind === 'grid') return '#94A3B8';
  return '#F97316';
}

export type SnapToGuidesOptions = {
  guias?: SlideGuias | null;
  /** false = Alt u otro modificador: coords crudas, sin líneas. */
  enabled?: boolean;
  /** Zoom del lienzo (1 = 100 %). Estrecha el umbral para que sea constante en px de pantalla. */
  zoom?: number;
};

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
): { snap: number; guide: number; kind: 'align' | 'gap' | 'grid' } | null {
  let bestDist = thresholdPct + 1;
  let bestPriority = -1;
  let snap = raw;
  let guide: number | null = null;
  let kind: 'align' | 'gap' | 'grid' = 'align';

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
 * Umbral: SNAP_THRESHOLD_PX en ambos ejes (÷ zoom).
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

  const zoom = options?.zoom ?? 1;

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

  const hitX = pickAxisSnap(rawX, ancho, xTargets, snapThresholdPct('x', zoom));
  const hitY = pickAxisSnap(rawY, alto, yTargets, snapThresholdPct('y', zoom));

  let finalHitX = hitX;
  let finalHitY = hitY;

  const grilla = options?.guias?.grilla;
  if (grilla?.activa && grilla.tamanoPx > 0) {
    const gridHitX = snapAxisToGridPercent(
      rawX,
      ancho,
      grilla.tamanoPx,
      'x',
      snapThresholdPct('x', zoom),
    );
    const gridHitY = snapAxisToGridPercent(
      rawY,
      alto,
      grilla.tamanoPx,
      'y',
      snapThresholdPct('y', zoom),
    );

    if (gridHitX) {
      const existingDist = hitX ? Math.abs(rawX - hitX.snap) : Infinity;
      const gridDist = Math.abs(rawX - gridHitX.snap);
      if (!hitX || gridDist < existingDist - 1e-9) {
        finalHitX = { snap: gridHitX.snap, guide: gridHitX.guide, kind: 'grid' };
      }
    }
    if (gridHitY) {
      const existingDist = hitY ? Math.abs(rawY - hitY.snap) : Infinity;
      const gridDist = Math.abs(rawY - gridHitY.snap);
      if (!hitY || gridDist < existingDist - 1e-9) {
        finalHitY = { snap: gridHitY.snap, guide: gridHitY.guide, kind: 'grid' };
      }
    }
  }

  const { x, y } = clampDragCorner(
    finalHitX?.snap ?? rawX,
    finalHitY?.snap ?? rawY,
    ancho,
    alto,
  );
  const lines: SnapLine[] = [];
  if (finalHitX) {
    lines.push({
      orientation: 'vertical',
      position: finalHitX.guide,
      kind: finalHitX.kind,
    });
  }
  if (finalHitY) {
    lines.push({
      orientation: 'horizontal',
      position: finalHitY.guide,
      kind: finalHitY.kind,
    });
  }
  return { x, y, lines };
}
