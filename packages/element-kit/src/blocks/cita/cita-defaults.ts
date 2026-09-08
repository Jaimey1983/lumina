import type { QuoteBlock } from '@lumina/types/slide';

export function createDefaultQuoteBlock(extra?: Partial<QuoteBlock>): QuoteBlock {
  return {
    tipo: 'cita',
    texto: '«Una cita inspiradora o referencia relevante.»',
    autor: 'Autor',
    fuente: '',
    ...extra,
  };
}
