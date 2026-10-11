import { elementRegistry } from "@lumina/element-kit-core";
import { stepperDefinition } from "./stepper-definition.js";

export function registrarStepper(): void {
  elementRegistry.registrar(stepperDefinition);
}
