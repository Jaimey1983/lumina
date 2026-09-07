import type { ColumnsBlock } from '@/types/slide.types';

export function createDefaultColumnsBlock(extra?: Partial<ColumnsBlock>): ColumnsBlock {
  return {
    tipo: 'columnas',
    columnas: [[], []],
    proporcion: '50-50',
    ...extra,
  };
}
