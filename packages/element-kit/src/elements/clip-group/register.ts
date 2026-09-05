import type { ElementRegistry } from "../../registry.js";
import { clipGroupDefinition } from "./clip-group-definition.js";

export function registrarClipGroup(registry: ElementRegistry): void {
  registry.registrar(clipGroupDefinition);
}
