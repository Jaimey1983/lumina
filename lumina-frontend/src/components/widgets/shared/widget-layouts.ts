import type { WidgetLayoutId, WidgetSlideContent } from '@/types/widget.types';

export interface WidgetLayoutDef {
  id: WidgetLayoutId;
  label: string;
  description: string;
}

export const WIDGET_LAYOUTS: WidgetLayoutDef[] = [
  {
    id: 'imagen-izq-texto-der',
    label: 'Imagen izquierda',
    description: 'Imagen a la izquierda y texto a la derecha',
  },
  {
    id: 'texto-izq-imagen-der',
    label: 'Imagen derecha',
    description: 'Texto a la izquierda e imagen a la derecha',
  },
  {
    id: 'overlay',
    label: 'Texto sobre imagen',
    description: 'Imagen de fondo con textos superpuestos',
  },
  {
    id: 'solo-texto',
    label: 'Solo texto',
    description: 'Contenido textual sin columna de imagen',
  },
];

export function coerceWidgetLayoutId(id?: string): WidgetLayoutId {
  if (id && WIDGET_LAYOUTS.some((l) => l.id === id)) {
    return id as WidgetLayoutId;
  }
  return 'imagen-izq-texto-der';
}

export function isOverlayLayout(layoutId: string): boolean {
  return layoutId === 'overlay';
}

export function isSplitLayout(layoutId: string): boolean {
  return layoutId === 'imagen-izq-texto-der' || layoutId === 'texto-izq-imagen-der';
}

/** Layout efectivo de una ficha: override en slide o default del widget. */
export function resolveSlideLayoutId(
  slide: Pick<WidgetSlideContent, 'layoutId'>,
  defaultLayoutId: WidgetLayoutId | undefined,
): WidgetLayoutId {
  return coerceWidgetLayoutId(slide.layoutId ?? defaultLayoutId);
}
