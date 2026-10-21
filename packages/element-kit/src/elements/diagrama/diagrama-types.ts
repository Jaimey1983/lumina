import type { ElementRuntimeConfig } from "@lumina/element-kit-core";
import type { DiagramaBlock } from "../../blocks/diagrama/index.js";

/** Estado del elemento Diagrama = el bloque de canvas completo. */
export type DiagramaEstado = DiagramaBlock;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` oculta el título — mismo contrato que `DiagramaViewer`.
 */
export interface DiagramaConfig {
  readonly isThumbnail?: boolean;
  readonly isSelected?: boolean;
  /** El Editor legacy lo usa para el click-to-select del lienzo (E5.7). */
  readonly onEnsureBlockSelected?: () => void;
  /** Motor de interacción (etapa K): el visor emite `clic` y, en un dibujo libre, `parte_clic` con el id del elemento. */
  readonly emitir?: ElementRuntimeConfig["emitir"];
}

export const DIAGRAMA_TIPO = "diagrama" as const;
