import type { DiagramaBlock } from "lumina-frontend/blocks/diagrama";

/** Estado del elemento Diagrama = el bloque de canvas completo. */
export type DiagramaEstado = DiagramaBlock;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` oculta el título — mismo contrato que `DiagramaViewer`.
 */
export interface DiagramaConfig {
  readonly isThumbnail?: boolean;
  readonly isSelected?: boolean;
}

export const DIAGRAMA_TIPO = "diagrama" as const;
