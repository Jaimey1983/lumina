import type { RichDoc, RichNode } from '@lumina/types/rich-text';
import type { TextAlign, TextBlock } from '@lumina/types/slide';

/**
 * Pistas de bloque para derivar el `RichDoc` de un texto plano. Además de la
 * estructura (`nivel`, `lista`, `alineacion`) traslada la tipografía del bloque
 * al nodo raíz — así el editor enriquecido y el render ven el mismo estilo sin
 * depender de que alguien lo copie a mano (Fase 1 del modelo único).
 */
export type PlainToRichHints = Pick<
  TextBlock,
  | 'nivel'
  | 'lista'
  | 'alineacion'
  | 'fuente'
  | 'tamanoFuente'
  | 'color'
  | 'negrita'
  | 'cursiva'
  | 'subrayado'
  | 'interlineado'
  | 'espaciadoLetras'
>;

function nodeToPlain(node: RichNode): string {
  if (node.runs) return node.runs.map((r) => r.text).join('');
  if (node.type === 'math' && node.latex) return node.latex;
  if (node.children) return node.children.map(nodeToPlain).join('\n');
  return '';
}

/** Texto plano derivado del documento — se recomputa en cada commit. */
export function richToPlain(doc: RichDoc): string {
  if (!doc?.nodes?.length) return '';
  return doc.nodes.map(nodeToPlain).join('\n');
}

/** px del `tamanoFuente` del bloque (acepta `px` y `rem`); `undefined` si no aplica. */
function fontSizePx(raw?: string): number | undefined {
  if (!raw || raw.trim() === '') return undefined;
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  if (!m) return undefined;
  const n = parseFloat(m[1]!);
  if (!Number.isFinite(n)) return undefined;
  return /rem\s*$/i.test(String(raw).trim()) ? Math.round(n * 16) : Math.round(n);
}

/** Estilo tipográfico del nodo raíz derivado de las pistas del bloque. */
export function nodeStyleFromHints(h: PlainToRichHints): Partial<RichNode> {
  const out: Partial<RichNode> = {};
  if (h.fuente) out.fontFamily = h.fuente;
  const px = fontSizePx(h.tamanoFuente);
  if (px !== undefined) out.fontSize = px;
  if (h.color) out.color = h.color;
  // Tri-estado: `negrita:false` explícito se conserva (suprime la escala del
  // nivel y gana sobre un rol de tema); `undefined` se omite.
  if (typeof h.negrita === 'boolean') out.bold = h.negrita;
  if (typeof h.cursiva === 'boolean') out.italic = h.cursiva;
  if (typeof h.subrayado === 'boolean') out.underline = h.subrayado;
  if (typeof h.interlineado === 'number' && Number.isFinite(h.interlineado)) {
    out.lineHeight = h.interlineado;
  }
  if (
    typeof h.espaciadoLetras === 'number' &&
    Number.isFinite(h.espaciadoLetras)
  ) {
    out.letterSpacing = h.espaciadoLetras;
  }
  return out;
}

/**
 * `contenido` plano → `RichDoc`. Usa las pistas del bloque (`nivel`, `lista`,
 * `alineacion` + tipografía) para el nodo raíz. Idempotente con `richToPlain`
 * sobre texto sin formato.
 */
export function plainToRich(
  contenido: string,
  hints?: PlainToRichHints,
): RichDoc {
  const text = contenido ?? '';
  const align: TextAlign | undefined = hints?.alineacion;
  const style = hints ? nodeStyleFromHints(hints) : {};
  const lines = text.split('\n');

  if (hints?.lista === 'vinetas' || hints?.lista === 'numeros') {
    return {
      version: 1,
      nodes: [
        {
          type: hints.lista === 'numeros' ? 'orderedList' : 'bulletList',
          ...style,
          children: lines.map((line) => ({
            type: 'listItem',
            runs: [{ text: line }],
          })),
        },
      ],
    };
  }

  // Sin formato: un solo nodo con todo el texto (los `\n` internos se conservan
  // en el run; `richToPmDoc` los convierte a `hardBreak` para el editor).
  return {
    version: 1,
    nodes: [
      {
        type: hints?.nivel ? 'heading' : 'paragraph',
        ...(hints?.nivel ? { level: hints.nivel } : {}),
        ...(align ? { align } : {}),
        ...style,
        ...(text === '' ? {} : { runs: [{ text }] }),
      },
    ],
  };
}

const STYLEABLE_NODE_TYPES = new Set<RichNode['type']>([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'taskList',
  'blockquote',
  'callout',
]);

/** Extrae las pistas de un `TextBlock` para hidratar o derivar el `RichDoc`. */
export function hintsFromTextBlock(block: PlainToRichHints): PlainToRichHints {
  return {
    nivel: block.nivel,
    lista: block.lista,
    alineacion: block.alineacion,
    fuente: block.fuente,
    tamanoFuente: block.tamanoFuente,
    color: block.color,
    negrita: block.negrita,
    cursiva: block.cursiva,
    subrayado: block.subrayado,
    interlineado: block.interlineado,
    espaciadoLetras: block.espaciadoLetras,
  };
}

/**
 * Rellena en el documento solo los campos de estilo que el nodo **no** trae,
 * usando las pistas del bloque. El valor del nodo siempre gana. Ausencia en
 * el nodo no borra el bloque: eso lo garantiza `syncTextBlockFromRichDoc`.
 */
export function hydrateMissingNodeStyle(doc: RichDoc, hints: PlainToRichHints): RichDoc {
  const style = nodeStyleFromHints(hints);
  const align = hints.alineacion;
  if (Object.keys(style).length === 0 && !align) return doc;
  return {
    ...doc,
    nodes: doc.nodes.map((n) => {
      if (!STYLEABLE_NODE_TYPES.has(n.type)) return n;
      const next: RichNode = { ...n };
      for (const [k, v] of Object.entries(style) as [keyof RichNode, RichNode[keyof RichNode]][]) {
        if (v === undefined) continue;
        if (next[k] === undefined) {
          (next as unknown as Record<string, unknown>)[k as string] = v;
        }
      }
      if (align && !next.align) next.align = align;
      return next;
    }),
  };
}

export function isStyleableRichNodeType(type: RichNode['type']): boolean {
  return STYLEABLE_NODE_TYPES.has(type);
}
