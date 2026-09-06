import type { ElementRegistry } from "@lumina/element-kit-core";
import { emparejarDefinition } from "./emparejar-definition.js";

/** Registra emparejar en el catálogo único (Regla 2). */
export function registrarEmparejar(
  registry: ElementRegistry<{ emparejar: typeof emparejarDefinition }>,
): void {
  registry.registrar(emparejarDefinition);
}
