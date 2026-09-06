import type { ElementRegistry } from "@lumina/element-kit-core";
import { ruletaDefinition } from "./ruleta-definition.js";

/** Registra Ruleta en el catálogo único (Regla 2). */
export function registrarRuleta(
  registry: ElementRegistry<{ ruleta: typeof ruletaDefinition }>,
): void {
  registry.registrar(ruletaDefinition);
}
