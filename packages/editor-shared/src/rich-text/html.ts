import type { CSSProperties } from 'react';
import type { RichDoc, RichMark, RichNode, RichRun } from '@lumina/types/rich-text';
import { richMarksToStyle } from './marks.js';
import { isSafeHref } from './sanitize.js';
import { HEADING_SCALE } from '../heading-scale.js';

const ALIGN_TO_CSS: Record<string, string> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
  justificado: 'justify',
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Tipografía del nodo raíz (Fase 1) + escala de encabezado como fallback. */
function nodeTypographyCssText(node: RichNode): CSSProperties {
  const out: CSSProperties = {};
  if (node.type === 'heading') {
    const s = HEADING_SCALE[(node.level ?? 2) as 1];
    out.fontSize = `${s.sizePx}px`;
    out.fontWeight = s.weight;
    out.lineHeight = s.lineHeight;
    out.letterSpacing = `${s.trackingPx}px`;
    out.margin = '0';
  }
  if (node.fontFamily) out.fontFamily = node.fontFamily;
  if (Number.isFinite(node.fontSize)) out.fontSize = `${node.fontSize}px`;
  if (node.color) out.color = node.color;
  if (node.bold === true) out.fontWeight = 'bold';
  else if (node.bold === false) out.fontWeight = 'normal';
  if (node.italic === true) out.fontStyle = 'italic';
  if (node.underline === true) out.textDecorationLine = 'underline';
  if (Number.isFinite(node.lineHeight)) out.lineHeight = node.lineHeight;
  if (Number.isFinite(node.letterSpacing)) out.letterSpacing = `${node.letterSpacing}px`;
  return out;
}

function styleToCssText(style: CSSProperties): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(';');
}

function findMark<T extends RichMark['t']>(
  marks: RichMark[] | undefined,
  t: T,
): Extract<RichMark, { t: T }> | undefined {
  return marks?.find((m) => m.t === t) as Extract<RichMark, { t: T }> | undefined;
}

function runToHtml(run: RichRun): string {
  const text = escapeHtml(run.text);
  const marks = run.marks;
  if (!marks || marks.length === 0) return text;

  const css = styleToCssText(richMarksToStyle(marks));
  let inner = css ? `<span style="${css}">${text}</span>` : text;

  const script = findMark(marks, 'script');
  if (script) inner = `<${script.value === 'sup' ? 'sup' : 'sub'}>${inner}</${script.value === 'sup' ? 'sup' : 'sub'}>`;

  if (findMark(marks, 'spoiler')) {
    // En HTML serializado (miniaturas / preview) no hay interacción → se difumina
    // para no filtrar la respuesta (el render React usa `SpoilerRun`).
    inner = `<span data-spoiler="1" style="filter:blur(5px);background:rgba(15,23,42,.08);border-radius:3px">${inner}</span>`;
  }
  const term = findMark(marks, 'term');
  if (term) inner = `<span data-term="${escapeHtml(term.glosaId)}">${inner}</span>`;

  const lang = findMark(marks, 'lang');
  if (lang) inner = `<span lang="${escapeHtml(lang.value)}">${inner}</span>`;

  const link = findMark(marks, 'link');
  if (link?.href && isSafeHref(link.href)) {
    inner = `<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  }
  return inner;
}

function runsToHtml(runs: RichRun[] | undefined): string {
  if (!runs || runs.length === 0) return '';
  return runs.map(runToHtml).join('');
}

function nodeStyle(node: RichNode): string {
  const style: CSSProperties = { ...nodeTypographyCssText(node) };
  if (node.align && ALIGN_TO_CSS[node.align]) {
    style.textAlign = ALIGN_TO_CSS[node.align] as CSSProperties['textAlign'];
  }
  if (Number.isFinite(node.indent)) style.marginInlineStart = `${node.indent}rem`;
  if (Number.isFinite(node.spaceBefore)) style.marginTop = `${node.spaceBefore}px`;
  if (Number.isFinite(node.spaceAfter)) style.marginBottom = `${node.spaceAfter}px`;
  const css = styleToCssText(style);
  return css ? ` style="${css}"` : '';
}

function nodeToHtml(node: RichNode): string {
  const s = nodeStyle(node);
  switch (node.type) {
    case 'heading': {
      const lvl = node.level ?? 2;
      return `<h${lvl}${s}>${runsToHtml(node.runs)}</h${lvl}>`;
    }
    case 'paragraph':
      return `<p${s}>${runsToHtml(node.runs) || '<br>'}</p>`;
    case 'blockquote':
      return `<blockquote${s}>${runsToHtml(node.runs)}</blockquote>`;
    case 'codeBlock':
      return `<pre${s}><code>${escapeHtml(
        (node.runs ?? []).map((r) => r.text).join(''),
      )}</code></pre>`;
    case 'callout':
      return `<div data-callout="${node.variant ?? 'nota'}"${s}>${runsToHtml(node.runs)}</div>`;
    case 'hr':
      return '<hr>';
    case 'math':
      return `<span data-math="1">${escapeHtml(node.latex ?? '')}</span>`;
    case 'bulletList':
    case 'orderedList':
    case 'taskList': {
      const tag = node.type === 'orderedList' ? 'ol' : 'ul';
      const items = (node.children ?? [])
        .map((li) => {
          const checkbox =
            node.type === 'taskList'
              ? `<input type="checkbox" disabled${li.checked ? ' checked' : ''}> `
              : '';
          return `<li>${checkbox}${runsToHtml(li.runs)}</li>`;
        })
        .join('');
      return `<${tag}${s}>${items}</${tag}>`;
    }
    case 'listItem':
      return `<li>${runsToHtml(node.runs)}</li>`;
    case 'table': {
      const rows = (node.children ?? [])
        .map((row) => {
          const cells = (row.children ?? [])
            .map((cell) => {
              const tag = cell.header ? 'th' : 'td';
              const attrs = [
                cell.colspan && cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '',
                cell.rowspan && cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '',
              ].join('');
              const cs = cell.header
                ? 'border:1px solid #cbd5e1;padding:.35em .55em;background:#f1f5f9;font-weight:600;text-align:left'
                : 'border:1px solid #cbd5e1;padding:.35em .55em;vertical-align:top';
              return `<${tag}${attrs} style="${cs}">${runsToHtml(cell.runs)}</${tag}>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      return `<table data-table="1" style="border-collapse:collapse;width:100%"><tbody>${rows}</tbody></table>`;
    }
    case 'tableRow':
    case 'tableCell':
      return '';
    default:
      return '';
  }
}

export interface RichToHtmlOptions {
  /** Resuelve `{{token}}` fuera del editor; en el editor se deja crudo. */
  resolveToken?: (name: string) => string | undefined;
}

/**
 * `RichDoc` → HTML string. Para miniaturas, `firstTextPreview` enriquecido y como
 * contrato testeable del mapeo nodo/marca → markup. El render principal del
 * canvas es React (`render-texto.tsx`), no esta cadena.
 */
export function richToHtml(doc: RichDoc, opts?: RichToHtmlOptions): string {
  if (!doc?.nodes?.length) return '';
  let html = doc.nodes.map(nodeToHtml).join('');
  if (opts?.resolveToken) {
    html = html.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (whole, name: string) => {
      const v = opts.resolveToken!(name);
      return v === undefined ? whole : escapeHtml(v);
    });
  }
  return html;
}
