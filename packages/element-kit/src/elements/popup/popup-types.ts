import type { PopupWidget } from "../../widgets/popup/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/** Estado del elemento Popup = el bloque de widget completo. */
export type PopupEstado = PopupWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * G-scale.5: sin `isThumbnail` — miniatura escala el mismo widget (VirtualSlideSurface).
 */
export type PopupConfig = WidgetCanvasConfig;

export const POPUP_TIPO = "popup" as const;
