// Clamp del contrato del editor de canvas — portado verbatim de
// lumina-frontend/src/hooks/use-block-drag.ts (Etapa G, G0). El frontend
// conserva su copia hasta G2; la paridad la prueba clamp.spec.ts.

/** Tope absoluto del origen (bloques grandes pueden colgarse del lienzo). */
export const CANVAS_OVERFLOW_ORIGIN_MIN = -50;
export const CANVAS_OVERFLOW_ORIGIN_MAX = 150;

/**
 * Mínimo del bbox (en % del lienzo) que debe intersectar 0–100.
 * Bloques ≤ 4 % (Hotspot, Tooltip, Popup) quedan enteros; los más grandes
 * pueden colgarse pero no desaparecer del viewer (`overflow: hidden`).
 */
export const MIN_VISIBLE_PCT = 4;

/** Origen en un eje: -50…150 ∩ "sigue habiendo `min(size, 4 %)` dentro de 0–100". */
export function clampAxisOrigin(origin: number, size: number): number {
  const span = Number.isFinite(size) ? Math.max(size, 0) : 0;
  const visible = Math.min(span, MIN_VISIBLE_PCT);
  const min = Math.max(CANVAS_OVERFLOW_ORIGIN_MIN, visible - span);
  const max = Math.min(CANVAS_OVERFLOW_ORIGIN_MAX, 100 - visible);
  if (min > max) {
    return Math.max(
      CANVAS_OVERFLOW_ORIGIN_MIN,
      Math.min(CANVAS_OVERFLOW_ORIGIN_MAX, origin),
    );
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
