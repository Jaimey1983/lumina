'use client';

import { useReducedMotion } from 'motion/react';

/**
 * ÚNICO punto donde se decide «reducir movimiento» (T5): `WidgetMotion`,
 * `useConteo` y `useExito` lo consultan; ningún widget tiene que repetirlo.
 * Sin `window` (servidor) devuelve `false`.
 */
export function useWidgetReducedMotion(): boolean {
  return useReducedMotion() === true;
}

/** Versión no-hook, para código imperativo (p. ej. animaciones con `element.animate`). */
export function prefiereMovimientoReducido(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}
