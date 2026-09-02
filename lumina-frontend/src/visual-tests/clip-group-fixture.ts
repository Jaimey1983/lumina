import { createDefaultClipGroupBlock } from '@/lib/clip-path';
import type { ClipGroupBlock, ClipContent } from '@/types/slide.types';

/** Lienzo fijo para snapshots deterministas (320×240). */
export const CLIP_VISUAL_SIZE = { width: 320, height: 240 } as const;

export const CLIP_VISUAL_BG = '#e2e8f0';

export function clipVisualBlock(
  shape: ClipGroupBlock['clipShape'],
  contenido: ClipContent,
  extras?: Partial<Pick<ClipGroupBlock, 'borde' | 'sombra' | 'opacidad'>>,
): ClipGroupBlock {
  return {
    ...createDefaultClipGroupBlock(shape, contenido),
    borde: extras?.borde,
    sombra: extras?.sombra,
    opacidad: extras?.opacidad,
    x: 0,
    y: 0,
    ancho: 100,
    alto: 100,
  };
}

/** PNG 64×64 azul sólido — estable entre navegadores. */
export const CLIP_TEST_IMAGE_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAFklEQVR42mNk+M9Qz0AEYBxVSF+FABJVAQAJBwEAAV5bHQAAAABJRU5ErkJggg==';
