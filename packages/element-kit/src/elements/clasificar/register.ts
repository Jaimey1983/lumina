import type { ElementRegistry } from "@lumina/element-kit-core";
import { clasificarDefinition } from "./clasificar-definition.js";

/** Registra Clasificar en el catálogo único (Regla 2). */
export function registrarClasificar(
  registry: ElementRegistry<{ clasificar: typeof clasificarDefinition }>,
): void {
  registry.registrar(clasificarDefinition);
}
