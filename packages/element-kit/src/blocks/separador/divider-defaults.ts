import { BLOCK_FALLBACKS, type DividerBlock } from '@lumina/types/slide';

export function createDefaultSeparadorBlock(): DividerBlock {
  const fb = BLOCK_FALLBACKS.separador;
  return {
    tipo: 'separador',
    id: crypto.randomUUID(),
    estilo: 'solido',
    color: '#64748b',
    grosor: 2,
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
  };
}
