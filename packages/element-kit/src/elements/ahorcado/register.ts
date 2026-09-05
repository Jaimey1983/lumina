import type { ElementRegistry } from "../../registry.js";
import { ahorcadoDefinition } from "./ahorcado-definition.js";

/** Registra Ahorcado en el catálogo único (Regla 2). */
export function registrarAhorcado(
  registry: ElementRegistry<{ ahorcado: typeof ahorcadoDefinition }>,
): void {
  registry.registrar(ahorcadoDefinition);
}
