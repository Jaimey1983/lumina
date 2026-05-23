import type { TabsWidget, WidgetSlideInnerSelection } from '@/types/widget.types';
import {
  DEFAULT_WIDGET_SLIDE_VISIBILIDAD,
  type WidgetLayoutId,
  type WidgetSlideCount,
  type WidgetSlideVisibilidad,
} from '@/types/widget.types';
import { alineacionToCss } from '@/components/widgets/shared/widget-alignment';
import { coerceWidgetLayoutId } from '@/components/widgets/shared/widget-layouts';

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

export function normalizeTabsWidget(block: TabsWidget): TabsWidget {
  const raw = block.configuracion;
  const navLegacy = raw.mostrarBotonAnterior ?? true;

  return {
    ...block,
    configuracion: {
      ...DEFAULT_TABS_CONFIG,
      ...raw,
      opacidadFondoContenedor: raw.opacidadFondoContenedor ?? 100,
      paddingContenedor: raw.paddingContenedor ?? 16,
      espacioContenido: raw.espacioContenido ?? 12,
      alineacionInstruccion: raw.alineacionInstruccion ?? 'izquierda',
      mostrarBotonAnterior: raw.mostrarBotonAnterior ?? navLegacy,
      mostrarBotonSiguiente: raw.mostrarBotonSiguiente ?? navLegacy,
      layoutId: coerceWidgetLayoutId(raw.layoutId),
      fichaActiva: Math.max(0, Math.min((raw.numeroFichas ?? 3) - 1, raw.fichaActiva ?? 0)),
      defaultsSlide: {
        ...DEFAULT_TABS_CONFIG.defaultsSlide,
        ...raw.defaultsSlide,
      },
    },
    fichas: block.fichas?.length
      ? block.fichas
      : [],
  };
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
