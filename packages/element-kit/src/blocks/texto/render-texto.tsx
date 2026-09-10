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
import { useSlideTheme } from '@lumina/editor-shared/slide-theme-context';
import { resolveThemeTextStyle } from '@lumina/editor-shared/theme-text-styles';
import { headingFallbackCss, effectiveFontSizePx } from '@lumina/editor-shared/heading-scale';
import {
  textBlockBoxCss,
  textBlockColumnsCss,
  textBlockDecorCss,
  hexWithOpacity,
} from '@lumina/editor-shared/text-box';
import {
  textBlockRevealPlan,
  revealUnitCss,
  ensureRevealStyles,
  type RevealPlan,
} from '@lumina/editor-shared/text-reveal';
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
import { CurvedText } from './curved-text.js';

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
  /** Revelado animado (solo viewer). `counter` da un índice continuo. */
  reveal?: { plan: RevealPlan; counter: { n: number } };
  /**
   * Navegación a diapositiva (marca `link.slideRef`, 1-based). Solo se cablea
   * fuera del editor y cuando hay un `SlideNavContext` con `navigate`.
   */
  navSlide?: (slideNumber: number) => void;
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

/** KaTeX (+ CSS) solo se carga cuando un documento tiene un nodo `math`. */
const MathBlockLazy = lazy(() =>
  import('./math-block.js').then((m) => ({ default: m.MathBlock })),
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
  // Contorno/degradado del texto van al final: el degradado fuerza `color: transparent`
  // y debe ganar sobre el color de `typographyToCss`.
  return { ...out, ...textBlockColumnsCss(block), ...textBlockDecorCss(block) };
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
  const { theme } = useSlideTheme();

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

  // Texto curvado: una sola línea, sin formato por fragmentos (limitación).
  if (
    Math.abs(block.curvatura ?? 0) >= 1 &&
    !textBlockContenidoIsEmpty(block)
  ) {
    return <CurvedText block={block} text={(block.contenido ?? '').replace(/\s*\n\s*/g, ' ')} />;
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
  // Capa base del rol de tema (`estiloTema`): el tema activo define
  // fuente/tamaño/color/peso; los ajustes explícitos del bloque ganan encima.
  const roleCss = block.estiloTema
    ? resolveThemeTextStyle(theme, block.estiloTema)
    : {};
  // El rol de tema tiene prioridad sobre la escala H1–H6 como *fallback*.
  const fallbackCss: CSSProperties = { ...headingCss, ...roleCss };
  const style: CSSProperties = {
    margin: 0,
    whiteSpace: isList ? 'normal' : 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: block.alineacion ? TEXT_ALIGN_MAP[block.alineacion] : undefined,
    ...fallbackCss,
    fontSize:
      block.tamanoFuente && block.tamanoFuente !== ''
        ? block.tamanoFuente
        : fallbackCss.fontSize,
    fontWeight:
      block.negrita === true
        ? 'bold'
        : block.negrita === false
          ? undefined
          : fallbackCss.fontWeight,
    fontStyle: block.cursiva ? 'italic' : undefined,
    color: block.color ?? roleCss.color,
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
    navSlide:
      modo === 'editor' || !nav.navigate
        ? undefined
        : (n: number) => nav.navigate?.({ kind: 'ir_a', index: n - 1 }),
    headingOverride: {
      tamanoFuente: block.tamanoFuente,
      negrita: block.negrita,
      espaciadoLetras: block.espaciadoLetras,
      interlineado: block.interlineado,
    },
  };
  if (modo === 'viewer') {
    const plan = textBlockRevealPlan(block);
    if (plan) {
      ensureRevealStyles();
      ctx.reveal = { plan, counter: { n: 0 } };
    }
  }
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

/** Reparte el texto en `<span>` animados por palabra (revelado). */
function revealWords(text: string, ctx?: RenderCtx): ReactNode {
  if (ctx?.reveal?.plan.unit !== 'palabra' || text === '') return text;
  const { plan, counter } = ctx.reveal;
  return text.split(/(\s+)/).map((part, i) => {
    if (part === '') return null;
    if (/^\s+$/.test(part)) return part;
    return createElement(
      'span',
      { key: i, style: revealUnitCss(plan, counter.n++), 'data-reveal-unit': '' },
      part,
    );
  });
}

/** Envuelve el contenido de una línea/bloque en un `<span>` animado (revelado). */
function revealLine(children: ReactNode, ctx?: RenderCtx): ReactNode {
  if (ctx?.reveal?.plan.unit !== 'linea') return children;
  const { plan, counter } = ctx.reveal;
  return createElement(
    'span',
    { style: revealUnitCss(plan, counter.n++), 'data-reveal-unit': '' },
    children,
  );
}

function renderRun(run: RichRun, key: number, ctx?: RenderCtx): ReactNode {
  const text = ctx?.resolveToken ? interpolateTokens(run.text, ctx.resolveToken) : run.text;
  const marks = run.marks;
  if (!marks || marks.length === 0) return revealWords(text, ctx);

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
  if (term) {
    node = createElement(
      'span',
      {
        'data-term': term.glosaId,
        ...(term.definicion
          ? {
              title: term.definicion,
              'aria-label': term.definicion,
              tabIndex: 0,
              style: {
                textDecoration: 'underline dotted',
                textUnderlineOffset: '0.15em',
                cursor: 'help',
              },
            }
          : {}),
      },
      node,
    );
  }
  const lang = findMark(marks, 'lang');
  if (lang) node = createElement('span', { lang: lang.value }, node);
  const link = findMark(marks, 'link');
  if (link) {
    if (typeof link.slideRef === 'number' && link.slideRef >= 1) {
      const n = Math.round(link.slideRef);
      node = ctx?.navSlide
        ? createElement(
            'a',
            {
              role: 'link',
              tabIndex: 0,
              'data-slide-ref': String(n),
              style: { cursor: 'pointer', textDecoration: 'underline' },
              onClick: (e: { preventDefault: () => void }) => {
                e.preventDefault();
                ctx.navSlide!(n);
              },
              onKeyDown: (e: { key: string; preventDefault: () => void }) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  ctx.navSlide!(n);
                }
              },
            },
            node,
          )
        : createElement('span', { 'data-slide-ref': String(n) }, node);
    } else if (link.href && isSafeHref(link.href)) {
      node = createElement(
        'a',
        { href: link.href, target: '_blank', rel: 'noopener noreferrer' },
        node,
      );
    }
  }
  if (ctx?.reveal?.plan.unit === 'palabra') {
    const { plan, counter } = ctx.reveal;
    node = createElement(
      'span',
      { style: revealUnitCss(plan, counter.n++), 'data-reveal-unit': '' },
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
    const t = ctx?.resolveToken
      ? interpolateTokens(runs[0]!.text, ctx.resolveToken)
      : runs[0]!.text;
    return revealWords(t, ctx);
  }
  return runs.map((r, i) => renderRun(r, i, ctx));
}

/** Estilo base de una «llamada» (nota / aviso / tip) — Fase 5B. */
const CALLOUT_STYLE: Record<string, CSSProperties> = {
  nota: { borderInlineStart: '4px solid #3b82f6', background: 'rgba(59,130,246,0.08)' },
  aviso: { borderInlineStart: '4px solid #f59e0b', background: 'rgba(245,158,11,0.10)' },
  tip: { borderInlineStart: '4px solid #10b981', background: 'rgba(16,185,129,0.10)' },
};
function calloutStyle(variant?: string): CSSProperties {
  return {
    ...(CALLOUT_STYLE[variant ?? 'nota'] ?? CALLOUT_STYLE.nota),
    padding: '0.5em 0.75em',
    borderRadius: 4,
  };
}

/** Sangría / espaciado / alineación propios del nodo (párrafo, encabezado, lista…). */
function nodeSpacingCss(node: RichNode): CSSProperties {
  const out: CSSProperties = {};
  if (node.align && TEXT_ALIGN_MAP[node.align]) out.textAlign = TEXT_ALIGN_MAP[node.align];
  if (Number.isFinite(node.indent)) out.marginInlineStart = `${node.indent}rem`;
  if (Number.isFinite(node.spaceBefore)) out.marginTop = `${node.spaceBefore}px`;
  if (Number.isFinite(node.spaceAfter)) out.marginBottom = `${node.spaceAfter}px`;
  return out;
}

function richNodeToElement(
  node: RichNode,
  key: number | string,
  style?: CSSProperties,
  ctx?: RenderCtx,
  asTaskItem = false,
): ReactNode {
  const withSpacing = (base?: CSSProperties): CSSProperties | undefined => {
    const sp = nodeSpacingCss(node);
    if (Object.keys(sp).length === 0) return base;
    return { ...base, ...sp };
  };
  switch (node.type) {
    case 'heading': {
      const lvl = (node.level ?? 2) as HeadingLevel;
      // La escala (tamaño/peso/interlineado/tracking) se deriva del nivel del
      // NODO — el ajuste manual del bloque (si existe) gana vía `headingOverride`.
      const scale = headingFallbackCss(lvl, ctx?.headingOverride ?? {});
      return createElement(
        `h${lvl}`,
        { key, style: { ...style, ...scale, ...nodeSpacingCss(node) } },
        revealLine(renderRuns(node.runs, ctx), ctx),
      );
    }
    case 'blockquote':
      return createElement(
        'blockquote',
        { key, style: withSpacing(style) },
        revealLine(renderRuns(node.runs, ctx), ctx),
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
    case 'taskList': {
      const isTask = node.type === 'taskList';
      const listStyle = withSpacing(
        isTask ? { ...style, listStyle: 'none', paddingLeft: 0 } : style,
      );
      return createElement(
        node.type === 'orderedList' ? 'ol' : 'ul',
        { key, style: listStyle, ...(isTask ? { 'data-task-list': '' } : {}) },
        (node.children ?? []).map((li, i) =>
          richNodeToElement(li, i, undefined, ctx, isTask),
        ),
      );
    }
    case 'callout':
      return createElement(
        'div',
        {
          key,
          'data-callout': node.variant ?? 'nota',
          style: { ...style, ...calloutStyle(node.variant), ...nodeSpacingCss(node) },
        },
        revealLine(renderRuns(node.runs, ctx), ctx),
      );
    case 'table': {
      const cellBase: CSSProperties = {
        border: '1px solid #cbd5e1',
        padding: '0.35em 0.55em',
        verticalAlign: 'top',
      };
      return createElement(
        'table',
        {
          key,
          'data-table': '1',
          style: {
            ...nodeSpacingCss(node),
            borderCollapse: 'collapse',
            width: '100%',
          },
        },
        createElement(
          'tbody',
          null,
          (node.children ?? []).map((row, ri) =>
            createElement(
              'tr',
              { key: ri },
              (row.children ?? []).map((cell, ci) =>
                createElement(
                  cell.header ? 'th' : 'td',
                  {
                    key: ci,
                    ...(cell.colspan && cell.colspan > 1 ? { colSpan: cell.colspan } : {}),
                    ...(cell.rowspan && cell.rowspan > 1 ? { rowSpan: cell.rowspan } : {}),
                    style: cell.header
                      ? { ...cellBase, background: '#f1f5f9', fontWeight: 600, textAlign: 'left' }
                      : cellBase,
                  },
                  renderRuns(cell.runs, ctx),
                ),
              ),
            ),
          ),
        ),
      );
    }
    case 'tableRow':
    case 'tableCell':
      return null;
    case 'math': {
      const latex = node.latex ?? '';
      if (latex === '') return null;
      return createElement(
        Suspense,
        {
          key,
          fallback: createElement(
            'div',
            { 'data-math': '1', style: { fontFamily: 'monospace' } },
            latex,
          ),
        },
        createElement(MathBlockLazy, { latex }),
      );
    }
    case 'listItem': {
      const soloTexto =
        node.runs && node.runs.length === 1 && !node.runs[0]!.marks
          ? node.runs[0]!.text
          : undefined;
      const body =
        soloTexto === '' ? '\u00a0' : revealLine(renderRuns(node.runs, ctx), ctx);
      if (asTaskItem) {
        return createElement(
          'li',
          { key, 'data-checked': node.checked === true ? 'true' : 'false' },
          createElement('input', {
            type: 'checkbox',
            checked: node.checked === true,
            disabled: true,
            readOnly: true,
            style: { marginRight: '0.5em' },
          }),
          body,
        );
      }
      return createElement('li', { key }, body);
    }
    default:
      return createElement(
        'p',
        { key, style: withSpacing(style) },
        revealLine(renderRuns(node.runs, ctx), ctx),
      );
  }
}
