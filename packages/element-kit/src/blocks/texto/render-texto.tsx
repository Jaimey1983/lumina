'use client';

import {
  createElement,
  cloneElement,
  isValidElement,
  lazy,
  Suspense,
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
  textIndentStyle,
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

/** lowlight (+ tema CSS) solo se carga cuando hay un nodo `codeBlock`. */
const CodeBlockLazy = lazy(() =>
  import('./code-block.js').then((m) => ({ default: m.CodeBlock })),
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
  // `fondoTexto` y `degradado` son incompatibles: el degradado usa
  // `background-clip:text` y recortaría también el fondo → texto invisible. Con
  // degradado activo, el fondo del texto se ignora.
  const hasGradient = !!(block.degradado?.desde && block.degradado?.hasta);
  if (block.fondoTexto && block.fondoTextoOpacidad !== undefined && !hasGradient) {
    out.backgroundColor = hexWithOpacity(block.fondoTexto, block.fondoTextoOpacidad);
  }
  // Contorno/degradado del texto van al final: el degradado fuerza `color: transparent`
  // y debe ganar sobre el color de `typographyToCss`.
  return { ...out, ...textBlockColumnsCss(block), ...textBlockDecorCss(block) };
}

export interface RenderTextProps {
  block: TextBlock;
  modo?: 'editor' | 'viewer';
  isEditing?: boolean;
  /** Un único commit por gesto de edición, con el documento enriquecido. */
  onCommit?: (doc: RichDoc) => void;
  onDiscard?: () => void;
}

/**
 * Estilo BASE de la superficie de edición: fuente / tamaño / color / peso /
 * alineación / interlineado efectivos del bloque (rol de tema → escala de nivel →
 * ajustes del bloque). El estilo por nodo (Fase 1) vive en el `RichDoc` y llega
 * como `style` inline en el editor; esta capa da coherencia al cursor, al estado
 * vacío y a los runs sin estilo propio, para que editar == ver (WYSIWYG).
 */
function editorSurfaceStyle(
  block: TextBlock,
  theme: ReturnType<typeof useSlideTheme>['theme'],
): CSSProperties {
  const roleCss = block.estiloTema ? resolveThemeTextStyle(theme, block.estiloTema) : {};
  const headingCss = textBlockHeadingFallbackStyle(block);
  const base: CSSProperties = { ...headingCss, ...roleCss };
  const out: CSSProperties = {
    fontSize:
      block.tamanoFuente && block.tamanoFuente !== ''
        ? block.tamanoFuente
        : base.fontSize,
    fontWeight:
      block.negrita === true ? 'bold' : block.negrita === false ? 'normal' : base.fontWeight,
    fontStyle: block.cursiva ? 'italic' : undefined,
    color: block.color ?? roleCss.color,
    lineHeight: block.interlineado ?? base.lineHeight,
    letterSpacing:
      block.espaciadoLetras !== undefined
        ? `${block.espaciadoLetras}px`
        : base.letterSpacing,
    textAlign: block.alineacion ? TEXT_ALIGN_MAP[block.alineacion] : undefined,
  };
  if (block.fuente && block.fuente !== '') {
    out.fontFamily = fontFamilyWithFallback(block.fuente);
  } else if (roleCss.fontFamily) {
    out.fontFamily = roleCss.fontFamily;
  }
  return out;
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
    const box = textBlockBoxCss(block);
    return (
      <Suspense fallback={<div style={{ position: 'absolute', inset: 0 }} />}>
        <RichTextEditorLazy
          value={getRichDoc(block)}
          onCommit={onCommit}
          onDiscard={onDiscard}
          placeholder={emptyTextPlaceholderLabel(block)}
          style={{
            ...editorSurfaceStyle(block, theme),
            ...(box ?? {}),
            position: 'absolute',
            inset: 0,
          }}
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
    // `white-space: pre-wrap` NO va en este bloque: convive con `text-indent`
    // del nodo y WebKit lo ignora. Los saltos se conservan en un span interno
    // (`preserveRichBreaks`) — el mismo modelo que `.lumina-rich-editor` > `p`.
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
  };
  if (modo === 'viewer') {
    const plan = textBlockRevealPlan(block);
    if (plan) {
      ensureRevealStyles();
      ctx.reveal = { plan, counter: { n: 0 } };
    }
  }
  // El estilo base (derivado de `block.*`, que a su vez deriva del doc) se pasa a
  // TODOS los nodos — también en multi-nodo — para que la tipografía y la
  // alineación del bloque lleguen a `<p>`/`<h1>`/`<ul>`/`<table>`/`<li>`, no solo
  // por herencia del `<div>` contenedor.
  const inner =
    doc.nodes.length === 1
      ? richNodeToElement(doc.nodes[0]!, 0, style, ctx)
      : createElement(
          'div',
          { style: { textAlign: style.textAlign } },
          doc.nodes.map((n, i) => richNodeToElement(n, i, style, ctx)),
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
    if (/^\s+$/.test(part)) return createElement('span', { key: `s${counter.n}-${i}` }, part);
    const n = counter.n++;
    // `key` derivada del índice GLOBAL de unidad → única entre runs distintos
    // (antes `key: i` se repetía y React reconciliaba mal la animación).
    return createElement(
      'span',
      { key: `w${n}`, style: revealUnitCss(plan, n), 'data-reveal-unit': '' },
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

/**
 * Conserva `\n` de los runs sin poner `pre-wrap` en el bloque. `text-indent`
 * (primera línea / francesa) vive en el `p`/`h*`; WebKit lo anula si el
 * mismo elemento tiene `white-space: pre-wrap`.
 */
const PRESERVE_BREAKS: CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

function preserveRichBreaks(children: ReactNode): ReactNode {
  return createElement('span', { style: PRESERVE_BREAKS, 'data-rich-ws': '' }, children);
}

/** Sangría / espaciado / alineación propios del nodo (párrafo, encabezado, lista…). */
function nodeSpacingCss(node: RichNode): CSSProperties {
  const out: CSSProperties = {};
  if (node.align && TEXT_ALIGN_MAP[node.align]) out.textAlign = TEXT_ALIGN_MAP[node.align];
  if (Number.isFinite(node.indent)) out.marginInlineStart = `${node.indent}rem`;
  Object.assign(out, textIndentStyle(node.textIndent));
  if (Number.isFinite(node.spaceBefore)) out.marginTop = `${node.spaceBefore}px`;
  if (Number.isFinite(node.spaceAfter)) out.marginBottom = `${node.spaceAfter}px`;
  return out;
}

/**
 * Estilo tipográfico del bloque guardado en el NODO raíz (Fase 1 del modelo
 * único). Gana sobre la capa base (`style`) y sobre la escala H1–H6, y pierde
 * frente a las marcas de rango de cada run.
 */
function nodeTypographyCss(node: RichNode): CSSProperties {
  const out: CSSProperties = {};
  if (node.fontFamily) out.fontFamily = fontFamilyWithFallback(node.fontFamily);
  if (Number.isFinite(node.fontSize)) out.fontSize = `${node.fontSize}px`;
  if (node.color) out.color = node.color;
  // Tri-estado: `false` fija `normal`/`none` para ganar sobre un rol de tema o
  // la escala del nivel; `undefined` no toca nada.
  if (node.bold === true) out.fontWeight = 'bold';
  else if (node.bold === false) out.fontWeight = 'normal';
  if (node.italic === true) out.fontStyle = 'italic';
  else if (node.italic === false) out.fontStyle = 'normal';
  if (node.underline === true) out.textDecoration = 'underline';
  else if (node.underline === false) out.textDecoration = 'none';
  if (Number.isFinite(node.lineHeight)) out.lineHeight = node.lineHeight;
  if (Number.isFinite(node.letterSpacing)) out.letterSpacing = `${node.letterSpacing}px`;
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
  const typo = nodeTypographyCss(node);
  switch (node.type) {
    case 'heading': {
      const lvl = (node.level ?? 2) as HeadingLevel;
      // La escala (tamaño/peso/interlineado/tracking) se deriva del nivel del
      // NODO y solo rellena lo que el propio nodo no fija (`node.fontSize`, …).
      const scale = headingFallbackCss(lvl, {
        tamanoFuente: Number.isFinite(node.fontSize) ? `${node.fontSize}px` : undefined,
        negrita: typeof node.bold === 'boolean' ? node.bold : undefined,
        espaciadoLetras: Number.isFinite(node.letterSpacing) ? node.letterSpacing : undefined,
        interlineado: Number.isFinite(node.lineHeight) ? node.lineHeight : undefined,
      });
      return createElement(
        `h${lvl}`,
        { key, style: { ...style, ...scale, ...typo, ...nodeSpacingCss(node) } },
        preserveRichBreaks(revealLine(renderRuns(node.runs, ctx), ctx)),
      );
    }
    case 'blockquote':
      return createElement(
        'blockquote',
        { key, style: { ...withSpacing(style), ...typo } },
        preserveRichBreaks(revealLine(renderRuns(node.runs, ctx), ctx)),
      );
    case 'codeBlock': {
      // El c\u00f3digo no interpola tokens. Resaltado con lowlight (carga perezosa).
      const code = (node.runs ?? []).map((r) => r.text).join('');
      return createElement(
        Suspense,
        {
          key,
          fallback: createElement(
            'pre',
            { style },
            createElement('code', null, code),
          ),
        },
        createElement(CodeBlockLazy, { code, lang: node.lang, style }),
      );
    }
    case 'hr':
      return createElement('hr', { key });
    case 'bulletList':
    case 'orderedList':
    case 'taskList': {
      const isTask = node.type === 'taskList';
      const listStyle = withSpacing(
        isTask
          ? { ...style, ...typo, listStyle: 'none', paddingLeft: 0 }
          : { ...style, ...typo },
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
          style: {
            ...style,
            ...typo,
            ...calloutStyle(node.variant),
            ...nodeSpacingCss(node),
          },
        },
        preserveRichBreaks(revealLine(renderRuns(node.runs, ctx), ctx)),
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
        { key, style: { ...withSpacing(style), ...typo } },
        preserveRichBreaks(revealLine(renderRuns(node.runs, ctx), ctx)),
      );
  }
}
