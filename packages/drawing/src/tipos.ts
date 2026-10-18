// ─── Modelo de escena (W1) ────────────────────────────────────────────────────
// Datos puros, sin React ni DOM. Las medidas están en «unidades de escena», no en
// píxeles de pantalla. El orden del arreglo `elementos` es el orden de apilado
// (el último queda al frente).

export const ESCENA_VERSION = 1;

/** Catálogo de formas (la geometría de cada una llega en W2). */
export const TIPOS_FORMA = [
  'rectangulo',
  'rectangulo-redondeado',
  'elipse',
  'circulo',
  'rombo',
  'triangulo',
  'triangulo-rectangulo',
  'trapecio',
  'trapecio-invertido',
  'paralelogramo',
  'pentagono',
  'hexagono',
  'octogono',
  'estrella',
  'cruz',
  'flecha-derecha',
  'flecha-izquierda',
  'flecha-doble',
  'cilindro',
  'nube',
  'llave',
  'callout',
] as const;
export type TipoForma = (typeof TIPOS_FORMA)[number];

export const PATRONES_LINEA = ['solido', 'guiones', 'puntos'] as const;
export type PatronLinea = (typeof PATRONES_LINEA)[number];

export const TRAZADOS = ['recto', 'ortogonal', 'curvo'] as const;
export type Trazado = (typeof TRAZADOS)[number];

export const EXTREMOS = ['ninguno', 'flecha', 'flecha-abierta', 'circulo', 'rombo'] as const;
export type Extremo = (typeof EXTREMOS)[number];

export const ALINEACIONES_H = ['izquierda', 'centro', 'derecha'] as const;
export type AlineacionH = (typeof ALINEACIONES_H)[number];

export const ALINEACIONES_V = ['arriba', 'medio', 'abajo'] as const;
export type AlineacionV = (typeof ALINEACIONES_V)[number];

/** Color: hex (`#rgb`, `#rrggbb`, `#rrggbbaa`) o token del tema `var(--nombre)` (sin fallback ni espacios). */
export type Color = string;

export interface Punto {
  x: number;
  y: number;
}

export interface Transformacion {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  /** Grados, en [0, 360). */
  rotacion: number;
}

export type Relleno =
  | { tipo: 'ninguno' }
  | { tipo: 'solido'; color: Color }
  | { tipo: 'degradado'; desde: Color; hasta: Color; /** Grados, en [0, 360). */ angulo: number };

export interface Contorno {
  color: Color;
  /** 0 = sin contorno. */
  grosor: number;
  patron: PatronLinea;
}

export interface Sombra {
  color: Color;
  desenfoque: number;
  dx: number;
  dy: number;
}

export interface Estilo {
  relleno: Relleno;
  contorno: Contorno;
  /** 0 (transparente) a 1 (opaco). */
  opacidad: number;
  sombra: Sombra | null;
  /** Radio de esquinas (formas que lo admiten). */
  radio: number;
}

export interface EstiloTexto {
  tamano: number;
  negrita: boolean;
  cursiva: boolean;
  subrayado: boolean;
  alineacionH: AlineacionH;
  alineacionV: AlineacionV;
  color: Color;
  /** Familia tipográfica; vacío = la del tema. */
  fuente: string;
}

/** Punto de unión de un conector con una forma: `puerto` es el índice del puerto que declara W2. */
export interface Conexion {
  elementoId: string;
  puerto: number;
}

interface ElementoBase {
  /** Único dentro de la escena. */
  id: string;
  nombre?: string;
  /** Texto alternativo para lectores de pantalla. */
  descripcion?: string;
  bloqueado: boolean;
  oculto: boolean;
}

export interface Forma extends ElementoBase {
  tipo: 'forma';
  forma: TipoForma;
  transformacion: Transformacion;
  estilo: Estilo;
  /** Texto dentro de la forma. */
  texto?: string;
  estiloTexto: EstiloTexto;
  /** Parámetros propios de la forma (p. ej. número de puntas de la estrella). */
  parametros?: Record<string, number>;
}

export interface Linea extends ElementoBase {
  tipo: 'linea';
  /** Mínimo 2, en coordenadas de escena. */
  puntos: Punto[];
  trazado: Trazado;
  inicio: Extremo;
  fin: Extremo;
  /** Conexión del primer extremo a una forma; si existe, manda sobre `puntos[0]`. */
  origen?: Conexion;
  destino?: Conexion;
  /** Solo se usan `contorno` y `opacidad`. */
  estilo: Estilo;
  /** Etiqueta del conector. */
  texto?: string;
  estiloTexto: EstiloTexto;
}

export interface Texto extends ElementoBase {
  tipo: 'texto';
  transformacion: Transformacion;
  estilo: Estilo;
  texto: string;
  estiloTexto: EstiloTexto;
}

/** Agrupa elementos que ya están en `elementos`; no tiene geometría propia (la derivan sus hijos). */
export interface Grupo extends ElementoBase {
  tipo: 'grupo';
  /** Ids de los hijos (mínimo 2). Un elemento pertenece como máximo a un grupo. */
  hijos: string[];
}

export type Elemento = Forma | Linea | Texto | Grupo;
export type TipoElemento = Elemento['tipo'];

export interface Escena {
  version: typeof ESCENA_VERSION;
  ancho: number;
  alto: number;
  /** Color de fondo; `null` = transparente. */
  fondo: Color | null;
  elementos: Elemento[];
}
