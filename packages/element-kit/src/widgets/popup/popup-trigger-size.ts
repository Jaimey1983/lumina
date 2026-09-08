/** Lienzo de referencia del editor (16:9) — igual que SlideRenderer. */
export const POPUP_CANVAS_REF = { width: 1280, height: 720 } as const;

export const DEFAULT_POPUP_TRIGGER_PX = 48;

export const POPUP_TRIGGER_PX_MIN = 24;
export const POPUP_TRIGGER_PX_MAX = 160;

export function popupTriggerPctFromPx(pxW: number, pxH: number): { ancho: number; alto: number } {
  return {
    ancho: (pxW / POPUP_CANVAS_REF.width) * 100,
    alto: (pxH / POPUP_CANVAS_REF.height) * 100,
  };
}

export function popupTriggerPxFromPct(ancho: number, alto: number): { width: number; height: number } {
  return {
    width: Math.round((ancho / 100) * POPUP_CANVAS_REF.width),
    height: Math.round((alto / 100) * POPUP_CANVAS_REF.height),
  };
}

export function clampPopupTriggerPx(value: number): number {
  return Math.max(POPUP_TRIGGER_PX_MIN, Math.min(POPUP_TRIGGER_PX_MAX, Math.round(value)));
}
