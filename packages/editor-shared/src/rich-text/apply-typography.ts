import type { Editor } from '@tiptap/core';
import type { HeadingLevel } from '@lumina/types/slide';
import type { TypographyValue } from '../typography.js';
import { isBoldWeight } from '../typography.js';
import { HEADING_SCALE } from '../heading-scale.js';

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

/** Los tipos de nodo de bloque que aceptan el estilo tipográfico del bloque. */
const STYLE_NODE_TYPES = ['paragraph', 'heading'] as const;

/**
 * Estilo tipográfico del bloque (`NodeBlockStyle`) desde un `TypographyValue`.
 * `undefined` en una clave = no tocar; para limpiar, se pasa `null`.
 */
function nodeStyleAttrsFromPatch(
  patch: Partial<TypographyValue>,
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  if (patch.fontFamily !== undefined) attrs.fontFamily = patch.fontFamily || null;
  if (patch.fontSize !== undefined) attrs.fontSize = patch.fontSize ?? null;
  if (patch.color !== undefined) attrs.color = patch.color || null;
  if (patch.fontWeight !== undefined) attrs.bold = isBoldWeight(patch.fontWeight);
  if (patch.fontStyle !== undefined) attrs.italic = patch.fontStyle === 'italic';
  if (patch.underline !== undefined) attrs.underline = !!patch.underline;
  if (patch.lineHeight !== undefined) attrs.lineHeight = patch.lineHeight ?? null;
  if (patch.letterSpacing !== undefined) {
    attrs.letterSpacing = patch.letterSpacing ?? null;
  }
  return attrs;
}

/** Aplica `attrs` de `NodeBlockStyle` + alineación a los nodos de bloque del rango dado. */
function setBlockNodeStyle(
  editor: Editor,
  range: { from: number; to: number },
  attrs: Record<string, unknown>,
  align?: string,
): void {
  let chain = editor.chain().setTextSelection(range);
  if (Object.keys(attrs).length > 0) {
    for (const type of STYLE_NODE_TYPES) chain = chain.updateAttributes(type, attrs);
  }
  if (align !== undefined) {
    const a = align ? (ALIGN_TO_BLOCK[align] ?? 'izquierda') : null;
    for (const type of STYLE_NODE_TYPES) chain = chain.updateAttributes(type, { align: a });
  }
  chain.run();
}

/** Rango que cubre TODO el documento (para "aplicar al bloque" sin selección). */
function wholeDocRange(editor: Editor): { from: number; to: number } {
  return { from: 0, to: editor.state.doc.content.size };
}

/**
 * Aplica un patch tipográfico al editor. Con selección de rango viva las claves
 * de rango van como marcas sobre la selección; **sin selección** (cursor
 * colapsado) van como estilo del NODO a todo el documento — así el panel de
 * propiedades sin selección sigue teniendo efecto (antes era no-op). Devuelve
 * `true` si aplicó algo.
 */
export function applyTypographyToSelection(
  editor: Editor,
  patch: Partial<TypographyValue>,
): boolean {
  const { from, to } = editor.state.selection;
  const collapsed = from === to;
  let applied = false;

  if (collapsed) {
    // Estilo del bloque completo (todos los nodos): estilo de nodo, no marcas.
    const attrs = nodeStyleAttrsFromPatch(patch);
    if (Object.keys(attrs).length > 0 || patch.align !== undefined) {
      setBlockNodeStyle(editor, wholeDocRange(editor), attrs, patch.align);
      // Restaura el cursor donde estaba.
      editor.chain().setTextSelection({ from, to }).run();
      applied = true;
    }
    return applied;
  }

  // Selección viva → marcas por rango.
  const style: Record<string, string> = {};
  if (patch.fontFamily !== undefined) style.fontFamily = patch.fontFamily;
  if (patch.fontSize !== undefined) style.fontSize = `${patch.fontSize}px`;
  if (patch.color !== undefined) style.color = patch.color;
  if (patch.letterSpacing !== undefined) style.letterSpacing = `${patch.letterSpacing}px`;

  let chain = editor.chain().setTextSelection({ from, to });
  if (Object.keys(style).length > 0) {
    chain = chain.setMark('textStyle', style);
    applied = true;
  }
  if (patch.fontWeight !== undefined) {
    chain = isBoldWeight(patch.fontWeight) ? chain.setBold() : chain.unsetBold();
    applied = true;
  }
  if (patch.fontStyle !== undefined) {
    chain = patch.fontStyle === 'italic' ? chain.setItalic() : chain.unsetItalic();
    applied = true;
  }
  if (patch.underline !== undefined) {
    chain = patch.underline ? chain.setUnderline() : chain.unsetUnderline();
    applied = true;
  }
  if (patch.align !== undefined) {
    const a = patch.align ? (ALIGN_TO_BLOCK[patch.align] ?? 'izquierda') : null;
    chain = chain
      .updateAttributes('paragraph', { align: a })
      .updateAttributes('heading', { align: a });
    applied = true;
  }
  if (applied) chain.run();
  return applied;
}

/**
 * Aplica un nivel de encabezado (`undefined` = párrafo) al bloque que contiene la
 * selección, o a **todo el documento** si el cursor está colapsado. Además
 * reescala la tipografía del nodo: si el tamaño actual coincide con la escala
 * del nivel anterior (o no está fijado) se sustituye por la del nuevo nivel; un
 * tamaño manual distinto se conserva.
 */
export function applyHeadingLevelToSelection(
  editor: Editor,
  nivel: HeadingLevel | undefined,
): boolean {
  const { from, to } = editor.state.selection;
  const range = from === to ? wholeDocRange(editor) : { from, to };

  // Tamaño/peso/tracking/interlineado actuales del primer nodo de bloque tocado.
  const cur = editor.getAttributes(from === to ? 'paragraph' : 'heading');
  const curHeading = editor.getAttributes('heading');
  const prevLevel: number | undefined =
    typeof curHeading.level === 'number' ? curHeading.level : undefined;
  const prevScale = prevLevel ? HEADING_SCALE[prevLevel as HeadingLevel] : undefined;
  const curSize =
    typeof cur.fontSize === 'number'
      ? cur.fontSize
      : typeof curHeading.fontSize === 'number'
        ? curHeading.fontSize
        : undefined;
  const sizeIsDerived =
    curSize === undefined || (prevScale && curSize === prevScale.sizePx);

  let chain = editor.chain().setTextSelection(range);
  chain = nivel === undefined ? chain.setParagraph() : chain.setHeading({ level: nivel });

  // Si el tamaño estaba "derivado" del nivel anterior, se limpia el estilo de
  // nodo → la escala del NUEVO nivel (regla `h1..h6` del editor + `render-texto`)
  // toma el control. Un tamaño manual distinto se respeta.
  if (sizeIsDerived) {
    const clear = {
      fontSize: null,
      bold: null,
      lineHeight: null,
      letterSpacing: null,
    };
    for (const type of STYLE_NODE_TYPES) chain = chain.updateAttributes(type, clear);
  }
  chain.setTextSelection({ from, to }).run();
  return true;
}

/** Aplica el estilo de nodo a todo el documento sin depender de una selección viva. */
export function applyBlockStyleToEditor(
  editor: Editor,
  patch: Partial<TypographyValue>,
): boolean {
  const attrs = nodeStyleAttrsFromPatch(patch);
  if (Object.keys(attrs).length === 0 && patch.align === undefined) return false;
  const { from, to } = editor.state.selection;
  setBlockNodeStyle(editor, wholeDocRange(editor), attrs, patch.align);
  editor.chain().setTextSelection({ from, to }).run();
  return true;
}
