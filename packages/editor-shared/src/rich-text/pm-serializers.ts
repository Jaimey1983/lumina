/**
 * Puente `RichDoc` ↔ documento JSON de TipTap/ProseMirror (Fase 2).
 *
 * Transformación pura de objetos — no importa TipTap, se testea en Node. El
 * `<RichTextEditor>` consume `richToPmDoc` como `content` inicial y produce
 * `pmDocToRich(editor.getJSON())` en cada commit.
 */

import type {
  RichDoc,
  RichMark,
  RichNode,
  RichRun,
} from '@lumina/types/rich-text';
import type { TextAlign } from '@lumina/types/slide';
import { sanitizeRichDoc } from './sanitize.js';

/** Forma mínima del JSON de TipTap que usamos (subconjunto de `JSONContent`). */
export interface PmJSON {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PmJSON[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

const ALIGNS: TextAlign[] = ['izquierda', 'centro', 'derecha', 'justificado'];
const isAlign = (v: unknown): v is TextAlign => ALIGNS.includes(v as TextAlign);

// ─── RichDoc → TipTap JSON ───────────────────────────────────────────────────

function runMarksToPm(marks: RichMark[] | undefined): PmJSON['marks'] {
  if (!marks || marks.length === 0) return undefined;
  const out: NonNullable<PmJSON['marks']> = [];
  const textStyle: Record<string, unknown> = {};

  for (const m of marks) {
    switch (m.t) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'code':
        out.push({ type: m.t === 'strike' ? 'strike' : m.t });
        break;
      case 'color':
        textStyle.color = m.value;
        break;
      case 'size':
        textStyle.fontSize = `${m.px}px`;
        break;
      case 'font':
        textStyle.fontFamily = m.family;
        break;
      case 'tracking':
        textStyle.letterSpacing = `${m.px}px`;
        break;
      case 'highlight':
        out.push({
          type: 'highlight',
          attrs: {
            color: m.value,
            ...(m.alpha !== undefined ? { alpha: m.alpha } : {}),
          },
        });
        break;
      case 'script':
        out.push({ type: m.value === 'sup' ? 'superscript' : 'subscript' });
        break;
      case 'link':
        out.push({
          type: 'link',
          attrs: {
            href: m.href ?? null,
            ...(m.slideRef !== undefined ? { slideRef: m.slideRef } : {}),
          },
        });
        break;
      case 'term':
        out.push({
          type: 'term',
          attrs: {
            glosaId: m.glosaId,
            ...(m.definicion !== undefined ? { definicion: m.definicion } : {}),
          },
        });
        break;
      case 'spoiler':
        out.push({ type: 'spoiler' });
        break;
      case 'lang':
        out.push({ type: 'lang', attrs: { value: m.value } });
        break;
    }
  }
  if (Object.keys(textStyle).length > 0) out.push({ type: 'textStyle', attrs: textStyle });
  return out.length > 0 ? out : undefined;
}

function runsToPmText(runs: RichRun[] | undefined): PmJSON[] {
  if (!runs) return [];
  return runs
    .filter((r) => r.text !== '')
    .map((r) => ({
      type: 'text',
      text: r.text,
      ...(runMarksToPm(r.marks) ? { marks: runMarksToPm(r.marks) } : {}),
    }));
}

/** Atributos de bloque de nodo (alineación + sangría + espaciado) para el JSON de TipTap. */
function blockAttrs(node: RichNode): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (node.align) out.align = node.align;
  if (Number.isFinite(node.indent)) out.indent = node.indent;
  if (Number.isFinite(node.spaceBefore)) out.spaceBefore = node.spaceBefore;
  if (Number.isFinite(node.spaceAfter)) out.spaceAfter = node.spaceAfter;
  return out;
}

function paragraphFromRuns(
  runs: RichRun[] | undefined,
  align?: TextAlign,
  extra?: Record<string, unknown>,
): PmJSON {
  const attrs = { ...(align ? { align } : {}), ...(extra ?? {}) };
  return {
    type: 'paragraph',
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    content: runsToPmText(runs),
  };
}

function listItemFromNode(node: RichNode, task: boolean): PmJSON {
  const body = paragraphFromRuns(node.runs);
  return task
    ? { type: 'taskItem', attrs: { checked: node.checked === true }, content: [body] }
    : { type: 'listItem', content: [body] };
}

function tableCellToPm(cell: RichNode): PmJSON {
  const attrs: Record<string, unknown> = {};
  if (Number.isInteger(cell.colspan) && (cell.colspan as number) > 1) {
    attrs.colspan = cell.colspan;
  }
  if (Number.isInteger(cell.rowspan) && (cell.rowspan as number) > 1) {
    attrs.rowspan = cell.rowspan;
  }
  return {
    type: cell.header ? 'tableHeader' : 'tableCell',
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    content: [paragraphFromRuns(cell.runs)],
  };
}

function tableRowToPm(row: RichNode): PmJSON {
  return {
    type: 'tableRow',
    content: (row.children ?? []).map(tableCellToPm),
  };
}

function nodeToPm(node: RichNode): PmJSON | null {
  switch (node.type) {
    case 'paragraph': {
      const { align: _a, ...rest } = blockAttrs(node);
      return paragraphFromRuns(node.runs, node.align, rest);
    }
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: node.level ?? 2, ...blockAttrs(node) },
        content: runsToPmText(node.runs),
      };
    case 'blockquote':
      return { type: 'blockquote', content: [paragraphFromRuns(node.runs)] };
    case 'codeBlock':
      return {
        type: 'codeBlock',
        ...(node.lang ? { attrs: { language: node.lang } } : {}),
        content: node.runs?.length
          ? [{ type: 'text', text: node.runs.map((r) => r.text).join('') }]
          : [],
      };
    case 'hr':
      return { type: 'horizontalRule' };
    case 'bulletList':
    case 'orderedList':
      return {
        type: node.type,
        content: (node.children ?? []).map((li) => listItemFromNode(li, false)),
      };
    case 'taskList':
      return {
        type: 'taskList',
        content: (node.children ?? []).map((li) => listItemFromNode(li, true)),
      };
    case 'callout':
      return {
        type: 'callout',
        attrs: { variant: node.variant ?? 'nota' },
        content: runsToPmText(node.runs),
      };
    case 'table': {
      const rows = (node.children ?? []).map(tableRowToPm).filter((r) => r.content?.length);
      return rows.length > 0 ? { type: 'table', content: rows } : null;
    }
    // math: el editor lo trata como nodo atómico (ver pm-extensions).
    default:
      return null;
  }
}

/** `RichDoc` → JSON de documento TipTap (`{ type: 'doc', content: [...] }`). */
export function richToPmDoc(doc: RichDoc): PmJSON {
  const content = (doc?.nodes ?? [])
    .map(nodeToPm)
    .filter((n): n is PmJSON => n !== null);
  return { type: 'doc', content: content.length > 0 ? content : [{ type: 'paragraph' }] };
}

// ─── TipTap JSON → RichDoc ───────────────────────────────────────────────────

function pmMarksToRun(marks: PmJSON['marks']): RichMark[] | undefined {
  if (!marks || marks.length === 0) return undefined;
  const out: RichMark[] = [];
  for (const mk of marks) {
    switch (mk.type) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'code':
        out.push({ t: mk.type } as RichMark);
        break;
      case 'superscript':
        out.push({ t: 'script', value: 'sup' });
        break;
      case 'subscript':
        out.push({ t: 'script', value: 'sub' });
        break;
      case 'highlight': {
        const value = mk.attrs?.color;
        if (typeof value === 'string') {
          const alpha = mk.attrs?.alpha;
          out.push({
            t: 'highlight',
            value,
            ...(typeof alpha === 'number' ? { alpha } : {}),
          });
        }
        break;
      }
      case 'link': {
        const href = typeof mk.attrs?.href === 'string' ? mk.attrs.href : undefined;
        const slideRef =
          typeof mk.attrs?.slideRef === 'number' ? mk.attrs.slideRef : undefined;
        if (href || slideRef !== undefined) {
          out.push({ t: 'link', ...(href ? { href } : {}), ...(slideRef !== undefined ? { slideRef } : {}) });
        }
        break;
      }
      case 'term':
        if (typeof mk.attrs?.glosaId === 'string') {
          const definicion =
            typeof mk.attrs?.definicion === 'string' && mk.attrs.definicion !== ''
              ? mk.attrs.definicion
              : undefined;
          out.push({
            t: 'term',
            glosaId: mk.attrs.glosaId,
            ...(definicion !== undefined ? { definicion } : {}),
          });
        }
        break;
      case 'spoiler':
        out.push({ t: 'spoiler' });
        break;
      case 'lang':
        if (typeof mk.attrs?.value === 'string') out.push({ t: 'lang', value: mk.attrs.value });
        break;
      case 'textStyle': {
        const a = mk.attrs ?? {};
        if (typeof a.color === 'string') out.push({ t: 'color', value: a.color });
        if (typeof a.fontFamily === 'string') out.push({ t: 'font', family: a.fontFamily });
        if (typeof a.fontSize === 'string' || typeof a.fontSize === 'number') {
          const px = parseFloat(String(a.fontSize));
          if (Number.isFinite(px)) out.push({ t: 'size', px: Math.round(px) });
        }
        if (typeof a.letterSpacing === 'string' || typeof a.letterSpacing === 'number') {
          const px = parseFloat(String(a.letterSpacing));
          if (Number.isFinite(px)) out.push({ t: 'tracking', px });
        }
        break;
      }
    }
  }
  return out.length > 0 ? out : undefined;
}

function pmInlineToRuns(content: PmJSON[] | undefined): RichRun[] | undefined {
  if (!content || content.length === 0) return undefined;
  const runs: RichRun[] = [];
  for (const child of content) {
    if (child.type === 'text' && typeof child.text === 'string') {
      const marks = pmMarksToRun(child.marks);
      runs.push({ text: child.text, ...(marks ? { marks } : {}) });
    } else if (child.type === 'hardBreak') {
      const last = runs[runs.length - 1];
      if (last) last.text += '\n';
      else runs.push({ text: '\n' });
    }
  }
  return runs.length > 0 ? runs : undefined;
}

function firstParagraphRuns(node: PmJSON): RichRun[] | undefined {
  const para = node.content?.find((c) => c.type === 'paragraph');
  return pmInlineToRuns(para?.content);
}

/** Lee sangría / espaciado del `attrs` de un nodo de bloque de TipTap. */
function pmBlockSpacing(attrs?: Record<string, unknown>): Partial<RichNode> {
  const out: Partial<RichNode> = {};
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const indent = n(attrs?.indent);
  const before = n(attrs?.spaceBefore);
  const after = n(attrs?.spaceAfter);
  if (indent !== undefined) out.indent = indent;
  if (before !== undefined) out.spaceBefore = before;
  if (after !== undefined) out.spaceAfter = after;
  return out;
}

function pmNodeToRich(node: PmJSON): RichNode | null {
  switch (node.type) {
    case 'paragraph': {
      const align = isAlign(node.attrs?.align) ? node.attrs.align : undefined;
      const runs = pmInlineToRuns(node.content);
      return {
        type: 'paragraph',
        ...(align ? { align } : {}),
        ...pmBlockSpacing(node.attrs),
        ...(runs ? { runs } : {}),
      };
    }
    case 'heading': {
      const lvlRaw = Number(node.attrs?.level);
      const level = (lvlRaw >= 1 && lvlRaw <= 6 ? lvlRaw : 2) as RichNode['level'];
      const align = isAlign(node.attrs?.align) ? node.attrs.align : undefined;
      const runs = pmInlineToRuns(node.content);
      return {
        type: 'heading',
        level,
        ...(align ? { align } : {}),
        ...pmBlockSpacing(node.attrs),
        ...(runs ? { runs } : {}),
      };
    }
    case 'blockquote': {
      const runs = firstParagraphRuns(node);
      return { type: 'blockquote', ...(runs ? { runs } : {}) };
    }
    case 'codeBlock': {
      const text = (node.content ?? [])
        .filter((c) => c.type === 'text')
        .map((c) => c.text ?? '')
        .join('');
      const lang = typeof node.attrs?.language === 'string' ? node.attrs.language : undefined;
      return {
        type: 'codeBlock',
        ...(lang ? { lang } : {}),
        ...(text !== '' ? { runs: [{ text }] } : {}),
      };
    }
    case 'horizontalRule':
      return { type: 'hr' };
    case 'bulletList':
    case 'orderedList':
      return {
        type: node.type,
        children: (node.content ?? []).map((li) => ({
          type: 'listItem' as const,
          runs: firstParagraphRuns(li) ?? [{ text: '' }],
        })),
      };
    case 'taskList':
      return {
        type: 'taskList',
        children: (node.content ?? []).map((li) => ({
          type: 'listItem' as const,
          checked: li.attrs?.checked === true,
          runs: firstParagraphRuns(li) ?? [{ text: '' }],
        })),
      };
    case 'callout': {
      const v = node.attrs?.variant;
      const variant = v === 'aviso' || v === 'tip' ? v : 'nota';
      const runs = pmInlineToRuns(node.content);
      return { type: 'callout', variant, ...(runs ? { runs } : {}) };
    }
    case 'table': {
      const rows = (node.content ?? [])
        .map(pmTableRowToRich)
        .filter((r): r is RichNode => r !== null);
      return rows.length > 0 ? { type: 'table', children: rows } : null;
    }
    default:
      return null;
  }
}

function pmTableCellToRich(cell: PmJSON): RichNode {
  const out: RichNode = {
    type: 'tableCell',
    runs: firstParagraphRuns(cell) ?? [{ text: '' }],
  };
  if (cell.type === 'tableHeader') out.header = true;
  const colspan = Number(cell.attrs?.colspan);
  const rowspan = Number(cell.attrs?.rowspan);
  if (Number.isInteger(colspan) && colspan > 1) out.colspan = colspan;
  if (Number.isInteger(rowspan) && rowspan > 1) out.rowspan = rowspan;
  return out;
}

function pmTableRowToRich(row: PmJSON): RichNode | null {
  const cells = (row.content ?? [])
    .filter((c) => c.type === 'tableCell' || c.type === 'tableHeader')
    .map(pmTableCellToRich);
  return cells.length > 0 ? { type: 'tableRow', children: cells } : null;
}

/** JSON de documento TipTap → `RichDoc` saneado. */
export function pmDocToRich(json: PmJSON): RichDoc {
  const nodes = (json?.content ?? [])
    .map(pmNodeToRich)
    .filter((n): n is RichNode => n !== null);
  return sanitizeRichDoc({ version: 1, nodes });
}
