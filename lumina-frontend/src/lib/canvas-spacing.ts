import {
  VIRTUAL_CANVAS_HEIGHT,
  VIRTUAL_CANVAS_WIDTH,
} from '@/lib/canvas-guides';

export interface SpacingPos {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Vecino / hueco igual: no medir ni imantar más allá de esto (px virtuales). */
export const SPACING_NEIGHBOR_MAX_PX = 200;
/** Diferencia máxima entre huecos para pintarlos en verde. */
export const SPACING_EQUAL_TOLERANCE_PX = 4;
/** Distancia a borde del canvas a partir de la cual no se pinta la medida. */
export const SPACING_EDGE_MAX_PX = 80;

export interface RectPx {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EqualGapTarget {
  /** left/top del bloque arrastrado, en % del lienzo. */
  snap: number;
  /** Punto medio del hueco, en %, para la línea verde. */
  lineAt: number;
}

export function overlapsVertically(a: RectPx, b: RectPx): boolean {
  return a.y < b.y + b.h && a.y + a.h > b.y;
}

export function overlapsHorizontally(a: RectPx, b: RectPx): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x;
}

export function blockPosToPx(pos: SpacingPos): RectPx {
  return {
    x: (pos.x / 100) * VIRTUAL_CANVAS_WIDTH,
    y: (pos.y / 100) * VIRTUAL_CANVAS_HEIGHT,
    w: (pos.ancho / 100) * VIRTUAL_CANVAS_WIDTH,
    h: (pos.alto / 100) * VIRTUAL_CANVAS_HEIGHT,
  };
}

function pushUnique(out: EqualGapTarget[], next: EqualGapTarget) {
  if (out.some((e) => Math.abs(e.snap - next.snap) < 1e-6)) return;
  out.push(next);
}

function collectAxisGaps(
  others: RectPx[],
  axis: 'x' | 'y',
): number[] {
  const size = axis === 'x' ? 'w' : 'h';
  const sorted = [...others].sort((a, b) => a[axis] - b[axis]);
  const gaps: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1][axis] - (sorted[i][axis] + sorted[i][size]);
    if (gap > 0 && gap < SPACING_NEIGHBOR_MAX_PX) gaps.push(gap);
  }
  return gaps;
}

/**
 * Posiciones que igualan un hueco ya existente (ritmo) o centran el bloque
 * entre dos vecinos. Coordenadas en %; huecos medidos en px virtuales.
 */
export function getEqualGapSnapTargets(
  rawX: number,
  rawY: number,
  ancho: number,
  alto: number,
  peerPositions: SpacingPos[],
): { x: EqualGapTarget[]; y: EqualGapTarget[] } {
  const dragged = blockPosToPx({ x: rawX, y: rawY, ancho, alto });
  const others = peerPositions.map(blockPosToPx);

  const x: EqualGapTarget[] = [];
  const y: EqualGapTarget[] = [];

  const hPeers = others.filter((o) => overlapsVertically(dragged, o));
  const hGaps = collectAxisGaps(hPeers, 'x');
  for (const o of hPeers) {
    for (const gap of hGaps) {
      pushUnique(x, {
        snap: ((o.x + o.w + gap) / VIRTUAL_CANVAS_WIDTH) * 100,
        lineAt: ((o.x + o.w + gap / 2) / VIRTUAL_CANVAS_WIDTH) * 100,
      });
      pushUnique(x, {
        snap: ((o.x - dragged.w - gap) / VIRTUAL_CANVAS_WIDTH) * 100,
        lineAt: ((o.x - gap / 2) / VIRTUAL_CANVAS_WIDTH) * 100,
      });
    }
  }
  const hSorted = [...hPeers].sort((a, b) => a.x - b.x);
  for (let i = 0; i < hSorted.length; i++) {
    for (let j = i + 1; j < hSorted.length; j++) {
      const L = hSorted[i];
      const R = hSorted[j];
      const space = R.x - (L.x + L.w);
      const gap = (space - dragged.w) / 2;
      if (gap <= 0 || gap >= SPACING_NEIGHBOR_MAX_PX) continue;
      pushUnique(x, {
        snap: ((L.x + L.w + gap) / VIRTUAL_CANVAS_WIDTH) * 100,
        lineAt: ((L.x + L.w + gap / 2) / VIRTUAL_CANVAS_WIDTH) * 100,
      });
    }
  }

  const vPeers = others.filter((o) => overlapsHorizontally(dragged, o));
  const vGaps = collectAxisGaps(vPeers, 'y');
  for (const o of vPeers) {
    for (const gap of vGaps) {
      pushUnique(y, {
        snap: ((o.y + o.h + gap) / VIRTUAL_CANVAS_HEIGHT) * 100,
        lineAt: ((o.y + o.h + gap / 2) / VIRTUAL_CANVAS_HEIGHT) * 100,
      });
      pushUnique(y, {
        snap: ((o.y - dragged.h - gap) / VIRTUAL_CANVAS_HEIGHT) * 100,
        lineAt: ((o.y - gap / 2) / VIRTUAL_CANVAS_HEIGHT) * 100,
      });
    }
  }
  const vSorted = [...vPeers].sort((a, b) => a.y - b.y);
  for (let i = 0; i < vSorted.length; i++) {
    for (let j = i + 1; j < vSorted.length; j++) {
      const T = vSorted[i];
      const B = vSorted[j];
      const space = B.y - (T.y + T.h);
      const gap = (space - dragged.h) / 2;
      if (gap <= 0 || gap >= SPACING_NEIGHBOR_MAX_PX) continue;
      pushUnique(y, {
        snap: ((T.y + T.h + gap) / VIRTUAL_CANVAS_HEIGHT) * 100,
        lineAt: ((T.y + T.h + gap / 2) / VIRTUAL_CANVAS_HEIGHT) * 100,
      });
    }
  }

  return { x, y };
}
