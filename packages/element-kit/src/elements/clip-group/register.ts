import type { ElementRegistry } from "@lumina/element-kit-core";
import { clipGroupDefinition } from "./clip-group-definition.js";

export function registrarClipGroup(registry: ElementRegistry): void {
  registry.registrar(clipGroupDefinition);
}
