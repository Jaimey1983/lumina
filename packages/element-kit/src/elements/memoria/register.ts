import type { ElementRegistry } from "@lumina/element-kit-core";
import { memoriaDefinition } from "./memoria-definition.js";

/** Registra Memoria en el catálogo único (Regla 2). */
export function registrarMemoria(
  registry: ElementRegistry<{ memoria: typeof memoriaDefinition }>,
): void {
  registry.registrar(memoriaDefinition);
}
