import {
  DEFAULT_WIDGET_CAROUSEL_CHROME,
  DEFAULT_WIDGET_SLIDE_VISIBILIDAD,
  DEFAULT_WIDGET_TAB_CHROME,
  type WidgetHeaderConfig,
  type WidgetSlideContainerConfig,
} from '@/types/widget.types';

export const DEFAULT_WIDGET_HEADER_CONFIG: WidgetHeaderConfig = {
  mostrarTituloWidget: true,
  mostrarSubtitulo: true,
  mostrarInstruccion: true,
  alineacionInstruccion: 'izquierda',
  mostrarBotonAnterior: true,
  mostrarBotonSiguiente: true,
};

export const DEFAULT_WIDGET_SLIDE_CONTAINER_CONFIG: Omit<
  WidgetSlideContainerConfig,
  'defaultsSlide'
> & { defaultsSlide: typeof DEFAULT_WIDGET_SLIDE_VISIBILIDAD } = {
  ...DEFAULT_WIDGET_HEADER_CONFIG,
  colorFondoContenedor: '#F8FAFC',
  opacidadFondoContenedor: 100,
  paddingContenedor: 16,
  espacioContenido: 12,
  layoutId: 'imagen-izq-texto-der',
  defaultsSlide: DEFAULT_WIDGET_SLIDE_VISIBILIDAD,
  ...DEFAULT_WIDGET_TAB_CHROME,
};

export const DEFAULT_WIDGET_CAROUSEL_CONTAINER: Omit<
  WidgetSlideContainerConfig,
  'defaultsSlide'
> & {
  defaultsSlide: typeof DEFAULT_WIDGET_SLIDE_VISIBILIDAD;
  mostrarDots: boolean;
  mostrarFlechasInternas: boolean;
  mostrarTabsPagina: boolean;
  transicion: 'slide' | 'fade';
} = {
  ...DEFAULT_WIDGET_SLIDE_CONTAINER_CONFIG,
  ...DEFAULT_WIDGET_CAROUSEL_CHROME,
  mostrarDots: true,
  mostrarFlechasInternas: true,
  mostrarTabsPagina: false,
  transicion: 'slide',
};
