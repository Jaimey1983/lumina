// ─── Clipping mask sobre grupo (composición) ─────────────────────────────────
// Transformaciones puras para envolver una selección de bloques en un
// `clip-group` con `contenido.tipo === 'composicion'` y para revertirlo.
//
// Contrato de coordenadas:
//   - Bloques sueltos: `x/y/ancho/alto` en % del lienzo virtual (0–100).
//   - Hijos de una composición: mismos campos, pero en % del bbox del
//     `clip-group` contenedor (0–100). `rebaseIntoBox` / `rebaseOutOfBox`
//     convierten entre ambos espacios usando el contrato canónico
//     `getBlockPos` → `withRect` (no reimplementa fallbacks por `tipo`).

import type { Block, ClipGroupBlock, ClipShape } from '@/types/slide.types';
import {
  getBlockPos,
  withRect,
  type BlockPos,
} from '@/hooks/use-block-drag';
import { createDefaultClipGroupBlock } from '@/lib/clip-path';

const EPSILON = 0.0001;

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/** bbox (en % de lienzo) que cubre todos los `positions`. */
export function unionBBoxPct(positions: BlockPos[]): BlockPos {
  if (positions.length === 0) {
    return { x: 0, y: 0, ancho: 100, alto: 100 };
  }
  const minX = Math.min(...positions.map((p) => p.x));
  const minY = Math.min(...positions.map((p) => p.y));
  const maxX = Math.max(...positions.map((p) => p.x + p.ancho));
  const maxY = Math.max(...positions.map((p) => p.y + p.alto));
  const x = clampPct(minX);
  const y = clampPct(minY);
  return {
    x,
    y,
    ancho: Math.max(EPSILON, clampPct(maxX) - x),
    alto: Math.max(EPSILON, clampPct(maxY) - y),
  };
}

/** Bloque de lienzo → bloque hijo de composición (coords relativas al `box`). */
export function rebaseIntoBox(block: Block, box: BlockPos): Block {
  const p = getBlockPos(block);
  const w = box.ancho || EPSILON;
  const h = box.alto || EPSILON;
  return withRect(
    block,
    ((p.x - box.x) / w) * 100,
    ((p.y - box.y) / h) * 100,
    (p.ancho / w) * 100,
    (p.alto / h) * 100,
  );
}

/** Bloque hijo de composición → bloque de lienzo (coords absolutas). */
export function rebaseOutOfBox(block: Block, box: BlockPos): Block {
  const p = getBlockPos(block);
  return withRect(
    block,
    clampPct(box.x + (p.x / 100) * box.ancho),
    clampPct(box.y + (p.y / 100) * box.alto),
    (p.ancho / 100) * box.ancho,
    (p.alto / 100) * box.alto,
  );
}

export interface GroupIntoClipMaskResult {
  next: Block[];
  /** Índice del `clip-group` resultante en `next`. */
  newIndex: number;
  block: ClipGroupBlock;
}

/**
 * Envuelve los `indices` de `bloques` en un `clip-group` de composición.
 * Los bloques originales se sacan del array y pasan a `contenido.bloques`
 * (mismo orden relativo). El `clip-group` se inserta en la posición del
 * primer índice seleccionado. Devuelve `null` si hay < 2 bloques válidos.
 */
export function groupBlocksIntoClipMask(
  bloques: Block[],
  indices: number[],
  clipShape: ClipShape,
): GroupIntoClipMaskResult | null {
  const valid = Array.from(new Set(indices))
    .filter((i) => Number.isInteger(i) && i >= 0 && i < bloques.length)
    .sort((a, b) => a - b);
  if (valid.length < 2) return null;

  const selected = valid.map((i) => bloques[i]!);
  const box = unionBBoxPct(selected.map((b) => getBlockPos(b)));
  const hijos = selected.map((b) => rebaseIntoBox(b, box));

  const block: ClipGroupBlock = {
    ...createDefaultClipGroupBlock(clipShape, { tipo: 'composicion', bloques: hijos }),
    // El contorno recorta la composición combinada: sin borde ni sombra por defecto.
    borde: undefined,
    x: box.x,
    y: box.y,
    ancho: box.ancho,
    alto: box.alto,
    zIndex: Math.max(
      1,
      ...selected.map((b) => (b as { zIndex?: number }).zIndex ?? 1),
    ),
  };

  const insertAt = valid[0]!;
  const removed = new Set(valid);
  const next: Block[] = [];
  bloques.forEach((b, i) => {
    if (i === insertAt) next.push(block);
    if (!removed.has(i)) next.push(b);
  });

  return { next, newIndex: next.indexOf(block), block };
}

/**
 * Revierte un `clip-group` de composición: reemplaza el bloque en `index` por
 * sus hijos re-basados a coordenadas de lienzo, en el mismo lugar del array.
 * Devuelve `null` si el bloque no es una composición.
 */
export function ungroupClipMask(bloques: Block[], index: number): Block[] | null {
  const block = bloques[index];
  if (
    !block ||
    block.tipo !== 'clip-group' ||
    block.contenido.tipo !== 'composicion'
  ) {
    return null;
  }
  const box = getBlockPos(block);
  const hijos = block.contenido.bloques.map((h) => rebaseOutOfBox(h, box));
  const next = [...bloques];
  next.splice(index, 1, ...hijos);
  return next;
}
