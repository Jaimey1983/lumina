import type { TabsWidget, WidgetSlideContent, WidgetSlideInnerSelection } from '@/types/widget.types';
import {
  DEFAULT_WIDGET_SLIDE_VISIBILIDAD,
  type WidgetLayoutId,
  type WidgetSlideCount,
  type WidgetSlideVisibilidad,
} from '@/types/widget.types';
import { alineacionToCss } from '@/components/widgets/shared/widget-alignment';
import { coerceWidgetLayoutId } from '@/components/widgets/shared/widget-layouts';
import {
  clampWidgetSlideCount,
  stableWidgetChildId,
} from '@/components/widgets/shared/widget-identity';

export { alineacionToCss };

export type TabsAlineacion = 'izquierda' | 'centro' | 'derecha';

export type TabsSlideVisibilidad = WidgetSlideVisibilidad;

export interface TabsConfiguracionCompleta {
  numeroFichas: WidgetSlideCount;
  fichaActiva: number;
  layoutId: WidgetLayoutId;
  colorFondoContenedor: string;
  opacidadFondoContenedor: number;
  paddingContenedor: number;
  espacioContenido: number;
  mostrarTituloWidget: boolean;
  mostrarSubtitulo: boolean;
  mostrarInstruccion: boolean;
  alineacionInstruccion: TabsAlineacion;
  mostrarBotonAnterior: boolean;
  mostrarBotonSiguiente: boolean;
  defaultsSlide: TabsSlideVisibilidad;
  colorPestanaActiva: string;
  colorPestanaInactiva: string;
  colorBordeContenido: string;
  colorNavBoton: string;
}

export type TabsInnerSelection = WidgetSlideInnerSelection;

export const DEFAULT_TABS_CONFIG: TabsConfiguracionCompleta = {
  numeroFichas: 3,
  fichaActiva: 0,
  layoutId: 'imagen-izq-texto-der',
  colorFondoContenedor: '#F8FAFC',
  opacidadFondoContenedor: 100,
  paddingContenedor: 16,
  espacioContenido: 12,
  mostrarTituloWidget: true,
  mostrarSubtitulo: true,
  mostrarInstruccion: true,
  alineacionInstruccion: 'izquierda',
  mostrarBotonAnterior: true,
  mostrarBotonSiguiente: true,
  defaultsSlide: { ...DEFAULT_WIDGET_SLIDE_VISIBILIDAD },
  colorPestanaActiva: '#2563EB',
  colorPestanaInactiva: '#2563EB',
  colorBordeContenido: '#93C5FD',
  colorNavBoton: '#0F172A',
};

function padFichaLabel(index: number): string {
  return `FICHA ${String(index).padStart(2, '0')}`;
}

export function createDefaultTabSlide(
  index: number,
  layoutId?: WidgetLayoutId,
  id?: string,
): WidgetSlideContent {
  return {
    id: id ?? crypto.randomUUID(),
    etiqueta: padFichaLabel(index),
    encabezado: `ENCABEZADO ${String(index).padStart(2, '0')}`,
    subtitulo: 'Subtítulo descriptivo de la ficha.',
    cuerpo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    ...(layoutId ? { layoutId } : {}),
  };
}

export function resizeTabsFichas(
  widget: TabsWidget,
  newCount: WidgetSlideCount,
): WidgetSlideContent[] {
  const current = widget.fichas ?? [];
  if (current.length === newCount) return current;
  if (current.length > newCount) return current.slice(0, newCount);
  const defaultLayout = coerceWidgetLayoutId(widget.configuracion?.layoutId);
  const extra = Array.from({ length: newCount - current.length }, (_, i) => {
    const index = current.length + i + 1;
    return createDefaultTabSlide(
      index,
      defaultLayout,
      stableWidgetChildId(widget, 'ficha', index),
    );
  });
  return [...current, ...extra];
}

export function normalizeTabsWidget(block: TabsWidget): TabsWidget {
  const raw = block.configuracion ?? ({} as TabsWidget['configuracion']);
  const navLegacy = raw.mostrarBotonAnterior ?? true;
  const numeroFichas = clampWidgetSlideCount(raw.numeroFichas, DEFAULT_TABS_CONFIG.numeroFichas);

  const next: TabsWidget = {
    ...block,
    configuracion: {
      ...DEFAULT_TABS_CONFIG,
      ...raw,
      numeroFichas,
      opacidadFondoContenedor: raw.opacidadFondoContenedor ?? 100,
      paddingContenedor: raw.paddingContenedor ?? 16,
      espacioContenido: raw.espacioContenido ?? 12,
      alineacionInstruccion: raw.alineacionInstruccion ?? 'izquierda',
      mostrarBotonAnterior: raw.mostrarBotonAnterior ?? navLegacy,
      mostrarBotonSiguiente: raw.mostrarBotonSiguiente ?? navLegacy,
      layoutId: coerceWidgetLayoutId(raw.layoutId),
      fichaActiva: Math.max(0, Math.min(numeroFichas - 1, raw.fichaActiva ?? 0)),
      defaultsSlide: {
        ...DEFAULT_TABS_CONFIG.defaultsSlide,
        ...raw.defaultsSlide,
      },
    },
  };

  return { ...next, fichas: resizeTabsFichas(next, numeroFichas) };
}

export function mergedTabsConfig(block: TabsWidget): TabsConfiguracionCompleta {
  const w = normalizeTabsWidget(block);
  const raw = w.configuracion;
  return {
    ...DEFAULT_TABS_CONFIG,
    ...raw,
    opacidadFondoContenedor: raw.opacidadFondoContenedor ?? 100,
    paddingContenedor: raw.paddingContenedor ?? 16,
    espacioContenido: raw.espacioContenido ?? 12,
    alineacionInstruccion: raw.alineacionInstruccion ?? 'izquierda',
    mostrarBotonAnterior: raw.mostrarBotonAnterior ?? true,
    mostrarBotonSiguiente: raw.mostrarBotonSiguiente ?? true,
    layoutId: coerceWidgetLayoutId(raw.layoutId),
    fichaActiva: raw.fichaActiva ?? 0,
    defaultsSlide: {
      ...DEFAULT_TABS_CONFIG.defaultsSlide,
      ...raw.defaultsSlide,
    },
    colorPestanaActiva: raw.colorPestanaActiva ?? DEFAULT_TABS_CONFIG.colorPestanaActiva,
    colorPestanaInactiva: raw.colorPestanaInactiva ?? DEFAULT_TABS_CONFIG.colorPestanaInactiva,
    colorBordeContenido: raw.colorBordeContenido ?? DEFAULT_TABS_CONFIG.colorBordeContenido,
    colorNavBoton: raw.colorNavBoton ?? DEFAULT_TABS_CONFIG.colorNavBoton,
  };
}
