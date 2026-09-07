import type { TextBlock } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';

export function createDefaultTextBlock(extra?: Partial<TextBlock>): TextBlock {
  const fb = BLOCK_FALLBACKS.text;
  return {
    tipo: 'texto',
    contenido: '',
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
    ...extra,
  };
}
