'use client';

import type { TextBlock, Block, HeadingLevel } from '@lumina/types/slide';
import { TypographyInspector } from '@lumina/editor-shared/typography-inspector';
import {
  TEXT_BLOCK_FONT_SIZE_MIN,
  TEXT_BLOCK_FONT_SIZE_MAX,
  typographyFromTextBlock,
  textBlockPatchFromTypography,
  isTypographySizeOnlyPatch,
  type TypographyValue,
} from '@lumina/editor-shared/typography';
import {
  getActiveRichEditor,
  splitTypographyPatch,
  applyTypographyToSelection,
  applyHeadingLevelToSelection,
} from '@lumina/editor-shared/rich-text';
import {
  textBoxValueFromBlock,
  applyTextBoxPatch,
  type TextBoxValue,
} from '@lumina/editor-shared/text-box';

export interface TextoPropertiesProps {
  block: TextBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
  onChange?: (updated: TextBlock) => void;
  /** Fondo del slide — para el aviso de contraste WCAG del panel. */
  slideBackground?: string;
}

/** Editor de texto enriquecido activo con una selección de rango viva. */
function activeSelectionEditor() {
  const active = getActiveRichEditor();
  if (!active) return null;
  const sel = active.editor.state.selection;
  return sel.empty ? null : active.editor;
}

export function TextoProperties({
  block,
  applyNow,
  scheduleApply,
  clearDebounce,
  onChange,
  slideBackground,
}: TextoPropertiesProps) {
  const applyBlockPatch = (patch: Partial<TypographyValue>) => {
    const mapped = textBlockPatchFromTypography(patch);
    const apply = (b: Block): Block => (b.tipo === 'texto' ? { ...b, ...mapped } : b);
    if (isTypographySizeOnlyPatch(patch) && scheduleApply) {
      scheduleApply(apply);
      return;
    }
    clearDebounce?.();
    if (applyNow) {
      void applyNow(apply);
    } else if (onChange) {
      onChange({ ...block, ...mapped });
    }
  };

  const handleHeadingLevelChange = (nivel?: HeadingLevel) => {
    // Con una selección de rango viva, el nivel se aplica al nodo del editor…
    const editor = activeSelectionEditor();
    if (editor) {
      applyHeadingLevelToSelection(editor, nivel);
      // …y se refleja en `block.nivel` para que el panel y la escala no diverjan
      // (el commit del editor lo resincroniza igualmente vía syncTextBlockFromRichDoc).
      const syncNivel = (b: Block): Block => {
        if (b.tipo !== 'texto') return b;
        if (nivel === undefined) {
          const rest = { ...b };
          delete rest.nivel;
          return rest;
        }
        return { ...b, nivel };
      };
      if (applyNow) void applyNow(syncNivel);
      else if (onChange) onChange(syncNivel(block) as TextBlock);
      return;
    }
    if (applyNow) {
      void applyNow((b) => {
        if (b.tipo !== 'texto') return b;
        if (nivel === undefined) {
          const rest = { ...b };
          delete rest.nivel;
          return rest;
        }
        return { ...b, nivel };
      });
    } else if (onChange) {
      if (nivel === undefined) {
        const rest = { ...block };
        delete rest.nivel;
        onChange(rest);
      } else {
        onChange({ ...block, nivel });
      }
    }
  };

  const handleTypographyChange = (patch: Partial<TypographyValue>) => {
    // Si hay un `<RichTextEditor>` activo con selección: las claves de rango
    // (fuente, tamaño, color, peso, itálica, subrayado, tracking, alineación) van
    // a la selección; el resto (interlineado, transform, opacidad, fondo, lista…)
    // sigue siendo del bloque. Panel derecho = bloque · barra flotante = rango.
    const editor = activeSelectionEditor();
    if (editor) {
      const { range, block: blockPatch } = splitTypographyPatch(patch);
      if (Object.keys(range).length > 0) applyTypographyToSelection(editor, range);
      if (Object.keys(blockPatch).length > 0) applyBlockPatch(blockPatch);
      return;
    }
    applyBlockPatch(patch);
  };

  const handleBoxChange = (patch: Partial<TextBoxValue>) => {
    const apply = (b: Block): Block =>
      b.tipo === 'texto' ? applyTextBoxPatch(b, patch) : b;
    clearDebounce?.();
    if (applyNow) void applyNow(apply);
    else if (onChange) onChange(applyTextBoxPatch(block, patch));
  };

  return (
    <TypographyInspector
      value={typographyFromTextBlock(block)}
      sizeMin={TEXT_BLOCK_FONT_SIZE_MIN}
      sizeMax={TEXT_BLOCK_FONT_SIZE_MAX}
      defaultSize={24}
      defaultColor="#000000"
      headingLevel={block.nivel}
      enableList
      contrastBackground={slideBackground}
      metaText={block.contenido}
      boxValue={textBoxValueFromBlock(block)}
      onBoxChange={handleBoxChange}
      revealValue={block.revelado}
      onRevealChange={(next) => {
        const apply = (b: Block): Block => {
          if (b.tipo !== 'texto') return b;
          if (!next) {
            const rest = { ...b };
            delete rest.revelado;
            return rest;
          }
          return { ...b, revelado: next };
        };
        clearDebounce?.();
        if (applyNow) void applyNow(apply);
        else if (onChange) onChange(apply(block) as TextBlock);
      }}
      onHeadingLevelChange={handleHeadingLevelChange}
      onChange={handleTypographyChange}
    />
  );
}
