export { stepperDefinition, STEPPER_PRESETS, type StepperDefinition } from "./stepper-definition.js";
export { StepperEditor, StepperViewer, StepperPropiedades } from "./stepper-adapters.js";
export { STEPPER_TIPO, type StepperConfig, type StepperEstado } from "./stepper-types.js";
export { registrarStepper } from "./register.js";
export {
  DEFAULT_STEPPER_CONFIG,
  createDefaultStepperBlock,
  normalizeStepperWidget,
  type StepperConfiguracion,
  type StepperPaso,
} from "../../widgets/stepper/index.js";
