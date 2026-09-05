import type { PopupWidget } from "lumina-frontend/widgets/popup";

/** Estado del elemento Popup = el bloque de widget completo. */
export type PopupEstado = PopupWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva interacción / apertura automática — mismo contrato que `PopupViewer`.
 */
export interface PopupConfig {
  readonly isThumbnail?: boolean;
}

export const POPUP_TIPO = "popup" as const;
