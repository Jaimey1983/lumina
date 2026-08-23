import {
  DEFAULT_TIMELINE_CONFIG,
  buildTimelineNodos,
} from '@/components/widgets/timeline/timeline-config';
import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { TimelineWidget } from '@/types/widget.types';

export const DEFAULT_TIMELINE_CONTENT: Omit<
  TimelineWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex' | 'nodos'
> = {
  tituloWidget: 'Título del widget Línea de tiempo',
  subtituloWidget:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  instruccion: 'Explore cada punto en la línea de tiempo para obtener más información.',
  configuracion: { ...DEFAULT_TIMELINE_CONFIG },
};

export function createDefaultTimelineBlock(marco?: BlockMarco): TimelineWidget {
  const fb = BLOCK_FALLBACKS.timeline;
  const base = {
    tipo: 'timeline' as const,
    ...DEFAULT_TIMELINE_CONTENT,
    nodos: buildTimelineNodos(DEFAULT_TIMELINE_CONFIG.numeroNodos),
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
