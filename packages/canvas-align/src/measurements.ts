// Cotas de distancia (a bordes del lienzo, a vecinos, y hueco igual entre 3+
// bloques) — portado de la parte pura del useMemo de
// lumina-frontend/src/components/editor/spacing-indicators.tsx (Etapa G, G0).
// Sin JSX: devuelve descriptores de línea. Los colores literales se conservan
// para la paridad; G1 (<AlignmentOverlay>) los reemplaza por tokens semánticos.

import type { BlockPos } from '@lumina/editor-shared/block-pos';

import {
  SPACING_EDGE_MAX_PX,
  SPACING_EQUAL_TOLERANCE_PX,
  SPACING_NEIGHBOR_MAX_PX,
  overlapsHorizontally,
  overlapsVertically,
  type RectPx,
} from './spacing.js';

export interface Measurement {
  id: string;
  type: 'horizontal' | 'vertical';
  minX_pct: number;
  maxX_pct: number;
  minY_pct: number;
  maxY_pct: number;
  distance: number;
  /** 'canvas' = a borde del lienzo · 'neighbor' = al vecino más cercano · 'equal' = hueco igual (ritmo). */
  role: 'canvas' | 'neighbor' | 'equal';
  color: string;
}

export interface ComputeMeasurementsInput {
  /** Posición del bloque activo, en % del lienzo. */
  activePos: BlockPos;
  /** Posiciones de los demás bloques, en % (ya sin el activo). */
  peerPositions: BlockPos[];
  canvasWidth: number;
  canvasHeight: number;
}

const COLOR_CANVAS = '#2563EB';
const COLOR_NEIGHBOR = '#2563EB';
const COLOR_EQUAL = '#10B981';

/**
 * Igual que `SpacingIndicators` pero puro. Devuelve `[]` si no hay nada que medir.
 */
export function computeMeasurements({
  activePos,
  peerPositions,
  canvasWidth,
  canvasHeight,
}: ComputeMeasurementsInput): Measurement[] {
  const activePx: RectPx = {
    x: (activePos.x / 100) * canvasWidth,
    y: (activePos.y / 100) * canvasHeight,
    w: (activePos.ancho / 100) * canvasWidth,
    h: (activePos.alto / 100) * canvasHeight,
  };

  const lines: Measurement[] = [];

  // ─── 1. Bordes del lienzo ───────────────────────────────────────────────────
  const toTop = activePx.y;
  if (toTop > 0 && toTop < SPACING_EDGE_MAX_PX) {
    lines.push({
      id: 'canvas-top',
      type: 'vertical',
      minX_pct: activePos.x + activePos.ancho / 2,
      maxX_pct: activePos.x + activePos.ancho / 2,
      minY_pct: 0,
      maxY_pct: activePos.y,
      distance: toTop,
      role: 'canvas',
      color: COLOR_CANVAS,
    });
  }

  const toBottom = canvasHeight - (activePx.y + activePx.h);
  if (toBottom > 0 && toBottom < SPACING_EDGE_MAX_PX) {
    lines.push({
      id: 'canvas-bottom',
      type: 'vertical',
      minX_pct: activePos.x + activePos.ancho / 2,
      maxX_pct: activePos.x + activePos.ancho / 2,
      minY_pct: activePos.y + activePos.alto,
      maxY_pct: 100,
      distance: toBottom,
      role: 'canvas',
      color: COLOR_CANVAS,
    });
  }

  const toLeft = activePx.x;
  if (toLeft > 0 && toLeft < SPACING_EDGE_MAX_PX) {
    lines.push({
      id: 'canvas-left',
      type: 'horizontal',
      minX_pct: 0,
      maxX_pct: activePos.x,
      minY_pct: activePos.y + activePos.alto / 2,
      maxY_pct: activePos.y + activePos.alto / 2,
      distance: toLeft,
      role: 'canvas',
      color: COLOR_CANVAS,
    });
  }

  const toRight = canvasWidth - (activePx.x + activePx.w);
  if (toRight > 0 && toRight < SPACING_EDGE_MAX_PX) {
    lines.push({
      id: 'canvas-right',
      type: 'horizontal',
      minX_pct: activePos.x + activePos.ancho,
      maxX_pct: 100,
      minY_pct: activePos.y + activePos.alto / 2,
      maxY_pct: activePos.y + activePos.alto / 2,
      distance: toRight,
      role: 'canvas',
      color: COLOR_CANVAS,
    });
  }

  // ─── 2. Otros bloques → px ─────────────────────────────────────────────────
  const others = peerPositions.map((pos, idx) => ({
    key: `block-${idx}`,
    pos,
    px: {
      x: (pos.x / 100) * canvasWidth,
      y: (pos.y / 100) * canvasHeight,
      w: (pos.ancho / 100) * canvasWidth,
      h: (pos.alto / 100) * canvasHeight,
    } as RectPx,
  }));

  // ─── 3. Vecino más cercano en 4 direcciones ────────────────────────────────
  type Peer = (typeof others)[number];
  let closestLeft: Peer | null = null;
  let minLeftDist = Infinity;
  let closestRight: Peer | null = null;
  let minRightDist = Infinity;
  let closestTop: Peer | null = null;
  let minTopDist = Infinity;
  let closestBottom: Peer | null = null;
  let minBottomDist = Infinity;

  for (const ob of others) {
    if (overlapsVertically(activePx, ob.px)) {
      if (ob.px.x + ob.px.w <= activePx.x) {
        const dist = activePx.x - (ob.px.x + ob.px.w);
        if (dist >= 0 && dist < SPACING_NEIGHBOR_MAX_PX && dist < minLeftDist) {
          minLeftDist = dist;
          closestLeft = ob;
        }
      }
      if (ob.px.x >= activePx.x + activePx.w) {
        const dist = ob.px.x - (activePx.x + activePx.w);
        if (dist >= 0 && dist < SPACING_NEIGHBOR_MAX_PX && dist < minRightDist) {
          minRightDist = dist;
          closestRight = ob;
        }
      }
    }
    if (overlapsHorizontally(activePx, ob.px)) {
      if (ob.px.y + ob.px.h <= activePx.y) {
        const dist = activePx.y - (ob.px.y + ob.px.h);
        if (dist >= 0 && dist < SPACING_NEIGHBOR_MAX_PX && dist < minTopDist) {
          minTopDist = dist;
          closestTop = ob;
        }
      }
      if (ob.px.y >= activePx.y + activePx.h) {
        const dist = ob.px.y - (activePx.y + activePx.h);
        if (dist >= 0 && dist < SPACING_NEIGHBOR_MAX_PX && dist < minBottomDist) {
          minBottomDist = dist;
          closestBottom = ob;
        }
      }
    }
  }

  const hEqualDrawn = new Set<string>();
  const vEqualDrawn = new Set<string>();

  // ─── 4. Espaciado igual horizontal (3+ bloques) ───────────────────────────
  const ACTIVE = '__active__';
  const hAligned = [
    { key: ACTIVE, pos: activePos, px: activePx },
    ...others
      .filter((ob) => overlapsVertically(activePx, ob.px))
      .map((ob) => ({ key: ob.key, pos: ob.pos, px: ob.px })),
  ].sort((a, b) => a.px.x - b.px.x);

  let hGroup: number[] | null = null;
  const activeIdxH = hAligned.findIndex((it) => it.key === ACTIVE);
  if (activeIdxH !== -1 && hAligned.length >= 3) {
    for (let len = hAligned.length; len >= 3 && !hGroup; len--) {
      for (let i = 0; i <= hAligned.length - len; i++) {
        const j = i + len - 1;
        if (activeIdxH < i || activeIdxH > j) continue;
        const gaps: number[] = [];
        let valid = true;
        for (let k = i; k < j; k++) {
          const gap = hAligned[k + 1].px.x - (hAligned[k].px.x + hAligned[k].px.w);
          if (gap <= 0 || gap >= SPACING_NEIGHBOR_MAX_PX) {
            valid = false;
            break;
          }
          gaps.push(gap);
        }
        if (valid && Math.max(...gaps) - Math.min(...gaps) <= SPACING_EQUAL_TOLERANCE_PX) {
          hGroup = [];
          for (let k = i; k <= j; k++) hGroup.push(k);
          break;
        }
      }
    }
  }

  if (hGroup) {
    for (let k = 0; k < hGroup.length - 1; k++) {
      const a = hAligned[hGroup[k]];
      const b = hAligned[hGroup[k + 1]];
      const gap = b.px.x - (a.px.x + a.px.w);
      const yStart = Math.max(a.px.y, b.px.y);
      const yEnd = Math.min(a.px.y + a.px.h, b.px.y + b.px.h);
      const yLinePct = ((yStart + yEnd) / 2 / canvasHeight) * 100;
      lines.push({
        id: `eq-spacing-h-${k}`,
        type: 'horizontal',
        minX_pct: a.pos.x + a.pos.ancho,
        maxX_pct: b.pos.x,
        minY_pct: yLinePct,
        maxY_pct: yLinePct,
        distance: gap,
        role: 'equal',
        color: COLOR_EQUAL,
      });
      if (a.key === ACTIVE) hEqualDrawn.add(b.key);
      else if (b.key === ACTIVE) hEqualDrawn.add(a.key);
    }
  }

  // ─── 5. Espaciado igual vertical (3+ bloques) ─────────────────────────────
  const vAligned = [
    { key: ACTIVE, pos: activePos, px: activePx },
    ...others
      .filter((ob) => overlapsHorizontally(activePx, ob.px))
      .map((ob) => ({ key: ob.key, pos: ob.pos, px: ob.px })),
  ].sort((a, b) => a.px.y - b.px.y);

  let vGroup: number[] | null = null;
  const activeIdxV = vAligned.findIndex((it) => it.key === ACTIVE);
  if (activeIdxV !== -1 && vAligned.length >= 3) {
    for (let len = vAligned.length; len >= 3 && !vGroup; len--) {
      for (let i = 0; i <= vAligned.length - len; i++) {
        const j = i + len - 1;
        if (activeIdxV < i || activeIdxV > j) continue;
        const gaps: number[] = [];
        let valid = true;
        for (let k = i; k < j; k++) {
          const gap = vAligned[k + 1].px.y - (vAligned[k].px.y + vAligned[k].px.h);
          if (gap <= 0 || gap >= SPACING_NEIGHBOR_MAX_PX) {
            valid = false;
            break;
          }
          gaps.push(gap);
        }
        if (valid && Math.max(...gaps) - Math.min(...gaps) <= SPACING_EQUAL_TOLERANCE_PX) {
          vGroup = [];
          for (let k = i; k <= j; k++) vGroup.push(k);
          break;
        }
      }
    }
  }

  if (vGroup) {
    for (let k = 0; k < vGroup.length - 1; k++) {
      const a = vAligned[vGroup[k]];
      const b = vAligned[vGroup[k + 1]];
      const gap = b.px.y - (a.px.y + a.px.h);
      const xStart = Math.max(a.px.x, b.px.x);
      const xEnd = Math.min(a.px.x + a.px.w, b.px.x + b.px.w);
      const xLinePct = ((xStart + xEnd) / 2 / canvasWidth) * 100;
      lines.push({
        id: `eq-spacing-v-${k}`,
        type: 'vertical',
        minX_pct: xLinePct,
        maxX_pct: xLinePct,
        minY_pct: a.pos.y + a.pos.alto,
        maxY_pct: b.pos.y,
        distance: gap,
        role: 'equal',
        color: COLOR_EQUAL,
      });
      if (a.key === ACTIVE) vEqualDrawn.add(b.key);
      else if (b.key === ACTIVE) vEqualDrawn.add(a.key);
    }
  }

  // ─── 6. Vecino más cercano (si no está ya en verde) ───────────────────────
  if (closestLeft && !hEqualDrawn.has(closestLeft.key)) {
    const yStart = Math.max(activePx.y, closestLeft.px.y);
    const yEnd = Math.min(activePx.y + activePx.h, closestLeft.px.y + closestLeft.px.h);
    const yLinePct = ((yStart + yEnd) / 2 / canvasHeight) * 100;
    lines.push({
      id: 'neighbor-left',
      type: 'horizontal',
      minX_pct: closestLeft.pos.x + closestLeft.pos.ancho,
      maxX_pct: activePos.x,
      minY_pct: yLinePct,
      maxY_pct: yLinePct,
      distance: activePx.x - (closestLeft.px.x + closestLeft.px.w),
      role: 'neighbor',
      color: COLOR_NEIGHBOR,
    });
  }

  if (closestRight && !hEqualDrawn.has(closestRight.key)) {
    const yStart = Math.max(activePx.y, closestRight.px.y);
    const yEnd = Math.min(activePx.y + activePx.h, closestRight.px.y + closestRight.px.h);
    const yLinePct = ((yStart + yEnd) / 2 / canvasHeight) * 100;
    lines.push({
      id: 'neighbor-right',
      type: 'horizontal',
      minX_pct: activePos.x + activePos.ancho,
      maxX_pct: closestRight.pos.x,
      minY_pct: yLinePct,
      maxY_pct: yLinePct,
      distance: closestRight.px.x - (activePx.x + activePx.w),
      role: 'neighbor',
      color: COLOR_NEIGHBOR,
    });
  }

  if (closestTop && !vEqualDrawn.has(closestTop.key)) {
    const xStart = Math.max(activePx.x, closestTop.px.x);
    const xEnd = Math.min(activePx.x + activePx.w, closestTop.px.x + closestTop.px.w);
    const xLinePct = ((xStart + xEnd) / 2 / canvasWidth) * 100;
    lines.push({
      id: 'neighbor-top',
      type: 'vertical',
      minX_pct: xLinePct,
      maxX_pct: xLinePct,
      minY_pct: closestTop.pos.y + closestTop.pos.alto,
      maxY_pct: activePos.y,
      distance: activePx.y - (closestTop.px.y + closestTop.px.h),
      role: 'neighbor',
      color: COLOR_NEIGHBOR,
    });
  }

  if (closestBottom && !vEqualDrawn.has(closestBottom.key)) {
    const xStart = Math.max(activePx.x, closestBottom.px.x);
    const xEnd = Math.min(activePx.x + activePx.w, closestBottom.px.x + closestBottom.px.w);
    const xLinePct = ((xStart + xEnd) / 2 / canvasWidth) * 100;
    lines.push({
      id: 'neighbor-bottom',
      type: 'vertical',
      minX_pct: xLinePct,
      maxX_pct: xLinePct,
      minY_pct: activePos.y + activePos.alto,
      maxY_pct: closestBottom.pos.y,
      distance: closestBottom.px.y - (activePx.y + activePx.h),
      role: 'neighbor',
      color: COLOR_NEIGHBOR,
    });
  }

  return lines;
}
