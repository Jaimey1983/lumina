import {
  DEFAULT_CAROUSEL_CONFIG,
  createDefaultCarouselSlide,
  resizeCarouselSlides,
} from '@/components/widgets/carousel/carousel-config';
import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { CarouselWidget } from '@/types/widget.types';

export { createDefaultCarouselSlide, resizeCarouselSlides };

function buildSlides() {
  return Array.from({ length: DEFAULT_CAROUSEL_CONFIG.numeroSlides }, (_, i) =>
    createDefaultCarouselSlide(i + 1, DEFAULT_CAROUSEL_CONFIG.layoutId),
  );
}

export const DEFAULT_CAROUSEL_CONTENT: Omit<
  CarouselWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex' | 'slides'
> = {
  tituloWidget: 'Título para el widget carrusel',
  subtituloWidget:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  instruccion: 'Use las flechas o los indicadores para navegar entre páginas.',
  configuracion: { ...DEFAULT_CAROUSEL_CONFIG },
};

export function createDefaultCarouselBlock(marco?: BlockMarco): CarouselWidget {
  const fb = BLOCK_FALLBACKS.carousel;
  const base = {
    tipo: 'carousel' as const,
    ...DEFAULT_CAROUSEL_CONTENT,
    slides: buildSlides(),
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
