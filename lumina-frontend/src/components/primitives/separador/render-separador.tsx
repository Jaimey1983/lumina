'use client';

import type { DividerBlock } from '@/types/slide.types';

export interface RenderDividerProps {
  block: DividerBlock;
}

export function RenderDivider({ block }: RenderDividerProps) {
  const styleMap: Record<string, string> = {
    solido: 'solid',
    punteado: 'dotted',
    guionado: 'dashed',
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <hr
        style={{
          width: '100%',
          border: 'none',
          borderTop: `${block.grosor ?? 2}px ${styleMap[block.estilo ?? 'solido'] ?? 'solid'} ${block.color ?? '#64748b'}`,
          margin: 0,
        }}
      />
    </div>
  );
}
