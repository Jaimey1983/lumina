import type { ProgresoWidget } from "lumina-frontend/widgets/progreso";

/** Estado del elemento Progreso (Barra) = el bloque de widget completo. */
export type ProgresoEstado = ProgresoWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` fija el porcentaje de modo slides — mismo contrato que `ProgresoViewer`.
 */
export interface ProgresoConfig {
  readonly isThumbnail?: boolean;
}

export const PROGRESO_TIPO = "progreso" as const;
