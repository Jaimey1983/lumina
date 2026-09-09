import type { TextBlock } from '@lumina/types/slide';
import type { RichDoc } from '@lumina/types/rich-text';
import { plainToRich, sanitizeRichDoc } from '@lumina/editor-shared/rich-text';

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
