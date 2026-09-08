import type { ImageBlock } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';

export function createDefaultImageBlock(extra?: Partial<ImageBlock>): ImageBlock {
  const fb = BLOCK_FALLBACKS.image;
  return {
    tipo: 'imagen',
    url: '',
    ajuste: 'contener',
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
    ...extra,
  };
}
