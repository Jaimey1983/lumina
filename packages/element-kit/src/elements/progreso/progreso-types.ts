import type { ProgresoWidget } from "../../widgets/progreso/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/** Estado del elemento Progreso (Barra) = el bloque de widget completo. */
export type ProgresoEstado = ProgresoWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * G-scale.5: sin `isThumbnail` — miniatura escala el mismo widget (VirtualSlideSurface).
 */
export type ProgresoConfig = WidgetCanvasConfig;

export const PROGRESO_TIPO = "progreso" as const;
