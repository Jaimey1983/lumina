// Snap a la grilla — portado verbatim de lumina-frontend/src/lib/canvas-grid.ts
// (parte pura; los helpers del modelo `SlideGrilla` — normalize/parse/toggle —
// se quedan en el frontend). Paridad en grid.spec.ts.

import {
  VIRTUAL_CANVAS_WIDTH,
  VIRTUAL_CANVAS_HEIGHT,
} from './virtual-canvas.js';

/** Snap de un eje al grid más cercano (origen, centro o borde del bloque). */
export function snapAxisToGridPercent(
  raw: number,
  size: number,
  gridSizePx: number,
  axis: 'x' | 'y',
  thresholdPct: number,
): { snap: number; guide: number } | null {
  const span = axis === 'x' ? VIRTUAL_CANVAS_WIDTH : VIRTUAL_CANVAS_HEIGHT;
  const stepPct = (gridSizePx / span) * 100;
  if (stepPct <= 0 || !Number.isFinite(stepPct)) return null;

  let bestDist = thresholdPct + 1;
  let best: { snap: number; guide: number } | null = null;

  const edges: Array<{ value: number; mode: 'origin' | 'center' | 'end' }> = [
    { value: raw, mode: 'origin' },
    { value: raw + size / 2, mode: 'center' },
    { value: raw + size, mode: 'end' },
  ];

  for (const { value, mode } of edges) {
    const guide = Math.round(value / stepPct) * stepPct;
    const snap =
      mode === 'origin'
        ? guide
        : mode === 'center'
          ? guide - size / 2
          : guide - size;
    const dist = Math.abs(raw - snap);
    if (dist <= thresholdPct && dist < bestDist) {
      bestDist = dist;
      best = { snap, guide };
    }
  }

  return best;
}

/** Paso de la grilla en % del lienzo para un tamaño de celda dado. */
export function gridStepPercent(gridSizePx: number, axis: 'x' | 'y'): number {
  const span = axis === 'x' ? VIRTUAL_CANVAS_WIDTH : VIRTUAL_CANVAS_HEIGHT;
  return (gridSizePx / span) * 100;
}
