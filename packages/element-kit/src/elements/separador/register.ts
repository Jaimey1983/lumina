import { elementRegistry } from "@lumina/element-kit-core";
import { separadorDefinition } from "./separador-definition.js";

export function registrarSeparador(): void {
  elementRegistry.registrar(separadorDefinition);
}
