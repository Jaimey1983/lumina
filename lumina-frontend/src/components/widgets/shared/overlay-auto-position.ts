import type { CSSProperties } from 'react';

export type OverlaySide = 'arriba' | 'abajo' | 'izquierda' | 'derecha';

/** Margen interior del 16:9 para no pegar la burbuja al recorte del viewer. */
export const OVERLAY_SLIDE_PAD_PX = 4;

export const HOTSPOT_OVERLAY_GAP_PX = 12;
export const TOOLTIP_OVERLAY_GAP_PX = 10;

export interface OverlayPlacement {
  side: OverlaySide;
  shiftX: number;
  shiftY: number;
}

export function overlayShiftVars(shiftX: number, shiftY: number): CSSProperties {
  return {
    ['--overlay-shift-x']: `${shiftX}px`,
    ['--overlay-shift-y']: `${shiftY}px`,
  } as CSSProperties;
}

/**
 * Elige el lado donde la burbuja cabe (prioridad: abajo → arriba → derecha → izquierda).
 * Si ningún lado alcanza, gana el de menos desborde (space − needed − gap).
 */
export function pickOverlaySide(input: {
  topSpace: number;
  bottomSpace: number;
  leftSpace: number;
  rightSpace: number;
  neededW: number;
  neededH: number;
  gap: number;
}): OverlaySide {
  const needH = input.neededH + input.gap;
  const needW = input.neededW + input.gap;
  if (input.bottomSpace >= needH) return 'abajo';
  if (input.topSpace >= needH) return 'arriba';
  if (input.rightSpace >= needW) return 'derecha';
  if (input.leftSpace >= needW) return 'izquierda';

  const ranked: [OverlaySide, number][] = [
    ['abajo', input.bottomSpace - needH],
    ['arriba', input.topSpace - needH],
    ['derecha', input.rightSpace - needW],
    ['izquierda', input.leftSpace - needW],
  ];
  ranked.sort((a, b) => b[1] - a[1]);
  return ranked[0]![0];
}

type Box = { left: number; top: number; right: number; bottom: number };

function axisShift(start: number, size: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return 0;
  if (size >= span) {
    return min + (span - size) / 2 - start;
  }
  if (start < min) return min - start;
  if (start + size > max) return max - size - start;
  return 0;
}

/**
 * Desplaza la burbuja en el eje ortogonal al lado elegido para que quede
 * dentro del slide (el recorte que ve el estudiante). No cambia de lado.
 */
export function shiftOverlayToFit(input: {
  side: OverlaySide;
  trigger: Box;
  bubbleW: number;
  bubbleH: number;
  slide: Box;
}): { x: number; y: number } {
  const { side, trigger, bubbleW, bubbleH, slide } = input;
  const minX = slide.left + OVERLAY_SLIDE_PAD_PX;
  const maxX = slide.right - OVERLAY_SLIDE_PAD_PX;
  const minY = slide.top + OVERLAY_SLIDE_PAD_PX;
  const maxY = slide.bottom - OVERLAY_SLIDE_PAD_PX;
  const cx = (trigger.left + trigger.right) / 2;
  const cy = (trigger.top + trigger.bottom) / 2;

  if (side === 'abajo' || side === 'arriba') {
    const left = cx - bubbleW / 2;
    return { x: Math.round(axisShift(left, bubbleW, minX, maxX)), y: 0 };
  }

  const top = cy - bubbleH / 2;
  return { x: 0, y: Math.round(axisShift(top, bubbleH, minY, maxY)) };
}
