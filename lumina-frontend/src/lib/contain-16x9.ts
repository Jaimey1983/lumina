/** Relación del lienzo virtual (1280×720). */
export const SLIDE_ASPECT = 16 / 9;

/**
 * Encaja un rectángulo 16:9 dentro de (availW × availH) sin recortar.
 *
 * No uses `aspect-video` + `w-full` + `max-h-full` a la vez: si `max-height`
 * gana, el `aspect-ratio` se ignora (ancho sigue al 100 %) y el preview se
 * estira en vertical — exactamente el “sello” sobre una tarjeta alta.
 */
export function contain16x9(
  availW: number,
  availH: number,
): { width: number; height: number } {
  if (!(availW > 0) || !(availH > 0)) {
    return { width: 0, height: 0 };
  }
  if (availW / availH > SLIDE_ASPECT) {
    return { width: availH * SLIDE_ASPECT, height: availH };
  }
  return { width: availW, height: availW / SLIDE_ASPECT };
}
