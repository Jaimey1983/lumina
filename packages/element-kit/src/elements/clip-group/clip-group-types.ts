import type { ReactNode } from "react";
import type { Block, ClipGroupBlock } from "../../blocks/clip-group/index.js";

/** Estado del elemento ClipGroup = el bloque de canvas completo. */
export type ClipGroupEstado = ClipGroupBlock;

/**
 * Config de runtime del elemento (no es apariencia del panel).
 * `isSelected`: si el bloque está seleccionado en el lienzo.
 * `innerEdit`: modo edición interna (doble clic para ajustar imagen de máscara).
 * G-scale.5: sin `isThumbnail` — miniatura escala el mismo clip (VirtualSlideSurface).
 */
export interface ClipGroupConfig {
  readonly isSelected?: boolean;
  readonly innerEdit?: boolean;
  readonly renderComposicion?: (bloques: Block[]) => ReactNode;
  /**
   * El canvas lo llama al pedir edición interna de la imagen de máscara
   * (doble clic). `undefined` = no editable (contenido no-imagen). E5.7.
   */
  readonly onEnterInnerEdit?: () => void;
}

export const CLIP_GROUP_TIPO = "clip-group" as const;
