import { BLOCK_FALLBACKS } from '@lumina/types/slide';

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

/** Ancho de referencia en px virtual para un bloque con `ancho` en % del slide. */
export function virtualBlockWidthPx(anchoPct: number): number {
  return (anchoPct / 100) * VIRTUAL_CANVAS_WIDTH;
}

/**
 * `clamp(minRem, pct% del contenedor, maxRem)` con contenedor de ancho fijo en px
 * virtual (p. ej. caja del trigger popup).
 */
export function virtualClampContainerPercentRemPx(
  minRem: number,
  containerWidthPx: number,
  widthPercent: number,
  maxRem: number,
  rootPx = DEFAULT_ROOT_FONT_PX,
): number {
  const minPx = remToVirtualPx(minRem, rootPx);
  const maxPx = remToVirtualPx(maxRem, rootPx);
  const midPx = (widthPercent / 100) * containerWidthPx;
  const clamped = Math.min(maxPx, Math.max(minPx, midPx));
  return Math.round(clamped * 10) / 10;
}

/**
 * `clamp(minRem, Ncqi, maxRem)` evaluado con ancho de contenedor en px virtual
 * (`1cqi` = 1% del inline-size del contenedor).
 */
export function virtualClampCqiRemPx(
  minRem: number,
  cqi: number,
  maxRem: number,
  containerWidthPx: number,
  rootPx = DEFAULT_ROOT_FONT_PX,
): number {
  return virtualClampContainerPercentRemPx(minRem, containerWidthPx, cqi, maxRem, rootPx);
}

/** `clamp(minRem, Ncqmin, maxRem)` con `1cqmin` = 1% del lado menor del contenedor (px virtual). */
export function virtualClampCqminRemPx(
  minRem: number,
  cqmin: number,
  maxRem: number,
  containerMinSizePx: number,
  rootPx = DEFAULT_ROOT_FONT_PX,
): number {
  const minPx = remToVirtualPx(minRem, rootPx);
  const maxPx = remToVirtualPx(maxRem, rootPx);
  const midPx = (cqmin / 100) * containerMinSizePx;
  const clamped = Math.min(maxPx, Math.max(minPx, midPx));
  return Math.round(clamped * 10) / 10;
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

const POPUP_TRIGGER_REF_WIDTH_PX = virtualBlockWidthPx(BLOCK_FALLBACKS.popup.ancho);
const CONTADOR_REF_WIDTH_PX = virtualBlockWidthPx(BLOCK_FALLBACKS.contador.ancho);

/** `popup` — texto del botón trigger in-block (`clamp(0.65rem, 35%, 0.875rem)`). */
export const POPUP_TRIGGER_BUTTON_FONT_PX = virtualClampContainerPercentRemPx(
  0.65,
  POPUP_TRIGGER_REF_WIDTH_PX,
  35,
  0.875,
);

/** `contador` — etiqueta (`clamp(0.55rem, 8cqi, 0.8rem)` @ ancho ref. del bloque). */
export const CONTADOR_ETIQUETA_FONT_PX = virtualClampCqiRemPx(
  0.55,
  8,
  0.8,
  CONTADOR_REF_WIDTH_PX,
);

/** `contador` — dígitos (`clamp(1.05rem, 18cqi, 2.4rem)`). */
export const CONTADOR_DIGITS_FONT_PX = virtualClampCqiRemPx(
  1.05,
  18,
  2.4,
  CONTADOR_REF_WIDTH_PX,
);

/** `grafico-data-dialog` — altura máx. del modal (era `70vh`). */
export const GRAFICO_DATA_DIALOG_MAX_HEIGHT_PX = Math.round(virtualPxFromVh(70) * 10) / 10;

/** Tarjeta memoria: lado menor de referencia (~celda en grid sobre widget 90% del slide). */
export const MEMORIA_CARD_REF_MIN_PX = Math.round(virtualBlockWidthPx(BLOCK_FALLBACKS.timeline.ancho) / 8);

const TIMELINE_REF_WIDTH_PX = virtualBlockWidthPx(BLOCK_FALLBACKS.timeline.ancho);

/** `timeline` — padding etapa (`clamp` con % del ancho del widget). */
export const TIMELINE_STAGE_PAD_Y_PX = virtualClampContainerPercentRemPx(
  0.25,
  TIMELINE_REF_WIDTH_PX,
  0.75,
  0.625,
);
export const TIMELINE_STAGE_PAD_X_PX = virtualClampContainerPercentRemPx(
  0.75,
  TIMELINE_REF_WIDTH_PX,
  3,
  1.25,
);

/** `memoria` — texto de carta (`clamp(0.75rem, 32cqmin, 1.75rem)`). */
export const MEMORIA_CARD_TEXT_FONT_PX = virtualClampCqminRemPx(
  0.75,
  32,
  1.75,
  MEMORIA_CARD_REF_MIN_PX,
);

/** `memoria` — símbolo (`clamp(1rem, 42cqmin, 3rem)`). */
export const MEMORIA_CARD_SYMBOL_FONT_PX = virtualClampCqminRemPx(
  1,
  42,
  3,
  MEMORIA_CARD_REF_MIN_PX,
);
