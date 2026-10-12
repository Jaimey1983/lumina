import type { ElementRegistry } from "@lumina/element-kit-core";
import { torneoDefinition } from "./torneo-definition.js";

/** Registra Torneo en el catálogo único (Regla 2). */
export function registrarTorneo(
  registry: ElementRegistry<{ torneo: typeof torneoDefinition }>,
): void {
  registry.registrar(torneoDefinition);
}
