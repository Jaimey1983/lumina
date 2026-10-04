'use client';

import { useRef } from 'react';
import type { AudioBlock } from '@lumina/types/slide';
import type { EventoTipo } from '@lumina/types/interaction';

export interface RenderAudioProps {
  block: AudioBlock;
  /** N5 — avisa al motor (`media_inicia` / `media_termina`). Ausente = sin motor. */
  emitir?: (evento: EventoTipo) => void;
}

export function RenderAudio({ block, emitir }: RenderAudioProps) {
  // `media_inicia` una vez por reproducción: pausar y reanudar no lo repite.
  const sonando = useRef(false);
  return (
    <audio
      src={block.url}
      controls={block.controles ?? true}
      autoPlay={block.autoplay}
      loop={block.bucle}
      style={{ width: '100%' }}
      onPlay={
        emitir
          ? () => {
              if (sonando.current) return;
              sonando.current = true;
              emitir('media_inicia');
            }
          : undefined
      }
      onEnded={
        emitir
          ? () => {
              sonando.current = false;
              emitir('media_termina');
            }
          : undefined
      }
    />
  );
}
