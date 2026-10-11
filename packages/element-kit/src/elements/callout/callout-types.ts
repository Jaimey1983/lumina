import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export { CALLOUT_TIPO, type CalloutEstado } from "../../widgets/callout/callout-types.js";

/** Callout es de solo lectura: el runtime no le agrega nada. */
export type CalloutConfig = WidgetCanvasConfig;
