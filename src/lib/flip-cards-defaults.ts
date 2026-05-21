import { DEFAULT_FLIP_CARDS_CONFIG } from '@/components/widgets/flip-cards/flip-cards-config';
import type { BlockMarco, FlipCard, FlipCardsWidget } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';

function newFlipCard(index: number): FlipCard {
  return {
    id: crypto.randomUUID(),
    frente: {
      titulo: `Tarjeta ${index}`,
      cuerpo: 'Descripción del frente.',
    },
    reverso: {
      titulo: `Reverso ${index}`,
      cuerpo: 'Contenido del reverso.',
    },
  };
}

export const DEFAULT_FLIP_CARDS_CONTENT: Omit<
  FlipCardsWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex'
> = {
  tituloWidget: 'Título del widget',
  subtituloWidget: 'Descripción opcional del conjunto de tarjetas.',
  instruccion: 'Haz clic en cada tarjeta para ver más información.',
  configuracion: { ...DEFAULT_FLIP_CARDS_CONFIG },
  tarjetas: [newFlipCard(1), newFlipCard(2), newFlipCard(3)],
};

export function createDefaultFlipCard(index?: number): FlipCard {
  return newFlipCard(index ?? 1);
}

/** Bloque flip-cards listo para insertar en el lienzo. */
export function createDefaultFlipCardsBlock(marco?: BlockMarco): FlipCardsWidget {
  const fb = BLOCK_FALLBACKS.flipCards;
  if (marco) {
    return {
      tipo: 'flip-cards',
      ...DEFAULT_FLIP_CARDS_CONTENT,
      x: marco.izquierdaPct,
      y: marco.arribaPct,
      ancho: marco.anchoPct,
      alto: marco.altoPct,
    };
  }
  return {
    tipo: 'flip-cards',
    ...DEFAULT_FLIP_CARDS_CONTENT,
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
  };
}
