import type { ElementRegistry } from "../../registry.js";
import { ruletaDefinition } from "./ruleta-definition.js";

/** Registra Ruleta en el catálogo único (Regla 2). */
export function registrarRuleta(
  registry: ElementRegistry<{ ruleta: typeof ruletaDefinition }>,
): void {
  registry.registrar(ruletaDefinition);
}
