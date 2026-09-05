import type { ElementRegistry } from "../../registry.js";
import { globosDefinition } from "./globos-definition.js";

/** Registra Globos en el catálogo único (Regla 2). */
export function registrarGlobos(
  registry: ElementRegistry<{ globos: typeof globosDefinition }>,
): void {
  registry.registrar(globosDefinition);
}
