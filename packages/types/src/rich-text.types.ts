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
  | 'table';

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
  /** hojas de texto (paragraph, heading, listItem, blockquote, codeBlock) */
  runs?: RichRun[];
  /** hijos de bloque (listas, blockquote, table) */
  children?: RichNode[];
}

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
