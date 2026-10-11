import type { CSSProperties } from 'react';

export type OverlaySide = 'arriba' | 'abajo' | 'izquierda' | 'derecha';

/** Margen interior del 16:9 para no pegar la burbuja al recorte del viewer. */
export const OVERLAY_SLIDE_PAD_PX = 4;

export const HOTSPOT_OVERLAY_GAP_PX = 12;
export const TOOLTIP_OVERLAY_GAP_PX = 10;

export interface OverlayPlacement {
  side: OverlaySide;
  /** Desplazamiento de la burbuja a lo largo del eje horizontal (lados arriba/abajo), en px del slide. */
  shiftX: number;
  /** Desplazamiento a lo largo del eje vertical (lados izquierda/derecha), en px del slide. */
  shiftY: number;
  /** Cuánto se corre la flecha en sentido contrario para seguir apuntando al disparador. */
  arrowShift: number;
}

/**
 * Variables CSS que leen las burbujas. `arrowShift` es opcional: sin él la flecha queda
 * centrada (el comportamiento de siempre).
 */
export function overlayShiftVars(shiftX: number, shiftY: number, arrowShift = 0): CSSProperties {
  return {
    ['--overlay-shift-x']: `${shiftX}px`,
    ['--overlay-shift-y']: `${shiftY}px`,
    ['--overlay-arrow-shift']: `${arrowShift}px`,
  } as CSSProperties;
}
