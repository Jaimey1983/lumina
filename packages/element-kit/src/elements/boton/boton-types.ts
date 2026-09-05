import type { BotonWidget } from "lumina-frontend/widgets/boton";

/**
 * Estado del elemento Botón = el bloque de widget completo
 * (posición + contenido). Coincide con `BotonWidget` del frontend.
 */
export type BotonEstado = BotonWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva interacción — mismo contrato que `BotonViewer`.
 */
export interface BotonConfig {
  readonly isThumbnail?: boolean;
}

export const BOTON_TIPO = "boton" as const;
