// Caja orientada (OBB) → AABB en % del lienzo. La rotación se hace en px
// virtuales porque el lienzo no es isótropo (1280×720): rotar directamente en
// coordenadas % distorsiona el ángulo. Etapa G, G0 — cierra el defecto de que
// `getBlockPos` devuelve el AABB sin rotar mientras el render sí aplica
// `rotate()`.

import {
  VIRTUAL_CANVAS_WIDTH,
  VIRTUAL_CANVAS_HEIGHT,
} from './virtual-canvas.js';

export interface AlignRect {
  /** left en % del lienzo (0–100). */
  x: number;
  /** top en % del lienzo. */
  y: number;
  /** ancho en % del lienzo. */
  ancho: number;
  /** alto en % del lienzo. */
  alto: number;
}

/**
 * AABB (en % del lienzo) que envuelve `rect` rotado `rotacionDeg` grados sobre
 * su centro. `rotacionDeg` 0/undefined → devuelve una copia de `rect`.
 */
export function aabbOfRotatedRect(
  rect: AlignRect,
  rotacionDeg?: number,
): AlignRect {
  const deg = ((rotacionDeg ?? 0) % 360 + 360) % 360;
  if (deg === 0) return { ...rect };

  const w = (rect.ancho / 100) * VIRTUAL_CANVAS_WIDTH;
  const h = (rect.alto / 100) * VIRTUAL_CANVAS_HEIGHT;
  const cx = (rect.x / 100) * VIRTUAL_CANVAS_WIDTH + w / 2;
  const cy = (rect.y / 100) * VIRTUAL_CANVAS_HEIGHT + h / 2;

  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const bw = w * cos + h * sin;
  const bh = w * sin + h * cos;

  return {
    x: ((cx - bw / 2) / VIRTUAL_CANVAS_WIDTH) * 100,
    y: ((cy - bh / 2) / VIRTUAL_CANVAS_HEIGHT) * 100,
    ancho: (bw / VIRTUAL_CANVAS_WIDTH) * 100,
    alto: (bh / VIRTUAL_CANVAS_HEIGHT) * 100,
  };
}

/** Centro (en % del lienzo) de un rect. */
export function rectCenter(rect: AlignRect): { cx: number; cy: number } {
  return { cx: rect.x + rect.ancho / 2, cy: rect.y + rect.alto / 2 };
}
