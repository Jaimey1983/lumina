import type { CSSProperties } from 'react';

import type { TextAlign, TextBlock } from '@/types/slide.types';
import type { WidgetCampoEstilo } from '@/types/widget.types';

export type TypographyAlign = 'left' | 'center' | 'right' | 'justify';
export type TypographyTransform = 'none' | 'uppercase' | 'capitalize';
export type TypographyList = 'none' | 'disc' | 'decimal';

/** Modelo canónico del inspector tipográfico (panel derecho). */
export interface TypographyValue {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number | 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  underline?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
  align?: TypographyAlign;
  textTransform?: TypographyTransform;
  opacity?: number;
  shadow?: number;
  backgroundColor?: string;
  backgroundRadius?: number;
  list?: TypographyList;
}

/** Rango del inspector de texto de lienzo (px virtuales del slide 1280×720). */
export const TEXT_BLOCK_FONT_SIZE_MIN = 8;
export const TEXT_BLOCK_FONT_SIZE_MAX = 400;

const ALIGN_TO_BLOCK: Record<TypographyAlign, TextAlign> = {
  left: 'izquierda',
  center: 'centro',
  right: 'derecha',
  justify: 'justificado',
};

const ALIGN_FROM_BLOCK: Record<TextAlign, TypographyAlign> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
  justificado: 'justify',
};

const TRANSFORM_TO_BLOCK: Record<TypographyTransform, NonNullable<TextBlock['transformacion']>> = {
  none: 'ninguna',
  uppercase: 'mayusculas',
  capitalize: 'titulo',
};

const TRANSFORM_FROM_BLOCK: Record<
  NonNullable<TextBlock['transformacion']>,
  TypographyTransform
> = {
  ninguna: 'none',
  mayusculas: 'uppercase',
  titulo: 'capitalize',
};

const LIST_TO_BLOCK: Record<TypographyList, NonNullable<TextBlock['lista']>> = {
  none: 'ninguna',
  disc: 'vinetas',
  decimal: 'numeros',
};

const LIST_FROM_BLOCK: Record<NonNullable<TextBlock['lista']>, TypographyList> = {
  ninguna: 'none',
  vinetas: 'disc',
  numeros: 'decimal',
};

export function parseFontSizePx(raw?: string, fallback = 24): number {
  if (!raw?.trim()) return fallback;
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  if (!m) return fallback;
  const n = parseFloat(m[1]!);
  if (!Number.isFinite(n)) return fallback;
  if (/rem\s*$/i.test(raw.trim())) return Math.round(n * 16);
  return Math.round(n);
}

export function clampFontSize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Entero completo del input. Vacío o incompleto → null (aún no persistir). */
export function parseFontSizeDraft(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** Confirma el borrador: vacío/inválido vuelve al valor actual; si no, clampa. */
export function commitFontSizeDraft(
  raw: string,
  current: number,
  min: number,
  max: number,
): number {
  const parsed = parseFontSizeDraft(raw);
  if (parsed === null) return clampFontSize(current, min, max);
  return clampFontSize(parsed, min, max);
}

/** Valor listo para aplicar en vivo (flechas o número ya dentro del rango). */
export function liveFontSizeDraft(
  raw: string,
  min: number,
  max: number,
): number | null {
  const parsed = parseFontSizeDraft(raw);
  if (parsed === null || parsed < min || parsed > max) return null;
  return parsed;
}

export function isBoldWeight(weight?: number | 'normal' | 'bold'): boolean {
  return weight === 'bold' || weight === 700;
}

export function typographyFromTextBlock(block: TextBlock): TypographyValue {
  return {
    fontFamily: block.fuente,
    fontSize: parseFontSizePx(block.tamanoFuente, 24),
    color: block.color,
    fontWeight: block.negrita ? 'bold' : 'normal',
    fontStyle: block.cursiva ? 'italic' : 'normal',
    underline: !!block.subrayado,
    lineHeight: block.interlineado,
    letterSpacing: block.espaciadoLetras,
    align: block.alineacion ? ALIGN_FROM_BLOCK[block.alineacion] : undefined,
    textTransform: block.transformacion
      ? TRANSFORM_FROM_BLOCK[block.transformacion]
      : undefined,
    opacity: block.opacidad,
    shadow: block.sombra,
    backgroundColor: block.fondoTexto,
    backgroundRadius: block.radioFondo,
    list: block.lista ? LIST_FROM_BLOCK[block.lista] : undefined,
  };
}

export function textBlockPatchFromTypography(
  patch: Partial<TypographyValue>,
): Partial<TextBlock> {
  const out: Partial<TextBlock> = {};
  if (patch.fontFamily !== undefined) out.fuente = patch.fontFamily;
  if (patch.fontSize !== undefined) out.tamanoFuente = `${patch.fontSize}px`;
  if (patch.color !== undefined) out.color = patch.color;
  if (patch.fontWeight !== undefined) out.negrita = isBoldWeight(patch.fontWeight);
  if (patch.fontStyle !== undefined) out.cursiva = patch.fontStyle === 'italic';
  if (patch.underline !== undefined) out.subrayado = patch.underline;
  if (patch.lineHeight !== undefined) out.interlineado = patch.lineHeight;
  if (patch.letterSpacing !== undefined) out.espaciadoLetras = patch.letterSpacing;
  if (patch.align !== undefined) out.alineacion = ALIGN_TO_BLOCK[patch.align];
  if (patch.textTransform !== undefined) {
    out.transformacion = TRANSFORM_TO_BLOCK[patch.textTransform];
  }
  if (patch.opacity !== undefined) out.opacidad = patch.opacity;
  if (patch.shadow !== undefined) out.sombra = patch.shadow;
  if (patch.backgroundColor !== undefined) {
    out.fondoTexto = patch.backgroundColor || undefined;
  }
  if (patch.backgroundRadius !== undefined) out.radioFondo = patch.backgroundRadius;
  if (patch.list !== undefined) out.lista = LIST_TO_BLOCK[patch.list];
  return out;
}

export function typographyFromWidget(style: WidgetCampoEstilo): TypographyValue {
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    color: style.color,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    underline: style.underline,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    align: style.align,
    textTransform: style.textTransform,
    opacity: style.opacity,
    shadow: style.textShadow,
    backgroundColor: style.backgroundColor,
    backgroundRadius: style.borderRadius,
  };
}

export function widgetPatchFromTypography(
  patch: Partial<TypographyValue>,
): Partial<WidgetCampoEstilo> {
  const out: Partial<WidgetCampoEstilo> = {};
  if (patch.fontFamily !== undefined) out.fontFamily = patch.fontFamily;
  if (patch.fontSize !== undefined) out.fontSize = patch.fontSize;
  if (patch.color !== undefined) out.color = patch.color;
  if (patch.fontWeight !== undefined) out.fontWeight = patch.fontWeight;
  if (patch.fontStyle !== undefined) out.fontStyle = patch.fontStyle;
  if (patch.underline !== undefined) out.underline = patch.underline;
  if (patch.lineHeight !== undefined) out.lineHeight = patch.lineHeight;
  if (patch.letterSpacing !== undefined) out.letterSpacing = patch.letterSpacing;
  if (patch.align !== undefined) out.align = patch.align;
  if (patch.textTransform !== undefined) out.textTransform = patch.textTransform;
  if (patch.opacity !== undefined) out.opacity = patch.opacity;
  if (patch.shadow !== undefined) out.textShadow = patch.shadow;
  if (patch.backgroundColor !== undefined) {
    out.backgroundColor = patch.backgroundColor || undefined;
  }
  if (patch.backgroundRadius !== undefined) out.borderRadius = patch.backgroundRadius;
  return out;
}

export function typographyToCss(value: TypographyValue): CSSProperties {
  const out: CSSProperties = {};
  if (value.textTransform && value.textTransform !== 'none') {
    out.textTransform = value.textTransform;
  }
  if (value.opacity !== undefined) {
    out.opacity = Math.min(100, Math.max(0, value.opacity)) / 100;
  }
  if (value.shadow && value.shadow > 0) {
    out.textShadow = `0 1px ${value.shadow}px rgba(15, 23, 42, 0.35)`;
  }
  if (value.backgroundColor) {
    out.backgroundColor = value.backgroundColor;
    out.padding = '0.12em 0.4em';
    out.borderRadius = `${value.backgroundRadius ?? 6}px`;
    out.boxDecorationBreak = 'clone';
    out.WebkitBoxDecorationBreak = 'clone';
  }
  return out;
}

export function isTypographySizeOnlyPatch(patch: Partial<TypographyValue>): boolean {
  return patch.fontSize !== undefined && Object.keys(patch).length === 1;
}

export type TypographyPresetId = 'titulo' | 'cuerpo' | 'pie';

export const TYPOGRAPHY_PRESETS: Record<
  TypographyPresetId,
  { label: string; style: TypographyValue }
> = {
  titulo: {
    label: 'Título',
    style: {
      fontSize: 32,
      fontWeight: 'bold',
      fontStyle: 'normal',
      underline: false,
      lineHeight: 1.15,
      letterSpacing: -0.5,
      align: 'left',
    },
  },
  cuerpo: {
    label: 'Cuerpo',
    style: {
      fontSize: 18,
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      lineHeight: 1.45,
      letterSpacing: 0,
      align: 'left',
    },
  },
  pie: {
    label: 'Pie',
    style: {
      fontSize: 13,
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      lineHeight: 1.35,
      letterSpacing: 0.2,
      align: 'left',
    },
  },
};

export function applyTypographyPreset(
  id: TypographyPresetId,
  sizeMin: number,
  sizeMax: number,
): TypographyValue {
  const style = TYPOGRAPHY_PRESETS[id].style;
  const size = style.fontSize ?? sizeMin;
  return {
    ...style,
    fontSize: clampFontSize(size, sizeMin, sizeMax),
  };
}

export function matchTypographyPreset(
  value: TypographyValue,
  sizeMin: number,
  sizeMax: number,
): TypographyPresetId | null {
  const currentSize = value.fontSize;
  if (currentSize === undefined) return null;

  for (const id of Object.keys(TYPOGRAPHY_PRESETS) as TypographyPresetId[]) {
    const preset = applyTypographyPreset(id, sizeMin, sizeMax);
    if (preset.fontSize !== currentSize) continue;
    if (isBoldWeight(preset.fontWeight) !== isBoldWeight(value.fontWeight)) continue;
    if (Math.abs((preset.lineHeight ?? 0) - (value.lineHeight ?? preset.lineHeight ?? 0)) > 0.06) {
      continue;
    }
    return id;
  }
  return null;
}
