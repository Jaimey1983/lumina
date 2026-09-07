import { elementRegistry } from "@lumina/element-kit-core";
import { citaDefinition } from "./cita-definition.js";

export function registrarCita(): void {
  elementRegistry.registrar(citaDefinition);
}
