import type {
  RichDoc,
  RichMark,
  RichMarkType,
  RichNode,
  RichNodeType,
  RichRun,
} from '@lumina/types/rich-text';

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
]);

const isColor = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

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
      return isColor(mark.glosaId) ? { t: 'term', glosaId: mark.glosaId } : null;
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
  const marks = Array.isArray(run.marks)
    ? run.marks.map(sanitizeRichMark).filter((m): m is RichMark => m !== null)
    : undefined;
  return marks && marks.length > 0 ? { text: run.text, marks } : { text: run.text };
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

function sanitizeNode(node: RichNode): RichNode | null {
  if (!node || typeof node !== 'object' || !NODE_TYPES.has(node.type)) return null;
  const out: RichNode = { type: node.type };

  if (node.type === 'heading' && node.level && node.level >= 1 && node.level <= 6) {
    out.level = node.level;
  }
  if (
    node.align === 'izquierda' ||
    node.align === 'centro' ||
    node.align === 'derecha' ||
    node.align === 'justificado'
  ) {
    out.align = node.align;
  }
  if (Number.isFinite(node.indent)) out.indent = node.indent;
  if (Number.isFinite(node.spaceBefore)) out.spaceBefore = node.spaceBefore;
  if (Number.isFinite(node.spaceAfter)) out.spaceAfter = node.spaceAfter;
  if (typeof node.checked === 'boolean') out.checked = node.checked;
  if (typeof node.latex === 'string') out.latex = node.latex;
  if (typeof node.lang === 'string') out.lang = node.lang;
  if (node.variant === 'nota' || node.variant === 'aviso' || node.variant === 'tip') {
    out.variant = node.variant;
  }

  if (Array.isArray(node.runs)) {
    const runs = mergeRuns(
      node.runs.map(sanitizeRun).filter((r): r is RichRun => r !== null),
    );
    if (runs.length > 0) out.runs = runs;
  }
  if (Array.isArray(node.children)) {
    const children = node.children
      .map(sanitizeNode)
      .filter((n): n is RichNode => n !== null);
    if (children.length > 0) out.children = children;
  }

  // Listas/tablas sin hijos y `math` sin fórmula no aportan nada; el resto
  // (paragraph, heading, blockquote, codeBlock, listItem, callout, hr) son
  // bloques válidos aunque estén vacíos.
  if (
    (node.type === 'bulletList' ||
      node.type === 'orderedList' ||
      node.type === 'taskList' ||
      node.type === 'table') &&
    out.children === undefined
  ) {
    return null;
  }
  if (node.type === 'math' && out.latex === undefined) return null;
  return out;
}

/** Documento saneado: recorta marcas/nodos fuera del esquema, `href` inseguros, y funde runs. */
export function sanitizeRichDoc(doc: RichDoc): RichDoc {
  const nodes = Array.isArray(doc?.nodes)
    ? doc.nodes.map(sanitizeNode).filter((n): n is RichNode => n !== null)
    : [];
  return { version: 1, nodes: nodes.length > 0 ? nodes : [{ type: 'paragraph' }] };
}
