import {
  DEFAULT_FLIP_CARDS_CONFIG,
  createDefaultFlipCard,
} from '@/components/widgets/flip-cards/flip-cards-config';
import type { BlockMarco, FlipCardsWidget } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';

export { createDefaultFlipCard };

export const DEFAULT_FLIP_CARDS_CONTENT: Omit<
  FlipCardsWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex' | 'tarjetas'
> = {
  tituloWidget: 'Título del widget',
  subtituloWidget: 'Descripción opcional del conjunto de tarjetas.',
  instruccion: 'Haz clic en cada tarjeta para ver más información.',
  configuracion: { ...DEFAULT_FLIP_CARDS_CONFIG },
};

/** Bloque flip-cards listo para insertar en el lienzo. */
export function createDefaultFlipCardsBlock(marco?: BlockMarco): FlipCardsWidget {
  const fb = BLOCK_FALLBACKS.flipCards;
  const tarjetas = [
    createDefaultFlipCard(1),
    createDefaultFlipCard(2),
    createDefaultFlipCard(3),
  ];
  const base = {
    tipo: 'flip-cards' as const,
    ...DEFAULT_FLIP_CARDS_CONTENT,
    tarjetas,
  };
  if (marco) {
    return {
      ...base,
      x: marco.izquierdaPct,
      y: marco.arribaPct,
      ancho: marco.anchoPct,
      alto: marco.altoPct,
    };
  }
  return {
    ...base,
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
  };
}
