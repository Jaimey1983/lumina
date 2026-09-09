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
import { Placeholder } from '@tiptap/extension-placeholder';
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

/** `align` (valores del dominio Lumina) en paragraph / heading. */
const NodeAlign = Extension.create({
  name: 'luminaNodeAlign',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
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
      // codeBlock: sin resaltado por ahora (Fase 5B añade lowlight).
      codeBlock: { HTMLAttributes: { spellcheck: 'false' } },
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
    NodeAlign,
    LinkSlideRef,
    Term,
    Spoiler,
    Lang,
    Placeholder.configure({
      placeholder: opts.placeholder ?? 'Escribe…',
      showOnlyWhenEditable: true,
    }),
  ];
}
