import type { VideoBlock } from '@lumina/types/slide';
import { BLOCK_FALLBACKS } from '@lumina/types/slide';

export function createDefaultVideoBlock(extra?: Partial<VideoBlock>): VideoBlock {
  const fb = BLOCK_FALLBACKS.video;
  return {
    tipo: 'video',
    url: '',
    autoplay: false,
    controles: true,
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
    ...extra,
  };
}
