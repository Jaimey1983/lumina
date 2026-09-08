import type { AudioBlock } from '@lumina/types/slide';

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
