import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export { GALERIA_TIPO, type GaleriaEstado } from "../../widgets/galeria/galeria-types.js";

/** La galería es de solo lectura: el runtime no le agrega nada. */
export type GaleriaConfig = WidgetCanvasConfig;
