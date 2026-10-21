// ─── Formas de nodo del diagrama ↔ formas de `@lumina/drawing` (W10) ─────────────
// Única tabla de equivalencias: la usan la conversión a escena (`diagrama-escena.ts`) y el SVG exportado
// del diagrama clásico (`diagrama-export.ts`), que dibuja con `trazadoForma` en vez de su propia geometría.

import type { TipoForma } from '@lumina/drawing';
import type { DiagramaNodoForma } from '@lumina/types/slide';

export interface FormaEquivalente {
  forma: TipoForma;
  parametros?: Record<string, number>;
  /** Radio de esquinas en unidades (o, si es `'mitad'`, la mitad del alto: forma de píldora). */
  radio?: number | 'mitad';
}

/** Forma del dibujo que equivale a cada forma de nodo del diagrama. */
export const EQUIVALENCIAS: Record<DiagramaNodoForma, FormaEquivalente> = {
  rect: { forma: 'rectangulo' },
  rounded: { forma: 'rectangulo', radio: 8 },
  pill: { forma: 'rectangulo', radio: 'mitad' },
  chip: { forma: 'rectangulo', radio: 'mitad' },
  root: { forma: 'rectangulo', radio: 12 },
  'card-icon': { forma: 'rectangulo', radio: 8 },
  diamond: { forma: 'rombo' },
  parallelogram: { forma: 'paralelogramo', parametros: { inclinacion: 0.12 } },
  ellipse: { forma: 'elipse' },
  circle: { forma: 'circulo' },
  hexagon: { forma: 'hexagono', parametros: { inclinacion: 0.16 } },
  trapezoid: { forma: 'trapecio', parametros: { inclinacion: 0.04 } },
  'inverted-trapezoid': { forma: 'trapecio-invertido', parametros: { inclinacion: 0.04 } },
  triangle: { forma: 'triangulo' },
};


/** Radio de esquinas en unidades para una caja de ese alto (la píldora usa la mitad del alto). */
export function radioDeForma(eq: FormaEquivalente, alto: number): number {
  return eq.radio === 'mitad' ? alto / 2 : (eq.radio ?? 0);
}
