'use client';

import type { CodeBlock } from '@/types/slide.types';

export interface RenderCodeProps {
  block: CodeBlock;
}

export function RenderCode({ block }: RenderCodeProps) {
  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: '0.375rem',
        border: '1px solid #e5e7eb',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {block.titulo && (
        <div
          style={{
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        >
          {block.titulo}
        </div>
      )}
      <pre
        style={{
          margin: 0,
          padding: '0.75rem 1rem',
          background: '#1e1e1e',
          color: '#d4d4d4',
          fontSize: '0.8125rem',
          fontFamily: 'ui-monospace, monospace',
          overflow: 'auto',
          whiteSpace: 'pre',
          flex: 1,
        }}
      >
        <code>{block.codigo}</code>
      </pre>
    </div>
  );
}
