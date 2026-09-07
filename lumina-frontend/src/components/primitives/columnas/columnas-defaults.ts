import type { ColumnsBlock } from '@lumina/types/slide';

export function createDefaultColumnsBlock(extra?: Partial<ColumnsBlock>): ColumnsBlock {
  return {
    tipo: 'columnas',
    columnas: [[], []],
    proporcion: '50-50',
    ...extra,
  };
}
