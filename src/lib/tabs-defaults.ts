import { DEFAULT_TABS_CONFIG } from '@/components/widgets/tabs/tabs-config';
import { coerceWidgetLayoutId } from '@/components/widgets/shared/widget-layouts';
import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { TabsWidget, WidgetSlideContent, WidgetSlideCount, WidgetLayoutId } from '@/types/widget.types';

function padFichaLabel(index: number): string {
  return `FICHA ${String(index).padStart(2, '0')}`;
}

export function createDefaultTabSlide(
  index: number,
  layoutId?: WidgetLayoutId,
): WidgetSlideContent {
  return {
    id: crypto.randomUUID(),
    etiqueta: padFichaLabel(index),
    encabezado: `ENCABEZADO ${String(index).padStart(2, '0')}`,
    subtitulo: 'Subtítulo descriptivo de la ficha.',
    cuerpo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    ...(layoutId ? { layoutId } : {}),
  };
}

function buildFichas(count: WidgetSlideCount, layoutId?: WidgetLayoutId): WidgetSlideContent[] {
  return Array.from({ length: count }, (_, i) => createDefaultTabSlide(i + 1, layoutId));
}

export const DEFAULT_TABS_CONTENT: Omit<
  TabsWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex'
> = {
  tituloWidget: 'Título para el widget de pestaña',
  subtituloWidget:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  instruccion: 'Seleccione cada pestaña para obtener más información.',
  configuracion: { ...DEFAULT_TABS_CONFIG },
  fichas: buildFichas(DEFAULT_TABS_CONFIG.numeroFichas, DEFAULT_TABS_CONFIG.layoutId),
};

/** Bloque tabs listo para insertar en el lienzo. */
export function createDefaultTabsBlock(marco?: BlockMarco): TabsWidget {
  const fb = BLOCK_FALLBACKS.tabs;
  const base = {
    tipo: 'tabs' as const,
    ...DEFAULT_TABS_CONTENT,
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

export function resizeTabsFichas(
  widget: TabsWidget,
  newCount: WidgetSlideCount,
): WidgetSlideContent[] {
  const current = widget.fichas ?? [];
  if (current.length === newCount) return current;
  if (current.length > newCount) return current.slice(0, newCount);
  const defaultLayout = coerceWidgetLayoutId(widget.configuracion.layoutId);
  const extra = Array.from({ length: newCount - current.length }, (_, i) =>
    createDefaultTabSlide(current.length + i + 1, defaultLayout),
  );
  return [...current, ...extra];
}
