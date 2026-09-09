/**
 * Escala tipográfica de encabezados (Fase 0 del motor de texto enriquecido).
 *
 * `TextBlock.nivel` (H1–H6) hoy solo cambia la etiqueta HTML; el *preflight* de
 * Tailwind resetea `h1..h6` y `RenderText` nunca derivaba tamaño/peso del nivel.
 * Esta tabla es la fuente única de la jerarquía visual de encabezados; el
 * ajuste manual del panel (tamaño, negrita, tracking, interlineado) siempre gana.
 */

import type { CSSProperties } from 'react';
import type { HeadingLevel } from '@lumina/types/slide';

export interface HeadingScaleEntry {
  /** px virtuales del slide 1280×720. */
  sizePx: number;
  /** 400–900. Con el modelo actual (`negrita` booleano) se mapea `≥600 → bold`. */
  weight: number;
  lineHeight: number;
  /** letter-spacing en px. */
  trackingPx: number;
}

export const HEADING_SCALE: Record<HeadingLevel, HeadingScaleEntry> = {
  1: { sizePx: 40, weight: 700, lineHeight: 1.1, trackingPx: -0.5 },
  2: { sizePx: 32, weight: 700, lineHeight: 1.15, trackingPx: -0.25 },
  3: { sizePx: 26, weight: 600, lineHeight: 1.2, trackingPx: 0 },
  4: { sizePx: 22, weight: 600, lineHeight: 1.25, trackingPx: 0 },
  5: { sizePx: 18, weight: 600, lineHeight: 1.3, trackingPx: 0 },
  6: { sizePx: 16, weight: 600, lineHeight: 1.35, trackingPx: 0.4 },
};

/** Estilo de cuerpo — lo aplica el botón "P" del inspector para volver de un nivel. */
export const BODY_TEXT_SCALE: HeadingScaleEntry = {
  sizePx: 18,
  weight: 400,
  lineHeight: 1.45,
  trackingPx: 0,
};

/**
 * Entrada de la escala para un nivel, con overrides opcionales del tema del
 * slide (Fase 5A los pasará; hasta entonces se ignora el parámetro).
 */
export function headingScaleFor(
  nivel: HeadingLevel,
  overrides?: Partial<HeadingScaleEntry>,
): HeadingScaleEntry {
  return { ...HEADING_SCALE[nivel], ...overrides };
}

/** Los campos de `TextBlock` que, si vienen fijados, ganan sobre la escala. */
export interface HeadingExplicitFields {
  tamanoFuente?: string;
  negrita?: boolean;
  espaciadoLetras?: number;
  interlineado?: number;
}

function hasExplicitSize(v?: string): boolean {
  return typeof v === 'string' && v.trim() !== '';
}

/**
 * CSS derivado del nivel de encabezado **solo para los campos que el bloque no
 * fija explícitamente**. Devuelve `{}` cuando no hay `nivel`.
 */
export function headingFallbackCss(
  nivel: HeadingLevel | undefined,
  explicit: HeadingExplicitFields,
  overrides?: Partial<HeadingScaleEntry>,
): CSSProperties {
  if (!nivel) return {};
  const s = headingScaleFor(nivel, overrides);
  const css: CSSProperties = {};
  if (!hasExplicitSize(explicit.tamanoFuente)) css.fontSize = `${s.sizePx}px`;
  if (explicit.negrita === undefined) css.fontWeight = s.weight;
  if (explicit.espaciadoLetras === undefined) css.letterSpacing = `${s.trackingPx}px`;
  if (explicit.interlineado === undefined) css.lineHeight = s.lineHeight;
  return css;
}

/** Tamaño efectivo en px de un bloque de texto, considerando la escala del nivel. */
export function effectiveFontSizePx(
  tamanoFuente: string | undefined,
  nivel: HeadingLevel | undefined,
): number {
  if (hasExplicitSize(tamanoFuente)) {
    const m = String(tamanoFuente).match(/(\d+(?:\.\d+)?)/);
    if (m) {
      const n = parseFloat(m[1]!);
      return /rem\s*$/i.test(String(tamanoFuente).trim()) ? n * 16 : n;
    }
  }
  if (nivel) return HEADING_SCALE[nivel].sizePx;
  return 0;
}

/**
 * Patch de `TypographyValue` para el botón "Nivel" del inspector: además del
 * `nivel` semántico, aplica tamaño / peso / interlineado / tracking de la escala.
 * `nivel === undefined` (botón "P") vuelve al cuerpo.
 */
export function typographyPatchFromHeadingLevel(nivel: HeadingLevel | undefined): {
  fontSize: number;
  fontWeight: 'bold' | 'normal';
  lineHeight: number;
  letterSpacing: number;
} {
  const s = nivel ? HEADING_SCALE[nivel] : BODY_TEXT_SCALE;
  return {
    fontSize: s.sizePx,
    fontWeight: s.weight >= 600 ? 'bold' : 'normal',
    lineHeight: s.lineHeight,
    letterSpacing: s.trackingPx,
  };
}
