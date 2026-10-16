import { elementRegistry } from "@lumina/element-kit-core";
import { dibujoDefinition } from "./dibujo-definition.js";

export function registrarDibujo(): void {
  elementRegistry.registrar(dibujoDefinition);
}
