import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export { SELLO_TIPO, type SelloEstado } from "../../widgets/sello/sello-types.js";

/** El runtime entrega `estadoObjeto` (K3): de ahí sale «bloqueado / ganado». */
export type SelloConfig = WidgetCanvasConfig;
