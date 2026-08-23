// ─── Slide Types ──────────────────────────────────────────────────────────────
// Full TypeScript schema for the Lumina slide system.
// Discriminated unions use `tipo` as the discriminant field.

// ─── Background ───────────────────────────────────────────────────────────────

export interface BackgroundColor {
  tipo: 'color';
  valor: string;
}

export interface BackgroundGradient {
  tipo: 'gradiente';
  inicio: string;
  fin: string;
  /** Angle in degrees (0 = top→bottom). */
  direccion?: number;
}

export interface BackgroundImage {
  tipo: 'imagen';
  url: string;
  /** CSS object-fit equivalent. */
  ajuste?: 'cubrir' | 'contener' | 'llenar' | 'ninguno';
  posicion?: string;
}

export type Background = BackgroundColor | BackgroundGradient | BackgroundImage;

// ─── Slide themes ─────────────────────────────────────────────────────────────

export interface SlideThemeColors {
  texto: string;
  textoSecundario: string;
  acento: string;
  fondo: string;
}

export interface SlideTheme {
  id: string;
  nombre: string;
  esPersonalizado: boolean;
  fondo: Background;
  /** Nombre de la fuente, ej: 'Inter', 'Poppins'. */
  fuente: string;
  colores: SlideThemeColors;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface LayoutPadding {
  arriba: number;
  derecha: number;
  abajo: number;
  izquierda: number;
}

export interface Layout {
  columnas?: number;
  alineacionHorizontal?: 'izquierda' | 'centro' | 'derecha';
  alineacionVertical?: 'inicio' | 'centro' | 'fin';
  /** Uniform padding (px) or per-side object. */
  relleno?: number | LayoutPadding;
  brecha?: number;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export interface Feedback {
  correcto?: string;
  incorrecto?: string;
  parcial?: string;
  explicacion?: string;
  mostrarExplicacion?: boolean;
  intentosPermitidos?: number;
}

// ─── Activity variants ────────────────────────────────────────────────────────

export interface QuizOption {
  id: string;
  texto: string;
  esCorrecta: boolean;
  retroalimentacion?: string;
}

export interface QuizMultiple {
  tipo: 'quiz_multiple';
  pregunta: string;
  opciones: QuizOption[];
  /** Allow selecting more than one correct option. */
  multipleRespuesta?: boolean;
  puntos?: number;
  retroalimentacion?: Feedback;
  shuffleOptions?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface TrueFalse {
  tipo: 'verdadero_falso';
  afirmacion: string;
  respuestaCorrecta: boolean;
  puntos?: number;
  retroalimentacion?: Feedback;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface ShortAnswerActivity {
  tipo: 'short_answer';
  question: string;
  expectedAnswer: string;
  caseSensitive: boolean;
  maxLength: number;
  hint?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface FillBlank {
  id: string;
  respuesta: string;
  /** Accepted alternative spellings / synonyms. */
  alternativas?: string[];
  ignorarMayusculas?: boolean;
}

export interface FillBlanks {
  tipo: 'completar_blancos';
  /** Use `{{blank:id}}` markers to indicate blank positions in the text. */
  texto: string;
  blancos: FillBlank[];
  puntos?: number;
  retroalimentacion?: Feedback;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface DragDropItem {
  id: string;
  texto: string;
  imagenUrl?: string;
}

export interface DragDropZone {
  id: string;
  etiqueta: string;
  /** IDs of items that belong in this zone. */
  itemsCorrectos: string[];
  capacidadMaxima?: number;
}

export interface DragDrop {
  tipo: 'arrastrar_soltar';
  instruccion: string;
  items: DragDropItem[];
  zonas: DragDropZone[];
  puntos?: number;
  retroalimentacion?: Feedback;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface EmparejaLado {
  texto?: string;
  imagen?: string;
}

export interface MatchPair {
  id: string;
  izquierda: EmparejaLado;
  derecha: EmparejaLado;
}

/** @alias MatchPair */
export type EmparejaPar = MatchPair;

export interface MatchPairs {
  tipo: 'emparejar';
  instruccion: string;
  pares: MatchPair[];
  puntos?: number;
  retroalimentacion?: Feedback;
}

/** @alias MatchPairs */
export type EmparejarActivity = MatchPairs;

// ─────────────────────────────────────────────────────────────────────────────

export interface OrderStep {
  id: string;
  contenido: string;
  /** 1-based correct position. */
  ordenCorrecto: number;
  imagenUrl?: string;
}

export interface OrderSteps {
  tipo: 'ordenar_pasos';
  instruccion: string;
  pasos: OrderStep[];
  puntos?: number;
  retroalimentacion?: Feedback;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface VideoQuestion {
  id: string;
  tiempoSegundos: number;
  pregunta: string;
  opciones: QuizOption[];
  pausarVideo?: boolean;
}

export interface VideoInteractive {
  tipo: 'video_interactivo';
  urlVideo: string;
  plataforma?: 'youtube' | 'vimeo' | 'directo';
  preguntas: VideoQuestion[];
  debeResponderParaContinuar?: boolean;
  retroalimentacion?: Feedback;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface PollOption {
  id: string;
  texto: string;
}

export interface LivePoll {
  tipo: 'encuesta_viva';
  pregunta: string;
  opciones: PollOption[];
  mostrarResultadosEnTiempoReal?: boolean;
  mostrarResultadosAlFinalizar?: boolean;
  tiempoLimiteSeg?: number;
  multipleRespuesta?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface WordCloud {
  tipo: 'nube_palabras';
  instruccion: string;
  palabrasIniciales?: string[];
  maxPalabrasPorUsuario?: number;
  maxPalabrasEnNube?: number;
  filtrarPalabrasComunes?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

/** Torneo tipo Kahoot: preguntas de opción múltiple sincronizadas por el docente (Socket.IO). */
export interface TorneoActivity {
  tipo: 'torneo';
  preguntas: {
    enunciado: string;
    opciones: string[];
    correcta: string;
    tiempoSegundos: number;
  }[];
  puntosBase: number;
  bonusVelocidad: number;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface EscapeRoomSala {
  /** cuid generado al crear */
  id: string;
  nombre: string;
  descripcion: string;
  desafio: string;
  tipoRespuesta: 'texto' | 'opcion_multiple' | 'codigo';
  /** Solo si tipoRespuesta === "opcion_multiple". */
  opciones?: string[];
  respuestaCorrecta: string;
  ignorarMayusculas: boolean;
  pista?: string;
  intentosMaximos: number;
  /** Contenido visual del canvas de esta sala (bloques posicionados). */
  bloques?: Block[];
  /** Fondo visual de la sala. */
  fondo?: Background;
}

export interface EscapeRoomActivity {
  tipo: 'escape_room';
  titulo: string;
  introduccion: string;
  salas: EscapeRoomSala[];
  /** Sin límite si está omitido o es 0. */
  tiempoLimiteMinutos?: number;
  mostrarRanking: boolean;
  /** Puntos por sala al primer intento (por defecto 300). */
  puntosBase: number;
}

// ─── GRUPO 4 — ACTIVIDADES NUEVAS ────────────────────────────────────────────

// clasificar
export interface ClasificarCategoria {
  id: string;
  nombre: string;
  imagen?: string;
}

export interface ClasificarItem {
  id: string;
  texto: string;
  imagen?: string;
  categoriaId: string; // categoría correcta
}

export interface ClasificarActivity {
  tipo: 'clasificar';
  configuracion: {
    columnas: 2 | 3 | 4;
    colorCategorias: string[];
    permitirReintento: boolean;
  };
  categorias: ClasificarCategoria[];
  items: ClasificarItem[];
}

// globos
export interface GlobosPregunta {
  id: string
  enunciado: string
  opciones: { texto: string; correcta: boolean }[]
}

export interface GlobosActivity {
  tipo: 'globos'
  configuracion: {
    velocidad: 'lenta' | 'normal' | 'rapida'
    vidas: number
    tiempoLimite: number    // segundos
    colorGlobos: string[]
  }
  preguntas: GlobosPregunta[]
}

// topo
export interface TopoPregunta {
  id: string
  enunciado: string
  opciones: { texto: string; correcta: boolean }[]
}

export interface TopoActivity {
  tipo: 'topo'
  configuracion: {
    velocidad: 'lenta' | 'normal' | 'rapida'
    vidas: number
    tiempoLimite: number    // segundos
    filas: 2 | 3
    columnas: 3 | 4
  }
  preguntas: TopoPregunta[]
}

// ruleta
export interface RuletaActivity {
  tipo: 'ruleta'
  configuracion: {
    colores: string[]
    sonido: boolean
    duracionGiro: number    // ms
    mostrarGanador: boolean
  }
  items: { id: string; texto: string }[]
}

// memoria
export interface MemoriaPar {
  id: string;
  lado1: { texto?: string; imagen?: string };
  lado2: { texto?: string; imagen?: string };
}

export interface MemoriaActivity {
  tipo: 'memoria';
  configuracion: {
    columnas: 2 | 3 | 4;
    tiempoVolteo: number;
    colorDorso: string;
    /** Texto o emoji visible en el dorso de cada carta (p. ej. "?", "★", "Lumina"). */
    simboloDorso?: string;
    /** Color del símbolo del dorso. Por defecto blanco. */
    colorSimboloDorso?: string;
    mostrarTimer: boolean;
  };
  pares: MemoriaPar[];
}

// puzzle_imagen
export interface PuzzleImagenActivity {
  tipo: 'puzzle_imagen';
  configuracion: {
    filas: 3 | 4 | 5;
    columnas: 3 | 4 | 5;
    mostrarVista: boolean;
    dificultad: 'facil' | 'medio' | 'dificil';
  };
  imagen: string;
}

// sopa_letras
export interface SopaLetrasPalabra {
  texto: string;
  pista?: string;
}

export interface SopaLetrasActivity {
  tipo: 'sopa_letras';
  configuracion: {
    filas: number;
    columnas: number;
    direcciones: ('horizontal' | 'vertical' | 'diagonal')[];
    tema: string;
    mostrarLista: boolean;
  };
  palabras: SopaLetrasPalabra[];
  grid?: string[][];
}

// crucigrama
export interface CrucigramaPalabra {
  id: string;
  texto: string;
  pista: string;
  direccion: 'horizontal' | 'vertical';
  fila: number;
  columna: number;
}

export interface CrucigramaActivity {
  tipo: 'crucigrama';
  configuracion: {
    tamanoCelda: number;
    colorCelda: string;
    colorTexto: string;
  };
  palabras: CrucigramaPalabra[];
}

// anagrama
export interface AnagramaActivity {
  tipo: 'anagrama';
  configuracion: {
    mostrarPista: boolean;
    tiempoLimite?: number; // segundos; undefined = sin límite
    intentos: number; // intentos por palabra; 0 = ilimitado
  };
  palabras: { texto: string; pista?: string; imagen?: string }[];
}

// ahorcado
export interface AhorcadoConfig {
  palabra: string;
  pista?: string;
  categoria?: string;
  maxIntentos: number;
}

export interface AhorcadoState {
  letrasAdivinadas: string[];
  letrasFalladas: string[];
  intentosRestantes: number;
  completado: boolean;
  ganado: boolean | null;
}

export interface AhorcadoActivity {
  tipo: 'ahorcado';
  configuracion: AhorcadoConfig;
}

// puzzle_palabras
export interface PuzzlePalabrasActivity {
  tipo: 'puzzle_palabras';
  configuracion: {
    mostrarPista: boolean;
    permitirReintento: boolean;
  };
  oraciones: { texto: string; pista?: string }[];
}

// abrir_caja
export interface AbrirCajaContenido {
  texto?: string;
  imagen?: string;
  esCorrecta?: boolean;   // undefined = no evaluable
}

export interface AbrirCajaCaja {
  id: string;
  etiqueta: string;
  contenido: AbrirCajaContenido;
}

export interface AbrirCajaActivity {
  tipo: 'abrir_caja';
  configuracion: {
    filas: 2 | 3;
    columnas: 2 | 3 | 4;
    colorCaja: string;
    animacionApertura: 'flip' | 'zoom' | 'fade';
  };
  cajas: AbrirCajaCaja[];
}

export type HistoriaNodoTipo = 'narracion' | 'decision' | 'pregunta' | 'final_bueno' | 'final_malo'

export interface HistoriaOpcion {
  id: string
  texto: string
  esCorrecta?: boolean
  feedback?: string
}

export interface HistoriaNodo {
  id: string
  tipo: HistoriaNodoTipo
  titulo?: string
  contenido: {
    texto?: string
    imagen?: string
    video?: string
  }
  opciones?: HistoriaOpcion[]
  editorX: number    // posición en el canvas de react-flow
  editorY: number
}

export interface HistoriaConexion {
  id: string
  desdeNodoId: string
  opcionId: string       // ID de la opción que dispara esta conexión
  haciaNodoId: string
}

export interface HistoriaRamificadaActivity {
  tipo: 'historia_ramificada'
  configuracion: {
    mostrarProgreso: boolean
    permitirRetroceder: boolean
    tema: 'neutro' | 'aventura' | 'ciencia' | 'historia'
    fondoGlobal?: import('./slide.types').Background
  }
  nodoInicial: string     // id del nodo de inicio
  nodos: HistoriaNodo[]
  conexiones: HistoriaConexion[]
}

// ─── Activity (discriminated union) ──────────────────────────────────────────

export type Activity =
  | QuizMultiple
  | TrueFalse
  | ShortAnswerActivity
  | FillBlanks
  | DragDrop
  | MatchPairs
  | OrderSteps
  | VideoInteractive
  | LivePoll
  | WordCloud
  | TorneoActivity
  | EscapeRoomActivity
  | ClasificarActivity
  | MemoriaActivity
  | PuzzleImagenActivity
  | SopaLetrasActivity
  | CrucigramaActivity
  | AnagramaActivity
  | AhorcadoActivity
  | PuzzlePalabrasActivity
  | AbrirCajaActivity
  | GlobosActivity
  | TopoActivity
  | RuletaActivity
  | HistoriaRamificadaActivity;

export type ActivityTipo = Activity['tipo'];

// ─── Block variants ───────────────────────────────────────────────────────────

export type TextAlign = 'izquierda' | 'centro' | 'derecha' | 'justificado';
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface TextBlock {
  tipo: 'texto';
  contenido: string;
  nivel?: HeadingLevel;
  alineacion?: TextAlign;
  tamanoFuente?: string;
  negrita?: boolean;
  cursiva?: boolean;
  /** Familia tipográfica (p. ej. Inter, Georgia). */
  fuente?: string;
  /** Subrayado (persistido; el renderer puede mostrarlo cuando lo soporte). */
  subrayado?: boolean;
  color?: string;
  /** Canvas positioning — percentage of canvas dimensions (0-100). */
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

export interface ImageBlock {
  tipo: 'imagen';
  /** Identificador estable opcional (p. ej. para trazas o futuras APIs). */
  id?: string;
  url: string;
  alt?: string;
  /** CSS string (e.g. '100%') or canvas percentage number (0-100). */
  ancho?: string | number;
  /** CSS string (e.g. '100%') or canvas percentage number (0-100). */
  alto?: string | number;
  ajuste?: 'cubrir' | 'contener' | 'llenar';
  /** Keep original aspect ratio during corner resize in editor. */
  lockAspectRatio?: boolean;
  bordeRedondeado?: string;
  caption?: string;
  /** Canvas positioning — percentage of canvas dimensions (0-100). */
  x?: number;
  y?: number;
  zIndex?: number;
}

export interface VideoBlock {
  tipo: 'video';
  id?: string;
  url: string;
  plataforma?: 'youtube' | 'vimeo' | 'directo';
  autoplay?: boolean;
  controles?: boolean;
  bucle?: boolean;
  silenciado?: boolean;
  /** CSS string (e.g. '100%') or canvas percentage number (0-100). */
  ancho?: string | number;
  /** CSS string (e.g. '100%') or canvas percentage number (0-100). */
  alto?: string | number;
  /** Canvas positioning — percentage of canvas dimensions (0-100). */
  x?: number;
  y?: number;
  zIndex?: number;
}

export interface AudioBlock {
  tipo: 'audio';
  url: string;
  autoplay?: boolean;
  controles?: boolean;
  bucle?: boolean;
}

/** Posición y tamaño del bloque de actividad en % del área del slide (modo libre). */
export interface BlockMarco {
  izquierdaPct: number;
  arribaPct: number;
  anchoPct: number;
  altoPct: number;
}

export interface ActivityBlock {
  tipo: 'actividad';
  actividad: Activity;
  /** Si existe, el bloque flota sobre el lienzo y no ocupa una celda del grid del layout. */
  marco?: BlockMarco;
}

export interface CodeBlock {
  tipo: 'codigo';
  codigo: string;
  lenguaje?: string;
  mostrarNumeroLineas?: boolean;
  titulo?: string;
}

export interface QuoteBlock {
  tipo: 'cita';
  texto: string;
  autor?: string;
  fuente?: string;
}

export interface DividerBlock {
  tipo: 'separador';
  estilo?: 'solido' | 'punteado' | 'guionado';
  color?: string;
  grosor?: number;
}

export interface ColumnsBlock {
  tipo: 'columnas';
  /** Each inner array is the blocks for one column. */
  columnas: Block[][];
  proporcion?: string;
}

export interface FormaBlock {
  tipo: 'forma';
  id: string;
  forma: 'rectangulo' | 'circulo' | 'triangulo' | 'linea';
  color: string;
  /** Opacidad del relleno 0–100. */
  opacidad?: number;
  colorBorde?: string;
  grosorBorde?: number;
  ancho?: number;
  alto?: number;
  x?: number;
  y?: number;
  zIndex?: number;
}

// ─── Widgets (Captivate-style, no evaluables) ─────────────────────────────────

export type {
  CarouselWidget,
  ClickRevealWidget,
  PopupWidget,
  TabsWidget,
  TimelineWidget,
  HotspotWidget,
  TooltipWidget,
  BotonWidget,
  ContadorWidget,
  ProgresoWidget,
  WidgetAlineacion,
  WidgetCampoEstilo,
  WidgetCanvasPosition,
  WidgetElementPos,
  WidgetEstilosHeader,
  WidgetHeaderConfig,
  WidgetHeaderFields,
  WidgetImagenAjuste,
  WidgetItemVisibilidad,
  WidgetLayoutId,
  WidgetSlideContainerConfig,
  WidgetSlideContent,
  WidgetSlideCount,
  WidgetSlideVisibilidad,
  WidgetTipo,
} from './widget.types';

import type {
  CarouselWidget,
  ClickRevealWidget,
  PopupWidget,
  TabsWidget,
  TimelineWidget,
  HotspotWidget,
  TooltipWidget,
  BotonWidget,
  ContadorWidget,
  ProgresoWidget,
  WidgetCampoEstilo,
  WidgetElementPos,
} from './widget.types';

/** @deprecated Preferir WidgetCampoEstilo */
export type FlipCardsCampoEstilo = WidgetCampoEstilo;

/** Posición del texto dentro de la tarjeta (% del área útil). */
export type FlipCardElementPos = WidgetElementPos;

export interface FlipCardCara {
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
  /** Si se define, anula la visibilidad global del widget para esta tarjeta/cara */
  mostrarImagen?: boolean;
  mostrarTitulo?: boolean;
  mostrarCuerpo?: boolean;
  tituloPos?: FlipCardElementPos;
  cuerpoPos?: FlipCardElementPos;
  titulo: string;
  cuerpo: string;
  estiloTitulo?: FlipCardsCampoEstilo;
  estiloCuerpo?: FlipCardsCampoEstilo;
}

export interface FlipCard {
  id: string;
  frente: FlipCardCara;
  reverso: FlipCardCara;
}

export interface FlipCardsCaraVisibilidad {
  mostrarImagen: boolean;
  mostrarTitulo: boolean;
  mostrarCuerpo: boolean;
}

export interface FlipCardsWidget {
  tipo: 'flip-cards';
  configuracion: {
    columnas: 2 | 3 | 4;
    colorFondoContenedor: string;
    opacidadFondoContenedor?: number;
    colorFrente: string;
    colorReverso: string;
    bordeTarjetaGrosor?: number;
    bordeTarjetaColor?: string;
    bordeTarjetaRadio?: number;
    sombraTarjeta?: boolean;
    mostrarTituloWidget: boolean;
    mostrarSubtitulo: boolean;
    mostrarInstruccion: boolean;
    alineacionInstruccion?: 'izquierda' | 'centro' | 'derecha';
    /** @deprecated Usar mostrarBotonAnterior y mostrarBotonSiguiente */
    mostrarNavegacion?: boolean;
    mostrarBotonAnterior?: boolean;
    mostrarBotonSiguiente?: boolean;
    frente?: FlipCardsCaraVisibilidad;
    reverso?: FlipCardsCaraVisibilidad;
    /** Id de plantilla visual aplicada (`flip-cards-templates`). */
    plantillaId?: string;
    /** Espacio entre tarjetas en px */
    espacioEntreTarjetas?: number;
    /** Padding interno del contenedor en px */
    paddingContenedor?: number;
  };
  tituloWidget: string;
  subtituloWidget: string;
  instruccion: string;
  estilosHeader?: {
    tituloWidget?: FlipCardsCampoEstilo;
    subtituloWidget?: FlipCardsCampoEstilo;
    instruccion?: FlipCardsCampoEstilo;
  };
  tarjetas: FlipCard[];
  /** Posición en el lienzo libre (% del slide). */
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

// ─── Block (discriminated union) ──────────────────────────────────────────────

export type Block = (
  | TextBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | ActivityBlock
  | CodeBlock
  | QuoteBlock
  | DividerBlock
  | ColumnsBlock
  | FormaBlock
  | FlipCardsWidget
  | TabsWidget
  | CarouselWidget
  | ClickRevealWidget
  | PopupWidget
  | TimelineWidget
  | HotspotWidget
  | TooltipWidget
  | BotonWidget
  | ContadorWidget
  | ProgresoWidget
) & {
  animaciones?: import('@/types/animation.types').Animacion[];
};

export type BlockTipo = Block['tipo'];

// ─── Slide ────────────────────────────────────────────────────────────────────

export type SlideType = 'COVER' | 'CONTENT' | 'ACTIVITY' | 'VIDEO' | 'IMAGE';

/** Raw Fabric.js canvas content (used by the canvas editor). */
export interface CanvasContent {
  version: string;
  background: { type: 'color'; value: string };
  width: number;
  height: number;
  fabricJSON?: object;
}

/** Guías de alineación manuales del editor (coordenadas virtuales 1280×720). */
export interface SlideGuias {
  horizontales: number[];
  verticales: number[];
}

export const EMPTY_SLIDE_GUIAS: SlideGuias = {
  horizontales: [],
  verticales: [],
};

export interface Slide {
  id: string;
  order: number;
  type: SlideType;
  title: string;
  /** Block-based structured content. */
  bloques?: Block[];
  /** Guías persistentes del lienzo (solo editor). */
  guias?: SlideGuias;
  /** Free-canvas content (Fabric.js). Present when the slide was created via the canvas editor. */
  content?: CanvasContent | null;
  fondo?: Background;
  /** Id del tema visual activo (predefinido o personalizado). */
  temaId?: string;
  diseno?: Layout;
  /** Estimated display duration in seconds. */
  duracionSeg?: number;
  /** Speaker notes (not shown to students). */
  notas?: string;
  /**
   * En el API, el temporizador por slide suele persistirse en `content.timer`.
   * Campo opcional aquí solo para tipos locales / documentación.
   */
  timer?: number;
  transicion?: import('@/types/animation.types').TransicionSlide;
}

// ─── SlideClass ───────────────────────────────────────────────────────────────

export type SlideClassStatus = 'borrador' | 'publicado' | 'archivado';

/** Cómo se imparte la sesión con estudiantes (persistido en API como `modoEntrega`). */
export type ClassModoEntrega = 'clase' | 'presentacion' | 'autonomo';

export function parseClassModoEntrega(value: unknown): ClassModoEntrega {
  if (value === 'presentacion' || value === 'autonomo' || value === 'clase') {
    return value;
  }
  return 'clase';
}

export interface SlideClass {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  /** Código de unión en vivo (ej. LUM-XXXX). */
  codigo?: string;
  /** Segundos por defecto para temporizador en vivo (0 = desactivado). */
  timerGlobal?: number;
  /** Alineado con el backend: `clase` | `presentacion` | `autonomo`. */
  modoEntrega?: ClassModoEntrega;
  status: SlideClassStatus;
  slides: Slide[];
  createdAt: string;
  updatedAt?: string;
}

// ─── Canvas positioning fallbacks ─────────────────────────────────────────────
// Default coordinates (%) for blocks that pre-date the free-canvas system.

export const BLOCK_FALLBACKS = {
  text:  { x: 10, y: 10, ancho: 80, alto: 20 },
  image: { x: 25, y: 25, ancho: 50, alto: 50 },
  forma: { x: 10, y: 10, ancho: 30, alto: 30 },
  video: { x: 10, y: 30, ancho: 80, alto: 40 },
  flipCards: { x: 5, y: 5, ancho: 90, alto: 90 },
  tabs: { x: 5, y: 5, ancho: 90, alto: 90 },
  carousel: { x: 5, y: 5, ancho: 90, alto: 90 },
  clickReveal: { x: 5, y: 5, ancho: 90, alto: 90 },
  popup: { x: 42, y: 40, ancho: 3.75, alto: 6.667 },
  hotspot: { x: 48, y: 48, ancho: 4, alto: 4 },
  tooltip: { x: 48, y: 48, ancho: 4, alto: 4 },
  boton: { x: 40, y: 80, ancho: 20, alto: 8 },
  contador: { x: 36, y: 6, ancho: 28, alto: 16 },
  progreso: { x: 10, y: 4, ancho: 80, alto: 5 },
  timeline: { x: 5, y: 5, ancho: 90, alto: 90 },
  anagrama: { x: 5, y: 5, ancho: 90, alto: 90 },
  puzzle_palabras: { x: 5, y: 5, ancho: 90, alto: 90 },
  /** Contenido por defecto para nuevas actividades tipo torneo (3 preguntas de ejemplo). */
  torneo: {
    preguntas: [
      {
        enunciado: '¿Cuál es la capital de Colombia?',
        opciones: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
        correcta: 'Bogotá',
        tiempoSegundos: 20,
      },
      {
        enunciado: '¿En qué año se firmó la Constitución política de Colombia de 1991?',
        opciones: ['1986', '1991', '1994', '2001'],
        correcta: '1991',
        tiempoSegundos: 25,
      },
      {
        enunciado: '¿Cuál de estos es un departamento de la región Andina?',
        opciones: ['La Guajira', 'Cundinamarca', 'Chocó', 'Amazonas'],
        correcta: 'Cundinamarca',
        tiempoSegundos: 20,
      },
    ],
    puntosBase: 1000,
    bonusVelocidad: 500,
  },
  escape_room: {
    titulo: 'El Misterio del Laboratorio',
    introduccion:
      'Un experimento salió mal. Debes resolver los acertijos para escapar.',
    tiempoLimiteMinutos: 10,
    mostrarRanking: true,
    puntosBase: 300,
    salas: [
      {
        id: 'sala-1',
        nombre: 'La Sala de Química',
        descripcion: 'Los tubos de ensayo están desordenados. Identifica el compuesto.',
        desafio: '¿Cuál es la fórmula química del agua?',
        tipoRespuesta: 'texto',
        respuestaCorrecta: 'H2O',
        ignorarMayusculas: true,
        pista: 'Dos hidrógenos y un oxígeno',
        intentosMaximos: 3,
      },
      {
        id: 'sala-2',
        nombre: 'La Sala de Física',
        descripcion: 'El panel de control está bloqueado. Necesitas el código.',
        desafio: '¿A cuántos grados Celsius hierve el agua a nivel del mar?',
        tipoRespuesta: 'codigo',
        respuestaCorrecta: '100',
        ignorarMayusculas: false,
        pista: 'Es un número redondo',
        intentosMaximos: 2,
      },
      {
        id: 'sala-3',
        nombre: 'La Sala Final',
        descripcion: 'Una última pregunta para escapar.',
        desafio: '¿Cuál es el estado del agua a -10°C?',
        tipoRespuesta: 'opcion_multiple',
        opciones: ['Líquido', 'Sólido', 'Gaseoso', 'Plasma'],
        respuestaCorrecta: 'Sólido',
        ignorarMayusculas: true,
        intentosMaximos: 3,
      },
    ],
  },
} as const;
