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
/** Las 22 formas geométricas del catálogo (lo que ofrecen «Insertar» y «Cambiar forma»). */
export type TipoFormaGeometrica = (typeof TIPOS_FORMA)[number];

/**
 * Los iconos del catálogo (Y32a, DY86): formas con id propio, en una lista aparte para que `TIPOS_FORMA` siga siendo las 22 de siempre.
 * Se guarda solo el id (`icono-persona`): ni el nombre de una librería ni el trazado.
 */
export const TIPOS_ICONO = [
  'icono-persona',
  'icono-grupo',
  'icono-birrete',
  'icono-libro',
  'icono-documento',
  'icono-matraz',
  'icono-atomo',
  'icono-microscopio',
  'icono-bombilla',
  'icono-cerebro',
  'icono-lupa',
  'icono-check',
  'icono-error',
  'icono-alerta',
  'icono-pregunta',
  'icono-info',
  'icono-objetivo',
  'icono-engranaje',
  'icono-reloj',
  'icono-calendario',
  'icono-candado',
  'icono-ordenador',
  'icono-casa',
  'icono-mundo',
  'icono-sol',
  'icono-luna',
  'icono-gota',
  'icono-hoja',
  'icono-corazon',
  'icono-cohete',
] as const;

export type TipoIcono = (typeof TIPOS_ICONO)[number];

/** Todo lo que puede ser el `forma` de una forma: las 22 geométricas y los 30 iconos. */
export type TipoForma = TipoFormaGeometrica | TipoIcono;

/** Todos los ids de forma válidos para el normalizador. */
export const TIPOS_FORMA_VALIDOS: readonly TipoForma[] = [...TIPOS_FORMA, ...TIPOS_ICONO];

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

/** Lista del texto (Y24a): una marca por párrafo, `•` (puntos) o `1.`, `2.`… (números). */
export const VINETAS = ['puntos', 'numeros'] as const;
export type Vinetas = (typeof VINETAS)[number];

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

export const PATRONES_RELLENO = ['rayas', 'diagonal', 'cuadricula', 'puntos'] as const;
export type PatronRelleno = (typeof PATRONES_RELLENO)[number];

/** Parada intermedia de un degradado (Y23): entre `desde` (posición 0) y `hasta` (posición 1). */
export interface ParadaDegradado {
  /** En [0,05; 0,95]. */
  posicion: number;
  color: Color;
}

export type Relleno =
  | { tipo: 'ninguno' }
  | { tipo: 'solido'; color: Color }
  | {
      tipo: 'degradado';
      desde: Color;
      hasta: Color;
      /** Grados, en [0, 360). En un degradado radial se conserva pero no se usa. */
      angulo: number;
      /** Ausente = lineal. En radial, `desde` va en el centro y `hasta` en el borde. */
      forma?: 'radial';
      /** Hasta `LIMITES.paradasDegradado`, ordenadas por posición. Ausente = sin paradas intermedias. */
      paradas?: ParadaDegradado[];
    }
  | {
      /** Relleno con un dibujo que se repite (Y23): las líneas o puntos de `color` sobre `fondo` (`null` = transparente). */
      tipo: 'patron';
      patron: PatronRelleno;
      color: Color;
      fondo: Color | null;
      /** Lado del azulejo en unidades de escena. */
      escala: number;
    };

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
  /** Ausente = proyectada (fuera de la forma). Con `true`, la sombra se dibuja dentro de la forma (Y23). */
  interior?: true;
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
  /** Ausente = sin lista. Con lista, el texto se alinea a la izquierda (la `alineacionH` se conserva pero no se usa). */
  vinetas?: Vinetas;
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
  /** Rama plegada (Y38a): lo que cuelga de esta forma por sus conectores no se ve. Ausente = desplegada. */
  colapsado?: true;
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
