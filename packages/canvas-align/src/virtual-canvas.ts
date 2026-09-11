// Fuente única del lienzo virtual — re-export de @lumina/editor-shared para no
// duplicar la constante (E7.6.5b la puso ahí; `lib/canvas-guides.ts` del
// frontend también la re-exporta).
export {
  VIRTUAL_CANVAS_WIDTH,
  VIRTUAL_CANVAS_HEIGHT,
} from '@lumina/editor-shared/virtual-canvas';

import {
  VIRTUAL_CANVAS_WIDTH,
  VIRTUAL_CANVAS_HEIGHT,
} from '@lumina/editor-shared/virtual-canvas';

/** px virtual del eje X → % del lienzo (0–100). */
export function virtualXToPercent(x: number): number {
  return (x / VIRTUAL_CANVAS_WIDTH) * 100;
}

/** px virtual del eje Y → % del lienzo (0–100). */
export function virtualYToPercent(y: number): number {
  return (y / VIRTUAL_CANVAS_HEIGHT) * 100;
}
