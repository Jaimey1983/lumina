import type { CSSProperties } from 'react';
import type { TextBlock } from '@lumina/types/slide';

/** Modelo del panel «Caja» del inspector de texto. */
export interface TextBoxValue {
  relleno?: number;
  alineacionVertical?: 'arriba' | 'centro' | 'abajo';
  bordeColor?: string;
  bordeGrosor?: number;
  bordeRadio?: number;
  sombraColor?: string;
  sombraDesenfoque?: number;
  sombraX?: number;
  sombraY?: number;
  columnas?: number;
  columnasBrecha?: number;
  medidaMax?: number;
  fondoTextoOpacidad?: number;
  contornoColor?: string;
  contornoGrosor?: number;
  degradadoDesde?: string;
  degradadoHasta?: string;
  degradadoAngulo?: number;
}

export function textBoxValueFromBlock(block: TextBlock): TextBoxValue {
  return {
    relleno: block.relleno,
    alineacionVertical: block.alineacionVertical,
    bordeColor: block.borde?.color,
    bordeGrosor: block.borde?.grosor,
    bordeRadio: block.borde?.radio,
    sombraColor: block.sombraCaja?.color,
    sombraDesenfoque: block.sombraCaja?.desenfoque,
    sombraX: block.sombraCaja?.x,
    sombraY: block.sombraCaja?.y,
    columnas: block.columnas,
    columnasBrecha: block.columnasBrecha,
    medidaMax: block.medidaMax,
    fondoTextoOpacidad: block.fondoTextoOpacidad,
    contornoColor: block.contorno?.color,
    contornoGrosor: block.contorno?.grosor,
    degradadoDesde: block.degradado?.desde,
    degradadoHasta: block.degradado?.hasta,
    degradadoAngulo: block.degradado?.angulo,
  };
}

/** Aplica un patch del panel «Caja» a un `TextBlock` (fusiona `borde` / `sombraCaja`). */
export function applyTextBoxPatch(block: TextBlock, patch: Partial<TextBoxValue>): TextBlock {
  const next: TextBlock = { ...block };
  if ('relleno' in patch) next.relleno = patch.relleno;
  if ('alineacionVertical' in patch) next.alineacionVertical = patch.alineacionVertical;
  if ('columnas' in patch) next.columnas = patch.columnas;
  if ('columnasBrecha' in patch) next.columnasBrecha = patch.columnasBrecha;
  if ('medidaMax' in patch) next.medidaMax = patch.medidaMax;
  if ('fondoTextoOpacidad' in patch) next.fondoTextoOpacidad = patch.fondoTextoOpacidad;
  if ('bordeColor' in patch || 'bordeGrosor' in patch || 'bordeRadio' in patch) {
    next.borde = {
      ...block.borde,
      ...('bordeColor' in patch ? { color: patch.bordeColor } : {}),
      ...('bordeGrosor' in patch ? { grosor: patch.bordeGrosor } : {}),
      ...('bordeRadio' in patch ? { radio: patch.bordeRadio } : {}),
    };
  }
  if (
    'sombraColor' in patch ||
    'sombraDesenfoque' in patch ||
    'sombraX' in patch ||
    'sombraY' in patch
  ) {
    next.sombraCaja = {
      ...block.sombraCaja,
      ...('sombraColor' in patch ? { color: patch.sombraColor } : {}),
      ...('sombraDesenfoque' in patch ? { desenfoque: patch.sombraDesenfoque } : {}),
      ...('sombraX' in patch ? { x: patch.sombraX } : {}),
      ...('sombraY' in patch ? { y: patch.sombraY } : {}),
    };
  }
  if ('contornoColor' in patch || 'contornoGrosor' in patch) {
    const merged = {
      ...block.contorno,
      ...('contornoColor' in patch ? { color: patch.contornoColor } : {}),
      ...('contornoGrosor' in patch ? { grosor: patch.contornoGrosor } : {}),
    };
    if (merged.color || merged.grosor) next.contorno = merged;
    else delete next.contorno;
  }
  if ('degradadoDesde' in patch || 'degradadoHasta' in patch || 'degradadoAngulo' in patch) {
    // El toggle apaga el degradado poniendo `degradadoDesde`/`degradadoHasta` a undefined.
    if (
      ('degradadoDesde' in patch && patch.degradadoDesde === undefined) ||
      ('degradadoHasta' in patch && patch.degradadoHasta === undefined)
    ) {
      delete next.degradado;
    } else {
      const angulo = patch.degradadoAngulo ?? block.degradado?.angulo;
      next.degradado = {
        desde: patch.degradadoDesde ?? block.degradado?.desde ?? '#6366f1',
        hasta: patch.degradadoHasta ?? block.degradado?.hasta ?? '#ec4899',
        ...(angulo !== undefined ? { angulo } : {}),
      };
    }
  }
  return next;
}

/** Estilo del ELEMENTO de texto para contorno/stroke y degradado (`background-clip: text`). */
export function textBlockDecorCss(block: TextBlock): CSSProperties {
  const out: CSSProperties = {};
  if (block.contorno && (block.contorno.color || block.contorno.grosor)) {
    out.WebkitTextStroke = `${block.contorno.grosor ?? 1}px ${block.contorno.color ?? '#000000'}`;
  }
  if (block.degradado?.desde && block.degradado?.hasta) {
    out.backgroundImage = `linear-gradient(${block.degradado.angulo ?? 90}deg, ${block.degradado.desde}, ${block.degradado.hasta})`;
    out.WebkitBackgroundClip = 'text';
    out.backgroundClip = 'text';
    out.color = 'transparent';
  }
  return out;
}

/** `#rrggbb` + opacidad 0–100 → `rgba(...)`; otros formatos pasan tal cual. */
export function hexWithOpacity(color: string, opacityPct: number): string {
  const m = color.trim().match(/^#?([0-9a-f]{6})$/i);
  const a = Math.min(1, Math.max(0, opacityPct / 100));
  if (!m) return color;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const V_ALIGN: Record<string, CSSProperties['justifyContent']> = {
  arriba: 'flex-start',
  centro: 'center',
  abajo: 'flex-end',
};

/**
 * Estilo de la CAJA del bloque de texto (relleno, borde, sombra de caja,
 * alineación vertical). `null` si el bloque no define nada de caja → `RenderText`
 * no añade envoltorio y el DOM es idéntico al de antes.
 */
export function textBlockBoxCss(block: TextBlock): CSSProperties | null {
  const { relleno, alineacionVertical, borde, sombraCaja } = block;
  const hasBorder = borde && (borde.color || borde.grosor || borde.radio);
  const hasShadow =
    sombraCaja &&
    (sombraCaja.desenfoque || sombraCaja.x || sombraCaja.y || sombraCaja.color);
  if (
    relleno === undefined &&
    alineacionVertical === undefined &&
    !hasBorder &&
    !hasShadow
  ) {
    return null;
  }

  const out: CSSProperties = { boxSizing: 'border-box', height: '100%', width: '100%' };
  if (relleno !== undefined) out.padding = `${relleno}px`;
  if (hasBorder) {
    out.border = `${borde!.grosor ?? 1}px solid ${borde!.color ?? '#000000'}`;
    if (borde!.radio !== undefined) out.borderRadius = `${borde!.radio}px`;
  }
  if (hasShadow) {
    out.boxShadow = `${sombraCaja!.x ?? 0}px ${sombraCaja!.y ?? 2}px ${
      sombraCaja!.desenfoque ?? 8
    }px ${sombraCaja!.color ?? 'rgba(15,23,42,0.25)'}`;
  }
  if (alineacionVertical) {
    out.display = 'flex';
    out.flexDirection = 'column';
    out.justifyContent = V_ALIGN[alineacionVertical] ?? 'flex-start';
  }
  return out;
}

/** Columnas de texto y ancho máximo de línea (aplican al ELEMENTO de texto). */
export function textBlockColumnsCss(block: TextBlock): CSSProperties {
  const out: CSSProperties = {};
  if (block.columnas && block.columnas >= 2) {
    out.columnCount = Math.min(3, Math.round(block.columnas));
    out.columnGap = `${block.columnasBrecha ?? 24}px`;
  }
  if (block.medidaMax && block.medidaMax > 0) {
    out.maxWidth = `${block.medidaMax}ch`;
    const a = block.alineacion;
    out.marginInline = a === 'centro' ? 'auto' : a === 'derecha' ? 'auto 0' : undefined;
  }
  return out;
}
