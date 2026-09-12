// Matemática pura del popover «Organizar» (Etapa G, G4): match size, espaciado
// exacto, tidy up (huecos iguales por bordes) y alinear a objeto clave. Sin
// dependencias de React ni de `Block` — opera sobre posiciones en % del
// lienzo (`BlockPos`) y devuelve un `Map<id, RectPatch>` con lo que cambia.
// `alignment-toolbar.tsx` convierte cada patch a un `Block` con
// `withRect`/`clampDragCorner` (contrato del editor: leer → transformar →
// clamp → persistir).

import type { BlockPos } from '@lumina/editor-shared/block-pos';

export interface OrganizeItem {
  id: string;
  pos: BlockPos;
}

export interface RectPatch {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export type MatchSizeAxis = 'width' | 'height' | 'both';
export type OrganizeAxis = 'horizontal' | 'vertical';
export type AlignToKeyAction =
  | 'align_left'
  | 'align_center_h'
  | 'align_right'
  | 'align_top'
  | 'align_center_v'
  | 'align_bottom';

/** Iguala ancho/alto/ambos de la selección al del objeto clave. No lo mueve. */
export function computeMatchSize(
  items: OrganizeItem[],
  keyId: string,
  axis: MatchSizeAxis,
): Map<string, RectPatch> {
  const key = items.find((item) => item.id === keyId);
  const result = new Map<string, RectPatch>();
  if (!key) return result;
  for (const item of items) {
    if (item.id === keyId) continue;
    const ancho = axis === 'height' ? item.pos.ancho : key.pos.ancho;
    const alto = axis === 'width' ? item.pos.alto : key.pos.alto;
    result.set(item.id, { x: item.pos.x, y: item.pos.y, ancho, alto });
  }
  return result;
}

/**
 * Fija el hueco (borde a borde) entre bloques consecutivos, ordenados por
 * posición en el eje dado. El primero de la fila queda fijo; el resto se
 * desplaza en cadena. `gapPct` va en % del lienzo (ya convertido desde px).
 */
export function computeExactSpacing(
  items: OrganizeItem[],
  axis: OrganizeAxis,
  gapPct: number,
): Map<string, RectPatch> {
  const result = new Map<string, RectPatch>();
  if (items.length < 2 || !Number.isFinite(gapPct)) return result;
  const sorted = [...items].sort((a, b) =>
    axis === 'horizontal' ? a.pos.x - b.pos.x : a.pos.y - b.pos.y,
  );
  let cursor =
    axis === 'horizontal'
      ? sorted[0]!.pos.x + sorted[0]!.pos.ancho
      : sorted[0]!.pos.y + sorted[0]!.pos.alto;
  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i]!;
    if (axis === 'horizontal') {
      const x = cursor + gapPct;
      result.set(item.id, { x, y: item.pos.y, ancho: item.pos.ancho, alto: item.pos.alto });
      cursor = x + item.pos.ancho;
    } else {
      const y = cursor + gapPct;
      result.set(item.id, { x: item.pos.x, y, ancho: item.pos.ancho, alto: item.pos.alto });
      cursor = y + item.pos.alto;
    }
  }
  return result;
}

/**
 * «Tidy up»: primero y último de la fila quedan fijos; los del medio se
 * redistribuyen para que el hueco borde-a-borde entre consecutivos sea
 * idéntico (a diferencia de `distribute_h/v`, que reparte por centros —
 * con anchos distintos los huecos no quedan iguales).
 */
export function computeTidy(
  items: OrganizeItem[],
  axis: OrganizeAxis,
): Map<string, RectPatch> {
  const result = new Map<string, RectPatch>();
  if (items.length < 3) return result;
  const sorted = [...items].sort((a, b) =>
    axis === 'horizontal' ? a.pos.x - b.pos.x : a.pos.y - b.pos.y,
  );
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const totalSpan =
    axis === 'horizontal'
      ? last.pos.x + last.pos.ancho - first.pos.x
      : last.pos.y + last.pos.alto - first.pos.y;
  const sumSizes = sorted.reduce(
    (acc, item) => acc + (axis === 'horizontal' ? item.pos.ancho : item.pos.alto),
    0,
  );
  const gap = (totalSpan - sumSizes) / (sorted.length - 1);
  // Los bloques no entran sin solaparse en el espacio entre el primero y el
  // último — no hay un "tidy" seguro; no-op en vez de crear un layout roto.
  if (!Number.isFinite(gap) || gap < 0) return result;

  let cursor = axis === 'horizontal' ? first.pos.x : first.pos.y;
  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]!;
    const size = axis === 'horizontal' ? item.pos.ancho : item.pos.alto;
    if (i > 0 && i < sorted.length - 1) {
      if (axis === 'horizontal') {
        result.set(item.id, { x: cursor, y: item.pos.y, ancho: item.pos.ancho, alto: item.pos.alto });
      } else {
        result.set(item.id, { x: item.pos.x, y: cursor, ancho: item.pos.ancho, alto: item.pos.alto });
      }
    }
    cursor += size + gap;
  }
  return result;
}

/** Igual que align_left/center_h/.../bottom pero contra el objeto clave, no el bbox de la selección. */
export function computeAlignToKey(
  items: OrganizeItem[],
  keyId: string,
  action: AlignToKeyAction,
): Map<string, RectPatch> {
  const key = items.find((item) => item.id === keyId);
  const result = new Map<string, RectPatch>();
  if (!key) return result;
  for (const item of items) {
    if (item.id === keyId) continue;
    let x = item.pos.x;
    let y = item.pos.y;
    switch (action) {
      case 'align_left':
        x = key.pos.x;
        break;
      case 'align_center_h':
        x = key.pos.x + (key.pos.ancho - item.pos.ancho) / 2;
        break;
      case 'align_right':
        x = key.pos.x + key.pos.ancho - item.pos.ancho;
        break;
      case 'align_top':
        y = key.pos.y;
        break;
      case 'align_center_v':
        y = key.pos.y + (key.pos.alto - item.pos.alto) / 2;
        break;
      case 'align_bottom':
        y = key.pos.y + key.pos.alto - item.pos.alto;
        break;
    }
    result.set(item.id, { x, y, ancho: item.pos.ancho, alto: item.pos.alto });
  }
  return result;
}
