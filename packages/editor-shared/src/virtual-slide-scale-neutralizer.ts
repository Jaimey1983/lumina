import type { CSSProperties } from 'react';

import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from './virtual-canvas';

/** Bloques cuya librería de canvas mide con APIs sensibles al `scale()` ancestro. */
export const VIRTUAL_SLIDE_SCALE_NEUTRALIZED_BLOCK_TYPES = new Set([
  'grafico',
  'diagrama',
  'clip-group',
]);

export interface VirtualBlockRectPct {
  ancho: number;
  alto: number;
}

/**
 * G-scale.4 — neutraliza el `transform: scale(S)` de `<VirtualSlideSurface>` para
 * subárboles que mezclan `clientWidth` y `getBoundingClientRect()` (ApexCharts,
 * @xyflow, SVG clip-path). Misma matemática que el antiguo `viewerFillScale`.
 */
export function virtualSlideScaleNeutralizerStyle(
  coords: VirtualBlockRectPct,
  surfaceScale: number,
): CSSProperties | undefined {
  if (!Number.isFinite(surfaceScale) || surfaceScale <= 0 || Math.abs(surfaceScale - 1) < 1e-4) {
    return undefined;
  }
  return {
    width: (coords.ancho / 100) * VIRTUAL_CANVAS_WIDTH * surfaceScale,
    height: (coords.alto / 100) * VIRTUAL_CANVAS_HEIGHT * surfaceScale,
    transform: `scale(${1 / surfaceScale})`,
    transformOrigin: 'top left',
  };
}

export function blockNeedsVirtualSlideScaleNeutralizer(
  blockTipo: string,
  surfaceScale: number,
): boolean {
  return (
    VIRTUAL_SLIDE_SCALE_NEUTRALIZED_BLOCK_TYPES.has(blockTipo) &&
    Number.isFinite(surfaceScale) &&
    surfaceScale > 0 &&
    Math.abs(surfaceScale - 1) >= 1e-4
  );
}
