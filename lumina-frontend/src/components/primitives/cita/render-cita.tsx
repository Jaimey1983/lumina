'use client';

import type { QuoteBlock } from '@/types/slide.types';

export interface RenderQuoteProps {
  block: QuoteBlock;
}

export function RenderQuote({ block }: RenderQuoteProps) {
  return (
    <blockquote
      style={{
        margin: 0,
        paddingLeft: '1rem',
        borderLeft: '3px solid #d1d5db',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <p style={{ margin: 0, fontStyle: 'italic', color: '#374151' }}>
        {block.texto}
      </p>
      {(block.autor || block.fuente) && (
        <footer
          style={{
            marginTop: '0.25rem',
            fontSize: '0.8rem',
            color: '#9ca3af',
          }}
        >
          {block.autor && (
            <cite style={{ fontStyle: 'normal' }}>{block.autor}</cite>
          )}
          {block.autor && block.fuente && <span> · </span>}
          {block.fuente && <span>{block.fuente}</span>}
        </footer>
      )}
    </blockquote>
  );
}
