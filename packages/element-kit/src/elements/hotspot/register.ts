import type { ElementRegistry } from "../../registry.js";
import { hotspotDefinition } from "./hotspot-definition.js";

/** Registra Hotspot en el catálogo único (Regla 2). */
export function registrarHotspot(
  registry: ElementRegistry<{ hotspot: typeof hotspotDefinition }>,
): void {
  registry.registrar(hotspotDefinition);
}
