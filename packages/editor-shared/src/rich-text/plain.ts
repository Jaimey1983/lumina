import type { RichDoc, RichNode } from '@lumina/types/rich-text';
import type { TextAlign, TextBlock } from '@lumina/types/slide';

type PlainToRichHints = Pick<TextBlock, 'nivel' | 'lista' | 'alineacion'>;

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

/**
 * `contenido` plano → `RichDoc`. Usa las pistas del bloque (`nivel`, `lista`,
 * `alineacion`) para elegir el tipo de nodo raíz. Idempotente con `richToPlain`
 * sobre texto sin formato.
 */
export function plainToRich(
  contenido: string,
  hints?: PlainToRichHints,
): RichDoc {
  const text = contenido ?? '';
  const align: TextAlign | undefined = hints?.alineacion;
  const lines = text.split('\n');

  if (hints?.lista === 'vinetas' || hints?.lista === 'numeros') {
    return {
      version: 1,
      nodes: [
        {
          type: hints.lista === 'numeros' ? 'orderedList' : 'bulletList',
          children: lines.map((line) => ({
            type: 'listItem',
            runs: [{ text: line }],
          })),
        },
      ],
    };
  }

  // Sin formato: un solo nodo con todo el texto (los `\n` internos se conservan
  // en el run, igual que hoy con `white-space: pre-wrap`). Un `RichDoc` real de
  // varios nodos solo aparece cuando el editor enriquecido (Fase 2) lo escribe.
  return {
    version: 1,
    nodes: [
      {
        type: hints?.nivel ? 'heading' : 'paragraph',
        ...(hints?.nivel ? { level: hints.nivel } : {}),
        ...(align ? { align } : {}),
        ...(text === '' ? {} : { runs: [{ text }] }),
      },
    ],
  };
}
