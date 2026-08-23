import type { WidgetElementPos, WidgetItemVisibilidad, WidgetSlideVisibilidad } from '@/types/widget.types';

export const DEFAULT_TITULO_POS: WidgetElementPos = { x: 10, y: 14 };
export const DEFAULT_CUERPO_POS: WidgetElementPos = { x: 10, y: 42 };
export const DEFAULT_ENCABEZADO_POS: WidgetElementPos = { x: 10, y: 14 };
export const DEFAULT_SUBTITULO_POS: WidgetElementPos = { x: 10, y: 28 };

export function resolveItemVisibilidad<T extends Partial<WidgetItemVisibilidad>>(
  defaults: WidgetItemVisibilidad,
  item: T,
): WidgetItemVisibilidad {
  return {
    mostrarImagen: item.mostrarImagen ?? defaults.mostrarImagen,
    mostrarTitulo: item.mostrarTitulo ?? defaults.mostrarTitulo,
    mostrarCuerpo: item.mostrarCuerpo ?? defaults.mostrarCuerpo,
  };
}

export function resolveSlideVisibilidad<T extends Partial<WidgetSlideVisibilidad>>(
  defaults: WidgetSlideVisibilidad,
  slide: T,
): WidgetSlideVisibilidad {
  const base = resolveItemVisibilidad(defaults, slide);
  return {
    ...base,
    mostrarEncabezado: slide.mostrarEncabezado ?? defaults.mostrarEncabezado,
    mostrarSubtitulo: slide.mostrarSubtitulo ?? defaults.mostrarSubtitulo,
    mostrarTarjeta: slide.mostrarTarjeta ?? defaults.mostrarTarjeta,
  };
}

export type WidgetTextField = 'titulo' | 'cuerpo' | 'encabezado' | 'subtitulo';

const TEXT_POS_DEFAULTS: Record<WidgetTextField, WidgetElementPos> = {
  titulo: DEFAULT_TITULO_POS,
  cuerpo: DEFAULT_CUERPO_POS,
  encabezado: DEFAULT_ENCABEZADO_POS,
  subtitulo: DEFAULT_SUBTITULO_POS,
};

export function resolveTextPos(
  item: Partial<Record<`${WidgetTextField}Pos`, WidgetElementPos>>,
  field: WidgetTextField,
): WidgetElementPos {
  const key = `${field}Pos` as const;
  const stored = item[key];
  const base = TEXT_POS_DEFAULTS[field];
  return { x: stored?.x ?? base.x, y: stored?.y ?? base.y };
}

export function clampWidgetPos(x: number, y: number): WidgetElementPos {
  return {
    x: Math.max(2, Math.min(92, Math.round(x * 10) / 10)),
    y: Math.max(2, Math.min(92, Math.round(y * 10) / 10)),
  };
}

/** @deprecated Usar clampWidgetPos */
export const clampCardPos = clampWidgetPos;

export function slideSelectionId(
  selection: { kind: string; slideId?: string; cardId?: string } | null | undefined,
): string | null {
  if (!selection) return null;
  if (selection.kind === 'slide' || selection.kind === 'slide-text' || selection.kind === 'slide-image') {
    return selection.slideId ?? null;
  }
  if (selection.kind === 'card' || selection.kind === 'card-text' || selection.kind === 'card-image') {
    return selection.cardId ?? null;
  }
  return null;
}
