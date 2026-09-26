import type { DiagramaBlock } from "../../blocks/diagrama/index.js";

/** Estado del elemento Diagrama = el bloque de canvas completo. */
export type DiagramaEstado = DiagramaBlock;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * G-scale.5: sin `isThumbnail` — miniatura escala el mismo diagrama.
 */
export interface DiagramaConfig {
  readonly isSelected?: boolean;
  /** El Editor legacy lo usa para el click-to-select del lienzo (E5.7). */
  readonly onEnsureBlockSelected?: () => void;
}

export const DIAGRAMA_TIPO = "diagrama" as const;
