/**
 * Contraste de texto (WCAG 2.x) — aviso de autor en el panel de propiedades.
 * Informa, no bloquea.
 */

import type { Background } from '@lumina/types/slide';

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** `#rgb` / `#rrggbb` / `rgb(...)` / `rgba(...)` → `[r,g,b]` 0–255, o `null`. */
export function parseColor(input?: string): [number, number, number] | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();

  const hex = s.replace(/^#/, '');
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return [
      parseInt(hex[0]! + hex[0]!, 16),
      parseInt(hex[1]! + hex[1]!, 16),
      parseInt(hex[2]! + hex[2]!, 16),
    ];
  }
  if (/^[0-9a-f]{6}$/.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
}

function channelLuminance(c: number): number {
  const s = clamp01(c / 255);
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa WCAG (0 negro – 1 blanco). */
export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb;
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** Ratio de contraste WCAG entre dos colores (1–21). `null` si alguno no parsea. */
export function contrastRatio(fg?: string, bg?: string): number | null {
  const a = parseColor(fg);
  const b = parseColor(bg);
  if (!a || !b) return null;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastVerdict {
  ratio: number;
  /** Umbral aplicado (3 texto grande, 4.5 normal). */
  umbral: 3 | 4.5;
  /** Cumple AA. */
  passes: boolean;
  /** Se consideró "texto grande" (≥24px, o ≥19px en negrita). */
  large: boolean;
}

export function isLargeText(fontPx: number, bold: boolean): boolean {
  return fontPx >= 24 || (bold && fontPx >= 19);
}

export function contrastVerdict(
  fg: string | undefined,
  bg: string | undefined,
  fontPx: number,
  bold: boolean,
): ContrastVerdict | null {
  const ratio = contrastRatio(fg, bg);
  if (ratio === null) return null;
  const large = isLargeText(fontPx, bold);
  const umbral = large ? 3 : 4.5;
  return { ratio, umbral, passes: ratio >= umbral, large };
}

/**
 * Color sólido representativo de un fondo de slide para el chequeo de contraste:
 * color plano, o primer stop de un gradiente. `undefined` para imagen (no se evalúa).
 */
export function backgroundColorForContrast(fondo?: Background | null): string | undefined {
  if (!fondo || typeof fondo !== 'object') return undefined;
  if (fondo.tipo === 'color') return fondo.valor;
  if (fondo.tipo === 'gradiente') {
    const stops = fondo.stops;
    if (Array.isArray(stops) && stops.length > 0 && stops[0]?.color) {
      return stops[0].color;
    }
    return fondo.inicio;
  }
  return undefined;
}
