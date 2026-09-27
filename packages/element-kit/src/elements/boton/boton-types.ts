import type { BotonWidget } from "../../widgets/boton/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/**
 * Estado del elemento Botón = el bloque de widget completo
 * (posición + contenido). Coincide con `BotonWidget` del frontend.
 */
export type BotonEstado = BotonWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva interacción — mismo contrato que `BotonViewer`.
 */
export type BotonConfig = WidgetCanvasConfig;

export const BOTON_TIPO = "boton" as const;
