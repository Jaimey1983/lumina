/**
 * Tipos compartidos de la familia de widgets Captivate (Grupo 2).
 * Flip Cards, Tabs y Carousel extienden estas primitivas.
 */

// ─── Tipografía y posicionamiento ─────────────────────────────────────────────

export interface WidgetCampoEstilo {
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  fontFamily?: string;
  fontWeight?: number | 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  /** Multiplicador (ej. 1.25) o px si > 3 */
  lineHeight?: number;
  /** Espaciado entre letras en px */
  letterSpacing?: number;
}

/** Posición de un elemento dentro del área del slide/ficha (% del contenedor). */
export interface WidgetElementPos {
  x: number;
  y: number;
}

export type WidgetAlineacion = 'izquierda' | 'centro' | 'derecha';

// ─── Imagen ───────────────────────────────────────────────────────────────────

export interface WidgetImagenAjuste {
  imagen?: string;
  imagenAlt?: string;
  imagenObjectFit?: 'cover' | 'contain';
  imagenObjectPosition?: string;
  /** Altura de la imagen en px (vacío = automático) */
  imagenAltura?: number;
  /** Radio de esquinas de la imagen en px */
  imagenRadio?: number;
  /** 0–100 */
  imagenOpacidad?: number;
  /** Brillo 0–200, 100 = normal */
  imagenBrillo?: number;
  imagenEscalaDeGrises?: boolean;
  /** Zoom de la imagen (100 = normal) */
  imagenEscala?: number;
  /** Desplazamiento horizontal en % */
  imagenOffsetX?: number;
  /** Desplazamiento vertical en % */
  imagenOffsetY?: number;
}

// ─── Visibilidad ──────────────────────────────────────────────────────────────

/** Visibilidad base por ítem (Flip Cards: título/cuerpo; Tabs/Carousel: encabezado/cuerpo). */
export interface WidgetItemVisibilidad {
  mostrarImagen: boolean;
  mostrarTitulo: boolean;
  mostrarCuerpo: boolean;
}

/** Visibilidad extendida para slides con subtítulo y contenedor tarjeta. */
export interface WidgetSlideVisibilidad extends WidgetItemVisibilidad {
  mostrarEncabezado: boolean;
  mostrarSubtitulo: boolean;
  mostrarTarjeta: boolean;
}

export const DEFAULT_WIDGET_ITEM_VISIBILIDAD: WidgetItemVisibilidad = {
  mostrarImagen: true,
  mostrarTitulo: true,
  mostrarCuerpo: true,
};

export const DEFAULT_WIDGET_SLIDE_VISIBILIDAD: WidgetSlideVisibilidad = {
  mostrarImagen: true,
  mostrarTitulo: true,
  mostrarCuerpo: true,
  mostrarEncabezado: true,
  mostrarSubtitulo: true,
  mostrarTarjeta: false,
};

// ─── Header del widget ────────────────────────────────────────────────────────

export interface WidgetEstilosHeader {
  tituloWidget?: WidgetCampoEstilo;
  subtituloWidget?: WidgetCampoEstilo;
  instruccion?: WidgetCampoEstilo;
}

export interface WidgetHeaderFields {
  tituloWidget: string;
  subtituloWidget: string;
  instruccion: string;
  estilosHeader?: WidgetEstilosHeader;
}

export interface WidgetHeaderConfig {
  mostrarTituloWidget: boolean;
  mostrarSubtitulo: boolean;
  mostrarInstruccion: boolean;
  alineacionInstruccion?: WidgetAlineacion;
  mostrarBotonAnterior?: boolean;
  mostrarBotonSiguiente?: boolean;
}

// ─── Posición en lienzo ───────────────────────────────────────────────────────

export interface WidgetCanvasPosition {
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

// ─── Contenido por slide/ficha (Tabs + Carousel) ─────────────────────────────

export interface WidgetSlideContent extends WidgetImagenAjuste {
  id: string;
  /** Etiqueta visible: "FICHA 01", "Página 1", etc. */
  etiqueta: string;
  encabezado: string;
  subtitulo?: string;
  cuerpo: string;
  /** Overrides de visibilidad por slide */
  mostrarImagen?: boolean;
  mostrarEncabezado?: boolean;
  mostrarSubtitulo?: boolean;
  mostrarCuerpo?: boolean;
  mostrarTarjeta?: boolean;
  encabezadoPos?: WidgetElementPos;
  subtituloPos?: WidgetElementPos;
  cuerpoPos?: WidgetElementPos;
  estiloEncabezado?: WidgetCampoEstilo;
  estiloSubtitulo?: WidgetCampoEstilo;
  estiloCuerpo?: WidgetCampoEstilo;
  colorFondoSlide?: string;
  /** Override de layout por ficha; si falta, usa configuracion.layoutId del widget. */
  layoutId?: WidgetLayoutId;
  /** Bloques de texto libres posicionados dentro de esta ficha/página. */
  bloques?: WidgetSlideTextBlock[];
}

/** Texto posicionable relativo al panel de la ficha (% del área del panel). */
export interface WidgetSlideTextBlock {
  id: string;
  tipo: 'texto';
  contenido: string;
  x: number;
  y: number;
  ancho: number;
  alto?: number;
  tamanoFuente?: string;
  color?: string;
  negrita?: boolean;
  cursiva?: boolean;
  alineacion?: 'izquierda' | 'centro' | 'derecha' | 'justificado';
}

export type WidgetLayoutId =
  | 'imagen-izq-texto-der'
  | 'texto-izq-imagen-der'
  | 'solo-texto'
  | 'overlay';

export type WidgetSlideCount = 2 | 3 | 4 | 5 | 6;

/** Config mínima para renderizar el panel de slide (Tabs + Carousel). */
export interface WidgetSlidePanelConfig {
  layoutId: WidgetLayoutId;
  colorBordeContenido: string;
  defaultsSlide: WidgetSlideVisibilidad;
}

export type WidgetSlideTextField = 'encabezado' | 'subtitulo' | 'cuerpo';

export type WidgetHeaderTextField = 'tituloWidget' | 'subtituloWidget' | 'instruccion';

/** Selección interna compartida (Tabs + Carousel). */
export type WidgetSlideInnerSelection =
  | { kind: 'widget' }
  | { kind: 'header-text'; field: WidgetHeaderTextField }
  | { kind: 'slide'; slideId: string }
  | { kind: 'slide-text'; slideId: string; field: WidgetSlideTextField }
  | { kind: 'slide-image'; slideId: string };

// ─── Familia de widgets ─────────────────────────────────────────────────────────

export type WidgetTipo = 'flip-cards' | 'tabs' | 'carousel';

/** Configuración compartida del contenedor (Tabs + Carousel). */
export interface WidgetSlideContainerConfig extends WidgetHeaderConfig {
  colorFondoContenedor: string;
  opacidadFondoContenedor?: number;
  paddingContenedor?: number;
  espacioContenido?: number;
  layoutId?: WidgetLayoutId;
  /** Defaults de visibilidad para slides nuevos o sin override */
  defaultsSlide: WidgetSlideVisibilidad;
  colorPestanaActiva?: string;
  colorPestanaInactiva?: string;
  colorBordeContenido?: string;
  colorNavBoton?: string;
  colorIndicadorActivo?: string;
  colorIndicadorInactivo?: string;
}

/** Colores de acento compartidos por Tabs y Carousel. */
export interface WidgetChromeColors {
  colorBordeContenido: string;
  colorNavBoton: string;
}

export const DEFAULT_WIDGET_CHROME_COLORS: WidgetChromeColors = {
  colorBordeContenido: '#93C5FD',
  colorNavBoton: '#0F172A',
};

export const DEFAULT_WIDGET_TAB_CHROME = {
  colorPestanaActiva: '#2563EB',
  colorPestanaInactiva: '#2563EB',
  ...DEFAULT_WIDGET_CHROME_COLORS,
};

export const DEFAULT_WIDGET_CAROUSEL_CHROME = {
  colorIndicadorActivo: '#2563EB',
  colorIndicadorInactivo: '#CBD5E1',
  ...DEFAULT_WIDGET_CHROME_COLORS,
};

// ─── Tabs (tipo listo para Fase 1) ─────────────────────────────────────────────

export interface TabsWidget extends WidgetHeaderFields, WidgetCanvasPosition {
  tipo: 'tabs';
  configuracion: WidgetSlideContainerConfig & {
    numeroFichas: WidgetSlideCount;
    fichaActiva: number;
  };
  fichas: WidgetSlideContent[];
}

// ─── Carousel (tipo listo para Fase 1) ─────────────────────────────────────────

export interface CarouselWidget extends WidgetHeaderFields, WidgetCanvasPosition {
  tipo: 'carousel';
  configuracion: WidgetSlideContainerConfig & {
    numeroSlides: WidgetSlideCount;
    slideActivo: number;
    mostrarDots?: boolean;
    mostrarFlechasInternas?: boolean;
    mostrarTabsPagina?: boolean;
    transicion?: 'slide' | 'fade';
  };
  slides: WidgetSlideContent[];
}

export type CaptivateWidget = TabsWidget | CarouselWidget;
