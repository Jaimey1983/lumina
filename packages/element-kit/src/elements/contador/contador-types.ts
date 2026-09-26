import type { ContadorWidget } from "../../widgets/contador/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/** Estado del elemento Contador = el bloque de widget completo. */
export type ContadorEstado = ContadorWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * G-scale.5: sin `isThumbnail` — miniatura escala el mismo widget (VirtualSlideSurface).
 */
export type ContadorConfig = WidgetCanvasConfig;

export const CONTADOR_TIPO = "contador" as const;
