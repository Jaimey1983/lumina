import type { Animacion } from '@lumina/types/animation';

/**
 * Presets de movimiento de los widgets (T5, DT4). Son datos puros: el componente
 * `WidgetMotion` los traduce a `motion`. Un widget nunca importa `motion` directo.
 */

/** Variantes de entrada: estado inicial oculto → estado final visible. */
export const ENTRADA_VARIANTES = {
  fade: { oculto: { opacity: 0 }, visible: { opacity: 1 } },
  'slide-up': { oculto: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } },
  'slide-down': { oculto: { opacity: 0, y: -12 }, visible: { opacity: 1, y: 0 } },
  'slide-left': { oculto: { opacity: 0, x: 16 }, visible: { opacity: 1, x: 0 } },
  'slide-right': { oculto: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } },
  scale: { oculto: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
} as const;

export type EntradaVariante = keyof typeof ENTRADA_VARIANTES;

/** Curva y duraciones: las mismas que los tokens `--lw-ease` / `--lw-motion-*`. */
export const MOTION_EASE = [0.16, 1, 0.3, 1] as const;
export const MOTION_DURACION = { fast: 0.15, base: 0.25, slow: 0.4 } as const;

export const ENTRADA_TRANSICION = { duration: MOTION_DURACION.slow, ease: MOTION_EASE } as const;

/** Microinteracciones de puntero. */
export const PRESS = { scale: 0.97 } as const;
export const HOVER = { y: -2, scale: 1.01 } as const;
export const INTERACCION_TRANSICION = { duration: MOTION_DURACION.fast, ease: MOTION_EASE } as const;

/** Pulso de éxito (se dispara al cambiar el contador `exito`). */
export const EXITO_KEYFRAMES: { scale: number[] } = { scale: [1, 1.08, 1] };
export const EXITO_TRANSICION = { duration: MOTION_DURACION.base * 1.6, ease: MOTION_EASE } as const;

/** Duración del conteo animado de números, en segundos. */
export const CONTEO_DURACION = 0.6;

/**
 * Si el docente ya configuró una animación de **entrada** en el panel de
 * animaciones del bloque (`Block.animaciones`), esa manda: la entrada por
 * defecto del widget se apaga para que no se apliquen dos. Las de énfasis y
 * salida no la tocan.
 */
export function entradaPorDefectoApagada(animaciones: readonly Animacion[] | undefined): boolean {
  return animaciones?.some((a) => a.momento === 'entrada') ?? false;
}
