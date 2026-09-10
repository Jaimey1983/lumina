// ─── Rich text document (Fase 1 del motor de texto enriquecido) ───────────────
// Documento estructurado, portable y versionado. Es la fuente de verdad de un
// `TextBlock` cuando `contenidoRich` está presente; `contenido` (string plano) se
// deriva de él en cada commit para búsqueda, miniaturas y retrocompatibilidad.

import type { HeadingLevel, TextAlign } from './slide.types.js';

export type RichMark =
  | { t: 'bold' }
  | { t: 'italic' }
  | { t: 'underline' }
  | { t: 'strike' }
  | { t: 'code' }
  | { t: 'color'; value: string }
  | { t: 'highlight'; value: string; alpha?: number }
  | { t: 'size'; px: number }
  | { t: 'font'; family: string }
  | { t: 'tracking'; px: number }
  | { t: 'script'; value: 'sup' | 'sub' }
  | { t: 'link'; href?: string; slideRef?: number }
  | { t: 'term'; glosaId: string; definicion?: string }
  | { t: 'spoiler' }
  | { t: 'lang'; value: string };

export type RichMarkType = RichMark['t'];

/** Hoja de texto con marcas por rango. */
export interface RichRun {
  text: string;
  marks?: RichMark[];
}

export type RichNodeType =
  | 'paragraph'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'listItem'
  | 'blockquote'
  | 'codeBlock'
  | 'callout'
  | 'hr'
  | 'math'
  | 'table'
  | 'tableRow'
  | 'tableCell';

export interface RichNode {
  type: RichNodeType;
  /** heading */
  level?: HeadingLevel;
  /** override de alineación a nivel de nodo */
  align?: TextAlign;
  /** sangría en rem */
  indent?: number;
  spaceBefore?: number;
  spaceAfter?: number;
  /** taskList item */
  checked?: boolean;
  /** math */
  latex?: string;
  /** codeBlock — lenguaje para resaltado */
  lang?: string;
  /** callout */
  variant?: 'nota' | 'aviso' | 'tip';
  /** tableCell — celda de cabecera (`<th>`) */
  header?: boolean;
  /** tableCell — celdas / filas que abarca */
  colspan?: number;
  rowspan?: number;

  // ── Estilo tipográfico del bloque (Fase 1 del modelo único) ────────────────
  // Vive en el/los nodo(s) raíz de un bloque de texto simple. `TextBlock.*`
  // (`tamanoFuente`, `color`, `fuente`, `negrita`, …) se **deriva** de aquí en
  // `syncTextBlockFromRichDoc` / `normalizeTextBlock`. Todo opcional y aditivo:
  // los `contenidoRich` guardados sin estos campos siguen siendo válidos.
  /** Familia tipográfica (nombre, ej. `'Inter'`). */
  fontFamily?: string;
  /** Tamaño en px virtuales del slide. */
  fontSize?: number;
  /** Color del texto del nodo. */
  color?: string;
  /** Negrita de todo el nodo (distinto de la marca `bold` por rango). */
  bold?: boolean;
  /** Cursiva de todo el nodo. */
  italic?: boolean;
  /** Subrayado de todo el nodo. */
  underline?: boolean;
  /** Interlineado (multiplicador). */
  lineHeight?: number;
  /** Espaciado entre letras en px. */
  letterSpacing?: number;

  /** hojas de texto (paragraph, heading, listItem, blockquote, codeBlock) */
  runs?: RichRun[];
  /** hijos de bloque (listas, blockquote, table→tableRow→tableCell) */
  children?: RichNode[];
}

/** Claves de `RichNode` que forman el estilo tipográfico del bloque (nodo raíz). */
export const RICH_NODE_STYLE_KEYS = [
  'fontFamily',
  'fontSize',
  'color',
  'bold',
  'italic',
  'underline',
  'lineHeight',
  'letterSpacing',
] as const;

export type RichNodeStyleKey = (typeof RICH_NODE_STYLE_KEYS)[number];

export interface RichDoc {
  version: 1;
  nodes: RichNode[];
}

/** Type guard barato — un objeto con `version: 1` y `nodes: []`. */
export function isRichDoc(value: unknown): value is RichDoc {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { version?: unknown }).version === 1 &&
    Array.isArray((value as { nodes?: unknown }).nodes)
  );
}
