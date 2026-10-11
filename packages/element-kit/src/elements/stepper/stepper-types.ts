import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export { STEPPER_TIPO, type StepperEstado } from "../../widgets/stepper/stepper-types.js";

/** El runtime entrega `emitir` y `estadoObjeto` (K3): el Stepper avisa `visitado` al completarse. */
export type StepperConfig = WidgetCanvasConfig;
