import type { ContadorWidget } from "../../widgets/contador/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/** Estado del elemento Contador = el bloque de widget completo. */
export type ContadorEstado = ContadorWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva el tick — mismo contrato que `ContadorViewer`.
 */
export type ContadorConfig = WidgetCanvasConfig;

export const CONTADOR_TIPO = "contador" as const;
