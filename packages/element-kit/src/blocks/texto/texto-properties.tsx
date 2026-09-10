'use client';

import { useEffect, useState } from 'react';
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
  subscribeActiveRichEditor,
  splitTypographyPatch,
  applyTypographyToSelection,
  applyHeadingLevelToSelection,
  applyHeadingLevelToRichDoc,
  applyTypographyPatchToRichDoc,
  richToPlain,
  sanitizeRichDoc,
} from '@lumina/editor-shared/rich-text';
import {
  BODY_TEXT_SCALE,
  HEADING_SCALE,
  effectiveFontSizePx,
  isDerivedHeadingSize,
} from '@lumina/editor-shared/heading-scale';
import { getRichDoc } from './rich-text.js';
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

/** Editor de texto enriquecido activo (con o sin selección de rango). */
function activeEditor() {
  return getActiveRichEditor()?.editor ?? null;
}

/**
 * Al cambiar de nivel: si el tamaño es el de la escala (cuerpo 18px o el
 * nivel previo) se ESCRIBE la escala nueva en bloque y documento. Un override
 * manual se respeta. Nunca se borra el tamaño esperando CSS.
 */
function rescaleBlockForLevel(b: TextBlock, nivel?: HeadingLevel): TextBlock {
  const next: TextBlock = { ...b };
  if (nivel === undefined) delete next.nivel;
  else next.nivel = nivel;

  const curPx =
    b.tamanoFuente && b.tamanoFuente.trim() !== ''
      ? effectiveFontSizePx(b.tamanoFuente, b.nivel)
      : undefined;
  const derived = isDerivedHeadingSize(curPx, b.nivel);
  if (derived) {
    const scale = nivel ? HEADING_SCALE[nivel] : BODY_TEXT_SCALE;
    next.tamanoFuente = `${scale.sizePx}px`;
    next.negrita = scale.weight >= 600;
    next.interlineado = scale.lineHeight;
    next.espaciadoLetras = scale.trackingPx;
  }

  const baseDoc = b.contenidoRich ? sanitizeRichDoc(b.contenidoRich) : getRichDoc(b);
  const headingDoc = applyHeadingLevelToRichDoc(baseDoc, nivel, derived);
  next.contenidoRich = headingDoc;
  next.contenido = richToPlain(headingDoc);
  return next;
}

/** Escribe el patch en `TextBlock.*` y en el `RichDoc` a la vez. */
function applyTypographyToTextBlock(
  b: TextBlock,
  patch: Partial<TypographyValue>,
): TextBlock {
  const mapped: TextBlock = { ...b, ...textBlockPatchFromTypography(patch) };
  const baseDoc = b.contenidoRich ? sanitizeRichDoc(b.contenidoRich) : getRichDoc(b);
  const patchedDoc = applyTypographyPatchToRichDoc(baseDoc, patch);
  mapped.contenidoRich = patchedDoc;
  mapped.contenido = richToPlain(patchedDoc);
  return mapped;
}

/**
 * Re-renderiza el panel cuando cambia el editor activo o su selección, para que
 * los valores mostrados reflejen el estilo del nodo/rango bajo el cursor y no
 * solo `block.*` (que va por detrás hasta el commit).
 */
function useActiveEditorTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const unsub = subscribeActiveRichEditor(() => {
      bump();
      const ed = getActiveRichEditor()?.editor;
      if (ed) {
        ed.on('selectionUpdate', bump);
        ed.on('transaction', bump);
      }
    });
    const ed = getActiveRichEditor()?.editor;
    if (ed) {
      ed.on('selectionUpdate', bump);
      ed.on('transaction', bump);
    }
    return () => {
      unsub();
      const cur = getActiveRichEditor()?.editor;
      if (cur) {
        cur.off('selectionUpdate', bump);
        cur.off('transaction', bump);
      }
    };
  }, []);
  return tick;
}

/** Estilo tipográfico efectivo bajo el cursor: `block.*` + atributos del nodo activo. */
function effectiveTypography(block: TextBlock): TypographyValue {
  const base = typographyFromTextBlock(block);
  const ed = getActiveRichEditor()?.editor;
  if (!ed) return base;
  const isHeading = ed.isActive('heading');
  const a = { ...ed.getAttributes('paragraph'), ...ed.getAttributes(isHeading ? 'heading' : 'paragraph') };
  const ts = ed.getAttributes('textStyle');
  const out: TypographyValue = { ...base };
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const str = (v: unknown) => (typeof v === 'string' && v !== '' ? v : undefined);
  out.fontFamily = str(ts.fontFamily) ?? str(a.fontFamily) ?? out.fontFamily;
  const tsSize = str(ts.fontSize) ? parseFloat(String(ts.fontSize)) : undefined;
  out.fontSize = num(tsSize) ?? num(a.fontSize) ?? out.fontSize;
  out.color = str(ts.color) ?? str(a.color) ?? out.color;
  if (ed.isActive('bold') || a.bold === true) out.fontWeight = 'bold';
  else if (a.bold === false) out.fontWeight = 'normal';
  if (ed.isActive('italic') || a.italic === true) out.fontStyle = 'italic';
  else if (a.italic === false) out.fontStyle = 'normal';
  if (ed.isActive('underline') || a.underline === true) out.underline = true;
  else if (a.underline === false) out.underline = false;
  if (num(a.lineHeight) !== undefined) out.lineHeight = num(a.lineHeight);
  const tsTrack = str(ts.letterSpacing) ? parseFloat(String(ts.letterSpacing)) : undefined;
  out.letterSpacing = num(tsTrack) ?? num(a.letterSpacing) ?? out.letterSpacing;
  if (typeof a.align === 'string') {
    const map: Record<string, TypographyValue['align']> = {
      izquierda: 'left',
      centro: 'center',
      derecha: 'right',
      justificado: 'justify',
    };
    if (map[a.align]) out.align = map[a.align];
  }
  return out;
}

export function TextoProperties({
  block,
  applyNow,
  scheduleApply,
  clearDebounce,
  onChange,
  slideBackground,
}: TextoPropertiesProps) {
  useActiveEditorTick();
  const applyBlockPatch = (patch: Partial<TypographyValue>) => {
    const apply = (b: Block): Block =>
      b.tipo === 'texto' ? applyTypographyToTextBlock(b, patch) : b;
    if (isTypographySizeOnlyPatch(patch) && scheduleApply) {
      scheduleApply(apply);
      return;
    }
    clearDebounce?.();
    if (applyNow) {
      void applyNow(apply);
    } else if (onChange) {
      onChange(applyTypographyToTextBlock(block, patch));
    }
  };

  /** Cambio de nivel — reescala tamaño/peso/interlineado/tracking al nuevo nivel. */
  const handleHeadingLevelChange = (nivel?: HeadingLevel) => {
    const editor = activeEditor();
    if (editor) {
      applyHeadingLevelToSelection(editor, nivel);
    }
    // El bloque siempre se reescala (panel + render sin editor + tras el commit).
    const apply = (b: Block): Block =>
      b.tipo === 'texto' ? rescaleBlockForLevel(b, nivel) : b;
    clearDebounce?.();
    if (applyNow) void applyNow(apply);
    else if (onChange) onChange(rescaleBlockForLevel(block, nivel));
  };

  const handleTypographyChange = (patch: Partial<TypographyValue>) => {
    // Con `<RichTextEditor>` activo: con selección de rango, las claves de rango
    // (fuente, tamaño, color, peso, itálica, subrayado, tracking, alineación) van
    // como MARCAS sobre la selección; SIN selección van como estilo del NODO a
    // todo el documento (antes era no-op — Problema 6). El resto (interlineado,
    // transform, opacidad, fondo, lista…) es del bloque en ambos casos.
    const editor = activeEditor();
    if (editor) {
      const collapsed = editor.state.selection.empty;
      applyTypographyToSelection(editor, patch);
      // Coherencia del panel / post-commit: sin selección → todo al bloque; con
      // selección → solo las claves de bloque (las de rango viven en la marca).
      if (collapsed) applyBlockPatch(patch);
      else {
        const { block: blockPatch } = splitTypographyPatch(patch);
        if (Object.keys(blockPatch).length > 0) applyBlockPatch(blockPatch);
      }
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
      value={effectiveTypography(block)}
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
      curvatura={block.curvatura}
      onCurvaturaChange={(n) => {
        const apply = (b: Block): Block => {
          if (b.tipo !== 'texto') return b;
          if (n === undefined) {
            const rest = { ...b };
            delete rest.curvatura;
            return rest;
          }
          return { ...b, curvatura: n };
        };
        clearDebounce?.();
        if (applyNow) void applyNow(apply);
        else if (onChange) onChange(apply(block) as TextBlock);
      }}
      estiloTema={block.estiloTema}
      onEstiloTemaChange={(rol) => {
        const apply = (b: Block): Block => {
          if (b.tipo !== 'texto') return b;
          if (rol === undefined) {
            const rest = { ...b };
            delete rest.estiloTema;
            return rest;
          }
          return { ...b, estiloTema: rol };
        };
        clearDebounce?.();
        if (applyNow) void applyNow(apply);
        else if (onChange) onChange(apply(block) as TextBlock);
      }}
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
