import type { Block } from '@/types/slide.types';
import { MIN_VISIBLE_PCT } from '@/hooks/use-block-drag';

/** Mínimo global ancho/alto en % durante resize (bloques estándar). */
export const DEFAULT_BLOCK_RESIZE_MIN_DIM = 5;

/**
 * Mínimo de resize por tipo de bloque (M1).
 * Pins 4 % y popup ~3.75 % no deben forzarse a 5 % en el primer resize.
 */
export function getBlockResizeMinDim(tipo: Block['tipo']): number {
  switch (tipo) {
    case 'hotspot':
    case 'tooltip':
      return MIN_VISIBLE_PCT;
    case 'popup':
      return 2;
    case 'progreso':
      return 2;
    case 'separador':
      return 1;
    default:
      return DEFAULT_BLOCK_RESIZE_MIN_DIM;
  }
}
