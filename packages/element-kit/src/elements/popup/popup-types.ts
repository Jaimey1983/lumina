import type { PopupWidget } from "lumina-frontend/widgets/popup";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/** Estado del elemento Popup = el bloque de widget completo. */
export type PopupEstado = PopupWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva interacción / apertura automática — mismo contrato que `PopupViewer`.
 */
export type PopupConfig = WidgetCanvasConfig;

export const POPUP_TIPO = "popup" as const;
