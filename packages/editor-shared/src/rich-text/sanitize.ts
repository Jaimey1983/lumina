import type {
  RichDoc,
  RichMark,
  RichMarkType,
  RichNode,
  RichNodeType,
  RichRun,
} from '@lumina/types/rich-text';
import { asFiniteNumber } from './indent.js';

const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

/**
 * `href` seguro para render: esquemas allowlist (http/https/mailto/tel), anclas
 * (`#…`) y rutas relativas. Rechaza `javascript:`, `data:`, `vbscript:`, `file:`
 * y cualquier otro esquema. Se aplica al parsear, al persistir y al renderizar.
 */
export function isSafeHref(href: string | undefined | null): boolean {
  if (typeof href !== 'string') return false;
  const s = href.trim();
  if (s === '') return false;
  const scheme = s.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!scheme) return true; // relativo o `#ancla`
  return SAFE_SCHEMES.has(scheme[1]!.toLowerCase());
}

const MARK_TYPES = new Set<RichMarkType>([
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'color',
  'highlight',
  'size',
  'font',
  'tracking',
  'script',
  'link',
  'term',
  'spoiler',
  'lang',
]);

const NODE_TYPES = new Set<RichNodeType>([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'taskList',
  'listItem',
  'blockquote',
  'codeBlock',
  'callout',
  'hr',
  'math',
  'table',
  'tableRow',
  'tableCell',
]);

const isColor = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** Límites del documento saneado (evita pegados/IA gigantes). */
const MAX_NODES = 600;
const MAX_DEPTH = 8;

/** Copia validada del estilo tipográfico del bloque (nodo raíz). */
function sanitizeNodeStyle(node: RichNode, out: RichNode): void {
  if (isColor(node.fontFamily)) out.fontFamily = node.fontFamily;
  if (isColor(node.color)) out.color = node.color;
  if (Number.isFinite(node.fontSize) && (node.fontSize as number) >= 4 && (node.fontSize as number) <= 400) {
    out.fontSize = Math.round(node.fontSize as number);
  }
  if (typeof node.bold === 'boolean') out.bold = node.bold;
  if (typeof node.italic === 'boolean') out.italic = node.italic;
  if (typeof node.underline === 'boolean') out.underline = node.underline;
  if (Number.isFinite(node.lineHeight) && (node.lineHeight as number) > 0 && (node.lineHeight as number) <= 4) {
    out.lineHeight = node.lineHeight;
  }
  if (Number.isFinite(node.letterSpacing) && Math.abs(node.letterSpacing as number) <= 80) {
    out.letterSpacing = node.letterSpacing;
  }
}

/** Orden canónico de marcas — hace estable el round-trip con TipTap. */
const MARK_ORDER: RichMarkType[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'script',
  'color',
  'highlight',
  'size',
  'font',
  'tracking',
  'link',
  'term',
  'spoiler',
  'lang',
];
const markRank = (t: RichMarkType): number => {
  const i = MARK_ORDER.indexOf(t);
  return i === -1 ? MARK_ORDER.length : i;
};

/** Devuelve una marca saneada o `null` si es inválida / no permitida. */
export function sanitizeRichMark(mark: RichMark): RichMark | null {
  if (!mark || typeof mark !== 'object' || !MARK_TYPES.has(mark.t)) return null;
  switch (mark.t) {
    case 'bold':
    case 'italic':
    case 'underline':
    case 'strike':
    case 'code':
    case 'spoiler':
      return { t: mark.t };
    case 'color':
      return isColor(mark.value) ? { t: 'color', value: mark.value } : null;
    case 'font':
      return isColor(mark.family) ? { t: 'font', family: mark.family } : null;
    case 'lang':
      return isColor(mark.value) ? { t: 'lang', value: mark.value } : null;
    case 'highlight':
      return isColor(mark.value)
        ? {
            t: 'highlight',
            value: mark.value,
            ...(Number.isFinite(mark.alpha) ? { alpha: mark.alpha } : {}),
          }
        : null;
    case 'size':
      return Number.isFinite(mark.px) && mark.px > 0
        ? { t: 'size', px: Math.round(mark.px) }
        : null;
    case 'tracking':
      return Number.isFinite(mark.px) ? { t: 'tracking', px: mark.px } : null;
    case 'script':
      return mark.value === 'sup' || mark.value === 'sub'
        ? { t: 'script', value: mark.value }
        : null;
    case 'term':
      return isColor(mark.glosaId)
        ? {
            t: 'term',
            glosaId: mark.glosaId,
            ...(isColor(mark.definicion) ? { definicion: mark.definicion } : {}),
          }
        : null;
    case 'link': {
      const href = isSafeHref(mark.href) ? mark.href : undefined;
      const slideRef = Number.isInteger(mark.slideRef) ? mark.slideRef : undefined;
      if (href === undefined && slideRef === undefined) return null;
      return { t: 'link', ...(href ? { href } : {}), ...(slideRef !== undefined ? { slideRef } : {}) };
    }
    default:
      return null;
  }
}

function sanitizeRun(run: RichRun): RichRun | null {
  if (!run || typeof run.text !== 'string') return null;
  if (!Array.isArray(run.marks)) return { text: run.text };
  const seen = new Set<RichMarkType>();
  const marks = run.marks
    .map(sanitizeRichMark)
    .filter((m): m is RichMark => {
      if (m === null || seen.has(m.t)) return false;
      seen.add(m.t);
      return true;
    })
    .sort((a, b) => markRank(a.t) - markRank(b.t));
  return marks.length > 0 ? { text: run.text, marks } : { text: run.text };
}

/** Une runs contiguos con el mismo conjunto de marcas (serializado). */
function mergeRuns(runs: RichRun[]): RichRun[] {
  const out: RichRun[] = [];
  for (const run of runs) {
    const prev = out[out.length - 1];
    if (prev && JSON.stringify(prev.marks ?? null) === JSON.stringify(run.marks ?? null)) {
      prev.text += run.text;
    } else {
      out.push({ ...run });
    }
  }
  return out;
}

function sanitizeNode(node: RichNode, depth = 0): RichNode | null {
  if (!node || typeof node !== 'object' || !NODE_TYPES.has(node.type)) return null;
  if (depth > MAX_DEPTH) return null;
  const out: RichNode = { type: node.type };

  if (node.type === 'heading') {
    // Un `heading` sin nivel válido cae a H2 (nunca queda sin nivel → el bloque
    // perdía `nivel` en `syncTextBlockFromRichDoc`).
    out.level =
      node.level && node.level >= 1 && node.level <= 6 ? node.level : 2;
  }
  if (node.type === 'paragraph' || node.type === 'heading') {
    sanitizeNodeStyle(node, out);
  }
  if (
    node.align === 'izquierda' ||
    node.align === 'centro' ||
    node.align === 'derecha' ||
    node.align === 'justificado'
  ) {
    out.align = node.align;
  }
  const indent = asFiniteNumber(node.indent);
  const textIndent = asFiniteNumber(node.textIndent);
  const spaceBefore = asFiniteNumber(node.spaceBefore);
  const spaceAfter = asFiniteNumber(node.spaceAfter);
  if (indent !== undefined) out.indent = indent;
  if (textIndent !== undefined) out.textIndent = textIndent;
  if (spaceBefore !== undefined) out.spaceBefore = spaceBefore;
  if (spaceAfter !== undefined) out.spaceAfter = spaceAfter;
  if (typeof node.checked === 'boolean') out.checked = node.checked;
  if (typeof node.latex === 'string') out.latex = node.latex;
  if (typeof node.lang === 'string') out.lang = node.lang;
  if (node.variant === 'nota' || node.variant === 'aviso' || node.variant === 'tip') {
    out.variant = node.variant;
  }
  if (node.type === 'tableCell') {
    if (node.header === true) out.header = true;
    if (Number.isInteger(node.colspan) && (node.colspan as number) > 1) {
      out.colspan = node.colspan;
    }
    if (Number.isInteger(node.rowspan) && (node.rowspan as number) > 1) {
      out.rowspan = node.rowspan;
    }
  }

  if (Array.isArray(node.runs)) {
    const runs = mergeRuns(
      node.runs.map(sanitizeRun).filter((r): r is RichRun => r !== null),
    );
    if (runs.length > 0) out.runs = runs;
  }
  if (Array.isArray(node.children)) {
    const children = node.children
      .map((c) => sanitizeNode(c, depth + 1))
      .filter((n): n is RichNode => n !== null);
    if (children.length > 0) out.children = children;
  }

  // Listas/tablas/filas sin hijos y `math` sin fórmula no aportan nada; el resto
  // (paragraph, heading, blockquote, codeBlock, listItem, callout, hr, tableCell)
  // son bloques válidos aunque estén vacíos.
  if (
    (node.type === 'bulletList' ||
      node.type === 'orderedList' ||
      node.type === 'taskList' ||
      node.type === 'table' ||
      node.type === 'tableRow') &&
    out.children === undefined
  ) {
    return null;
  }
  if (node.type === 'math' && out.latex === undefined) return null;

  // Tablas rectangulares: una fila con menos celdas que la más ancha rompe el
  // esquema de TipTap al montar el editor. Se rellenan con celdas vacías.
  if (node.type === 'table' && out.children) {
    const width = Math.max(
      0,
      ...out.children.map((row) =>
        (row.children ?? []).reduce((n, c) => n + (c.colspan && c.colspan > 1 ? c.colspan : 1), 0),
      ),
    );
    for (const row of out.children) {
      const have = (row.children ?? []).reduce(
        (n, c) => n + (c.colspan && c.colspan > 1 ? c.colspan : 1),
        0,
      );
      if (have < width) {
        row.children = [
          ...(row.children ?? []),
          ...Array.from({ length: width - have }, () => ({
            type: 'tableCell' as const,
            runs: [{ text: '' }],
          })),
        ];
      }
    }
  }
  return out;
}

/** Cuenta nodos recursivamente (para el tope `MAX_NODES`). */
function countNodes(nodes: RichNode[]): number {
  let n = nodes.length;
  for (const node of nodes) if (node.children) n += countNodes(node.children);
  return n;
}

/** Recorta un párrafo vacío final (residuo de "Enter, Enter, borrar"). */
function trimTrailingEmptyParagraph(nodes: RichNode[]): RichNode[] {
  if (nodes.length <= 1) return nodes;
  const last = nodes[nodes.length - 1]!;
  if (last.type === 'paragraph' && (!last.runs || last.runs.length === 0)) {
    return nodes.slice(0, -1);
  }
  return nodes;
}

/** Documento saneado: recorta marcas/nodos fuera del esquema, `href` inseguros, y funde runs. */
export function sanitizeRichDoc(doc: RichDoc): RichDoc {
  let nodes = Array.isArray(doc?.nodes)
    ? doc.nodes.map((n) => sanitizeNode(n, 0)).filter((n): n is RichNode => n !== null)
    : [];
  nodes = trimTrailingEmptyParagraph(nodes);
  if (countNodes(nodes) > MAX_NODES) {
    // Recorte duro: nos quedamos con los primeros nodos hasta el tope.
    const kept: RichNode[] = [];
    let acc = 0;
    for (const node of nodes) {
      const size = 1 + (node.children ? countNodes(node.children) : 0);
      if (acc + size > MAX_NODES) break;
      kept.push(node);
      acc += size;
    }
    nodes = kept;
  }
  return { version: 1, nodes: nodes.length > 0 ? nodes : [{ type: 'paragraph' }] };
}
