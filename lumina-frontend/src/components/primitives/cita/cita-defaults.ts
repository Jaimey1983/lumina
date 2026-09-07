import type { QuoteBlock } from '@/types/slide.types';

export function createDefaultQuoteBlock(extra?: Partial<QuoteBlock>): QuoteBlock {
  return {
    tipo: 'cita',
    texto: '«Una cita inspiradora o referencia relevante.»',
    autor: 'Autor',
    fuente: '',
    ...extra,
  };
}
