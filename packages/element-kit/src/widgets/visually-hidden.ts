import type { CSSProperties } from 'react';

/**
 * Oculta un nodo de la vista pero lo deja para los lectores de pantalla (regiones
 * `aria-live`). Va en línea y no como clase `sr-only` de Tailwind para no depender
 * de que la hoja de estilos del host la incluya (el reproductor, las miniaturas y
 * los tests visuales no siempre la cargan).
 */
export const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
