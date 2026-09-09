'use client';

import {
  createElement,
  cloneElement,
  isValidElement,
  lazy,
  Suspense,
  useState,
  useRef,
  useEffect,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { HeadingLevel, TextBlock } from '@lumina/types/slide';
import type { RichDoc, RichMark, RichNode, RichRun } from '@lumina/types/rich-text';
import { typographyFromTextBlock, typographyToCss } from '@lumina/editor-shared/typography';
import { fontFamilyWithFallback } from '@lumina/editor-shared/font-catalog';
import { headingFallbackCss, effectiveFontSizePx } from '@lumina/editor-shared/heading-scale';
import {
  textBlockBoxCss,
  textBlockColumnsCss,
  hexWithOpacity,
} from '@lumina/editor-shared/text-box';
import {
  richMarksToStyle,
  isSafeHref,
  useTextTokens,
  makeTokenResolver,
  interpolateTokens,
} from '@lumina/editor-shared/rich-text';
import { useSlideNav } from '@lumina/editor-shared/slide-nav-context';
import { getRichDoc } from './rich-text.js';
import { SpoilerRun } from './spoiler-mark.js';

type ResolveToken = (name: string) => string | undefined;
interface RenderCtx {
  resolveToken?: ResolveToken;
  /** true en el editor / no interactivo → los spoilers salen ya revelados. */
  spoilerRevealed?: boolean;
  /**
   * Overrides explícitos del bloque para la escala de encabezado — el `nivel`
   * puede vivir en el nodo del `RichDoc` (`heading.level`), no solo en
   * `block.nivel`; el render deriva la escala del nodo salvo estos overrides.
   */
  headingOverride?: {
    tamanoFuente?: string;
    negrita?: boolean;
    espaciadoLetras?: number;
    interlineado?: number;
  };
}

/**
 * El editor enriquecido (TipTap) se carga sólo al entrar en edición inline —
 * nunca en viewer / preview / miniatura, para no llevar `@tiptap/*` a esos bundles.
 */
const RichTextEditorLazy = lazy(() =>
  import('@lumina/editor-shared/rich-text/rich-text-editor').then((m) => ({
    default: m.RichTextEditor,
  })),
);

export const TEXT_ALIGN_MAP: Record<string, CSSProperties['textAlign']> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
  justificado: 'justify',
};

export function textBlockContenidoIsEmpty(block: TextBlock): boolean {
  const c = block.contenido;
  return c === undefined || c === '';
}

export function textBlockFontSizePx(block: TextBlock): number {
  return effectiveFontSizePx(block.tamanoFuente, block.nivel);
}

/**
 * Estilo derivado de `block.nivel` (H1–H6) — solo para los campos que el bloque
 * no fija explícitamente. `{}` cuando no hay nivel. El ajuste manual gana.
 */
export function textBlockHeadingFallbackStyle(block: TextBlock): CSSProperties {
  return headingFallbackCss(block.nivel, {
    tamanoFuente: block.tamanoFuente,
    negrita: block.negrita,
    espaciadoLetras: block.espaciadoLetras,
    interlineado: block.interlineado,
  });
}

export function emptyTextPlaceholderLabel(block: TextBlock): string {
  return textBlockFontSizePx(block) >= 28
    ? 'Haga clic para agregar título'
    : 'Haga clic para editar · Shift+Enter para confirmar';
}

/** Estilos opcionales del JSON de texto: solo se añaden si el campo viene definido. */
export function textBlockOptionalVisualStyle(block: TextBlock): CSSProperties {
  const out: CSSProperties = {
    ...typographyToCss(typographyFromTextBlock(block)),
  };
  if (block.fuente !== undefined && block.fuente !== '') {
    out.fontFamily = fontFamilyWithFallback(block.fuente);
  }
  if (block.subrayado === true) {
    out.textDecoration = 'underline';
  }
  if (block.interlineado !== undefined) {
    out.lineHeight = block.interlineado;
  }
  if (block.espaciadoLetras !== undefined) {
    out.letterSpacing = `${block.espaciadoLetras}px`;
  }
  if (block.fondoTexto && block.fondoTextoOpacidad !== undefined) {
    out.backgroundColor = hexWithOpacity(block.fondoTexto, block.fondoTextoOpacidad);
  }
  return { ...out, ...textBlockColumnsCss(block) };
}

export function InlineTextEditor({
  block,
  onCommit,
  onDiscard,
}: {
  block: TextBlock;
  onCommit: (text: string) => void;
  onDiscard: () => void;
}) {
  const [value, setValue] = useState(block.contenido ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** Guards against double-fire from blur + Enter/Escape. */
  const exitedRef = useRef(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.select();
  }, []);

  function commit() {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onCommit(value);
  }

  function discard() {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onDiscard();
  }

  const isEmpty = value === '';
  const headingCss = textBlockHeadingFallbackStyle(block);

  return (
    <div
      className="relative h-full w-full min-h-0"
      style={
        isEmpty
          ? { border: '2px dashed #aaa', boxSizing: 'border-box' }
          : undefined
      }
    >
      {isEmpty && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 block w-[calc(100%-8px)] max-w-full -translate-x-1/2 -translate-y-1/2 px-1 text-center leading-snug"
          style={{
            color: '#bbb',
            fontSize: 'clamp(10px, 1.6vw, 13px)',
          }}
        >
          {emptyTextPlaceholderLabel(block)}
        </span>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            discard();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: '2px',
          border: 'none',
          outline: 'none',
          background: isEmpty ? 'transparent' : 'rgba(255,255,255,0.05)',
          resize: 'none',
          cursor: 'text',
          ...headingCss,
          fontSize:
            block.tamanoFuente && block.tamanoFuente !== ''
              ? block.tamanoFuente
              : headingCss.fontSize,
          fontWeight:
            block.negrita === true
              ? 'bold'
              : block.negrita === false
                ? 'normal'
                : (headingCss.fontWeight ?? 'normal'),
          fontStyle: block.cursiva ? 'italic' : 'normal',
          color: block.color ?? 'inherit',
          textAlign: block.alineacion
            ? (TEXT_ALIGN_MAP[block.alineacion] ?? 'left')
            : 'left',
          overflowY: 'auto',
          boxSizing: 'border-box',
          zIndex: 1,
          ...textBlockOptionalVisualStyle(block),
        }}
      />
    </div>
  );
}

export interface RenderTextProps {
  block: TextBlock;
  modo?: 'editor' | 'viewer';
  isEditing?: boolean;
  /** Un único commit por gesto de edición, con el documento enriquecido. */
  onCommit?: (doc: RichDoc) => void;
  onDiscard?: () => void;
}

export function RenderText({
  block,
  modo = 'viewer',
  isEditing,
  onCommit,
  onDiscard,
}: RenderTextProps) {
  const nav = useSlideNav();
  const tokens = useTextTokens();

  if (isEditing && onCommit && onDiscard) {
    return (
      <Suspense fallback={<div style={{ position: 'absolute', inset: 0 }} />}>
        <RichTextEditorLazy
          value={getRichDoc(block)}
          onCommit={onCommit}
          onDiscard={onDiscard}
          placeholder={emptyTextPlaceholderLabel(block)}
          style={{ position: 'absolute', inset: 0 }}
        />
      </Suspense>
    );
  }

  if (modo === 'editor' && textBlockContenidoIsEmpty(block)) {
    return (
      <div
        className="relative box-border h-full min-h-[1.25em] w-full"
        style={{ border: '2px dashed #aaa' }}
      >
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 block w-[calc(100%-8px)] max-w-full -translate-x-1/2 -translate-y-1/2 px-1 text-center leading-snug"
          style={{
            color: '#bbb',
            fontSize: 'clamp(10px, 1.6vw, 13px)',
          }}
        >
          {emptyTextPlaceholderLabel(block)}
        </span>
      </div>
    );
  }

  const isList = block.lista === 'vinetas' || block.lista === 'numeros';
  const headingCss = textBlockHeadingFallbackStyle(block);
  const style: CSSProperties = {
    margin: 0,
    whiteSpace: isList ? 'normal' : 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: block.alineacion ? TEXT_ALIGN_MAP[block.alineacion] : undefined,
    ...headingCss,
    fontSize:
      block.tamanoFuente && block.tamanoFuente !== ''
        ? block.tamanoFuente
        : headingCss.fontSize,
    fontWeight:
      block.negrita === true
        ? 'bold'
        : block.negrita === false
          ? undefined
          : headingCss.fontWeight,
    fontStyle: block.cursiva ? 'italic' : undefined,
    color: block.color,
    ...textBlockOptionalVisualStyle(block),
    ...(isList
      ? {
          paddingLeft: '1.2em',
          listStyleType: block.lista === 'numeros' ? 'decimal' : 'disc',
        }
      : {}),
  };
  // El nodo ra\u00edz del RichDoc ya refleja lista / nivel / alineaci\u00f3n del bloque.
  const doc = getRichDoc(block);
  const ctx: RenderCtx = {
    // Los tokens `{{...}}` se resuelven s\u00f3lo fuera del editor.
    resolveToken:
      modo === 'editor'
        ? undefined
        : makeTokenResolver(
            { slideIndex: nav.slideIndex, slideCount: nav.slideCount },
            tokens.extra,
          ),
    spoilerRevealed: modo === 'editor',
    headingOverride: {
      tamanoFuente: block.tamanoFuente,
      negrita: block.negrita,
      espaciadoLetras: block.espaciadoLetras,
      interlineado: block.interlineado,
    },
  };
  const inner =
    doc.nodes.length === 1
      ? richNodeToElement(doc.nodes[0]!, 0, style, ctx)
      : createElement(
          'div',
          { style },
          doc.nodes.map((n, i) => richNodeToElement(n, i, undefined, ctx)),
        );

  // Caja del bloque (relleno / borde / sombra / alineación vertical): sólo se
  // añade el envoltorio si el bloque define algo — si no, DOM idéntico a antes.
  const box = textBlockBoxCss(block);
  return box ? createElement('div', { style: box }, inner) : inner;
}

// \u2500\u2500\u2500 Render de RichDoc \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function findMark<T extends RichMark['t']>(
  marks: RichMark[] | undefined,
  t: T,
): Extract<RichMark, { t: T }> | undefined {
  return marks?.find((m) => m.t === t) as Extract<RichMark, { t: T }> | undefined;
}

function renderRun(run: RichRun, key: number, ctx?: RenderCtx): ReactNode {
  const text = ctx?.resolveToken ? interpolateTokens(run.text, ctx.resolveToken) : run.text;
  const marks = run.marks;
  if (!marks || marks.length === 0) return text;

  let node: ReactNode = text;
  const markStyle = richMarksToStyle(marks);
  if (Object.keys(markStyle).length > 0) {
    node = createElement('span', { style: markStyle }, node);
  }
  const script = findMark(marks, 'script');
  if (script) node = createElement(script.value === 'sup' ? 'sup' : 'sub', null, node);
  if (findMark(marks, 'spoiler')) {
    node = createElement(SpoilerRun, { revealed: ctx?.spoilerRevealed }, node);
  }
  const term = findMark(marks, 'term');
  if (term) node = createElement('span', { 'data-term': term.glosaId }, node);
  const lang = findMark(marks, 'lang');
  if (lang) node = createElement('span', { lang: lang.value }, node);
  const link = findMark(marks, 'link');
  if (link?.href && isSafeHref(link.href)) {
    node = createElement(
      'a',
      { href: link.href, target: '_blank', rel: 'noopener noreferrer' },
      node,
    );
  }
  return isValidElement(node)
    ? cloneElement(node as ReactElement, { key })
    : createElement('span', { key }, node);
}

function renderRuns(runs: RichRun[] | undefined, ctx?: RenderCtx): ReactNode {
  if (!runs || runs.length === 0) return null;
  if (runs.length === 1 && (!runs[0]!.marks || runs[0]!.marks.length === 0)) {
    const t = runs[0]!.text;
    return ctx?.resolveToken ? interpolateTokens(t, ctx.resolveToken) : t;
  }
  return runs.map((r, i) => renderRun(r, i, ctx));
}

function richNodeToElement(
  node: RichNode,
  key: number | string,
  style?: CSSProperties,
  ctx?: RenderCtx,
): ReactNode {
  switch (node.type) {
    case 'heading': {
      const lvl = (node.level ?? 2) as HeadingLevel;
      // La escala (tamaño/peso/interlineado/tracking) se deriva del nivel del
      // NODO — el ajuste manual del bloque (si existe) gana vía `headingOverride`.
      const scale = headingFallbackCss(lvl, ctx?.headingOverride ?? {});
      return createElement(
        `h${lvl}`,
        { key, style: { ...style, ...scale } },
        renderRuns(node.runs, ctx),
      );
    }
    case 'blockquote':
      return createElement(
        'blockquote',
        { key, style },
        renderRuns(node.runs, ctx),
      );
    case 'codeBlock':
      // El c\u00f3digo no interpola tokens.
      return createElement(
        'pre',
        { key, style },
        createElement('code', null, (node.runs ?? []).map((r) => r.text).join('')),
      );
    case 'hr':
      return createElement('hr', { key });
    case 'bulletList':
    case 'orderedList':
    case 'taskList':
      return createElement(
        node.type === 'orderedList' ? 'ol' : 'ul',
        { key, style },
        (node.children ?? []).map((li, i) => richNodeToElement(li, i, undefined, ctx)),
      );
    case 'listItem': {
      const soloTexto =
        node.runs && node.runs.length === 1 && !node.runs[0]!.marks
          ? node.runs[0]!.text
          : undefined;
      return createElement(
        'li',
        { key },
        soloTexto === '' ? '\u00a0' : renderRuns(node.runs, ctx),
      );
    }
    default:
      return createElement('p', { key, style }, renderRuns(node.runs, ctx));
  }
}
