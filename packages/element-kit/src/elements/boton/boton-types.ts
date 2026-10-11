import type { BotonWidgetT8 } from "../../widgets/boton/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/**
 * Estado del elemento Botón = el bloque de widget completo
 * (posición + contenido). Es `BotonWidget` del frontend más las opciones de T8
 * (estilo, icono, carga, densidad, descarga).
 */
export type BotonEstado = BotonWidgetT8;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva interacción — mismo contrato que `BotonViewer`.
 */
export type BotonConfig = WidgetCanvasConfig;

export const BOTON_TIPO = "boton" as const;
