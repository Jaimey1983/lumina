import type { GraficoDatosBlock } from "lumina-frontend/blocks/grafico";

/** Estado del elemento Gráfico = el bloque de canvas completo. */
export type GraficoEstado = GraficoDatosBlock;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` oculta el título — mismo contrato que `GraficoViewer`.
 */
export interface GraficoConfig {
  readonly isThumbnail?: boolean;
}

export const GRAFICO_TIPO = "grafico" as const;
