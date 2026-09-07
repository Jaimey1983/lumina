import { elementRegistry } from "@lumina/element-kit-core";
import { columnasDefinition } from "./columnas-definition.js";

export function registrarColumnas(): void {
  elementRegistry.registrar(columnasDefinition);
}
