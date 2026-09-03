import { describe, expect, it } from 'vitest';

import { getBlockPos, isBlockCanvasPositionable, withRect } from '@/hooks/use-block-drag';
import { BLOCK_FALLBACKS } from '@/types/slide.types';

import { createDefaultSeparadorBlock } from './divider-defaults';

describe('createDefaultSeparadorBlock', () => {
  it('nace en % del lienzo, no en px', () => {
    const block = createDefaultSeparadorBlock();
    const fb = BLOCK_FALLBACKS.separador;
    expect(block.tipo).toBe('separador');
    expect(getBlockPos(block)).toEqual(fb);
    expect(block.ancho).toBeLessThanOrEqual(100);
    expect(block.alto).toBeLessThanOrEqual(10);
    expect(isBlockCanvasPositionable(block)).toBe(true);
  });

  it('withRect persiste el bbox en el bloque', () => {
    const next = withRect(createDefaultSeparadorBlock(), 20, 40, 60, 4);
    expect(getBlockPos(next)).toEqual({ x: 20, y: 40, ancho: 60, alto: 4 });
  });
});
