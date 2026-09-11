/**
 * Etapa G · G2a — conmutador del motor de interacción del lienzo.
 *
 * `false` (default): el editor usa la ruta histórica (dnd-kit + `<ResizeHandles>`
 * + `snapLines` + `<SpacingIndicators>`). Byte-idéntico a antes de G2a.
 *
 * `true` (`NEXT_PUBLIC_CANVAS_MOVEABLE=1`): usa `<CanvasMoveable>` (react-moveable
 * + `@lumina/canvas-align`). Cableado pero SIN QA de zoom 25–400 % todavía — G2b
 * lo valida, conmuta el default y borra la ruta vieja.
 */
export const CANVAS_MOVEABLE_ENABLED =
  process.env.NEXT_PUBLIC_CANVAS_MOVEABLE === '1';
