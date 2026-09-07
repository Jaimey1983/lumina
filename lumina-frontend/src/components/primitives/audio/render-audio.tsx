'use client';

import type { AudioBlock } from '@/types/slide.types';

export interface RenderAudioProps {
  block: AudioBlock;
}

export function RenderAudio({ block }: RenderAudioProps) {
  return (
    <audio
      src={block.url}
      controls={block.controles ?? true}
      autoPlay={block.autoplay}
      loop={block.bucle}
      style={{ width: '100%' }}
    />
  );
}
