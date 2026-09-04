import { describe, expect, it } from 'vitest';

import { getBlockPos, isBlockCanvasPositionable, withRect } from '@/hooks/use-block-drag';
import { BLOCK_FALLBACKS } from '@/types/slide.types';

import { makeImageBlockFromUrl } from './image-block';

describe('makeImageBlockFromUrl', () => {
  it('nace en % del lienzo con el fallback canónico', () => {
    const block = makeImageBlockFromUrl('https://example.com/foto.jpg', 'Montaña');
    const fb = BLOCK_FALLBACKS.image;
    expect(block.tipo).toBe('imagen');
    expect(block.url).toBe('https://example.com/foto.jpg');
    expect(block.alt).toBe('Montaña');
    expect(block.id).toEqual(expect.any(String));
    expect(getBlockPos(block)).toEqual(fb);
    expect(typeof block.ancho).toBe('number');
    expect(typeof block.alto).toBe('number');
    expect(isBlockCanvasPositionable(block)).toBe(true);
  });

  it('withRect persiste el bbox en el bloque', () => {
    const next = withRect(makeImageBlockFromUrl('https://example.com/a.png'), 10, 20, 40, 30);
    expect(getBlockPos(next)).toEqual({ x: 10, y: 20, ancho: 40, alto: 30 });
  });
});
