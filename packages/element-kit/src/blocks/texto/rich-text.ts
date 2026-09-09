import type { TextAlign, TextBlock } from '@lumina/types/slide';
import type { RichDoc } from '@lumina/types/rich-text';
import { plainToRich, richToPlain, sanitizeRichDoc } from '@lumina/editor-shared/rich-text';

/**
 * Kill-switch de producción del render enriquecido (Fase 1.7). Por defecto ON;
 * `NEXT_PUBLIC_RICH_TEXT=off` (o `0` / `false`) vuelve al render de `contenido`
 * plano. En Fase 1 el camino enriquecido solo se ejercita cuando un bloque ya
 * trae `contenidoRich` (nada lo escribe todavía).
 */
export function isRichTextEnabled(): boolean {
  const flag =
    (typeof process !== 'undefined' && process.env
      ? process.env.NEXT_PUBLIC_RICH_TEXT
      : undefined) ?? '';
  return flag !== 'off' && flag !== '0' && flag !== 'false';
}

/**
 * Accessor único de lectura de un bloque de texto. Devuelve `contenidoRich`
 * saneado si existe, o un `RichDoc` derivado de `contenido` plano usando las
 * pistas del bloque (`nivel`, `lista`, `alineacion`). **Todo render de texto pasa
 * por aquí** — nadie lee `block.contenido` directo para pintar a partir de Fase 1.
 */
export function getRichDoc(block: TextBlock): RichDoc {
  if (isRichTextEnabled() && block.contenidoRich) {
    return sanitizeRichDoc(block.contenidoRich);
  }
  return plainToRich(block.contenido ?? '', {
    nivel: block.nivel,
    lista: block.lista,
    alineacion: block.alineacion,
  });
}

/**
 * Aplica un `RichDoc` editado a un `TextBlock`: guarda `contenidoRich`, recomputa
 * `contenido` plano y **sincroniza las pistas de bloque** (`nivel`, `lista`,
 * `alineacion`) con el nodo raíz cuando el doc es de un solo nodo. Así el nivel
 * de encabezado, la lista y la alineación no divergen entre `block.*` y el doc
 * (que era la causa de que «los títulos no funcionaran» tras editar).
 */
export function syncTextBlockFromRichDoc(block: TextBlock, doc: RichDoc): TextBlock {
  const next: TextBlock = { ...block, contenidoRich: doc, contenido: richToPlain(doc) };

  if (doc.nodes.length === 1) {
    const first = doc.nodes[0]!;

    if (first.type === 'heading' && first.level) next.nivel = first.level;
    else delete next.nivel;

    if (first.type === 'bulletList') next.lista = 'vinetas';
    else if (first.type === 'orderedList') next.lista = 'numeros';
    else delete next.lista;

    if (first.align) next.alineacion = first.align as TextAlign;
  }
  return next;
}
