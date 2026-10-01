import { elementRegistry } from "@lumina/element-kit-core";
import { ecuacionDefinition } from "./ecuacion-definition.js";

export function registrarEcuacion(): void {
  elementRegistry.registrar(ecuacionDefinition);
}
