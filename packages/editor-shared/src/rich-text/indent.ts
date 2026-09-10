import type { CSSProperties } from 'react';

/** Paso de sangría (bloque, primera línea y francesa) en rem. */
export const TEXT_INDENT_STEP = 1.5;

/**
 * Número finito desde attr TipTap / JSON. TipTap a veces entrega el valor
 * como string (`"1.5"`) al serializar `getJSON()`; si solo aceptamos
 * `typeof === 'number'` la sangría se pierde al salir del editor.
 */
export function asFiniteNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * CSS de `text-indent`. Valor positivo = sangría de primera línea.
 * Valor negativo = sangría francesa: el resto de líneas se corre con
 * `padding-inline-start` para que la primera quede al margen del párrafo
 * y no se recorte fuera de la caja.
 *
 * Contrato de render: este estilo vive en el BLOQUE (`p`/`h*`). 
 * `white-space: pre-wrap` NO puede ir en el mismo elemento — WebKit
 * ignora `text-indent` en ese caso. El editor ya lo cumple (pre-wrap en
 * `.lumina-rich-editor`); el viewer debe envolver los runs, no el bloque.
 */
export function textIndentStyle(textIndent?: number): CSSProperties {
  if (textIndent === undefined || !Number.isFinite(textIndent) || textIndent === 0) {
    return {};
  }
  const out: CSSProperties = { textIndent: `${textIndent}rem` };
  if (textIndent < 0) out.paddingInlineStart = `${Math.abs(textIndent)}rem`;
  return out;
}

export function isFirstLineIndent(textIndent?: number): boolean {
  return typeof textIndent === 'number' && Number.isFinite(textIndent) && textIndent > 0;
}

export function isHangingIndent(textIndent?: number): boolean {
  return typeof textIndent === 'number' && Number.isFinite(textIndent) && textIndent < 0;
}
