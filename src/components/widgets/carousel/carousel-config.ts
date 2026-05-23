import type { CarouselWidget, WidgetSlideInnerSelection } from '@/types/widget.types';
import {
  DEFAULT_WIDGET_SLIDE_VISIBILIDAD,
  type WidgetSlideCount,
  type WidgetSlidePanelConfig,
  type WidgetSlideVisibilidad,
} from '@/types/widget.types';
import { alineacionToCss } from '@/components/widgets/shared/widget-alignment';
import { coerceWidgetLayoutId } from '@/components/widgets/shared/widget-layouts';

export { alineacionToCss };

export type CarouselAlineacion = 'izquierda' | 'centro' | 'derecha';
export type CarouselTransicion = 'slide' | 'fade';
export type CarouselSlideVisibilidad = WidgetSlideVisibilidad;

export interface CarouselConfiguracionCompleta extends WidgetSlidePanelConfig {
  numeroSlides: WidgetSlideCount;
  slideActivo: number;
  colorFondoContenedor: string;
  opacidadFondoContenedor: number;
  paddingContenedor: number;
  espacioContenido: number;
  mostrarTituloWidget: boolean;
  mostrarSubtitulo: boolean;
  mostrarInstruccion: boolean;
  alineacionInstruccion: CarouselAlineacion;
  mostrarBotonAnterior: boolean;
  mostrarBotonSiguiente: boolean;
  mostrarDots: boolean;
  mostrarFlechasInternas: boolean;
  mostrarTabsPagina: boolean;
  transicion: CarouselTransicion;
  defaultsSlide: CarouselSlideVisibilidad;
  colorIndicadorActivo: string;
  colorIndicadorInactivo: string;
  colorNavBoton: string;
}

export type CarouselInnerSelection = WidgetSlideInnerSelection;

export const DEFAULT_CAROUSEL_CONFIG: CarouselConfiguracionCompleta = {
  numeroSlides: 3,
  slideActivo: 0,
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
  mostrarDots: true,
  mostrarFlechasInternas: true,
  mostrarTabsPagina: false,
  transicion: 'slide',
  defaultsSlide: { ...DEFAULT_WIDGET_SLIDE_VISIBILIDAD },
  colorIndicadorActivo: '#2563EB',
  colorIndicadorInactivo: '#CBD5E1',
  colorBordeContenido: '#93C5FD',
  colorNavBoton: '#0F172A',
};

export function normalizeCarouselWidget(block: CarouselWidget): CarouselWidget {
  const raw = block.configuracion;
  const navLegacy = raw.mostrarBotonAnterior ?? true;

  return {
    ...block,
    configuracion: {
      ...DEFAULT_CAROUSEL_CONFIG,
      ...raw,
      opacidadFondoContenedor: raw.opacidadFondoContenedor ?? 100,
      paddingContenedor: raw.paddingContenedor ?? 16,
      espacioContenido: raw.espacioContenido ?? 12,
      alineacionInstruccion: raw.alineacionInstruccion ?? 'izquierda',
      mostrarBotonAnterior: raw.mostrarBotonAnterior ?? navLegacy,
      mostrarBotonSiguiente: raw.mostrarBotonSiguiente ?? navLegacy,
      mostrarDots: raw.mostrarDots ?? true,
      mostrarFlechasInternas: raw.mostrarFlechasInternas ?? true,
      mostrarTabsPagina: raw.mostrarTabsPagina ?? false,
      transicion: raw.transicion === 'fade' ? 'fade' : 'slide',
      layoutId: coerceWidgetLayoutId(raw.layoutId),
      slideActivo: Math.max(
        0,
        Math.min((raw.numeroSlides ?? 3) - 1, raw.slideActivo ?? 0),
      ),
      defaultsSlide: {
        ...DEFAULT_CAROUSEL_CONFIG.defaultsSlide,
        ...raw.defaultsSlide,
      },
    },
    slides: block.slides?.length ? block.slides : [],
  };
}

export function mergedCarouselConfig(block: CarouselWidget): CarouselConfiguracionCompleta {
  const w = normalizeCarouselWidget(block);
  const raw = w.configuracion;
  return {
    ...DEFAULT_CAROUSEL_CONFIG,
    ...raw,
    opacidadFondoContenedor: raw.opacidadFondoContenedor ?? 100,
    paddingContenedor: raw.paddingContenedor ?? 16,
    espacioContenido: raw.espacioContenido ?? 12,
    alineacionInstruccion: raw.alineacionInstruccion ?? 'izquierda',
    mostrarBotonAnterior: raw.mostrarBotonAnterior ?? true,
    mostrarBotonSiguiente: raw.mostrarBotonSiguiente ?? true,
    mostrarDots: raw.mostrarDots ?? true,
    mostrarFlechasInternas: raw.mostrarFlechasInternas ?? true,
    mostrarTabsPagina: raw.mostrarTabsPagina ?? false,
    transicion: raw.transicion === 'fade' ? 'fade' : 'slide',
    layoutId: coerceWidgetLayoutId(raw.layoutId),
    slideActivo: raw.slideActivo ?? 0,
    defaultsSlide: {
      ...DEFAULT_CAROUSEL_CONFIG.defaultsSlide,
      ...raw.defaultsSlide,
    },
    colorIndicadorActivo: raw.colorIndicadorActivo ?? DEFAULT_CAROUSEL_CONFIG.colorIndicadorActivo,
    colorIndicadorInactivo:
      raw.colorIndicadorInactivo ?? DEFAULT_CAROUSEL_CONFIG.colorIndicadorInactivo,
    colorBordeContenido: raw.colorBordeContenido ?? DEFAULT_CAROUSEL_CONFIG.colorBordeContenido,
    colorNavBoton: raw.colorNavBoton ?? DEFAULT_CAROUSEL_CONFIG.colorNavBoton,
  };
}

export function toSlidePanelConfig(
  configuracion: CarouselConfiguracionCompleta,
): WidgetSlidePanelConfig {
  return {
    layoutId: configuracion.layoutId,
    colorBordeContenido: configuracion.colorBordeContenido,
    defaultsSlide: configuracion.defaultsSlide,
  };
}
