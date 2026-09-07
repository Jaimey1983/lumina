'use client';

import type { ReactNode } from 'react';
import type { ColumnsBlock, Block } from '@/types/slide.types';

export interface RenderColumnsProps {
  block: ColumnsBlock;
  renderInnerBlock?: (innerBlock: Block, colIdx: number, blockIdx: number) => ReactNode;
}

export function RenderColumns({ block, renderInnerBlock }: RenderColumnsProps) {
  let gridCols = `repeat(${block.columnas.length}, 1fr)`;
  if (block.proporcion) {
    const parts = block.proporcion.split(':');
    if (parts.length === block.columnas.length) {
      gridCols = parts.map((n) => `${n.trim()}fr`).join(' ');
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gap: '1rem',
        width: '100%',
        height: '100%',
      }}
    >
      {block.columnas.map((colBlocks, colIdx) => (
        <div
          key={colIdx}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          {colBlocks.map((innerBlock, blockIdx) => (
            <div key={blockIdx}>
              {renderInnerBlock
                ? renderInnerBlock(innerBlock, colIdx, blockIdx)
                : (
                    <div className="rounded border border-dashed border-border p-2 text-xs text-muted-foreground">
                      {innerBlock.tipo}
                    </div>
                  )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
