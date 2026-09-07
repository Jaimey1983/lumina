import { elementRegistry } from "@lumina/element-kit-core";
import { textoDefinition } from "./texto-definition.js";

export function registrarTexto(): void {
  elementRegistry.registrar(textoDefinition);
}
