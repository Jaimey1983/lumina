import type { ContadorWidget } from "lumina-frontend/widgets/contador";

/** Estado del elemento Contador = el bloque de widget completo. */
export type ContadorEstado = ContadorWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva el tick — mismo contrato que `ContadorViewer`.
 */
export interface ContadorConfig {
  readonly isThumbnail?: boolean;
}

export const CONTADOR_TIPO = "contador" as const;
