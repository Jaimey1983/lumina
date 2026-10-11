import { elementRegistry } from "@lumina/element-kit-core";
import { galeriaDefinition } from "./galeria-definition.js";

export function registrarGaleria(): void {
  elementRegistry.registrar(galeriaDefinition);
}
