import type { ElementRegistry } from "../../registry.js";
import { emparejarDefinition } from "./emparejar-definition.js";

/** Registra emparejar en el catálogo único (Regla 2). */
export function registrarEmparejar(
  registry: ElementRegistry<{ emparejar: typeof emparejarDefinition }>,
): void {
  registry.registrar(emparejarDefinition);
}
