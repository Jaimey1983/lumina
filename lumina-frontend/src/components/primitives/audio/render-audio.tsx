'use client';

import type { AudioBlock } from '@lumina/types/slide';

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
