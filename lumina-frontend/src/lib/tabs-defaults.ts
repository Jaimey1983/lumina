import {
  DEFAULT_TABS_CONFIG,
  createDefaultTabSlide,
  resizeTabsFichas,
} from '@/components/widgets/tabs/tabs-config';
import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { TabsWidget } from '@/types/widget.types';

export { createDefaultTabSlide, resizeTabsFichas };

function buildFichas() {
  return Array.from({ length: DEFAULT_TABS_CONFIG.numeroFichas }, (_, i) =>
    createDefaultTabSlide(i + 1, DEFAULT_TABS_CONFIG.layoutId),
  );
}

export const DEFAULT_TABS_CONTENT: Omit<
  TabsWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex' | 'fichas'
> = {
  tituloWidget: 'Título para el widget de pestaña',
  subtituloWidget:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  instruccion: 'Seleccione cada pestaña para obtener más información.',
  configuracion: { ...DEFAULT_TABS_CONFIG },
};

/** Bloque tabs listo para insertar en el lienzo. */
export function createDefaultTabsBlock(marco?: BlockMarco): TabsWidget {
  const fb = BLOCK_FALLBACKS.tabs;
  const base = {
    tipo: 'tabs' as const,
    ...DEFAULT_TABS_CONTENT,
    fichas: buildFichas(),
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
