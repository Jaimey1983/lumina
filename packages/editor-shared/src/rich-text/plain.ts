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
function nodeStyleFromHints(h: PlainToRichHints): Partial<RichNode> {
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
