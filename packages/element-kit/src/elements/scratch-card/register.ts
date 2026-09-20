import { elementRegistry } from "@lumina/element-kit-core";
import { scratchCardDefinition } from "./scratch-card-definition.js";

export function registrarScratchCard(): void {
  elementRegistry.registrar(scratchCardDefinition);
}
