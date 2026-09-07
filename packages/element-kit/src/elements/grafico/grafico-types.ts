import type { GraficoDatosBlock } from "lumina-frontend/blocks/grafico";

/** Estado del elemento Gráfico = el bloque de canvas completo. */
export type GraficoEstado = GraficoDatosBlock;

/**
 * Config de runtime (no es apariencia del panel).
 * `isThumbnail` oculta el título — mismo contrato que `GraficoViewer`.
 * `isSelected` / `onEnsureBlockSelected` los usa el Editor legacy para el anillo
 * de selección y el click-to-select del lienzo (E5.7).
 */
export interface GraficoConfig {
  readonly isThumbnail?: boolean;
  readonly isSelected?: boolean;
  readonly onEnsureBlockSelected?: () => void;
}

export const GRAFICO_TIPO = "grafico" as const;
