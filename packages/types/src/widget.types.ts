/**
 * Tipos compartidos de la familia de widgets Captivate (Grupo 2).
 * Flip Cards, Tabs y Carousel extienden estas primitivas.
 */

// ─── Tipografía y posicionamiento ─────────────────────────────────────────────

export interface WidgetCampoEstilo {
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  fontFamily?: string;
  fontWeight?: number | 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  /** Multiplicador (ej. 1.25) o px si > 3 */
  lineHeight?: number;
  /** Espaciado entre letras en px */
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'capitalize';
  /** 0–100 */
  opacity?: number;
  /** Intensidad de sombra (0 = sin sombra) */
  textShadow?: number;
  backgroundColor?: string;
  borderRadius?: number;
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
  mostrarEtiqueta?: boolean;
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

export type WidgetTipo = 'flip-cards' | 'tabs' | 'carousel' | 'click-reveal' | 'timeline' | 'popup' | 'hotspot' | 'tooltip' | 'boton' | 'contador' | 'progreso' | 'ruleta';

/** Enumeración de `WidgetTipo` en orden estable (E7.2 — vino de `widget-registry.ts`). */
export const WIDGET_TIPOS: readonly WidgetTipo[] = [
  'flip-cards',
  'tabs',
  'carousel',
  'click-reveal',
  'timeline',
  'popup',
  'hotspot',
  'tooltip',
  'boton',
  'contador',
  'progreso',
  'ruleta',
] as const;

export function isWidgetTipo(value: string): value is WidgetTipo {
  return (WIDGET_TIPOS as readonly string[]).includes(value);
}

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

// ─── Click to Reveal ───────────────────────────────────────────────────────────

export type ClickRevealEfecto = 'fade' | 'instant' | 'slide-up';

export interface ClickRevealOverlayVisibilidad {
  mostrarEtiqueta: boolean;
  mostrarImagen: boolean;
  mostrarEncabezado: boolean;
  mostrarSubtitulo: boolean;
  mostrarCuerpo: boolean;
}

export const DEFAULT_CLICK_REVEAL_OVERLAY_VISIBILIDAD: ClickRevealOverlayVisibilidad = {
  mostrarEtiqueta: true,
  mostrarImagen: true,
  mostrarEncabezado: true,
  mostrarSubtitulo: false,
  mostrarCuerpo: true,
};

export interface ClickRevealTriggerVisibilidad {
  mostrarImagen: boolean;
  mostrarEtiqueta: boolean;
  mostrarTitulo: boolean;
}

export const DEFAULT_CLICK_REVEAL_TRIGGER_VISIBILIDAD: ClickRevealTriggerVisibilidad = {
  mostrarImagen: true,
  mostrarEtiqueta: true,
  mostrarTitulo: true,
};

/** Tarjeta disparadora en la fila inferior del widget. */
export interface ClickRevealTrigger extends WidgetImagenAjuste {
  id: string;
  etiqueta: string;
  titulo?: string;
  colorFondo?: string;
  mostrarImagen?: boolean;
  mostrarEtiqueta?: boolean;
  mostrarTitulo?: boolean;
}

export interface ClickRevealConfiguracion extends WidgetHeaderConfig {
  numeroElementos: WidgetSlideCount;
  /** Índice del overlay que se edita en el lienzo (0-based). */
  overlayActivo: number;
  colorFondoContenedor: string;
  opacidadFondoContenedor: number;
  paddingContenedor: number;
  espacioContenido: number;
  layoutId: WidgetLayoutId;
  colorBordeContenido: string;
  efectoApertura: ClickRevealEfecto;
  colorBackdrop: string;
  opacidadBackdrop: number;
  colorFondoModal: string;
  paddingModal: number;
  radioModal: number;
  mostrarBotonCerrar: boolean;
  alineacionInstruccion: WidgetAlineacion;
  defaultsTrigger: ClickRevealTriggerVisibilidad;
  defaultsOverlay: ClickRevealOverlayVisibilidad;
  colorTriggerActivo: string;
  colorTriggerInactivo: string;
}

export type ClickRevealInnerSelection =
  | { kind: 'widget' }
  | { kind: 'header-text'; field: WidgetHeaderTextField }
  | { kind: 'trigger'; triggerId: string }
  | { kind: 'trigger-text'; triggerId: string }
  | { kind: 'trigger-image'; triggerId: string }
  | { kind: 'overlay'; overlayId: string }
  | { kind: 'overlay-text'; overlayId: string; field: WidgetSlideTextField }
  | { kind: 'overlay-image'; overlayId: string };

export interface ClickRevealWidget extends WidgetHeaderFields, WidgetCanvasPosition {
  tipo: 'click-reveal';
  configuracion: ClickRevealConfiguracion;
  triggers: ClickRevealTrigger[];
  overlays: WidgetSlideContent[];
}

// ─── Popup (Grupo 9) ───────────────────────────────────────────────────────────

export type PopupTriggerVisual = 'boton' | 'icono' | 'imagen' | 'texto';
export type PopupTriggerEvento = 'click' | 'hover' | 'auto';
export type PopupEfectoApertura = 'fade' | 'instant' | 'slide-up';
export type PopupForma = 'redondo' | 'cuadrado' | 'pill';
export type PopupTriggerTamano = 'pequeno' | 'mediano' | 'grande';

export interface PopupOverlayVisibilidad {
  mostrarEtiqueta: boolean;
  mostrarImagen: boolean;
  mostrarEncabezado: boolean;
  mostrarSubtitulo: boolean;
  mostrarCuerpo: boolean;
}

export const DEFAULT_POPUP_OVERLAY_VISIBILIDAD: PopupOverlayVisibilidad = {
  mostrarEtiqueta: false,
  mostrarImagen: true,
  mostrarEncabezado: true,
  mostrarSubtitulo: false,
  mostrarCuerpo: true,
};

export interface PopupConfiguracion {
  triggerVisual: PopupTriggerVisual;
  triggerTexto?: string;
  /** Id del ícono lucide (p. ej. info, help, star). */
  triggerIcono?: string;
  triggerImagen?: string;
  triggerImagenAncho?: number;
  triggerImagenAlto?: number;
  /** Ancho del área del disparador en px (lienzo ref. 1280×720). */
  triggerAnchoPx?: number;
  /** Alto del área del disparador en px (lienzo ref. 1280×720). */
  triggerAltoPx?: number;
  triggerTamano?: PopupTriggerTamano;
  triggerSubrayado?: boolean;
  triggerColorFondo: string;
  triggerColorTexto: string;
  triggerForma: PopupForma;
  triggerEvento: PopupTriggerEvento;
  efectoApertura: PopupEfectoApertura;
  colorBackdrop: string;
  opacidadBackdrop: number;
  colorFondoModal: string;
  /** Ancho del modal como % del lienzo del slide (centro fijo). */
  modalAnchoPct?: number;
  /** Alto del modal como % del lienzo del slide (centro fijo). */
  modalAltoPct?: number;
  mostrarBotonCerrar: boolean;
  layoutId: WidgetLayoutId;
  colorBordeContenido: string;
  defaultsOverlay: PopupOverlayVisibilidad;
}

export type PopupInnerSelection =
  | { kind: 'widget' }
  | { kind: 'trigger' }
  | { kind: 'overlay' }
  | { kind: 'overlay-text'; field: WidgetSlideTextField }
  | { kind: 'overlay-image' };

export interface PopupWidget extends WidgetHeaderFields, WidgetCanvasPosition {
  tipo: 'popup';
  configuracion: PopupConfiguracion;
  overlay: WidgetSlideContent;
}

// ─── Hotspot (Grupo 9) ─────────────────────────────────────────────────────────

export type HotspotTriggerEvento = 'click' | 'hover';
export type HotspotPosicionBurbuja = 'auto' | 'arriba' | 'abajo' | 'izquierda' | 'derecha';
export type HotspotEfectoApertura = 'fade' | 'instant' | 'slide-up';

export interface HotspotConfiguracion {
  colorPulso: string;
  tamanoPunto: 'pequeno' | 'mediano' | 'grande';
  triggerEvento: HotspotTriggerEvento;
  posicionBurbuja: HotspotPosicionBurbuja;
  efectoApertura: HotspotEfectoApertura;
  colorFondoBurbuja: string;
  mostrarBotonCerrar: boolean;
  anchoBurbuja: number;
}

export type HotspotInnerSelection =
  | { kind: 'widget' }
  | { kind: 'overlay' }
  | { kind: 'overlay-text'; field: WidgetSlideTextField }
  | { kind: 'overlay-image' };

export interface HotspotWidget extends WidgetHeaderFields, WidgetCanvasPosition {
  tipo: 'hotspot';
  configuracion: HotspotConfiguracion;
  overlay: WidgetSlideContent;
}

// ─── Tooltip (Grupo 9) ─────────────────────────────────────────────────────────

export type TooltipTriggerTipo = 'icono' | 'texto_subrayado' | 'punto';
export type TooltipPosicion = 'auto' | 'arriba' | 'abajo' | 'izquierda' | 'derecha';

export interface TooltipWidget extends WidgetCanvasPosition {
  tipo: 'tooltip';
  triggerTipo: TooltipTriggerTipo;
  /** Nombre de ícono lucide-react, si triggerTipo === 'icono'. */
  icono?: string;
  /** Texto del disparador, si triggerTipo === 'texto_subrayado'. */
  textoTrigger?: string;
  /** Contenido mostrado en hover. Se edita solo desde el panel derecho. */
  textoTooltip: string;
  posicion: TooltipPosicion;
  colorFondo?: string;
  colorTexto?: string;
}

// ─── Botón (Grupo 9, estilo Bootstrap) ────────────────────────────────────────

export type BotonVariante =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark'
  | 'link';

export type BotonTamano = 'sm' | 'md' | 'lg';
export type BotonForma = 'redondeado' | 'pill';
export type BotonAccion = 'ninguna' | 'url' | 'siguiente' | 'anterior' | 'ir_a';

export interface BotonWidget extends WidgetCanvasPosition {
  tipo: 'boton';
  texto: string;
  variante: BotonVariante;
  outline?: boolean;
  tamano?: BotonTamano;
  forma?: BotonForma;
  accion?: BotonAccion;
  url?: string;
  /** Índice 0-based del slide destino si accion === 'ir_a'. */
  slideIndex?: number;
  deshabilitado?: boolean;
}

// ─── Contador / temporizador (Grupo 9) ─────────────────────────────────────────
// Independiente del temporizador de slide (`content.timer` / timerGlobal).

export type ContadorModo = 'temporizador' | 'cronometro' | 'numero';
export type ContadorFormato = 'mm:ss' | 'hh:mm:ss';
export type ContadorAlTerminar = 'ninguna' | 'siguiente';

export interface ContadorWidget extends WidgetCanvasPosition {
  tipo: 'contador';
  modo: ContadorModo;
  etiqueta?: string;
  /** Duración inicial en segundos (temporizador). */
  segundos: number;
  /** Valor mostrado en modo número. */
  valorInicial: number;
  /** Incremento/decremento por clic en modo número. */
  valorPaso?: number;
  formato?: ContadorFormato;
  autoIniciar?: boolean;
  mostrarControles?: boolean;
  alTerminar?: ContadorAlTerminar;
  colorFondo?: string;
  colorTexto?: string;
  colorAcento?: string;
}

// ─── Barra de progreso (Grupo 9, estilo Bootstrap) ─────────────────────────────

export type ProgresoModo = 'manual' | 'slides';

export interface RuletaWidget extends WidgetCanvasPosition {
  tipo: 'ruleta';
  configuracion: {
    colores: string[];
    sonido: boolean;
    duracionGiro: number;
    mostrarGanador: boolean;
  };
  items: { id: string; texto: string }[];
}

export interface ProgresoWidget extends WidgetCanvasPosition {
  tipo: 'progreso';
  modo: ProgresoModo;
  /** 0–100 si modo === 'manual'. */
  porcentaje: number;
  etiqueta?: string;
  mostrarPorcentaje?: boolean;
  striped?: boolean;
  animated?: boolean;
  colorBarra?: string;
  colorFondo?: string;
  colorTexto?: string;
}

export type TimelineVariante =
  | 'tarjetas'
  | 'minimal'
  | 'iconos'
  | 'segmentada'
  | 'vertical'
  | 'corporate'
  | 'proyecto'
  | 'infografica';

export type TimelineDisposicionNodos = 'alternado' | 'arriba' | 'abajo';

export type TimelineIconoLucide =
  | 'circle'
  | 'star'
  | 'users'
  | 'lightbulb'
  | 'globe'
  | 'message-circle'
  | 'calendar'
  | 'camera'
  | 'book'
  | 'trophy'
  | 'heart'
  | 'zap'
  | 'target'
  | 'briefcase'
  | 'printer'
  | 'phone'
  | 'none';

export interface TimelineNodo extends WidgetImagenAjuste {
  id: string;
  etiqueta: string;
  /** Título del evento (corporate, vertical, proyecto, infográfica). */
  tituloNodo?: string;
  cuerpo: string;
  mostrarEtiqueta: boolean;
  mostrarTituloNodo?: boolean;
  mostrarCuerpo: boolean;
  mostrarImagen: boolean;
  mostrarIconoLucide?: boolean;
  iconoLucide?: TimelineIconoLucide;
  /** Número grande de paso (ej. "01") en variante proyecto. */
  numeroPaso?: string;
  mostrarNumeroPaso?: boolean;
  /** Color de acento del nodo (barra segmentada, icono, etiqueta). */
  colorAccent?: string;
  estiloEtiqueta?: WidgetCampoEstilo;
  /** Título del evento (corporate, vertical, segmentada, etc.). */
  estiloTituloNodo?: WidgetCampoEstilo;
  estiloCuerpo?: WidgetCampoEstilo;
}

export interface TimelineConfiguracion extends WidgetHeaderConfig {
  variante: TimelineVariante;
  disposicionNodos: TimelineDisposicionNodos;
  mostrarHaloNodo: boolean;
  intensidadHaloNodo: number;
  numeroNodos: number;
  colorLinea: string;
  grosorLinea: number;
  colorNodo: string;
  radioNodo: number;
  colorCardFondo: string;
  colorCardBorde: string;
  radioCard: number;
  paddingCard: number;
  colorEtiqueta: string;
  colorCuerpo: string;
  mostrarTituloWidget: boolean;
  mostrarSubtitulo: boolean;
  mostrarInstruccion: boolean;
  alineacionInstruccion?: WidgetAlineacion;
  colorFondoContenedor?: string;
  opacidadFondoContenedor?: number;
  paddingContenedor?: number;
  espacioContenido?: number;
  mostrarConectorVertical: boolean;
  colorConector?: string;
  grosorConector?: number;
}

export interface TimelineWidget extends WidgetHeaderFields, WidgetCanvasPosition {
  tipo: 'timeline';
  configuracion: TimelineConfiguracion;
  nodos: TimelineNodo[];
}

export type CaptivateWidget =
  | TabsWidget
  | CarouselWidget
  | ClickRevealWidget
  | TimelineWidget
  | PopupWidget
  | HotspotWidget
  | TooltipWidget
  | BotonWidget
  | ContadorWidget
  | ProgresoWidget
  | RuletaWidget;
