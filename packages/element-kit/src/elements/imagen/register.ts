import { elementRegistry } from "@lumina/element-kit-core";
import { imagenDefinition } from "./imagen-definition.js";

export function registrarImagen(): void {
  elementRegistry.registrar(imagenDefinition);
}
