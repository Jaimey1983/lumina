import type { CSSProperties } from 'react';
import type { RichMark } from '@lumina/types/rich-text';

/** `#rrggbb` + alpha 0–100 → `rgba(...)`; deja pasar otros formatos tal cual. */
export function hexToRgba(hex: string, alpha: number): string {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const a = Math.min(1, Math.max(0, alpha / 100));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Estilo CSS de una marca de rango. Fuente única para el renderer React
 * (`render-texto.tsx`) y el serializador a HTML (`html.ts`).
 * `link`, `term`, `spoiler` y `lang` no producen estilo aquí (los maneja el
 * renderer con su propia envoltura semántica).
 */
export function richMarkToStyle(mark: RichMark): CSSProperties {
  switch (mark.t) {
    case 'bold':
      return { fontWeight: 'bold' };
    case 'italic':
      return { fontStyle: 'italic' };
    case 'underline':
      return { textDecoration: 'underline' };
    case 'strike':
      return { textDecoration: 'line-through' };
    case 'code':
      return {
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        fontSize: '0.9em',
        padding: '0.05em 0.3em',
        borderRadius: '4px',
        background: 'rgba(15, 23, 42, 0.06)',
      };
    case 'color':
      return { color: mark.value };
    case 'highlight':
      return {
        backgroundColor:
          mark.alpha !== undefined ? hexToRgba(mark.value, mark.alpha) : mark.value,
        borderRadius: '3px',
        padding: '0 0.15em',
      };
    case 'size':
      return { fontSize: `${mark.px}px` };
    case 'font':
      return { fontFamily: mark.family };
    case 'tracking':
      return { letterSpacing: `${mark.px}px` };
    case 'script':
      return {
        verticalAlign: mark.value === 'sup' ? 'super' : 'sub',
        fontSize: '0.75em',
      };
    default:
      return {};
  }
}

/** Combina los estilos de varias marcas (el orden del array = precedencia creciente). */
export function richMarksToStyle(marks: RichMark[] | undefined): CSSProperties {
  if (!marks || marks.length === 0) return {};
  return marks.reduce<CSSProperties>(
    (acc, m) => ({ ...acc, ...richMarkToStyle(m) }),
    {},
  );
}
