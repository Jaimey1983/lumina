import type { CarouselWidget, WidgetSlideContent, WidgetSlideInnerSelection } from '@/types/widget.types';
import {
  DEFAULT_WIDGET_SLIDE_VISIBILIDAD,
  type WidgetLayoutId,
  type WidgetSlideCount,
  type WidgetSlidePanelConfig,
  type WidgetSlideVisibilidad,
} from '@/types/widget.types';
import { alineacionToCss } from '@/components/widgets/shared/widget-alignment';
import { coerceWidgetLayoutId } from '@/components/widgets/shared/widget-layouts';
import {
  clampWidgetSlideCount,
  stableWidgetChildId,
} from '@/components/widgets/shared/widget-identity';

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

function padSlideLabel(index: number): string {
  return `Página ${index}`;
}

export function createDefaultCarouselSlide(
  index: number,
  layoutId?: WidgetLayoutId,
  id?: string,
): WidgetSlideContent {
  return {
    id: id ?? crypto.randomUUID(),
    etiqueta: padSlideLabel(index),
    encabezado: `ENCABEZADO ${String(index).padStart(2, '0')}`,
    subtitulo: 'Subtítulo descriptivo de la página.',
    cuerpo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    ...(layoutId ? { layoutId } : {}),
  };
}

export function resizeCarouselSlides(
  widget: CarouselWidget,
  newCount: WidgetSlideCount,
): WidgetSlideContent[] {
  const current = widget.slides ?? [];
  if (current.length === newCount) return current;
  if (current.length > newCount) return current.slice(0, newCount);
  const defaultLayout = coerceWidgetLayoutId(widget.configuracion?.layoutId);
  const extra = Array.from({ length: newCount - current.length }, (_, i) => {
    const index = current.length + i + 1;
    return createDefaultCarouselSlide(
      index,
      defaultLayout,
      stableWidgetChildId(widget, 'slide', index),
    );
  });
  return [...current, ...extra];
}

export function normalizeCarouselWidget(block: CarouselWidget): CarouselWidget {
  const raw = block.configuracion ?? ({} as CarouselWidget['configuracion']);
  const navLegacy = raw.mostrarBotonAnterior ?? true;
  const numeroSlides = clampWidgetSlideCount(raw.numeroSlides, DEFAULT_CAROUSEL_CONFIG.numeroSlides);

  const next: CarouselWidget = {
    ...block,
    configuracion: {
      ...DEFAULT_CAROUSEL_CONFIG,
      ...raw,
      numeroSlides,
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
      slideActivo: Math.max(0, Math.min(numeroSlides - 1, raw.slideActivo ?? 0)),
      defaultsSlide: {
        ...DEFAULT_CAROUSEL_CONFIG.defaultsSlide,
        ...raw.defaultsSlide,
      },
    },
  };

  return { ...next, slides: resizeCarouselSlides(next, numeroSlides) };
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
