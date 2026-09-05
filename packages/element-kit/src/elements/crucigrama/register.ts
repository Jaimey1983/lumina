import type { ElementRegistry } from "../../registry.js";
import { crucigramaDefinition } from "./crucigrama-definition.js";

/** Registra Crucigrama en el catálogo único (Regla 2). */
export function registrarCrucigrama(
  registry: ElementRegistry<{ crucigrama: typeof crucigramaDefinition }>,
): void {
  registry.registrar(crucigramaDefinition);
}
