'use client';

import type { CSSProperties } from 'react';
import type { ImageBlock } from '@/types/slide.types';
import { hasMediaSrc } from '@/lib/media-url';

export interface RenderImageProps {
  block: ImageBlock;
  forceFill?: boolean;
}

export function RenderImage({ block, forceFill }: RenderImageProps) {
  const fitMap: Record<string, CSSProperties['objectFit']> = {
    cubrir: 'cover',
    contener: 'contain',
    llenar: 'fill',
  };

  if (!hasMediaSrc(block.url)) {
    return (
      <figure
        style={{
          margin: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e2e8f0',
          color: '#64748b',
          fontSize: '0.75rem',
          textAlign: 'center',
          padding: '0.5rem',
        }}
      >
        Sin imagen
      </figure>
    );
  }

  return (
    <figure
      style={{
        margin: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.url}
        alt={block.alt ?? ''}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: forceFill
            ? 'fill'
            : block.ajuste
              ? fitMap[block.ajuste]
              : 'fill',
          borderRadius: block.bordeRedondeado,
        }}
      />
      {block.caption && (
        <figcaption
          style={{
            marginTop: '0.25rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}
