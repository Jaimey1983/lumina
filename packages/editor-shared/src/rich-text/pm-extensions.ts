/**
 * Esquema del editor de texto enriquecido (Fase 2). Lista de extensiones TipTap 3
 * que produce un `ProseMirror.Schema` capaz de representar todo `RichDoc`.
 *
 * El `<RichTextEditor>` la consume vía `useEditor`; los tests de esquema la pasan
 * a `getSchema()` de `@tiptap/core` sin instanciar un editor.
 */

import {
  Extension,
  InputRule,
  Mark,
  Node,
  markInputRule,
  markPasteRule,
  mergeAttributes,
} from '@tiptap/core';
import type { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  starInputRegex as boldStarInput,
  starPasteRegex as boldStarPaste,
} from '@tiptap/extension-bold';
import {
  Italic,
  starInputRegex as italicStarInput,
  starPasteRegex as italicStarPaste,
} from '@tiptap/extension-italic';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import { Placeholder } from '@tiptap/extension-placeholder';

const lowlight = createLowlight(common);
import { isSafeHref } from './sanitize.js';

const ALIGN_TO_CSS: Record<string, string> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
  justificado: 'justify',
};
const CSS_TO_ALIGN: Record<string, string> = {
  left: 'izquierda',
  center: 'centro',
  right: 'derecha',
  justify: 'justificado',
};

/** Nodos de bloque que aceptan alineación y estilo tipográfico de nodo. */
const BLOCK_STYLE_TYPES = [
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'taskList',
  'blockquote',
  'callout',
] as const;

/** `align` (valores del dominio Lumina) en nodos de bloque. */
const numAttr = (key: string, dataName: string, cssProp: string, unit: string) => ({
  default: null as number | null,
  parseHTML: (el: HTMLElement) => {
    const v = el.getAttribute(dataName);
    return v == null ? null : Number(v);
  },
  renderHTML: (attrs: Record<string, unknown>) => {
    const v = attrs[key] as number | null;
    return v == null || !Number.isFinite(v)
      ? {}
      : { [dataName]: String(v), style: `${cssProp}:${v}${unit}` };
  },
});

const NodeAlign = Extension.create({
  name: 'luminaNodeAlign',
  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_STYLE_TYPES],
        attributes: {
          align: {
            default: null,
            parseHTML: (el) => {
              const d = el.getAttribute('data-align');
              if (d && ALIGN_TO_CSS[d]) return d;
              const css = el.style.textAlign;
              return css && CSS_TO_ALIGN[css] ? CSS_TO_ALIGN[css] : null;
            },
            renderHTML: (attrs) => {
              const a = attrs.align as string | null;
              if (!a || !ALIGN_TO_CSS[a]) return {};
              return { 'data-align': a, style: `text-align:${ALIGN_TO_CSS[a]}` };
            },
          },
          indent: numAttr('indent', 'data-indent', 'margin-inline-start', 'rem'),
          textIndent: {
            default: null as number | null,
            parseHTML: (el: HTMLElement) => {
              const v = el.getAttribute('data-text-indent');
              return v == null ? null : Number(v);
            },
            renderHTML: (attrs: Record<string, unknown>) => {
              const v = attrs.textIndent as number | null;
              if (v == null || !Number.isFinite(v) || v === 0) return {};
              const hangPad =
                v < 0 ? `padding-inline-start:${Math.abs(v)}rem;` : '';
              return {
                'data-text-indent': String(v),
                style: `${hangPad}text-indent:${v}rem`,
              };
            },
          },
          spaceBefore: numAttr('spaceBefore', 'data-space-before', 'margin-top', 'px'),
          spaceAfter: numAttr('spaceAfter', 'data-space-after', 'margin-bottom', 'px'),
        },
      },
    ];
  },
});

/**
 * Estilo tipográfico del bloque en nodos de bloque (párrafo, heading, listas,
 * blockquote, callout): `fontFamily` / `fontSize` / `color` / `bold` / `italic` /
 * `underline` / `lineHeight` / `letterSpacing` como atributos del NODO.
 * `render-texto` y `pm-serializers` los tratan como el estilo del bloque; el
 * panel de propiedades escribe aquí cuando no hay selección de rango viva.
 */
const NodeBlockStyle = Extension.create({
  name: 'luminaNodeBlockStyle',
  addGlobalAttributes() {
    const numAttrPx = (cssProp: string, key: string, unit: 'px' | '') => ({
      default: null as number | null,
      parseHTML: (el: HTMLElement) => {
        const raw = el.style.getPropertyValue(cssProp);
        const n = raw ? parseFloat(raw) : NaN;
        return Number.isFinite(n) ? n : null;
      },
      renderHTML: (attrs: Record<string, unknown>) => {
        const v = attrs[key];
        return typeof v === 'number' && Number.isFinite(v)
          ? { style: `${cssProp}:${v}${unit}` }
          : {};
      },
    });
    const strAttr = (cssProp: string, key: string) => ({
      default: null as string | null,
      parseHTML: (el: HTMLElement) => el.style.getPropertyValue(cssProp) || null,
      renderHTML: (attrs: Record<string, unknown>) => {
        const v = attrs[key];
        return v ? { style: `${cssProp}:${v as string}` } : {};
      },
    });
    const boolAttr = (
      cssProp: string,
      key: string,
      onValue: string,
      offValue: string,
    ) => ({
      default: null as boolean | null,
      parseHTML: (el: HTMLElement) => {
        const raw = el.style.getPropertyValue(cssProp).trim();
        if (!raw) return null;
        if (raw.includes(onValue)) return true;
        if (raw.includes(offValue)) return false;
        return null;
      },
      renderHTML: (attrs: Record<string, unknown>) => {
        if (attrs[key] === true) return { style: `${cssProp}:${onValue}` };
        if (attrs[key] === false) return { style: `${cssProp}:${offValue}` };
        return {};
      },
    });
    return [
      {
        types: [...BLOCK_STYLE_TYPES],
        attributes: {
          fontFamily: strAttr('font-family', 'fontFamily'),
          fontSize: numAttrPx('font-size', 'fontSize', 'px'),
          color: strAttr('color', 'color'),
          bold: boolAttr('font-weight', 'bold', 'bold', 'normal'),
          italic: boolAttr('font-style', 'italic', 'italic', 'normal'),
          underline: boolAttr('text-decoration', 'underline', 'underline', 'none'),
          lineHeight: numAttrPx('line-height', 'lineHeight', ''),
          letterSpacing: numAttrPx('letter-spacing', 'letterSpacing', 'px'),
        },
      },
    ];
  },
});

/** `fontSize` / `fontFamily` / `letterSpacing` sobre el mark `textStyle`. */
const TextStyleExtras = Extension.create({
  name: 'luminaTextStyleExtras',
  addGlobalAttributes() {
    const styleAttr = (cssProp: string, attr: string) => ({
      default: null,
      parseHTML: (el: HTMLElement) => el.style.getPropertyValue(cssProp) || null,
      renderHTML: (attrs: Record<string, unknown>) => {
        const v = attrs[attr];
        return v ? { style: `${cssProp}: ${v as string}` } : {};
      },
    });
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: styleAttr('font-size', 'fontSize'),
          fontFamily: styleAttr('font-family', 'fontFamily'),
          letterSpacing: styleAttr('letter-spacing', 'letterSpacing'),
        },
      },
    ];
  },
});

/** `slideRef` en el mark `link` (además del `href` estándar). */
const LinkSlideRef = Extension.create({
  name: 'luminaLinkSlideRef',
  addGlobalAttributes() {
    return [
      {
        types: ['link'],
        attributes: {
          slideRef: {
            default: null,
            parseHTML: (el: HTMLElement) => {
              const v = el.getAttribute('data-slide-ref');
              return v == null ? null : Number(v);
            },
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.slideRef == null ? {} : { 'data-slide-ref': String(attrs.slideRef) },
          },
        },
      },
    ];
  },
});

/** `alpha` (0–100) en el mark `highlight`. */
const HighlightAlpha = Extension.create({
  name: 'luminaHighlightAlpha',
  addGlobalAttributes() {
    return [
      {
        types: ['highlight'],
        attributes: {
          alpha: {
            default: null,
            parseHTML: (el: HTMLElement) => {
              const v = el.getAttribute('data-alpha');
              return v == null ? null : Number(v);
            },
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.alpha == null ? {} : { 'data-alpha': String(attrs.alpha) },
          },
        },
      },
    ];
  },
});

const Term = Mark.create({
  name: 'term',
  addAttributes() {
    return {
      glosaId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-term'),
        renderHTML: (attrs) => (attrs.glosaId ? { 'data-term': attrs.glosaId } : {}),
      },
      definicion: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-definicion'),
        renderHTML: (attrs) =>
          attrs.definicion
            ? { 'data-definicion': String(attrs.definicion), title: String(attrs.definicion) }
            : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-term]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

const Spoiler = Mark.create({
  name: 'spoiler',
  parseHTML() {
    return [{ tag: 'span[data-spoiler]' }];
  },
  renderHTML() {
    return ['span', { 'data-spoiler': '1' }, 0];
  },
});

const Lang = Mark.create({
  name: 'lang',
  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: (el) => el.getAttribute('lang'),
        renderHTML: (attrs) => (attrs.value ? { lang: attrs.value } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[lang]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

/**
 * Nodo de bloque «fórmula» (LaTeX) — Fase 5B. Atómico: en el editor se muestra
 * el LaTeX crudo en un recuadro; el viewer lo renderiza con KaTeX (carga
 * perezosa). No mete KaTeX en el bundle del editor.
 */
const MathBlock = Node.create({
  name: 'math',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-latex') ?? el.textContent ?? '',
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-latex': String(attrs.latex ?? ''),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-math]' }, { tag: 'span[data-math]' }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-math': '1' }),
      String((node.attrs as { latex?: string }).latex ?? ''),
    ];
  },
});

const CALLOUT_VARIANTS = ['nota', 'aviso', 'tip'] as const;

/** Nodo de bloque «llamada» (nota / aviso / tip) — Fase 5B. */
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: 'nota',
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-callout');
          return (CALLOUT_VARIANTS as readonly string[]).includes(v ?? '') ? v : 'nota';
        },
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-callout': String(attrs.variant ?? 'nota'),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
});

/**
 * Bold / Italic que SOLO disparan con `*` / `**` — nunca con `_` / `__`, para no
 * convertir `snake_case` o `__init__` en formato al escribir o pegar (Fase 5A).
 */
const BoldStarOnly = Bold.extend({
  addInputRules() {
    return [markInputRule({ find: boldStarInput, type: this.type })];
  },
  addPasteRules() {
    return [markPasteRule({ find: boldStarPaste, type: this.type })];
  },
});

const ItalicStarOnly = Italic.extend({
  addInputRules() {
    return [markInputRule({ find: italicStarInput, type: this.type })];
  },
  addPasteRules() {
    return [markPasteRule({ find: italicStarPaste, type: this.type })];
  },
});

/** Reemplazos tipográficos al escribir: `--` → em‑dash, `...` → elipsis. */
const SmartTypography = Extension.create({
  name: 'luminaSmartTypography',
  addInputRules() {
    return [
      new InputRule({
        find: /--$/,
        handler: ({ range, commands }) => {
          commands.insertContentAt(range, '—');
        },
      }),
      new InputRule({
        find: /\.\.\.$/,
        handler: ({ range, commands }) => {
          commands.insertContentAt(range, '…');
        },
      }),
    ];
  },
});

export interface RichTextExtensionOptions {
  placeholder?: string;
}

export function richTextExtensions(opts: RichTextExtensionOptions = {}): Extensions {
  return [
    StarterKit.configure({
      // Bold/Italic propios (solo `*`/`**`) — ver BoldStarOnly / ItalicStarOnly.
      bold: false,
      italic: false,
      // `link` de StarterKit v3: validado con isSafeHref; `slideRef` lo añade LinkSlideRef.
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        isAllowedUri: (url: string) => isSafeHref(url),
      },
      // codeBlock: lo reemplaza CodeBlockLowlight (resaltado con lowlight).
      codeBlock: false,
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: { spellcheck: 'false' },
    }),
    BoldStarOnly,
    ItalicStarOnly,
    SmartTypography,
    TextStyle,
    TextStyleExtras,
    Color,
    Highlight.configure({ multicolor: true }),
    HighlightAlpha,
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({ nested: false }),
    TableKit.configure({ table: { resizable: false } }),
    NodeAlign,
    NodeBlockStyle,
    LinkSlideRef,
    Term,
    Spoiler,
    Lang,
    Callout,
    MathBlock,
    Placeholder.configure({
      placeholder: opts.placeholder ?? 'Escribe…',
      showOnlyWhenEditable: true,
    }),
  ];
}
