import type { HeadingLevel, TextAlign } from '@lumina/types/slide';
import type { RichDoc, RichNode } from '@lumina/types/rich-text';
import type { TypographyAlign, TypographyValue } from '../typography.js';
import { isBoldWeight } from '../typography.js';
import { BODY_TEXT_SCALE, HEADING_SCALE } from '../heading-scale.js';
import { isStyleableRichNodeType } from './plain.js';

const ALIGN_TO_BLOCK: Record<TypographyAlign, TextAlign> = {
  left: 'izquierda',
  center: 'centro',
  right: 'derecha',
  justify: 'justificado',
};

/**
 * Escribe las claves del patch tipográfico sobre los nodos de bloque del doc.
 * El panel sin editor activo usa esto para no dejar `TextBlock.*` y el
 * `contenidoRich` divergentes.
 */
export function applyTypographyPatchToRichDoc(
  doc: RichDoc,
  patch: Partial<TypographyValue>,
): RichDoc {
  return {
    ...doc,
    nodes: doc.nodes.map((n) => {
      if (!isStyleableRichNodeType(n.type)) return n;
      const next: RichNode = { ...n };
      if (patch.fontFamily !== undefined) {
        if (patch.fontFamily) next.fontFamily = patch.fontFamily;
        else delete next.fontFamily;
      }
      if (patch.fontSize !== undefined) {
        if (typeof patch.fontSize === 'number' && Number.isFinite(patch.fontSize)) {
          next.fontSize = patch.fontSize;
        } else delete next.fontSize;
      }
      if (patch.color !== undefined) {
        if (patch.color) next.color = patch.color;
        else delete next.color;
      }
      if (patch.fontWeight !== undefined) {
        next.bold = isBoldWeight(patch.fontWeight);
      }
      if (patch.fontStyle !== undefined) {
        next.italic = patch.fontStyle === 'italic';
      }
      if (patch.underline !== undefined) {
        next.underline = !!patch.underline;
      }
      if (patch.lineHeight !== undefined) {
        if (typeof patch.lineHeight === 'number' && Number.isFinite(patch.lineHeight)) {
          next.lineHeight = patch.lineHeight;
        } else delete next.lineHeight;
      }
      if (patch.letterSpacing !== undefined) {
        if (
          typeof patch.letterSpacing === 'number' &&
          Number.isFinite(patch.letterSpacing)
        ) {
          next.letterSpacing = patch.letterSpacing;
        } else delete next.letterSpacing;
      }
      if (patch.align !== undefined) {
        if (patch.align) next.align = ALIGN_TO_BLOCK[patch.align] ?? 'izquierda';
        else delete next.align;
      }
      return next;
    }),
  };
}

/**
 * Convierte párrafos/encabezados al nivel pedido. Si `writeScale`, escribe
 * tamaño/peso/interlineado/tracking de la escala en el nodo (no los borra
 * esperando CSS).
 */
export function applyHeadingLevelToRichDoc(
  doc: RichDoc,
  nivel: HeadingLevel | undefined,
  writeScale: boolean,
): RichDoc {
  const scale = writeScale
    ? nivel
      ? HEADING_SCALE[nivel]
      : BODY_TEXT_SCALE
    : undefined;
  return {
    ...doc,
    nodes: doc.nodes.map((n) => {
      if (n.type !== 'paragraph' && n.type !== 'heading') return n;
      const next: RichNode = { ...n };
      if (nivel === undefined) {
        next.type = 'paragraph';
        delete next.level;
      } else {
        next.type = 'heading';
        next.level = nivel;
      }
      if (scale) {
        next.fontSize = scale.sizePx;
        next.bold = scale.weight >= 600;
        next.lineHeight = scale.lineHeight;
        next.letterSpacing = scale.trackingPx;
      }
      return next;
    }),
  };
}
