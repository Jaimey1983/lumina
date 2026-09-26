import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from './virtual-canvas';

/**
 * G-scale.3 — conversión de unidades de viewport a píxeles del lienzo virtual.
 *
 * El contenido del slide vive en 1280×720 y escala con un único `transform: scale()`
 * (G-scale.0–2). `vw`/`vh` miden el viewport del navegador, no el lienzo virtual →
 * tipografía y placeholders se desalinean entre superficies. Estos helpers evalúan
 * `vw`/`vh` como si el viewport fuera el canvas virtual y devuelven `px` fijos (o
 * `clamp` equivalente) que luego escalan de forma uniforme con el slide.
 */

const DEFAULT_ROOT_FONT_PX = 16;

/** Píxeles virtuales equivalentes a `vw` % del ancho 1280. */
export function virtualPxFromVw(
  vw: number,
  canvasWidth = VIRTUAL_CANVAS_WIDTH,
): number {
  return (vw / 100) * canvasWidth;
}

/** Píxeles virtuales equivalentes a `vh` % del alto 720. */
export function virtualPxFromVh(
  vh: number,
  canvasHeight = VIRTUAL_CANVAS_HEIGHT,
): number {
  return (vh / 100) * canvasHeight;
}

export function remToVirtualPx(rem: number, rootPx = DEFAULT_ROOT_FONT_PX): number {
  return rem * rootPx;
}

export interface VirtualClampPxInput {
  minPx: number;
  maxPx: number;
  /** Término central de un `clamp` que usaba `vw`. */
  vw?: number;
  /** Término central de un `clamp` que usaba `vh`. */
  vh?: number;
}

/**
 * Evalúa `clamp(minPx, {vw|vh}, maxPx)` en el lienzo virtual 1280×720.
 * Redondea a décimas de px para valores CSS estables.
 */
export function virtualClampPx(input: VirtualClampPxInput): number {
  const { minPx, maxPx, vw, vh } = input;
  let mid: number;
  if (vw !== undefined) mid = virtualPxFromVw(vw);
  else if (vh !== undefined) mid = virtualPxFromVh(vh);
  else throw new Error('virtualClampPx: indica vw o vh');
  const clamped = Math.min(maxPx, Math.max(minPx, mid));
  return Math.round(clamped * 10) / 10;
}

export function virtualClampCss(input: VirtualClampPxInput): string {
  return `${virtualClampPx(input)}px`;
}

/** Equivalente a `min(vh% del alto virtual 720, capPx)`. */
export function virtualMinVhCapPx(vh: number, capPx: number): number {
  return Math.round(Math.min(virtualPxFromVh(vh), capPx) * 10) / 10;
}

/**
 * Equivalente a `clamp(minRem rem, pct% del ancho virtual, maxRem rem)` en el lienzo
 * 1280×720 (asume `rem` = 16px).
 */
export function virtualClampPercentRemPx(
  minRem: number,
  widthPercent: number,
  maxRem: number,
  rootPx = DEFAULT_ROOT_FONT_PX,
): number {
  const minPx = remToVirtualPx(minRem, rootPx);
  const maxPx = remToVirtualPx(maxRem, rootPx);
  /** % del ancho del lienzo virtual ≈ el mismo número en `vw` sobre 1280. */
  return virtualClampPx({ minPx, maxPx, vw: widthPercent });
}

// ─── Tokens G-scale.3 (sustituyen clamps con vw/vh en element-kit) ─────────

/** `render-texto.tsx` — placeholder de bloque vacío en editor. */
export const TEXT_EMPTY_PLACEHOLDER_FONT_PX = virtualClampPx({
  minPx: 10,
  vw: 1.6,
  maxPx: 13,
});

/** `click-reveal` — título del trigger (card / input). */
export const CLICK_REVEAL_TRIGGER_TITLE_FONT_PX = virtualClampPx({
  minPx: remToVirtualPx(0.6875),
  vh: 1.6,
  maxPx: remToVirtualPx(0.9375),
});

/** `click-reveal` — etiqueta inferior del trigger. */
export const CLICK_REVEAL_TRIGGER_LABEL_FONT_PX = virtualClampPx({
  minPx: remToVirtualPx(0.875),
  vh: 2.5,
  maxPx: remToVirtualPx(1.25),
});

/** `timeline` — número destacado en bloque proyecto. */
export const TIMELINE_PROYECTO_NUM_FONT_PX = virtualClampPx({
  minPx: remToVirtualPx(1.75),
  vw: 4,
  maxPx: remToVirtualPx(2.5),
});

/** `click-reveal` — padding vertical del trigger (era `clamp(0.5rem, 2%, 1rem)`). */
export const CLICK_REVEAL_TRIGGER_PAD_Y_PX = virtualClampPercentRemPx(0.5, 2, 1);

/** `click-reveal` — padding horizontal del trigger (era `clamp(0.375rem, 1.5%, 0.75rem)`). */
export const CLICK_REVEAL_TRIGGER_PAD_X_PX = virtualClampPercentRemPx(0.375, 1.5, 0.75);
