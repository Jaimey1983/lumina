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

export interface MatchPair {
  id: string;
  izquierda: string;
  derecha: string;
  imagenIzquierda?: string;
  imagenDerecha?: string;
}

export interface MatchPairs {
  tipo: 'emparejar';
  instruccion: string;
  pares: MatchPair[];
  puntos?: number;
  retroalimentacion?: Feedback;
}

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
  | WordCloud;

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
  color?: string;
}

export interface ImageBlock {
  tipo: 'imagen';
  url: string;
  alt?: string;
  ancho?: string;
  alto?: string;
  ajuste?: 'cubrir' | 'contener' | 'llenar';
  bordeRedondeado?: string;
  caption?: string;
}

export interface VideoBlock {
  tipo: 'video';
  url: string;
  plataforma?: 'youtube' | 'vimeo' | 'directo';
  autoplay?: boolean;
  controles?: boolean;
  bucle?: boolean;
  silenciado?: boolean;
  ancho?: string;
  alto?: string;
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

// ─── Block (discriminated union) ──────────────────────────────────────────────

export type Block =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | ActivityBlock
  | CodeBlock
  | QuoteBlock
  | DividerBlock
  | ColumnsBlock;

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

export interface Slide {
  id: string;
  order: number;
  type: SlideType;
  title: string;
  /** Block-based structured content. */
  bloques?: Block[];
  /** Free-canvas content (Fabric.js). Present when the slide was created via the canvas editor. */
  content?: CanvasContent | null;
  fondo?: Background;
  diseno?: Layout;
  /** Estimated display duration in seconds. */
  duracionSeg?: number;
  /** Speaker notes (not shown to students). */
  notas?: string;
}

// ─── SlideClass ───────────────────────────────────────────────────────────────

export type SlideClassStatus = 'borrador' | 'publicado' | 'archivado';

export interface SlideClass {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  status: SlideClassStatus;
  slides: Slide[];
  createdAt: string;
  updatedAt?: string;
}
