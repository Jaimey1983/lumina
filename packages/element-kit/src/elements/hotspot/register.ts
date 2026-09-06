import type { ElementRegistry } from "@lumina/element-kit-core";
import { hotspotDefinition } from "./hotspot-definition.js";

/** Registra Hotspot en el catálogo único (Regla 2). */
export function registrarHotspot(
  registry: ElementRegistry<{ hotspot: typeof hotspotDefinition }>,
): void {
  registry.registrar(hotspotDefinition);
}
