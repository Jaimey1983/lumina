import {
  DEFAULT_CLICK_REVEAL_CONFIG,
  buildClickRevealElements,
} from '@/components/widgets/click-reveal/click-reveal-config';
import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { ClickRevealWidget } from '@/types/widget.types';

export const DEFAULT_CLICK_REVEAL_CONTENT: Omit<
  ClickRevealWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex' | 'triggers' | 'overlays'
> = {
  tituloWidget: 'Título del widget Click to Reveal',
  subtituloWidget:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  instruccion: 'Seleccione cada tarjeta para obtener más información.',
  configuracion: { ...DEFAULT_CLICK_REVEAL_CONFIG },
};

export function createDefaultClickRevealBlock(marco?: BlockMarco): ClickRevealWidget {
  const fb = BLOCK_FALLBACKS.clickReveal;
  const { triggers, overlays } = buildClickRevealElements(
    DEFAULT_CLICK_REVEAL_CONFIG.numeroElementos,
    DEFAULT_CLICK_REVEAL_CONFIG.layoutId,
  );
  const base = {
    tipo: 'click-reveal' as const,
    ...DEFAULT_CLICK_REVEAL_CONTENT,
    triggers,
    overlays,
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
