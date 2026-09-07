import type { AudioBlock } from '@/types/slide.types';

export function createDefaultAudioBlock(extra?: Partial<AudioBlock>): AudioBlock {
  return {
    tipo: 'audio',
    url: '',
    autoplay: false,
    controles: true,
    bucle: false,
    ...extra,
  };
}
