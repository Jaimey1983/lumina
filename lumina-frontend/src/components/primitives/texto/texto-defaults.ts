import type { TextBlock } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';

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
