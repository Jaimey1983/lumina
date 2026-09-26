import type { GraficoDatosBlock } from "../../blocks/grafico/index.js";

/** Estado del elemento Gráfico = el bloque de canvas completo. */
export type GraficoEstado = GraficoDatosBlock;

/**
 * Config de runtime (no es apariencia del panel).
 * G-scale.5: sin `isThumbnail` — la miniatura escala el mismo slide (VirtualSlideSurface).
 * `isSelected` / `onEnsureBlockSelected` los usa el Editor legacy para el anillo
 * de selección y el click-to-select del lienzo (E5.7).
 */
export interface GraficoConfig {
  readonly isSelected?: boolean;
  readonly onEnsureBlockSelected?: () => void;
}

export const GRAFICO_TIPO = "grafico" as const;
