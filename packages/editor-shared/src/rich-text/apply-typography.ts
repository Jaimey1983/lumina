import type { Editor } from '@tiptap/core';
import type { HeadingLevel } from '@lumina/types/slide';
import type { TypographyValue } from '../typography.js';
import { isBoldWeight } from '../typography.js';

const ALIGN_TO_BLOCK: Record<string, string> = {
  left: 'izquierda',
  center: 'centro',
  right: 'derecha',
  justify: 'justificado',
};

/** Claves de `TypographyValue` que son marcas de rango (aplicables a la selección). */
export const RANGE_TYPOGRAPHY_KEYS = new Set<keyof TypographyValue>([
  'fontFamily',
  'fontSize',
  'color',
  'fontWeight',
  'fontStyle',
  'underline',
  'letterSpacing',
  'align',
]);

export function splitTypographyPatch(patch: Partial<TypographyValue>): {
  range: Partial<TypographyValue>;
  block: Partial<TypographyValue>;
} {
  const range: Partial<TypographyValue> = {};
  const block: Partial<TypographyValue> = {};
  for (const [k, v] of Object.entries(patch) as [keyof TypographyValue, unknown][]) {
    if (RANGE_TYPOGRAPHY_KEYS.has(k)) (range as Record<string, unknown>)[k] = v;
    else (block as Record<string, unknown>)[k] = v;
  }
  return { range, block };
}

/**
 * Aplica un patch tipográfico al rango seleccionado de un editor activo, sin
 * robarle el foco al panel. Devuelve `true` si aplicó algo.
 */
export function applyTypographyToSelection(
  editor: Editor,
  patch: Partial<TypographyValue>,
): boolean {
  const { from, to } = editor.state.selection;
  if (from === to) return false;

  const style: Record<string, string> = {};
  if (patch.fontFamily !== undefined) style.fontFamily = patch.fontFamily;
  if (patch.fontSize !== undefined) style.fontSize = `${patch.fontSize}px`;
  if (patch.color !== undefined) style.color = patch.color;
  if (patch.letterSpacing !== undefined) style.letterSpacing = `${patch.letterSpacing}px`;

  const chain = editor.chain().setTextSelection({ from, to });
  let applied = false;

  if (Object.keys(style).length > 0) {
    chain.setMark('textStyle', style);
    applied = true;
  }
  if (patch.fontWeight !== undefined) {
    if (isBoldWeight(patch.fontWeight)) chain.setBold();
    else chain.unsetBold();
    applied = true;
  }
  if (patch.fontStyle !== undefined) {
    if (patch.fontStyle === 'italic') chain.setItalic();
    else chain.unsetItalic();
    applied = true;
  }
  if (patch.underline !== undefined) {
    if (patch.underline) chain.setUnderline();
    else chain.unsetUnderline();
    applied = true;
  }
  if (patch.align !== undefined) {
    const a = ALIGN_TO_BLOCK[patch.align] ?? 'izquierda';
    chain.updateAttributes('paragraph', { align: a }).updateAttributes('heading', { align: a });
    applied = true;
  }

  if (applied) chain.run();
  return applied;
}

/**
 * Aplica un nivel de encabezado (`undefined` = párrafo) al bloque de texto que
 * contiene la selección de un editor activo. `true` si aplicó.
 */
export function applyHeadingLevelToSelection(
  editor: Editor,
  nivel: HeadingLevel | undefined,
): boolean {
  const { from, to } = editor.state.selection;
  if (from === to) return false;
  const chain = editor.chain().setTextSelection({ from, to });
  if (nivel === undefined) chain.setParagraph();
  else chain.setHeading({ level: nivel });
  chain.run();
  return true;
}
