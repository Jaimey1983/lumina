import { DEFAULT_CAROUSEL_CONFIG } from '@/components/widgets/carousel/carousel-config';
import { coerceWidgetLayoutId } from '@/components/widgets/shared/widget-layouts';
import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { CarouselWidget, WidgetLayoutId, WidgetSlideContent, WidgetSlideCount } from '@/types/widget.types';

function padSlideLabel(index: number): string {
  return `Página ${index}`;
}

export function createDefaultCarouselSlide(
  index: number,
  layoutId?: WidgetLayoutId,
): WidgetSlideContent {
  return {
    id: crypto.randomUUID(),
    etiqueta: padSlideLabel(index),
    encabezado: `ENCABEZADO ${String(index).padStart(2, '0')}`,
    subtitulo: 'Subtítulo descriptivo de la página.',
    cuerpo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    ...(layoutId ? { layoutId } : {}),
  };
}

function buildSlides(count: WidgetSlideCount, layoutId?: WidgetLayoutId): WidgetSlideContent[] {
  return Array.from({ length: count }, (_, i) => createDefaultCarouselSlide(i + 1, layoutId));
}

export const DEFAULT_CAROUSEL_CONTENT: Omit<
  CarouselWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex'
> = {
  tituloWidget: 'Título para el widget carrusel',
  subtituloWidget:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  instruccion: 'Use las flechas o los indicadores para navegar entre páginas.',
  configuracion: { ...DEFAULT_CAROUSEL_CONFIG },
  slides: buildSlides(DEFAULT_CAROUSEL_CONFIG.numeroSlides, DEFAULT_CAROUSEL_CONFIG.layoutId),
};

export function createDefaultCarouselBlock(marco?: BlockMarco): CarouselWidget {
  const fb = BLOCK_FALLBACKS.carousel;
  const base = {
    tipo: 'carousel' as const,
    ...DEFAULT_CAROUSEL_CONTENT,
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

export function resizeCarouselSlides(
  widget: CarouselWidget,
  newCount: WidgetSlideCount,
): WidgetSlideContent[] {
  const current = widget.slides ?? [];
  if (current.length === newCount) return current;
  if (current.length > newCount) return current.slice(0, newCount);
  const defaultLayout = coerceWidgetLayoutId(widget.configuracion.layoutId);
  const extra = Array.from({ length: newCount - current.length }, (_, i) =>
    createDefaultCarouselSlide(current.length + i + 1, defaultLayout),
  );
  return [...current, ...extra];
}
