import { elementRegistry } from "@lumina/element-kit-core";
import { codigoDefinition } from "./codigo-definition.js";

export function registrarCodigo(): void {
  elementRegistry.registrar(codigoDefinition);
}
